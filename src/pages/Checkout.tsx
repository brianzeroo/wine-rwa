import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CartItem, Order } from '../types';
import { ChevronLeft, Smartphone, CreditCard, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DiscountCode from '../components/DiscountCode';
import { getDiscountCodeByCode, incrementDiscountCodeUsage } from '../api/discountCodes';
import { getCustomerByEmail, createCustomer, updateCustomer, addCustomerLoyaltyPoints } from '../api/customers';

interface CheckoutProps {
  items: CartItem[];
  onClearCart: () => void;
  onCreateOrder: (orderData: Omit<Order, 'id' | 'date' | 'status'>) => Promise<void>;
  currentUser?: { id: string; phone: string; name: string } | null;
  onLoginPrompt?: () => void;
}

export default function Checkout({ items, onClearCart, onCreateOrder, currentUser, onLoginPrompt }: CheckoutProps) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '');
  const [customerName, setCustomerName] = useState(
    currentUser?.name && currentUser.name !== 'User' ? currentUser.name : ''
  );
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Auto-fill from currentUser
  React.useEffect(() => {
    if (currentUser) {
      if (!phoneNumber) setPhoneNumber(currentUser.phone);
      if (!customerName && currentUser.name !== 'User') setCustomerName(currentUser.name);
      // Don't auto-fill placeholder email
    }
  }, [currentUser]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Tax is removed as requested
  const totalWithoutDiscount = subtotal;
  const finalTotal = totalWithoutDiscount - discountAmount;

  const [discountId, setDiscountId] = useState<string | null>(null);

  const handleApplyDiscount = async (code: string) => {
    try {
      const discountData = await getDiscountCodeByCode(code);
      if (discountData) {
        // Validation
        const minAmount = Number(discountData.minOrderAmount) || 0;
        if (minAmount > 0 && subtotal < minAmount) {
          alert(`This code requires a minimum order of RWF ${minAmount.toLocaleString()}`);
          return;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startDate = discountData.startDate ? new Date(discountData.startDate) : null;
        const start = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime() : 0;
        const endDate = discountData.endDate ? new Date(discountData.endDate) : null;
        const end = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime() : Infinity;

        if (start && today < start) {
          alert('This discount code is not yet active');
          return;
        }

        if (today > end) {
          alert('This discount code has expired');
          return;
        }
        if (discountData.usageLimit > 0 && (discountData.usedCount || 0) >= discountData.usageLimit) {
          alert('This discount code has reached its usage limit');
          return;
        }

        // Calculate discount amount based on type
        let calculatedDiscount = 0;
        if (discountData.type === 'percentage') {
          calculatedDiscount = (subtotal * discountData.value) / 100;
        } else if (discountData.type === 'fixed') {
          calculatedDiscount = Math.min(discountData.value, subtotal);
        }

        setDiscountAmount(calculatedDiscount);
        setAppliedDiscountCode(code);
        setDiscountId(discountData.id);
      } else {
        alert('Invalid discount code');
      }
    } catch (err) {
      console.error('Error applying discount code', err);
      alert('Error validating discount code');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscountCode(null);
    setDiscountAmount(0);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod || !phoneNumber || !customerName || !customerEmail) return;

    setIsProcessing(true);

    // Create or Update customer
    try {
      let customer = await getCustomerByEmail(customerEmail);
      let customerId = null;

      if (customer) {
        customerId = customer.id;
        // Update customer details with what's in the form
        await updateCustomer(customerId, {
          name: customerName,
          address: shippingAddress,
          phone: phoneNumber
        });
      } else {
        // Create new customer
        const newCustomer = await createCustomer({
          name: customerName,
          email: customerEmail,
          phone: phoneNumber,
          address: shippingAddress,
          loyaltyPoints: 0
        });
        customerId = newCustomer.id;
      }

      // Secure Order Initiation
      const checkoutResponse = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerId,
          customerName,
          customerPhone: phoneNumber,
          customerEmail,
          shippingAddress,
          notes,
          paymentMethod,
          discountCode: appliedDiscountCode
        })
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.error || 'Payment initiation failed');
      }

      const checkoutData = await checkoutResponse.json();
      const transactionId = checkoutData.transactionId;
      const orderId = checkoutData.orderId;

      // Wait for payment confirmation (polling status just for UI)
      let paymentComplete = false;
      let attempts = 0;
      const maxAttempts = 45; // 45 seconds timeout

      while (!paymentComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second

        const statusResponse = await fetch(`/api/paypack/status/${transactionId}`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.status === 'successful' || statusData.status === 'completed' || statusData.status === 'Paid') {
            paymentComplete = true;
            break;
          } else if (statusData.status === 'failed' || statusData.status === 'cancelled') {
            throw new Error('Payment was declined or cancelled. Please try again.');
          }
        }
        attempts++;
      }

      if (!paymentComplete) {
        throw new Error('Payment timeout. Your order is pending. Check your dashboard later.');
      }

      // We no longer call onCreateOrder() here because the server creates it reliably via Webhook!
      // The server also handles incrementing discount code usage and loyalty points securely!

      // Clear the cart
      onClearCart();

      alert('Payment successful! Your order has been placed.');
      setIsProcessing(false);
      navigate('/track-order');
    } catch (error: any) {
      console.error('Payment processing error:', error);
      alert(error.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-40 text-center space-y-6">
        <h2 className="text-3xl font-serif text-white">Your cart is empty</h2>
        <Link to="/" className="inline-block text-gold uppercase tracking-widest text-sm hover:underline">
          Return to Store
        </Link>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen pt-40 px-4">
        <div className="max-w-md mx-auto bg-surface rounded-3xl p-12 border border-white/10 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
            <Smartphone className="text-gold" size={32} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-serif text-white">Sign in to Checkout</h2>
            <p className="text-white/60 text-lg leading-relaxed">
              We need your phone number to coordinate delivery and track your orders.
            </p>
          </div>
          <button
            onClick={onLoginPrompt}
            className="w-full py-5 bg-gold text-dark font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-gold/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gold/20"
          >
            Login / Create Account
          </button>
          <div className="pt-4">
            <Link to="/" className="text-white/40 hover:text-white transition-colors uppercase tracking-widest text-[10px]">
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link to="/" className="inline-flex items-center text-white/40 hover:text-gold transition-colors mb-8 group">
        <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        <span className="uppercase tracking-widest text-xs">Back to collection</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Checkout Form */}
        <div className="lg:col-span-7 space-y-12">
          <section className="space-y-6">
            <h2 className="text-3xl font-serif text-white">Checkout</h2>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white/40 font-medium">Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mtn')}
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center space-y-3 ${paymentMethod === 'mtn' ? 'border-gold bg-gold/5' : 'border-white/5 bg-surface hover:border-white/20'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === 'mtn' ? 'bg-gold text-dark' : 'bg-white/5 text-white/40'}`}>
                    <Smartphone size={24} />
                  </div>
                  <span className={`text-sm font-medium ${paymentMethod === 'mtn' ? 'text-gold' : 'text-white/60'}`}>MTN MoMo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('airtel')}
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center space-y-3 ${paymentMethod === 'airtel' ? 'border-gold bg-gold/5' : 'border-white/5 bg-surface hover:border-white/20'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === 'airtel' ? 'bg-gold text-dark' : 'bg-white/5 text-white/40'}`}>
                    <Smartphone size={24} />
                  </div>
                  <span className={`text-sm font-medium ${paymentMethod === 'airtel' ? 'text-gold' : 'text-white/60'}`}>Airtel Money</span>
                </button>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/40 font-medium">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Brian Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-6 py-4 bg-surface border border-white/5 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/40 font-medium">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. brian@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-surface border border-white/5 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/40 font-medium">Phone Number</label>
                <input
                  required
                  type="tel"
                  placeholder="e.g. 078XXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-6 py-4 bg-surface border border-white/5 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/40 font-medium">Shipping Address (Optional)</label>
                <textarea
                  placeholder="Enter your shipping address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-6 py-4 bg-surface border border-white/5 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-all resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/40 font-medium">Order Notes (Optional)</label>
                <textarea
                  placeholder="Special instructions, gift message, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-6 py-4 bg-surface border border-white/5 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-all resize-none"
                  rows={3}
                />
              </div>

              <div className="p-4 bg-white/5 rounded-xl flex items-start space-x-3">
                <ShieldCheck className="text-gold mt-0.5" size={20} />
                <p className="text-xs text-white/40 leading-relaxed">
                  Your transaction is secured by PayPack. You will receive a prompt on your phone to authorize the payment.
                </p>
              </div>

              <button
                disabled={!paymentMethod || !phoneNumber || !customerName || !customerEmail || isProcessing}
                className="w-full py-5 bg-gold text-dark font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center space-x-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay RWF {finalTotal.toLocaleString()}</span>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="glass rounded-3xl p-8 sticky top-32 space-y-8">
            <h3 className="text-xl font-serif text-white">Order Summary</h3>

            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-dark rounded-lg overflow-hidden border border-white/5">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm text-white/90 font-medium">{item.name}</p>
                      <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm text-white/80">RWF {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Discount Code Section */}
            <div className="space-y-3">
              <h4 className="text-sm uppercase tracking-widest text-white/40 font-medium">Discount Code</h4>
              <DiscountCode
                onApply={handleApplyDiscount}
                onRemove={handleRemoveDiscount}
                appliedCode={appliedDiscountCode}
                discountAmount={discountAmount}
                subtotal={subtotal}
              />
            </div>

            <div className="space-y-3 pt-6 border-t border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Subtotal</span>
                <span className="text-white/80">RWF {subtotal.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Discount ({appliedDiscountCode})</span>
                  <span className="text-green-400">-RWF {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-xl font-serif pt-3 border-t border-white/5">
                <span className="text-white">Total</span>
                <span className="text-gold">RWF {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
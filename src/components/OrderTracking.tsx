import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Search, ChevronRight, CheckCircle, Clock, Truck } from 'lucide-react';
import { Order } from '../types';

interface OrderTrackingProps {
  orders: Order[];
}

export default function OrderTracking({ orders }: OrderTrackingProps) {
  const [orderId, setOrderId] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!orderId.trim()) {
      setError('Please enter your order ID');
      return;
    }

    const order = orders.find(o => o.id === orderId.toUpperCase());
    
    if (order) {
      setFoundOrder(order);
    } else {
      setError('Order not found. Please check your order ID.');
      setFoundOrder(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock size={20} />;
      case 'Processing':
        return <Package size={20} />;
      case 'Shipped':
      case 'Delivered':
        return <Truck size={20} />;
      case 'Completed':
        return <CheckCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'Processing':
        return 'text-blue-400 bg-blue-500/10';
      case 'Shipped':
      case 'Delivered':
        return 'text-purple-400 bg-purple-500/10';
      case 'Completed':
        return 'text-green-400 bg-green-500/10';
      default:
        return 'text-white/60 bg-white/5';
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { status: 'Pending', label: 'Order Placed' },
      { status: 'Processing', label: 'Preparing' },
      { status: 'Shipped', label: 'On the Way' },
      { status: 'Delivered', label: 'Delivered' }
    ];

    const currentStepIndex = steps.findIndex(step => 
      step.status === foundOrder?.status || 
      (foundOrder?.status === 'Completed' && step.status === 'Delivered')
    );

    return (
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10"></div>
        <div 
          className="absolute top-4 left-0 h-0.5 bg-gold transition-all duration-500"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div key={step.status} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  index <= currentStepIndex
                    ? 'bg-gold border-gold text-dark'
                    : 'bg-dark border-white/30 text-white/40'
                }`}
              >
                {getStatusIcon(step.status)}
              </div>
              <span className={`text-xs mt-2 ${
                index <= currentStepIndex ? 'text-gold' : 'text-white/40'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Track Order Form */}
      <form onSubmit={handleTrackOrder} className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
            placeholder="Enter Order ID (e.g., ORD-XXXXX)"
            className="flex-1 px-6 py-4 bg-surface border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 uppercase tracking-wider"
          />
          <button
            type="submit"
            className="px-8 py-4 bg-gold text-dark font-bold rounded-2xl hover:bg-gold/90 transition-colors flex items-center space-x-2"
          >
            <Search size={20} />
            <span>Track</span>
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {/* Order Details */}
      {foundOrder && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-3xl p-8 space-y-6"
        >
          {/* Order Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-serif text-white mb-2">Order {foundOrder.id}</h3>
              <p className="text-white/60 text-sm">
                Placed on {new Date(foundOrder.date).toLocaleDateString()}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${getStatusColor(foundOrder.status)}`}>
              {getStatusIcon(foundOrder.status)}
              <span className="font-medium">{foundOrder.status}</span>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="py-8">
            {getProgressSteps()}
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div>
              <p className="text-white/60 text-sm mb-1">Customer</p>
              <p className="text-white font-medium">{foundOrder.customerName}</p>
              <p className="text-white/60 text-sm">{foundOrder.customerPhone}</p>
              {foundOrder.customerEmail && (
                <p className="text-white/60 text-sm">{foundOrder.customerEmail}</p>
              )}
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Payment</p>
              <p className="text-white font-medium capitalize">{foundOrder.paymentMethod}</p>
              <p className="text-white/60 text-sm">Total: RWF {foundOrder.finalTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="pt-6 border-t border-white/10">
            <h4 className="text-lg font-serif text-white mb-4">Items</h4>
            <div className="space-y-3">
              {foundOrder.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-16 h-16 bg-dark rounded-lg overflow-hidden border border-white/5">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-white/60 text-sm">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold font-medium">RWF {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {foundOrder.shippingAddress && (
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-lg font-serif text-white mb-2">Shipping Address</h4>
              <p className="text-white/80">{foundOrder.shippingAddress}</p>
            </div>
          )}

          {/* Notes */}
          {foundOrder.notes && (
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-lg font-serif text-white mb-2">Order Notes</h4>
              <p className="text-white/80 italic">{foundOrder.notes}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
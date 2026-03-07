import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ChevronLeft,
  LogOut,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Award
} from 'lucide-react';
import { Order, Customer } from '../types';

interface DashboardProps {
  user: { id: string; phone: string; name: string };
  onLogout: () => void;
  orders: Order[];
  customer: Customer | null;
}

export default function UserDashboard({ user, onLogout, orders, customer }: DashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter orders for this customer
  const userOrders = orders.filter(order =>
    order.customerPhone === user.phone ||
    (customer && order.customerId === customer.id)
  );

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    onLogout();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'Processing': return 'text-blue-400 bg-blue-500/10';
      case 'Shipped':
      case 'Delivered': return 'text-purple-400 bg-purple-500/10';
      case 'Completed': return 'text-green-400 bg-green-500/10';
      default: return 'text-white/60 bg-white/5';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={16} />;
      case 'Processing': return <Package size={16} />;
      case 'Shipped':
      case 'Delivered': return <Truck size={16} />;
      case 'Completed': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (selectedOrder) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedOrder(null)}
          className="inline-flex items-center text-white/40 hover:text-gold transition-colors mb-8 group"
        >
          <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="uppercase tracking-widest text-xs">Back to dashboard</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-3xl p-8 space-y-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-serif text-white mb-2">Order {selectedOrder.id}</h3>
              <p className="text-white/60 text-sm">
                Placed on {new Date(selectedOrder.date).toLocaleDateString()}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${getStatusColor(selectedOrder.status)}`}>
              {getStatusIcon(selectedOrder.status)}
              <span className="font-medium">{selectedOrder.status}</span>
            </div>
          </div>

          {/* Order Items */}
          <div className="pt-6 border-t border-white/10">
            <h4 className="text-lg font-serif text-white mb-4">Items</h4>
            <div className="space-y-3">
              {selectedOrder.items.map((item, index) => (
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

          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div>
              <p className="text-white/60 text-sm mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gold">RWF {selectedOrder.finalTotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Payment Method</p>
              <p className="text-white font-medium capitalize">{selectedOrder.paymentMethod}</p>
            </div>
          </div>

          {selectedOrder.shippingAddress && (
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-lg font-serif text-white mb-2">Shipping Address</h4>
              <p className="text-white/80">{selectedOrder.shippingAddress}</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-5xl font-serif text-white mb-2">My Account</h1>
          <p className="text-white/60">Welcome back, {user.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'orders'
            ? 'bg-gold text-dark'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
        >
          My Orders
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'profile'
            ? 'bg-gold text-dark'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
        >
          Profile
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {userOrders.length === 0 ? (
            <div className="text-center py-20 bg-surface rounded-3xl">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package size={48} className="text-white/40" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-2">No orders yet</h3>
              <p className="text-white/60 mb-6">Start shopping to see your orders here</p>
              <Link
                to="/"
                className="inline-block px-8 py-3 bg-gold text-dark font-bold rounded-xl hover:bg-gold/90 transition-colors"
              >
                Browse Collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-surface rounded-3xl p-6 border border-white/5 cursor-pointer hover:border-gold/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-white font-medium mb-1">Order {order.id}</p>
                      <p className="text-white/40 text-sm">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="text-xs font-medium">{order.status}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-dark rounded-lg overflow-hidden border border-white/5">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{item.name}</p>
                          <p className="text-white/40 text-xs">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-white/40 text-xs pl-15">+{order.items.length - 2} more items</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-white/60 text-sm">Total</span>
                    <span className="text-2xl font-bold text-gold">RWF {order.finalTotal.toLocaleString()}</span>
                  </div>

                  <button className="w-full mt-4 py-3 bg-white/5 hover:bg-gold hover:text-dark text-white rounded-xl transition-colors font-medium">
                    View Details
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl"
        >
          <div className="bg-surface rounded-3xl p-8 space-y-6">
            <div className="flex items-center space-x-4 pb-6 border-b border-white/10">
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center">
                <UserIcon size={40} className="text-gold" />
              </div>
              <div>
                <h3 className="text-2xl font-serif text-white">{user.name}</h3>
                <p className="text-white/60">{user.phone}</p>
              </div>
            </div>

            {customer && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Phone size={16} className="text-white/40" />
                      <span className="text-xs uppercase tracking-widest text-white/40">Phone</span>
                    </div>
                    <p className="text-white">{user.phone}</p>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin size={16} className="text-white/40" />
                      <span className="text-xs uppercase tracking-widest text-white/40">Address</span>
                    </div>
                    <p className="text-white">{customer.address || 'Not provided'}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Package size={16} className="text-white/40" />
                      <span className="text-xs uppercase tracking-widest text-white/40">Total Orders</span>
                    </div>
                    <p className="text-white">{userOrders.length}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock size={16} className="text-white/40" />
                      <span className="text-xs uppercase tracking-widest text-white/40">Member Since</span>
                    </div>
                    <p className="text-white">{new Date(customer.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {customer.loyaltyPoints !== undefined && customer.loyaltyPoints > 0 && (
                  <div className="p-6 bg-gold/10 rounded-2xl border border-gold/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Loyalty Points</p>
                        <p className="text-3xl font-bold text-gold">{customer.loyaltyPoints}</p>
                      </div>
                      <Award size={48} className="text-gold/40" />
                    </div>
                    <p className="text-white/40 text-xs mt-2">
                      Earn 1 point for every RWF 1,000 spent
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

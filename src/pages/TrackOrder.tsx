import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import OrderTracking from '../components/OrderTracking';
import { Order } from '../types';

interface TrackOrderPageProps {
  orders: Order[];
}

export default function TrackOrderPage({ orders }: TrackOrderPageProps) {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link 
        to="/" 
        className="inline-flex items-center text-white/40 hover:text-gold transition-colors mb-8 group"
      >
        <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        <span className="uppercase tracking-widest text-xs">Back to collection</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif text-white mb-4">Track Your Order</h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Enter your order ID to check the status of your delivery
        </p>
      </div>

      {/* Order Tracking Component */}
      <OrderTracking orders={orders} />

      {/* Info Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-surface rounded-2xl border border-white/5">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif text-white mb-2">Real-Time Updates</h3>
          <p className="text-white/60 text-sm">
            Track your order from preparation to delivery
          </p>
        </div>

        <div className="text-center p-6 bg-surface rounded-2xl border border-white/5">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif text-white mb-2">Secure & Private</h3>
          <p className="text-white/60 text-sm">
            No login required - just use your order ID
          </p>
        </div>

        <div className="text-center p-6 bg-surface rounded-2xl border border-white/5">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif text-white mb-2">Email Notifications</h3>
          <p className="text-white/60 text-sm">
            Receive updates directly to your inbox
          </p>
        </div>
      </div>
    </div>
  );
}
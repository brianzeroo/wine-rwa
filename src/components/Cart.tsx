import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ShoppingBag, AlertTriangle } from 'lucide-react';
import { CartItem } from '../types';
import { Link } from 'react-router-dom';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export default function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove }: CartProps) {
  const [lowStockItems, setLowStockItems] = useState<string[]>([]);
  
  useEffect(() => {
    // Check for low stock items
    const lowStock = items.filter(item => item.stock <= item.minStockLevel!).map(item => item.id);
    setLowStockItems(lowStock);
  }, [items]);
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-[60]"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface z-[70] shadow-2xl border-l border-white/5 flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h2 className="text-2xl font-serif text-white">Your Selection</h2>
              <button onClick={onClose} className="p-2 text-white/60 hover:text-gold transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p className="text-lg font-serif">Your cart is empty</p>
                  <button
                    onClick={onClose}
                    className="text-gold uppercase tracking-widest text-sm hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex space-x-4">
                    <div className="w-20 h-24 bg-dark rounded-lg overflow-hidden border border-white/5">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-white/90">{item.name}</h3>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-gold text-sm">RWF {item.price}</p>
                      
                      {lowStockItems.includes(item.id) && (
                        <div className="flex items-center text-yellow-400 text-xs mt-1">
                          <AlertTriangle size={12} className="mr-1" />
                          Low stock: {item.stock} left
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3 mt-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm text-white/80">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      
                      {item.quantity >= item.stock && (
                        <p className="text-red-400 text-xs mt-1">Maximum stock reached</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-dark/50 space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white/60 font-serif">Subtotal</span>
                  <span className="text-white font-bold">RWF {total.toLocaleString()}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="block w-full py-4 bg-gold text-dark text-center font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

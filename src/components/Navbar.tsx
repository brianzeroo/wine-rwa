import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  currentUser?: { id: string; phone: string; name: string } | null;
  onAuthClick?: () => void;
}

export default function Navbar({ cartCount, onCartClick, currentUser, onAuthClick }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Liquor', path: '/liquor' },
    { name: 'Wine', path: '/wine' },
    { name: 'Track Order', path: '/track-order' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-serif font-bold tracking-tighter text-gold">V&S</span>
            <span className="hidden sm:block text-sm uppercase tracking-[0.3em] font-light text-white/70">Vintner & Spirit</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm uppercase tracking-widest transition-colors duration-300",
                  isActive(link.path) ? "text-gold" : "text-white/60 hover:text-white"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-bold hover:bg-gold hover:text-dark transition-all"
                title={currentUser.name}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </Link>
            ) : (
              <button
                onClick={onAuthClick}
                className="text-xs text-white/80 hover:text-gold transition-colors uppercase tracking-[0.2em] px-4 py-2 border border-white/10 rounded-full"
              >
                Sign In
              </button>
            )}
            <button
              onClick={onCartClick}
              className="relative p-2 text-white/80 hover:text-gold transition-colors"
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-gold text-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-white/80 hover:text-gold transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block text-lg font-serif tracking-wide py-2",
                    isActive(link.path) ? "text-gold" : "text-white/60"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

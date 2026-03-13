import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Smartphone, Lock, User, Eye, EyeOff } from 'lucide-react';
import { registerUser, loginUser } from '../api/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

interface User {
  id: string;
  phone: string;
  name: string;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoginMode) {
      // Signup validation
      if (formData.password !== formData.confirmPassword) {
        setError('PINs do not match');
        return;
      }
      if (!/^\d{4}$/.test(formData.password)) {
        setError('PIN must be exactly 4 digits');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLoginMode) {
        const user = await loginUser(formData.phone, formData.password);

        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          onLogin(user);
          onClose();
        } else {
          setError('Invalid phone number or PIN');
        }
      } else {
        const newUser = await registerUser(formData.phone, formData.password);

        localStorage.setItem('user', JSON.stringify(newUser));
        onLogin(newUser);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-[90]"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[100] px-4"
      >
        <div className="bg-surface rounded-3xl p-8 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif text-white">
              {isLoginMode ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X size={20} className="text-white/60" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0788000000"
                  className="w-full px-5 py-4 pl-13 bg-dark border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                  required
                />
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-medium mb-2">
                {isLoginMode ? 'Password' : '4-Digit PIN'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isLoginMode ? '••••••••' : '••••'}
                  maxLength={isLoginMode ? undefined : 4}
                  className="w-full px-5 py-4 pl-13 pr-12 bg-dark border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 font-medium mb-2">
                  Confirm PIN
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••"
                    maxLength={4}
                    className="w-full px-5 py-4 pl-13 bg-dark border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                    required={!isLoginMode}
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gold text-dark font-bold uppercase tracking-widest rounded-xl hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Please wait...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              {isLoginMode ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                  setFormData({ phone: '', password: '', confirmPassword: '' });
                }}
                className="ml-2 text-gold hover:text-gold/80 font-medium"
              >
                {isLoginMode ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}


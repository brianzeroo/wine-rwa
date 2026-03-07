import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DiscountCodeProps {
  onApply: (code: string) => void;
  onRemove: () => void;
  appliedCode: string | null;
  discountAmount: number;
  subtotal: number;
}

export default function DiscountCode({ onApply, onRemove, appliedCode, discountAmount, subtotal }: DiscountCodeProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    try {
      const response = await fetch(`/api/discounts/${code}`);
      if (response.ok) {
        const discountData = await response.json();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startDate = new Date(discountData.startDate);
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const endDate = new Date(discountData.endDate);
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

        if (discountData.isActive && today >= start && today <= end) {
          const minAmount = Number(discountData.minOrderAmount) || 0;
          if (minAmount > 0 && Number(subtotal) < minAmount) {
            setError(`Minimum order amount of RWF ${minAmount.toLocaleString()} required`);
            return;
          }
          onApply(code);
        } else {
          setError('Discount code is expired or inactive');
        }
      } else {
        setError('Invalid discount code');
      }
    } catch (err) {
      setError('Failed to validate discount code');
      console.error(err);
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-green-400 font-mono text-sm">DISCOUNT APPLIED</span>
          <span className="text-white/80">{appliedCode}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-400">-{discountAmount.toLocaleString()}</span>
          <button
            onClick={onRemove}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex space-x-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter discount code"
          className="flex-1 px-4 py-2 bg-dark border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gold text-dark font-bold rounded-lg hover:bg-gold/90 transition-colors"
        >
          Apply
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
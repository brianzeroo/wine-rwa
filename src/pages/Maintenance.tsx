import React from 'react';
import { motion } from 'motion/react';
import { Hammer, Wine } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8 max-w-md"
      >
        <div className="flex justify-center">
          <div className="relative">
            <Wine size={80} className="text-gold opacity-20" />
            <Hammer size={40} className="text-gold absolute -bottom-2 -right-2 animate-bounce" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-serif text-white">Refining the Cellar</h1>
          <p className="text-white/40 leading-relaxed">
            Wine RWA is currently undergoing scheduled maintenance to improve your shopping experience. We'll be back with our finest selection shortly.
          </p>
        </div>

        <div className="pt-8 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold/50">
            Excellence takes time
          </p>
        </div>
      </motion.div>
    </div>
  );
}

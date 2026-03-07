import React from 'react';
import { motion } from 'motion/react';
import { Plus, Info } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <div className="aspect-[3/4] overflow-hidden bg-surface rounded-2xl border border-white/5 group-hover:border-gold/30 transition-colors duration-500">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          referrerPolicy="no-referrer"
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
          <button
            onClick={() => onAddToCart(product)}
            className="w-12 h-12 rounded-full bg-gold text-dark flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={() => onViewDetails(product)}
            className="w-12 h-12 rounded-full bg-white text-dark flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
          >
            <Info size={24} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-serif text-white/90 group-hover:text-gold transition-colors">
            {product.name}
          </h3>
          <span className="text-gold font-medium">RWF {product.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-white/40">
          <span>{product.origin}</span>
          <span>•</span>
          <span>{product.abv} ABV</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useLocation } from 'react-router-dom';
import { products } from '../data';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface StoreProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function Store({ products, onAddToCart }: StoreProps) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  const category = location.pathname === '/wine' ? 'Wine' : 
                   location.pathname === '/liquor' ? 'Liquor' : null;

  const filteredProducts = products.filter(p => {
    const matchesCategory = category ? p.category === category : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-serif text-white tracking-tight">
              {category ? `Curated ${category}s` : 'The Collection'}
            </h1>
            <p className="text-white/40 font-light tracking-widest uppercase text-xs">
              Handpicked spirits for the discerning palate
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-gold transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-3 bg-surface border border-white/5 rounded-full text-sm focus:outline-none focus:border-gold/50 transition-all w-full md:w-64"
              />
            </div>
            <button className="p-3 bg-surface border border-white/5 rounded-full text-white/40 hover:text-gold transition-colors">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={(p) => setSelectedProduct(p)}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-40 text-center space-y-4">
          <p className="text-white/20 font-serif text-2xl italic">No spirits found matching your search</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-gold uppercase tracking-widest text-sm hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-dark/90 backdrop-blur-md z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-surface z-[90] rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 p-2 text-white/40 hover:text-gold z-10"
              >
                <X size={24} />
              </button>

              <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-dark">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 p-8 md:p-12 flex flex-col justify-center space-y-8">
                <div className="space-y-2">
                  <span className="text-gold uppercase tracking-[0.3em] text-[10px] font-bold">
                    {selectedProduct.category} • {selectedProduct.origin}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight">
                    {selectedProduct.name}
                  </h2>
                </div>

                <div className="flex items-center space-x-8 border-y border-white/5 py-6">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/30">ABV</p>
                    <p className="text-lg font-serif text-white">{selectedProduct.abv}</p>
                  </div>
                  {selectedProduct.year && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-white/30">Vintage</p>
                      <p className="text-lg font-serif text-white">{selectedProduct.year}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/30">Price</p>
                    <p className="text-lg font-serif text-gold">RWF {selectedProduct.price}</p>
                  </div>
                </div>

                <p className="text-white/60 leading-relaxed font-light">
                  {selectedProduct.description}
                </p>

                <button
                  onClick={() => {
                    onAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-5 bg-gold text-dark font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Add to Collection
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

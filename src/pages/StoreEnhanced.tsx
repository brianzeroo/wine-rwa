import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SearchFilter from '../components/SearchFilter';
import { Product } from '../types';

interface StoreProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function Store({ products, onAddToCart }: StoreProps) {
  const location = useLocation();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const category = location.pathname === '/wine' ? 'Wine' :
    location.pathname === '/liquor' ? 'Liquor' : null;

  // Filter by category first, then let SearchFilter handle the rest
  const categoryFilteredProducts = React.useMemo(() => {
    return category
      ? products.filter(p => p.category === category)
      : products;
  }, [products, category]);

  // Sync filteredProducts when categoryFilteredProducts changes
  React.useEffect(() => {
    setFilteredProducts(categoryFilteredProducts);
  }, [categoryFilteredProducts]);

  const handleFilterProducts = (filtered: Product[]) => {
    setFilteredProducts(filtered);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif text-white mb-4">
          {category || 'Our Collection'}
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Discover our curated selection of premium wines and spirits from around the world
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-12">
        <SearchFilter
          products={categoryFilteredProducts}
          onFilterProducts={handleFilterProducts}
        />
      </div>

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-white/60">
          Showing {filteredProducts.length} of {categoryFilteredProducts.length} products
        </p>
        {filteredProducts.length === 0 && (
          <button
            onClick={() => handleFilterProducts(categoryFilteredProducts)}
            className="text-gold hover:text-gold/80 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Products Grid */}
      <AnimatePresence mode="wait">
        {filteredProducts.length > 0 ? (
          <motion.div
            key="products"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={() => setSelectedProduct(product)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif text-white mb-2">No products found</h3>
            <p className="text-white/60 mb-6">
              Try adjusting your search or filters to find what you're looking for
            </p>
            <button
              onClick={() => handleFilterProducts(categoryFilteredProducts)}
              className="px-6 py-3 bg-gold text-dark font-bold rounded-xl hover:bg-gold/90 transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-[80]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-surface rounded-3xl z-[90] border border-white/10 shadow-2xl"
            >
              <div className="sticky top-0 right-0 p-4 flex justify-end">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Image */}
                  <div className="aspect-square bg-dark rounded-2xl overflow-hidden border border-white/5">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-serif text-white mb-2">{selectedProduct.name}</h2>
                      <p className="text-white/60">{selectedProduct.origin}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-gold">
                        RWF {selectedProduct.price.toLocaleString()}
                      </span>
                      {selectedProduct.stock <= selectedProduct.minStockLevel! && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm uppercase tracking-widest text-white/40 font-medium mb-2">Description</h4>
                        <p className="text-white/80 leading-relaxed">{selectedProduct.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs uppercase tracking-widest text-white/40 font-medium mb-1">ABV</h4>
                          <p className="text-white">{selectedProduct.abv}</p>
                        </div>
                        {selectedProduct.year && (
                          <div>
                            <h4 className="text-xs uppercase tracking-widest text-white/40 font-medium mb-1">Vintage</h4>
                            <p className="text-white">{selectedProduct.year}</p>
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs uppercase tracking-widest text-white/40 font-medium mb-1">Category</h4>
                          <p className="text-white">{selectedProduct.category}</p>
                        </div>
                        {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                          <div>
                            <h4 className="text-xs uppercase tracking-widest text-white/40 font-medium mb-1">Tags</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedProduct.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-white/5 text-white/60 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      disabled={selectedProduct.stock === 0}
                      className="w-full py-4 bg-gold text-dark font-bold uppercase tracking-widest rounded-xl hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all disabled:hover:bg-gold"
                    >
                      {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Product, Category } from '../types';

interface SearchFilterProps {
  products: Product[];
  onFilterProducts: (filtered: Product[]) => void;
}

export default function SearchFilter({ products, onFilterProducts }: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | ''>('');

  // Reset filters when the products prop changes (e.g., category change)
  React.useEffect(() => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange([0, 2000000]);
    setSortBy('');
    onFilterProducts(products);
  }, [products]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, selectedCategory, priceRange, sortBy);
  };

  const handleCategoryChange = (category: Category | '') => {
    setSelectedCategory(category);
    applyFilters(searchTerm, category, priceRange, sortBy);
  };

  const handlePriceChange = (min: number, max: number) => {
    const newRange: [number, number] = [min, max];
    setPriceRange(newRange);
    applyFilters(searchTerm, selectedCategory, newRange, sortBy);
  };

  const handleSortChange = (sort: 'name' | 'price-low' | 'price-high' | '') => {
    setSortBy(sort);
    applyFilters(searchTerm, selectedCategory, priceRange, sort);
  };

  const applyFilters = (
    term: string,
    category: Category | '',
    range: [number, number],
    sort: 'name' | 'price-low' | 'price-high' | ''
  ) => {
    let filtered = [...products];

    // Search filter
    if (term) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(lowerTerm) ||
        product.description.toLowerCase().includes(lowerTerm) ||
        product.origin.toLowerCase().includes(lowerTerm) ||
        product.tags?.some(tag => tag.toLowerCase().includes(lowerTerm))
      );
    }

    // Category filter
    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.price >= range[0] && product.price <= range[1]
    );

    // Sorting
    if (sort) {
      switch (sort) {
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price);
          break;
      }
    }

    onFilterProducts(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange([0, 2000000]);
    setSortBy('');
    onFilterProducts(products);
  };

  const hasActiveFilters = searchTerm || selectedCategory || sortBy || priceRange[0] !== 0 || priceRange[1] !== 2000000;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search wines, spirits, origins..."
          className="w-full px-6 py-4 pl-14 bg-surface border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        {searchTerm && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter Toggle & Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${showFilters || hasActiveFilters ? 'bg-gold text-dark' : 'bg-white/5 text-white hover:bg-white/10'
            }`}
        >
          <Filter size={16} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-white/40 rounded-full"></span>
          )}
        </button>

        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as any)}
          className="px-4 py-2 bg-white/5 text-white rounded-xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-gold/50"
        >
          <option value="">Sort By</option>
          <option value="name">Name (A-Z)</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-surface rounded-2xl">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-medium">Category</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleCategoryChange('')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${selectedCategory === ''
                    ? 'bg-gold text-dark font-medium'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => handleCategoryChange('Wine')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${selectedCategory === 'Wine'
                    ? 'bg-gold text-dark font-medium'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
              >
                Wine
              </button>
              <button
                onClick={() => handleCategoryChange('Liquor')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${selectedCategory === 'Liquor'
                    ? 'bg-gold text-dark font-medium'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
              >
                Liquor
              </button>
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-medium">Price Range</label>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="2000000"
                step="50000"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange(0, parseInt(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-xs text-white/60">
                <span>RWF 0</span>
                <span>RWF {(priceRange[1] / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-medium">Results</label>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-white font-medium">
                {products.filter(p =>
                  p.price >= priceRange[0] && p.price <= priceRange[1] &&
                  (!selectedCategory || p.category === selectedCategory)
                ).length} products in range
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
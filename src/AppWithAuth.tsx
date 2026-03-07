import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Cart from './components/Cart';
import AgeVerification from './components/AgeVerification';
import AuthModal from './components/AuthModal';
import StoreEnhanced from './pages/StoreEnhanced';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Maintenance from './pages/Maintenance';
import TrackOrder from './pages/TrackOrder';
import UserDashboard from './pages/UserDashboard';
import { Product, CartItem, Order, AppSettings, Customer } from './types';
import { products as initialProducts } from './data';

function AppContent() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [settings, setSettings] = React.useState<AppSettings>({
    paypackApiKey: 'ID7ef50f2e-1659-11f1-aa4f-deadd43720af',
    paypackApiSecret: '340cf2aac9c7239b3eb96b8783a67206da39a3ee5e6b4b0d3255bfef95601890afd80709',
    storeName: 'Vintner & Spirit',
    isMaintenanceMode: false,
    emailNotifications: true,
  });

  const [cartItems, setCartItems] = React.useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAgeVerified, setIsAgeVerified] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string; name: string } | null>(null);
  const [customerData, setCustomerData] = React.useState<Customer | null>(null);
  const location = useLocation();

  // Check age verification on mount
  React.useEffect(() => {
    const verified = localStorage.getItem('ageVerified');
    if (verified === 'true') {
      setIsAgeVerified(true);
    }
  }, []);

  // Check user authentication on mount
  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // Fetch customer data when user logs in
  React.useEffect(() => {
    if (currentUser) {
      fetch(`/api/customers/email/${currentUser.email}`)
        .then(res => res.ok ? res.json() : null)
        .then(customer => {
          if (customer) setCustomerData(customer);
        })
        .catch(() => {});
    } else {
      setCustomerData(null);
    }
  }, [currentUser]);

  // Save cart items to localStorage
  React.useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, ordersRes, settingsRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/orders'),
          fetch('/api/settings')
        ]);

        if (productsRes.ok) setProducts(await productsRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCreateOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toISOString(),
      status: 'Pending'
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (response.ok) {
        setOrders(prev => [newOrder, ...prev]);
        handleClearCart();
        
        if (settings.emailNotifications && orderData.customerEmail) {
          console.log('📧 Sending order confirmation email to:', orderData.customerEmail);
        }
      }
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleSaveProduct = async (product: Product, isNew: boolean) => {
    try {
      const url = isNew ? '/api/products' : `/api/products/${product.id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });

      if (response.ok) {
        if (isNew) {
          setProducts(prev => [...prev, product]);
        } else {
          setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        }
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleUserLogin = (user: { id: string; email: string; name: string }) => {
    setCurrentUser(user);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    setCustomerData(null);
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname === '/dashboard';
  const showNavbar = !isAdminRoute && !isDashboardRoute && !settings.isMaintenanceMode && isAgeVerified;

  if (!isAgeVerified) {
    return <AgeVerification onVerify={setIsAgeVerified} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (settings.isMaintenanceMode && !isAdminRoute) {
    return <Maintenance />;
  }

  return (
    <div className="min-h-screen bg-dark">
      {showNavbar && (
        <Navbar 
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)}
          currentUser={currentUser}
          onAuthClick={() => setIsAuthModalOpen(true)}
        />
      )}

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleUserLogin}
      />

      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<StoreEnhanced products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/wine" element={<StoreEnhanced products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/liquor" element={<StoreEnhanced products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/checkout" element={<Checkout items={cartItems} onClearCart={handleClearCart} onCreateOrder={handleCreateOrder} currentUser={currentUser} />} />
          <Route path="/track-order" element={<TrackOrder orders={orders} />} />
          <Route 
            path="/dashboard" 
            element={
              currentUser ? (
                <UserDashboard 
                  user={currentUser} 
                  onLogout={handleUserLogout}
                  orders={orders}
                  customer={customerData}
                />
              ) : (
                <StoreEnhanced products={products} onAddToCart={handleAddToCart} />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={
              <Admin 
                isAuthenticated={isAdminAuthenticated}
                onLogin={() => setIsAdminAuthenticated(true)}
                products={products}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                orders={orders}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            } 
          />
        </Routes>
      </AnimatePresence>

      {/* Footer */}
      {showNavbar && (
        <footer className="py-12 border-t border-white/5 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <p className="text-gold font-serif text-xl tracking-tighter">Vintner & Spirit</p>
            <p className="text-white/20 text-[10px] uppercase tracking-[0.4em]">
              Excellence in every pour • Since 2024
            </p>
            <div className="pt-8 flex justify-center space-x-8 text-white/40 text-xs uppercase tracking-widest">
              <a href="#" className="hover:text-gold transition-colors">Terms</a>
              <a href="#" className="hover:text-gold transition-colors">Privacy</a>
              <a href="/track-order" className="hover:text-gold transition-colors">Track Order</a>
              {currentUser && (
                <a href="/dashboard" className="hover:text-gold transition-colors">My Account</a>
              )}
            </div>
            <p className="text-white/30 text-[10px] mt-4">
              Please drink responsibly. Alcohol abuse is harmful to health.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
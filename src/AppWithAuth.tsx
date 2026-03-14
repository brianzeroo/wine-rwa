import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
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
import Terms from './pages/Terms';
import { Product, CartItem, Order, AppSettings, Customer } from './types';
import { supabase } from './supabaseClient';

function AppContent() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [settings, setSettings] = React.useState<AppSettings>({
    paypackApiKey: 'ID7ef50f2e-1659-11f1-aa4f-deadd43720af',
    paypackApiSecret: '340cf2aac9c7239b3eb96b8783a67206da39a3ee5e6b4b0d3255bfef95601890afd80709',
    storeName: 'Wine RWA',
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
      supabase
        .from('customers')
        .select('*')
        .ilike('email', currentUser.email)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching customer:', error.message);
            return;
          }
          if (data) setCustomerData({
            id: data.id, name: data.name, email: data.email,
            phone: data.phone, address: data.address || '',
            joinDate: data.join_date, totalSpent: Number(data.total_spent || 0),
            orderCount: Number(data.order_count || 0), loyaltyPoints: Number(data.loyalty_points || 0)
          });
        });
    } else {
      setCustomerData(null);
    }
  }, [currentUser]);

  // Save cart items to localStorage
  React.useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fetch initial data from Supabase
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, ordersRes, settingsRes] = await Promise.all([
          supabase.from('products').select('*').order('name'),
          supabase.from('orders').select('*').order('date', { ascending: false }),
          supabase.from('settings').select('*').limit(1).maybeSingle()
        ]);

        if (productsRes.data) {
          setProducts(productsRes.data.map((p: any) => ({
            ...p,
            minStockLevel: p.min_stock_level,
            tags: Array.isArray(p.tags) ? p.tags : (p.tags ? JSON.parse(p.tags) : [])
          })));
        }
        if (ordersRes.data) {
          setOrders(ordersRes.data.map((o: any) => ({
            id: o.id, customerId: o.customer_id, customerName: o.customer_name,
            customerPhone: o.customer_phone, customerEmail: o.customer_email,
            items: Array.isArray(o.items) ? o.items : JSON.parse(o.items),
            total: Number(o.total), discountAmount: Number(o.discount_amount || 0),
            finalTotal: Number(o.final_total), status: o.status,
            paymentMethod: o.payment_method, shippingAddress: o.shipping_address,
            notes: o.notes, date: o.date
          })));
        }
        if (settingsRes.data) {
          const s = settingsRes.data;
          setSettings({
            paypackApiKey: s.paypack_api_key || '',
            paypackApiSecret: s.paypack_api_secret || '',
            storeName: s.store_name || 'Wine RWA',
            isMaintenanceMode: Boolean(s.is_maintenance_mode),
            emailNotifications: Boolean(s.email_notifications),
            adminPassword: s.admin_password || 'admin123'
          });
        }
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
      const { error } = await supabase.from('orders').insert({
        id: newOrder.id,
        customer_id: newOrder.customerId || null,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_email: newOrder.customerEmail,
        items: JSON.stringify(newOrder.items),
        total: newOrder.total,
        discount_amount: newOrder.discountAmount || 0,
        final_total: newOrder.finalTotal,
        status: newOrder.status,
        payment_method: newOrder.paymentMethod,
        shipping_address: newOrder.shippingAddress || null,
        notes: newOrder.notes || null,
        date: newOrder.date
      });

      if (!error) {
        setOrders(prev => [newOrder, ...prev]);
        handleClearCart();
        if (settings.emailNotifications && orderData.customerEmail) {
          console.log('📧 Sending order confirmation email to:', orderData.customerEmail);
        }
      } else {
        console.error('Failed to create order:', error.message);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      const { error } = await supabase.from('settings').update({
        paypack_api_key: newSettings.paypackApiKey || '',
        paypack_api_secret: newSettings.paypackApiSecret || '',
        store_name: newSettings.storeName || 'Wine RWA',
        is_maintenance_mode: newSettings.isMaintenanceMode,
        email_notifications: newSettings.emailNotifications,
        admin_password: newSettings.adminPassword || 'admin123'
      }).eq('id', 1);

      if (!error) setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleSaveProduct = async (product: Product, isNew: boolean) => {
    try {
      const dbProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        origin: product.origin,
        abv: product.abv,
        year: product.year || null,
        stock: product.stock,
        min_stock_level: product.minStockLevel || 0,
        tags: product.tags || []
      };

      let error;
      if (isNew) {
        ({ error } = await supabase.from('products').insert(dbProduct));
      } else {
        ({ error } = await supabase.from('products').update(dbProduct).eq('id', product.id));
      }

      if (!error) {
        if (isNew) {
          setProducts(prev => [...prev, product]);
        } else {
          setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        }
      } else {
        console.error('Failed to save product:', error.message);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleUserLogin = (user: any) => {
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
          <Route path="/terms" element={<Terms />} />
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
            <p className="text-gold font-serif text-xl tracking-tighter">Wine RWA</p>
            <p className="text-white/20 text-[10px] uppercase tracking-[0.4em]">
              Excellence in every pour • Since 2024
            </p>
            <div className="pt-8 flex justify-center space-x-8 text-white/40 text-xs uppercase tracking-widest">
              <Link to="/terms" className="hover:text-gold transition-colors">Terms</Link>
              <a href="#" className="hover:text-gold transition-colors">Privacy</a>
              <Link to="/track-order" className="hover:text-gold transition-colors">Track Order</Link>
              {currentUser && (
                <Link to="/dashboard" className="hover:text-gold transition-colors">My Account</Link>
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
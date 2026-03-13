import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product, Order, AppSettings, DiscountCode, Customer, AnalyticsData } from '../types';
import {
  X,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  BarChart3,
  Tag,
  User,
  Settings,
  TrendingUp,
  Award,
  Filter
} from 'lucide-react';
import { getAllDiscountCodes, createDiscountCode, deleteDiscountCode } from '../api/discountCodes';
import { getAllCustomers } from '../api/customers';
import { getAnalyticsData } from '../api/analytics';
import { verifyAdminPassword } from '../api/settings';
import { createProduct, updateProductInventory } from '../api/products';

interface AdminProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  products: Product[];
  onSaveProduct: (product: Product, isNew: boolean) => void;
  onDeleteProduct: (id: string) => void;
  orders: Order[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function Admin({
  isAuthenticated,
  onLogin,
  products,
  onSaveProduct,
  onDeleteProduct,
  orders,
  settings,
  onUpdateSettings
}: AdminProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginPassword, setLoginPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    category: 'Wine' as 'Wine' | 'Liquor',
    image: '',
    imageFile: null as File | null,
    origin: '',
    abv: '',
    year: new Date().getFullYear(),
    stock: 0,
    minStockLevel: 0,
    tags: [] as string[],
    tagInput: ''
  });
  const [newDiscountCode, setNewDiscountCode] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    minOrderAmount: 0,
    startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Use yesterday to avoid TZ issues
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    usageLimit: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const loadAdminData = async () => {
    try {
      const [codes, custs, analyticsData] = await Promise.all([
        getAllDiscountCodes(),
        getAllCustomers(),
        getAnalyticsData()
      ]);

      setDiscountCodes(codes);
      setCustomers(custs);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isValid = await verifyAdminPassword(loginPassword);

      if (isValid) {
        onLogin();
        setShowLoginModal(false);
      } else {
        alert('Incorrect password');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error during login');
    }
  };

  const handleCreateDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const createdCode = await createDiscountCode({
        code: newDiscountCode.code.toUpperCase(),
        type: newDiscountCode.type,
        value: newDiscountCode.value,
        minOrderAmount: newDiscountCode.minOrderAmount || 0,
        startDate: newDiscountCode.startDate,
        endDate: newDiscountCode.endDate,
        isActive: newDiscountCode.isActive,
        usageLimit: newDiscountCode.usageLimit || 0
      });

      setDiscountCodes([createdCode, ...discountCodes]);
      setNewDiscountCode({
        code: '',
        type: 'percentage',
        value: 10,
        minOrderAmount: 0,
        startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        usageLimit: 0
      });
    } catch (error: any) {
      console.error('Failed to create discount code:', error);
      alert(error.message || 'Error creating discount code. Please try again.');
    }
  };

  const handleDeleteDiscountCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      await deleteDiscountCode(id);
      setDiscountCodes(discountCodes.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting discount code:', error);
      alert('Error deleting discount code');
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const productsData = JSON.parse(content);

        // Send bulk upload by iterating (client-side)
        let successCount = 0;
        for (const prod of productsData) {
          try {
            const { id, ...newProd } = prod;
            await createProduct(newProd);
            successCount++;
          } catch (err) {
            console.error('Failed to upload product:', prod.name, err);
          }
        }

        alert(`${successCount} products uploaded successfully`);
        window.location.reload(); // Refresh to get updated data
      } catch (error) {
        console.error('Error uploading products:', error);
        alert('Error parsing file');
      }
    };
    reader.readAsText(file);
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      category: 'Wine',
      image: '',
      imageFile: null,
      origin: '',
      abv: '',
      year: new Date().getFullYear(),
      stock: 0,
      minStockLevel: 0,
      tags: [],
      tagInput: ''
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category as 'Wine' | 'Liquor',
      image: product.image,
      imageFile: null,
      origin: product.origin || '',
      abv: product.abv || '',
      year: product.year || new Date().getFullYear(),
      stock: product.stock,
      minStockLevel: product.minStockLevel || 0,
      tags: product.tags || [],
      tagInput: ''
    });
    setShowProductModal(true);
  };

  const handleSaveProductFromModal = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('💾 Admin: Starting save process...');
    console.log('📋 Admin: Form category value:', productForm.category);
    console.log('📋 Admin: Full form data:', productForm);

    try {
      let imageUrl = productForm.image;

      // If an image file is selected, we'll store it as base64 for now
      // In a real app, you'd upload to a server/cloud storage
      if (productForm.imageFile) {
        const base64 = await convertFileToBase64(productForm.imageFile);
        imageUrl = base64;
      }

      const product: Product = {
        id: productForm.id,
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        category: productForm.category,
        image: imageUrl,
        origin: productForm.origin,
        abv: productForm.abv,
        year: productForm.year,
        stock: productForm.stock,
        minStockLevel: productForm.minStockLevel,
        tags: productForm.tags
      };

      console.log('✅ Admin: Product object to save:', product);
      console.log('✅ Admin: Category being sent:', product.category);

      onSaveProduct(product, !editingProduct);
      setShowProductModal(false);
      alert('Product saved successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddTag = () => {
    if (productForm.tagInput.trim()) {
      setProductForm({
        ...productForm,
        tags: [...productForm.tags, productForm.tagInput.trim()],
        tagInput: ''
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setProductForm({
      ...productForm,
      tags: productForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (!isAuthenticated) {
    if (showLoginModal) {
      return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface rounded-2xl p-8 w-full max-w-md"
          >
            <h2 className="text-2xl font-serif text-white mb-6">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  placeholder="Enter admin password"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gold text-dark font-bold rounded-lg hover:bg-gold/90 transition-colors"
              >
                Login
              </button>
            </form>
          </motion.div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-dark pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-white">Admin Dashboard</h1>
          <button
            onClick={() => setShowLoginModal(true)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'discounts', label: 'Discounts', icon: Tag },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                  ? 'bg-gold text-dark'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && analytics && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Sales</p>
                    <p className="text-2xl font-serif text-white">RWF {analytics.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <DollarSign className="text-green-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Orders</p>
                    <p className="text-2xl font-serif text-white">{analytics.totalOrders}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <ShoppingCart className="text-blue-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Avg. Order Value</p>
                    <p className="text-2xl font-serif text-white">RWF {analytics.averageOrderValue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <TrendingUp className="text-purple-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Customers</p>
                    <p className="text-2xl font-serif text-white">{customers.length}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-full">
                    <Users className="text-yellow-400" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Chart */}
              <div className="bg-surface rounded-2xl p-6">
                <h3 className="text-lg font-serif text-white mb-4">Monthly Revenue</h3>
                <div className="h-64 flex items-end space-x-2">
                  {analytics.monthlyRevenue.map((month, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-gold to-gold/70 rounded-t-lg"
                        style={{ height: `${(month.revenue / Math.max(...analytics.monthlyRevenue.map(m => m.revenue))) * 80}%` }}
                      ></div>
                      <span className="text-white/60 text-xs mt-2">{month.month}</span>
                      <span className="text-white/80 text-xs">RWF {month.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Growth Chart */}
              <div className="bg-surface rounded-2xl p-6">
                <h3 className="text-lg font-serif text-white mb-4">Customer Growth</h3>
                <div className="h-64 flex items-end space-x-2">
                  {analytics.customerGrowth.map((month, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-700 rounded-t-lg"
                        style={{ height: `${(month.newCustomers / Math.max(...analytics.customerGrowth.map(m => m.newCustomers))) * 80}%` }}
                      ></div>
                      <span className="text-white/60 text-xs mt-2">{month.month}</span>
                      <span className="text-white/80 text-xs">{month.newCustomers} new</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-surface rounded-2xl p-6">
              <h3 className="text-lg font-serif text-white mb-4">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-white/60">Product</th>
                      <th className="text-left py-3 text-white/60">Category</th>
                      <th className="text-left py-3 text-white/60">Price</th>
                      <th className="text-left py-3 text-white/60">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProducts.map((product) => (
                      <tr key={product.id} className="border-b border-white/5">
                        <td className="py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-dark rounded overflow-hidden">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-white/80">{product.category}</td>
                        <td className="py-3 text-white/80">RWF {product.price.toLocaleString()}</td>
                        <td className="py-3 text-white/80">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif text-white">Products</h2>
              <div className="flex space-x-3">
                <button
                  onClick={openAddProductModal}
                  className="px-4 py-2 bg-gold text-dark font-bold rounded-lg hover:bg-gold/90 transition-colors"
                >
                  + Add Product
                </button>
                <label className="px-4 py-2 bg-white/10 text-white rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  Bulk Upload
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-surface rounded-2xl p-6">
                  <div className="aspect-square bg-dark rounded-xl overflow-hidden mb-4">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-serif text-white mb-1">{product.name}</h3>
                  <p className="text-white/60 text-sm mb-2">{product.origin}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-gold">RWF {product.price.toLocaleString()}</span>
                    <span className="text-white/60 text-sm">Stock: {product.stock}</span>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => openEditProductModal(product)}
                      className="flex-1 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-white">Orders</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-white/60">Order ID</th>
                    <th className="text-left py-3 text-white/60">Customer</th>
                    <th className="text-left py-3 text-white/60">Date</th>
                    <th className="text-left py-3 text-white/60">Total</th>
                    <th className="text-left py-3 text-white/60">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5">
                      <td className="py-3 text-white">{order.id}</td>
                      <td className="py-3 text-white/80">{order.customerName}</td>
                      <td className="py-3 text-white/80">{new Date(order.date).toLocaleDateString()}</td>
                      <td className="py-3 text-white/80">RWF {order.finalTotal.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            order.status === 'Processing' ? 'bg-blue-500/20 text-blue-400' :
                              order.status === 'Shipped' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-gray-500/20 text-gray-400'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-white">Discount Codes</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h3 className="text-lg font-serif text-white mb-4">Create New Code</h3>
                <form onSubmit={handleCreateDiscountCode} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Code</label>
                    <input
                      type="text"
                      value={newDiscountCode.code}
                      onChange={(e) => setNewDiscountCode({ ...newDiscountCode, code: e.target.value })}
                      className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white"
                      placeholder="e.g. WELCOME10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1">Type</label>
                    <select
                      value={newDiscountCode.type}
                      onChange={(e) => setNewDiscountCode({ ...newDiscountCode, type: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1">Value</label>
                    <input
                      type="number"
                      value={newDiscountCode.value}
                      onChange={(e) => setNewDiscountCode({ ...newDiscountCode, value: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1">Min Order Amount (optional)</label>
                    <input
                      type="number"
                      value={newDiscountCode.minOrderAmount}
                      onChange={(e) => setNewDiscountCode({ ...newDiscountCode, minOrderAmount: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white"
                      min="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={newDiscountCode.startDate}
                        onChange={(e) => setNewDiscountCode({ ...newDiscountCode, startDate: e.target.value })}
                        className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-1">End Date</label>
                      <input
                        type="date"
                        value={newDiscountCode.endDate}
                        onChange={(e) => setNewDiscountCode({ ...newDiscountCode, endDate: e.target.value })}
                        className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newDiscountCode.isActive}
                        onChange={(e) => setNewDiscountCode({ ...newDiscountCode, isActive: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-white/60">Active</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gold text-dark font-bold rounded-lg hover:bg-gold/90 transition-colors"
                  >
                    Create Discount Code
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2">
                <h3 className="text-lg font-serif text-white mb-4">Existing Codes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-white/60">Code</th>
                        <th className="text-left py-3 text-white/60">Type</th>
                        <th className="text-left py-3 text-white/60">Value</th>
                        <th className="text-left py-3 text-white/60">Usage</th>
                        <th className="text-left py-3 text-white/60">Status</th>
                        <th className="text-right py-3 text-white/60">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountCodes.map((code) => (
                        <tr key={code.id} className="border-b border-white/5">
                          <td className="py-3 text-white font-mono">{code.code}</td>
                          <td className="py-3 text-white/80 capitalize">{code.type}</td>
                          <td className="py-3 text-white/80">
                            {code.type === 'percentage' ? `${code.value}%` : `RWF ${code.value.toLocaleString()}`}
                          </td>
                          <td className="py-3 text-white/80">{code.usedCount}{code.usageLimit ? `/${code.usageLimit}` : ''}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${code.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                              {code.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteDiscountCode(code.id)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Code"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-white">Customers</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-white/60">Name</th>
                    <th className="text-left py-3 text-white/60">Email</th>
                    <th className="text-left py-3 text-white/60">Phone</th>
                    <th className="text-left py-3 text-white/60">Total Spent</th>
                    <th className="text-left py-3 text-white/60">Loyalty Points</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-white/5">
                      <td className="py-3 text-white">{customer.name}</td>
                      <td className="py-3 text-white/80">{customer.email}</td>
                      <td className="py-3 text-white/80">{customer.phone}</td>
                      <td className="py-3 text-white/80">RWF {customer.totalSpent.toLocaleString()}</td>
                      <td className="py-3 text-white/80">{customer.loyaltyPoints || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif text-white">Inventory</h2>
              <button className="px-4 py-2 bg-gold text-dark rounded-lg hover:bg-gold/90 transition-colors">
                Export Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-white/60">Product</th>
                    <th className="text-left py-3 text-white/60">Category</th>
                    <th className="text-left py-3 text-white/60">Current Stock</th>
                    <th className="text-left py-3 text-white/60">Min Level</th>
                    <th className="text-left py-3 text-white/60">Status</th>
                    <th className="text-left py-3 text-white/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-white/5">
                      <td className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-dark rounded overflow-hidden">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-white">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-white/80">{product.category}</td>
                      <td className="py-3 text-white/80">{product.stock}</td>
                      <td className="py-3 text-white/80">{product.minStockLevel || 0}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${product.stock <= (product.minStockLevel || 0)
                          ? 'bg-red-500/20 text-red-400'
                          : product.stock <= ((product.minStockLevel || 0) * 2)
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                          }`}>
                          {product.stock <= (product.minStockLevel || 0)
                            ? 'Low Stock'
                            : product.stock <= ((product.minStockLevel || 0) * 2)
                              ? 'Medium Stock'
                              : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => {
                            const newStock = prompt('Enter new stock quantity:', product.stock.toString());
                            if (newStock !== null) {
                              const updatedProduct = { ...product, stock: parseInt(newStock) };
                              onSaveProduct(updatedProduct, false);

                              // Update stock via API
                              updateProductInventory(product.id, parseInt(newStock))
                                .catch(err => console.error('Failed to update inventory:', err));
                            }
                          }}
                          className="px-3 py-1 bg-white/10 text-white rounded text-sm hover:bg-white/20 transition-colors"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-white">Settings</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateSettings(settings);
              }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <label className="block text-sm text-white/60 mb-2">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => onUpdateSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">PayPack API Key</label>
                <input
                  type="password"
                  value={settings.paypackApiKey}
                  onChange={(e) => onUpdateSettings({ ...settings, paypackApiKey: e.target.value })}
                  className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  placeholder="Enter your PayPack API key"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">PayPack API Secret</label>
                <input
                  type="password"
                  value={settings.paypackApiSecret}
                  onChange={(e) => onUpdateSettings({ ...settings, paypackApiSecret: e.target.value })}
                  className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  placeholder="Enter your PayPack API secret"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="maintenance-mode"
                  checked={settings.isMaintenanceMode}
                  onChange={(e) => onUpdateSettings({ ...settings, isMaintenanceMode: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="maintenance-mode" className="text-white">Maintenance Mode</label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => onUpdateSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="email-notifications" className="text-white">Enable Email Notifications</label>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gold text-dark font-bold rounded-lg hover:bg-gold/90 transition-colors"
              >
                Save Settings
              </button>
            </form>

            <div className="pt-8 border-t border-white/10 space-y-6 mt-8">
              <h3 className="text-xl font-serif text-white">Security Settings</h3>

              {!isPinVerified ? (
                <div className="max-w-md space-y-4">
                  <p className="text-sm text-white/60">Enter security PIN to modify sensitive settings:</p>
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      className="flex-1 px-4 py-3 bg-dark border border-white/10 rounded-lg text-white"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (securityPin === '1884') {
                          setIsPinVerified(true);
                          setSecurityPin('');
                        } else {
                          alert('Incorrect security PIN');
                        }
                      }}
                      className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Verify PIN
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-md space-y-4">
                  <p className="text-sm text-green-400">PIN Verified. You can now change the admin password.</p>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newPassword || newPassword !== confirmPassword) {
                          alert('Passwords do not match or are empty');
                          return;
                        }

                        try {
                          await onUpdateSettings({ ...settings, adminPassword: newPassword });
                          alert('Admin password updated successfully!');
                          setNewPassword('');
                          setConfirmPassword('');
                          setIsPinVerified(false);
                        } catch (error) {
                          console.error('Failed to update password:', error);
                          alert('Failed to update password');
                        }
                      }}
                      className="px-6 py-3 bg-gold text-dark font-bold rounded-lg hover:bg-gold/90 transition-colors"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPinVerified(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface rounded-2xl p-8 w-full max-w-4xl my-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveProductFromModal} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif text-white border-b border-white/10 pb-2">Basic Information</h3>

                    <div>
                      <label className="block text-sm text-white/60 mb-2">Product Name *</label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                        placeholder="e.g., Château Margaux 2015"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-2">Description</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                        rows={4}
                        placeholder="Describe the product..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Category *</label>
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value as 'Wine' | 'Liquor' })}
                          className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                          required
                        >
                          <option value="Wine">Wine</option>
                          <option value="Liquor">Liquor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-white/60 mb-2">Price (RWF) *</label>
                        <input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-2">Origin</label>
                      <input
                        type="text"
                        value={productForm.origin}
                        onChange={(e) => setProductForm({ ...productForm, origin: e.target.value })}
                        className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                        placeholder="e.g., Bordeaux, France"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">ABV</label>
                        <input
                          type="text"
                          value={productForm.abv}
                          onChange={(e) => setProductForm({ ...productForm, abv: e.target.value })}
                          className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                          placeholder="e.g., 13.5%"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-white/60 mb-2">Year</label>
                        <input
                          type="number"
                          value={productForm.year}
                          onChange={(e) => setProductForm({ ...productForm, year: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Image & Inventory */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif text-white border-b border-white/10 pb-2">Image & Inventory</h3>

                    <div>
                      <label className="block text-sm text-white/60 mb-2">Product Image</label>
                      <div className="space-y-3">
                        {productForm.image && !productForm.imageFile && (
                          <div className="relative rounded-lg overflow-hidden aspect-video bg-dark">
                            <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {productForm.imageFile && (
                          <div className="relative rounded-lg overflow-hidden aspect-video bg-dark">
                            <img src={URL.createObjectURL(productForm.imageFile)} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProductForm({ ...productForm, imageFile: null })}
                              className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="block text-xs text-white/60">Upload from Computer</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProductForm({ ...productForm, imageFile: e.target.files?.[0] || null })}
                            className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white text-sm focus:outline-none"
                          />
                          <div className="text-center text-white/40 text-sm">- OR -</div>
                          <input
                            type="url"
                            value={productForm.image}
                            onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                            className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white text-sm focus:outline-none"
                            placeholder="Paste image URL here"
                            disabled={!!productForm.imageFile}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Current Stock *</label>
                        <input
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                          min="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-white/60 mb-2">Min Stock Level</label>
                        <input
                          type="number"
                          value={productForm.minStockLevel}
                          onChange={(e) => setProductForm({ ...productForm, minStockLevel: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-2">Tags</label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={productForm.tagInput}
                          onChange={(e) => setProductForm({ ...productForm, tagInput: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          className="flex-1 px-4 py-2 bg-dark border border-white/10 rounded-lg text-white text-sm focus:outline-none"
                          placeholder="Add a tag"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-4 py-2 bg-gold text-dark font-bold rounded-lg hover:bg-gold/90 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {productForm.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-white/10 text-white rounded-full text-sm flex items-center"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 text-white/60 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gold text-dark font-bold rounded-lg hover:bg-gold/90 transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
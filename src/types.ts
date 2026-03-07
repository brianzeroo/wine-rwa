export type Category = 'Wine' | 'Liquor';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  origin: string;
  abv: string; // Alcohol by volume
  year?: number;
  stock: number;
  minStockLevel?: number;
  tags?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  totalSpent: number;
  orderCount: number;
  loyaltyPoints?: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  pointsPerUnit: number; // Points earned per RWF spent
  redemptionRate: number; // How many points needed per RWF discount
  isActive: boolean;
}

export interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Product[];
  monthlyRevenue: { month: string; revenue: number }[];
  customerGrowth: { month: string; newCustomers: number }[];
}

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CartItem[];
  total: number;
  discountAmount?: number;
  finalTotal: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Completed' | 'Cancelled';
  date: string;
  paymentMethod: 'mtn' | 'airtel';
  shippingAddress?: string;
  notes?: string;
}

export interface AppSettings {
  paypackApiKey: string;
  paypackApiSecret: string;
  storeName: string;
  isMaintenanceMode: boolean;
  emailNotifications: boolean;
  adminPassword?: string;
}

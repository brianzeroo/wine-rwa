import { supabase } from '../supabaseClient';
import { AnalyticsData, Order } from '../types';

const mapOrder = (o: any): Order => ({
  id: o.id,
  customerId: o.customer_id,
  customerName: o.customer_name,
  customerPhone: o.customer_phone,
  customerEmail: o.customer_email,
  items: Array.isArray(o.items) ? o.items : JSON.parse(o.items),
  total: Number(o.total),
  discountAmount: Number(o.discount_amount || 0),
  finalTotal: Number(o.final_total),
  status: o.status,
  paymentMethod: o.payment_method,
  shippingAddress: o.shipping_address,
  notes: o.notes,
  date: o.date
});

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  const { data: orders } = await supabase.from('orders').select('*');
  const { data: products } = await supabase.from('products').select('*');

  const allOrders = (orders || []).map(mapOrder);
  const totalSales = allOrders.reduce((sum, o) => sum + o.finalTotal, 0);
  const totalOrders = allOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return {
    totalSales,
    totalOrders,
    averageOrderValue,
    topProducts: (products || []).slice(0, 5),
    monthlyRevenue: [],
    customerGrowth: []
  };
};

export const getRecentOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('date', { ascending: false })
    .limit(5);
  if (error) throw new Error(error.message);
  return (data || []).map(mapOrder);
};
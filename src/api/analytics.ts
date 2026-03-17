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
  const response = await fetch('/api/analytics', {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const getRecentOrders = async (): Promise<Order[]> => {
  const response = await fetch('/api/orders?limit=5', {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recent orders: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};
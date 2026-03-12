import { supabase } from '../supabaseClient';
import { Order } from '../types';

const mapOrder= (row: any): Order => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  customerEmail: row.customer_email,
  items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
  total: Number(row.total),
  discountAmount: Number(row.discount_amount || 0),
  finalTotal: Number(row.final_total),
  status: row.status,
  paymentMethod: row.payment_method,
  shippingAddress: row.shipping_address,
  notes: row.notes,
  date: row.date
});

export const getAllOrders = async (limit?: number): Promise<Order[]> => {
  let query = supabase
    .from('orders')
    .select('*')
    .order('date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
 return (data || []).map(mapOrder);
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw new Error(error.message);
 return data ? mapOrder(data) : null;
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<Order> => {
  const dbOrder = {
  id: `order${Date.now()}`,
   customer_id: order.customerId || null,
   customer_name: order.customerName,
   customer_phone: order.customerPhone,
   customer_email: order.customerEmail,
    items: JSON.stringify(order.items),
    total: order.total,
    discount_amount: order.discountAmount || 0,
    final_total: order.finalTotal,
    status: order.status || 'Pending',
    payment_method: order.paymentMethod,
    shipping_address: order.shippingAddress || null,
    notes: order.notes || null
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(dbOrder)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
 return mapOrder(data);
};

export const updateOrderStatus = async (id: string, status: string): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
 return data ? mapOrder(data) : null;
};

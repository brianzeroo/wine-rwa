import { supabase } from '../supabaseClient';
import { Order } from '../types';

const mapOrder = (row: any): Order => ({
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
  const url = limit ? `/api/orders?limit=${limit}` : '/api/orders';
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch order: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<Order> => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create order: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const updateOrderStatus = async (id: string, status: string): Promise<Order | null> => {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update order status: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

import { supabase } from '../supabaseClient';
import { Customer } from '../types';

// Map DB snake_case to camelCase
const mapCustomer = (row: any): Customer => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  address: row.address || '',
  joinDate: row.join_date,
  totalSpent: Number(row.total_spent || 0),
  orderCount: Number(row.order_count || 0),
  loyaltyPoints: Number(row.loyalty_points || 0),
});

export const getAllCustomers = async (): Promise<Customer[]> => {
  const response = await fetch('/api/customers', {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch customer: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
  const response = await fetch(`/api/customers/email/${email}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch customer by email: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const createCustomer = async (
  customer: Omit<Customer, 'id' | 'joinDate' | 'totalSpent' | 'orderCount'>
): Promise<Customer> => {
  const response = await fetch('/api/customers', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customer)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create customer: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update customer: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const addCustomerLoyaltyPoints = async (id: string, points: number): Promise<Customer | null> => {
  const response = await fetch(`/api/customers/${id}/add-points`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ points })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to add loyalty points: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

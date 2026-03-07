import { Customer } from '../types';

export const getAllCustomers = async (): Promise<Customer[]> => {
  const response = await fetch('/api/customers');
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const response = await fetch(`/api/customers/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch customer');
  return response.json();
};

export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
  const response = await fetch(`/api/customers/email/${encodeURIComponent(email)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch customer');
  return response.json();
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'joinDate' | 'totalSpent' | 'orderCount'>): Promise<Customer> => {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer)
  });
  if (!response.ok) throw new Error('Failed to create customer');
  return response.json();
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to update customer');
  return response.json();
};

export const addCustomerLoyaltyPoints = async (id: string, points: number): Promise<Customer | null> => {
  const response = await fetch(`/api/customers/${id}/loyalty-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points })
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to update loyalty points');
  return response.json();
};
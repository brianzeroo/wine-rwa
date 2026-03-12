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
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return (data || []).map(mapCustomer);
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCustomer(data) : null;
};

export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCustomer(data) : null;
};

export const createCustomer = async (
  customer: Omit<Customer, 'id' | 'joinDate' | 'totalSpent' | 'orderCount'>
): Promise<Customer> => {
  const newCustomer = {
    id: `cust${Date.now()}`,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    join_date: new Date().toISOString().split('T')[0],
    total_spent: 0,
    order_count: 0,
    loyalty_points: customer.loyaltyPoints || 0,
  };
  const { data, error } = await supabase
    .from('customers')
    .insert(newCustomer)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapCustomer(data);
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.totalSpent !== undefined) dbUpdates.total_spent = updates.totalSpent;
  if (updates.orderCount !== undefined) dbUpdates.order_count = updates.orderCount;
  if (updates.loyaltyPoints !== undefined) dbUpdates.loyalty_points = updates.loyaltyPoints;

  const { data, error } = await supabase
    .from('customers')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCustomer(data) : null;
};

export const addCustomerLoyaltyPoints = async (id: string, points: number): Promise<Customer | null> => {
  // First get current points, then add
  const { data: existing } = await supabase
    .from('customers')
    .select('loyalty_points')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return null;

  const newPoints = (existing.loyalty_points || 0) + points;
  const { data, error } = await supabase
    .from('customers')
    .update({ loyalty_points: newPoints })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapCustomer(data);
};
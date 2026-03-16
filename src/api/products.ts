import { supabase } from '../supabaseClient';
import { Product } from '../types';

// Map DB snake_case to camelCase
const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  category: row.category,
  image: row.image,
  origin: row.origin,
  abv: row.abv,
  year: row.year,
  stock: Number(row.stock),
  minStockLevel: Number(row.min_stock_level),
  tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
});

export const getAllProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []).map(mapProduct);
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProduct(data) : null;
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const response = await fetch('/api/products', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create product: ${response.statusText}`);
  }

  const data = await response.json();
  // Ensure the backend returns data structured similar to the frontend's expected Product type
  // or use mapProduct if the backend returns snake_case rows. Our backend currently returns camelCase for id, but we send camelCase in req.body
  return data as Product;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product | null> => {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update product: ${response.statusText}`);
  }

  const data = await response.json();
  // Typically backend would return the updated product row
  return data ? mapProduct(data) : null;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete product: ${response.statusText}`);
  }
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lte('stock', 'min_stock_level');

  if (error) throw new Error(error.message);
  return (data || []).map(mapProduct);
};

export const updateProductInventory = async (id: string, stock: number): Promise<Product | null> => {
  const response = await fetch(`/api/products/${id}/inventory`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stock })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update inventory: ${response.statusText}`);
  }

  const data = await response.json();
  return data ? mapProduct(data) : null;
};

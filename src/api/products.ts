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
  const dbProduct: any = {
   id: `prod${Date.now()}`,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    image: product.image,
    origin: product.origin,
    abv: product.abv,
    year: product.year,
    stock: product.stock,
    min_stock_level: product.minStockLevel || 0,
  };

  // Handle tags array - convert to JSON string
  if (product.tags && Array.isArray(product.tags)) {
    dbProduct.tags = JSON.stringify(product.tags);
  }

  const { data, error } = await supabase
    .from('products')
    .insert(dbProduct)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
 return mapProduct(data);
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product | null> => {
  const dbUpdates: any = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.origin !== undefined) dbUpdates.origin = updates.origin;
  if (updates.abv !== undefined) dbUpdates.abv = updates.abv;
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
  if (updates.minStockLevel !== undefined) dbUpdates.min_stock_level = updates.minStockLevel;
  
  // Handle tags array
  if (updates.tags && Array.isArray(updates.tags)) {
    dbUpdates.tags = JSON.stringify(updates.tags);
  }

  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
 return data ? mapProduct(data) : null;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(error.message);
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
  const { data, error } = await supabase
    .from('products')
    .update({ stock })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
 return data ? mapProduct(data) : null;
};

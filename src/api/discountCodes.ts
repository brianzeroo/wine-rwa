import { supabase } from '../supabaseClient';
import { DiscountCode } from '../types';

const mapDiscount = (row: any): DiscountCode => ({
  id: row.id,
  code: row.code,
  type: row.type,
  value: Number(row.value),
  minOrderAmount: Number(row.min_order_amount || 0),
  startDate: row.start_date,
  endDate: row.end_date,
  isActive: Boolean(row.is_active),
  usageLimit: row.usage_limit,
  usedCount: Number(row.used_count || 0),
});

export const getAllDiscountCodes = async (): Promise<DiscountCode[]> => {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapDiscount);
};

export const getDiscountCodeByCode = async (code: string): Promise<DiscountCode | null> => {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .ilike('code', code)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapDiscount(data) : null;
};

export const createDiscountCode = async (
  discountCode: Omit<DiscountCode, 'id' | 'usedCount'>
): Promise<DiscountCode> => {
  const response = await fetch('/api/discounts', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(discountCode)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create discount code: ${response.statusText}`);
  }

  const data = await response.json();
  return data as DiscountCode;
};

export const deleteDiscountCode = async (id: string): Promise<void> => {
  const response = await fetch(`/api/discounts/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete discount code: ${response.statusText}`);
  }
};

export const incrementDiscountCodeUsage = async (id: string): Promise<void> => {
  const response = await fetch(`/api/discounts/${id}/increment-usage`, {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to increment usage: ${response.statusText}`);
  }
};
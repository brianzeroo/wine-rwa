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
  const dbCode = {
    id: `disc${Date.now()}`,
    code: discountCode.code.toUpperCase(),
    type: discountCode.type,
    value: discountCode.value,
    min_order_amount: discountCode.minOrderAmount || 0,
    start_date: discountCode.startDate,
    end_date: discountCode.endDate,
    is_active: discountCode.isActive !== undefined ? discountCode.isActive : true,
    usage_limit: discountCode.usageLimit || 0,
    used_count: 0,
  };
  const { data, error } = await supabase
    .from('discount_codes')
    .insert(dbCode)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapDiscount(data);
};

export const deleteDiscountCode = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const incrementDiscountCodeUsage = async (id: string): Promise<void> => {
  const { data: existing } = await supabase
    .from('discount_codes')
    .select('used_count')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return;

  const { error } = await supabase
    .from('discount_codes')
    .update({ used_count: (existing.used_count || 0) + 1 })
    .eq('id', id);
  if (error) throw new Error(error.message);
};
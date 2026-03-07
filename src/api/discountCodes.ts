import { DiscountCode } from '../types';

export const getAllDiscountCodes = async (): Promise<DiscountCode[]> => {
  const response = await fetch('/api/discounts');
  if (!response.ok) throw new Error('Failed to fetch discount codes');
  return response.json();
};

export const getDiscountCodeByCode = async (code: string): Promise<DiscountCode | null> => {
  const response = await fetch(`/api/discounts/${code}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch discount code');
  return response.json();
};

export const createDiscountCode = async (discountCode: Omit<DiscountCode, 'id' | 'usedCount'>): Promise<DiscountCode> => {
  const response = await fetch('/api/discounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discountCode)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create discount code');
  }
  return response.json();
};

export const deleteDiscountCode = async (id: string): Promise<void> => {
  const response = await fetch(`/api/discounts/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete discount code');
};

export const incrementDiscountCodeUsage = async (id: string): Promise<void> => {
  const response = await fetch(`/api/discounts/${id}/increment-usage`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to increment discount usage');
};
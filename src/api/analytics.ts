import { AnalyticsData, Order } from '../types';

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  const response = await fetch('/api/analytics');
  if (!response.ok) throw new Error('Failed to fetch analytics data');
  return response.json();
};

export const getRecentOrders = async (): Promise<Order[]> => {
  const response = await fetch('/api/orders?limit=5');
  if (!response.ok) throw new Error('Failed to fetch recent orders');
  return response.json();
};
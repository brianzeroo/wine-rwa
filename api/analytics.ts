import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapProductToFrontend = (dbProduct: any) => {
    if (!dbProduct) return null;
    return {
        ...dbProduct,
        minStockLevel: dbProduct.min_stock_level,
        tags: typeof dbProduct.tags === 'string' ? JSON.parse(dbProduct.tags) : dbProduct.tags
    };
};

/**
 * Analytics API Handler
 * Handles: GET
 * Security: Admin auth required, Input validation, Method checking
 */
export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Helper: Verify Admin Auth
    const isAdmin = async () => {
        const cookieHeader = req.headers.cookie;
        const token = cookieHeader?.split(';').find((c: string) => c.trim().startsWith('admin_token='))?.split('=')[1];
        if (!token) return false;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            return decoded.role === 'admin';
        } catch {
            return false;
        }
    };

    const authenticated = await isAdmin();
    if (!authenticated) {
        return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
    }

    try {
        const { data: ordersData } = await supabase.from('orders').select('*');
        const orders = ordersData || [];
        const totalSales = orders.reduce((sum: number, order: any) => sum + Number(order.final_total || 0), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        const productSales: Record<string, number> = {};
        orders.forEach((order: any) => {
            let items: any[] = [];
            try {
                if (typeof order.items === 'string') {
                    items = JSON.parse(order.items || '[]');
                } else if (Array.isArray(order.items)) {
                    items = order.items;
                }
            } catch (e) {
                console.warn(`Could not parse items for order ${order.id}`);
            }

            items.forEach((item: any) => {
                if (!productSales[item.id]) {
                    productSales[item.id] = 0;
                }
                productSales[item.id] += item.quantity || 1;
            });
        });

        const sortedProductIds = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([productId]) => productId);

        const topProducts: any[] = [];
        for (const productId of sortedProductIds) {
            if (!productId || productId === 'undefined') continue;
            const { data: productData } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .maybeSingle();

            if (productData) {
                topProducts.push(mapProductToFrontend(productData));
            }
        }

        if (topProducts.length === 0) {
            const { data: fallbackData } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            topProducts.push(...(fallbackData || []).map(mapProductToFrontend));
        }

        // Mock chart data (as per original logic)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const monthlyRevenue = months.map(month => ({
            month,
            revenue: Math.floor(Math.random() * 5000000) + 1000000
        }));

        const customerGrowth = months.map((month) => ({
            month,
            newCustomers: Math.floor(Math.random() * 20) + 5
        }));

        return res.json({
            totalSales,
            totalOrders,
            averageOrderValue,
            topProducts,
            monthlyRevenue,
            customerGrowth
        });
    } catch (error: any) {
        console.error('[Error] Analytics exception:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

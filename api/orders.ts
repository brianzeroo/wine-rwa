import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapOrderToFrontend = (dbOrder: any) => ({
    id: dbOrder.id,
    customerId: dbOrder.customer_id,
    customerName: dbOrder.customer_name,
    customerPhone: dbOrder.customer_phone,
    customerEmail: dbOrder.customer_email,
    items: typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items,
    total: Number(dbOrder.total),
    discountAmount: Number(dbOrder.discount_amount || 0),
    finalTotal: Number(dbOrder.final_total),
    status: dbOrder.status,
    paymentMethod: dbOrder.payment_method,
    shippingAddress: dbOrder.shipping_address,
    notes: dbOrder.notes,
    date: dbOrder.date
});

/**
 * Consolidated Orders API Handler
 * Handles: GET (list), POST (create)
 * Security: Admin auth for listing, Input validation, Method checking
 */
export default async function handler(req: any, res: any) {
    const { method, body, query } = req;

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

    // --- Action: LIST ORDERS (Requires Admin Auth) ---
    if (method === 'GET') {
        const authenticated = await isAdmin();
        if (!authenticated) {
            return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
        }

        try {
            const limit = query.limit ? parseInt(query.limit as string) : 50;
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('date', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return res.json((data || []).map(mapOrderToFrontend));
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to fetch orders' });
        }
    }

    // --- Action: CREATE ORDER (Publicly used by checkout frontend or legacy) ---
    if (method === 'POST') {
        try {
            const order = body;
            // Basic Validation
            if (!order.customerPhone || !order.items) {
                return res.status(400).json({ error: 'Missing required order details' });
            }

            const dbOrder = {
                id: order.id || `order${Date.now()}`,
                customer_id: order.customerId || null,
                customer_name: order.customerName,
                customer_phone: order.customerPhone,
                customer_email: order.customerEmail,
                items: JSON.stringify(order.items),
                total: order.total,
                discount_amount: order.discountAmount || 0,
                final_total: order.finalTotal,
                status: order.status || 'Pending',
                payment_method: order.paymentMethod,
                shipping_address: order.shippingAddress || null,
                notes: order.notes || null,
                transaction_id: order.transactionId || null
            };

            const { data, error } = await supabase.from('orders').insert(dbOrder).select().single();
            if (error) throw error;

            console.log(`[Orders] New order created: ${dbOrder.id}`);
            return res.status(201).json(order);
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to create order' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

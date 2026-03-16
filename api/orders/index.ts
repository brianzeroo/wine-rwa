import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
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

export default async function handler(req: any, res: any) {
    if (req.method === 'GET') {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

            let query = supabase.from('orders').select('*');
            if (limit) {
                query = query.limit(limit);
            }
            query = query.order('date', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return res.json((data || []).map(mapOrderToFrontend));
        } catch (error: any) {
            console.error('Error fetching orders:', error.message);
            return res.status(500).json({ error: 'Failed to fetch orders' });
        }
    }

    if (req.method === 'POST') {
        try {
            const order = req.body;
            const dbOrder = {
                id: order.id,
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

            const { data, error } = await supabase
                .from('orders')
                .insert(dbOrder)
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(order);
        } catch (error: any) {
            console.error('Error creating order:', error.message);
            return res.status(500).json({ error: 'Failed to create order' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { items, customerId, customerName, customerPhone, customerEmail, shippingAddress, notes, paymentMethod, discountCode } = req.body;

        if (!items || !items.length || !customerPhone || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required checkout information' });
        }

        // 1. Recalculate Total on Server
        let calculatedSubtotal = 0;
        for (const item of items) {
            const { data: dbProduct } = await supabase.from('products').select('price').eq('id', item.id).single();
            if (dbProduct) {
                calculatedSubtotal += (dbProduct.price * item.quantity);
            } else {
                calculatedSubtotal += (item.price * item.quantity);
            }
        }

        let discountAmount = 0;
        if (discountCode) {
            const { data: discountData } = await supabase.from('discount_codes').select('*').ilike('code', discountCode).eq('is_active', true).maybeSingle();
            if (discountData) {
                if (discountData.type === 'percentage') {
                    discountAmount = (calculatedSubtotal * discountData.value) / 100;
                } else {
                    discountAmount = discountData.value;
                }
            }
        }

        const finalTotal = Math.max(0, calculatedSubtotal - discountAmount);

        // 2. Authorize with PayPack
        const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
        const apiKey = settingsData?.paypack_api_key;
        const apiSecret = settingsData?.paypack_api_secret;

        if (!apiKey) {
            // Mock mode if no API key
            const orderId = `order${Date.now()}`;
            const transactionId = `mock-${Date.now()}`;
            const dbOrder = {
                id: orderId,
                customer_id: customerId || null,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                items: JSON.stringify(items),
                total: calculatedSubtotal,
                discount_amount: discountAmount,
                final_total: finalTotal,
                status: 'Pending',
                transaction_id: transactionId,
                payment_method: paymentMethod,
                shipping_address: shippingAddress || null,
                notes: notes || null
            };
            const { error: dbError } = await supabase.from('orders').insert(dbOrder);
            if (dbError) throw dbError;
            return res.json({ success: true, transactionId, orderId });
        }

        const tokenResponse = await fetch('https://payments.paypack.rw/api/auth/agents/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret })
        });
        const authData: any = await tokenResponse.json();
        if (!tokenResponse.ok || !authData.access) throw new Error('Failed to authenticate with PayPack');

        const cashinResponse = await fetch('https://payments.paypack.rw/api/transactions/cashin', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authData.access}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ amount: finalTotal, number: customerPhone })
        });
        const cashinData: any = await cashinResponse.json();
        if (!cashinResponse.ok) throw new Error(cashinData.message || 'PayPack cashin failed');

        const transactionId = cashinData.ref || cashinData.transaction_id || cashinData.id;

        // 3. Create Pending Order in Database
        const orderId = `order${Date.now()}`;
        const dbOrder = {
            id: orderId,
            customer_id: customerId || null,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            items: JSON.stringify(items),
            total: calculatedSubtotal,
            discount_amount: discountAmount,
            final_total: finalTotal,
            status: 'Pending',
            transaction_id: transactionId,
            payment_method: paymentMethod,
            shipping_address: shippingAddress || null,
            notes: notes || null
        };

        const { error: dbError } = await supabase.from('orders').insert(dbOrder);
        if (dbError) throw dbError;

        return res.json({ success: true, transactionId, orderId });

    } catch (error: any) {
        console.error('Checkout initiate error:', error.message);
        return res.status(500).json({ error: error.message || 'Failed to initiate checkout' });
    }
}

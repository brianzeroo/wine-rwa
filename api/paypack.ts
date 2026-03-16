import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { z } from 'zod';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthorizeSchema = z.object({
    amount: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().positive()),
    phoneNumber: z.string().regex(/^\d{10,12}$/, "Invalid phone number format (10-12 digits required)")
});

const StatusSchema = z.object({
    id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/)
});

/**
 * Consolidated PayPack API Handler
 * Handles: Authorize (Payment), Status Check, Webhook
 * Security: Zod validation, HMAC-SHA256 signature verification, Database side-effects
 */
export default async function handler(req: any, res: any) {
    const { url, method, body, headers, query } = req;
    const path = url.split('?')[0];

    // --- Action: WEBHOOK (Secured with Signature) ---
    if (path.endsWith('/webhook')) {
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        try {
            const signature = headers['x-paypack-signature'];
            const webhookSecret = process.env.PAYPACK_WEBHOOK_SECRET;

            if (!webhookSecret) {
                console.error('[Security] CRITICAL: PAYPACK_WEBHOOK_SECRET missing');
                return res.status(500).json({ error: 'Configuration error' });
            }

            if (!signature) return res.status(401).json({ error: 'Missing signature' });

            const hmac = crypto.createHmac('sha256', webhookSecret);
            const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
            const calculatedSignature = hmac.update(bodyString).digest('hex');

            if (signature !== calculatedSignature) {
                console.warn('[Security] Invalid webhook signature detected');
                return res.status(401).json({ error: 'Invalid signature' });
            }

            const transactionId = body.data?.ref || body.data?.transaction_id || body.data?.id;
            const status = body.data?.status; // 'successful', 'failed', etc.

            if (!transactionId || !status) return res.status(400).json({ error: 'Invalid payload' });

            const { data: orderData, error: lookupError } = await supabase
                .from('orders')
                .select('id, status, customer_id, final_total')
                .eq('transaction_id', transactionId)
                .maybeSingle();

            if (lookupError || !orderData) {
                return res.status(200).json({ success: true, message: 'Transaction ignored' });
            }

            if (orderData.status === 'Paid') return res.status(200).json({ success: true });

            let newStatus = 'Pending';
            if (status === 'successful' || status === 'completed') newStatus = 'Paid';
            else if (status === 'failed' || status === 'cancelled') newStatus = 'Failed';

            const { data: updatedOrder, error: updateError } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderData.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Side Effects for Successful Payments
            if (newStatus === 'Paid' && updatedOrder) {
                try {
                    if (updatedOrder.customer_id) {
                        const pointsToAdd = Math.floor(updatedOrder.final_total / 1000);
                        const { data: customer } = await supabase
                            .from('customers')
                            .select('loyalty_points')
                            .eq('id', updatedOrder.customer_id)
                            .maybeSingle();

                        if (customer) {
                            const newPoints = (customer.loyalty_points || 0) + pointsToAdd;
                            await supabase.from('customers').update({ loyalty_points: newPoints }).eq('id', updatedOrder.customer_id);
                        }
                    }
                } catch (e) {
                    console.error('[Error] Side effects failed:', e);
                }
            }

            return res.json({ success: true });

        } catch (error: any) {
            console.error('[Error] Webhook processing exception:', error.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // --- Action: AUTHORIZE (Initiate Payment) ---
    if (path.endsWith('/authorize')) {
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const validation = AuthorizeSchema.safeParse(body);
        if (!validation.success) return res.status(400).json({ success: false, error: 'Invalid input', details: validation.error.flatten().fieldErrors });

        const { amount, phoneNumber } = validation.data;

        try {
            const { data: settingsData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
            const apiKey = (settingsData?.paypack_api_key || process.env.PAYPACK_API_KEY || '').trim();
            const apiSecret = (settingsData?.paypack_api_secret || process.env.PAYPACK_API_SECRET || '').trim();

            if (!apiKey) return res.status(500).json({ success: false, error: 'PayPack configuration missing' });

            const tokenResponse = await fetch('https://payments.paypack.rw/api/auth/agents/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret })
            });

            const authData: any = await tokenResponse.json();
            if (!tokenResponse.ok || !authData.access) return res.status(500).json({ success: false, error: 'PayPack Auth Failed' });

            const cashinResponse = await fetch('https://payments.paypack.rw/api/transactions/cashin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData.access}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ amount, number: phoneNumber })
            });

            const data: any = await cashinResponse.json();
            if (cashinResponse.ok) {
                return res.json({ success: true, transactionId: data.ref || data.transaction_id || data.id });
            } else {
                return res.status(400).json({ success: false, error: data.message || 'Cashin failed' });
            }

        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // --- Action: STATUS CHECK ---
    if (path.includes('/status/')) {
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

        const txnId = path.split('/status/')[1];
        const validation = StatusSchema.safeParse({ id: txnId });
        if (!validation.success) return res.status(400).json({ error: 'Invalid transaction ID' });

        try {
            const { data: settingsData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
            const apiKey = (settingsData?.paypack_api_key || process.env.PAYPACK_API_KEY || '').trim();
            const apiSecret = (settingsData?.paypack_api_secret || process.env.PAYPACK_API_SECRET || '').trim();

            const tokenResponse = await fetch('https://payments.paypack.rw/api/auth/agents/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret })
            });
            const authData: any = await tokenResponse.json();
            if (!authData.access) return res.status(500).json({ error: 'PayPack Auth Failed' });

            const response = await fetch(`https://payments.paypack.rw/api/transactions/find/${txnId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authData.access}`, 'Content-Type': 'application/json' }
            });

            const data: any = await response.json();
            if (response.ok) {
                return res.json({ success: true, status: data.status, message: data.message });
            } else {
                return res.status(400).json({ error: data.message || 'Status check failed' });
            }
        } catch (error: any) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(404).json({ error: 'Path not found' });
}

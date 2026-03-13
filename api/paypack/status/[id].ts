import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle both /api/paypack/status?id=... and potentially path params if configured in vercel.json
    // But the app calls it as /api/paypack/status/${id}
    // Vercel handles /api/paypack/status/[id].ts as a dynamic route.
    // We'll name this file [id].ts instead of status.ts if we want to match the URL exactly.
    // Or we change the URL in Checkout.tsx to use a query param.
    // Let's use the dynamic route approach.

    const { id } = req.query;

    try {
        if (!id) {
            return res.status(400).json({ error: 'Missing transaction ID' });
        }

        if (String(id).startsWith('mock-')) {
            return res.json({
                success: true,
                status: 'completed',
                message: 'Mock payment completed'
            });
        }

        const { data: settingsData } = await supabase
            .from('settings')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (!settingsData) {
            return res.status(500).json({ error: 'Settings not found' });
        }

        const auth = Buffer.from(`${settingsData.paypack_api_key}:${settingsData.paypack_api_secret}`).toString('base64');

        const response = await fetch(`https://api.paypack.co.rw/v1/transactions/${id}/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        const data: any = await response.json();

        if (response.ok) {
            res.json({
                success: true,
                status: data.status,
                message: data.message
            });
        } else {
            res.status(response.status).json({
                success: false,
                error: data.message || 'Failed to check status'
            });
        }
    } catch (error: any) {
        console.error('PayPack status check error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Unable to check transaction status'
        });
    }
}

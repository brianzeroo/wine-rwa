import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, phoneNumber, provider } = req.body;

    try {
        const { data: settingsData } = await supabase
            .from('settings')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (!settingsData?.paypack_api_key || settingsData.paypack_api_key === '') {
            return res.json({ success: true, transactionId: `mock-${Date.now()}` });
        }

        const auth = Buffer.from(`${settingsData.paypack_api_key}:${settingsData.paypack_api_secret}`).toString('base64');

        const response = await fetch('https://api.paypack.co.rw/v1/transactions/authorize', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                phone: phoneNumber,
                network: provider
            })
        });

        const data: any = await response.json();

        if (response.ok) {
            res.json({ success: true, transactionId: data.transaction_id });
        } else {
            res.status(response.status).json({
                success: false,
                error: data.message || 'Payment authorization failed'
            });
        }
    } catch (error: any) {
        console.error('PayPack authorization error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Payment service unavailable. Please try again.'
        });
    }
}

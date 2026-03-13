import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, phoneNumber, provider } = req.body;

    // Re-initialize or verify client inside handler to ensure fresh environment access
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({
            success: false,
            error: 'Missing Supabase environment variables in Vercel settings.'
        });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
        const { data: settingsData, error: dbError } = await supabase
            .from('settings')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (dbError) {
            throw new Error(`Supabase Database Error: ${dbError.message}`);
        }

        const apiKey = (settingsData?.paypack_api_key || process.env.PAYPACK_API_KEY || '').trim();
        const apiSecret = (settingsData?.paypack_api_secret || process.env.PAYPACK_API_SECRET || '').trim();

        if (!apiKey || apiKey === '') {
            return res.json({ success: true, transactionId: `mock-${Date.now()}` });
        }

        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

        let response;
        try {
            response = await fetch('https://api.paypack.co.rw/v1/transactions/authorize', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    phone: phoneNumber,
                    network: provider
                })
            });
        } catch (fetchErr: any) {
            throw new Error(`PayPack Network Error (fetch failed): ${fetchErr.message}`);
        }

        const data: any = await response.json().catch(() => ({ message: 'Invalid JSON response from PayPack' }));

        if (response.ok) {
            res.json({ success: true, transactionId: data.transaction_id });
        } else {
            res.status(response.status).json({
                success: false,
                error: data.message || `PayPack Error (${response.status}): ${JSON.stringify(data)}`
            });
        }
    } catch (error: any) {
        console.error('Authorization Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Payment service encountered an unexpected error.'
        });
    }
}

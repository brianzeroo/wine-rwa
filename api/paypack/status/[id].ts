import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

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

        if (!apiKey) {
            return res.status(500).json({ error: 'PayPack configuration missing' });
        }

        // Step 1: Get Access Token
        let tokenResponse;
        try {
            console.log(`Getting PayPack JWT Token for Status Check`);
            tokenResponse = await fetch('https://payments.paypack.rw/api/auth/agents/authorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    client_id: apiKey,
                    client_secret: apiSecret
                })
            });
        } catch (authErr: any) {
            console.error('Auth Fetch Error Detail:', authErr);
            throw new Error(`PayPack Status Auth Error: ${authErr.message}`);
        }

        const authData: any = await tokenResponse.json().catch(() => ({ message: 'Invalid JSON from Auth' }));

        if (!tokenResponse.ok || !authData.access) {
            console.error('Failed to get PayPack token for Status:', authData);
            return res.status(tokenResponse.status || 500).json({
                success: false,
                error: `PayPack Auth Error: ${authData.message || 'Could not retrieve access token'}`
            });
        }

        const accessToken = authData.access;

        // Step 2: Check Transaction Status
        let response;
        try {
            console.log(`Checking PayPack status for ref: ${id}`);
            response = await fetch(`https://payments.paypack.rw/api/transactions/find/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
        } catch (fetchErr: any) {
            console.error('Status Fetch Error Detail:', fetchErr);
            const cause = fetchErr.cause ? ` (Cause: ${fetchErr.cause.message || fetchErr.cause.code || JSON.stringify(fetchErr.cause)})` : '';
            throw new Error(`PayPack Status Network Error: ${fetchErr.message}${cause}`);
        }

        const data: any = await response.json().catch(() => ({ message: 'Invalid JSON response from PayPack Status' }));

        if (response.ok) {
            // PayPack uses various status strings like "successful", "failed", "pending"
            res.json({
                success: true,
                status: data.status,
                message: data.message || `Transaction is ${data.status}`
            });
        } else {
            res.status(response.status).json({
                success: false,
                error: data.message || `PayPack Status Error (${response.status}): ${JSON.stringify(data)}`
            });
        }
    } catch (error: any) {
        console.error('Status Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Unable to check transaction status'
        });
    }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { z } from 'zod';

const AuthorizeSchema = z.object({
    amount: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().positive()),
    phoneNumber: z.string().regex(/^\d{10,12}$/, "Invalid phone number format (10-12 digits required)"),
    provider: z.string().optional()
});

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const validation = AuthorizeSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            success: false,
            error: 'Invalid input',
            details: validation.error.flatten().fieldErrors
        });
    }

    const { amount, phoneNumber, provider } = validation.data;

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
            return res.status(500).json({ success: false, error: 'PayPack configuration missing' });
        }

        // Step 1: Get Access Token
        let tokenResponse;
        try {
            console.log(`Getting PayPack JWT Token for client_id: ${apiKey}`);
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
            throw new Error(`PayPack Auth Network Error: ${authErr.message}`);
        }

        const authData: any = await tokenResponse.json().catch(() => ({ message: 'Invalid JSON from Auth' }));

        if (!tokenResponse.ok || !authData.access) {
            console.error('Failed to get PayPack token:', authData);
            return res.status(tokenResponse.status || 500).json({
                success: false,
                error: `PayPack Auth Error: ${authData.message || 'Could not retrieve access token'}`
            });
        }

        const accessToken = authData.access;

        // Step 2: Initiate Cashin
        let response;
        try {
            console.log(`Attempting PayPack cashin: ${phoneNumber} - RWF ${amount}`);
            response = await fetch('https://payments.paypack.rw/api/transactions/cashin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    number: phoneNumber
                })
            });
        } catch (fetchErr: any) {
            console.error('Cashin Fetch Error Detail:', fetchErr);
            const cause = fetchErr.cause ? ` (Cause: ${fetchErr.cause.message || fetchErr.cause.code || JSON.stringify(fetchErr.cause)})` : '';
            throw new Error(`PayPack Cashin Network Error: ${fetchErr.message}${cause}`);
        }

        const data: any = await response.json().catch(() => ({ message: 'Invalid JSON response from PayPack Cashin' }));

        if (response.ok) {
            res.json({ success: true, transactionId: data.ref || data.transaction_id || data.id });
        } else {
            res.status(response.status).json({
                success: false,
                error: data.message || `PayPack Cashin Error (${response.status}): ${JSON.stringify(data)}`
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

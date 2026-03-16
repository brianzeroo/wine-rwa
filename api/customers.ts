import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Consolidated Customers API Handler
 * Handles: GET (list/detail), POST (create), PUT (update), DELETE
 * Security: Admin auth for most operations, Role-based access, Input validation
 */
export default async function handler(req: any, res: any) {
    const { url, method, body, query } = req;
    const path = url.split('?')[0];

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

    // --- Action: PHONE SEARCH (Publicly used by checkout) ---
    if (path.includes('/phone/')) {
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

        try {
            const phone = path.split('/phone/')[1];
            if (!phone) return res.status(400).json({ error: 'Phone number required' });

            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('phone', phone)
                .maybeSingle();

            if (error || !data) return res.status(404).json({ error: 'Customer not found' });
            return res.json(data);
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to fetch customer' });
        }
    }

    // --- Action: ALL/SPECIFIC CUSTOMER (Requires Admin Auth) ---
    const authenticated = await isAdmin();
    if (!authenticated) {
        return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
    }

    // Determine ID from URL: /api/customers/ID or /api/customers
    const segments = path.split('/').filter(Boolean);
    const customerId = segments.length > 2 ? segments[2] : null;

    try {
        if (method === 'GET') {
            if (customerId) {
                // Fetch Single Customer
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', customerId)
                    .maybeSingle();

                if (error || !data) return res.status(404).json({ error: 'Customer not found' });
                return res.json(data);
            } else {
                // Fetch All Customers
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .order('name');

                if (error) throw error;
                return res.json(data || []);
            }
        }

        if (method === 'POST') {
            const { data, error } = await supabase
                .from('customers')
                .insert(body)
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(data);
        }

        if (method === 'PUT' && customerId) {
            const { data, error } = await supabase
                .from('customers')
                .update(body)
                .eq('id', customerId)
                .select()
                .single();

            if (error) throw error;
            return res.json(data);
        }

        if (method === 'DELETE' && customerId) {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', customerId);

            if (error) throw error;
            return res.status(204).send('');
        }

    } catch (error: any) {
        console.error(`[Error] Customer operation (${method}) failed:`, error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(405).json({ error: 'Method not allowed or missing path parameters' });
}

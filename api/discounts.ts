import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapDiscountToFrontend = (dbCode: any) => ({
    id: dbCode.id,
    code: dbCode.code,
    type: dbCode.type,
    value: Number(dbCode.value),
    minOrderAmount: Number(dbCode.min_order_amount),
    startDate: dbCode.start_date,
    endDate: dbCode.end_date,
    isActive: Boolean(dbCode.is_active),
    usageLimit: dbCode.usage_limit,
    usedCount: Number(dbCode.used_count)
});

/**
 * Consolidated Discounts API Handler
 * Handles: GET (list/validate), POST (create), PUT (update), DELETE, Usage Increment
 * Security: Admin auth for sensitive ops, Input validation, Method checking
 */
export default async function handler(req: any, res: any) {
    const { url, method, body } = req;
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

    const segments = path.split('/').filter(Boolean);
    const identifier = segments.length > 2 ? segments[2] : null;

    try {
        // --- Action: LIST ALL DISCOUNTS (Public in server.ts) ---
        if (method === 'GET' && !identifier) {
            const { data, error } = await supabase
                .from('discount_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.json((data || []).map(mapDiscountToFrontend));
        }

        // --- Action: VALIDATE CODE (Public) ---
        if (method === 'GET' && identifier) {
            const { data, error } = await supabase
                .from('discount_codes')
                .select('*')
                .ilike('code', identifier)
                .eq('is_active', true)
                .maybeSingle();

            if (error || !data) return res.status(404).json({ error: 'Discount code not found or inactive' });
            return res.json(mapDiscountToFrontend(data));
        }

        // --- Actions below require ADMIN auth ---
        const authenticated = await isAdmin();
        if (!authenticated) {
            return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
        }

        // --- Action: INCREMENT USAGE (Admin in server.ts) ---
        if (path.endsWith('/increment-usage')) {
            if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
            const discId = segments[segments.length - 2];
            const { data: existing } = await supabase.from('discount_codes').select('used_count').eq('id', discId).maybeSingle();
            if (!existing) return res.status(404).json({ error: 'Discount code not found' });

            const { data, error } = await supabase
                .from('discount_codes')
                .update({ used_count: (existing.used_count || 0) + 1 })
                .eq('id', discId)
                .select()
                .single();

            if (error) throw error;
            return res.json(mapDiscountToFrontend(data));
        }

        if (method === 'POST') {
            const codeName = body.code?.toUpperCase();
            if (!codeName) return res.status(400).json({ error: 'Code is required' });

            const { data: existing } = await supabase
                .from('discount_codes')
                .select('id')
                .ilike('code', codeName)
                .maybeSingle();

            if (existing) return res.status(400).json({ error: 'Discount code already exists' });

            const dbCode = {
                id: `disc${Date.now()}`,
                code: codeName,
                type: body.type,
                value: body.value,
                min_order_amount: body.minOrderAmount || 0,
                start_date: body.startDate,
                end_date: body.endDate,
                is_active: body.isActive !== undefined ? body.isActive : true,
                usage_limit: body.usageLimit || 0,
                used_count: 0
            };

            const { data, error } = await supabase.from('discount_codes').insert(dbCode).select().single();
            if (error) throw error;
            return res.status(201).json(mapDiscountToFrontend(data));
        }

        if (method === 'PUT' && identifier) {
            // Note: identifier here could be ID or Code based on original routes. 
            // In Admin UI it's usually ID.
            const { data, error } = await supabase
                .from('discount_codes')
                .update(body)
                .eq('id', identifier)
                .select()
                .single();

            if (error) {
                // Try by code if ID fails (for fallback)
                const { data: byCode, error: err2 } = await supabase
                    .from('discount_codes')
                    .update(body)
                    .ilike('code', identifier)
                    .select()
                    .single();
                if (err2) throw error;
                return res.json(body);
            }
            return res.json(body);
        }

        if (method === 'DELETE' && identifier) {
            const { error } = await supabase.from('discount_codes').delete().eq('id', identifier);
            if (error) throw error;
            return res.status(204).send('');
        }

    } catch (error: any) {
        console.error(`[Error] Discount operation (${method}) failed:`, error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

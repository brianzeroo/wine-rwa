import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapProductToFrontend = (dbProduct: any) => {
    if (!dbProduct) return null;
    return {
        ...dbProduct,
        minStockLevel: dbProduct.min_stock_level,
        tags: typeof dbProduct.tags === 'string' ? JSON.parse(dbProduct.tags) : dbProduct.tags
    };
};

/**
 * Consolidated Products API Handler
 * Handles: POST (create), PUT (update), DELETE, Inventory Update, Low Stock
 * Security: Admin auth required for ALL these operations
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
    // Path structure: /api/products/[id]/...
    const identifier = segments.length > 2 ? segments[2] : null;

    try {
        // --- Action: LIST ALL PRODUCTS (Public) ---
        if (method === 'GET' && !identifier && !path.endsWith('/low-stock')) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            return res.json((data || []).map(mapProductToFrontend));
        }

        // --- Action: LOW STOCK (Public in server.ts) ---
        if (path.endsWith('/low-stock') && method === 'GET') {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .lte('stock', 'min_stock_level');

            if (error) throw error;
            return res.json((data || []).map(mapProductToFrontend));
        }

        // --- All other actions require Admin Auth ---
        const authenticated = await isAdmin();
        if (!authenticated) {
            return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
        }

        // --- Action: INVENTORY UPDATE ---
        if (path.endsWith('/inventory') && method === 'PUT') {
            const prodId = segments[segments.length - 2];
            const { stock } = body;

            if (typeof stock !== 'number') return res.status(400).json({ error: 'Invalid stock value' });

            const { data, error } = await supabase
                .from('products')
                .update({ stock })
                .eq('id', prodId)
                .select()
                .single();

            if (error) throw error;
            return res.json(mapProductToFrontend(data));
        }

        // --- Action: CREATE PRODUCT ---
        if (method === 'POST' && !identifier) {
            const { id, ...newProduct } = body;
            const dbProduct = {
                ...newProduct,
                min_stock_level: newProduct.minStockLevel || 0,
                tags: JSON.stringify(newProduct.tags || []),
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('products').insert(dbProduct).select().single();
            if (error) throw error;
            return res.status(201).json(mapProductToFrontend(data));
        }

        // --- Action: UPDATE PRODUCT ---
        if (method === 'PUT' && identifier) {
            const updates = body;
            const dbUpdates = {
                ...updates,
                min_stock_level: updates.minStockLevel !== undefined ? updates.minStockLevel : updates.min_stock_level,
                tags: updates.tags !== undefined ? JSON.stringify(updates.tags) : updates.tags
            };
            // Clean up camelCase
            delete (dbUpdates as any).minStockLevel;

            const { data, error } = await supabase
                .from('products')
                .update(dbUpdates)
                .eq('id', identifier)
                .select()
                .single();

            if (error) throw error;
            return res.json(mapProductToFrontend(data));
        }

        // --- Action: DELETE PRODUCT ---
        if (method === 'DELETE' && identifier) {
            const { error } = await supabase.from('products').delete().eq('id', identifier);
            if (error) throw error;
            return res.status(204).send('');
        }

    } catch (error: any) {
        console.error(`[Error] Product operation (${method}) failed:`, error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

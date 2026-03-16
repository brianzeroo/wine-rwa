import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapProductToFrontend = (dbProduct: any) => {
    if (!dbProduct) return null;
    return {
        ...dbProduct,
        minStockLevel: dbProduct.min_stock_level,
        tags: typeof dbProduct.tags === 'string' ? JSON.parse(dbProduct.tags) : dbProduct.tags
    };
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .lte('stock', 'min_stock_level');

        if (error) throw error;
        return res.json((data || []).map(mapProductToFrontend));
    } catch (error: any) {
        console.error('Error fetching low stock products:', error.message);
        return res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
}

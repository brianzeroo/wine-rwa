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
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;
        const { stock } = req.body;
        const { data, error } = await supabase
            .from('products')
            .update({ stock })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return res.json(mapProductToFrontend(data));
    } catch (error: any) {
        console.error('Error updating inventory:', error.message);
        return res.status(500).json({ error: 'Failed to update inventory' });
    }
}

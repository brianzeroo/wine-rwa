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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const productData = req.body;
        const { id, ...newProduct } = productData;

        const dbProduct = {
            ...newProduct,
            min_stock_level: newProduct.minStockLevel || 0,
            tags: JSON.stringify(newProduct.tags || []),
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('products')
            .insert(dbProduct)
            .select()
            .single();

        if (error) throw error;
        return res.status(201).json(mapProductToFrontend(data));
    } catch (error: any) {
        console.error('Error creating product:', error.message);
        return res.status(500).json({ error: 'Failed to create product' });
    }
}

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
    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.status(204).send('');
        } catch (error: any) {
            console.error('Error deleting product:', error.message);
            return res.status(500).json({ error: 'Failed to delete product' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const updates = req.body;
            const dbUpdates = {
                ...updates,
                min_stock_level: updates.minStockLevel !== undefined ? updates.minStockLevel : updates.min_stock_level,
                tags: updates.tags !== undefined ? JSON.stringify(updates.tags) : updates.tags
            };

            // Remove camelCase fields that might be in the body
            delete (dbUpdates as any).minStockLevel;

            const { data, error } = await supabase
                .from('products')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return res.json(mapProductToFrontend(data));
        } catch (error: any) {
            console.error('Error updating product:', error.message);
            return res.status(500).json({ error: 'Failed to update product' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

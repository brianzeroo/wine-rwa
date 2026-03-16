import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
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

export default async function handler(req: any, res: any) {
    const { id } = req.query; // Slug/ID/Code from the URL

    if (req.method === 'GET') {
        try {
            // This is used for checking if a code is valid during checkout
            const { data, error } = await supabase
                .from('discount_codes')
                .select('*')
                .ilike('code', id as string)
                .eq('is_active', true)
                .maybeSingle();

            if (error || !data) {
                return res.status(404).json({ error: 'Discount code not found or inactive' });
            }
            return res.json(mapDiscountToFrontend(data));
        } catch (error: any) {
            console.error('Error fetching discount code:', error.message);
            return res.status(500).json({ error: 'Failed to fetch discount code' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { error } = await supabase
                .from('discount_codes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.status(204).send('');
        } catch (error: any) {
            console.error('Error deleting discount code:', error.message);
            return res.status(500).json({ error: 'Failed to delete discount code' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const updates = req.body;
            const { data, error } = await supabase
                .from('discount_codes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return res.json(updates);
        } catch (error: any) {
            console.error('Error updating discount code:', error.message);
            return res.status(500).json({ error: 'Failed to update discount code' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

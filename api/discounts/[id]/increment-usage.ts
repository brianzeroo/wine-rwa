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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        const { data: existing } = await supabase
            .from('discount_codes')
            .select('used_count')
            .eq('id', id)
            .maybeSingle();

        if (!existing) {
            return res.status(404).json({ error: 'Discount code not found' });
        }

        const { data, error } = await supabase
            .from('discount_codes')
            .update({ used_count: (existing.used_count || 0) + 1 })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return res.json(mapDiscountToFrontend(data));
    } catch (error: any) {
        console.error('Error incrementing usage:', error.message);
        return res.status(500).json({ error: 'Failed to increment usage' });
    }
}

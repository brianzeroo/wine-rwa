import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phone } = req.query;
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (error || !data) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        return res.json(data);
    } catch (error: any) {
        console.error('Error fetching customer by phone:', error.message);
        return res.status(500).json({ error: 'Failed to fetch customer' });
    }
}

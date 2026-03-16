import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('name');

            if (error) throw error;
            return res.json(data || []);
        } catch (error: any) {
            console.error('Error fetching customers:', error.message);
            return res.status(500).json({ error: 'Failed to fetch customers' });
        }
    }

    if (req.method === 'POST') {
        try {
            const customerData = req.body;
            const { data, error } = await supabase
                .from('customers')
                .insert(customerData)
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(data);
        } catch (error: any) {
            console.error('Error creating customer:', error.message);
            return res.status(500).json({ error: 'Failed to create customer' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

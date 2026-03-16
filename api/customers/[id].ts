import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    const { id } = req.query;

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error || !data) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            return res.json(data);
        } catch (error: any) {
            console.error('Error fetching customer:', error.message);
            return res.status(500).json({ error: 'Failed to fetch customer' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.status(204).send('');
        } catch (error: any) {
            console.error('Error deleting customer:', error.message);
            return res.status(500).json({ error: 'Failed to delete customer' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const updates = req.body;
            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return res.json(data);
        } catch (error: any) {
            console.error('Error updating customer:', error.message);
            return res.status(500).json({ error: 'Failed to update customer' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

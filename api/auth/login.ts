import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and password are required' });
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (error || !data) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        const isValid = await bcrypt.compare(password, data.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        return res.json({ user: { id: data.id, phone: data.phone, name: data.name } });
    } catch (error: any) {
        console.error('Login error:', error.message);
        return res.status(500).json({ error: 'Failed to login' });
    }
}

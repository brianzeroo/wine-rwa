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
        const { phone, password, name = 'User' } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and PIN are required' });
        }

        const { data: existing } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (existing) {
            return res.status(400).json({ error: 'User with this phone number already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = `user${Date.now()}`;
        const { data, error } = await supabase
            .from('users')
            .insert({ id: userId, phone, password: hashedPassword, name })
            .select()
            .single();

        if (error) throw error;

        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (!existingCustomer) {
            await supabase.from('customers').insert({
                id: `cust${Date.now()}`,
                name,
                email: `${phone}@placeholder.com`,
                phone,
                join_date: new Date().toISOString().split('T')[0]
            });
        }

        return res.status(201).json({ user: { id: userId, phone, name } });
    } catch (error: any) {
        console.error('Registration error:', error.message);
        return res.status(500).json({ error: 'Failed to register' });
    }
}

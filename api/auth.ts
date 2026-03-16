import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Consolidated User Auth API Handler
 * Handles: Login, Register
 * Security: Password hashing, Input validation, SQL Injection prevention (Supabase)
 */
export default async function handler(req: any, res: any) {
    const { url, method, body } = req;
    if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const path = url.split('?')[0];

    // --- Action: LOGIN ---
    if (path.endsWith('/login')) {
        try {
            const { phone, password } = body;

            // Input Validation
            if (!phone || typeof phone !== 'string' || !password || typeof password !== 'string') {
                return res.status(400).json({ error: 'Phone and password are required' });
            }

            // Database lookup
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('phone', phone)
                .maybeSingle();

            if (error || !data) {
                return res.status(401).json({ error: 'Invalid phone number or password' });
            }

            // Password Verification
            const isValid = await bcrypt.compare(password, data.password);
            if (!isValid) {
                console.warn(`[Security] Failed user login attempt for phone: ${phone}`);
                return res.status(401).json({ error: 'Invalid phone number or password' });
            }

            console.log(`[Security] User login successful: ${phone}`);
            return res.json({ user: { id: data.id, phone: data.phone, name: data.name } });

        } catch (error: any) {
            console.error('[Error] User login exception:', error.message);
            return res.status(500).json({ error: 'Failed to login' });
        }
    }

    // --- Action: REGISTER ---
    if (path.endsWith('/register')) {
        try {
            const { phone, password, name = 'User' } = body;

            // Input Validation
            if (!phone || typeof phone !== 'string' || !password || typeof password !== 'string') {
                return res.status(400).json({ error: 'Phone and password are required' });
            }

            // Check for existing user
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('phone', phone)
                .maybeSingle();

            if (existing) {
                return res.status(400).json({ error: 'An account with this phone number already exists' });
            }

            // Password Hashing
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // User Creation
            const userId = `user${Date.now()}`;
            const { data, error } = await supabase
                .from('users')
                .insert({ id: userId, phone, password: hashedPassword, name })
                .select()
                .single();

            if (error) throw error;

            // Optional: Link to/Create customer record
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
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

            console.log(`[Security] New user registered: ${phone}`);
            return res.status(201).json({ user: { id: userId, phone, name } });

        } catch (error: any) {
            console.error('[Error] Registration exception:', error.message);
            return res.status(500).json({ error: 'Failed to register' });
        }
    }

    return res.status(404).json({ error: 'Endpoint not found' });
}

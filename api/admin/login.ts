import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, error: 'Password is required' });
        }

        // 1. Fetch admin password from settings
        const { data, error } = await supabase
            .from('settings')
            .select('admin_password')
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            console.error('Database lookup failed or no settings found:', error);
            // If DB fails, we don't have a password to compare against.
            return res.status(500).json({ success: false, error: 'Authentication service unavailable' });
        }

        // 2. Verify password
        const isHashed = data.admin_password.startsWith('$2');
        let isValid = false;

        if (isHashed) {
            isValid = await bcrypt.compare(password, data.admin_password);
        } else {
            isValid = data.admin_password === password;
        }

        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Incorrect password' });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { role: 'admin', timestamp: Date.now() },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        // 4. Set Cookie (Vercel uses res.setHeader for cookies or res.cookie if using specialized helpers)
        // Since we want this to work in serverless, we'll use setHeader
        const cookieOptions = [
            `admin_token=${token}`,
            'HttpOnly',
            'Path=/',
            'SameSite=Strict',
            `Max-Age=${2 * 60 * 60}`,
            process.env.NODE_ENV === 'production' ? 'Secure' : ''
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', cookieOptions);

        return res.json({ success: true });

    } catch (error: any) {
        console.error('Admin login error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

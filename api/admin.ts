import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Consolidated Admin API Handler
 * Handles: Login, Logout, and Auth Check
 * Security: JWT, Cookies, Input Validation, Method Checking
 */
export default async function handler(req: any, res: any) {
    const { url, method } = req;

    // Determine the action from the URL
    // Rewrites map /api/admin/(.*) to /api/admin
    // In Vercel, the path is often in req.url or req.query
    const path = url.split('?')[0];

    // --- Action: LOGIN ---
    if (path.endsWith('/login')) {
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        try {
            const { password } = req.body;
            // Input Validation
            if (!password || typeof password !== 'string') {
                return res.status(400).json({ success: false, error: 'Valid password is required' });
            }

            // Database lookup (SQL injection safe via Supabase)
            const { data, error } = await supabase
                .from('settings')
                .select('admin_password')
                .limit(1)
                .maybeSingle();

            if (error || !data) {
                console.error('[Security] Admin login failed: Database error');
                return res.status(500).json({ success: false, error: 'Authentication service unavailable' });
            }

            // Password Verification
            const isHashed = data.admin_password.startsWith('$2');
            const isValid = isHashed
                ? await bcrypt.compare(password, data.admin_password)
                : data.admin_password === password;

            if (!isValid) {
                console.warn('[Security] Unauthorized admin login attempt');
                return res.status(401).json({ success: false, error: 'Incorrect password' });
            }

            // JWT Generation
            const token = jwt.sign(
                { role: 'admin', timestamp: Date.now() },
                JWT_SECRET,
                { expiresIn: '2h' }
            );

            // Secure Cookie Set
            const cookieOptions = [
                `admin_token=${token}`,
                'HttpOnly',
                'Path=/',
                'SameSite=Strict',
                `Max-Age=${2 * 60 * 60}`,
                process.env.NODE_ENV === 'production' ? 'Secure' : ''
            ].filter(Boolean).join('; ');

            res.setHeader('Set-Cookie', cookieOptions);
            console.log('[Security] Admin logged in successfully');
            return res.json({ success: true });

        } catch (error: any) {
            console.error('[Error] Admin login exception:', error.message);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // --- Action: LOGOUT ---
    if (path.endsWith('/logout')) {
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const cookieOptions = [
            'admin_token=',
            'HttpOnly',
            'Path=/',
            'SameSite=Strict',
            'Max-Age=0',
            'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
            process.env.NODE_ENV === 'production' ? 'Secure' : ''
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', cookieOptions);
        return res.json({ success: true });
    }

    // --- Action: CHECK-AUTH ---
    if (path.endsWith('/check-auth')) {
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

        try {
            // Authentication Check (Manual cookie parsing)
            const cookieHeader = req.headers.cookie;
            const token = cookieHeader
                ?.split(';')
                .find((c: string) => c.trim().startsWith('admin_token='))
                ?.split('=')[1];

            if (!token) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            // Token Verification
            const decoded = jwt.verify(token, JWT_SECRET) as any;

            // Authorization Check (RBAC)
            if (decoded.role !== 'admin') {
                console.warn('[Security] RBAC Violation: Non-admin attempted admin check');
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }

            return res.json({ success: true, admin: decoded });

        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, error: 'Session expired' });
            }
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }
    }

    return res.status(404).json({ error: 'Endpoint not found' });
}

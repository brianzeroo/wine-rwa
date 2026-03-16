import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Consolidated Settings API Handler
 * Handles: GET, PUT
 * Security: Admin auth required for BOTH operations, Password hashing
 */
export default async function handler(req: any, res: any) {
    const { method, body } = req;

    // Helper: Verify Admin Auth
    const verifyAdmin = async () => {
        const cookieHeader = req.headers.cookie;
        const token = cookieHeader?.split(';').find((c: string) => c.trim().startsWith('admin_token='))?.split('=')[1];
        if (!token) return null;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            return decoded.role === 'admin' ? decoded : null;
        } catch {
            return null;
        }
    };

    const admin = await verifyAdmin();
    if (!admin) {
        return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
    }

    try {
        if (method === 'GET') {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            const settings = data || {};

            return res.json({
                ...settings,
                isMaintenanceMode: !!settings.is_maintenance_mode,
                emailNotifications: !!settings.email_notifications,
                adminPassword: settings.admin_password // Note: Still returning hash as per original, but restricted to admin
            });
        }

        if (method === 'PUT') {
            const settings = body;
            let adminPasswordToStore = settings.adminPassword || 'admin123';

            // Hash password if it's not already hashed
            if (adminPasswordToStore && !adminPasswordToStore.startsWith('$2')) {
                const salt = await bcrypt.genSalt(10);
                adminPasswordToStore = await bcrypt.hash(adminPasswordToStore, salt);
            }

            const { data, error } = await supabase
                .from('settings')
                .update({
                    paypack_api_key: settings.paypackApiKey || '',
                    paypack_api_secret: settings.paypackApiSecret || '',
                    store_name: settings.storeName || 'Vintner & Spirit',
                    is_maintenance_mode: settings.isMaintenanceMode ? 1 : 0,
                    email_notifications: settings.emailNotifications ? 1 : 0,
                    admin_password: adminPasswordToStore
                })
                .eq('id', 1)
                .select()
                .single();

            if (error) throw error;
            console.log('[Security] Admin settings updated');
            return res.json(settings);
        }

    } catch (error: any) {
        console.error('[Error] Settings operation failed:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

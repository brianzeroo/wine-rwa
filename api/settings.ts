import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAdminAuth(req: any) {
    const cookieHeader = req.headers.cookie;
    const token = cookieHeader
        ?.split(';')
        .find((c: string) => c.trim().startsWith('admin_token='))
        ?.split('=')[1];

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.role === 'admin' ? decoded : null;
    } catch (err) {
        return null;
    }
}

export default async function handler(req: any, res: any) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .limit(1)
                .maybeSingle();

            const settings = data || {};
            return res.json({
                ...settings,
                isMaintenanceMode: !!settings.is_maintenance_mode,
                emailNotifications: !!settings.email_notifications,
                adminPassword: settings.admin_password
            });
        } catch (error: any) {
            console.error('Error fetching settings:', error.message);
            return res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    if (req.method === 'PUT') {
        const admin = await verifyAdminAuth(req);
        if (!admin) {
            return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
        }

        try {
            const settings = req.body;
            let adminPasswordToStore = settings.adminPassword || 'admin123';

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
            return res.json(settings);
        } catch (error: any) {
            console.error('Error updating settings:', error.message);
            return res.status(500).json({ error: 'Failed to update settings' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

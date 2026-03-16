import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_in_production';

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse cookies manually as Vercel doesn't always include cookie-parser
        const cookieHeader = req.headers.cookie;
        const token = cookieHeader
            ?.split(';')
            .find((c: string) => c.trim().startsWith('admin_token='))
            ?.split('=')[1];

        if (!token) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Forbidden: Admin privileges required' });
        }

        return res.json({ success: true, admin: decoded });

    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
}

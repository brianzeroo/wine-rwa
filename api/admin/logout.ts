
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

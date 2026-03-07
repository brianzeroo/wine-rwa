const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('Connecting to DB at:', process.env.DB_HOST);
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [cols] = await connection.query("SHOW COLUMNS FROM settings LIKE 'admin_password'");
        if (cols.length === 0) {
            await connection.query("ALTER TABLE settings ADD COLUMN admin_password VARCHAR(255) DEFAULT 'admin123' AFTER email_notifications");
            console.log('✅ Added admin_password column');
        } else {
            console.log('ℹ️ admin_password already exists');
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    } finally {
        await connection.end();
        process.exit(0);
    }
}

run().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});

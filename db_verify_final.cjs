const mysql = require('mysql2/promise');
require('dotenv').config();

async function verify() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vintner_spirit'
    });

    try {
        console.log('--- Products ---');
        const [products] = await connection.query('SELECT id, name, category, price FROM products ORDER BY created_at DESC LIMIT 5');
        console.log(JSON.stringify(products, null, 2));

        console.log('\n--- Discount Codes ---');
        const [discounts] = await connection.query('SELECT code, used_count FROM discount_codes ORDER BY created_at DESC LIMIT 5');
        console.log(JSON.stringify(discounts, null, 2));

        console.log('\n--- Orders ---');
        const [orders] = await connection.query('SELECT id, customer_name, final_total FROM orders ORDER BY date DESC LIMIT 5');
        console.log(JSON.stringify(orders, null, 2));

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await connection.end();
    }
}

verify();

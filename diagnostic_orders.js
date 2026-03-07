import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vintner_spirit'
};

async function test() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.query('SELECT id, customer_name, customer_phone, date, final_total FROM orders ORDER BY date DESC LIMIT 10');
        console.log('Recent Orders:');
        console.log(JSON.stringify(rows, null, 2));

        const [count] = await connection.query('SELECT COUNT(*) as count FROM orders');
        console.log('Total Orders:', count[0].count);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

test();

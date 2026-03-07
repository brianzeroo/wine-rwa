// Seed script to populate MySQL database with sample data
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vintner_spirit'
    });

    console.log('✅ Connected to database for seeding');

    // Insert sample products
    const products = [
      {
        id: 'w1',
        name: 'Château Margaux 2015',
        description: 'A legendary vintage from one of the most prestigious estates in Bordeaux. This wine offers an incredible depth of flavor with notes of blackcurrant, violet, and cedar.',
        price: 1600000,
        category: 'Wine',
        image: 'https://images.unsplash.com/photo-1510850477530-ce990e85c55e?auto=format&fit=crop&q=80&w=800',
        origin: 'Bordeaux, France',
        abv: '13.5%',
        year: 2015,
        stock: 10,
        min_stock_level: 3,
        tags: JSON.stringify(['premium', 'red-wine', 'bordeaux'])
      },
      {
        id: 'w2',
        name: 'Dom Pérignon Vintage 2012',
        description: 'The 2012 vintage is a powerhouse of energy and precision. A complex bouquet of white flowers, citrus, and stone fruit with a long, elegant finish.',
        price: 350000,
        category: 'Wine',
        image: 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&q=80&w=800',
        origin: 'Champagne, France',
        abv: '12.5%',
        year: 2012,
        stock: 20,
        min_stock_level: 5,
        tags: JSON.stringify(['champagne', 'sparkling', 'vintage'])
      },
      {
        id: 'l1',
        name: 'The Macallan 18 Year Old',
        description: 'Matured in sherry seasoned oak casks from Jerez, Spain. A rich and complex single malt with notes of dried fruits, ginger, and cinnamon.',
        price: 580000,
        category: 'Liquor',
        image: 'https://images.unsplash.com/photo-1527281473222-793895bf44f9?auto=format&fit=crop&q=80&w=800',
        origin: 'Speyside, Scotland',
        abv: '43%',
        stock: 15,
        min_stock_level: 2,
        tags: JSON.stringify(['whisky', 'scotch', 'aged'])
      },
      {
        id: 'l2',
        name: 'Clase Azul Reposado Tequila',
        description: 'An ultra-premium tequila made from 100% Blue Weber Agave. The iconic ceramic decanter is hand-painted, and the tequila is smooth with notes of vanilla and hazelnut.',
        price: 240000,
        category: 'Liquor',
        image: 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&q=80&w=800',
        origin: 'Jalisco, Mexico',
        abv: '40%',
        stock: 8,
        min_stock_level: 3,
        tags: JSON.stringify(['tequila', 'premium', 'mexico'])
      },
      {
        id: 'w3',
        name: 'Sassicaia 2018',
        description: 'The original Super Tuscan. A blend of Cabernet Sauvignon and Cabernet Franc that redefined Italian winemaking. Intense, structured, and perfectly balanced.',
        price: 410000,
        category: 'Wine',
        image: 'https://images.unsplash.com/photo-1553361371-9bb220269716?auto=format&fit=crop&q=80&w=800',
        origin: 'Tuscany, Italy',
        abv: '14%',
        year: 2018,
        stock: 12,
        min_stock_level: 4,
        tags: JSON.stringify(['italian', 'red-wine', 'super-tuscan'])
      },
      {
        id: 'l3',
        name: 'Hennessy X.O Cognac',
        description: 'The original "Extra Old" cognac. A powerful and balanced blend of over 100 eaux-de-vie, offering rich flavors of cocoa, spice, and dried fruit.',
        price: 270000,
        category: 'Liquor',
        image: 'https://images.unsplash.com/photo-1569158062037-d7234c5f7565?auto=format&fit=crop&q=80&w=800',
        origin: 'Cognac, France',
        abv: '40%',
        stock: 25,
        min_stock_level: 6,
        tags: JSON.stringify(['cognac', 'brandy', 'france'])
      }
    ];

    // Insert products
    for (const product of products) {
      await connection.query(
        'INSERT INTO products SET ? ON DUPLICATE KEY UPDATE name = VALUES(name)',
        product
      );
      console.log(`✓ Product added: ${product.name}`);
    }

    // Insert sample discount codes
    const discountCodes = [
      {
        id: 'disc1',
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        min_order_amount: 100000,
        start_date: '2024-01-01',
        end_date: '2025-12-31',
        is_active: true,
        usage_limit: 100,
        used_count: 0
      },
      {
        id: 'disc2',
        code: 'SAVE20000',
        type: 'fixed',
        value: 20000,
        min_order_amount: 200000,
        start_date: '2024-01-01',
        end_date: '2025-12-31',
        is_active: true,
        usage_limit: 50,
        used_count: 0
      }
    ];

    for (const code of discountCodes) {
      await connection.query(
        'INSERT INTO discount_codes SET ? ON DUPLICATE KEY UPDATE code = VALUES(code)',
        code
      );
      console.log(`✓ Discount code added: ${code.code}`);
    }

    // Insert sample test user
    await connection.query(`
      INSERT INTO users (id, email, password, name) 
      VALUES ('user1', 'test@example.com', 'password123', 'Test User')
      ON DUPLICATE KEY UPDATE email = VALUES(email)
    `);
    console.log('✓ Test user created: test@example.com / password123');

    await connection.end();
    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample data added:');
    console.log('- 6 products (wines & liquors)');
    console.log('- 2 discount codes (WELCOME10, SAVE20000)');
    console.log('- 1 test user (test@example.com / password123)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

import { getPool } from './src/database';

async function testProducts() {
  try {
    const pool = getPool();
    
    // Check table structure
    console.log('\n📋 Checking products table structure...');
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'vintner_spirit' 
      AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columns:', columns);
    
    // Try to insert a test product
    console.log('\n➕ Creating test product...');
    const testProduct = {
      id: 'test-' + Date.now(),
      name: 'Test Wine',
      description: 'A test product',
      price: 10000,
      category: 'Wine',
      image: 'https://example.com/test.jpg',
      origin: 'France',
      abv: '12%',
      year: 2020,
      stock: 10,
      min_stock_level: 5,
      tags: JSON.stringify(['test', 'wine'])
    };
    
    const [result] = await pool.query(
      'INSERT INTO products SET ?',
      testProduct
    );
    
    console.log('✅ Product created with ID:', (result as any).insertId);
    
    // Fetch all products
    console.log('\n📦 Fetching all products...');
    const [products] = await pool.query('SELECT * FROM products');
    console.log('Total products:', (products as any[]).length);
    console.log('Products:', JSON.stringify(products, null, 2));
    
    // Clean up test product
    console.log('\n🗑️ Cleaning up test product...');
    await pool.query('DELETE FROM products WHERE id LIKE ?', ['test-%']);
    console.log('✅ Test product deleted');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testProducts();

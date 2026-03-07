import { getPool } from './src/database';

async function checkCategories() {
  try {
    const pool = getPool();
    
    console.log('\n📋 Checking ALL products and their categories:\n');
    
    const [products] = await pool.query(`
      SELECT id, name, category, created_at 
      FROM products 
      ORDER BY created_at DESC
    `);
    
    console.table(products);
    
    // Check for any products that might have wrong category
    const wineProducts = (products as any[]).filter(p => p.category === 'Wine');
    const liquorProducts = (products as any[]).filter(p => p.category === 'Liquor');
    const otherCategory = (products as any[]).filter(p => !['Wine', 'Liquor'].includes(p.category));
    
    console.log('\n📊 Summary:');
    console.log(`Wine products: ${wineProducts.length}`);
    console.log(`Liquor products: ${liquorProducts.length}`);
    console.log(`Other/Unknown category: ${otherCategory.length}`);
    
    if (otherCategory.length > 0) {
      console.log('\n⚠️  Products with unknown category:');
      console.table(otherCategory);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCategories();

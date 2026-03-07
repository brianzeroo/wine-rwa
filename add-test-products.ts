import { getPool } from './src/database';

async function addTestProduct() {
  try {
    const pool = getPool();
    
    console.log('\n➕ Adding test products...\n');
    
    const products = [
      {
        id: 'wine-test-1',
        name: 'Premium Red Wine',
        description: 'A beautiful full-bodied red wine with notes of blackberry and oak',
        price: 85000,
        category: 'Wine',
        image: 'https://images.unsplash.com/photo-15108504777530-ce990e85c55e?auto=format&fit=crop&q=80&w=800',
        origin: 'Bordeaux, France',
        abv: '13.5%',
        year: 2018,
        stock: 15,
        min_stock_level: 5,
        tags: JSON.stringify(['red-wine', 'premium', 'bordeaux'])
      },
      {
        id: 'liquor-test-1',
        name: 'Aged Whiskey',
        description: 'Smooth and complex single malt whiskey aged for 12 years',
        price: 120000,
        category: 'Liquor',
        image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&q=80&w=800',
        origin: 'Scotland',
        abv: '40%',
        year: 2012,
        stock: 8,
        min_stock_level: 3,
        tags: JSON.stringify(['whiskey', 'aged', 'scotch'])
      },
      {
        id: 'wine-test-2',
        name: 'Crisp White Wine',
        description: 'Light and refreshing white wine with citrus notes',
        price: 45000,
        category: 'Wine',
        image: 'https://images.unsplash.com/photo-1572569666013-3b78a2a2e601?auto=format&fit=crop&q=80&w=800',
        origin: 'Napa Valley, USA',
        abv: '12%',
        year: 2021,
        stock: 20,
        min_stock_level: 8,
        tags: JSON.stringify(['white-wine', 'crisp', 'summer'])
      }
    ];
    
    for (const product of products) {
      try {
        // Delete if exists
        await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
        
        // Insert product
        const [result] = await pool.query('INSERT INTO products SET ?', product);
        console.log(`✅ Added: ${product.name} (${product.category})`);
      } catch (error: any) {
        console.error(`❌ Failed to add ${product.name}:`, error.message);
      }
    }
    
    // Fetch all products to verify
    console.log('\n📦 All products in database:');
    const [allProducts] = await pool.query('SELECT id, name, category, price, stock FROM products ORDER BY category, name');
    console.table(allProducts);
    
    await pool.end();
    console.log('\n✅ Test products added successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestProduct();

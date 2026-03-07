import { getPool } from './src/database';

async function migrateDatabase() {
  try {
    const pool = getPool();
    
    console.log('🔄 Migrating database schema...');
    
    // Alter products table to use TEXT for image column
    console.log('\n📝 Updating products table...');
    await pool.query(`
      ALTER TABLE products 
      MODIFY COLUMN image TEXT
    `);
    console.log('✅ Image column changed to TEXT');
    
    // Verify the change
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'vintner_spirit' 
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'image'
    `);
    
    console.log('\n📋 New column structure:', columns);
    
    await pool.end();
    console.log('\n✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();

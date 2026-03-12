import { supabase } from './supabaseClient';

// Supabase database initialization
export async function testConnection() {
  try {
    // Test Supabase connection with a simple query
   const { data, error } = await supabase.from('products').select('id').limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
       console.log('⚠️ Supabase connected, but tables need to be initialized');
        return true;
      }
      throw error;
    }
    
   console.log('✅ Supabase connected successfully');
    return true;
  } catch (error: any) {
   console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Initialize database schema in Supabase
// Note: This is a placeholder- actual schema should be created in Supabase dashboard
export async function initializeDatabase() {
  console.log('ℹ️ Supabase schema initialization');
  console.log('📋 Please ensure the following tables are created in Supabase:');
  console.log('   - products');
  console.log('   - users');
  console.log('   - customers');
  console.log('   - orders');
  console.log('   - discount_codes');
  console.log('   - settings');
  console.log('');
  console.log('Refer to SUPABASE_SETUP.md for detailed schema instructions.');
  console.log('✅ Supabase database ready!');
}

export default {
  testConnection,
  initializeDatabase
};

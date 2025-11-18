require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');
    
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    console.log('✓ Database URL found');
    
    // Check current count
    const beforeCount = await sql`SELECT COUNT(*) as count FROM composite_rates`;
    console.log(`📊 Current records: ${beforeCount[0].count}`);
    
    // Delete all records
    const result = await sql`DELETE FROM composite_rates`;
    console.log(`✅ Deleted all records`);
    
    // Verify
    const afterCount = await sql`SELECT COUNT(*) as count FROM composite_rates`;
    console.log(`📊 Remaining records: ${afterCount[0].count}`);
    
    console.log('\n✨ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();


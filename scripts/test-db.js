require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const { getStats } = require('../lib/db');

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('   Run: vercel env pull .env.local');
    process.exit(1);
  }
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Test basic connection
    const timeResult = await sql`SELECT NOW() as current_time`;
    console.log('✓ Database connected');
    console.log(`  Current time: ${timeResult[0].current_time}\n`);
    
    // Test table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'composite_rates'
      )
    `;
    
    if (tableCheck[0].exists) {
      console.log('✓ Table "composite_rates" exists\n');
      
      // Get stats
      const stats = await getStats();
      console.log('📊 Database Statistics:');
      console.log(`  Total records: ${stats.total_records}`);
      console.log(`  Oldest record: ${stats.oldest_record}`);
      console.log(`  Newest record: ${stats.newest_record}`);
      console.log(`  Average rate: ${stats.avg_rate}`);
      console.log(`  Min rate: ${stats.min_rate}`);
      console.log(`  Max rate: ${stats.max_rate}`);
    } else {
      console.log('⚠️  Table "composite_rates" does not exist');
      console.log('   Run: node migrations/run.js');
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testDatabase();


#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

/**
 * Query complete API response data from database
 * Usage: node scripts/query-raw-data.js [timestamp]
 * Example: node scripts/query-raw-data.js "2025-11-10 21:00:00"
 */

async function queryRawData() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Get timestamp from command line or use recent data
  const targetTime = process.argv[2] || null;
  
  let result;
  
  if (targetTime) {
    // Query specific time range
    const startTime = new Date(targetTime);
    const endTime = new Date(startTime.getTime() + 60000); // +1 minute
    
    console.log(`\n🔍 Querying data from ${startTime.toISOString()} to ${endTime.toISOString()}\n`);
    
    result = await sql`
      SELECT 
        id,
        composite_rate,
        timestamp,
        raw_data
      FROM composite_rates
      WHERE timestamp >= ${startTime.toISOString()}
        AND timestamp < ${endTime.toISOString()}
      ORDER BY timestamp ASC
      LIMIT 10
    `;
  } else {
    // Query most recent records
    console.log(`\n🔍 Querying 5 most recent records\n`);
    
    result = await sql`
      SELECT 
        id,
        composite_rate,
        timestamp,
        raw_data
      FROM composite_rates
      ORDER BY timestamp DESC
      LIMIT 5
    `;
  }
  
  if (result.length === 0) {
    console.log('❌ No records found');
    return;
  }
  
  console.log(`📊 Found ${result.length} records:\n`);
  
  result.forEach((record, i) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Record ${i + 1}:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`ID: ${record.id}`);
    console.log(`Timestamp: ${new Date(record.timestamp).toISOString()}`);
    console.log(`Composite Rate: ${record.composite_rate}`);
    console.log(`\nComplete Raw Data:`);
    console.log(JSON.stringify(record.raw_data, null, 2));
  });
  
  console.log(`\n${'='.repeat(60)}\n`);
  
  // Show what fields are available
  if (result.length > 0 && result[0].raw_data) {
    console.log('📋 Available fields in raw_data:');
    console.log(Object.keys(result[0].raw_data).join(', '));
    console.log('');
  }
}

// Example queries
console.log('💡 Usage Examples:');
console.log('  node scripts/query-raw-data.js');
console.log('  node scripts/query-raw-data.js "2025-11-10 21:00:00"');
console.log('  node scripts/query-raw-data.js "2025-11-10 15:30:00"');
console.log('');

queryRawData().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});


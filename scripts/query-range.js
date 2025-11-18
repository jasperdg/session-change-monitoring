#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function queryRange(startTime, endTime) {
  const sql = neon(process.env.DATABASE_URL);
  
  if (!startTime || !endTime) {
    console.error('\n❌ Error: Start time and end time are required\n');
    console.log('Usage: node scripts/query-range.js "YYYY-MM-DD HH:MM:SS" "YYYY-MM-DD HH:MM:SS"');
    console.log('Example: node scripts/query-range.js "2025-11-11 00:59:55" "2025-11-11 01:00:20"\n');
    process.exit(1);
  }
  
  try {
    console.log(`\n🔍 Querying database for entries between ${startTime} and ${endTime}...\n`);
    
    const entries = await sql`
      SELECT 
        id,
        composite_rate,
        active_session,
        session_weight,
        reference_weight,
        timestamp,
        sources_used,
        created_at,
        raw_data
      FROM composite_rates
      WHERE timestamp >= ${startTime}::timestamptz
        AND timestamp <= ${endTime}::timestamptz
      ORDER BY timestamp ASC
    `;
    
    if (entries.length === 0) {
      console.log('❌ No entries found in this time range.\n');
      return;
    }
    
    console.log(`✅ Found ${entries.length} entries:\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    entries.forEach((entry, index) => {
      console.log(`Entry #${index + 1}:`);
      console.log(`  ID: ${entry.id}`);
      console.log(`  Timestamp: ${entry.timestamp}`);
      console.log(`  Composite Rate: ${entry.composite_rate}`);
      console.log(`  Active Session: ${entry.active_session || 'N/A'}`);
      console.log(`  Session Weight: ${entry.session_weight || 'N/A'}`);
      console.log(`  Reference Weight: ${entry.reference_weight || 'N/A'}`);
      if (entry.sources_used && entry.sources_used.length > 0) {
        console.log(`  Sources Used:`);
        entry.sources_used.forEach(source => {
          console.log(`    - ${source}`);
        });
      }
      if (entry.raw_data) {
        console.log(`  Raw Data:`);
        console.log(JSON.stringify(entry.raw_data, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
      }
      console.log(`  ---`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log(`📊 Summary:`);
    console.log(`  Total entries: ${entries.length}`);
    
    const rates = entries.map(e => parseFloat(e.composite_rate));
    const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const rateRange = maxRate - minRate;
    
    console.log(`  Average composite rate: ${avgRate.toFixed(5)}`);
    console.log(`  Min composite rate: ${minRate.toFixed(5)}`);
    console.log(`  Max composite rate: ${maxRate.toFixed(5)}`);
    console.log(`  Rate range: ${rateRange.toFixed(5)}`);
    
    // Count by session
    const sessionCounts = {};
    entries.forEach(e => {
      const session = e.active_session || 'Unknown';
      sessionCounts[session] = (sessionCounts[session] || 0) + 1;
    });
    
    console.log(`  Sessions:`);
    Object.entries(sessionCounts).forEach(([session, count]) => {
      console.log(`    - ${session}: ${count} entries`);
    });
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const startTime = args[0];
const endTime = args[1];

queryRange(startTime, endTime);


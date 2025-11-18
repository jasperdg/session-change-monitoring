require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running database migration...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('   Run: vercel env pull .env.local');
    process.exit(1);
  }
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Run all migration files in order
    const migrationFiles = ['001_init.sql', '002_add_raw_data.sql'];
    
    for (const migrationFile of migrationFiles) {
      console.log(`\n📄 Running ${migrationFile}...`);
      
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, migrationFile),
        'utf8'
      );
      
      // Split by semicolon and run each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        await sql(statement);
        console.log('✓ Executed statement');
      }
      
      console.log(`✅ ${migrationFile} complete!`);
    }
    
    console.log('\n🎉 All migrations complete!');
    console.log('\nTesting connection...');
    
    const result = await sql`SELECT COUNT(*) as count FROM composite_rates`;
    console.log(`✓ Table has ${result[0].count} records`);
    
    // Verify raw_data column exists
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'composite_rates'
      ORDER BY ordinal_position
    `;
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

runMigration();


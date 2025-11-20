const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Query to get all tables that have the composite_rate column (indicating they're data tables)
    const result = await sql`
      SELECT DISTINCT t.table_name
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.column_name = 'composite_rate'
      ORDER BY t.table_name
    `;
    
    const tables = result.map(row => row.table_name);
    
    res.json({
      success: true,
      tables,
      count: tables.length
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tables',
      message: error.message 
    });
  }
};


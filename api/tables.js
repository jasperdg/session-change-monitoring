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
    // Query to get all tables that match the pattern (have similar schema)
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name LIKE '%composite%'
      ORDER BY table_name
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


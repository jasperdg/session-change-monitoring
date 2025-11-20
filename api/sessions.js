/**
 * API endpoint to get session configuration for a specific table
 */

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { table } = req.query;
    
    if (!table) {
      return res.status(400).json({ error: 'Missing table parameter' });
    }
    
    // Read sessions config
    const configPath = path.join(process.cwd(), 'config', 'sessions.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const sessionsConfig = JSON.parse(configData);
    
    // Get config for specific table, or use default
    const tableConfig = sessionsConfig[table] || sessionsConfig['_default'];
    
    res.status(200).json({
      table,
      asset_name: tableConfig.asset_name,
      sessions: tableConfig.sessions
    });
    
  } catch (error) {
    console.error('Error loading session config:', error);
    res.status(500).json({ 
      error: 'Failed to load session configuration',
      message: error.message 
    });
  }
};


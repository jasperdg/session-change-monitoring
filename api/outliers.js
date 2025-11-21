const { getDailyOutliers } = require('../lib/db');
const fs = require('fs');
const path = require('path');

function apiLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logData = { timestamp, level, component: 'api-outliers', message, ...data };
  console.log(JSON.stringify(logData));
}

module.exports = async (req, res) => {
  const requestStart = Date.now();
  const requestId = req.headers['x-vercel-id'] || 'unknown';
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { table, date } = req.query;
    
    if (!date) {
      apiLog('warn', 'Missing date parameter', { requestId });
      return res.status(400).json({ 
        error: 'Missing required parameter: date (format: YYYY-MM-DD)' 
      });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      apiLog('warn', 'Invalid date format', { requestId, date });
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }
    
    const tableName = table || 'composite_rates';
    
    // Load timezone from sessions config
    let timezone = 'UTC';
    try {
      const configPath = path.join(process.cwd(), 'config', 'sessions.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      const assetConfig = config[tableName] || config['_default'] || {};
      timezone = assetConfig.timezone || 'UTC';
    } catch (error) {
      apiLog('warn', 'Failed to load timezone from config, using UTC', { error: error.message });
    }
    
    apiLog('info', 'Outliers request received', {
      requestId,
      table: tableName,
      date,
      timezone,
      userAgent: req.headers['user-agent']
    });
    
    const outliers = await getDailyOutliers(tableName, date, timezone);
    
    const duration = Date.now() - requestStart;
    apiLog('info', 'Outliers request successful', {
      requestId,
      duration_ms: duration,
      date,
      hasLowest: !!outliers.lowest,
      hasHighest: !!outliers.highest,
      lowestRate: outliers.lowest?.peak?.composite_rate,
      highestRate: outliers.highest?.peak?.composite_rate,
      lowestContextCount: outliers.lowest?.context?.length || 0,
      highestContextCount: outliers.highest?.context?.length || 0
    });
    
    res.json(outliers);
  } catch (error) {
    const duration = Date.now() - requestStart;
    apiLog('error', 'Outliers request failed', {
      requestId,
      duration_ms: duration,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch outliers',
      message: error.message 
    });
  }
};


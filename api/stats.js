const { getUpdateCounts, getStats } = require('../lib/db');

function apiLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logData = { timestamp, level, component: 'api-stats', message, ...data };
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
    apiLog('info', 'Stats request received', { requestId });
    
    const [counts, stats] = await Promise.all([
      getUpdateCounts(),
      getStats()
    ]);
    
    const duration = Date.now() - requestStart;
    apiLog('info', 'Stats request successful', {
      requestId,
      duration_ms: duration,
      counts
    });
    
    res.json({
      counts: {
        last_2min: parseInt(counts.count_2min),
        last_hour: parseInt(counts.count_1hour),
        last_day: parseInt(counts.count_1day),
        total: parseInt(counts.count_total)
      },
      stats: {
        total_records: parseInt(stats.total_records),
        oldest_record: stats.oldest_record,
        newest_record: stats.newest_record,
        average_rate: parseFloat(stats.average_rate)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const duration = Date.now() - requestStart;
    apiLog('error', 'Stats request failed', {
      requestId,
      duration_ms: duration,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      message: error.message 
    });
  }
};


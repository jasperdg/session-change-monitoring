const { getRecentRates } = require('../lib/db');

function apiLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logData = { timestamp, level, component: 'api-history', message, ...data };
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
    const limit = parseInt(req.query.limit) || 500;
    const timeRange = req.query.range; // 2min, 1hour, 1day, 1week
    const startTime = req.query.start;  // Optional: specific start timestamp
    const endTime = req.query.end;      // Optional: specific end timestamp
    
    apiLog('info', 'History request received', {
      requestId,
      limit,
      timeRange,
      startTime,
      endTime,
      userAgent: req.headers['user-agent']
    });
    
    // Allow higher limits for time-based queries (timeRange OR start/end) since we'll downsample anyway
    const hasTimeQuery = !!(timeRange || (startTime && endTime));
    const maxLimit = hasTimeQuery ? 100000 : 10000;
    if (limit < 1 || limit > maxLimit) {
      apiLog('warn', 'Invalid limit parameter', { limit, requestId, maxLimit, hasTimeQuery });
      return res.status(400).json({ 
        error: `Invalid limit. Must be between 1 and ${maxLimit}` 
      });
    }
    
    let history = await getRecentRates(limit, timeRange, startTime, endTime);
    
    // Downsampling logic:
    // - IF querying broad time range (1day, 1week): downsample to 1000 points
    // - IF zooming (specific start/end times): NO downsampling, return ALL data
    const MAX_CHART_POINTS = 1000;
    let downsampledData = history;
    let samplingRate = 1;
    const isZoomQuery = !!(startTime && endTime);
    
    if (!isZoomQuery && history.length > MAX_CHART_POINTS) {
      // Only downsample for broad time range queries
      const reversedHistory = [...history].reverse();
      samplingRate = Math.ceil(history.length / MAX_CHART_POINTS);
      const sampled = reversedHistory.filter((_, index) => index % samplingRate === 0);
      downsampledData = sampled.reverse();
      
      apiLog('info', 'Downsampled data for chart performance', {
        originalCount: history.length,
        downsampledCount: downsampledData.length,
        samplingRate,
        oldestTimestamp: downsampledData[downsampledData.length - 1]?.timestamp,
        newestTimestamp: downsampledData[0]?.timestamp
      });
    } else if (isZoomQuery) {
      apiLog('info', 'Zoom query - returning full granular data', {
        dataPoints: history.length,
        startTime,
        endTime
      });
    }
    
    const duration = Date.now() - requestStart;
    apiLog('info', 'History request successful', {
      requestId,
      duration_ms: duration,
      recordCount: downsampledData.length,
      originalCount: history.length,
      limit,
      timeRange,
      downsampled: history.length > MAX_CHART_POINTS
    });
    
    res.json({
      count: downsampledData.length,
      data: downsampledData,
      range: timeRange || 'limit',
      timestamp: new Date().toISOString(),
      originalCount: history.length,
      downsampled: history.length > MAX_CHART_POINTS,
      samplingRate
    });
  } catch (error) {
    const duration = Date.now() - requestStart;
    apiLog('error', 'History request failed', {
      requestId,
      duration_ms: duration,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch history',
      message: error.message 
    });
  }
};


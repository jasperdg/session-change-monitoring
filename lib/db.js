const { neon } = require('@neondatabase/serverless');

// Initialize the Neon client
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

function dbLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logData = { timestamp, level, component: 'db', message, ...data };
  console.log(JSON.stringify(logData));
}

/**
 * Save a composite rate result to the database
 * @param {Object} data - The data from SEDA API
 */
async function saveCompositeRate(data) {
  if (!data) {
    dbLog('warn', 'No data provided to saveCompositeRate');
    return;
  }
  
  const { composite_rate, active_session, weights, timestamp, sources_used, _fullApiResponse } = data;
  
  if (!composite_rate || !timestamp) {
    dbLog('error', 'Missing required fields for save', { 
      hasCompositeRate: !!composite_rate, 
      hasTimestamp: !!timestamp,
      receivedData: data
    });
    throw new Error('saveCompositeRate: Missing required fields');
  }
  
  // Store the complete API response if available, otherwise store the data itself
  const rawDataToStore = _fullApiResponse || data;
  
  // DEBUG: Log what we're storing
  dbLog('debug', '📦 Storing to database', {
    hasFullApiResponse: !!_fullApiResponse,
    rawDataKeys: Object.keys(rawDataToStore),
    rawDataSize: JSON.stringify(rawDataToStore).length
  });
  
  const startTime = Date.now();
  try {
    await sql`
      INSERT INTO composite_rates (
        composite_rate, 
        active_session, 
        session_weight, 
        reference_weight, 
        timestamp, 
        sources_used,
        raw_data
      ) VALUES (
        ${parseFloat(composite_rate)},
        ${active_session || null},
        ${weights?.session || null},
        ${weights?.reference || null},
        ${timestamp},
        ${sources_used || []},
        ${JSON.stringify(rawDataToStore)}
      )
    `;
    
    const duration = Date.now() - startTime;
    
    // Only log if slow (> 500ms)
    if (duration > 500) {
      dbLog('warn', 'Slow database insert', {
        duration_ms: duration,
        composite_rate
      });
    }
    
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    dbLog('error', 'Database save failed', {
      duration_ms: duration,
      error: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      data: { composite_rate, active_session, timestamp }
    });
    throw error;
  }
}

/**
 * Validate and sanitize table name to prevent SQL injection
 * @param {string} tableName - The table name to validate
 * @returns {string} Sanitized table name
 */
function validateTableName(tableName) {
  if (!tableName) {
    return 'composite_rates'; // Default table
  }
  
  // Only allow alphanumeric characters, underscores, and hyphens
  // This prevents SQL injection
  const sanitized = tableName.replace(/[^a-zA-Z0-9_-]/g, '');
  
  if (sanitized !== tableName) {
    throw new Error('Invalid table name: only alphanumeric, underscore, and hyphen characters allowed');
  }
  
  return sanitized;
}

/**
 * Get recent composite rates from the database
 * @param {number} limit - Maximum number of records to return
 * @param {string} timeRange - Time range filter (2min, 1hour, 1day, 1week)
 * @param {string} startTimeParam - Optional specific start timestamp for zoom queries
 * @param {string} endTimeParam - Optional specific end timestamp for zoom queries
 * @param {string} tableName - Optional table name (defaults to 'composite_rates')
 * @returns {Promise<Array>} Array of composite rate records
 */
async function getRecentRates(limit = 500, timeRange = null, startTimeParam = null, endTimeParam = null, tableName = 'composite_rates') {
  const queryStart = Date.now();
  try {
    // Validate and sanitize table name
    const safeTableName = validateTableName(tableName);
    
    dbLog('info', 'Fetching recent rates', { limit, timeRange, startTimeParam, endTimeParam, tableName: safeTableName });
    let result;

    // If specific time range is provided (for zoom), use that instead
    // DON'T apply LIMIT for zoom queries - we want ALL data in that precise range
    if (startTimeParam && endTimeParam) {
      // Using string interpolation for table name (already validated) - cannot use parameterized query for table names
      const query = `
        SELECT
          id,
          composite_rate,
          active_session,
          session_weight,
          reference_weight,
          timestamp,
          created_at,
          raw_data
        FROM ${safeTableName}
        WHERE timestamp >= $1
          AND timestamp <= $2
        ORDER BY timestamp DESC
      `;
      result = await sql(query, [startTimeParam, endTimeParam]);
    } else if (timeRange) {
      // Time-based query - DON'T use LIMIT, get ALL records in time range
      if (timeRange === '2min') {
        const query = `
          SELECT 
            id,
            composite_rate,
            active_session,
            session_weight,
            reference_weight,
            timestamp,
            created_at,
            raw_data
          FROM ${safeTableName}
          WHERE timestamp >= NOW() - INTERVAL '2 minutes'
          ORDER BY timestamp DESC
        `;
        result = await sql(query);
      } else if (timeRange === '1hour') {
        const query = `
          SELECT 
            id,
            composite_rate,
            active_session,
            session_weight,
            reference_weight,
            timestamp,
            created_at,
            raw_data
          FROM ${safeTableName}
          WHERE timestamp >= NOW() - INTERVAL '1 hour'
          ORDER BY timestamp DESC
        `;
        result = await sql(query);
      } else if (timeRange === '1day') {
        const query = `
          SELECT 
            id,
            composite_rate,
            active_session,
            session_weight,
            reference_weight,
            timestamp,
            created_at,
            raw_data
          FROM ${safeTableName}
          WHERE timestamp >= NOW() - INTERVAL '1 day'
          ORDER BY timestamp DESC
        `;
        result = await sql(query);
      } else if (timeRange === '1week') {
        const query = `
          SELECT 
            id,
            composite_rate,
            active_session,
            session_weight,
            reference_weight,
            timestamp,
            created_at,
            raw_data
          FROM ${safeTableName}
          WHERE timestamp >= NOW() - INTERVAL '7 days'
          ORDER BY timestamp DESC
        `;
        result = await sql(query);
      } else {
        // Default to 1 hour for invalid ranges
        const query = `
          SELECT 
            id,
            composite_rate,
            active_session,
            session_weight,
            reference_weight,
            timestamp,
            created_at,
            raw_data
          FROM ${safeTableName}
          WHERE timestamp >= NOW() - INTERVAL '1 hour'
          ORDER BY timestamp DESC
        `;
        result = await sql(query);
      }
    } else {
      // Limit-based query
      const query = `
        SELECT 
          id,
          composite_rate,
          active_session,
          session_weight,
          reference_weight,
          timestamp,
          created_at,
          raw_data
        FROM ${safeTableName}
        ORDER BY timestamp DESC
        LIMIT $1
      `;
      result = await sql(query, [limit]);
    }
    
    const duration = Date.now() - queryStart;
    dbLog('info', 'Successfully fetched recent rates', {
      duration_ms: duration,
      rowCount: result.length,
      limit,
      timeRange,
      hasSpecificRange: !!(startTimeParam && endTimeParam)
    });
    
    return result;  // Neon returns array directly, not result.rows
  } catch (error) {
    const duration = Date.now() - queryStart;
    dbLog('error', 'Database query error', {
      duration_ms: duration,
      error: error.message,
      stack: error.stack,
      limit,
      timeRange
    });
    throw error;
  }
}

/**
 * Delete old records to maintain database size
 * @param {number} days - Keep records from last N days
 */
async function cleanupOldRecords(days = 7) {
  try {
    const result = await sql`
      DELETE FROM composite_rates
      WHERE timestamp < NOW() - INTERVAL '${days} days'
    `;
    
    // Neon returns array length for DELETE queries
    const rowCount = result.length || 0;
    console.log(`Cleaned up ${rowCount} old records`);
    return rowCount;
  } catch (error) {
    console.error('Database cleanup error:', error.message);
    throw error;
  }
}

/**
 * Get statistics about stored data
 */
async function getStats() {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total_records,
        MIN(timestamp) as oldest_record,
        MAX(timestamp) as newest_record,
        AVG(composite_rate) as average_rate,
        MIN(composite_rate) as min_rate,
        MAX(composite_rate) as max_rate
      FROM composite_rates
    `;
    
    return result[0];  // Neon returns array directly, not result.rows
  } catch (error) {
    console.error('Database stats error:', error.message);
    throw error;
  }
}

/**
 * Get count of updates by time range
 * @returns {Promise<Object>} Update counts for different time ranges
 */
async function getUpdateCounts() {
  const startTime = Date.now();
  try {
    const result = await sql`
      SELECT 
        (SELECT COUNT(*) FROM composite_rates WHERE timestamp >= NOW() - INTERVAL '2 minutes') as count_2min,
        (SELECT COUNT(*) FROM composite_rates WHERE timestamp >= NOW() - INTERVAL '1 hour') as count_1hour,
        (SELECT COUNT(*) FROM composite_rates WHERE timestamp >= NOW() - INTERVAL '1 day') as count_1day,
        (SELECT COUNT(*) FROM composite_rates) as count_total
    `;
    
    const duration = Date.now() - startTime;
    dbLog('info', 'Successfully fetched update counts', {
      duration_ms: duration,
      counts: result[0]
    });
    
    return result[0];
  } catch (error) {
    const duration = Date.now() - startTime;
    dbLog('error', 'Update counts query failed', {
      duration_ms: duration,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Get daily outliers (min and max composite_rate) with surrounding context
 * @param {string} tableName - Table name to query
 * @param {string} date - Date string in YYYY-MM-DD format (in specified timezone)
 * @param {string} timezone - IANA timezone string (e.g., 'America/New_York')
 * @returns {Promise<Object>} Object with lowest and highest peaks with context
 */
async function getDailyOutliers(tableName = 'composite_rates', date, timezone = 'UTC') {
  const queryStart = Date.now();
  try {
    const safeTableName = validateTableName(tableName);
    
    dbLog('info', 'Fetching daily outliers', { tableName: safeTableName, date, timezone });
    
    // Parse date and get start/end of day in the specified timezone, then convert to UTC
    // We need to find what UTC time corresponds to midnight in the local timezone
    const [year, month, day] = date.split('-').map(Number);
    
    // Create a date string for the start of day in local timezone
    const startLocalStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
    const endLocalStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999`;
    
    // Convert to UTC by creating date object and using toLocaleString to determine offset
    const testDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const localHourString = testDate.toLocaleString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit'
    });
    const localHour = parseInt(localHourString);
    const utcOffset = 12 - localHour; // Hours to add to local time to get UTC
    
    // Calculate start and end of day in UTC
    const startOfDay = new Date(Date.UTC(year, month - 1, day, utcOffset, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, utcOffset + 23, 59, 59, 999));
    
    // Find the records with min and max composite_rate for the day
    const minMaxQuery = `
      WITH day_data AS (
        SELECT 
          id, 
          composite_rate, 
          active_session,
          session_weight,
          reference_weight,
          timestamp,
          created_at,
          raw_data
        FROM ${safeTableName}
        WHERE timestamp >= $1 AND timestamp <= $2
      )
      SELECT 
        (SELECT row_to_json(t) FROM (
          SELECT * FROM day_data ORDER BY composite_rate ASC LIMIT 1
        ) t) as lowest,
        (SELECT row_to_json(t) FROM (
          SELECT * FROM day_data ORDER BY composite_rate DESC LIMIT 1
        ) t) as highest
    `;
    
    const minMaxResult = await sql(minMaxQuery, [startOfDay.toISOString(), endOfDay.toISOString()]);
    
    if (!minMaxResult || minMaxResult.length === 0 || (!minMaxResult[0].lowest && !minMaxResult[0].highest)) {
      dbLog('info', 'No data found for date', { date });
      return {
        date,
        lowest: null,
        highest: null
      };
    }
    
    const lowestPeak = minMaxResult[0].lowest;
    const highestPeak = minMaxResult[0].highest;
    
    // Get context data (1 minute before and after) for each peak
    let lowestContext = [];
    let highestContext = [];
    
    if (lowestPeak) {
      const lowestTimestamp = new Date(lowestPeak.timestamp);
      const lowestStart = new Date(lowestTimestamp.getTime() - 60000); // 1 minute before
      const lowestEnd = new Date(lowestTimestamp.getTime() + 60000);   // 1 minute after
      
      const lowestContextQuery = `
        SELECT 
          id, 
          composite_rate, 
          active_session,
          session_weight,
          reference_weight,
          timestamp,
          created_at,
          raw_data
        FROM ${safeTableName}
        WHERE timestamp >= $1 AND timestamp <= $2
        ORDER BY timestamp ASC
      `;
      
      lowestContext = await sql(lowestContextQuery, [lowestStart.toISOString(), lowestEnd.toISOString()]);
    }
    
    if (highestPeak) {
      const highestTimestamp = new Date(highestPeak.timestamp);
      const highestStart = new Date(highestTimestamp.getTime() - 60000); // 1 minute before
      const highestEnd = new Date(highestTimestamp.getTime() + 60000);   // 1 minute after
      
      const highestContextQuery = `
        SELECT 
          id, 
          composite_rate, 
          active_session,
          session_weight,
          reference_weight,
          timestamp,
          created_at,
          raw_data
        FROM ${safeTableName}
        WHERE timestamp >= $1 AND timestamp <= $2
        ORDER BY timestamp ASC
      `;
      
      highestContext = await sql(highestContextQuery, [highestStart.toISOString(), highestEnd.toISOString()]);
    }
    
    const duration = Date.now() - queryStart;
    dbLog('info', 'Daily outliers fetched', {
      duration_ms: duration,
      date,
      lowestRate: lowestPeak?.composite_rate,
      highestRate: highestPeak?.composite_rate,
      lowestContextCount: lowestContext.length,
      highestContextCount: highestContext.length
    });
    
    return {
      date,
      lowest: lowestPeak ? {
        peak: lowestPeak,
        context: lowestContext
      } : null,
      highest: highestPeak ? {
        peak: highestPeak,
        context: highestContext
      } : null
    };
    
  } catch (error) {
    const duration = Date.now() - queryStart;
    dbLog('error', 'Failed to fetch daily outliers', {
      duration_ms: duration,
      error: error.message,
      stack: error.stack,
      date,
      tableName
    });
    throw error;
  }
}

module.exports = {
  saveCompositeRate,
  getRecentRates,
  cleanupOldRecords,
  getStats,
  getUpdateCounts,
  validateTableName,
  getDailyOutliers
};


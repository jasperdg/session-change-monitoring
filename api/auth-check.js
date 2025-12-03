/**
 * GET /api/auth-check
 * Checks if the dashboard_auth cookie exists
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies from the request
    const cookieHeader = req.headers.cookie || '';
    const cookies = {};
    
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });

    const isAuthenticated = cookies.dashboard_auth === 'authenticated';

    return res.status(200).json({ authenticated: isAuthenticated });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ authenticated: false, error: 'Server error' });
  }
};


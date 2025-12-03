/**
 * POST /api/login
 * Validates password and sets a secure HTTP-only cookie
 */

// Helper to parse request body
async function parseBody(req) {
  // If body is already parsed (object), return it
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  
  // If body is a string, parse it
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  
  // Read and parse the body from the stream
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseBody(req);
    const { password } = body;
    const correctPassword = process.env.DASHBOARD_PASSWORD || 'seda2025';

    if (!password) {
      return res.status(400).json({ authenticated: false, error: 'Password required' });
    }

    if (password === correctPassword) {
      // Set secure HTTP-only cookie
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
      const maxAge = 24 * 60 * 60; // 24 hours in seconds

      const cookieOptions = [
        `dashboard_auth=authenticated`,
        `Max-Age=${maxAge}`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Strict`,
      ];

      if (isProduction) {
        cookieOptions.push('Secure');
      }

      res.setHeader('Set-Cookie', cookieOptions.join('; '));

      return res.status(200).json({ authenticated: true });
    } else {
      return res.status(401).json({ authenticated: false, error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ authenticated: false, error: 'Server error' });
  }
};


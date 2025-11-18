# Deployment Guide

## Project Status

✅ **Frontend components removed**
- Removed `index.html` (root)
- Removed `public/index.html`
- Removed `server.js` (Express static file server)
- Removed `nodemon.json`
- Removed unused dependencies (express, cors, nodemon)

✅ **Git repository disconnected**
- Old git repository removed
- Ready for new repository initialization if needed

✅ **Vercel project created**
- New Vercel project linked: `jasperdgs-projects/monitor-sessions`
- Configuration updated in `vercel.json`

## Next Steps

### 1. Configure Environment Variables

Add the following environment variables to your Vercel project:

```bash
vercel env add DATABASE_URL
# Paste your Neon database URL when prompted

vercel env add FAST_API_KEY
# Paste your SEDA API key when prompted

vercel env add VERCEL_AUTOMATION_BYPASS_SECRET
# Create a secure random string for cron job protection
```

### 2. Deploy to Vercel

```bash
vercel --prod
```

### 3. Test Your Deployment

After deployment, test the API endpoints:

```bash
# Get history (replace YOUR_DOMAIN with your Vercel URL)
curl https://YOUR_DOMAIN.vercel.app/api/history?limit=10

# Get stats
curl https://YOUR_DOMAIN.vercel.app/api/stats

# Check cron status
curl https://YOUR_DOMAIN.vercel.app/api/cron-update?x-vercel-protection-bypass=YOUR_SECRET
```

### 4. Verify Cron Job

1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Cron
3. Verify the cron job is active: `* * * * *` (every minute)
4. Check logs to ensure it's running successfully

## Project Structure (Backend Only)

```
monitor-sessions/
├── api/
│   ├── cron-update.js    # Cron endpoint (fetches data every minute)
│   ├── history.js         # Historical data query endpoint
│   └── stats.js           # Statistics endpoint
├── lib/
│   └── db.js              # Database connection and queries
├── migrations/
│   ├── 001_init.sql       # Initial database schema
│   ├── 002_add_raw_data.sql
│   └── run.js             # Migration runner
├── scripts/
│   ├── clear-db.js        # Clear database
│   ├── query-range.js     # Query specific ranges
│   ├── query-raw-data.js  # Query raw API responses
│   ├── test-db.js         # Test database connection
│   └── trigger-cron.js    # Manually trigger cron
├── package.json
├── vercel.json            # Vercel configuration (cron + settings)
└── README.md              # Documentation
```

## API Endpoints

### GET /api/history
Retrieve historical composite rate data.

**Query Parameters:**
- `limit` (number): Maximum number of records to return
- `range` (string): Time range - `2min`, `1hour`, `1day`, `1week`
- `start` (ISO datetime): Start timestamp for custom range
- `end` (ISO datetime): End timestamp for custom range

**Example:**
```bash
curl "https://your-domain.vercel.app/api/history?range=1hour&limit=500"
```

### GET /api/stats
Get statistics about stored data.

**Response:**
```json
{
  "counts": {
    "last_2min": 120,
    "last_hour": 3600,
    "last_day": 86400,
    "total": 500000
  }
}
```

### GET /api/cron-update
Cron endpoint that fetches latest data from SEDA API (protected).

**Query Parameters:**
- `x-vercel-protection-bypass` (required): Secret token

## Optional: Initialize New Git Repository

If you want to track this project in a new git repository:

```bash
cd /Users/fluxper/seda/test-programs/frontends/monitor-sessions
git init
git add .
git commit -m "Initial commit: Backend-only SEDA API monitor"
git remote add origin YOUR_NEW_REPO_URL
git push -u origin main
```

## Troubleshooting

### Cron Not Running
- Check `CRON_NOT_RUNNING.md` for troubleshooting steps
- Verify environment variables are set correctly
- Check Vercel cron logs in dashboard

### Database Connection Issues
- Run `npm run test-db` locally to verify connection
- Ensure `DATABASE_URL` is set in Vercel environment variables
- Check Neon database is accessible

### API Errors
- Check Vercel function logs in dashboard
- Verify `FAST_API_KEY` is correct
- Test locally with `.env.local` file


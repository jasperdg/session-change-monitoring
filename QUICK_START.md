# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Deploy to Vercel

```bash
cd /Users/fluxper/seda/test-programs/frontends/monitor-sessions
vercel --prod
```

### 2. Add Environment Variables

```bash
vercel env add DATABASE_URL
# Paste your Neon database URL (same as your cron project)
```

**Note:** This project only reads data. Make sure your separate cron project is running and writing to the same database.

### 3. Redeploy to Apply Variables

```bash
vercel --prod
```

## 📊 Access Your Dashboard

Once deployed, visit:
```
https://your-project.vercel.app/public/index.html
```

You should see:
- ✅ 7 days of trading data (including today)
- ✅ 5 charts per day (4 sessions + full day)
- ✅ Real-time statistics per session
- ✅ Color-coded session indicators

## ⏰ Data Collection

**Important:** This project is read-only. Data is collected by a separate cron project.

Make sure:
- ✅ Your separate cron project is deployed and running
- ✅ Both projects use the same `DATABASE_URL`
- ✅ The cron has been running for sufficient time to collect data

## 🧪 Test Locally

```bash
# Install dependencies
npm install

# Create .env.local with database URL
cat > .env.local << EOF
DATABASE_URL=your_neon_database_url
EOF

# Start local dev server
vercel dev

# Open browser
open http://localhost:3000/public/index.html
```

## 📝 Trading Sessions

Your dashboard monitors these 4 sessions (ET timezone):

| Session | Time (ET) | Color | Description |
|---------|-----------|-------|-------------|
| 🌅 Pre-market - Regular | 3:58 AM – 4:02 AM | Pink | Early morning |
| 🌙 Overnight - Pre-market | 7:58 AM – 8:02 AM | Purple | Morning transition |
| 📈 Regular - Afterhours | 9:28 AM – 9:32 AM | Green | Main session |
| 🌆 Afterhours - Pre-market | 3:58 PM – 4:02 PM | Orange | Evening trading |

Plus one **Full Trading Day** chart combining all sessions!

## 🔧 Useful Commands

```bash
# Test database connection
npm run test-db

# Run migrations (if needed)
npm run migrate

# View recent data
node scripts/query-range.js

# Query raw data
node scripts/query-raw-data.js

# Clear all data (be careful!)
node scripts/clear-db.js
```

## 🆘 Troubleshooting

### No Data Showing?
1. Verify your separate cron project is running
2. Check that database has data: `npm run test-db`
3. Confirm both projects use the same `DATABASE_URL`
4. Check the cron project's Vercel dashboard for logs

### Charts Not Loading?
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify API endpoint: `https://your-domain.vercel.app/api/history?limit=10`

### Database Connection Issues?
1. Run `npm run test-db` to verify connection
2. Ensure `DATABASE_URL` is correct in Vercel env vars
3. Check that both projects share the same database

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `FRONTEND_GUIDE.md` for customization options
- Review `DEPLOYMENT_GUIDE.md` for deployment details

## 🎨 Customize

Edit `/public/index.html` to:
- Change session times
- Modify colors
- Add more sessions
- Adjust number of days shown

Example:
```javascript
// In public/index.html, find TRADING_SESSIONS
const TRADING_SESSIONS = {
    overnight: { 
        name: 'Overnight', 
        startTime: '19:58',  // Change these times
        endTime: '08:02', 
        color: '#8b5cf6'     // Change this color
    },
    // Add more sessions here...
};
```

## 🔗 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Database](https://neon.tech/docs)
- [Chart.js](https://www.chartjs.org/docs/)

---

**Need help?** Check the logs in Vercel dashboard or run locally with `vercel dev` to debug.


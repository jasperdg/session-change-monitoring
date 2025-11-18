# Session Aware Stocks - SEDA API Monitor

A full-stack application that monitors the SEDA API endpoint, stores data in a database, and displays trading session analytics.

## Features

### Backend API
- 📊 Historical data storage in PostgreSQL (Neon)
- 🔍 Flexible query parameters (time ranges, custom dates)
- 🔐 Read-only API access
- ⏰ Data collection handled by separate cron project

### Frontend Dashboard
- 📈 **Trading Session Transition Analysis** (select any day from the last 7 days)
  - Overnight - Premarket: 3:58 AM – 4:02 AM ET (4-minute window)
  - Premarket - Regular Hours: 9:28 AM – 9:32 AM ET (4-minute window)
  - Regular Hours - After Hours: 3:58 PM – 4:02 PM ET (4-minute window)
  - After Hours - Overnight: 7:58 PM – 8:02 PM ET (4-minute window)
  - Combined Transitions View (all 4 windows merged - 16 minutes total)
- 🎨 Beautiful, modern UI with color-coded sessions
- 📊 Real-time statistics (min, max, avg, data points)
- 📅 Day selector dropdown for easy navigation (shows ET dates)
- 🕐 Proper timezone handling (your timezone → ET → UTC → display)
- 🔄 One-click data reload
- 🔍 **Double-click charts** to view detailed database records
- 📥 **Export data** to CSV or JSON format

## Architecture

```
┌─────────────────┐       ┌──────────────┐
│  Frontend       │──────▶│  API Routes  │
│  (public/)      │       │  (api/)      │
└─────────────────┘       └──────┬───────┘
                                 │
                                 ▼
                     ┌────────────────────┐
                     │  Neon PostgreSQL   │
                     │  Database          │
                     └────────────────────┘
                                 ▲
                                 │
                     ┌───────────┴───────┐
                     │  Separate Cron    │
                     │  Project          │
                     │  (data collector) │
                     └───────────────────┘
```

**Note:** Data collection is handled by a separate cron job running in another project.

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

**Note:** This project is read-only. Data collection is handled by a separate cron project that writes to the same database.

## 💡 Using the Frontend

### Viewing Charts

1. Open the dashboard in your browser
2. Select a day from the dropdown (defaults to today)
3. View 5 charts:
   - 4 individual transition period charts (4 minutes each)
   - 1 combined chart showing all transition periods

### Viewing Detailed Data

To see all database records for a specific timeframe:

1. **Double-click any chart** to open the data viewer modal
2. The modal displays:
   - Session name and time range
   - Total number of records found
   - Complete data table with all database fields
3. **Scroll** through the table to view all records
4. **Export data** using the buttons at the bottom:
   - 📥 Export to CSV - for spreadsheet analysis
   - 📥 Export to JSON - for programmatic access

### Chart Interactions

- **Zoom in**: Click and drag horizontally to select a time range
- **Reset zoom**: Use the reset zoom button that appears when zoomed
- **View details**: Hover over data points to see exact values
- **Auto-refresh**: Today's data automatically refreshes every 60 seconds

### Data Table Columns

When viewing detailed data, you'll see:
- **ID**: Database record identifier
- **Timestamp (Local)**: Time in your browser's timezone
- **Timestamp (UTC)**: Original UTC timestamp from database
- **Composite Rate**: The rate value
- **Active Session**: Which trading session was active
- **Session Weight**: Weight for the active session
- **Reference Weight**: Reference market weight

## Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
   Create a `.env.local` file:
   ```
   DATABASE_URL=your_neon_database_url
   ```

3. **Run database migrations:**
```bash
npm run migrate
```

4. **Test database connection:**
```bash
npm run test-db
```

5. **Start development server:**
```bash
vercel dev
```

6. **Open frontend:**
   Navigate to `http://localhost:3000/public/index.html`

## Vercel Deployment

### First Time Setup

1. **Link to Vercel project:**
```bash
vercel link
```

2. **Add environment variables:**
```bash
vercel env add DATABASE_URL
# Use the same database URL as your cron project
```

3. **Deploy to production:**
```bash
vercel --prod
```

### Accessing Your App

After deployment:
- **Frontend Dashboard**: `https://your-domain.vercel.app/public/index.html`
- **API Endpoints**: `https://your-domain.vercel.app/api/*`

## Trading Session Transitions Explained

**Important:** This dashboard monitors **4-minute transition windows** around session changes, NOT full trading sessions.

The frontend displays data for four distinct session transition periods (all times in ET):

1. **Overnight - Premarket** (3:58 AM – 4:02 AM ET)
   - 4-minute window during early morning transition
   - Overnight to premarket session change

2. **Premarket - Regular Hours** (9:28 AM – 9:32 AM ET)
   - 4-minute window during market opening
   - Premarket to regular trading hours transition

3. **Regular Hours - After Hours** (3:58 PM – 4:02 PM ET)
   - 4-minute window during market close
   - Regular hours to after-hours transition

4. **After Hours - Overnight** (7:58 PM – 8:02 PM ET)
   - 4-minute window during evening transition
   - After-hours to overnight session change

5. **Combined Transitions**
   - All 4 transition windows merged (16 minutes total per day)
   - Color-coded by transition for easy identification
   - ⚠️ **Does NOT represent continuous trading data**

## Database Schema

**Table: `composite_rates`**
```sql
CREATE TABLE composite_rates (
  id SERIAL PRIMARY KEY,
  composite_rate NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_data JSONB
);
```

## Scripts

- `npm run migrate` - Run database migrations
- `npm run test-db` - Test database connection
- `node scripts/clear-db.js` - Clear all data from database
- `node scripts/query-range.js` - Query data for a specific range
- `node scripts/query-raw-data.js` - Query raw API response data

## Project Structure

```
monitor-sessions/
├── api/
│   ├── index.js           # Root redirect to frontend
│   ├── history.js         # Historical data query endpoint
│   └── stats.js           # Statistics endpoint
├── lib/
│   └── db.js              # Database connection and queries
├── migrations/
│   ├── 001_init.sql       # Initial database schema
│   ├── 002_add_raw_data.sql
│   └── run.js             # Migration runner
├── public/
│   └── index.html         # Trading sessions dashboard
├── scripts/
│   ├── clear-db.js        # Database utilities
│   ├── query-range.js
│   ├── query-raw-data.js
│   └── test-db.js
├── package.json
├── vercel.json            # Vercel configuration
└── README.md
```

## Troubleshooting

### No Data in Charts
- Verify the separate cron project is running and collecting data
- Check database has data: `npm run test-db`
- Verify timezone settings (charts use ET)
- Confirm both projects use the same DATABASE_URL

### Database Connection Issues
- Test connection: `npm run test-db`
- Verify `DATABASE_URL` is correct
- Check Neon database is accessible

### Frontend Not Loading
- Access via `/public/index.html` path
- Check browser console for errors
- Verify API endpoints are responding

## Tech Stack

- **Frontend**: Vanilla JavaScript, Chart.js
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Neon PostgreSQL
- **Deployment**: Vercel
- **Cron**: Vercel Cron Jobs

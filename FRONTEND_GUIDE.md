# Trading Sessions Frontend Guide

## Overview

The frontend displays **4-minute transition windows** for **any selected day from the last 7 days**. Each chart shows a brief snapshot around session changes, NOT continuous trading data.

## Features

### 📅 Day Selection

Use the dropdown selector to choose:
- **Today** - Current day's transition periods
- **Yesterday** - Previous day's data
- **Any day** - Select from the last 7 days

### 📊 Charts Per Day

The selected day shows **5 charts**:

1. **Overnight - Premarket** (3:58 AM – 4:02 AM ET) - Purple
   - Early morning overnight to premarket transition
   
2. **Premarket - Regular Hours** (9:28 AM – 9:32 AM ET) - Pink
   - Market opening transition (4 minutes)
   
3. **Regular Hours - After Hours** (3:58 PM – 4:02 PM ET) - Green
   - Market closing transition
   
4. **After Hours - Overnight** (7:58 PM – 8:02 PM ET) - Orange
   - Evening after-hours to overnight transition
   
5. **All Transition Periods Combined**
   - All 4 windows merged (16 minutes total)
   - Color-coded points by transition period
   - ⚠️ **NOT continuous data** - only transition snapshots

### 📈 Statistics

Each chart displays:
- **Points**: Number of data points collected
- **Min**: Minimum composite rate
- **Max**: Maximum composite rate
- **Avg**: Average composite rate

## How It Works

### Timezone Conversion
- All session times are specified in **ET (Eastern Time - America/New_York)**
- **Day selector shows dates in ET** (not your local date)
- Frontend detects current ET date, even if you're in a different timezone
- Automatically handles **EDT (UTC-4)** and **EST (UTC-5)** conversion
- Converts ET times → UTC for API queries
- Database stores all timestamps in UTC
- Charts display times in **your browser's local timezone**

**Important:** If it's 11 PM Monday in California, the dashboard shows "Today - Tuesday" because it's already Tuesday in ET.

### Data Flow

```
┌─────────────────────────────────────┐
│  Your Browser (Any Timezone)        │
│  1. Detects current ET date/time    │
└────────┬────────────────────────────┘
         │
         │ 2. User selects day (in ET)
         │ 3. Calculate ET session times
         │ 4. Convert ET → UTC (handles EDT/EST)
         │
         ▼
┌─────────────────────────────────────┐
│  API /api/history                   │
│  5. Query with UTC timestamps       │
└────────┬────────────────────────────┘
         │
         │ 6. Query database
         │ 7. Return UTC timestamps
         │
         ▼
┌─────────────────────────────────────┐
│  Database (UTC times)               │
└────────┬────────────────────────────┘
         │
         │ 8. Return to browser
         ▼
┌─────────────────────────────────────┐
│  Charts Display                     │
│  Times shown in YOUR local timezone │
└─────────────────────────────────────┘
```

### Transition Window Calculation

For each day, the frontend:

1. **All Transition Periods**: 
   - Each is a **4-minute window** around a session change
   - Start/End: Same day, specified times in ET
   - Total data per day: **16 minutes** (4 windows × 4 minutes)
   - No special handling for day boundaries

**Important:** The combined chart does NOT show a full trading day. It shows only the 4 transition windows stitched together (with gaps between them).

### Sunday Data Availability

Sessions occur throughout the day (in ET), with one session spanning into the next day:
- ✅ Overnight - Premarket: 3:58 AM
- ✅ Premarket - Regular Hours: 9:28 AM  
- ✅ Regular Hours - After Hours: 3:58 PM
- ✅ After Hours - Overnight: 7:58 PM (spans to next day at 8:02 PM)

**Note:** The After Hours - Overnight session at 7:58 PM starts on one day and continues into the next calendar day.

## Usage

### Viewing the Dashboard

1. **Deploy to Vercel** or run locally with `vercel dev`
2. **Navigate to**: `/public/index.html`
3. **Select a day** from the dropdown (defaults to Today)
4. **Wait for data to load** (2-5 seconds per day)
5. **Switch days** using the dropdown to see different dates

### Reload Data

Click the **🔄 Reload Data** button to:
- Fetch fresh data from the database
- Recreate all charts
- Update statistics

### Understanding the Charts

- **X-axis**: Time in your local timezone
- **Y-axis**: Composite rate value
- **Line color**: Session-specific color
- **Point color** (full day chart): Color-coded by session
- **Hover**: See exact values and timestamps

## Customization

### Change Transition Times

Edit the `TRADING_SESSIONS` object in the HTML file:

```javascript
const TRADING_SESSIONS = {
    overnight: { 
        name: 'Overnight - Premarket', 
        startTime: '03:58',  // 3:58 AM ET
        endTime: '04:02',    // 4:02 AM ET
        color: '#8b5cf6' 
    },
    // ... add or modify transitions
};
```

### Change Number of Days in Selector

Modify the loop in `populateDaySelector()`:

```javascript
for (let i = 0; i < 7; i++) {  // Change 7 to desired number (e.g., 14 for 2 weeks)
    // ...
}
```

### Change Chart Colors

Update the `color` property in `TRADING_SESSIONS`:

```javascript
overnight: { 
    name: 'Overnight', 
    startTime: '19:58', 
    endTime: '08:02', 
    color: '#YOUR_HEX_COLOR'  // Change this
}
```

## Troubleshooting

### No Data Showing

**Possible causes:**
1. Cron job hasn't collected data yet
   - Wait 5-10 minutes after deployment
   - Check Vercel cron logs

2. Database is empty
   - Run: `node scripts/test-db.js`
   - Manually trigger cron: `node scripts/trigger-cron.js`

3. Time range has no data
   - Check if data exists for the specific session times
   - Try querying a wider range

### Charts Not Rendering

**Check browser console for errors:**
```javascript
// Open DevTools (F12) and check Console tab
```

**Common issues:**
- Chart.js not loading (check CDN)
- API endpoint returning errors
- CORS issues (should not occur with Vercel)

### Slow Loading

**Each day requires 4-5 API calls** (one per transition period)

The new day selector loads **only one day at a time**, making it much faster:
- Previous behavior: 35 API calls (7 days × 5 periods)
- New behavior: 5 API calls (1 day × 5 periods)

**To improve speed further:**
1. Implement server-side aggregation
2. Add client-side caching of previously loaded days
3. Preload adjacent days in background

### Wrong Timezone

**Frontend displays times in your browser's local timezone**

To force ET display, modify the date formatting:

```javascript
// Current (uses local timezone)
date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
});

// Force ET timezone
date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/New_York'  // Add this
});
```

## API Usage

### Manual Query Example

Fetch overnight session for today:

```javascript
// Calculate times
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const start = `${yesterday.toISOString().split('T')[0]}T23:58:00Z`; // 7:58 PM ET ≈ 11:58 PM UTC (EDT)
const end = `${today.toISOString().split('T')[0]}T12:02:00Z`;       // 8:02 AM ET ≈ 12:02 PM UTC (EDT)

// Fetch data
fetch(`/api/history?start=${start}&end=${end}&limit=1000`)
    .then(r => r.json())
    .then(data => console.log(data));
```

## Performance Tips

1. **Limit data points**: Use `limit` parameter in API calls
2. **Disable animations**: Already set to `animation: false`
3. **Destroy old charts**: Charts are destroyed before reload
4. **Progressive loading**: Consider loading days one at a time

## Interactive Data Viewer

### Feature: Double-Click to View Details

The frontend includes a powerful data viewer that allows you to see all database records for any chart timeframe.

### How It Works

1. **Trigger**: Double-click on any chart (session-specific or combined)
2. **Data Fetch**: Automatically queries `/api/history` with the chart's time range
3. **Display**: Shows a modal with all database records

### Implementation Details

```javascript
// Add double-click handler to any chart
canvas.addEventListener('dblclick', async () => {
    const startTime = data[0].timestamp;
    const endTime = data[data.length - 1].timestamp;
    await showDetailedDataViewer(startTime, endTime, sessionName);
});
```

### Data Viewer Modal Components

1. **Info Panel**: Shows session name, time range, record count, and duration
2. **Data Table**: Displays all database fields:
   - ID (record identifier)
   - Timestamp (Local) - in user's timezone
   - Timestamp (UTC) - original database timestamp
   - Composite Rate - highlighted for visibility
   - Active Session
   - Session Weight
   - Reference Weight

3. **Export Buttons**:
   - CSV Export - for spreadsheet analysis
   - JSON Export - for programmatic access

### User Experience

- Modal appears centered with dark overlay
- Table headers are sticky (stay visible when scrolling)
- Hover effects on table rows
- Click outside modal to close
- Maximum 10,000 records to prevent performance issues
- Data shown from oldest to newest

### Customization

To modify the data viewer:

```javascript
// Change maximum records
const url = `/api/history?start=${start}&end=${end}&limit=10000`;

// Add more columns to the table
row.innerHTML = `
    <td>${record.id}</td>
    <td>${record.custom_field}</td>
    // ... add more fields
`;

// Customize export format
const headers = ['ID', 'Timestamp', 'Your Custom Field'];
```

## Future Enhancements

Potential improvements:
- [ ] Add date range picker
- [x] Export data to CSV
- [x] Export data to JSON
- [ ] Compare multiple days side-by-side
- [ ] Add moving averages
- [ ] Volume/activity indicators
- [ ] Real-time updates with WebSocket
- [ ] Mobile-responsive improvements
- [ ] Session performance metrics
- [ ] Zoom-based data viewer (show only zoomed range)



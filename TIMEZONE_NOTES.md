# Timezone Handling Documentation

## Overview

This application monitors trading session transitions in **Eastern Time (ET)**, which is the standard timezone for US stock markets.

## How Timezone Conversion Works

### 1. Your Browser's Timezone → ET
When you load the page:
- The app detects the **current date/time in ET** (America/New_York)
- The day selector shows dates relative to ET, not your local timezone
- Example: If it's 11 PM Monday PST, it's already 2 AM Tuesday ET, so "Today" shows Tuesday

### 2. ET → UTC (for API queries)
When fetching data:
- Session times are defined in ET (e.g., 3:58 AM ET)
- The app automatically detects if it's EDT (UTC-4) or EST (UTC-5)
- Converts to UTC for database queries
- Example: 3:58 AM EDT = 7:58 AM UTC, 3:58 AM EST = 8:58 AM UTC

### 3. UTC → Your Browser (for display)
When displaying charts:
- Database returns timestamps in UTC
- Your browser converts to your local timezone for display
- Example: If you're in PST, 7:58 AM UTC displays as 11:58 PM (previous day) PST

## Session Times (All in ET)

| Session | ET Time | EDT (UTC) | EST (UTC) |
|---------|---------|-----------|-----------|
| Overnight - Premarket | 3:58-4:02 AM | 7:58-8:02 AM | 8:58-9:02 AM |
| Premarket - Regular Hours | 9:28-9:32 AM | 1:28-1:32 PM | 2:28-2:32 PM |
| Regular Hours - After Hours | 3:58-4:02 PM | 7:58-8:02 PM | 8:58-9:02 PM |
| After Hours - Overnight | 7:58-8:02 PM | 11:58 PM-12:02 AM | 12:58-1:02 AM (next day) |

## Important Notes

### Why ET Matters
- US stock markets operate on Eastern Time
- All session changes happen at ET times
- If you're in a different timezone, your "today" might be different from ET "today"

### Day Boundaries
- **All sessions now occur on the same calendar day (in ET)**
- No sessions span across midnight
- Sunday data is available for all sessions (7:58 AM onwards)

### Daylight Saving Time (DST)
- The app automatically detects EDT vs EST
- EDT: Second Sunday in March to First Sunday in November (UTC-4)
- EST: First Sunday in November to Second Sunday in March (UTC-5)

## Troubleshooting

### "My dates are off by a day"
This is expected if:
- You're in a timezone far from ET (e.g., Asia, Australia)
- It's late evening/early morning in your timezone
- The app shows ET dates, not your local dates

**Solution:** The dates shown are correct for ET trading hours. If it shows "Monday" and you think it's Sunday, check what time it is in ET.

### "I'm not seeing data for today"
Check:
1. What time is it in ET? (use `America/New_York` timezone)
2. Has the session time passed in ET?
3. Is the cron job running and collecting data?

### "Times on the chart look wrong"
- Chart times are displayed in **your browser's local timezone**
- This is intentional - you see times in your own timezone
- The data is still queried correctly from ET times

## Technical Details

### Date Calculation Process

```javascript
// 1. Get current ET date
const etDate = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

// 2. Convert ET time to UTC
const isDST = /* check if daylight saving */;
const etOffset = isDST ? 4 : 5;  // EDT or EST
const utcDate = new Date(Date.UTC(year, month, day, hours + etOffset, minutes, 0));

// 3. Query API with UTC timestamp
fetch(`/api/history?start=${utcDate.toISOString()}&end=...`);
```

### Why This Approach?

1. **Market-centric**: Trading happens in ET, so we use ET as the reference
2. **Accurate**: Properly handles EDT/EST transitions
3. **User-friendly**: Displays times in your local timezone for convenience
4. **Consistent**: Always queries the correct ET trading windows

## Examples

### Example 1: California User (PST/PDT)
- Local time: 8:00 PM Sunday (PDT, UTC-7)
- ET time: 11:00 PM Sunday (EDT, UTC-4)
- Dashboard shows: "Today - Monday" (because it's almost Monday in ET)

### Example 2: London User (GMT/BST)  
- Local time: 4:00 AM Monday (BST, UTC+1)
- ET time: 11:00 PM Sunday (EDT, UTC-4)
- Dashboard shows: "Today - Sunday"

### Example 3: Tokyo User (JST)
- Local time: 12:00 PM Monday (JST, UTC+9)
- ET time: 11:00 PM Sunday (EDT, UTC-4)
- Dashboard shows: "Today - Sunday"

## Key Takeaway

**The dashboard always operates in Eastern Time for date selection, but displays chart times in your local timezone.**

This ensures:
- ✅ Correct trading session data (based on ET)
- ✅ Convenient time display (in your timezone)
- ✅ Accurate timezone conversion (handles DST)


# Session Configuration Guide

## Overview

Each asset/table can have its own custom trading session transitions. Sessions are defined in `config/sessions.json` and are loaded dynamically based on the selected table.

## Configuration File Structure

The configuration file (`config/sessions.json`) maps table names to their session definitions:

```json
{
  "table_name": {
    "asset_name": "Display Name",
    "sessions": [
      {
        "key": "unique_session_id",
        "name": "Session Display Name",
        "start_time": "HH:MM",
        "end_time": "HH:MM",
        "color": "#hex_color"
      }
    ]
  }
}
```

## Field Descriptions

### Table Configuration
- **`asset_name`**: Human-readable name for the asset (displayed in UI)
- **`sessions`**: Array of session transition periods to monitor

### Session Fields
- **`key`**: Unique identifier for the session (used internally)
- **`name`**: Display name shown in charts and UI
- **`start_time`**: Start time in ET timezone (format: "HH:MM", 24-hour)
- **`end_time`**: End time in ET timezone (format: "HH:MM", 24-hour)
- **`color`**: Hex color code for chart visualization

## Adding a New Asset

1. **Add Entry to `config/sessions.json`**:
   ```json
   "your_table_name": {
     "asset_name": "Your Asset Name",
     "sessions": [
       {
         "key": "session1",
         "name": "Morning Open",
         "start_time": "09:28",
         "end_time": "09:32",
         "color": "#3b82f6"
       },
       {
         "key": "session2",
         "name": "Afternoon Close",
         "start_time": "15:58",
         "end_time": "16:02",
         "color": "#10b981"
       }
     ]
   }
   ```

2. **Deploy the Configuration**:
   ```bash
   git add config/sessions.json
   git commit -m "Add sessions for your_table_name"
   git push
   ```

3. **The asset will automatically appear** in the landing page table selector

## Example Configurations

### US Stock Market (NVDA)
- **Overnight - Premarket**: 3:58 AM - 4:02 AM ET
- **Premarket - Regular**: 9:28 AM - 9:32 AM ET
- **Regular - After Hours**: 3:58 PM - 4:02 PM ET
- **After Hours - Overnight**: 7:58 PM - 8:02 PM ET

### Gold Trading
- **Asian Market Open**: 6:58 PM - 7:02 PM ET
- **London Market Open**: 3:28 AM - 3:32 AM ET
- **New York Open**: 8:28 AM - 8:32 AM ET
- **London Close**: 11:58 AM - 12:02 PM ET

### Hong Kong Stock Market
- **Pre-market**: 1:28 AM - 1:32 AM ET
- **Market Open**: 1:58 AM - 2:02 AM ET
- **Lunch Break**: 4:28 AM - 4:32 AM ET
- **Market Close**: 8:28 AM - 8:32 AM ET

## Time Zone Notes

- All times are specified in **Eastern Time (ET)**
- The system automatically handles:
  - EST (UTC-5) during winter
  - EDT (UTC-4) during daylight saving time
  - Conversion to user's local timezone for display
  - UTC conversion for database queries

## Session Time Windows

Each session represents a **4-minute transition window** around key market events:
- **2 minutes before** the transition
- **2 minutes after** the transition

This captures price behavior during critical market session changes.

## Color Palette Recommendations

Use these colors for visual consistency:

- Blue: `#3b82f6` (primary)
- Green: `#10b981` (positive/growth)
- Amber: `#f59e0b` (warning/transition)
- Purple: `#8b5cf6` (overnight/special)
- Pink: `#ec4899` (accent)
- Cyan: `#06b6d4` (international)
- Red: `#ef4444` (close/end)

## Default Fallback

If a table is not found in the configuration, the system uses `_default`:

```json
"_default": {
  "asset_name": "Unknown Asset",
  "sessions": [
    {
      "key": "session1",
      "name": "Session Transition 1",
      "start_time": "09:28",
      "end_time": "09:32",
      "color": "#3b82f6"
    },
    {
      "key": "session2",
      "name": "Session Transition 2",
      "start_time": "15:58",
      "end_time": "16:02",
      "color": "#10b981"
    }
  ]
}
```

## API Endpoint

The session configuration is served via:
```
GET /api/sessions?table=<table_name>
```

**Response**:
```json
{
  "table": "table_name",
  "asset_name": "Asset Display Name",
  "sessions": [
    {
      "key": "session1",
      "name": "Session Name",
      "start_time": "09:28",
      "end_time": "09:32",
      "color": "#3b82f6"
    }
  ]
}
```

## Troubleshooting

### Sessions not loading?
1. Check `config/sessions.json` syntax (must be valid JSON)
2. Verify table name matches exactly (case-sensitive)
3. Check browser console for errors
4. Ensure times are in 24-hour format

### Wrong times displayed?
1. Times in config must be in ET (Eastern Time)
2. System converts automatically to user's local timezone
3. Check DST handling if dates are near time changes

### Colors not showing?
1. Ensure color codes start with `#`
2. Use 6-digit hex codes (e.g., `#3b82f6`)
3. Test color contrast for accessibility


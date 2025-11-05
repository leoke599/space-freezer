# DS18B20 Sensor Fault Detection

## Overview
The temperature monitoring system now includes automatic fault detection for the DS18B20 sensor to prevent false alarms from connection issues.

## Common Sensor Faults Detected

### 1. **-127°C Reading**
- **Cause**: Sensor disconnected or loose connection (most common)
- **Detection**: Any reading ≤ -100°C or exactly -127°C
- **Action**: Alert created, reading NOT saved to database

### 2. **85°C Reading**
- **Cause**: Sensor not properly initialized (power-on default)
- **Detection**: Exactly 85°C
- **Action**: Alert created, reading NOT saved to database

### 3. **Unrealistic Values**
- **Cause**: Electrical interference or sensor malfunction
- **Detection**: Values > 100°C or < -200°C
- **Action**: Alert created, reading NOT saved to database

## How It Works

### Backend Validation (main.py)
When Arduino sends temperature data via POST `/temperature`:
1. **Validate** the reading against known fault patterns
2. **Create alert** if fault detected (only one alert per fault to avoid spam)
3. **Reject** faulty readings (they don't get saved to CSV)
4. **Accept** valid readings and save normally

### Frontend Display (temperature.jsx)
The temperature page shows:
- ✅ **Green banner** when sensor is OK
- ⚠️ **Yellow banner** for sensor faults with helpful tips
- 🔌 **Red banner** if no recent data (>5 min)
- **Dismiss button** to acknowledge fault alerts

### Status Endpoint
GET `/temperature/status` returns:
```json
{
  "status": "ok" | "fault" | "no_data",
  "message": "Description of status",
  "alert_id": 123,  // if fault exists
  "created_at": "2025-11-05T..."
}
```

## User Experience

### When a Fault Occurs:
1. User sees yellow warning banner on Temperature page
2. Banner explains the likely cause (e.g., "loose connection")
3. Helpful tip suggests checking sensor/resistor connection
4. Faulty reading is **NOT** shown on the temperature graph
5. User can dismiss the alert once they've checked the sensor

### When Sensor Returns to Normal:
1. Valid readings start being recorded again
2. Banner changes to green "Sensor operating normally"
3. Temperature graph shows correct data

## Testing

### Simulate a Fault:
You can test by having your Arduino send fault values:
```arduino
// In your Arduino code, temporarily send:
Serial.println("TEMP:-127.00");  // Simulates disconnection
Serial.println("TEMP:85.00");    // Simulates initialization error
```

### Expected Behavior:
- Backend logs: `"status": "fault"`
- Alert created in database
- Temperature page shows yellow warning
- Reading NOT added to graph

## Troubleshooting

### Alert Won't Dismiss:
- Check that alert ID exists in database
- Verify `/alerts/{id}/acknowledge` endpoint is accessible

### False Positives:
If you're legitimately working in extreme temperatures, adjust validation thresholds in `main.py`:
```python
# Line ~263 in main.py
if temperature <= -100 or temperature == -127:  # Adjust -100 threshold
```

### No Fault Detection:
- Verify backend is running latest code
- Check that Arduino is POSTing to `/temperature` endpoint
- Look for errors in FastAPI console logs

## Benefits

✅ Prevents panic from false -127°C alerts  
✅ Helps identify connection issues quickly  
✅ Keeps temperature data clean and accurate  
✅ Provides actionable troubleshooting tips  
✅ Maintains alert history in database  

## Database Schema

Alerts are stored in the `alerts` table:
```sql
type: "temperature"
severity: "warning"
message: "Sensor fault detected: Sensor disconnected or loose connection (-127°C)"
is_acknowledged: false/true
created_at: timestamp
```

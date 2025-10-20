# Arduino USB/Serial Setup Guide

This guide is for connecting your Arduino temperature sensor via **USB cable only** (no WiFi needed). Perfect for space applications!

## How It Works

```
Arduino (via USB) → Python Serial Reader → FastAPI Backend → Frontend Dashboard
```

1. Arduino reads temperature sensor and sends data via USB serial
2. Python script (`arduino_serial_reader.py`) reads serial data from Arduino
3. Python script forwards data to FastAPI backend
4. Data appears on your dashboard in real-time!

## Hardware Setup

### What You Need:
- **Any Arduino board** (Uno, Nano, Mega, ESP8266, ESP32 - any will work!)
- **Temperature sensor** (choose one):
  - DHT11 ($2) - ±2°C accuracy
  - DHT22 ($5) - ±0.5°C accuracy (recommended)
  - TMP36 ($1-2) - Analog sensor
  - DS18B20 ($3) - High precision
- **USB cable** to connect Arduino to computer

### Wiring Example (DHT22):
```
DHT22         Arduino
-----         -------
VCC   ------> 5V (or 3.3V)
GND   ------> GND
DATA  ------> Pin 2 (with 10kΩ pull-up resistor between VCC and DATA)
```

### Wiring Example (TMP36):
```
TMP36         Arduino
-----         -------
VCC   ------> 5V
GND   ------> GND
Vout  ------> A0 (analog pin)
```

## Software Setup

### Step 1: Install Python Dependencies

Open PowerShell in your project folder and run:

```powershell
pip install pyserial requests
```

### Step 2: Configure and Upload Arduino Sketch

1. Open `arduino_temperature_sensor.ino` in Arduino IDE
2. Uncomment your sensor type at the top:
   ```cpp
   // Choose ONE:
   #define USE_DHT22        // For DHT22 sensor
   // #define USE_DHT11     // For DHT11 sensor
   // #define USE_TMP36     // For TMP36 analog sensor
   ```

3. If using DHT sensor, uncomment these lines:
   ```cpp
   #include <DHT.h>
   #define DHTTYPE DHT22
   DHT dht(TEMP_SENSOR_PIN, DHTTYPE);
   ```
   
4. In the `readTemperature()` function, uncomment the code for your sensor type

5. Upload to Arduino:
   - Connect Arduino via USB
   - Select board: Tools → Board → Your Arduino Model
   - Select port: Tools → Port → COM# (Windows)
   - Click Upload (→)

6. **Important**: Close the Arduino IDE Serial Monitor after uploading!

### Step 3: Test Arduino Output

Open Arduino IDE Serial Monitor briefly to verify output:
- Tools → Serial Monitor
- Set to 115200 baud
- You should see: `TEMP:23.45` and `Temperature: 23.45 °C`

**Close the Serial Monitor** when done (only one program can use the serial port at a time)

### Step 4: Start FastAPI Backend

In a PowerShell terminal:
```powershell
uvicorn main:app --reload
```

Keep this running!

### Step 5: Run the Serial Reader

Open a **new** PowerShell terminal and run:
```powershell
python arduino_serial_reader.py
```

You'll see:
```
=== Available Serial Ports ===
1. COM3 - USB Serial Device (COM3)
2. COM5 - Arduino Uno (COM5)

Select port (1-2): 2

✓ Connected to Arduino!
✓ Backend URL: http://localhost:8000/temperature

--- Reading temperature data (Ctrl+C to stop) ---

[10:30:15] Arduino: === Space Freezer Temperature Monitor (Serial Mode) ===
[10:30:15] Arduino: Ready to send data!
[10:31:15] Arduino: TEMP:23.45
[10:31:15] Arduino: Temperature: 23.45 °C
✓ Sent to backend: 23.45°C
```

### Step 6: View Data on Dashboard

1. Open your frontend: http://localhost:5173
2. Go to Temperature page
3. You should see real Arduino data on the graph! 📊

## Adjusting Update Frequency

In the Arduino sketch, change this line:
```cpp
const unsigned long READ_INTERVAL = 60000;  // 60 seconds (60000 ms)
```

Examples:
- Every 10 seconds: `10000`
- Every 30 seconds: `30000`
- Every 2 minutes: `120000`

## Running at Startup (Optional)

### Windows - Create a Batch File

Create `start_temperature_monitor.bat`:
```batch
@echo off
echo Starting Temperature Monitor...
cd /d "C:\Users\idekn\vscode_projects\space-freezer"
python arduino_serial_reader.py
pause
```

Double-click to run!

### Run in Background

To run the Python serial reader in the background:
```powershell
Start-Process python -ArgumentList "arduino_serial_reader.py" -WindowStyle Hidden
```

## Troubleshooting

### "No serial ports found"
- Make sure Arduino is connected via USB
- Check Device Manager (Windows) to see if Arduino is detected
- Try a different USB port or cable

### "Access denied" or "Serial port in use"
- Close Arduino IDE Serial Monitor
- Close any other program using the serial port
- Disconnect and reconnect Arduino

### Arduino not detected
- Install CH340/CH341 drivers (for clone Arduinos)
- Update Arduino IDE to latest version
- Check USB cable (some are power-only, need data cables)

### Temperature always shows same value or NaN
- Check sensor wiring
- Verify correct sensor type is uncommented in code
- For DHT sensors: make sure library is installed
- Test with simulated data first (leave sensor code commented)

### Backend connection fails
- Make sure FastAPI is running: `uvicorn main:app --reload`
- Check http://localhost:8000/docs to verify backend is up
- Firewall might be blocking - try temporarily disabling

### Data not showing on frontend
- Check if `temperature_data.csv` is being updated
- Verify GET endpoint works: http://localhost:8000/temperature
- Clear browser cache and reload
- Check browser console for errors (F12)

## Testing Without Hardware

You can test the whole system without a physical sensor:

1. In Arduino sketch, leave all sensor code commented out - it will use simulated data
2. Upload and run normally
3. Data will be random temperatures between 18-25°C

## Advantages of USB/Serial Over WiFi

✅ **No network configuration** - just plug in USB  
✅ **Works in space** - no WiFi needed  
✅ **More reliable** - direct connection  
✅ **Lower power** - no WiFi radio  
✅ **Simpler code** - no WiFi libraries needed  
✅ **Any Arduino works** - don't need ESP8266/ESP32  
✅ **Easier debugging** - see serial output in real-time  

## Next Steps

- ✅ Basic serial connection working
- 🎯 Add multiple Arduino sensors on different COM ports
- 🎯 Create Windows service to run reader at startup
- 🎯 Add error recovery and auto-reconnect
- 🎯 Log connection status to database

## Quick Reference

**Start everything:**
```powershell
# Terminal 1 - Backend
uvicorn main:app --reload

# Terminal 2 - Serial Reader
python arduino_serial_reader.py

# Terminal 3 - Frontend (if not already running)
cd frontend
npm run dev
```

**Stop the serial reader:** Press `Ctrl+C`

**View backend API:** http://localhost:8000/docs

**View dashboard:** http://localhost:5173

Happy monitoring! 🌡️🚀

# Quick Start Guide - Arduino USB Temperature Sensor

## Overview
Your Arduino connects via USB (no WiFi needed - perfect for space!). A Python script reads the serial data and forwards it to your backend.

## Setup Steps

### 1. Install Python Dependencies ✅ (Already Done!)
```powershell
pip install pyserial requests
```

### 2. Upload Arduino Code
1. Open `arduino_temperature_sensor.ino` in Arduino IDE
2. Connect Arduino via USB
3. Select your board: Tools → Board
4. Select COM port: Tools → Port
5. Click Upload button (→)
6. **Close Serial Monitor after upload!**

### 3. Test Arduino Connection (Optional)
```powershell
python test_arduino_connection.py
```
This shows all detected serial ports and identifies your Arduino.

### 4. Start Your Backend
```powershell
uvicorn main:app --reload
```
Keep this terminal running!

### 5. Start Serial Reader
Open a NEW terminal:
```powershell
python arduino_serial_reader.py
```

You'll see:
- List of COM ports
- Select your Arduino's port
- Real-time temperature readings
- Confirmation that data is sent to backend

### 6. View Dashboard
Open: http://localhost:5173

Navigate to Temperature page and see your real sensor data! 📊

## File Overview

| File | Purpose |
|------|---------|
| `arduino_temperature_sensor.ino` | Arduino code (upload to board) |
| `arduino_serial_reader.py` | Python script to read USB serial and forward to API |
| `test_arduino_connection.py` | Test script to detect Arduino |
| `ARDUINO_USB_SETUP.md` | Detailed setup guide with troubleshooting |

## Temperature Sensor Options

The Arduino code supports multiple sensors - uncomment the one you have:

**DHT22** (recommended): Best accuracy, easy to use  
**DHT11**: Cheaper but less accurate  
**TMP36**: Simple analog sensor  
**DS18B20**: High precision digital  
**Simulated**: For testing without physical sensor

## How It Works

```
┌─────────┐  USB Serial   ┌──────────┐  HTTP POST  ┌─────────┐
│ Arduino │─────────────→│  Python  │────────────→│ FastAPI │
│ + Sensor│               │  Script  │             │ Backend │
└─────────┘               └──────────┘             └─────────┘
                                                          │
                                                          ↓
                                                   temperature_data.csv
                                                          │
                                                          ↓
                                                   ┌─────────────┐
                                                   │  Dashboard  │
                                                   └─────────────┘
```

## Advantages Over WiFi

✅ No network configuration  
✅ Works anywhere (including space!)  
✅ More reliable  
✅ Simpler code  
✅ Works with any Arduino  
✅ Lower power consumption  

## Troubleshooting

**Can't find COM port?**
- Check Device Manager (Windows)
- Install CH340 drivers for clone Arduinos
- Try different USB cable/port

**"Port in use" error?**
- Close Arduino IDE Serial Monitor
- Only one program can use serial port at a time

**Backend connection fails?**
- Make sure FastAPI is running
- Check http://localhost:8000/docs

**No data on dashboard?**
- Check if temperature_data.csv is updating
- Reload the frontend page
- Check browser console (F12)

## Quick Commands Reference

```powershell
# Test Arduino detection
python test_arduino_connection.py

# Start backend (terminal 1)
uvicorn main:app --reload

# Start serial reader (terminal 2)
python arduino_serial_reader.py

# Start frontend (terminal 3)
cd frontend
npm run dev
```

## Need Help?

See `ARDUINO_USB_SETUP.md` for detailed instructions, wiring diagrams, and troubleshooting.

🚀 Perfect for space applications - no WiFi required!

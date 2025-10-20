# Raspberry Pi Optimization Guide - Space Freezer

## System Requirements

### Minimum (Pi Zero 2 W / Pi 3):
- 512MB RAM
- 8GB SD card
- Python 3.9+

### Recommended (Pi 4 / Pi 5):
- 2GB+ RAM
- 16GB+ SD card
- Better performance, more headroom

## Memory Usage Estimate

### Current (Development Mode):
- FastAPI backend: ~100-150 MB
- Vite dev server: ~200-300 MB
- Node.js: ~50-100 MB
- Arduino serial reader: ~20 MB
- **Total: ~400-600 MB**

### Optimized (Production Mode):
- FastAPI backend: ~100-150 MB
- Static file serving: ~0 MB (served by FastAPI)
- Arduino serial reader: ~20 MB
- **Total: ~150-200 MB** ✅

## Optimization Steps

### 1. Build Frontend for Production

```bash
cd frontend
npm run build
```

This creates optimized static files in `frontend/dist/` folder.

### 2. Serve Frontend from FastAPI

Update `main.py` to serve the built frontend (see below).

### 3. Optimize Database

```bash
# Vacuum SQLite to reduce size
sqlite3 freezer_inventory.db "VACUUM;"
```

### 4. Reduce CSV Retention

In `main.py`, reduce `MAX_ROWS`:
```python
MAX_ROWS = 50  # Instead of 100
SENSOR_INTERVAL_SECONDS = 120  # Read every 2 minutes instead of 1
```

### 5. Optimize Pandas Usage

Replace pandas CSV operations with native Python `csv` module (lighter).

### 6. Disable Unnecessary Services

Comment out power/humidity simulation if you only have temperature sensor.

## Modified main.py for Production

Add this to the end of your `main.py`:

```python
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Serve frontend static files (production build)
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.exists(FRONTEND_DIR):
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")
    
    # Serve index.html for all frontend routes (SPA)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API routes take precedence
        if full_path.startswith("items") or full_path.startswith("temperature") or \
           full_path.startswith("power") or full_path.startswith("settings") or \
           full_path.startswith("mission") or full_path.startswith("barcode"):
            return {"error": "Not found"}
        
        # Serve index.html for all other routes
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    print("⚠️  Frontend build not found. Run 'cd frontend && npm run build'")
```

## Running on Raspberry Pi

### Development (heavier):
```bash
# Terminal 1
uvicorn main:app --host 0.0.0.0 --reload

# Terminal 2
cd frontend && npm run dev

# Terminal 3
python arduino_serial_reader.py
```

### Production (lighter):
```bash
# Build frontend once
cd frontend
npm run build
cd ..

# Run everything in one command
uvicorn main:app --host 0.0.0.0 --port 8000 &
python arduino_serial_reader.py
```

Or use a process manager like `systemd` or `supervisor`.

## Systemd Service Files (Auto-start on boot)

### `/etc/systemd/system/space-freezer.service`
```ini
[Unit]
Description=Space Freezer Backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/space-freezer
ExecStart=/home/pi/space-freezer/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### `/etc/systemd/system/arduino-reader.service`
```ini
[Unit]
Description=Arduino Temperature Reader
After=network.target space-freezer.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/space-freezer
ExecStart=/home/pi/space-freezer/venv/bin/python arduino_serial_reader.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable services:
```bash
sudo systemctl enable space-freezer
sudo systemctl enable arduino-reader
sudo systemctl start space-freezer
sudo systemctl start arduino-reader
```

## RAM Optimization Tips

### 1. Reduce Python Memory
```python
# In main.py - use generator instead of loading all at once
import gc
gc.collect()  # Force garbage collection periodically
```

### 2. Lightweight CSV Reading (replace pandas)
```python
import csv

def get_temperature():
    """Lightweight CSV reading without pandas"""
    data = []
    try:
        with open(TEMPERATURE_FILE, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            # Only return last MAX_ROWS
            data = rows[-MAX_ROWS:] if len(rows) > MAX_ROWS else rows
    except Exception:
        pass
    return data
```

### 3. Disable Auto-reload in Production
```bash
# Don't use --reload on Pi (uses more memory)
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Storage Optimization

### Use Log Rotation
```python
# Add to main.py
MAX_CSV_SIZE_MB = 1  # 1MB max per CSV file

def rotate_csv_if_needed(filepath):
    if os.path.exists(filepath) and os.path.getsize(filepath) > MAX_CSV_SIZE_MB * 1024 * 1024:
        # Archive old file
        os.rename(filepath, filepath + ".old")
        # Create new file with headers
        pd.DataFrame(columns=["timestamp", "temperature"]).to_csv(filepath, index=False)
```

## Performance Monitoring

### Check Memory Usage:
```bash
# On Raspberry Pi
free -h
htop  # Install with: sudo apt install htop
```

### Check Process Memory:
```bash
ps aux | grep python
ps aux | grep uvicorn
```

## Raspberry Pi Model Recommendations

| Model | RAM | Status | Notes |
|-------|-----|--------|-------|
| Pi Zero 2 W | 512MB | ⚠️ Tight | Production mode only, no dev server |
| Pi 3B/3B+ | 1GB | ✅ Good | Works well in production mode |
| Pi 4 (2GB) | 2GB | ✅ Great | Comfortable for development |
| Pi 4 (4GB+) | 4GB+ | ✅ Excellent | Overkill but perfect |
| Pi 5 | 4/8GB | ✅ Excellent | Best performance |

## Space-Specific Optimizations

### 1. Reduce Update Frequency
```python
SENSOR_INTERVAL_SECONDS = 300  # Every 5 minutes (space is slow-changing)
CHECK_INTERVAL_SECONDS = 600   # Check expiry every 10 minutes
```

### 2. Minimal Logging
```python
# Reduce FastAPI logging
import logging
logging.getLogger("uvicorn").setLevel(logging.WARNING)
```

### 3. Compress Old Data
```bash
# Compress old CSV files
gzip temperature_data.csv.old
```

## Estimated Power Consumption

- **Raspberry Pi 4**: ~3-5W idle, ~6-8W under load
- **Arduino**: ~0.5W
- **Total**: ~4-9W ⚡ (Very space-friendly!)

Compare to: Laptop ~20-60W

## Quick Setup Script for Pi

```bash
#!/bin/bash
# setup_pi.sh

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python dependencies
sudo apt install python3-pip python3-venv -y

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install packages
pip install -r requirments.txt

# Build frontend (do this on PC first, then copy to Pi)
# cd frontend && npm run build && cd ..

# Initialize database
python init_db.py

# Done!
echo "✅ Setup complete! Run: uvicorn main:app --host 0.0.0.0"
```

## Testing on Pi

1. **Transfer your project** to Pi:
   ```bash
   scp -r space-freezer/ pi@raspberrypi.local:~/
   ```

2. **Build frontend on your PC first** (faster than building on Pi):
   ```bash
   cd frontend
   npm run build
   ```

3. **Run on Pi**:
   ```bash
   ssh pi@raspberrypi.local
   cd space-freezer
   ./setup_pi.sh
   ```

## Summary

✅ **Yes, it will run on Raspberry Pi!**
✅ **Use production build** (not dev server)
✅ **Optimize CSV handling** (use native Python csv instead of pandas)
✅ **Reduce polling intervals** for space environment
✅ **Target: 150-200MB RAM usage** (comfortable on Pi 3+)

**Best Model for Space**: Raspberry Pi 4 (2GB) - Good balance of power, performance, and cost.

Need help implementing any of these optimizations? 🚀

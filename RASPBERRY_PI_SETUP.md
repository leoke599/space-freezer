# Raspberry Pi Setup Guide - Space Freezer

Complete guide for setting up the Space Freezer monitoring system on a Raspberry Pi.

---

## Prerequisites

### Hardware Required
- Raspberry Pi 3B+ or newer (Pi 4 2GB+ recommended)
- 16GB+ microSD card (Class 10)
- Power supply for Pi
- Arduino Uno (or compatible)
- DS18B20 temperature sensor
- USB cable (for Arduino connection)
- Network connection (WiFi or Ethernet)

### Software Required on Your PC
- Raspberry Pi Imager: https://www.raspberrypi.com/software/
- SSH client (built into Windows 10+, Mac, Linux)
- Your Space Freezer project code

---

## Part 1: Prepare the SD Card

### Step 1: Download Raspberry Pi Imager
1. Go to https://www.raspberrypi.com/software/
2. Download and install for your OS

### Step 2: Flash Raspberry Pi OS
1. Insert microSD card into your PC
2. Open **Raspberry Pi Imager**
3. Click **"Choose Device"** → Select your Pi model
4. Click **"Choose OS"** → **Raspberry Pi OS (other)** → **Raspberry Pi OS Lite (64-bit)**
5. Click **"Choose Storage"** → Select your SD card

### Step 3: Configure Settings (CRITICAL!)
1. Click the **⚙️ gear icon** (bottom right)
2. **Enable SSH:**
   - ✅ Check "Enable SSH"
   - Select "Use password authentication"
   
3. **Set Username & Password:**
   - Username: `raspberry` (or your choice)
   - Password: Create a secure password (write it down!)
   
4. **Configure WiFi:**
   - ✅ Check "Configure wireless LAN"
   - SSID: Your WiFi network name
   - Password: Your WiFi password
   - Country: US (or your country)
   
5. **Set Hostname:**
   - Hostname: `spacefreezer` (or keep default `raspberrypi`)
   
6. **Set Locale:**
   - Timezone: Your timezone
   - Keyboard: Your keyboard layout

7. Click **"Save"**

### Step 4: Write to SD Card
1. Click **"Next"**
2. Confirm to erase the SD card → Click **"Yes"**
3. Wait 5-10 minutes for writing + verification
4. Click **"Continue"** when done
5. Eject SD card safely

---

## Part 2: First Boot & Connection

### Step 1: Boot the Raspberry Pi
1. Insert SD card into Raspberry Pi
2. Connect Ethernet cable (optional, if using WiFi skip this)
3. Connect power supply
4. Wait 30-60 seconds for first boot

### Step 2: Find the Pi on Your Network

**Option A: Using hostname (if you set it to "spacefreezer")**
```powershell
ssh raspberry@spacefreezer.local
```

**Option B: Using default hostname**
```powershell
ssh raspberry@raspberrypi.local
```

**Option C: Find IP address**
- Check your router's admin page for connected devices
- Or use an IP scanner tool
- Then connect: `ssh raspberry@[IP_ADDRESS]`

### Step 3: First Login
```bash
# Enter the password you set during imaging
# You should see:
raspberry@spacefreezer:~ $
```

✅ **You're connected!**

---

## Part 3: Initial Raspberry Pi Setup

### Update System Packages
```bash
sudo apt update
sudo apt upgrade -y
```

This may take 10-15 minutes on first boot.

### Install Essential Tools
```bash
sudo apt install -y git vim curl wget python3-pip python3-venv
```

### Configure Pi Settings (Optional)
```bash
sudo raspi-config
```

Navigate and configure:
- **Performance Options** → **GPU Memory** → Set to `16` (minimal GPU, more RAM for apps)
- **Localisation Options** → Verify timezone/keyboard if needed
- **Finish** → Reboot if prompted

---

## Part 4: Transfer Space Freezer Project

### Option A: Using SCP (Recommended)

#### On Your PC:
```powershell
# Navigate to your project folder
cd C:\Users\idekn\vscode_projects

# Compress project (exclude node_modules and venv)
tar -czf space-freezer.tar.gz space-freezer --exclude=space-freezer/node_modules --exclude=space-freezer/venv --exclude=space-freezer/__pycache__ --exclude=space-freezer/.git

# Transfer to Pi (replace with your Pi's hostname/IP)
scp space-freezer.tar.gz raspberry@spacefreezer.local:~/
```

#### On the Pi:
```bash
cd ~
tar -xzf space-freezer.tar.gz
cd space-freezer
```

### Option B: Using Git (If you have a repository)
```bash
cd ~
git clone https://github.com/leoke599/space-freezer.git
cd space-freezer
```

### Important: Build Frontend on PC First!
**Before transferring**, make sure you've built the frontend on your PC:
```powershell
cd frontend
npm run build
```

The `frontend/dist/` folder must be included in the transfer!

---

## Part 5: Install Python Dependencies

### Create Virtual Environment
```bash
cd ~/space-freezer
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your prompt.

### Install Python Packages
```bash
pip install --upgrade pip
pip install -r requirments.txt
```

This will install:
- fastapi
- uvicorn
- sqlalchemy
- pandas
- python-barcode
- pillow
- pyserial
- requests

**Note:** Installation may take 5-10 minutes on Pi 3, faster on Pi 4.

### Initialize Database
```bash
python init_db.py
```

Should output: "Database initialized successfully!"

---

## Part 6: Connect Arduino

### Physical Connection
1. Plug Arduino Uno into Pi's USB port
2. Upload your DS18B20 sketch to Arduino (from Arduino IDE on your PC)
3. Close Arduino IDE Serial Monitor

### Test Arduino Connection
```bash
python test_arduino_connection.py
```

Should show:
```
✅ Found 1 serial port(s):
1. /dev/ttyACM0 (or /dev/ttyUSB0)
   Description: Arduino Uno
   ⭐ This looks like your Arduino!
```

---

## Part 7: Start the System

### Manual Start (For Testing)

**Terminal 1 - Backend:**
```bash
cd ~/space-freezer
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - Arduino Reader (new SSH session):**
```bash
cd ~/space-freezer
source venv/bin/activate
python arduino_serial_reader.py
```

### Automated Start Script

Create `start.sh`:
```bash
cd ~/space-freezer
nano start.sh
```

Paste this content:
```bash
#!/bin/bash
cd ~/space-freezer
source venv/bin/activate

echo "================================"
echo "Space Freezer System Starting..."
echo "================================"

# Start backend in background
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Arduino reader in background
python arduino_serial_reader.py &
ARDUINO_PID=$!

echo ""
echo "✅ Backend started (PID: $BACKEND_PID)"
echo "✅ Arduino reader started (PID: $ARDUINO_PID)"
echo ""
echo "================================"
echo "Space Freezer is running!"
echo "================================"
echo "Access dashboard at:"
echo "http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "================================"

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $ARDUINO_PID 2>/dev/null; echo 'Services stopped.'; exit" SIGINT SIGTERM
wait
```

Save and exit:
- Press `Ctrl+O` (save)
- Press `Enter` (confirm)
- Press `Ctrl+X` (exit)

Make it executable:
```bash
chmod +x start.sh
```

### Run the System
```bash
./start.sh
```

---

## Part 8: Access the Dashboard

### Find Your Pi's IP Address
```bash
hostname -I
```

Example output: `10.14.200.126 2600:382:...`

Use the first IP (IPv4): `10.14.200.126`

### Open in Browser
From any device on the same network:
```
http://10.14.200.126:8000
```

You should see the Space Freezer dashboard! 🎉

---

## Troubleshooting

### Can't SSH to Pi
1. Verify Pi is powered on (green LED should be on)
2. Check WiFi/Ethernet connection
3. Try connecting a monitor + keyboard directly
4. Verify SSH was enabled during SD card imaging
5. Check router for Pi's IP address

### WiFi Not Connecting
```bash
# Manually configure WiFi
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
```

Add:
```
network={
    ssid="YourNetworkName"
    psk="YourPassword"
}
```

Restart networking:
```bash
sudo systemctl restart dhcpcd
```

### Arduino Not Detected
```bash
# Check USB devices
lsusb

# Check serial ports
ls /dev/tty*

# Check permissions
sudo usermod -a -G dialout $USER
# Then logout and login again
```

### Frontend Shows "Not Found"
Make sure `frontend/dist/` folder exists:
```bash
ls -la ~/space-freezer/frontend/dist/
```

If missing, rebuild on PC and transfer:
```powershell
# On PC
cd frontend
npm run build
tar -czf dist.tar.gz dist
scp dist.tar.gz raspberry@spacefreezer.local:~/space-freezer/frontend/

# On Pi
cd ~/space-freezer/frontend
tar -xzf dist.tar.gz
```

### System Runs Slow
```bash
# Check memory usage
free -h

# Check CPU usage
htop  # Press 'q' to quit

# Check running processes
ps aux | grep python
```

### Database Errors
```bash
# Reinitialize database
cd ~/space-freezer
rm freezer_inventory.db
python init_db.py
```

---

## Part 9: Auto-Start on Boot (Optional)

For production deployment, make the system start automatically when Pi boots.

### Create Systemd Service for Backend
```bash
sudo nano /etc/systemd/system/space-freezer.service
```

Paste:
```ini
[Unit]
Description=Space Freezer Backend
After=network.target

[Service]
Type=simple
User=raspberry
WorkingDirectory=/home/raspberry/space-freezer
ExecStart=/home/raspberry/space-freezer/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Create Systemd Service for Arduino Reader
```bash
sudo nano /etc/systemd/system/arduino-reader.service
```

Paste:
```ini
[Unit]
Description=Arduino Temperature Reader
After=network.target space-freezer.service

[Service]
Type=simple
User=raspberry
WorkingDirectory=/home/raspberry/space-freezer
ExecStart=/home/raspberry/space-freezer/venv/bin/python arduino_serial_reader.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable space-freezer
sudo systemctl enable arduino-reader
sudo systemctl start space-freezer
sudo systemctl start arduino-reader
```

### Check Status
```bash
sudo systemctl status space-freezer
sudo systemctl status arduino-reader
```

### View Logs
```bash
journalctl -u space-freezer -f
journalctl -u arduino-reader -f
```

---

## Useful Commands Reference

### System Management
```bash
# Reboot Pi
sudo reboot

# Shutdown Pi
sudo shutdown -h now

# Check system info
uname -a
cat /etc/os-release
```

### Service Management
```bash
# Stop Space Freezer
sudo systemctl stop space-freezer
sudo systemctl stop arduino-reader

# Restart services
sudo systemctl restart space-freezer
sudo systemctl restart arduino-reader

# Disable auto-start
sudo systemctl disable space-freezer
sudo systemctl disable arduino-reader
```

### Manual Start/Stop (if not using systemd)
```bash
# Start
cd ~/space-freezer
./start.sh

# Stop (press Ctrl+C in the terminal)

# Or kill processes
pkill -f uvicorn
pkill -f arduino_serial_reader
```

### Monitoring
```bash
# Check memory
free -h

# Check disk space
df -h

# Check temperature (Pi CPU)
vcgencmd measure_temp

# Check processes
htop
```

### Networking
```bash
# Find Pi's IP
hostname -I

# Test network
ping google.com

# Check network interfaces
ip addr show
```

---

## Performance Benchmarks

### Expected Resource Usage (Pi 4 2GB):
- **RAM**: 150-200 MB (backend + Arduino reader)
- **CPU**: 5-10% idle, 20-30% under load
- **Disk**: ~100 MB for application
- **Boot Time**: 30-45 seconds
- **Power**: 6-8W total

### Temperature Monitoring:
Pi should stay under 70°C. If higher:
- Ensure good ventilation
- Consider adding heatsinks or fan
- Check power supply is adequate

---

## Backup & Recovery

### Backup Database
```bash
cd ~/space-freezer
cp freezer_inventory.db freezer_inventory.db.backup
```

### Backup CSV Data
```bash
tar -czf data-backup.tar.gz temperature_data.csv power_data.csv
```

### Full System Backup
```bash
# On Pi, create archive
cd ~
tar -czf space-freezer-backup-$(date +%Y%m%d).tar.gz space-freezer

# Transfer to PC
# On PC:
scp raspberry@spacefreezer.local:~/space-freezer-backup-*.tar.gz .
```

### Restore from Backup
```bash
cd ~
tar -xzf space-freezer-backup-20251104.tar.gz
cd space-freezer
source venv/bin/activate
./start.sh
```

---

## Security Recommendations

### Change Default Password
```bash
passwd
```

### Update System Regularly
```bash
sudo apt update && sudo apt upgrade -y
```

### Enable Firewall (Optional)
```bash
sudo apt install ufw
sudo ufw allow 22    # SSH
sudo ufw allow 8000  # Web interface
sudo ufw enable
```

### Restrict SSH Access (Optional)
```bash
sudo nano /etc/ssh/sshd_config
```

Change:
- `PermitRootLogin no`
- `PasswordAuthentication no` (if using SSH keys)

Restart SSH:
```bash
sudo systemctl restart ssh
```

---

## Next Steps

✅ **System is running on Raspberry Pi**  
✅ **Accessible from any device on network**  
✅ **Temperature monitoring active**  
✅ **Ready for NASA HUNCH demo**

Consider adding:
- Alert system visibility
- Data export features
- Multi-sensor support
- User authentication
- HTTPS/SSL certificates

---

## Support & Resources

- **Raspberry Pi Docs**: https://www.raspberrypi.com/documentation/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Python Docs**: https://docs.python.org/3/

---

## Quick Start Summary

```bash
# 1. Flash SD card with Raspberry Pi OS Lite (64-bit)
# 2. Boot Pi and SSH in
ssh raspberry@spacefreezer.local

# 3. Update system
sudo apt update && sudo apt upgrade -y

# 4. Transfer project from PC
# (on PC) scp space-freezer.tar.gz raspberry@spacefreezer.local:~/

# 5. Extract and setup
tar -xzf space-freezer.tar.gz
cd space-freezer
python3 -m venv venv
source venv/bin/activate
pip install -r requirments.txt
python init_db.py

# 6. Start system
./start.sh

# 7. Access at http://[PI_IP]:8000
```

---

**Last Updated**: November 2025  
**Tested On**: Raspberry Pi 4 Model B (2GB, 4GB), Raspberry Pi 3B+  
**OS Version**: Raspberry Pi OS Lite (64-bit) Bookworm

🚀 Ready for Space!

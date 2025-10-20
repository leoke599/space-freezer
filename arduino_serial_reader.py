"""
Arduino Serial Temperature Reader
Reads temperature data from Arduino via USB serial connection and sends to FastAPI backend.
This is ideal for space applications where WiFi is not available.
"""

import serial
import serial.tools.list_ports
import requests
import time
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000/temperature"
BAUD_RATE = 115200  # Must match Arduino sketch
READ_INTERVAL = 1  # How often to check for data (seconds)

def list_available_ports():
    """List all available serial ports"""
    ports = serial.tools.list_ports.comports()
    print("\n=== Available Serial Ports ===")
    for i, port in enumerate(ports):
        print(f"{i+1}. {port.device} - {port.description}")
    return ports

def select_port(ports):
    """Let user select which port to use"""
    if not ports:
        print("ERROR: No serial ports found!")
        print("Make sure Arduino is connected via USB.")
        sys.exit(1)
    
    if len(ports) == 1:
        print(f"\nAuto-selecting only available port: {ports[0].device}")
        return ports[0].device
    
    while True:
        try:
            choice = input(f"\nSelect port (1-{len(ports)}): ")
            index = int(choice) - 1
            if 0 <= index < len(ports):
                return ports[index].device
            print("Invalid selection. Try again.")
        except ValueError:
            print("Please enter a number.")

def parse_temperature_line(line):
    """
    Parse temperature from Arduino serial output.
    Expected format: "TEMP:23.45" or "Temperature: 23.45 C"
    """
    line = line.strip()
    
    # Format 1: TEMP:23.45
    if line.startswith("TEMP:"):
        try:
            temp = float(line.split(":")[1])
            return temp
        except (ValueError, IndexError):
            return None
    
    # Format 2: Temperature: 23.45 C or similar
    if "temperature" in line.lower():
        try:
            # Extract number from string
            parts = line.split(":")
            if len(parts) >= 2:
                temp_str = parts[1].split()[0]  # Get first word after colon
                temp = float(temp_str)
                return temp
        except (ValueError, IndexError):
            return None
    
    return None

def send_to_backend(temperature):
    """Send temperature reading to FastAPI backend"""
    try:
        response = requests.post(
            BACKEND_URL,
            params={"temperature": temperature},
            timeout=5
        )
        if response.status_code == 200:
            print(f"✓ Sent to backend: {temperature}°C")
            return True
        else:
            print(f"✗ Backend error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend. Is FastAPI running?")
        return False
    except Exception as e:
        print(f"✗ Error sending data: {e}")
        return False

def main():
    print("=" * 50)
    print("Arduino Serial Temperature Reader")
    print("Space Freezer Monitoring System")
    print("=" * 50)
    
    # List and select port
    ports = list_available_ports()
    port = select_port(ports)
    
    print(f"\nConnecting to {port} at {BAUD_RATE} baud...")
    
    try:
        # Open serial connection
        ser = serial.Serial(port, BAUD_RATE, timeout=1)
        time.sleep(2)  # Wait for Arduino to reset after connection
        print("✓ Connected to Arduino!")
        print(f"✓ Backend URL: {BACKEND_URL}")
        print("\n--- Reading temperature data (Ctrl+C to stop) ---\n")
        
        last_temp = None
        consecutive_failures = 0
        
        while True:
            try:
                # Read line from serial
                if ser.in_waiting > 0:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    
                    if line:
                        # Print raw output for debugging
                        timestamp = datetime.now().strftime("%H:%M:%S")
                        print(f"[{timestamp}] Arduino: {line}")
                        
                        # Try to parse temperature
                        temp = parse_temperature_line(line)
                        
                        if temp is not None and temp != last_temp:
                            last_temp = temp
                            if send_to_backend(temp):
                                consecutive_failures = 0
                            else:
                                consecutive_failures += 1
                        
                        # Warn if too many failures
                        if consecutive_failures >= 5:
                            print("\n⚠ WARNING: Multiple backend failures. Check if FastAPI is running.")
                            consecutive_failures = 0
                
                time.sleep(READ_INTERVAL)
                
            except KeyboardInterrupt:
                print("\n\nStopping reader...")
                break
            except Exception as e:
                print(f"Error reading serial: {e}")
                time.sleep(1)
        
    except serial.SerialException as e:
        print(f"\n✗ Serial connection error: {e}")
        print("Make sure:")
        print("  1. Arduino is connected via USB")
        print("  2. Correct port is selected")
        print("  3. No other program is using the port (close Arduino IDE Serial Monitor)")
        sys.exit(1)
    
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print("✓ Serial connection closed")

if __name__ == "__main__":
    main()

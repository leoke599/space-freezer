"""
Quick test script to verify Arduino serial connection
Run this to check if your Arduino is detected and communicating
"""

import serial.tools.list_ports

print("=" * 50)
print("Arduino Connection Test")
print("=" * 50)

ports = serial.tools.list_ports.comports()

if not ports:
    print("\n❌ No serial ports detected!")
    print("\nMake sure:")
    print("  1. Arduino is connected via USB")
    print("  2. Arduino drivers are installed")
    print("  3. Try a different USB port or cable")
else:
    print(f"\n✅ Found {len(ports)} serial port(s):\n")
    for i, port in enumerate(ports, 1):
        print(f"{i}. {port.device}")
        print(f"   Description: {port.description}")
        print(f"   Manufacturer: {port.manufacturer}")
        if "Arduino" in port.description or "CH340" in port.description or "USB" in port.description:
            print(f"   ⭐ This looks like your Arduino!")
        print()

print("\nNext steps:")
print("1. Upload arduino_temperature_sensor.ino to your Arduino")
print("2. Close Arduino IDE Serial Monitor")
print("3. Run: python arduino_serial_reader.py")

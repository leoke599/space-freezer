/*********************************************************************
  DS18B20 Temperature Sensor - Space Freezer Integration
  
  Reads temperature from DS18B20 sensor and sends via USB serial
  to be captured by arduino_serial_reader.py
  
  Modified for Space Freezer project
*********************************************************************/

#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 2                // DS18B20 data wire is connected to input 2

DeviceAddress thermometerAddress;     // custom array type to hold 64 bit device address

OneWire oneWire(ONE_WIRE_BUS);        // create a oneWire instance to communicate with temperature IC
DallasTemperature tempSensor(&oneWire);  // pass the oneWire reference to Dallas Temperature

void setup()   {

  Serial.begin(115200);  // Changed to 115200 to match arduino_serial_reader.py
                      
  Serial.println("=== Space Freezer Temperature Monitor (Serial Mode) ===");
  Serial.println("DS18B20 Temperature IC");
  Serial.println("Locating devices...");
  tempSensor.begin();                         // initialize the temp sensor

  if (!tempSensor.getAddress(thermometerAddress, 0))
    Serial.println("Unable to find Device.");
  else {
    Serial.print("Device 0 Address: ");
    printAddress(thermometerAddress);
    Serial.println();
  }

  tempSensor.setResolution(thermometerAddress, 9);      // set the temperature resolution (9-12)
  Serial.println("Ready to send data!");
}


void loop() {

  tempSensor.requestTemperatures();                      // request temperature sample from sensor on the one wire bus
  float temperatureC = tempSensor.getTempC(thermometerAddress);
  
  displayTemp(temperatureC);  // show temperature for debugging

  delay(60000);  // Changed to 60 seconds (60000 ms) - adjust as needed
}

void displayTemp(float temperatureReading) {             // temperature comes in as a float with 2 decimal places

  // Format for Python script to parse (CRITICAL - don't change this line!)
  Serial.print("TEMP:");
  Serial.println(temperatureReading, 2);  // 2 decimal places
  
  // Human-readable output for debugging
  Serial.print("Temperature: ");
  Serial.print(temperatureReading);
  Serial.print("°C  (");
  Serial.print(DallasTemperature::toFahrenheit(temperatureReading));
  Serial.println("°F)");
}


// print device address from the address array
void printAddress(DeviceAddress deviceAddress)
{
  for (uint8_t i = 0; i < 8; i++)
  {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
  }
}

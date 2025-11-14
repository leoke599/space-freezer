# main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session, relationship
from database import SessionLocal, engine
from models import Item, Base, Transaction, Alert
from fastapi.middleware.cors import CORSMiddleware
import uuid, os
import barcode
from barcode.writer import ImageWriter
from fastapi.responses import FileResponse
import pandas as pd
import random
import asyncio
from datetime import date, datetime
from config import EXPIRY_SOON_DAYS, EXPIRY_URGENT_DAYS, CHECK_INTERVAL_SECONDS
from services.expiry import expiry_status
from routes_mission import router as mission_router
from routes_settings import router as settings_router


app = FastAPI()
app.include_router(mission_router)
app.include_router(settings_router)

#Allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000", "*"],  # Allow Pi access
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Dependency: get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Expiry check background task
async def expiry_sweeper():
    while True:
        try:
            db: Session = SessionLocal()
            today = date.today()
            items = db.query(Item).all()
            for it in items:
                status, days = expiry_status(it.expiration_date, today)

                # Avoid duplicating identical active alerts: only create when needed
                def already_open(msg: str):
                    return db.query(Alert).filter(
                        Alert.message == msg,
                        Alert.resolved_at.is_(None)
                    ).first() is not None

                if status == "expired":
                    msg = f"'{it.name}' is EXPIRED (expired {abs(days)} day(s) ago)."
                    if not already_open(msg):
                        db.add(Alert(
                            type="inventory", severity="critical",
                            message=msg, item_id=it.id
                        ))

                elif status == "urgent":
                    msg = f"'{it.name}' expires in {days} day(s)."
                    if not already_open(msg):
                        db.add(Alert(
                            type="inventory", severity="warning",
                            message=msg, item_id=it.id
                        ))

                elif status == "soon":
                    msg = f"'{it.name}' expires in {days} day(s)."
                    if not already_open(msg):
                        db.add(Alert(
                            type="inventory", severity="info",
                            message=msg, item_id=it.id
                        ))

                # Optional: auto-resolve old alerts if item updated/removed
                if status in ("ok","no_date"):
                    # resolve any open alerts for this item
                    open_alerts = db.query(Alert).filter(
                        Alert.item_id == it.id,
                        Alert.resolved_at.is_(None),
                        Alert.type == "inventory"
                    ).all()
                    now = datetime.utcnow()
                    for a in open_alerts:
                        a.resolved_at = now

            db.commit()
        except Exception as e:
            # You could log this
            pass
        finally:
            db.close()
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(expiry_sweeper())
    asyncio.create_task(sensor_writer())

# Create barcode directory if not exists
BARCODE_DIR = "barcodes"
os.makedirs(BARCODE_DIR, exist_ok=True)

# Create item with barcode generation and table
@app.post("/items/")
def create_item(name: str, quantity: int = 1, location: str = None,
                expiration_date: date = None, temperature_requirement: float = None,
                serving_size: str = None, calories: float = None, protein: float = None,
                carbs: float = None, fat: float = None, fiber: float = None,
                sodium: float = None, sugar: float = None,
                db: Session = Depends(get_db)):

    # Create item with unique code
    unique_code = str(uuid.uuid4())[:8]
    item = Item(
        name=name,
        quantity=quantity,
        location=location,
        date_added=date.today(),
        expiration_date=expiration_date,
        temperature_requirement=temperature_requirement,
        code=unique_code,
        # Nutritional information
        serving_size=serving_size,
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
        fiber=fiber,
        sodium=sodium,
        sugar=sugar
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Generate barcode image
    file_path = os.path.join(BARCODE_DIR, f"{unique_code}")
    code128 = barcode.get('code128', unique_code, writer=ImageWriter())
    code128.save(file_path)

    # Check if we need to create an alert for this new item
    if expiration_date:
        from services.expiry import expiry_status
        today = date.today()
        status, days = expiry_status(expiration_date, today)
        
        alert_msg = None
        alert_severity = None
        
        if status == "expired":
            alert_msg = f"'{name}' is EXPIRED (expired {abs(days)} day(s) ago)."
            alert_severity = "critical"
        elif status == "urgent":
            alert_msg = f"'{name}' expires in {days} day(s)."
            alert_severity = "warning"
        elif status == "soon":
            alert_msg = f"'{name}' expires in {days} day(s)."
            alert_severity = "info"
        
        # Create alert if needed
        if alert_msg:
            # Check if this exact alert already exists
            existing = db.query(Alert).filter(
                Alert.message == alert_msg,
                Alert.resolved_at.is_(None)
            ).first()
            
            if not existing:
                db.add(Alert(
                    type="inventory",
                    severity=alert_severity,
                    message=alert_msg,
                    item_id=item.id
                ))
                db.commit()

    # Return item info + barcode image URL path
    return {
        "id": item.id,
        "name": item.name,
        "code": item.code,
        "barcode_image": f"/barcode/{item.code}.png"
    }

# New route to serve barcode images
@app.get("/barcode/{code}")
def get_barcode(code: str):
    file_path = os.path.join(BARCODE_DIR, f"{code}.png")
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/png")
    return {"error": "Barcode not found"}

# Retrieve all items
@app.get("/items/")
def read_items(db: Session = Depends(get_db)):
    return db.query(Item).all()

# Delete item
@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return {"error": "Item not found"}
    
    # Delete barcode image if it exists
    barcode_path = os.path.join(BARCODE_DIR, f"{item.code}.png")
    if os.path.exists(barcode_path):
        os.remove(barcode_path)
    
    # Delete the item (transactions will cascade delete if configured)
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully", "item_name": item.name}

# Check out item
@app.post("/items/{code}/check_out")
def check_out_item(code: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.code == code).first()
    if not item:
        return {"error": "Item not found"}

    if item.quantity > 0:
        item.quantity -= 1
    else:
        return {"error": "No quantity available"}

    tx = Transaction(item_id=item.id, action="check_out")
    db.add(tx)
    db.commit()
    db.refresh(item)
    return {"message": "Checked out", "item": item, "transaction": tx}

# Check in item
@app.post("/items/{code}/check_in")
def check_in_item(code: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.code == code).first()
    if not item:
        return {"error": "Item not found"}

    item.quantity += 1

    tx = Transaction(item_id=item.id, action="check_in")
    db.add(tx)
    db.commit()
    db.refresh(item)
    return {"message": "Checked in", "item": item, "transaction": tx}

# Transaction history
@app.get("/transactions/")
def read_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).all()

# Temperature and power CSVs + max rows
TEMPERATURE_FILE = "temperature_data.csv"
POWER_FILE = "power_data.csv"
MAX_ROWS = 100
SENSOR_INTERVAL_SECONDS = 60  # Write sensor data every 60 seconds

if not os.path.exists(TEMPERATURE_FILE):
    pd.DataFrame(columns=["timestamp", "temperature"]).to_csv(TEMPERATURE_FILE, index=False)
if not os.path.exists(POWER_FILE):
    pd.DataFrame(columns=["timestamp", "power"]).to_csv(POWER_FILE, index=False)

# Background task: periodically write sensor readings to CSV
# NOTE: Comment out the temperature writing section if you're using real Arduino data
async def sensor_writer():
    while True:
        try:
            now = datetime.utcnow().isoformat()
            
            # OPTIONAL: Comment out these lines when using real Arduino temperature data
            # Write temperature reading (simulated)
            # temp = round(random.uniform(18, 25), 2)
            # pd.DataFrame({"timestamp": [now], "temperature": [temp]}).to_csv(
            #     TEMPERATURE_FILE, mode='a', header=False, index=False
            # )
            
            # Write power reading
            watts = round(random.uniform(10, 50), 2)
            pd.DataFrame({"timestamp": [now], "power": [watts]}).to_csv(
                POWER_FILE, mode='a', header=False, index=False
            )

            # Trim temperature file to MAX_ROWS
            try:
                tdata = pd.read_csv(TEMPERATURE_FILE)
                if len(tdata) > MAX_ROWS:
                    tdata.tail(MAX_ROWS).to_csv(TEMPERATURE_FILE, index=False)
            except Exception:
                pass

            # Trim power file to MAX_ROWS
            try:
                pdata = pd.read_csv(POWER_FILE)
                if len(pdata) > MAX_ROWS:
                    pdata.tail(MAX_ROWS).to_csv(POWER_FILE, index=False)
            except Exception:
                pass

        except Exception:
            pass

        await asyncio.sleep(SENSOR_INTERVAL_SECONDS)

# POST endpoint to receive temperature data from Arduino
@app.post("/temperature")
def post_temperature(temperature: float):
    try:
        now = datetime.utcnow().isoformat()
        
        # Fault detection for DS18B20 sensor
        # -127°C or 85°C are common error values
        # Also reject unrealistic values for a freezer
        is_fault = False
        fault_reason = None
        
        if temperature <= -100 or temperature == -127:
            is_fault = True
            fault_reason = "Sensor disconnected or loose connection (-127°C)"
        elif temperature == 85:
            is_fault = True
            fault_reason = "Sensor not properly initialized (85°C)"
        elif temperature > 100 or temperature < -200:
            is_fault = True
            fault_reason = f"Unrealistic temperature reading ({temperature}°C)"
        
        if is_fault:
            # Create an alert for the sensor fault
            from database import SessionLocal
            from models import Alert
            db = SessionLocal()
            try:
                # Check if there's already an unacknowledged sensor fault alert
                existing_alert = db.query(Alert).filter(
                    Alert.type == "temperature",
                    Alert.severity == "warning",
                    Alert.message.like("%Sensor fault%"),
                    Alert.is_acknowledged == False
                ).first()
                
                if not existing_alert:
                    alert = Alert(
                        type="temperature",
                        severity="warning",
                        message=f"Sensor fault detected: {fault_reason}",
                        is_acknowledged=False
                    )
                    db.add(alert)
                    db.commit()
            finally:
                db.close()
            
            return {
                "status": "fault", 
                "temperature": temperature, 
                "timestamp": now,
                "message": fault_reason
            }
        
        # Save valid temperature reading
        pd.DataFrame({"timestamp": [now], "temperature": [temperature]}).to_csv(
            TEMPERATURE_FILE, mode='a', header=False, index=False
        )
        
        # Trim to MAX_ROWS
        try:
            tdata = pd.read_csv(TEMPERATURE_FILE)
            if len(tdata) > MAX_ROWS:
                tdata.tail(MAX_ROWS).to_csv(TEMPERATURE_FILE, index=False)
        except Exception:
            pass
            
        return {"status": "success", "temperature": temperature, "timestamp": now}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Simulate temperature readings and return data for graph
@app.get("/temperature")
def get_temperature():
    try:
        all_data = pd.read_csv(TEMPERATURE_FILE)
        if len(all_data) > MAX_ROWS:
            all_data = all_data.tail(MAX_ROWS)
        return all_data.to_dict(orient="records")
    except Exception:
        return []

# Get temperature sensor status
@app.get("/temperature/status")
def get_temperature_status():
    """Check if the temperature sensor is working properly"""
    from database import SessionLocal
    from models import Alert
    db = SessionLocal()
    try:
        # Check for recent sensor fault alerts
        recent_fault = db.query(Alert).filter(
            Alert.type == "temperature",
            Alert.severity == "warning",
            Alert.message.like("%Sensor fault%"),
            Alert.is_acknowledged == False
        ).first()
        
        # Check if we have recent temperature data
        try:
            tdata = pd.read_csv(TEMPERATURE_FILE)
            if len(tdata) > 0:
                last_reading_time = pd.to_datetime(tdata.iloc[-1]['timestamp'])
                time_since_reading = (datetime.utcnow() - last_reading_time.replace(tzinfo=None)).total_seconds()
                
                # If no data in last 5 minutes, sensor might be disconnected
                if time_since_reading > 300:
                    return {
                        "status": "no_data",
                        "message": "No recent temperature readings (>5 min)",
                        "last_reading_time": last_reading_time.isoformat(),
                        "seconds_since_reading": int(time_since_reading)
                    }
            else:
                return {"status": "no_data", "message": "No temperature data available"}
        except Exception:
            return {"status": "no_data", "message": "Unable to read temperature data"}
        
        if recent_fault:
            return {
                "status": "fault",
                "message": recent_fault.message,
                "alert_id": recent_fault.id,
                "created_at": recent_fault.created_at.isoformat()
            }
        
        return {"status": "ok", "message": "Sensor operating normally"}
    finally:
        db.close()

# Get all alerts
@app.get("/alerts")
def get_alerts(include_acknowledged: bool = False):
    """Get all alerts, optionally including acknowledged ones"""
    from database import SessionLocal
    from models import Alert
    db = SessionLocal()
    try:
        query = db.query(Alert)
        if not include_acknowledged:
            query = query.filter(Alert.is_acknowledged == False)
        alerts = query.order_by(Alert.created_at.desc()).all()
        return [{
            "id": a.id,
            "type": a.type,
            "severity": a.severity,
            "message": a.message,
            "item_id": a.item_id,
            "is_acknowledged": a.is_acknowledged,
            "created_at": a.created_at.isoformat(),
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None
        } for a in alerts]
    finally:
        db.close()

# Acknowledge/dismiss a sensor fault alert
@app.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int):
    """Mark an alert as acknowledged"""
    from database import SessionLocal
    from models import Alert
    db = SessionLocal()
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return {"status": "error", "message": "Alert not found"}
        
        alert.is_acknowledged = True
        db.commit()
        return {"status": "success", "message": "Alert acknowledged"}
    finally:
        db.close()

# Power consumption simulation endpoint
@app.get("/power")
def get_power():
    try:
        all_data = pd.read_csv(POWER_FILE)
        if len(all_data) > MAX_ROWS:
            all_data = all_data.tail(MAX_ROWS)
        return all_data.to_dict(orient="records")
    except Exception:
        return []
# ===== PRODUCTION FRONTEND SERVING =====
# Serve the built React frontend from FastAPI (for Raspberry Pi deployment)
from fastapi.staticfiles import StaticFiles
from pathlib import Path

FRONTEND_BUILD_DIR = Path(__file__).parent / 'frontend' / 'dist'

if FRONTEND_BUILD_DIR.exists():
    # Mount static assets (JS, CSS, images)
    assets_dir = FRONTEND_BUILD_DIR / 'assets'
    if assets_dir.exists():
        app.mount('/assets', StaticFiles(directory=str(assets_dir)), name='assets')
    
    # Catch-all route: serve index.html for all frontend routes (SPA)
    @app.get('/{full_path:path}')
    async def serve_react_app(full_path: str):
        # Don't intercept API routes
        api_prefixes = ['items', 'temperature', 'power', 'settings', 'mission', 'barcode', 'transactions', 'docs', 'openapi.json']
        if any(full_path.startswith(prefix) for prefix in api_prefixes):
            return {'error': 'API endpoint not found'}
        
        # Serve index.html for all other routes (React Router will handle them)
        index_file = FRONTEND_BUILD_DIR / 'index.html'
        if index_file.exists():
            return FileResponse(str(index_file))
        return {'error': 'Frontend not built. Run: cd frontend && npm run build'}
else:
    print('  Frontend build not found at:', FRONTEND_BUILD_DIR)
    print('    Run: cd frontend && npm run build')
    print('    For development, use: npm run dev (in frontend folder)')


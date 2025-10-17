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
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
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
        code=unique_code
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Generate barcode image
    file_path = os.path.join(BARCODE_DIR, f"{unique_code}")
    code128 = barcode.get('code128', unique_code, writer=ImageWriter())
    code128.save(file_path)

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
async def sensor_writer():
    while True:
        try:
            now = datetime.utcnow().isoformat()
            
            # Write temperature reading
            temp = round(random.uniform(18, 25), 2)
            pd.DataFrame({"timestamp": [now], "temperature": [temp]}).to_csv(
                TEMPERATURE_FILE, mode='a', header=False, index=False
            )
            
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
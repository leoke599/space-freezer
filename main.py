# main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Item, Base
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
import uuid, os
import barcode
from barcode.writer import ImageWriter
from fastapi.responses import FileResponse
from datetime import datetime
import pandas as pd
import random

app = FastAPI()

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

# Create barcode directory if not exists
BARCODE_DIR = "barcodes"
os.makedirs(BARCODE_DIR, exist_ok=True)

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

#Retrieve all items
@app.get("/items/")
def read_items(db: Session = Depends(get_db)):
    return db.query(Item).all()

# Temperature simulation endpoint
CSV_FILE = "temperature_data.csv"

# Ensure the CSV exists
df = pd.DataFrame(columns=["timestamp", "temperature"])
df.to_csv(CSV_FILE, index=False)

@app.get("/temperature")
def get_temperature():
    # Simulate a sensor reading
    temp = round(random.uniform(18, 25), 2)  # replace with actual sensor read
    now = datetime.now().isoformat()

    # Append new reading
    new_row = pd.DataFrame({"timestamp": [now], "temperature": [temp]})
    new_row.to_csv(CSV_FILE, mode='a', header=False, index=False)

    # Return all readings for the graph
    all_data = pd.read_csv(CSV_FILE)
    return all_data.to_dict(orient="records")

@app.get("/power")
def get_power():
    watts = round(random.uniform(10, 50), 2)
    now = datetime.now().isoformat()

    # Write header only if file doesn't exist yet
    file_exists = os.path.exists("power_data.csv")
    new_row = pd.DataFrame({"timestamp": [now], "power": [watts]})
    new_row.to_csv("power_data.csv", mode='a', header=not file_exists, index=False)

    all_data = pd.read_csv("power_data.csv")
    return all_data.to_dict(orient="records")

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



@app.get("/items/")
def read_items(db: Session = Depends(get_db)):
    return db.query(Item).all()

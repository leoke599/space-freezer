# main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Item, Base
from datetime import date
from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/items/")
def create_item(name: str, quantity: int = 1, location: str = None,
                expiration_date: date = None, temperature_requirement: float = None,
                db: Session = Depends(get_db)):
    item = Item(
        name=name,
        quantity=quantity,
        location=location,
        date_added=date.today(),
        expiration_date=expiration_date,
        temperature_requirement=temperature_requirement
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.get("/items/")
def read_items(db: Session = Depends(get_db)):
    return db.query(Item).all()

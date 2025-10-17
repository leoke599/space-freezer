# routes_settings.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from services import settings as svc

router = APIRouter(prefix="/settings", tags=["settings"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("")
def read_settings(db: Session = Depends(get_db)):
    return svc.get_all(db)

@router.put("")
def write_settings(payload: dict, db: Session = Depends(get_db)):
    # (Optional) validate/clip here (e.g., temp ranges)
    svc.update_many(db, payload)
    return {"ok": True}

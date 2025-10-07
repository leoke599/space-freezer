# routes_mission.py
import csv
import os
from pathlib import Path
from typing import Callable, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date

from models import Item, Alert
from services.expiry import expiry_status
from services.status import Gauge, classify_temp, classify_power, classify_humidity
from database import SessionLocal

router = APIRouter(prefix="/mission", tags=["mission"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/panel")
def mission_panel(db: Session = Depends(get_db)):
    current_temp_c = latest_metric("temperature_data.csv", "temperature")
    current_power_w = latest_metric("power_data.csv", "power")
    current_humidity = latest_metric("humidity_data.csv", "humidity")

    temp = build_gauge(current_temp_c, "C", classify_temp, "No temperature readings yet.")
    power = build_gauge(current_power_w, "W", classify_power, "No power readings yet.")
    humidity = None
    if current_humidity is not None:
        humidity = build_gauge(current_humidity, "%", classify_humidity, None)

    # Inventory snapshot
    total_items = db.query(Item).count()
    today = date.today()
    expiring_counts = {"soon":0, "urgent":0, "expired":0}
    next_expiring = []

    for it in db.query(Item).all():
        status, days = expiry_status(it.expiration_date, today)
        if status in expiring_counts:
            expiring_counts[status] += 1
        # Keep a small list of the most pressing items
        if status in ("expired","urgent","soon"):
            next_expiring.append({
                "id": it.id, "name": it.name, "days": days, "status": status,
                "expiration_date": it.expiration_date.isoformat() if it.expiration_date else None
            })

    # Sort by severity then days
    severity_rank = {"expired":0,"urgent":1,"soon":2}
    next_expiring.sort(key=lambda x: (severity_rank[x["status"]], x["days"]))

    return {
        "power": gauge_as_dict(power),
        "temperature": gauge_as_dict(temp),
        "humidity": gauge_as_dict(humidity) if humidity else None,
        "inventory": {
            "total": total_items,
            "expiring": expiring_counts,
            "next": next_expiring[:5]
        }
    }

def gauge_as_dict(g: Gauge | None):
    if g is None: return None
    return {"value": g.value, "unit": g.unit, "status": g.status, "note": g.note}

def latest_metric(filename: str, column: str) -> Optional[float]:
    path = Path(filename)
    if not path.exists() or path.stat().st_size == 0:
        return None

    try:
        with path.open("r", newline="") as fh:
            reader = csv.reader(fh)
            headers = next(reader, [])
    except (OSError, csv.Error):
        return None

    if not headers or column not in headers:
        return None

    try:
        line = tail_csv_line(path)
    except OSError:
        return None

    if not line:
        return None

    try:
        for row in csv.DictReader([line], fieldnames=headers):
            if all(row.get(h, "") == h for h in headers):
                return None
            raw = row.get(column)
            break
        else:
            raw = None
    except csv.Error:
        return None

    if raw is None or raw == "":
        return None

    try:
        return float(raw)
    except ValueError:
        return None


def tail_csv_line(path: Path) -> Optional[str]:
    with path.open("rb") as fh:
        fh.seek(0, os.SEEK_END)
        end = fh.tell()
        if end == 0:
            return None

        pos = end - 1
        # Skip trailing newline characters
        while pos >= 0:
            fh.seek(pos)
            if fh.read(1) == b"\n":
                pos -= 1
            else:
                break

        if pos < 0:
            fh.seek(0)
            return fh.readline().decode().strip() or None

        buffer = bytearray()
        while pos >= 0:
            fh.seek(pos)
            byte = fh.read(1)
            if byte == b"\n":
                break
            buffer.append(byte[0])
            pos -= 1

    if not buffer:
        return None

    buffer.reverse()
    return buffer.decode().strip()


def build_gauge(value: Optional[float], unit: str, classifier: Callable[[float], str], note: Optional[str]) -> Gauge:
    if value is None:
        return Gauge(value=float("nan"), unit=unit, status="critical", note=note)
    return Gauge(value=value, unit=unit, status=classifier(value))

@router.get("/alerts")
def list_alerts(db: Session = Depends(get_db), include_resolved: bool = Query(False)):
    q = db.query(Alert).order_by(Alert.created_at.desc())
    if not include_resolved:
        q = q.filter(Alert.resolved_at.is_(None))
    alerts = q.limit(100).all()
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

@router.post("/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    a = db.query(Alert).get(alert_id)
    if not a: return {"ok": False, "error": "not_found"}
    a.is_acknowledged = True
    db.commit()
    return {"ok": True}

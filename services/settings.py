# services/settings.py
import json
from sqlalchemy.orm import Session
from models import Setting

DEFAULTS = {
  "target_temp_c": 0, "temp_nominal_min": -2, "temp_nominal_max": 2,
  "temp_critical_high": 5, "temp_critical_low": -5,
  "expiry_soon_days": 7, "expiry_urgent_days": 2,
  "control_mode": "hysteresis", "hyst_gap_c": 0.5,
  "alerts_enabled": True, "alert_debounce_s": 60,
  "log_period_s": 30, "retention_days": 30,
}

def get_all(db: Session) -> dict:
    rows = db.query(Setting).all()
    cur = {r.key: json.loads(r.value) for r in rows}
    # fill in defaults
    for k,v in DEFAULTS.items():
        cur.setdefault(k, v)
    return cur

def update_many(db: Session, payload: dict):
    for k,v in payload.items():
        row = db.query(Setting).get(k)
        if not row:
            row = Setting(key=k, value=json.dumps(v))
            db.add(row)
        else:
            row.value = json.dumps(v)
    db.commit()

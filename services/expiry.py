# services/expiry.py
from datetime import date
from typing import Literal, Optional

Status = Literal["no_date","ok","soon","urgent","expired"]

def expiry_status(expiration_date: Optional[date], today: date) -> tuple[Status, int]:
    if not expiration_date:
        return "no_date", 10_000
    delta = (expiration_date - today).days
    if delta < 0:
        return "expired", delta
    if delta <= 2:
        return "urgent", delta
    if delta <= 7:
        return "soon", delta
    return "ok", delta

# services/status.py
from dataclasses import dataclass
from typing import Literal, Optional

@dataclass
class Gauge:
    value: float
    unit: str
    status: Literal["nominal","elevated","critical"]
    note: Optional[str] = None

def classify_temp(c: float) -> str:
    # Example freezer target around 0°C (adjust to your spec)
    if -2 <= c <= 2:  return "nominal"
    if -5 <= c < -2 or 2 < c <= 5: return "elevated"
    return "critical"

def classify_power(w: float) -> str:
    # Rough example thresholds; tune to your PSU/Peltier behavior
    if w <= 40:   return "nominal"
    if w <= 80:   return "elevated"
    return "critical"

def classify_humidity(rh: float) -> str:
    if 30 <= rh <= 50: return "nominal"
    if 20 <= rh < 30 or 50 < rh <= 65: return "elevated"
    return "critical"

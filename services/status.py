# services/status.py
from dataclasses import dataclass
from typing import Literal, Optional

@dataclass
class Gauge:
    value: float
    unit: str
    status: Literal["nominal","elevated","critical"]
    note: Optional[str] = None

def classify_temp(c: float, settings: dict = None) -> str:
    """
    Classify temperature based on settings from database.
    Falls back to default values if settings not provided.
    """
    if settings is None:
        # Default fallback values
        temp_nominal_min = -2
        temp_nominal_max = 2
        temp_critical_low = -5
        temp_critical_high = 5
    else:
        temp_nominal_min = settings.get("temp_nominal_min", -2)
        temp_nominal_max = settings.get("temp_nominal_max", 2)
        temp_critical_low = settings.get("temp_critical_low", -5)
        temp_critical_high = settings.get("temp_critical_high", 5)
    
    # Check if within nominal range
    if temp_nominal_min <= c <= temp_nominal_max:
        return "nominal"
    
    # Check if within elevated range (between nominal and critical)
    if temp_critical_low <= c < temp_nominal_min or temp_nominal_max < c <= temp_critical_high:
        return "elevated"
    
    # Outside critical thresholds
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

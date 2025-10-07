# models.py
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Date, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

Base = declarative_base()

# Existing Item model
class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    location = Column(String, nullable=True)
    date_added = Column(Date)
    expiration_date = Column(Date)
    temperature_requirement = Column(Float, nullable=True)  # °C
    code = Column(String, unique=True, index=True)

# New Transaction model
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    action = Column(String)  # "check_in" or "check_out"
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Link back to the item
    item = relationship("Item", backref="transactions")

# New Alert model
class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)            # e.g. 'inventory', 'temperature', 'power'
    severity = Column(String, nullable=False)        # 'info' | 'warning' | 'critical'
    message = Column(Text, nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    is_acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    item = relationship("Item")
from sqlalchemy import Column, Integer, String, Date, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

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

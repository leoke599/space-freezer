from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os

# SQLite now, PostgreSQL later
DATABASE_URL = "sqlite:///./freezer_inventory.db"
print(">>> USING DATABASE FILE:", os.path.abspath("inventory.db"))
# When you switch later: "postgresql://user:pass@localhost:5432/freezer_inventory"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

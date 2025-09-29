from database import engine
from models import Base

# Initialize the database and create tables
Base.metadata.create_all(bind=engine)
print("✅ Database initialized")
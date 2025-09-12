from fastapi import FastAPI
from pydantic import BaseModel
import sqlite3
import uuid

app = FastAPI()

class Item(BaseModel):
    name: str
    category: str

@app.post("/items")
def create_item(item: Item):
    code = str(uuid.uuid4())[:8]  # unique ID for barcode
    conn = sqlite3.connect("inventory.db")
    c = conn.cursor()
    c.execute("INSERT INTO items (code, name, category) VALUES (?,?,?)",
              (code, item.name, item.category))
    conn.commit()
    conn.close()
    return {"code": code}

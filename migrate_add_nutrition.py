"""
Migration script to add nutritional information columns to the items table.
Run this once to update your existing database.
"""

import sqlite3
import os

DB_FILE = "freezer_inventory.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} not found. Run init_db.py first.")
        return
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(items)")
    columns = [col[1] for col in cursor.fetchall()]
    
    nutrition_columns = {
        'serving_size': 'TEXT',
        'calories': 'REAL',
        'protein': 'REAL',
        'carbs': 'REAL',
        'fat': 'REAL',
        'fiber': 'REAL',
        'sodium': 'REAL',
        'sugar': 'REAL'
    }
    
    added = []
    skipped = []
    
    for col_name, col_type in nutrition_columns.items():
        if col_name not in columns:
            try:
                cursor.execute(f"ALTER TABLE items ADD COLUMN {col_name} {col_type}")
                added.append(col_name)
                print(f"✓ Added column: {col_name}")
            except sqlite3.Error as e:
                print(f"✗ Error adding {col_name}: {e}")
        else:
            skipped.append(col_name)
            print(f"- Column already exists: {col_name}")
    
    conn.commit()
    conn.close()
    
    print(f"\nMigration complete!")
    print(f"Added: {len(added)} columns")
    print(f"Skipped: {len(skipped)} columns (already existed)")

if __name__ == "__main__":
    migrate()

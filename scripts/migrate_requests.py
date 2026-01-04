import sqlite3
import os

# Path to the database file
DB_PATH = os.path.join(os.path.dirname(__file__), '../instance/kle_credentials.db')

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(CREDENTIAL_REQUEST)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'request_details' not in columns:
            print("Adding 'request_details' column to CREDENTIAL_REQUEST table...")
            cursor.execute("ALTER TABLE CREDENTIAL_REQUEST ADD COLUMN request_details TEXT")
            conn.commit()
            print("Migration successful.")
        else:
            print("'request_details' column already exists.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

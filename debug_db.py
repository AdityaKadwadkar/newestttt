
import sqlite3
import json
import os

db_path = os.path.join("instance", "kle_credentials.db")
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("--- OTHER WORKING CREDENTIALS ---")
cur.execute("SELECT credential_type, vc_json FROM credential WHERE credential_type != 'transcript' LIMIT 2;")
rows = cur.fetchall()
for type, vc_json in rows:
    print(f"\nType: {type}")
    print(json.dumps(json.loads(vc_json), indent=2))

print("\n--- FAILING TRANSCRIPT CREDENTIAL (if exists) ---")
cur.execute("SELECT vc_json FROM credential WHERE credential_type = 'transcript' LIMIT 1;")
row = cur.fetchone()
if row:
    print(json.dumps(json.loads(row[0]), indent=2))
else:
    print("No transcript credential found in DB.")

conn.close()

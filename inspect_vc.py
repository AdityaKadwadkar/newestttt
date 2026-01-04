import sqlite3
import json
import os

db_path = "instance/kle_credentials.db"
credential_id = "urn:uuid:165d2ae9-d6ef-4653-87ae-ae1559a6978d"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT vc_json FROM CREDENTIAL WHERE credential_id = ?", (credential_id,))
    row = cursor.fetchone()
    if row:
        vc_json = row[0]
        data = json.loads(vc_json)
        print(json.dumps(data, indent=2))
    else:
        print(f"Credential {credential_id} not found in database.")
except Exception as e:
    print(f"Error querying database: {e}")
finally:
    conn.close()

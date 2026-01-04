"""
RESET ONLY CREDENTIAL BATCH HISTORY
SAFE: touches ONLY CREDENTIAL_BATCH table
"""

from backend.app import create_app
from backend.models import db, CredentialBatch

app = create_app()

with app.app_context():
    print("Deleting credential batch history...")

    db.session.query(CredentialBatch).delete()
    db.session.commit()

    print("✅ Credential batch history cleared successfully")

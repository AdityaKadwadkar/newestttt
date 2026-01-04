"""
SAFE RESET SCRIPT
Deletes ONLY issued credentials.
Does NOT touch students, admin, schema, keys, or Contineo.
"""

from backend.app import create_app
from backend.models import db
from backend.models import (
    Credential,
    CredentialGradeHeader,
    CredentialCourseRecord
)

app = create_app()

with app.app_context():
    print("🔄 Resetting issued credentials...")

    # Delete in FK-safe order
    CredentialCourseRecord.query.delete()
    CredentialGradeHeader.query.delete()
    Credential.query.delete()

    db.session.commit()

    print("✅ Credential reset completed successfully.")

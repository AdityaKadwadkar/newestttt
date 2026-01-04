"""
MASTER RESET SCRIPT - Complete Credential Cleanup
Deletes ALL issued credentials, batches, logs, and grade records.
SAFE: Does NOT touch students, faculty, or admins.
"""

from backend.app import create_app
from backend.models import db
from backend.models import (
    Credential,
    CredentialBatch,
    CredentialIssueLog,
    CredentialGradeHeader,
    CredentialCourseRecord,
    VerificationLog
)

app = create_app()

with app.app_context():
    print("🚀 Starting Master Reset of all credential data...")

    try:
        # Delete in order to satisfy Foreign Key constraints
        print("- Clearing Verification Logs...")
        VerificationLog.query.delete()

        print("- Clearing Course Records...")
        CredentialCourseRecord.query.delete()

        print("- Clearing Grade Headers...")
        CredentialGradeHeader.query.delete()

        print("- Clearing Issue Logs...")
        CredentialIssueLog.query.delete()

        print("- Clearing Individual Credentials...")
        Credential.query.delete()

        print("- Clearing All Batches...")
        CredentialBatch.query.delete()

        db.session.commit()
        print("\n✅ MASTER RESET COMPLETED SUCCESSFULLY.")
        print("All history has been cleared. You can now issue fresh credentials.")

    except Exception as e:
        db.session.rollback()
        print(f"\n❌ ERROR during reset: {str(e)}")

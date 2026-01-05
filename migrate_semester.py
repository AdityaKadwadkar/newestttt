from flask import Flask
from backend.models import db, CredentialGradeHeader
from backend.config import Config
import sqlalchemy as sa

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    engine = db.engine
    inspector = sa.inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('CREDENTIAL_GRADE_HEADER')]
    
    if 'semester' not in columns:
        print("Adding 'semester' column to CREDENTIAL_GRADE_HEADER...")
        try:
            with engine.connect() as conn:
                conn.execute(sa.text("ALTER TABLE CREDENTIAL_GRADE_HEADER ADD COLUMN semester VARCHAR(20) NOT NULL DEFAULT '';"))
                conn.commit()
            print("Successfully added 'semester' column.")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print("'semester' column already exists.")

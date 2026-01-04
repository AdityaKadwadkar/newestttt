"""
Quick test script to verify database and login functionality
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app
from backend.models import db, Admin, Student

app = create_app()

with app.app_context():
    print("\n" + "="*60)
    print("Database Status Check")
    print("="*60)
    
    # Check admin
    admin = Admin.query.filter_by(username='admin').first()
    if admin:
        print(f"✅ Admin found: {admin.username} ({admin.email})")
    else:
        print("❌ Admin not found! Run: python backend/init_db.py")
    
    # Check students
    students = Student.query.all()
    print(f"✅ Students found: {len(students)}")
    if students:
        for student in students[:5]:
            print(f"   - {student.student_id}: {student.first_name} {student.last_name}")
    
    # Check database file
    db_path = app.config['SQLALCHEMY_DATABASE_URI']
    if 'sqlite' in db_path:
        db_file = db_path.replace('sqlite:///', '')
        if os.path.exists(db_file):
            print(f"✅ Database file exists: {db_file}")
        else:
            print(f"❌ Database file not found: {db_file}")
            print("   Run: python backend/init_db.py")
    
    print("\n" + "="*60)
    print("If admin or students are missing, run:")
    print("   python backend/init_db.py")
    print("="*60 + "\n")


"""
Initialize Student Passwords
"""
import sys
import os
sys.path.insert(0, os.getcwd())
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from backend.app import create_app
from backend.models import db, Student
from backend.utils.helpers import hash_password

app = create_app()

def init_passwords():
    with app.app_context():
        students = Student.query.all()
        print(f"Found {len(students)} students.")
        
        default_pwd = "password123"
        pwd_hash = hash_password(default_pwd)
        
        for student in students:
            if not student.password_hash:
                student.password_hash = pwd_hash
                print(f"Setting default password for student: {student.student_id}")
        
        db.session.commit()
        print("Done!")

if __name__ == "__main__":
    init_passwords()

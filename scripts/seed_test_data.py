import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.models import db, Student, Admin
from werkzeug.security import generate_password_hash
from datetime import datetime

app = create_app()

def seed_data():
    with app.app_context():
        # Seed Student
        if not Student.query.filter_by(student_id="STU001").first():
            print("Seeding Student STU001...")
            new_student = Student(
                student_id="STU001",
                first_name="Rahul",
                last_name="Kumar",
                email="rahul@example.com",
                course_enrolled="Computer Science",
                date_of_birth=datetime.strptime("2002-05-15", "%Y-%m-%d").date(),
                password_hash=generate_password_hash("2002-05-15")
            )
            db.session.add(new_student)
        
        # Seed User Provided Student
        if not Student.query.filter_by(student_id="CSE21A1S1").first():
            print("Seeding Student CSE21A1S1...")
            new_student_2 = Student(
                student_id="CSE21A1S1",
                first_name="Test",
                last_name="Student",
                email="cse21a1s1@example.com",
                course_enrolled="Computer Science",
                date_of_birth=datetime.strptime("2003-05-11", "%Y-%m-%d").date(),
                password_hash=generate_password_hash("2003-05-11")
            )
            db.session.add(new_student_2)
        else:
            print("Student STU001 already exists.")

        # Seed Admin
        if not Admin.query.filter_by(username="admin").first():
            print("Seeding Admin 'admin'...")
            new_admin = Admin(
                username="admin",
                password_hash=generate_password_hash("admin123"),
                full_name="System Administrator",
                email="admin@kletech.ac.in",
                role="super_admin"
            )
            db.session.add(new_admin)
        else:
            print("Admin 'admin' already exists.")

        db.session.commit()

        # Seed Faculty as Admins
        from backend.services.contineo_service import ContineoService
        print("Fetching Faculty from Contineo API...")
        
        try:
            faculty_list = ContineoService.get_all_faculty()
            print(f"Found {len(faculty_list)} faculty members.")
            
            for faculty in faculty_list:
                if faculty.get("is_admin"):
                    admin_id = faculty["faculty_id"]
                    if not Admin.query.filter_by(admin_id=admin_id).first():
                        print(f"Seeding Admin {admin_id}...")
                        new_admin = Admin(
                            admin_id=admin_id,
                            username=admin_id, # Username is Faculty ID
                            password_hash=generate_password_hash(faculty["password"]),
                            full_name=f"{faculty['first_name']} {faculty['last_name']}",
                            email=faculty["email"],
                            role="admin"
                        )
                        db.session.add(new_admin)
                    else:
                         print(f"Admin {admin_id} already exists.")
        except Exception as e:
            print(f"Failed to fetch faculty from API: {e}")
            print("Skipping faculty admin seeding.")

        db.session.commit()
        print("Done.")

if __name__ == "__main__":
    seed_data()

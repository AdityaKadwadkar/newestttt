"""
Initialize database with schema and sample data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.models import db, Student, Admin, Course, Marks, Workshop, WorkshopAttendance, Hackathon, HackathonParticipation
from backend.utils.helpers import hash_password
from datetime import date, datetime

def init_database():
    """Initialize database with schema and sample data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("Tables created")
        
        # Create default admin
        admin = Admin.query.filter_by(username='admin').first()
        if not admin:
            admin = Admin(
                admin_id='ADMIN-001',
                username='admin',
                email='admin@kletech.ac.in',
                password_hash=hash_password('admin123'),
                full_name='System Administrator',
                role='issuer'
            )
            db.session.add(admin)
            print("Default admin created (username: admin, password: admin123)")
        
        # Sample students, courses and marks are NOT seeded locally anymore.
        # They should be fetched from Mock Contineo API.

        
        # Create sample workshop
        workshop = Workshop.query.filter_by(workshop_id='WS001').first()
        if not workshop:
            workshop = Workshop(
                workshop_id='WS001',
                workshop_name='Blockchain Technology Workshop',
                description='Introduction to blockchain and smart contracts',
                organizer='KLE Tech Computer Science Department',
                start_date=date(2024, 11, 1),
                end_date=date(2024, 11, 3),
                duration_hours=16,
                venue='Main Auditorium'
            )
            db.session.add(workshop)
            
            # Add workshop attendance
            for student_id in ['STU001', 'STU002']:
                attendance = WorkshopAttendance(
                    workshop_id='WS001',
                    student_id=student_id,
                    attendance_date=date(2024, 11, 3),
                    status='attended',
                    attendance_percentage=100
                )
                db.session.add(attendance)
        print("Created sample workshop")
        
        # Create sample hackathon
        hackathon = Hackathon.query.filter_by(hackathon_id='HACK001').first()
        if not hackathon:
            hackathon = Hackathon(
                hackathon_id='HACK001',
                hackathon_name='KLE Tech Innovation Hackathon 2024',
                description='Annual hackathon for innovative solutions',
                organizer='KLE Tech Innovation Center',
                start_date=date(2024, 10, 15),
                end_date=date(2024, 10, 17),
                venue='Tech Park',
                prize_info='Winner: Rs 50,000 | Runner-up: Rs 25,000'
            )
            db.session.add(hackathon)
            
            # Add hackathon participation
            participation = HackathonParticipation(
                hackathon_id='HACK001',
                student_id='STU001',
                team_name='Team Alpha',
                position='1st',
                prize_won='Winner - Rs 50,000',
                participation_date=date(2024, 10, 17)
            )
            db.session.add(participation)
        print("Created sample hackathon")
        
        # Commit all changes
        db.session.commit()
        print("\nDatabase initialized successfully!")
        print("\nSample credentials:")
        print("  - Admin: username='admin', password='admin123'")
        print("  - Students: STU001, STU002, STU003, STU004, STU005")
        print("\nYou can now start the application!")

if __name__ == '__main__':
    init_database()


"""
Database Models for KLE Tech Digital Credential System
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class Student(db.Model):
    __tablename__ = 'STUDENT'
    
    student_id = db.Column(db.String(50), primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    enrollment_date = db.Column(db.Date)
    department = db.Column(db.String(100))
    batch_year = db.Column(db.Integer)
    division = db.Column(db.String(50))
    section = db.Column(db.String(50))
    course_enrolled = db.Column(db.String(100))
    current_semester = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    password_hash = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'student_id': self.student_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'email': self.email,
            'phone': self.phone,
            'department': self.department,
            'batch_year': self.batch_year,
            'division': self.division,
            'course_enrolled': self.course_enrolled,
            'current_semester': self.current_semester
        }

class Faculty(db.Model):
    __tablename__ = 'FACULTY'
    
    faculty_id = db.Column(db.String(50), primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    department = db.Column(db.String(100))
    designation = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Admin(db.Model):
    __tablename__ = 'ADMIN'
    
    admin_id = db.Column(db.String(50), primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(200))
    role = db.Column(db.String(50), default='issuer')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

class Course(db.Model):
    __tablename__ = 'COURSE'
    
    course_id = db.Column(db.String(50), primary_key=True)
    course_code = db.Column(db.String(50), unique=True, nullable=False)
    course_name = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100))
    credits = db.Column(db.Integer)
    semester = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class StudentCourse(db.Model):
    __tablename__ = 'STUDENT_COURSE'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), db.ForeignKey('STUDENT.student_id'), nullable=False)
    course_id = db.Column(db.String(50), db.ForeignKey('COURSE.course_id'), nullable=False)
    enrollment_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='enrolled')

class Marks(db.Model):
    __tablename__ = 'MARKS'
    
    marks_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), db.ForeignKey('STUDENT.student_id'), nullable=False)
    course_id = db.Column(db.String(50), db.ForeignKey('COURSE.course_id'), nullable=False)
    semester = db.Column(db.Integer)
    marks_obtained = db.Column(db.Numeric(5, 2))
    max_marks = db.Column(db.Numeric(5, 2))
    grade = db.Column(db.String(10))
    exam_date = db.Column(db.Date)
    exam_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Workshop(db.Model):
    __tablename__ = 'WORKSHOP'
    
    workshop_id = db.Column(db.String(50), primary_key=True)
    workshop_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    organizer = db.Column(db.String(200))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    duration_hours = db.Column(db.Integer)
    venue = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WorkshopAttendance(db.Model):
    __tablename__ = 'WORKSHOP_ATTENDANCE'
    
    id = db.Column(db.Integer, primary_key=True)
    workshop_id = db.Column(db.String(50), db.ForeignKey('WORKSHOP.workshop_id'), nullable=False)
    student_id = db.Column(db.String(50), db.ForeignKey('STUDENT.student_id'), nullable=False)
    attendance_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='attended')
    attendance_percentage = db.Column(db.Numeric(5, 2))

class Hackathon(db.Model):
    __tablename__ = 'HACKATHON'
    
    hackathon_id = db.Column(db.String(50), primary_key=True)
    hackathon_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    organizer = db.Column(db.String(200))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    venue = db.Column(db.String(255))
    prize_info = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class HackathonParticipation(db.Model):
    __tablename__ = 'HACKATHON_PARTICIPATION'
    
    id = db.Column(db.Integer, primary_key=True)
    hackathon_id = db.Column(db.String(50), db.ForeignKey('HACKATHON.hackathon_id'), nullable=False)
    student_id = db.Column(db.String(50), db.ForeignKey('STUDENT.student_id'), nullable=False)
    team_name = db.Column(db.String(200))
    position = db.Column(db.String(50))
    prize_won = db.Column(db.String(200))
    participation_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CredentialBatch(db.Model):
    __tablename__ = 'CREDENTIAL_BATCH'
    
    batch_id = db.Column(db.String(50), primary_key=True)
    credential_type = db.Column(db.String(50), nullable=False)
    template_version = db.Column(db.String(10))
    issuer_id = db.Column(db.String(50), db.ForeignKey('ADMIN.admin_id'), nullable=False)
    issue_date = db.Column(db.Date, nullable=False)
    issuer_name = db.Column(db.String(200))
    additional_notes = db.Column(db.Text)
    filter_criteria = db.Column(db.Text)
    total_students = db.Column(db.Integer, default=0)
    processed_count = db.Column(db.Integer, default=0)
    success_count = db.Column(db.Integer, default=0)
    failed_count = db.Column(db.Integer, default=0)
    credential_metadata = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

class Credential(db.Model):
    __tablename__ = 'CREDENTIAL'
    
    credential_id = db.Column(db.String(100), primary_key=True)
    batch_id = db.Column(db.String(50), db.ForeignKey('CREDENTIAL_BATCH.batch_id'))
    student_id = db.Column(db.String(50), db.ForeignKey('STUDENT.student_id'), nullable=False)
    credential_type = db.Column(db.String(50), nullable=False)
    template_version = db.Column(db.String(10))
    vc_json = db.Column(db.Text, nullable=False)
    did_identifier = db.Column(db.String(255))
    proof_signature = db.Column(db.Text)
    issued_date = db.Column(db.DateTime, nullable=False)
    expiry_date = db.Column(db.DateTime)
    issuer_id = db.Column(db.String(50), db.ForeignKey('ADMIN.admin_id'), nullable=False)
    issuer_name = db.Column(db.String(200))
    is_revoked = db.Column(db.Boolean, default=False)
    revoked_date = db.Column(db.DateTime)
    revocation_reason = db.Column(db.Text)
    verification_count = db.Column(db.Integer, default=0)
    last_verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    student = db.relationship('Student', backref='credentials')

class CredentialGradeHeader(db.Model):
    __tablename__ = 'CREDENTIAL_GRADE_HEADER'

    credential_id = db.Column(db.String(100), db.ForeignKey('CREDENTIAL.credential_id'), primary_key=True)
    usn = db.Column(db.String(50), nullable=False)
    student_name = db.Column(db.String(255), nullable=False)
    branch = db.Column(db.String(100), nullable=False)
    program = db.Column(db.String(150), nullable=False)
    father_or_mother_name = db.Column(db.String(255), nullable=False)
    exam_session = db.Column(db.String(100), nullable=False)
    issue_date = db.Column(db.Date, nullable=False)
    total_credits = db.Column(db.Integer, nullable=False)
    sgpa = db.Column(db.Numeric(4, 2), nullable=False)

    credential = db.relationship('Credential', backref='grade_header', uselist=False)

    def to_dict(self):
        return {
            "credential_id": self.credential_id,
            "usn": self.usn,
            "student_name": self.student_name,
            "branch": self.branch,
            "program": self.program,
            "father_or_mother_name": self.father_or_mother_name,
            "exam_session": self.exam_session,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "total_credits": int(self.total_credits) if self.total_credits is not None else None,
            "sgpa": float(self.sgpa) if self.sgpa is not None else None,
        }

class CredentialCourseRecord(db.Model):
    __tablename__ = 'CREDENTIAL_COURSE_RECORDS'

    id = db.Column(db.Integer, primary_key=True)
    credential_id = db.Column(db.String(100), db.ForeignKey('CREDENTIAL.credential_id'), nullable=False)
    serial_no = db.Column(db.Integer, nullable=False)
    course_code = db.Column(db.String(50), nullable=False)
    course_name = db.Column(db.String(255), nullable=False)
    credits = db.Column(db.Integer, nullable=False)
    grade = db.Column(db.String(10), nullable=False)
    gpa = db.Column(db.Numeric(4, 2), nullable=False)

    credential = db.relationship('Credential', backref='course_records')

    def to_dict(self):
        return {
            "id": self.id,
            "credential_id": self.credential_id,
            "serial_no": self.serial_no,
            "course_code": self.course_code,
            "course_name": self.course_name,
            "credits": self.credits,
            "grade": self.grade,
            "gpa": float(self.gpa) if self.gpa is not None else None,
        }

class CredentialDetails(db.Model):
    __tablename__ = 'CREDENTIAL_DETAILS'
    
    id = db.Column(db.Integer, primary_key=True)
    credential_id = db.Column(db.String(100), db.ForeignKey('CREDENTIAL.credential_id'), nullable=False)
    claim_key = db.Column(db.String(100), nullable=False)
    claim_value = db.Column(db.Text)
    claim_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CredentialIssueLog(db.Model):
    __tablename__ = 'CREDENTIAL_ISSUE_LOG'
    
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.String(50), db.ForeignKey('CREDENTIAL_BATCH.batch_id'), nullable=False)
    student_id = db.Column(db.String(50), db.ForeignKey('STUDENT.student_id'), nullable=False)
    credential_id = db.Column(db.String(100), db.ForeignKey('CREDENTIAL.credential_id'))
    status = db.Column(db.String(50), default='pending')
    error_message = db.Column(db.Text)
    processed_at = db.Column(db.DateTime)

class VerificationLog(db.Model):
    __tablename__ = 'VERIFICATION_LOG'
    
    id = db.Column(db.Integer, primary_key=True)
    credential_id = db.Column(db.String(100), db.ForeignKey('CREDENTIAL.credential_id'), nullable=False)
    verifier_id = db.Column(db.String(100))
    verification_method = db.Column(db.String(50))
    verification_status = db.Column(db.String(50))
    verification_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.Text)


class CredentialRequest(db.Model):
    __tablename__ = 'CREDENTIAL_REQUEST'
    
    request_id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(50), db.ForeignKey('STUDENT.student_id'), nullable=False)
    admin_id = db.Column(db.String(50), db.ForeignKey('ADMIN.admin_id'), nullable=False)
    credential_type = db.Column(db.String(50), nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected, allotted
    admin_remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = db.relationship('Student', backref='credential_requests')
    admin = db.relationship('Admin', backref='credential_requests')
    
    # Store dynamic request details (JSON string or simply Text)
    request_details = db.Column(db.Text) 

    def to_dict(self):
        details = {}
        if self.request_details:
            try:
                import json
                details = json.loads(self.request_details)
            except:
                details = {"raw": self.request_details}

        return {
            'request_id': self.request_id,
            'student_id': self.student_id,
            'admin_id': self.admin_id,
            'credential_type': self.credential_type,
            'reason': self.reason,
            'status': self.status,
            'admin_remarks': self.admin_remarks,
            'request_details': details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'student_name': f"{self.student.first_name} {self.student.last_name}" if self.student else "Unknown",
            'admin_name': self.admin.full_name if self.admin else "Unknown"
        }


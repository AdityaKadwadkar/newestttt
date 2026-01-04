-- KLE Tech Digital Credential System Database Schema
-- ONEST Network Compliant

-- STUDENT Table
CREATE TABLE IF NOT EXISTS STUDENT (
    student_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    enrollment_date DATE,
    department VARCHAR(100),
    batch_year INTEGER,
    division VARCHAR(50),
    section VARCHAR(50),
    course_enrolled VARCHAR(100),
    current_semester INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FACULTY Table
CREATE TABLE IF NOT EXISTS FACULTY (
    faculty_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    designation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN Table
CREATE TABLE IF NOT EXISTS ADMIN (
    admin_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'issuer',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- COURSE Table
CREATE TABLE IF NOT EXISTS COURSE (
    course_id VARCHAR(50) PRIMARY KEY,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    credits INTEGER,
    semester INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- STUDENT_COURSE Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS STUDENT_COURSE (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    enrollment_date DATE,
    status VARCHAR(50) DEFAULT 'enrolled',
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (course_id) REFERENCES COURSE(course_id),
    UNIQUE(student_id, course_id)
);

-- MARKS Table
CREATE TABLE IF NOT EXISTS MARKS (
    marks_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    semester INTEGER,
    marks_obtained DECIMAL(5,2),
    max_marks DECIMAL(5,2),
    grade VARCHAR(10),
    exam_date DATE,
    exam_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (course_id) REFERENCES COURSE(course_id)
);

-- WORKSHOP Table
CREATE TABLE IF NOT EXISTS WORKSHOP (
    workshop_id VARCHAR(50) PRIMARY KEY,
    workshop_name VARCHAR(200) NOT NULL,
    description TEXT,
    organizer VARCHAR(200),
    start_date DATE,
    end_date DATE,
    duration_hours INTEGER,
    venue VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WORKSHOP_ATTENDANCE Table
CREATE TABLE IF NOT EXISTS WORKSHOP_ATTENDANCE (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workshop_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    attendance_date DATE,
    status VARCHAR(50) DEFAULT 'attended',
    attendance_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workshop_id) REFERENCES WORKSHOP(workshop_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    UNIQUE(workshop_id, student_id)
);

-- HACKATHON Table
CREATE TABLE IF NOT EXISTS HACKATHON (
    hackathon_id VARCHAR(50) PRIMARY KEY,
    hackathon_name VARCHAR(200) NOT NULL,
    description TEXT,
    organizer VARCHAR(200),
    start_date DATE,
    end_date DATE,
    venue VARCHAR(255),
    prize_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HACKATHON_PARTICIPATION Table
CREATE TABLE IF NOT EXISTS HACKATHON_PARTICIPATION (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hackathon_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    team_name VARCHAR(200),
    position VARCHAR(50),
    prize_won VARCHAR(200),
    participation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hackathon_id) REFERENCES HACKATHON(hackathon_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    UNIQUE(hackathon_id, student_id)
);

-- CREDENTIAL_BATCH Table
CREATE TABLE IF NOT EXISTS CREDENTIAL_BATCH (
    batch_id VARCHAR(50) PRIMARY KEY,
    credential_type VARCHAR(50) NOT NULL,
    template_version VARCHAR(10),
    issuer_id VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    issuer_name VARCHAR(200),
    additional_notes TEXT,
    filter_criteria TEXT,
    total_students INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    credential_metadata TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (issuer_id) REFERENCES ADMIN(admin_id)
);

-- CREDENTIAL Table
CREATE TABLE IF NOT EXISTS CREDENTIAL (
    credential_id VARCHAR(100) PRIMARY KEY,
    batch_id VARCHAR(50),
    student_id VARCHAR(50) NOT NULL,
    credential_type VARCHAR(50) NOT NULL,
    template_version VARCHAR(10),
    vc_json TEXT NOT NULL,
    did_identifier VARCHAR(255),
    proof_signature TEXT,
    issued_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP,
    issuer_id VARCHAR(50) NOT NULL,
    issuer_name VARCHAR(200),
    is_revoked BOOLEAN DEFAULT 0,
    revoked_date TIMESTAMP,
    revocation_reason TEXT,
    verification_count INTEGER DEFAULT 0,
    last_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES CREDENTIAL_BATCH(batch_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (issuer_id) REFERENCES ADMIN(admin_id)
);

-- CREDENTIAL_GRADE_HEADER Table (one row per grade card)
CREATE TABLE IF NOT EXISTS CREDENTIAL_GRADE_HEADER (
    credential_id VARCHAR(100) PRIMARY KEY,
    usn VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    program VARCHAR(150) NOT NULL,
    father_or_mother_name VARCHAR(255) NOT NULL,
    exam_session VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    total_credits INTEGER NOT NULL,
    sgpa DECIMAL(4,2) NOT NULL,
    FOREIGN KEY (credential_id) REFERENCES CREDENTIAL(credential_id)
);

-- CREDENTIAL_COURSE_RECORDS Table (one row per subject)
CREATE TABLE IF NOT EXISTS CREDENTIAL_COURSE_RECORDS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credential_id VARCHAR(100) NOT NULL,
    serial_no INTEGER NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL,
    grade VARCHAR(10) NOT NULL,
    gpa DECIMAL(4,2) NOT NULL,
    FOREIGN KEY (credential_id) REFERENCES CREDENTIAL(credential_id)
);

-- CREDENTIAL_DETAILS Table
CREATE TABLE IF NOT EXISTS CREDENTIAL_DETAILS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credential_id VARCHAR(100) NOT NULL,
    claim_key VARCHAR(100) NOT NULL,
    claim_value TEXT,
    claim_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (credential_id) REFERENCES CREDENTIAL(credential_id)
);

-- CREDENTIAL_ISSUE_LOG Table
CREATE TABLE IF NOT EXISTS CREDENTIAL_ISSUE_LOG (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    credential_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES CREDENTIAL_BATCH(batch_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (credential_id) REFERENCES CREDENTIAL(credential_id)
);

-- VERIFICATION_LOG Table
CREATE TABLE IF NOT EXISTS VERIFICATION_LOG (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credential_id VARCHAR(100) NOT NULL,
    verifier_id VARCHAR(100),
    verification_method VARCHAR(50),
    verification_status VARCHAR(50),
    verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    FOREIGN KEY (credential_id) REFERENCES CREDENTIAL(credential_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_email ON STUDENT(email);
CREATE INDEX IF NOT EXISTS idx_student_dept_batch ON STUDENT(department, batch_year);
CREATE INDEX IF NOT EXISTS idx_credential_student ON CREDENTIAL(student_id);
CREATE INDEX IF NOT EXISTS idx_credential_type ON CREDENTIAL(credential_type);
CREATE INDEX IF NOT EXISTS idx_credential_issued ON CREDENTIAL(issued_date);
CREATE INDEX IF NOT EXISTS idx_credential_batch ON CREDENTIAL(batch_id);
CREATE INDEX IF NOT EXISTS idx_credential_revoked ON CREDENTIAL(is_revoked);
CREATE INDEX IF NOT EXISTS idx_log_batch ON CREDENTIAL_ISSUE_LOG(batch_id);


# KLE Tech Digital Credential Issuer & Verifier

A full-stack system for issuing and verifying educational credentials compliant with ONEST Network protocol, Beckn principles, and W3C Verifiable Credentials Data Model.

## Project Structure

```
├── backend/              # Python Flask backend
│   ├── app.py           # Main Flask application
│   ├── models.py        # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
├── frontend/            # HTML/CSS/JavaScript frontend
│   ├── admin/          # Admin/Issuer interface
│   ├── student/        # Student/Holder interface
│   ├── verifier/       # Verifier/Seeker interface
│   └── shared/         # Shared assets
├── database/            # Database schema and migrations
├── static/              # Static files (CSS, JS, images)
└── templates/           # HTML templates

```

## Features

### Admin Module (Issuer)
- Login & Authorization
- Bulk Credential Issuance
- Filter students by department, batch, division, course, etc.
- Preview credentials before issuing
- CSV upload support

### Student Module (Holder)
- **Password Protected Login** (New)
- View all issued credentials
- Download credentials (JSON/PDF)
- Share credential links
- QR code generation
- Export to wallet

### Verifier Module (Seeker)
- QR code scanning
- Credential verification
- ONEST-compliant APIs
- Verification status display

### System-wide Enhancements
- **Enhanced Responsiveness**: Optimized for Mobile, Tablet, and Desktop (New)
- **Toast Notifications**: Modern pop-up notification system (New)

## Credential Types

1. Markscard
2. Transcript
3. Course Completion
4. Workshop Certificate
5. Hackathon Certificate

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite (can be upgraded to PostgreSQL)
- **Standards**: W3C Verifiable Credentials, JSON-LD, ONEST Network

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Initialize Database
```bash
python backend/init_db.py
```

This creates:
- Database tables
- Default admin (username: `admin`, password: `admin123`)
- Sample students, courses, workshops, and hackathons

### 3. Run the Application
```bash
python main.py
```

Or:
```bash
python backend/app.py
```

### 4. Access the Application

- **Home**: http://localhost:5000/
- **Admin Portal**: http://localhost:5000/admin
- **Student Portal**: http://localhost:5000/student  
- **Verifier Portal**: http://localhost:5000/verifier

### Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Sample Students:**
- STU001, STU002, STU003, STU004, STU005

For detailed setup instructions, see [SETUP.md](SETUP.md)

## ONEST Network Compliance

The system follows ONEST Network protocol for:
- Credential discovery
- Verification APIs
- Secure credential sharing
- Standardized verification responses


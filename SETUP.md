# Setup Instructions

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation Steps

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Initialize Database

Run the database initialization script to create tables and add sample data:

```bash
python backend/init_db.py
```

Or if you prefer:

```bash
cd backend
python init_db.py
```

This will:
- Create all database tables
- Create default admin account (username: `admin`, password: `admin123`)
- Add sample students, courses, workshops, and hackathons

### 3. Start the Application

Run the main application:

```bash
python main.py
```

Or directly:

```bash
python backend/app.py
```

### 4. Access the Application

Once the server is running, open your browser and navigate to:

- **Home Page**: http://localhost:5000/
- **Admin Portal**: http://localhost:5000/admin
- **Student Portal**: http://localhost:5000/student
- **Verifier Portal**: http://localhost:5000/verifier

## Default Credentials

### Admin
- **Username**: `admin`
- **Password**: `admin123`

### Students
Sample student IDs:
- `STU001` - Rahul Kumar (Computer Science)
- `STU002` - Priya Sharma (Computer Science)
- `STU003` - Amit Patel (Electronics)
- `STU004` - Sneha Reddy (Mechanical)
- `STU005` - Vikram Singh (Computer Science)

*Note: Student login uses Student ID only (password authentication can be added later)*

## Project Structure

```
├── backend/              # Python Flask backend
│   ├── app.py           # Main Flask application
│   ├── models.py        # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── init_db.py       # Database initialization
├── frontend/            # HTML/CSS/JavaScript frontend
│   ├── admin/          # Admin interface
│   ├── student/        # Student interface
│   └── verifier/       # Verifier interface
├── static/              # Static files (CSS, JS)
├── database/            # Database schema
├── main.py              # Application entry point
└── requirements.txt     # Python dependencies
```

## Features

### Admin Portal
- Bulk credential issuance
- Filter students by department, batch, division, course, semester
- Preview credentials before issuing
- Batch processing and tracking
- View batch history

### Student Portal
- View all issued credentials
- Download credentials as JSON
- Share verification links
- QR code generation
- Export to wallet

### Verifier Portal
- Verify credentials by ID
- QR code scanning support
- Instant verification results
- ONEST-compliant APIs

## Credential Types

The system supports five types of credentials:

1. **Markscard** - Academic performance records
2. **Transcript** - Complete academic transcript
3. **Course Completion** - Individual course completion certificates
4. **Workshop Certificate** - Workshop participation certificates
5. **Hackathon Certificate** - Hackathon participation/achievement certificates

## API Endpoints

### Admin APIs
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `POST /api/admin/students/filter` - Filter students
- `POST /api/admin/credential/batch/create` - Create credential batch
- `POST /api/admin/credential/batch/process/<batch_id>` - Process batch
- `GET /api/admin/credential/batches` - Get all batches

### Student APIs
- `POST /api/student/login` - Student login
- `GET /api/student/credentials` - Get all credentials
- `GET /api/student/credential/<id>` - Get specific credential
- `GET /api/student/credential/<id>/share` - Get shareable link

### Verifier APIs
- `GET /api/verifier/verify/<credential_id>` - Verify credential
- `POST /api/verifier/verify/qr` - Verify from QR code
- `GET /api/verifier/status/<credential_id>` - Check status

### ONEST APIs
- `POST /api/onest/discover` - Discover credentials
- `POST /api/onest/verify` - ONEST-compliant verification

## Troubleshooting

### Database Issues
If you encounter database errors:
1. Delete the `kle_credentials.db` file (if using SQLite)
2. Run `python backend/init_db.py` again

### Port Already in Use
If port 5000 is already in use:
1. Change the port in `main.py` or `backend/app.py`
2. Update the API_BASE_URL in `static/js/shared.js`

### Import Errors
If you see import errors:
1. Make sure you're in the project root directory
2. Check that all dependencies are installed: `pip install -r requirements.txt`
3. Ensure Python can find the backend module

## Next Steps

1. **Add Authentication**: Implement proper password authentication for students
2. **Email Notifications**: Configure email settings to notify students when credentials are issued
3. **PDF Generation**: Add PDF export functionality for credentials
4. **QR Code Library**: Integrate a proper QR code generation library
5. **Production Database**: Switch from SQLite to PostgreSQL for production
6. **Cryptographic Signing**: Implement proper Ed25519 signature generation and verification

## Support

For issues or questions, please refer to the project documentation or contact the development team.


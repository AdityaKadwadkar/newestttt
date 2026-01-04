import os
import pandas as pd
from flask import Flask, jsonify, request, render_template_string

app = Flask(__name__)

# In-memory storage (reset on restart)
# Initialized with some sample data just in case
STUDENTS = [
    {
        "student_id": "STU001",
        "first_name": "Rahul",
        "last_name": "Kumar",
        "email": "rahul.k@kletech.ac.in",
        "department": "CSE",
        "batch_year": 2024,
        "division": "A",
        "current_semester": 5,
        "course_enrolled": "B.Tech Computer Science",
        "password_dob": "2002-05-15",
        "date_of_birth": "2002-05-15"
    },
    {
        "student_id": "STU002",
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": "priya.s@kletech.ac.in",
        "department": "ECE",
        "batch_year": 2024,
        "division": "B",
        "current_semester": 5,
        "course_enrolled": "B.Tech Electronics",
        "password_dob": "2002-08-20",
        "date_of_birth": "2002-08-20"
    }
]

FACULTY = [
    {
        "faculty_id": "FAC001",
        "first_name": "Anil",
        "last_name": "Sharma",
        "email": "anil.sharma@kletech.ac.in",
        "department": "CSE",
        "designation": "Professor",
        "is_admin": True,
        "password": "password123"
    }
]

COURSES = [
     {"course_id": "C001", "course_code": "CS101", "course_name": "Engineering Mathematics I", "credits": 4, "semester": 1},
     {"course_id": "C002", "course_code": "CS102", "course_name": "Programming in C", "credits": 4, "semester": 1}
]

MARKS = [
    {"student_id": "STU001", "course_id": "C001", "semester": 1, "grade": "A", "gpa": 9},
    {"student_id": "STU001", "course_id": "C002", "semester": 1, "grade": "A", "gpa": 9}
]

# Simple Dashboard for Uploading Data
DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Mock Contineo Dashboard</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        h1 { color: #2c3e50; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: flex; gap: 2rem; margin-bottom: 2rem; }
        .stat-item { text-align: center; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #3498db; }
        .stat-label { color: #7f8c8d; }
        form { margin-top: 1rem; }
        .upload-group { margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
        button { background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2980b9; }
        .success { color: green; margin-bottom: 1rem; }
        .error { color: red; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <h1>Mock Contineo Server</h1>
    
    <div class="stats">
        <div class="stat-item">
            <div class="stat-value">{{ students_count }}</div>
            <div class="stat-label">Students</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{ faculty_count }}</div>
            <div class="stat-label">Faculty</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{ courses_count }}</div>
            <div class="stat-label">Courses</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{ marks_count }}</div>
            <div class="stat-label">Marks Entries</div>
        </div>
    </div>

    {% if message %}
        <div class="{{ status }}">{{ message }}</div>
    {% endif %}

    <div class="card">
        <h2>Data Management</h2>
        <p>Upload CSV files to populate the mock database. <strong>Note: This replaces existing data.</strong></p>
        
        <form action="/upload" method="post" enctype="multipart/form-data">
            <div class="upload-group">
                <label><strong>Students CSV:</strong></label><br>
                <input type="file" name="students_file" accept=".csv">
            </div>
            <div class="upload-group">
                <label><strong>Faculty CSV:</strong></label><br>
                <input type="file" name="faculty_file" accept=".csv">
            </div>
            <div class="upload-group">
                <label><strong>Courses CSV:</strong></label><br>
                <input type="file" name="courses_file" accept=".csv">
            </div>
            <div class="upload-group">
                <label><strong>Marks CSV:</strong></label><br>
                <input type="file" name="marks_file" accept=".csv">
            </div>
            <button type="submit">Upload and Replace Data</button>
        </form>
    </div>

    <div class="card">
        <h2>API Endpoints</h2>
        <ul>
            <li><a href="/api/students" target="_blank">/api/students</a></li>
            <li><a href="/api/faculty" target="_blank">/api/faculty</a></li>
            <li><a href="/api/courses" target="_blank">/api/courses</a></li>
            <li><a href="/api/marks" target="_blank">/api/marks</a></li>
        </ul>
    </div>
</body>
</html>
"""

@app.route('/', methods=['GET'])
def index():
    return render_template_string(DASHBOARD_HTML, 
                                  students_count=len(STUDENTS),
                                  faculty_count=len(FACULTY),
                                  courses_count=len(COURSES),
                                  marks_count=len(MARKS))

@app.route('/upload', methods=['POST'])
def upload_data():
    global STUDENTS, FACULTY, COURSES, MARKS
    message = "Data updated successfully!"
    status = "success"
    
    try:
        # 1. Students
        if 'students_file' in request.files:
            file = request.files['students_file']
            if file.filename:
                df = pd.read_csv(file)
                STUDENTS = df.to_dict(orient='records')
        
        # 2. Faculty
        if 'faculty_file' in request.files:
            file = request.files['faculty_file']
            if file.filename:
                df = pd.read_csv(file)
                FACULTY = df.to_dict(orient='records')
        
        # 3. Courses
        if 'courses_file' in request.files:
            file = request.files['courses_file']
            if file.filename:
                df = pd.read_csv(file)
                COURSES = df.to_dict(orient='records')
        
        # 4. Marks
        if 'marks_file' in request.files:
            file = request.files['marks_file']
            if file.filename:
                df = pd.read_csv(file)
                MARKS = df.to_dict(orient='records')
                
    except Exception as e:
        message = f"Error processing files: {str(e)}"
        status = "error"

    return render_template_string(DASHBOARD_HTML, 
                                  students_count=len(STUDENTS),
                                  faculty_count=len(FACULTY),
                                  courses_count=len(COURSES),
                                  marks_count=len(MARKS),
                                  message=message,
                                  status=status)

@app.route('/api/students', methods=['GET'])
def get_students():
    return jsonify({"success": True, "data": STUDENTS})

@app.route('/api/faculty', methods=['GET'])
def get_faculty():
    return jsonify({"success": True, "data": FACULTY})

@app.route('/api/courses', methods=['GET'])
def get_courses():
    return jsonify({"success": True, "data": COURSES})

@app.route('/api/marks', methods=['GET'])
def get_marks():
    student_id = request.args.get('student_id')
    semester = request.args.get('semester')
    
    filtered = MARKS
    if student_id:
        filtered = [m for m in filtered if str(m.get('student_id')) == str(student_id)]
    if semester:
        filtered = [m for m in filtered if str(m.get('semester')) == str(semester)]
        
    return jsonify({"success": True, "data": filtered})

@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    # Helper to generate enrollments based on marks or students
    # If we have marks, we can infer enrollments
    enrollments = []
    # Logic: if a student has marks in a course, they are enrolled
    seen = set()
    for m in MARKS:
        key = (m.get('student_id'), m.get('course_id'))
        if key not in seen:
            seen.add(key)
            enrollments.append({
                "student_id": m.get('student_id'),
                "course_id": m.get('course_id'),
                "semester": m.get('semester')
            })
    return jsonify({"success": True, "data": enrollments})

if __name__ == '__main__':
    print("Starting Mock Contineo Server on port 3001...")
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=True)

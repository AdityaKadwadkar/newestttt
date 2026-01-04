"""
Helper utility functions
"""
import uuid
import hashlib
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

def generate_id(prefix="", length=32):
    """Generate unique ID"""
    unique_id = str(uuid.uuid4()).replace('-', '')
    if prefix:
        return f"{prefix}-{unique_id[:length]}"
    return unique_id[:length]

def hash_password(password):
    """Hash password for storage"""
    return generate_password_hash(password)

def verify_password(password_hash, password):
    """Verify password against hash"""
    return check_password_hash(password_hash, password)

def format_date(date_obj):
    """Format date object to string"""
    if isinstance(date_obj, str):
        return date_obj
    if date_obj:
        return date_obj.strftime("%Y-%m-%d")
    return None

def format_datetime(datetime_obj):
    """Format datetime object to string"""
    if isinstance(datetime_obj, str):
        return datetime_obj
    if datetime_obj:
        return datetime_obj.isoformat()
    return None

def calculate_cgpa(marks_list):
    """Calculate CGPA from list of marks"""
    if not marks_list:
        return 0.0
    
    total_marks = sum(float(m.get('marks_obtained', 0)) for m in marks_list)
    max_total = sum(float(m.get('max_marks', 100)) for m in marks_list)
    
    if max_total == 0:
        return 0.0
    
    percentage = (total_marks / max_total) * 100
    
    # Convert percentage to CGPA (10 point scale)
    cgpa = percentage / 10
    return round(cgpa, 2)

def validate_email(email):
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def sanitize_input(text):
    """Sanitize user input"""
    if not text:
        return ""
    return str(text).strip()

def parse_filter_criteria(criteria_dict):
    """Parse filter criteria from request"""
    filters = {}
    
    if criteria_dict.get('student_id'):
        filters['student_id'] = criteria_dict['student_id']
    if criteria_dict.get('department'):
        filters['department'] = criteria_dict['department']
    if criteria_dict.get('batch_year'):
        filters['batch_year'] = int(criteria_dict['batch_year'])
    if criteria_dict.get('division'):
        filters['division'] = criteria_dict['division']
    if criteria_dict.get('course_enrolled'):
        filters['course_enrolled'] = criteria_dict['course_enrolled']
    if criteria_dict.get('semester'):
        filters['current_semester'] = int(criteria_dict['semester'])
    if criteria_dict.get('marks_min'):
        filters['marks_min'] = float(criteria_dict['marks_min'])
    if criteria_dict.get('marks_max'):
        filters['marks_max'] = float(criteria_dict['marks_max'])
    
    return filters

def create_response(success=True, data=None, message="", status_code=200):
    """Create standardized API response"""
    response = {
        "success": success,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    return response, status_code

def json_response(success=True, data=None, message="", status_code=200):
    """Create and return JSON response for Flask"""
    from flask import jsonify
    response_data, status_code = create_response(success, data, message, status_code)
    return jsonify(response_data), status_code

def role_required(required_role):
    """Decorator to enforce role-based access control"""
    from functools import wraps
    from flask_jwt_extended import get_jwt
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") != required_role:
                return json_response(False, None, f"Unauthorized: {required_role} role required", 403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator


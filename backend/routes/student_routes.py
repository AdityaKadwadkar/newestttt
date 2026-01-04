"""
Student/Holder API Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models import db, Credential, CredentialGradeHeader, CredentialCourseRecord, CredentialRequest, Admin
from backend.utils.helpers import generate_id, verify_password, create_response, json_response, role_required
from backend.services.contineo_service import ContineoService
from datetime import datetime
import json

bp = Blueprint('student', __name__)

@bp.route('/login', methods=['POST'])
def login():
    """Student login using DOB from Mock Contineo"""
    data = request.get_json()
    student_id = data.get('student_id')
    password = data.get('password')
    
    if not student_id or not password:
        return json_response(False, None, "Student ID and password required", 400)
    
    # Fetch student from Contineo with password included
    # This returns external profile data, no local database check is needed for password.
    student_data = ContineoService.get_student(student_id, include_password=True)
    
    if not student_data:
        return json_response(False, None, "Student not found", 404)
    
    # Use date_of_birth preferentially to match user's manual database view (avoiding the +5:30 shift in password_dob)
    actual_password = student_data.get("date_of_birth")
    if not actual_password:
        actual_password = student_data.get("password_dob")

    # Extract just the date part (YYYY-MM-DD)
    if actual_password and isinstance(actual_password, str) and 'T' in actual_password:
        actual_password = actual_password.split('T')[0]

    # Strict string comparison (Format: YYYY-MM-DD)
    if not actual_password or password != actual_password:
        return json_response(False, None, "Invalid password. Use your DOB (YYYY-MM-DD)", 401)
    
    # Create access token
    access_token = create_access_token(
        identity=student_id,
        additional_claims={
            "role": "student", 
            "email": student_data.get('email')
        }
    )

    # Sync Student to Local DB (Required for Foreign Keys in Requests/Credentials)
    # Check if student exists locally
    from backend.models import Student
    local_student = Student.query.get(student_id)
    
    if not local_student:
        try:
            # Create new local student record from Contineo data
            new_student = Student(
                student_id=student_data.get('student_id'),
                first_name=student_data.get('first_name'),
                last_name=student_data.get('last_name'),
                email=student_data.get('email'),
                department=student_data.get('department'),
                batch_year=student_data.get('batch_year'),
                division=student_data.get('division'),
                current_semester=student_data.get('current_semester'),
                course_enrolled=student_data.get('course_enrolled'),
                # We don't need to store the password hash locally as we auth against Contineo
                # But if the model requires it, we might need a dummy or the actual hash if available
            )
            db.session.add(new_student)
            db.session.commit()
            print(f"Synced student {student_id} to local database.")
        except Exception as e:
            print(f"Error syncing student to local DB: {e}")
            db.session.rollback()
            # We proceed even if sync fails, though subsequent requests might fail.
            # ideally we should error out or retry.
    
    # Return student data (sanitize by removing password before returning)
    if "password_dob" in student_data:
        del student_data["password_dob"]
    if "date_of_birth" in student_data:
        del student_data["date_of_birth"]

    return json_response(True, {
        "token": access_token,
        "student": student_data
    }, "Login successful")

@bp.route('/credentials', methods=['GET'])
@jwt_required()
@role_required('student')
def get_credentials():
    """Get all credentials for student"""
    student_id = get_jwt_identity()
    
    credentials = Credential.query.filter_by(
        student_id=student_id,
        is_revoked=False
    ).order_by(Credential.issued_date.desc()).all()
    
    credential_list = []
    for cred in credentials:
        # Parse VC JSON but SANITIZE it for student view (remove proof/crypto)
        try:
            full_vc = json.loads(cred.vc_json)
            # Create sanitized version
            vc_data = {
                "@context": full_vc.get("@context"),
                "type": full_vc.get("type"),
                "issuer": {
                    "name": full_vc.get("issuer", {}).get("name") # Only expose name
                },
                "issuanceDate": full_vc.get("issuanceDate"),
                "credentialSubject": full_vc.get("credentialSubject", {})
            }
        except:
            vc_data = {}

        header = CredentialGradeHeader.query.get(cred.credential_id)
        course_rows = CredentialCourseRecord.query.filter_by(
            credential_id=cred.credential_id
        ).order_by(CredentialCourseRecord.serial_no).all()

        credential_list.append({
            "credential_id": cred.credential_id,
            "credential_type": cred.credential_type,
            "issued_date": cred.issued_date.isoformat() if cred.issued_date else None,
            "issuer_name": cred.issuer_name,
            "vc_data": vc_data, # Sanitized data for template rendering
            "grade_card": {
                "credentialHeader": header.to_dict() if header else None,
                "courseRecords": [c.to_dict() for c in course_rows]
            } if header else None
        })
    
    return json_response(True, {"credentials": credential_list})

@bp.route('/credential/<credential_id>', methods=['GET'])
@jwt_required()
@role_required('student')
def get_credential_details(credential_id):
    """Get specific credential details"""
    student_id = get_jwt_identity()
    
    credential = Credential.query.filter_by(
        credential_id=credential_id,
        student_id=student_id
    ).first()
    
    if not credential:
        return json_response(False, None, "Credential not found", 404)
    
    try:
        full_vc = json.loads(credential.vc_json)
        # Create sanitized version
        vc_data = {
            "@context": full_vc.get("@context"),
            "type": full_vc.get("type"),
            "issuer": {
                "name": full_vc.get("issuer", {}).get("name")
            },
            "issuanceDate": full_vc.get("issuanceDate"),
            "credentialSubject": full_vc.get("credentialSubject", {})
        }
    except:
        vc_data = {}

    header = CredentialGradeHeader.query.get(credential.credential_id)
    course_rows = CredentialCourseRecord.query.filter_by(
        credential_id=credential.credential_id
    ).order_by(CredentialCourseRecord.serial_no).all()
    
    return json_response(True, {
        "credential_id": credential.credential_id,
        "credential_type": credential.credential_type,
        "vc_data": vc_data, # Sanitized
        # "proof_signature": credential.proof_signature, REMOVED
        "issued_date": credential.issued_date.isoformat() if credential.issued_date else None,
        "issuer_name": credential.issuer_name,
        # "did_identifier": credential.did_identifier, REMOVED
        "grade_card": {
            "credentialHeader": header.to_dict() if header else None,
            "courseRecords": [c.to_dict() for c in course_rows]
        } if header else None
    })

@bp.route('/credential/<credential_id>/share', methods=['GET'])
def share_credential(credential_id):
    """Get shareable credential link (no auth required for verification)"""
    credential = Credential.query.filter_by(
        credential_id=credential_id,
        is_revoked=False
    ).first()
    
    if not credential:
        return json_response(False, None, "Credential not found", 404)
    
    # We do NOT return the full VC data here for the sharing endpoint response
    # The response is just metadata + the link.
    # The verifier endpoint will handle the full verification view.
    
    return json_response(True, {
        "credential_id": credential.credential_id,
        # "vc_data": vc_data, # REMOVED raw data from share response to student
        "verification_url": f"/verifier?credential_id={credential_id}"
    })

@bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required('student')
def get_profile():
    """Get student profile from Academic System"""
    student_id = get_jwt_identity()
    student = ContineoService.get_student(student_id)
    
    if not student:
        return json_response(False, None, "Student not found in academic system", 404)
    
    return json_response(True, student)

@bp.route('/admins', methods=['GET'])
@jwt_required()
@role_required('student')
def get_admins():
    """Get list of administrators for selection"""
    admins = Admin.query.filter_by(is_active=True).all()
    return json_response(True, [
        {
            "admin_id": a.admin_id,
            "full_name": a.full_name,
            "username": a.username
        } for a in admins
    ])

@bp.route('/request', methods=['POST'])
@jwt_required()
@role_required('student')
def submit_request():
    """Submit a credential request"""
    student_id = get_jwt_identity()
    data = request.get_json()
    
    admin_id = data.get('admin_id')
    credential_type = data.get('credential_type')
    reason = data.get('reason')
    details = data.get('details') # Capture dynamic details
    
    if not admin_id or not credential_type:
        return json_response(False, None, "Admin ID and credential type required", 400)
    
    # Validation logic specific to credential types
    if credential_type == 'markscard':
        if not details or not details.get('semester'):
             return json_response(False, None, "Semester is required for Marks Card request", 400)
    
    # Check if a pending request already exists for this type from this student to this admin
    existing = CredentialRequest.query.filter_by(
        student_id=student_id,
        admin_id=admin_id,
        credential_type=credential_type,
        status='pending'
    ).first()
    
    if existing:
        return json_response(False, None, "You already have a pending request for this credential", 400)
    
    new_request = CredentialRequest(
        student_id=student_id,
        admin_id=admin_id,
        credential_type=credential_type,
        reason=reason,
        request_details=json.dumps(details) if details else None
    )
    
    db.session.add(new_request)
    db.session.commit()
    
    return json_response(True, new_request.to_dict(), "Request submitted successfully")

@bp.route('/requests', methods=['GET'])
@jwt_required()
@role_required('student')
def get_requests():
    """Get all requests from the student"""
    student_id = get_jwt_identity()
    requests = CredentialRequest.query.filter_by(student_id=student_id).order_by(CredentialRequest.created_at.desc()).all()
    return json_response(True, [r.to_dict() for r in requests])


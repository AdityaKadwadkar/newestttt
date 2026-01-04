"""
Admin/Issuer API Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models import db, Admin, CredentialBatch, Credential, CredentialRequest
from backend.services.credential_service import CredentialService
from backend.utils.helpers import verify_password, create_response, parse_filter_criteria, json_response, role_required
from datetime import datetime
import json

bp = Blueprint('admin', __name__)

@bp.route('/login', methods=['POST'])
def login():
    """Admin login"""
    data = request.get_json()
    username = str(data.get('username') or "").strip()
    password = str(data.get('password') or "").strip()
    
    if not username or not password:
        return json_response(False, None, "Username and password required", 400)
    
    print(f"Login Attempt: username='{username}'")
    
    # 1. Try Local Auth (Case-insensitive)
    admin = Admin.query.filter(db.func.lower(Admin.username) == db.func.lower(username)).first()
    
    if admin:
        print(f"Local admin found: {admin.username}")
    
    auth_success = False
    if admin and verify_password(admin.password_hash, password):
        print("Local auth success")
        auth_success = True
    else:
        if admin:
            print("Local password mismatch, falling back to Contineo...")
        else:
            print("Local admin not found, trying Contineo Sync...")
        
        # 2. Try Contineo Faculty Auth
        from backend.services.contineo_service import ContineoService
        from backend.utils.helpers import hash_password
        
        faculty_list = ContineoService.get_all_faculty()
        target_faculty = None
        
        for fac in faculty_list:
            if str(fac.get("faculty_id")).upper() == str(username).upper():
                target_faculty = fac
                break
        
        if target_faculty:
            # DEBUG LOG: Inspect the raw structure of the faculty data
            print(f"DEBUG: Found Faculty '{username}'. Keys: {list(target_faculty.keys())}")
            
            # 1. First Check Permission (Is this faculty an admin?)
            is_admin_val = target_faculty.get("is_admin")
            print(f"DEBUG: 'is_admin' raw value for '{username}': {repr(is_admin_val)} (type: {type(is_admin_val)})")
            
            is_admin = (str(is_admin_val).lower().strip() == 'true') if is_admin_val is not None else False
            
            if not is_admin:
                print(f"Security Alert: Faculty {username} attempted login but is NOT an admin in Contineo data.")
                return json_response(False, None, "Access denied: User is not an admin", 403)

            # 2. Proceed with Password Check
            
            # Default to 'password123' if the mock data is corrupted/missing password field
            fac_pass = str(target_faculty.get("password") or "password123").strip()
            if fac_pass == password:
                print(f"Contineo Auth Success for {username}")
                auth_success = True
                
                if not admin:
                    print(f"Creating new local Admin record for {username}")
                    admin = Admin(
                        admin_id=target_faculty.get("faculty_id"),
                        username=target_faculty.get("faculty_id"),
                        email=target_faculty.get("email"),
                        password_hash=hash_password(password),
                        full_name=f"{target_faculty.get('first_name')} {target_faculty.get('last_name')}",
                        role='admin'
                    )
                    db.session.add(admin)
                    db.session.commit()
                else:
                    print(f"Updating local Admin record for {username}")
                    admin.password_hash = hash_password(password)
                    db.session.commit()
            else:
                print(f"Contineo Pass Mismatch or Missing for {username}")
                return json_response(False, None, "Invalid credentials", 401)
        else:
            print(f"Auth Failed: user '{username}' not in Contineo list.")
            return json_response(False, None, "Invalid credentials", 401)
    
    if not admin.is_active:
        return json_response(False, None, "Account is inactive", 403)
    
    # Update last login
    admin.last_login = datetime.utcnow()
    db.session.commit()
    
    # Create access token
    access_token = create_access_token(
        identity=admin.admin_id,
        additional_claims={"role": admin.role, "username": admin.username}
    )
    
    return json_response(True, {
        "token": access_token,
        "admin": {
            "admin_id": admin.admin_id,
            "username": admin.username,
            "full_name": admin.full_name,
            "email": admin.email
        }
    }, "Login successful")

@bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_profile():
    """Get admin profile"""
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id)
    
    if not admin:
        return json_response(False, None, "Admin not found", 404)
    
    return json_response(True, {
        "admin_id": admin.admin_id,
        "username": admin.username,
        "full_name": admin.full_name,
        "email": admin.email,
        "role": admin.role
    })

@bp.route('/students/filter', methods=['POST'])
@jwt_required()
@role_required('admin')
def filter_students():
    """Filter students based on criteria"""
    data = request.get_json()
    filters = parse_filter_criteria(data)
    
    students = CredentialService.filter_students(filters)
    
    return json_response(True, {
        "students": students,
        "count": len(students)
    })

@bp.route('/credential/batch/preview', methods=['POST'])
@jwt_required()
@role_required('admin')
def preview_batch():
    """Preview credential batch before issuing"""
    data = request.get_json()
    filters = parse_filter_criteria(data)
    credential_type = data.get('credential_type')
    
    markscard_semester = data.get('markscard_semester')
    additional_data = None
    if credential_type == "markscard" and markscard_semester:
        additional_data = {"semester": markscard_semester}
    
    students = CredentialService.filter_students(filters)
    
    preview = None
    if students:
        student_data = CredentialService.get_student_data_for_credential(
            students[0]["student_id"],
            credential_type,
            additional_data=additional_data
        )
        if student_data:
            from backend.utils.vc_generator import VCGenerator
            vc_result = VCGenerator.generate_full_vc(
                student_data,
                credential_type,
                {"name": "Preview", "issuer_id": get_jwt_identity()},
                credential_metadata=data.get('metadata')
            )
            preview = vc_result["credential"]
    
    return json_response(True, {
        "student_count": len(students),
        "preview": preview,
        "students": students[:10]
    })

@bp.route('/credential/batch/create', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_batch():
    """Create credential batch"""
    admin_id = get_jwt_identity()
    data = request.get_json()
    
    credential_type = data.get('credential_type')
    filters = parse_filter_criteria(data)
    issuer_info = {
        "name": data.get('issuer_name', 'KLE Technological University'),
        "notes": data.get('additional_notes', ''),
        "issuer_id": admin_id,
        "credential_metadata": data.get('metadata')
    }
    
    if not credential_type:
        return json_response(False, None, "Credential type required", 400)

    additional_data = None
    if credential_type == "markscard":
        markscard_semester = data.get("markscard_semester")
        if not markscard_semester:
            return json_response(False, None, "Semester for markscard is required", 400)
        try:
            sem_val = int(markscard_semester)
            if not (1 <= sem_val <= 8):
                raise ValueError()
        except:
            return json_response(False, None, "Invalid semester value (1-8 required)", 400)
            
        if not issuer_info.get("credential_metadata") or not isinstance(issuer_info["credential_metadata"], dict):
            issuer_info["credential_metadata"] = {}
            
        issuer_info["credential_metadata"].update({
            "semester": markscard_semester,
            "program": data.get("program"),
            "father_or_mother_name": data.get("father_or_mother_name"),
            "exam_session": data.get("exam_session"),
            "courses": data.get("courses") or []
        })
        
        additional_data = issuer_info["credential_metadata"]
    
    try:
        batch, students = CredentialService.create_batch(
            credential_type,
            admin_id,
            filters,
            issuer_info
        )
        
        return json_response(True, {
            "batch_id": batch.batch_id,
            "total_students": len(students),
            "status": batch.status,
            "courses_used": additional_data.get("courses") if additional_data else None
        }, "Batch created successfully")
        
    except Exception as e:
        return json_response(False, None, str(e), 500)

@bp.route('/credential/batch/process/<batch_id>', methods=['POST'])
@jwt_required()
@role_required('admin')
def process_batch(batch_id):
    """Process credential batch"""
    try:
        data = request.get_json(silent=True) or {}
        additional_data = None
        if data.get("credential_type") == "markscard" or data.get("courses"):
            additional_data = {
                "courses": data.get("courses") or [],
                "program": data.get("program"),
                "father_or_mother_name": data.get("father_or_mother_name"),
                "exam_session": data.get("exam_session"),
            }

        success, message = CredentialService.process_batch(batch_id, additional_data=additional_data)
        
        if success:
            batch = CredentialBatch.query.get(batch_id)
            return json_response(True, {
                "batch_id": batch_id,
                "status": batch.status,
                "processed": batch.processed_count,
                "success": batch.success_count,
                "failed": batch.failed_count
            }, message)
        else:
            return json_response(False, None, message, 404)
            
    except Exception as e:
        return json_response(False, None, str(e), 500)

@bp.route('/credential/batches', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_batches():
    """Get all credential batches"""
    batches = CredentialBatch.query.order_by(CredentialBatch.created_at.desc()).all()
    batch_list = []
    for batch in batches:
        batch_list.append({
            "batch_id": batch.batch_id,
            "credential_type": batch.credential_type,
            "total_students": batch.total_students,
            "processed_count": batch.processed_count,
            "success_count": batch.success_count,
            "failed_count": batch.failed_count,
            "status": batch.status,
            "created_at": batch.created_at.isoformat() if batch.created_at else None
        })
    return json_response(True, {"batches": batch_list})

@bp.route('/credential/batch/<batch_id>', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_batch_details(batch_id):
    """Get batch details"""
    batch = CredentialBatch.query.get(batch_id)
    if not batch:
        return json_response(False, None, "Batch not found", 404)
    return json_response(True, {
        "batch_id": batch.batch_id,
        "credential_type": batch.credential_type,
        "template_version": batch.template_version,
        "issue_date": batch.issue_date.isoformat() if batch.issue_date else None,
        "issuer_name": batch.issuer_name,
        "total_students": batch.total_students,
        "processed_count": batch.processed_count,
        "success_count": batch.success_count,
        "failed_count": batch.failed_count,
        "status": batch.status,
        "created_at": batch.created_at.isoformat() if batch.created_at else None,
        "completed_at": batch.completed_at.isoformat() if batch.completed_at else None
    })

@bp.route('/credential/<credential_id>', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_credential(credential_id):
    """Get full credential details including raw VC JSON (Admin only)"""
    credential = Credential.query.get(credential_id)
    if not credential:
        return json_response(False, None, "Credential not found", 404)
    try:
        vc_data = json.loads(credential.vc_json)
    except:
        vc_data = {}
    return json_response(True, {
        "credential_id": credential.credential_id,
        "credential_type": credential.credential_type,
        "vc_data": vc_data,
        "proof_signature": credential.proof_signature,
        "issued_date": credential.issued_date.isoformat() if credential.issued_date else None,
        "issuer_name": credential.issuer_name,
        "did_identifier": credential.did_identifier,
        "is_revoked": credential.is_revoked
    })

@bp.route('/requests', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_requests():
    """Get all credential requests for the logged-in admin"""
    admin_id = get_jwt_identity()
    requests = CredentialRequest.query.filter_by(admin_id=admin_id).order_by(CredentialRequest.created_at.desc()).all()
    return json_response(True, [r.to_dict() for r in requests])

@bp.route('/request/<request_id>/status', methods=['POST'])
@jwt_required()
@role_required('admin')
def update_request_status(request_id):
    """Approve or reject a request"""
    admin_id = get_jwt_identity()
    data = request.get_json()
    status = data.get('status')
    remarks = data.get('remarks')
    if status not in ['approved', 'rejected', 'issued']:
        return json_response(False, None, "Invalid status. Use 'approved', 'rejected' or 'issued'", 400)
    req = CredentialRequest.query.filter_by(request_id=request_id, admin_id=admin_id).first()
    if not req:
        return json_response(False, None, "Request not found", 404)
    if status == 'issued':
        try:
            additional_data = {}
            if req.request_details:
                try:
                    additional_data = json.loads(req.request_details)
                except:
                    pass
            admin = Admin.query.get(admin_id)
            issuer_info = {
                "issuer_id": admin_id,
                "name": admin.full_name or "Admin",
                "issuer_name": admin.full_name or "Admin"
            }
            credential, error = CredentialService.generate_credential_for_student(
                req.student_id,
                req.credential_type,
                None,
                issuer_info,
                additional_data=additional_data
            )
            if not credential:
                return json_response(False, None, f"Failed to issue credential: {error}", 500)
            req.status = 'issued'
            req.admin_remarks = remarks or "Credential Issued Successfully"
            db.session.commit()
            return json_response(True, req.to_dict(), "Credential issued successfully")
        except Exception as e:
            return json_response(False, None, f"Error issuing credential: {str(e)}", 500)
    else:
        req.status = status
        req.admin_remarks = remarks
        db.session.commit()
    return json_response(True, req.to_dict(), f"Request {status} successfully")

@bp.route('/credential/<credential_id>/revoke', methods=['POST'])
@jwt_required()
@role_required('admin')
def revoke_credential(credential_id):
    """Revoke a credential"""
    data = request.get_json()
    reason = data.get('reason', 'Administrative decision')
    credential = Credential.query.get(credential_id)
    if not credential:
        return json_response(False, None, "Credential not found", 404)
    if credential.is_revoked:
        return json_response(False, None, "Credential is already revoked", 400)
    credential.is_revoked = True
    credential.revocation_reason = reason
    credential.revoked_date = datetime.utcnow()
    db.session.commit()
    return json_response(True, {
        "credential_id": credential_id,
        "is_revoked": True,
        "revocation_reason": reason
    }, "Credential revoked successfully")

@bp.route('/system/reset', methods=['POST'])
@jwt_required()
@role_required('admin')
def reset_system():
    """Master Reset of all credential history"""
    from backend.models import (
        CredentialCourseRecord, CredentialGradeHeader, 
        CredentialIssueLog, VerificationLog
    )
    try:
        # Delete in order of dependencies
        VerificationLog.query.delete()
        CredentialCourseRecord.query.delete()
        CredentialGradeHeader.query.delete()
        CredentialIssueLog.query.delete()
        Credential.query.delete()
        CredentialBatch.query.delete()
        
        db.session.commit()
        return json_response(True, None, "Master reset completed. All credential history cleared.")
    except Exception as e:
        db.session.rollback()
        return json_response(False, None, str(e), 500)

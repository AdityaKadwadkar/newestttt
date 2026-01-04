"""
Verifier/Seeker API Routes
"""
from flask import Blueprint, request, jsonify
from backend.models import db, Credential, VerificationLog, CredentialGradeHeader, CredentialCourseRecord
from backend.utils.helpers import create_response, json_response
from datetime import datetime
import json

bp = Blueprint('verifier', __name__)

@bp.route('/verify/<credential_id>', methods=['GET'])
def verify_credential(credential_id):
    """Verify credential by ID (ONEST-compliant, must respond within 2 seconds)"""
    start_time = datetime.utcnow()
    
    credential = Credential.query.filter_by(credential_id=credential_id).first()
    
    if not credential:
        # Log verification attempt
        log_entry = VerificationLog(
            credential_id=credential_id,
            verification_method="api",
            verification_status="not_found",
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log_entry)
        db.session.commit()
        
        return json_response(False, {
            "valid": False,
            "status": "not_found",
            "message": "Credential not found"
        }, "Credential not found", 404)
    
    # Check if revoked
    if credential.is_revoked:
        log_entry = VerificationLog(
            credential_id=credential_id,
            verification_method="api",
            verification_status="revoked",
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log_entry)
        db.session.commit()
        
        return json_response(False, {
            "valid": False,
            "status": "revoked",
            "revoked_date": credential.revoked_date.isoformat() if credential.revoked_date else None,
            "revocation_reason": credential.revocation_reason
        }, "Credential has been revoked", 200)
    
    # Validate proof (Cryptographic Verification)
    try:
        from backend.utils.vc_generator import VCGenerator
        vc_data = json.loads(credential.vc_json)
        
        # Real cryptographic check
        is_valid, verify_message = VCGenerator.verify_proof(vc_data)
        
        # Parse credential data
        credential_subject = vc_data.get('credentialSubject', {})

        # Load structured grade card data if available
        header = CredentialGradeHeader.query.get(credential.credential_id)
        course_rows = CredentialCourseRecord.query.filter_by(
            credential_id=credential.credential_id
        ).order_by(CredentialCourseRecord.serial_no).all()
        
        # External verification (Univerifier.io)
        # We assume this is a "Reference Check" and include it in the details
        # We don't fail local verification if this fails (network issues, etc.)
        from backend.services.external_verifier_service import ExternalVerifierService
        external_result = ExternalVerifierService.verify_with_univerifier(vc_data)
        
        verification_result = {
            "valid": is_valid,
            "status": "verified" if is_valid else "invalid_proof",
            "verification_message": verify_message,
            "credential_id": credential.credential_id,
            "credential_type": credential.credential_type,
            "issuer": {
                "name": credential.issuer_name,
                "id": vc_data.get('issuer', {}).get('id', '')
            },
            "issued_date": credential.issued_date.isoformat() if credential.issued_date else None,
            "credential_subject": credential_subject,
            "grade_card": {
                "credentialHeader": header.to_dict() if header else None,
                "courseRecords": [c.to_dict() for c in course_rows]
            } if header else None,
            "external_verification": external_result, # Add external result
            "vc": vc_data, # Return full VC JSON for "View Raw" feature
            "verification_timestamp": datetime.utcnow().isoformat()
        }
        
        # Update credential verification stats
        credential.verification_count += 1
        credential.last_verified_at = datetime.utcnow()
        
        # Log verification
        log_entry = VerificationLog(
            credential_id=credential_id,
            verification_method="api",
            verification_status="verified" if is_valid else "invalid",
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log_entry)
        db.session.commit()
        
        return json_response(True, verification_result, "Verification successful")
        
    except Exception as e:
        log_entry = VerificationLog(
            credential_id=credential_id,
            verification_method="api",
            verification_status="error",
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log_entry)
        db.session.commit()
        
        return json_response(False, {
            "valid": False,
            "status": "error",
            "message": str(e)
        }, "Verification error", 500)

@bp.route('/verify/qr', methods=['POST'])
def verify_by_qr():
    """Verify credential from QR code data"""
    data = request.get_json()
    credential_id = data.get('credential_id')
    
    if not credential_id:
        return json_response(False, None, "Credential ID required", 400)
    
    return verify_credential(credential_id)

@bp.route('/status/<credential_id>', methods=['GET'])
def check_status(credential_id):
    """Quick status check (revoked/active)"""
    credential = Credential.query.filter_by(credential_id=credential_id).first()
    
    if not credential:
        return json_response(False, {
            "exists": False
        }, "Credential not found", 404)
    
    return json_response(True, {
        "exists": True,
        "is_revoked": credential.is_revoked,
        "issued_date": credential.issued_date.isoformat() if credential.issued_date else None
    })


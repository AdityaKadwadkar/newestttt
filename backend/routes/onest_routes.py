"""
ONEST Network Compliant API Routes
"""
from flask import Blueprint, request, jsonify
from backend.models import db, Credential
from backend.utils.helpers import create_response
from datetime import datetime
import json

bp = Blueprint('onest', __name__)

@bp.route('/discover', methods=['POST'])
def discover_credentials():
    """ONEST-compliant credential discovery API"""
    data = request.get_json()
    
    # Extract search parameters
    student_id = data.get('student_id')
    credential_type = data.get('credential_type')
    issuer_id = data.get('issuer_id')
    
    query = Credential.query.filter_by(is_revoked=False)
    
    if student_id:
        query = query.filter_by(student_id=student_id)
    if credential_type:
        query = query.filter_by(credential_type=credential_type)
    if issuer_id:
        query = query.filter_by(issuer_id=issuer_id)
    
    credentials = query.limit(50).all()
    
    results = []
    for cred in credentials:
        try:
            vc_data = json.loads(cred.vc_json)
        except:
            vc_data = {}
        
        results.append({
            "credential_id": cred.credential_id,
            "credential_type": cred.credential_type,
            "issuer": {
                "id": cred.issuer_id,
                "name": cred.issuer_name
            },
            "issued_date": cred.issued_date.isoformat() if cred.issued_date else None,
            "verification_url": f"/api/verifier/verify/{cred.credential_id}"
        })
    
    return jsonify({
        "success": True,
        "context": {
            "domain": "education.credentials",
            "country": "IN",
            "city": "Hubli",
            "provider_id": "kle-tech-university"
        },
        "message": {
            "credentials": results,
            "count": len(results)
        },
        "timestamp": datetime.utcnow().isoformat()
    })

@bp.route('/verify', methods=['POST'])
def onest_verify():
    """ONEST-compliant verification API"""
    data = request.get_json()
    credential_id = data.get('credential_id')
    
    if not credential_id:
        return jsonify({
            "success": False,
            "error": {
                "type": "REQUEST_ERROR",
                "code": "MANDATORY_PARAMETER_MISSING",
                "message": "credential_id is required"
            }
        }), 400
    
    credential = Credential.query.filter_by(credential_id=credential_id).first()
    
    if not credential:
        return jsonify({
            "success": False,
            "error": {
                "type": "RESOURCE_ERROR",
                "code": "CREDENTIAL_NOT_FOUND",
                "message": "Credential not found"
            }
        }), 404
    
    try:
        vc_data = json.loads(credential.vc_json)
        proof_valid = credential.proof_signature is not None
        
        return jsonify({
            "success": True,
            "context": {
                "domain": "education.credentials",
                "country": "IN",
                "city": "Hubli",
                "provider_id": "kle-tech-university"
            },
            "message": {
                "verification": {
                    "valid": proof_valid and not credential.is_revoked,
                    "status": "verified" if proof_valid else "invalid",
                    "credential_id": credential.credential_id,
                    "credential_type": credential.credential_type,
                    "issuer": {
                        "name": credential.issuer_name,
                        "id": credential.issuer_id
                    },
                    "issued_date": credential.issued_date.isoformat() if credential.issued_date else None,
                    "is_revoked": credential.is_revoked,
                    "verification_timestamp": datetime.utcnow().isoformat()
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "type": "PROCESSING_ERROR",
                "code": "VERIFICATION_FAILED",
                "message": str(e)
            }
        }), 500


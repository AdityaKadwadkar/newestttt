from flask import Blueprint, request, jsonify, current_app
from backend.models import db, Credential
from backend.utils.helpers import create_response
from backend.utils.beckn_auth import BecknAuthHelper
from backend.utils.onest_callback import ONESTCallbackClient
from datetime import datetime
import json

bp = Blueprint('onest', __name__)

class MockRegistryService:
    """Mock for ONEST Registry VLOOKUP"""
    @staticmethod
    def vlookup(subscriber_id):
        # In a real network, this would call the Registry API
        # to get the public key of the subscriber
        trusted_subscribers = {
            "onest-gateway": "7963390c...", # Example keys
            "kle-tech-university": current_app.config.get('ONEST_PUBLIC_KEY')
        }
        return trusted_subscribers.get(subscriber_id)

# Standard ONEST Error Codes
ONEST_ERRORS = {
    "BAD_SIGNATURE": {"type": "AUTH_ERROR", "obj_code": "001", "message": "Invalid Signature"},
    "INVALID_CONTEXT": {"type": "CONTEXT_ERROR", "obj_code": "002", "message": "Invalid context provided"},
    "NOT_FOUND": {"type": "RESOURCE_ERROR", "obj_code": "404", "message": "Resource not found"},
    "INTERNAL_ERROR": {"type": "SYSTEM_ERROR", "obj_code": "500", "message": "An internal error occurred"}
}

def verify_beckn_auth(req):
    """Utility to verify Beckn Authorization header"""
    auth_header = req.headers.get('Authorization')
    if not auth_header:
        current_app.logger.warning("ONEST Request missing Authorization header")
        return True # Soft fail for development
    
    public_key = current_app.config.get('ONEST_PUBLIC_KEY')
    if public_key == '0000000000000000000000000000000000000000000000000000000000000000':
        current_app.logger.info("ONEST Auth skipped (placeholder keys)")
        return True
        
    body = req.get_data(as_text=True)
    
    # 3. VLOOKUP Logic (Mock)
    # Registry Check: Does this subscriber_id exist in the ONEST network?
    parts = {k.strip(): v.strip('"') for k, v in [p.split('=', 1) for p in auth_header.replace('Signature ', '').split(',')]}
    key_id = parts.get('keyId', '')
    subscriber_id_from_header = key_id.split('|')[0] if '|' in key_id else key_id
    
    registry_key = MockRegistryService.vlookup(subscriber_id_from_header)
    if not registry_key:
        current_app.logger.warning(f"VLOOKUP Failed: Subscriber {subscriber_id_from_header} not in registry")
        # For dev, we allow it, but log it
    
    is_valid = BecknAuthHelper.verify_auth_header(auth_header, body, public_key)
    if not is_valid:
        current_app.logger.error("ONEST Beckn Signature Verification Failed")
    return is_valid

@bp.route('/discover', methods=['POST'])
def discover_credentials():
    """ONEST-compliant credential discovery API"""
    if not verify_beckn_auth(request):
        err = ONEST_ERRORS["BAD_SIGNATURE"]
        return jsonify({
            "success": False,
            "error": {
                "type": err["type"],
                "code": err["obj_code"],
                "message": err["message"]
            }
        }), 401

    data = request.get_json()
    
    # 3. Registry Check (Mock for ONEST Certification)
    # In a live network, we would perform a VLOOKUP here
    subscriber_id = request.headers.get('X-Gateway-Authorization', 'unknown')
    current_app.logger.info(f"Registry Lookup Mock: Verified {subscriber_id}")

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
    if not verify_beckn_auth(request):
        err = ONEST_ERRORS["BAD_SIGNATURE"]
        return jsonify({
            "success": False,
            "error": {
                "type": err["type"],
                "code": err["obj_code"],
                "message": err["message"]
            }
        }), 401

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

@bp.route('/search', methods=['POST'])
def search_credentials():
    """Asynchronous ONEST search API"""
    if not verify_beckn_auth(request):
        err = ONEST_ERRORS["BAD_SIGNATURE"]
        return jsonify({
            "success": False,
            "error": {
                "type": err["type"],
                "code": err["obj_code"],
                "message": err["message"]
            }
        }), 401

    data = request.get_json()
    context = data.get('context', {})
    message = data.get('message', {})
    intent = message.get('intent', {})
    
    bap_uri = context.get('bap_uri')
    if not bap_uri:
        return jsonify({"success": False, "error": "bap_uri missing"}), 400

    # 1. Immediate ACK
    ack_response = {
        "context": context,
        "message": {"ack": {"status": "ACK"}}
    }

    # 2. Trigger Background Logic
    def perform_search_and_callback():
        # Search logic similar to discover
        query = Credential.query.filter_by(is_revoked=False)
        # (Filtering logic would go here based on intent)
        credentials = query.limit(10).all()
        
        search_results = []
        for cred in credentials:
            search_results.append({
                "id": cred.credential_id,
                "descriptor": {"name": f"{cred.credential_type} - {cred.student_id}"},
                "price": {"currency": "INR", "value": "0.00"},
                "category_id": cred.credential_type
            })

        ONESTCallbackClient.async_on_search(
            f"{bap_uri}/on_search",
            search_results,
            context,
            current_app.config
        )

    import threading
    threading.Thread(target=perform_search_and_callback).start()

    return jsonify(ack_response)

@bp.route('/select', methods=['POST'])
def select_item():
    """Placeholder for ONEST /select"""
    return jsonify({"context": request.get_json().get('context'), "message": {"ack": {"status": "ACK"}}})

@bp.route('/init', methods=['POST'])
def init_transaction():
    """Placeholder for ONEST /init"""
    return jsonify({"context": request.get_json().get('context'), "message": {"ack": {"status": "ACK"}}})

@bp.route('/confirm', methods=['POST'])
def confirm_order():
    """Placeholder for ONEST /confirm"""
    return jsonify({"context": request.get_json().get('context'), "message": {"ack": {"status": "ACK"}}})

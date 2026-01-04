"""
W3C Verifiable Credential Generator
Generates JSON-LD compliant Verifiable Credentials with DID-based Ed25519 signatures
"""
import json
import os
import uuid
import base64
from datetime import datetime
from typing import Any
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization


class VCGenerator:
    """Generate W3C Verifiable Credentials in JSON-LD format with real Ed25519Signature2020 proofs"""

    CONTEXT = [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1",
    ]

    KEYSTORE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "instance", "issuer_key.json")

    @staticmethod
    def _b58_encode(b: bytes) -> str:
        alphabet = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
        n = int.from_bytes(b, "big")
        res = bytearray()
        while n > 0:
            n, r = divmod(n, 58)
            res.append(alphabet[r])
        # leading zeros
        pad = 0
        for byte in b:
            if byte == 0:
                pad += 1
            else:
                break
        res.extend(alphabet[0:1] * pad)
        return res[::-1].decode()

    @staticmethod
    def _strip_nulls(obj: Any) -> Any:
        if isinstance(obj, dict):
            cleaned = {}
            for k, v in obj.items():
                v_clean = VCGenerator._strip_nulls(v)
                if v_clean not in (None, {}, []):
                    cleaned[k] = v_clean
            return cleaned
        if isinstance(obj, list):
            cleaned_list = []
            for v in obj:
                v_clean = VCGenerator._strip_nulls(v)
                if v_clean not in (None, {}, []):
                    cleaned_list.append(v_clean)
            return cleaned_list
        return obj

    @staticmethod
    def _ensure_keystore():
        """Create or load persistent Ed25519 keypair and DID."""
        instance_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "instance")
        os.makedirs(instance_dir, exist_ok=True)
        if os.path.exists(VCGenerator.KEYSTORE_PATH):
            with open(VCGenerator.KEYSTORE_PATH, "r") as f:
                data = json.load(f)
                return data["private_key"], data["public_key"], data["did"]

        private_key_obj = ed25519.Ed25519PrivateKey.generate()
        private_key_bytes = private_key_obj.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption(),
        )
        public_key_bytes = private_key_obj.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )

        did = VCGenerator._did_from_public_key(public_key_bytes)
        data = {
            "private_key": base64.b64encode(private_key_bytes).decode(),
            "public_key": base64.b64encode(public_key_bytes).decode(),
            "did": did,
        }
        with open(VCGenerator.KEYSTORE_PATH, "w") as f:
            json.dump(data, f)
        return data["private_key"], data["public_key"], data["did"]

    @staticmethod
    def _did_from_public_key(public_key_bytes: bytes) -> str:
        # multicodec prefix for Ed25519 pub key: 0xed 0x01
        prefixed = b"\xed\x01" + public_key_bytes
        mb_key = "z" + VCGenerator._b58_encode(prefixed)
        return f"did:key:{mb_key}"

    @staticmethod
    def generate_did():
        """Return persistent issuer DID."""
        _, _, did = VCGenerator._ensure_keystore()
        return did

    @staticmethod
    def create_credential_base(student_data, credential_type, issuer_info):
        """Create base credential structure"""
        credential_id = f"urn:uuid:{uuid.uuid4()}"
        issued_date = datetime.utcnow()

        # Build credential subject based on type
        subject = VCGenerator._build_subject(student_data, credential_type, credential_metadata=issuer_info.get('credential_metadata'))

        issuer_did = issuer_info.get("did") or VCGenerator.generate_did()

        credential = {
            "@context": VCGenerator.CONTEXT,
            "id": credential_id,
            "type": ["VerifiableCredential", VCGenerator._get_credential_type_name(credential_type)],
            "issuer": {
                "id": issuer_did,
                "name": issuer_info.get("name", "KLE Technological University"),
                "assertionMethod": [f"{issuer_did}#key-1"],
            },
            "issuanceDate": issued_date.isoformat() + "Z",
            "credentialSubject": subject,
        }

        # Optional credentialStatus block (kept for compatibility)
        credential["credentialStatus"] = {
            "id": f"{credential_id}#status",
            "type": "CredentialStatusList2020",
        }

        return credential, credential_id, issued_date

    @staticmethod
    def _build_subject(student_data, credential_type, credential_metadata=None):
        """Build credential subject based on type"""
        base_subject = {
            "id": f"did:student:{student_data.get('student_id', '')}",
            "studentId": student_data.get("student_id"),
            "name": f"{student_data.get('first_name', '')} {student_data.get('last_name', '')}".strip(),
            "email": student_data.get("email"),
            "department": student_data.get("department"),
            "batchYear": student_data.get("batch_year"),
        }

        if credential_type == "markscard":
            return {
                **base_subject,
                "credentialType": "MarksCard",
                "courses": student_data.get("courses", []),
                "totalCredits": student_data.get("total_credits"),
                "sgpa": student_data.get("sgpa"),
                "program": student_data.get("program"),
                "examSession": student_data.get("exam_session"),
            }
        elif credential_type == "transcript":
            return {
                **base_subject,
                "credentialType": "Transcript",
                "program": student_data.get("program"),
                "branch": student_data.get("branch"),
                "yearOfCompletion": student_data.get("year_of_completion"),
                "semesters": student_data.get("semesters", []),
                "cgpa": student_data.get("cgpa"),
                "cgpaInWords": student_data.get("cgpa_in_words"),
                "resultClass": student_data.get("result_class"),
                "totalCredits": student_data.get("total_credits"),
                "dateOfIssue": student_data.get("date_of_issue"),
            }
        elif credential_type == "course_completion":
            return {
                **base_subject,
                "credentialType": "CourseCompletion",
                "courseName": student_data.get("course_name"),
                "courseCode": student_data.get("course_code"),
                "completionDate": student_data.get("completion_date"),
                "credits": student_data.get("credits"),
            }
        elif credential_type == "workshop":
            return {
                **base_subject,
                "credentialType": "WorkshopCertificate",
                "workshopName": student_data.get("workshop_name"),
                "durationHours": student_data.get("duration_hours"),
                "completionDate": student_data.get("completion_date"),
                "organizer": student_data.get("organizer"),
            }
        elif credential_type == "hackathon":
            return {
                **base_subject,
                "credentialType": "HackathonCertificate",
                "hackathonName": student_data.get("hackathon_name"),
                "position": student_data.get("position"),
                "prizeWon": student_data.get("prize_won"),
                "participationDate": student_data.get("participation_date"),
                "teamName": student_data.get("team_name"),
                "organizer": student_data.get("organizer"),
                "description": student_data.get("description"),
            }
        
        # If metadata is provided, it can override or supplement student_data
        if credential_metadata:
            for key, value in credential_metadata.items():
                if value:
                    # Map camelCase to snake_case if needed or just use as is
                    # The templates expect certain keys
                    subject[key] = value

        return subject

    @staticmethod
    def _get_credential_type_name(credential_type):
        """Map credential type to VC type name"""
        type_map = {
            "markscard": "MarksCardCredential",
            "transcript": "TranscriptCredential",
            "course_completion": "CourseCompletionCredential",
            "workshop": "WorkshopCertificateCredential",
            "hackathon": "HackathonCertificateCredential",
        }
        return type_map.get(credential_type, "EducationalCredential")

    @staticmethod
    def verify_proof(credential):
        """Verify cryptographic proof of a Verifiable Credential"""
        try:
            if "proof" not in credential:
                return False, "No proof found in credential"
            
            proof = credential["proof"]
            proof_value = proof.get("proofValue")
            if not proof_value or not proof_value.startswith("z"):
                return False, "Invalid proof value format"
            
            # Extract signature from base58 proofValue
            # Note: We need a b58 decode. VCGenerator has _b58_encode, let's add decode.
            # Simplified for now: since we have the public key in keystore, 
            # we verify the proof by re-calculating the message hash.
            
            priv_b64, pub_b64, did = VCGenerator._ensure_keystore()
            public_key_bytes = base64.b64decode(pub_b64)
            public_key_obj = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            
            # Prepare data to verify (must match signing exactly)
            data_to_verify = credential.copy()
            del data_to_verify["proof"]
            clean_data = VCGenerator._strip_nulls(data_to_verify)
            message = json.dumps(clean_data, separators=(",", ":"), sort_keys=True).encode()
            
            # Decode signature
            # We'll use a library for b58 if available, or just use the proof_signature stored in DB 
            # as a secondary check if this was a loose VC.
            # For this audit, we will trust the cryptography library.
            
            # To avoid extra dependencies, we use the proofValue directly. 
            # In Ed25519Signature2020, proofValue is the signature.
            
            # Base58 decode implementation for verification
            alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
            def b58_decode(v):
                n = 0
                for char in v:
                    n = n * 58 + alphabet.index(char)
                return n.to_bytes((n.bit_length() + 7) // 8, 'big')
            
            sig_bytes = b58_decode(proof_value[1:]) # Skip 'z'
            
            public_key_obj.verify(sig_bytes, message)
            return True, "Signature verified"
        except Exception as e:
            return False, f"Verification failed: {str(e)}"

    @staticmethod
    def add_proof(credential):
        """Sign the credential and add proof"""
        priv_b64, _, did = VCGenerator._ensure_keystore()
        private_key_bytes = base64.b64decode(priv_b64)
        private_key_obj = ed25519.Ed25519PrivateKey.from_private_bytes(private_key_bytes)
        
        # Prepare data to sign
        data_to_sign = credential.copy()
        if "proof" in data_to_sign:
            del data_to_sign["proof"]
            
        clean_data = VCGenerator._strip_nulls(data_to_sign)
        # Canonicalize (simplified)
        message = json.dumps(clean_data, separators=(",", ":"), sort_keys=True).encode()
        
        signature = private_key_obj.sign(message)
        
        # Encode signature
        proof_value = "z" + VCGenerator._b58_encode(signature)
        
        proof = {
            "type": "Ed25519Signature2020",
            "created": datetime.utcnow().isoformat() + "Z",
            "verificationMethod": f"{did}#key-1",
            "proofPurpose": "assertionMethod",
            "proofValue": proof_value
        }
        
        credential["proof"] = proof
        return credential, proof_value

    @staticmethod
    def generate_full_vc(student_data, credential_type, issuer_info, credential_metadata=None):
        """Generate complete Verifiable Credential"""
        if credential_metadata:
            issuer_info['credential_metadata'] = credential_metadata
            
        credential, credential_id, issued_date = VCGenerator.create_credential_base(
            student_data, credential_type, issuer_info
        )
        credential, proof_value = VCGenerator.add_proof(credential)

        return {
            "credential": credential,
            "credential_id": credential_id,
            "proof_signature": proof_value,
            "issued_date": issued_date,
        }


"""
Beckn Authentication Helper - Handles Ed25519 signing for ONEST Network
"""
import base64
import time
import hashlib
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

class BecknAuthHelper:
    @staticmethod
    def create_auth_header(body, subscriber_id, unique_key_id, private_key_hex):
        """
        Create a Beckn-compliant Authorization header
        """
        # 1. Create Digest
        # Beckn usually uses Blake2b or SHA256 of the body
        digest = hashlib.blake2b(body.encode('utf-8'), digest_size=64).digest()
        digest_base64 = base64.b64encode(digest).decode('utf-8')
        
        created = int(time.time())
        expires = created + 600 # 10 minutes validity
        
        # 2. Construct Signing String
        # Beckn standard signing string format
        signing_string = f"(created): {created}\n(expires): {expires}\ndigest: BLAKE2b-64={digest_base64}"
        
        # 3. Sign
        private_key_bytes = bytes.fromhex(private_key_hex)
        private_key = ed25519.Ed25519PrivateKey.from_private_bytes(private_key_bytes)
        signature_bytes = private_key.sign(signing_string.encode('utf-8'))
        signature_base64 = base64.b64encode(signature_bytes).decode('utf-8')
        
        # 4. Build Header
        header = (
            f'Signature keyId="{subscriber_id}|{unique_key_id}|ed25519", '
            f'algorithm="ed25519", created={created}, expires={expires}, '
            f'headers="(created) (expires) digest", '
            f'signature="{signature_base64}"'
        )
        
        return header

    @staticmethod
    def verify_auth_header(header, body, public_key_hex):
        """
        Verify a Beckn-compliant Authorization header
        """
        try:
            # Simple parser for the header
            parts = {k.strip(): v.strip('"') for k, v in [p.split('=', 1) for p in header.replace('Signature ', '').split(',')]}
            
            created = parts.get('created')
            expires = parts.get('expires')
            signature_base64 = parts.get('signature')
            
            # Reconstruct digest
            digest = hashlib.blake2b(body.encode('utf-8'), digest_size=64).digest()
            digest_base64 = base64.b64encode(digest).decode('utf-8')
            
            signing_string = f"(created): {created}\n(expires): {expires}\ndigest: BLAKE2b-64={digest_base64}"
            
            # Verify
            public_key_bytes = bytes.fromhex(public_key_hex)
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            signature_bytes = base64.b64decode(signature_base64)
            
            public_key.verify(signature_bytes, signing_string.encode('utf-8'))
            return True
        except Exception:
            return False

    @staticmethod
    def generate_key_pair():
        """Helper to generate a new Ed25519 key pair hex strings"""
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        
        private_hex = private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        ).hex()
        
        public_hex = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        ).hex()
        
        return private_hex, public_hex

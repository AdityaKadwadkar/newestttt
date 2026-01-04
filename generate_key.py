
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

try:
    from backend.utils.vc_generator import VCGenerator
    priv, pub, did = VCGenerator._ensure_keystore()
    print(f"Generated Key for DID: {did}")
    print(f"Key stored at: {VCGenerator.KEYSTORE_PATH}")
except Exception as e:
    print(f"Error: {e}")


import sys
import os
import json
from unittest.mock import MagicMock

# Add current directory to path
sys.path.append(os.getcwd())

# Mock requests to avoid actual network call during this quick test
# But we will print what would happen
sys.modules['requests'] = MagicMock()

# Import the service
try:
    from backend.services.external_verifier_service import ExternalVerifierService
    print("✅ Successfully imported ExternalVerifierService")
except ImportError as e:
    print(f"❌ Failed to import ExternalVerifierService: {e}")
    sys.exit(1)

def test_service_integration():
    # Mock VC Data
    vc_data = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "id": "urn:uuid:123",
        "type": ["VerifiableCredential"],
    }
    
    # Mock successful response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"checks": ["proof"], "warnings": []}
    
    import requests
    requests.post.return_value = mock_response
    
    print("\n--- Testing Success Scenario ---")
    result = ExternalVerifierService.verify_with_univerifier(vc_data)
    print(f"Result: {json.dumps(result, indent=2)}")
    
    if result['success'] and result['data']['checks'] == ["proof"]:
        print("✅ Success Scenario Passed")
    else:
        print("❌ Success Scenario Failed")

    # Mock failure response
    requests.post.side_effect = requests.exceptions.RequestException("Connection Error")
    
    print("\n--- Testing Failure Scenario ---")
    result = ExternalVerifierService.verify_with_univerifier(vc_data)
    print(f"Result: {json.dumps(result, indent=2)}")
    
    if not result['success'] and "Connection Error" in result['error']:
        print("✅ Failure Scenario Passed (Graceful handling)")
    else:
        print("❌ Failure Scenario Failed")

if __name__ == "__main__":
    test_service_integration()

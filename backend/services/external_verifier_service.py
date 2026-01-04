import requests
from flask import current_app

class ExternalVerifierService:
    BASE_URL = "https://univerifier.io/1.0/verify"

    @staticmethod
    def verify_with_univerifier(vc_json):
        """
        Verify a credential using the Univerifier.io API.
        
        Args:
            vc_json (dict): The Verifiable Credential in JSON-LD format.
            
        Returns:
            dict: The verification result from Univerifier, or an error object.
        """
        try:
            # Prepare the payload
            payload = {
                "verifiableCredential": vc_json
            }
            
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            # Make the request
            response = requests.post(
                ExternalVerifierService.BASE_URL,
                json=payload,
                headers=headers,
                timeout=10  # 10 seconds timeout to prevent hanging
            )
            
            # Check if successful
            response.raise_for_status()
            
            return {
                "success": True,
                "data": response.json()
            }
            
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "External verification timed out"
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"External verification failed: {str(e)}"
            }
        except Exception as e:
            # Generic catch-all to prevent crashing
            return {
                "success": False,
                "error": f"Unexpected error during external verification: {str(e)}"
            }

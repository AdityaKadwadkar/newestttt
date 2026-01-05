"""
ONEST Asynchronous Callback Client
Handles sending signed on_search, on_select, etc. responses to BAPs.
"""
import requests
import json
import threading
from datetime import datetime
from backend.utils.beckn_auth import BecknAuthHelper
from backend.config import Config

class ONESTCallbackClient:
    @staticmethod
    def send_callback(target_url, response_json, subscriber_id, unique_key_id, private_key_hex):
        """
        Send a signed Beckn response to the specified callback URL.
        """
        try:
            body_str = json.dumps(response_json)
            auth_header = BecknAuthHelper.create_auth_header(
                body_str, 
                subscriber_id, 
                unique_key_id, 
                private_key_hex
            )
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": auth_header,
                "X-Gateway-Authorization": subscriber_id # Standard Beckn header
            }
            
            response = requests.post(target_url, data=body_str, headers=headers, timeout=10)
            response.raise_for_status()
            return True, "Success"
        except Exception as e:
            return False, str(e)

    @staticmethod
    def async_on_search(target_url, search_results, context_template, config):
        """
        Background task to perform on_search callback.
        """
        def task():
            # Update context for callback
            on_search_context = context_template.copy()
            on_search_context["action"] = "on_search"
            on_search_context["timestamp"] = datetime.utcnow().isoformat()
            
            response_json = {
                "context": on_search_context,
                "message": {
                    "catalog": {
                        "descriptor": {
                            "name": "KLE Tech Credentials Catalog"
                        },
                        "providers": [
                            {
                                "id": config.ONEST_PROVIDER_ID,
                                "descriptor": {
                                    "name": "KLE Technological University"
                                },
                                "items": search_results
                            }
                        ]
                    }
                }
            }
            
            success, error = ONESTCallbackClient.send_callback(
                target_url,
                response_json,
                config.ONEST_SUBSCRIBER_ID,
                config.ONEST_UNIQUE_KEY_ID,
                config.ONEST_PRIVATE_KEY
            )
            
            if not success:
                print(f"ONEST Callback Failed: {error}")
            else:
                print(f"ONEST on_search callback sent successfully to {target_url}")

        # Start thread
        thread = threading.Thread(target=task)
        thread.daemon = True
        thread.start()

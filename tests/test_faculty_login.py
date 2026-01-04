
import requests
import json

BASE_URL = "http://localhost:5000"

def test_faculty_login():
    print(f"Attempting login for Faculty Admin FAC001...")
    
    try:
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "FAC001",
            "password": "password123"
        })
        
        data = response.json()
        
        if response.status_code == 200 and data.get("success"):
            print("Login SUCCESSFUL!")
            print(f"Token received: {data['data']['token'][:20]}...")
            print(f"User: {data['data']['admin']['full_name']} ({data['data']['admin']['username']})")
        else:
            print("Login FAILED")
            print(f"Status: {response.status_code}")
            print(f"Response: {data}")
            
    except Exception as e:
        print(f"Error: {e}")
        if 'response' in locals():
            print(f"Raw Response: {response.text}")

if __name__ == "__main__":
    test_faculty_login()

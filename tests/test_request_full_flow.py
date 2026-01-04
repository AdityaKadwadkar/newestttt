import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def test_full_flow():
    print("--- Starting Request Flow Test ---")
    
    # 1. Login Student
    print("1. Logging in Student (CSE21A1S1)...")
    s_resp = requests.post(f"{BASE_URL}/student/login", json={"student_id": "CSE21A1S1", "password": "2003-05-11"})
    if s_resp.status_code != 200:
        print("Student Login Failed:", s_resp.text)
        return
    s_token = s_resp.json()['data']['token']
    s_headers = {"Authorization": f"Bearer {s_token}"}
    print("   Success.")

    # 2. Login Admin
    print("2. Logging in Admin (admin)...")
    a_resp = requests.post(f"{BASE_URL}/admin/login", json={"username": "admin", "password": "admin123"})
    if a_resp.status_code != 200:
        print("Admin Login Failed:", a_resp.text)
        return
    a_token = a_resp.json()['data']['token']
    a_headers = {"Authorization": f"Bearer {a_token}"}
    a_id = a_resp.json()['data']['admin']['admin_id']
    print("   Success. Admin ID:", a_id)

    # 3. Student Submit Request (Marks Card)
    print("3. Submitting Marks Card Request...")
    req_data = {
        "admin_id": a_id,
        "credential_type": "markscard",
        "reason": "Applying for Higher Studies",
        "details": {"semester": "6"}
    }
    req_resp = requests.post(f"{BASE_URL}/student/request", json=req_data, headers=s_headers)
    if req_resp.status_code != 200:
        print("Request Submission Failed:", req_resp.text)
        # Check if already exists, that's fine too
        if "already have a pending request" in req_resp.text:
             print("   (Request already exists, proceeding)")
    else:
        print("   Success.", req_resp.json()['data']['request_id'])

    # 4. Admin Get Requests
    print("4. Admin Fetching Requests...")
    get_resp = requests.get(f"{BASE_URL}/admin/requests", headers=a_headers)
    requests_list = get_resp.json()['data']
    
    target_req = None
    for r in requests_list:
        if r['student_id'] == 'CSE21A1S1' and r['credential_type'] == 'markscard' and r['status'] == 'pending':
            target_req = r
            break
            
    if not target_req:
        print("   No pending request found for CSE21A1S1 markscard.")
        # Try to find one causing the "already exists" error?
        # Maybe skip to Issue if we can find it
    else:
        print(f"   Found Request {target_req['request_id']}. Details: {target_req.get('request_details')}")
        
        # 5. Admin Issues Credential
        print("5. Admin Issuing Credential...")
        issue_resp = requests.post(
            f"{BASE_URL}/admin/request/{target_req['request_id']}/status",
            json={"status": "issued", "remarks": "Issued via Test Script"},
            headers=a_headers
        )
        if issue_resp.status_code == 200:
            print("   Issue Success:", issue_resp.json()['message'])
        else:
            print("   Issue Failed:", issue_resp.text)

    # 6. Student Check Status
    print("6. Student Checking Status...")
    my_req_resp = requests.get(f"{BASE_URL}/student/requests", headers=s_headers)
    for r in my_req_resp.json()['data']:
        if r['credential_type'] == 'markscard':
            print(f"   Request {r['request_id']} Status: {r['status']}")

    print("--- Test Complete ---")

if __name__ == "__main__":
    test_full_flow()

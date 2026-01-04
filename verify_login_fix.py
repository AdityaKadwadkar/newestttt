import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_login(student_id, password):
    url = f"{BASE_URL}/student/login"
    payload = {
        "student_id": student_id,
        "password": password
    }
    response = requests.post(url, json=payload)
    print(f"Testing Login - Student: {student_id}, Password: {password}")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def get_contineo_data():
    url = "https://mock-contineo-app.onrender.com/api/students?includePassword=true"
    response = requests.get(url)
    return response.json().get("data", [])

if __name__ == "__main__":
    students = get_contineo_data()
    if not students:
        print("❌ No students found in Contineo")
        exit(1)

    # Test Case 1: Valid login with password_dob
    student = students[0]
    sid = student["student_id"]
    pwd = student.get("password_dob")
    if pwd:
        print("\n--- Test Case 1: Valid login with password_dob ---")
        if test_login(sid, pwd):
            print("✅ Success")
        else:
            print("❌ Failed")

    # Test Case 2: Invalid password
    print("\n--- Test Case 2: Invalid password ---")
    if not test_login(sid, "wrong-password"):
        print("✅ Correctly rejected")
    else:
        print("❌ Failed: Allowed invalid password")

    # Test Case 3: Fallback to date_of_birth
    # Find a student with date_of_birth but manually test with a known date or mock it
    # For now let's just see if we can find one without password_dob in the list
    fallback_student = None
    for s in students:
        if not s.get("password_dob"):
            fallback_student = s
            break
    
    if fallback_student:
        print("\n--- Test Case 3: Fallback to date_of_birth ---")
        sid = fallback_student["student_id"]
        pwd = fallback_student["date_of_birth"]
        # DOB might be ISO string, our logic expects YYYY-MM-DD
        if "T" in pwd:
            pwd = pwd.split("T")[0]
        
        if test_login(sid, pwd):
            print("✅ Success")
        else:
            print("❌ Failed")
    else:
        print("\n--- Test Case 3 Skip: No student without password_dob found ---")

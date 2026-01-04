import os
import requests
from flask import current_app

class ContineoService:
    BASE_URL = os.environ.get('CONTINEO_API_URL') or "https://mock-contineo-app.onrender.com/api"

    @staticmethod
    def _get(endpoint, params=None):
        try:
            response = requests.get(
                f"{ContineoService.BASE_URL}/{endpoint}",
                params=params
            )
            response.raise_for_status()
            data = response.json()

            # ✅ Handle Mock-Contineo response shape
            # Mock Contineo returns: { "success": true, "data": [...] }
            if isinstance(data, dict) and "data" in data:
                data = data["data"]

            # Final safety check
            if not isinstance(data, list):
                return []

            # Filter out non-dict items
            return [item for item in data if isinstance(item, dict)]

        except requests.RequestException as e:
            print(f"Error fetching from Contineo API: {e}")
            return []
        except ValueError:
            print(f"Error: Contineo API {endpoint} returned invalid JSON")
            return []

    @staticmethod
    def get_students(include_password=False):
        params = {}
        if include_password:
            params["includePassword"] = "true"
        return ContineoService._get("students", params=params)

    @staticmethod
    def get_student(student_id, include_password=False):
        students = ContineoService.get_students(include_password=include_password)
        for student in students:
            if str(student.get("student_id")) == str(student_id):
                return student
        return None

    @staticmethod
    def get_courses():
        return ContineoService._get("courses")

    @staticmethod
    def get_student_enrollments(student_id):
        # API endpoint is 'enrollments', not 'student-courses'
        data = ContineoService._get(
            "enrollments",
            params={"student_id": student_id}
        )
        # Surgical Fix: Apply local filtering in case API ignores student_id
        if data and student_id:
            data = [e for e in data if str(e.get('student_id')) == str(student_id)]
        return data

    @staticmethod
    def get_student_marks(student_id, semester=None):
        params = {"student_id": student_id}
        if semester:
            params["semester"] = semester
        
        # Fetch data from API
        data = ContineoService._get("marks", params=params)
        
        # Surgical Fix: API currently returns ALL marks even if student_id is provided.
        # Filter locally to ensure student-specific data.
        if data and student_id:
            data = [m for m in data if str(m.get('student_id')) == str(student_id)]
            
        return data

    @staticmethod
    def get_faculty(faculty_id):
        all_faculty = ContineoService.get_all_faculty()
        for faculty in all_faculty:
            if str(faculty.get("faculty_id")) == str(faculty_id):
                return faculty
        return None

    @staticmethod
    def get_all_faculty():
        return ContineoService._get("faculty")

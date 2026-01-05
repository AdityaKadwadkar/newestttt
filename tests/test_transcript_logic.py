import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# MOCK MODULES BEFORE IMPORTING SERVICE
mock_models = MagicMock()
mock_models.db = MagicMock()
mock_models.Credential = MagicMock()
mock_models.CredentialBatch = MagicMock()
mock_models.CredentialIssueLog = MagicMock()
mock_models.WorkshopAttendance = MagicMock()
mock_models.Workshop = MagicMock()
mock_models.HackathonParticipation = MagicMock()
mock_models.Hackathon = MagicMock()
mock_models.CredentialGradeHeader = MagicMock()
mock_models.CredentialCourseRecord = MagicMock()

sys.modules['backend.models'] = mock_models
sys.modules['flask_sqlalchemy'] = MagicMock()
sys.modules['flask'] = MagicMock()

from backend.services.credential_service import CredentialService

class TestTranscriptLogic(unittest.TestCase):
    @patch('backend.services.credential_service.ContineoService')
    @patch('backend.services.credential_service.datetime')
    def test_strict_completion_logic(self, mock_datetime, mock_contineo):
        print("\nTesting Strict Completion Logic...")
        # Setup fixed time: Year 2025
        # We need to mock datetime.utcnow to return an object with .year and .date()
        mock_now = MagicMock()
        mock_now.year = 2025
        mock_now.date.return_value = "2025-01-01"
        mock_datetime.utcnow.return_value = mock_now
        
        # Test Helper
        def get_student(batch):
             return {"student_id": "STU1", "batch_year": batch, "department": "CS", "first_name": "Test", "last_name": "User"}

        # --- Scenario 1: Batch 2021 ---
        # Grad Year = 2021 + 4 = 2025.
        # Rule: IF (2025) <= Current(2025) -> TRUE.
        # Result MUST be "Pursuing", even with 8 semesters.
        print("- Scenario 1: Batch 2021 in 2025 (Boundary Condition)")
        mock_contineo.get_student.return_value = get_student(2021)
        
        # Create 8 semesters of data
        marks = []
        courses = []
        for i in range(1, 9):
            c_id = f"C{i}"
            courses.append({'course_id': c_id, 'semester': i, 'credits': 4, 'course_code': c_id, 'course_name': f"Course {i}"})
            marks.append({'semester': i, 'course_id': c_id, 'grade': 'A', 'gpa': 9.0})
            
        mock_contineo.get_student_marks.return_value = marks
        mock_contineo.get_courses.return_value = courses
        
        data = CredentialService.get_student_data_for_credential("STU1", "transcript")
        print(f"  Result: {data['yearOfCompletion']}")
        self.assertEqual(data['yearOfCompletion'], "Pursuing", 
                         "Strict Rule Failed: Batch 2021 (Grad Year 2025) <= Current Year 2025 should be 'Pursuing'")

        # --- Scenario 2: Batch 2022 ---
        # Grad Year = 2022 + 4 = 2026.
        # Rule: IF (2026) <= Current(2025) -> FALSE.
        # Else If (8 semesters) -> "Completed".
        print("- Scenario 2: Batch 2022 with 8 Semesters")
        mock_contineo.get_student.return_value = get_student(2022)
        # Using same 8-sem data from above
        data = CredentialService.get_student_data_for_credential("STU1", "transcript")
        print(f"  Result: {data['yearOfCompletion']}")
        self.assertEqual(data['yearOfCompletion'], "Completed",
                         "Strict Rule Failed: Batch 2022 with 8 semesters should be 'Completed'")

        # --- Scenario 3: Batch 2022 with < 8 Semesters ---
        print("- Scenario 3: Batch 2022 with 4 Semesters")
        mock_contineo.get_student.return_value = get_student(2022)
        # 4 semesters only
        short_marks = marks[:4] 
        mock_contineo.get_student_marks.return_value = short_marks
        
        data = CredentialService.get_student_data_for_credential("STU1", "transcript")
        print(f"  Result: {data['yearOfCompletion']}")
        self.assertEqual(data['yearOfCompletion'], "Pursuing",
                         "Strict Rule Failed: Batch 2022 with < 8 semesters should be 'Pursuing'")

    @patch('backend.services.credential_service.ContineoService')
    @patch('backend.services.credential_service.datetime')
    def test_cgpa_calculation(self, mock_datetime, mock_contineo):
        print("\nTesting CGPA and Word Calculation...")
        mock_now = MagicMock()
        mock_now.year = 2025
        mock_datetime.utcnow.return_value = mock_now
        
        mock_contineo.get_student.return_value = {"student_id": "STU1", "batch_year": 2023, "department": "CS"}
        
        # Semester 1: 4 credits, GPA 9.0 -> SGPA 9.0
        # Semester 2: 4 credits, GPA 8.0 -> SGPA 8.0
        # CGPA = (9.0 + 8.0) / 2 = 8.50
        
        courses = [
            {'course_id': 'C1', 'credits': 4, 'course_code': 'C1', 'course_name': 'C1'}, # Sem 1
            {'course_id': 'C2', 'credits': 4, 'course_code': 'C2', 'course_name': 'C2'}  # Sem 2
        ]
        mock_contineo.get_courses.return_value = courses
        
        marks = [
            {'semester': 1, 'course_id': 'C1', 'grade': 'A', 'gpa': 9.0},
            {'semester': 2, 'course_id': 'C2', 'grade': 'B', 'gpa': 8.0}
        ]
        mock_contineo.get_student_marks.return_value = marks
        
        data = CredentialService.get_student_data_for_credential("STU1", "transcript")
        
        print(f"  CGPA: {data['cgpa']}")
        print(f"  Words: {data['cgpaInWords']}")
        print(f"  Class: {data['resultClass']}")
        
        self.assertEqual(data['cgpa'], 8.50)
        self.assertEqual(data['cgpaInWords'], "Eight Point Five Zero")
        self.assertEqual(data['resultClass'], "First Class with Distinction") # >= 7.75

if __name__ == '__main__':
    unittest.main()

"""
Credential Service - Handles credential issuance and processing
"""
from backend.models import (
    db,
    Credential,
    CredentialBatch,
    CredentialIssueLog,
    WorkshopAttendance,
    Workshop,
    HackathonParticipation,
    Hackathon,
    CredentialGradeHeader,
    CredentialCourseRecord,
)
from backend.services.contineo_service import ContineoService
from backend.utils.vc_generator import VCGenerator
from backend.utils.helpers import generate_id, format_date
from datetime import datetime
import json
import math

class CredentialService:
    """Service for credential operations"""

    @staticmethod
    def _get_number_in_words(number):
        """Convert a number (CGPA) to words (e.g., 8.53 -> Eight Point Five Three)"""
        digit_map = {
            '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
            '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '.': 'Point'
        }
        # Ensure 2 decimal places
        formatted_num = "{:.2f}".format(float(number))
        words = []
        for char in formatted_num:
            words.append(digit_map.get(char, ''))
        return " ".join(words)

    @staticmethod
    def _calculate_result_class(cgpa):
        """Determine result classification based on CGPA"""
        if cgpa >= 7.75:
            return "First Class with Distinction"
        elif cgpa >= 6.75:
            return "First Class"
        elif cgpa >= 5.50:
            return "Second Class"
        else:
            return "Pass"
    
    @staticmethod
    def filter_students(filters):
        """Filter students based on criteria using Mock Contineo API"""
        students = ContineoService.get_students()
        
        if not isinstance(students, list):
            students = []

        filtered_students = []

        for student in students:
            if not isinstance(student, dict):
                continue

            # Apply filters safely using .get()
            if filters.get("student_id") and student.get("student_id") != filters["student_id"]:
                continue

            if filters.get("department") and student.get("department") != filters["department"]:
                continue

            if filters.get("batch_year") and str(student.get("batch_year")) != str(filters["batch_year"]):
                continue

            if filters.get("division") and student.get("division") != filters["division"]:
                continue

            if filters.get("course_enrolled") and student.get("course_enrolled") != filters["course_enrolled"]:
                continue
            
            if filters.get("current_semester") and str(student.get("current_semester")) != str(filters["current_semester"]):
                continue

            # Compute full_name for compatibility
            student['full_name'] = f"{student.get('first_name', '')} {student.get('last_name', '')}"
            
            filtered_students.append(student)

        return filtered_students
    
    @staticmethod
    def get_student_data_for_credential(student_id, credential_type, additional_data=None):
        """Get complete student data needed for credential generation from Contineo Service"""
        student = ContineoService.get_student(student_id)
        if not student:
            return None
        
        # Add full name manually as it might not be in API raw response but needed
        student['full_name'] = f"{student.get('first_name', '')} {student.get('last_name', '')}"

        student_data = student.copy()

        # For markscard, allow explicit course list + header data to be passed in
        if credential_type == "markscard":
            if additional_data is None:
                additional_data = {}

            # Expect a list of course dicts with: course_code, course_name, credits, grade, gpa.
            # If not provided, derive from MARKS + COURSE tables for the student's semester.
            courses = additional_data.get("courses") or []

            if not courses:
                # Derive academic context
                target_semester = additional_data.get("semester") or student.get('current_semester')

                # Fetch marks from API
                marks_rows = ContineoService.get_student_marks(student_id, target_semester) or []
                
                # Surgical fix: Ensure filtering to target_semester if it's provided
                if target_semester:
                    marks_rows = [mr for mr in marks_rows if str(mr.get('semester')) == str(target_semester)]
                
                # Fetch courses to map course details if marks only have course_id
                # Optimization: fetch unique course IDs or fetch all courses once if possible.
                # For now, fetch all courses to look up details.
                # In real scenario, might want to fetch specifics. Mock API get_courses() is fine.
                all_courses = {c['course_id']: c for c in (ContineoService.get_courses() or [])}

                grade_to_gpa = {
                    "S": 10,
                    "O": 10,
                    "A+": 9,
                    "A": 9,
                    "B+": 8,
                    "B": 8,
                    "C": 7,
                    "P": 6,
                    "F": 0,
                    "AF": 0,
                }

                derived_courses = []
                for mr in marks_rows:
                    course_id = mr.get('course_id')
                    course = all_courses.get(course_id)
                    
                    if not course:
                        # Try searching by course_code if ID mismatch, or skip
                        continue
                        
                    grade = (mr.get('grade') or "").strip().upper()
                    gpa_value = None
                    
                    # API 'marks' might have gpa or not.
                    if 'gpa' in mr and mr['gpa'] is not None:
                        try:
                            gpa_value = float(mr['gpa'])
                        except Exception:
                            gpa_value = None
                    
                    if gpa_value is None:
                        gpa_value = grade_to_gpa.get(grade, 0)

                    derived_courses.append({
                        "course_code": course.get('course_code'),
                        "course_name": course.get('course_name'),
                        "credits": course.get('credits') or 0,
                        "grade": grade,
                        "gpa": gpa_value,
                    })

                courses = derived_courses

            # Compute total credits and SGPA if courses are provided
            total_credits = 0
            weighted_sum = 0.0
            for c in courses:
                credits = int(c.get("credits", 0) or 0)
                gpa = float(c.get("gpa", 0) or 0)
                total_credits += credits
                weighted_sum += credits * gpa

            sgpa = 0.0
            if total_credits > 0:
                sgpa = round(weighted_sum / total_credits, 2)

            student_data.update({
                "program": additional_data.get("program") or student.get('course_enrolled') or "",
                "father_or_mother_name": additional_data.get("father_or_mother_name") or "",
                "exam_session": additional_data.get("exam_session") or "",
                "courses": courses,
                "total_credits": total_credits,
                "sgpa": sgpa,
            })
        
        elif credential_type == "transcript":
            # --- TRANSCRIPT LOGIC ---
            
            # 1. Basic Student Details
            program = "Bachelor of Technology (B.Tech)" # Hardcoded
            branch = student.get("department", "")
            batch_year = int(student.get("batch_year", 0)) if student.get("batch_year") else 0
            current_yr = datetime.utcnow().year
            
            # 2. Semester Data Aggregation
            # Fetch all marks for student (no semester filter)
            all_marks = ContineoService.get_student_marks(student_id) or []
            all_courses = {c['course_id']: c for c in (ContineoService.get_courses() or [])}
            
            # Group by semester
            semesters_data = {} # {sem_num: {credits: 0, weighted_gpa: 0, courses: []}}
            
            grade_to_gpa = {
                "S": 10, "O": 10, "A+": 9, "A": 9, "B+": 8, "B": 8, "C": 7, "P": 6, "F": 0, "AF": 0
            }
            
            for mr in all_marks:
                sem = mr.get('semester')
                if not sem:
                    try:
                        # Fallback if semester not in marks, try course mapping
                        c_id = mr.get('course_id')
                        c_obj = all_courses.get(c_id)
                        sem = c_obj.get('semester')
                    except:
                        continue
                
                try:
                    sem_num = int(sem)
                except:
                    continue
                    
                if sem_num not in semesters_data:
                    semesters_data[sem_num] = {"credits": 0, "weighted_gpa": 0.0, "courses": []}
                
                # Process course details
                course_id = mr.get('course_id')
                course = all_courses.get(course_id)
                
                # If course details missing, skip
                if not course: 
                     continue

                grade = (mr.get('grade') or "").strip().upper()
                
                # Get GPA
                gpa_value = None
                if 'gpa' in mr and mr['gpa'] is not None:
                    try: gpa_value = float(mr['gpa'])
                    except: gpa_value = None
                if gpa_value is None:
                    gpa_value = grade_to_gpa.get(grade, 0)
                
                credits = int(course.get('credits') or 0)
                
                course_entry = {
                    "course_code": course.get('course_code'),
                    "course_name": course.get('course_name'),
                    "credits": credits,
                    "grade": grade,
                    "gpa": gpa_value
                }
                
                semesters_data[sem_num]["courses"].append(course_entry)
                semesters_data[sem_num]["credits"] += credits
                semesters_data[sem_num]["weighted_gpa"] += (credits * gpa_value)
            
            # 3. Calculate SGPA for each semester
            final_semesters = []
            total_earned_credits = 0
            sum_sgpa = 0.0
            semesters_count_for_cgpa = 0
            
            # Sort semesters 1 to 8
            sorted_sem_nums = sorted(semesters_data.keys())
            
            # Limit to max 8 semesters (though usually won't exceed)
            sorted_sem_nums = [s for s in sorted_sem_nums if 1 <= s <= 8]
            
            for s_num in sorted_sem_nums:
                data = semesters_data[s_num]
                sem_credits = data["credits"]
                sem_wgpa = data["weighted_gpa"]
                
                sgpa = 0.0
                if sem_credits > 0:
                    sgpa = round(sem_wgpa / sem_credits, 2)
                
                # Only include if there is data
                final_semesters.append({
                    "semester": s_num,
                    "courses": data["courses"],
                    "sgpa": sgpa,
                    "credits": sem_credits
                })
                
                total_earned_credits += sem_credits
                sum_sgpa += sgpa
                semesters_count_for_cgpa += 1
            
            # 4. Calculate CGPA (Credit Weighted)
            cgpa = 0.0
            total_wgpa = sum(d["weighted_gpa"] for d in semesters_data.values() if d["credits"] > 0)
            if total_earned_credits > 0:
                cgpa = round(total_wgpa / total_earned_credits, 2)
            
            # 5. Result Classification
            result_class = CredentialService._calculate_result_class(cgpa)
            
            # 6. Year of Completion Logic (CORRECTED)
            # IF (batch_year + 4) <= current_year AND has_all_8: "Completed"
            # ELSE: "Pursuing"
            
            has_all_8 = (len(sorted_sem_nums) >= 8)
            
            if (batch_year + 4) <= current_yr and has_all_8:
                yoc = "Completed"
            else:
                yoc = "Pursuing"
                
            student_data.update({
                "program": program,
                "branch": branch, # Redundant but explicit
                "year_of_completion": yoc,
                "semesters": final_semesters,
                "total_credits": total_earned_credits,
                "cgpa": cgpa,
                "cgpa_in_words": CredentialService._get_number_in_words(cgpa),
                "result_class": result_class,
                "date_of_issue": format_date(datetime.utcnow())
            })
            
        elif credential_type == "workshop":
            # WORKSHOP remains LOCAL
            # Get workshop data
            if additional_data and additional_data.get('workshop_id'):
                workshop = Workshop.query.get(additional_data['workshop_id'])
                attendance = WorkshopAttendance.query.filter_by(
                    student_id=student_id,
                    workshop_id=additional_data['workshop_id']
                ).first()
                
                if workshop and attendance:
                    student_data.update({
                        "workshop_name": workshop.workshop_name,
                        "duration_hours": workshop.duration_hours,
                        "completion_date": format_date(workshop.end_date),
                        "organizer": workshop.organizer
                    })
        
        elif credential_type == "hackathon":
            # HACKATHON remains LOCAL
            # Get hackathon data
            if additional_data and additional_data.get('hackathon_id'):
                hackathon = Hackathon.query.get(additional_data['hackathon_id'])
                participation = HackathonParticipation.query.filter_by(
                    student_id=student_id,
                    hackathon_id=additional_data['hackathon_id']
                ).first()
                
                if hackathon and participation:
                    student_data.update({
                        "hackathon_name": hackathon.hackathon_name,
                        "position": participation.position,
                        "prize_won": participation.prize_won,
                        "participation_date": format_date(participation.participation_date),
                        "team_name": participation.team_name
                    })
        
        # Merge admin-entered metadata if provided
        if additional_data:
            # Metadata for Course Completion, Workshop, Hackathon
            if credential_type == "course_completion":
                student_data.update({
                    "course_name": additional_data.get("course_name"),
                    "course_code": additional_data.get("course_code"),
                    "completion_date": additional_data.get("completion_date"),
                    "description": additional_data.get("description")
                })
            elif credential_type == "workshop":
                student_data.update({
                    "workshop_name": additional_data.get("workshop_name"),
                    "organizer": additional_data.get("organizer"),
                    "duration_hours": additional_data.get("workshop_duration"),
                    "completion_date": additional_data.get("participation_date"),
                    "description": additional_data.get("description")
                })
            elif credential_type == "hackathon":
                student_data.update({
                    "hackathon_name": additional_data.get("hackathon_name"),
                    "organizer": additional_data.get("organizer"),
                    "participation_date": additional_data.get("participation_date"),
                    "team_name": additional_data.get("team_name"),
                    "position": additional_data.get("position"),
                    "prize_won": additional_data.get("prize_won"),
                    "description": additional_data.get("description")
                })
        
        return student_data
    
    @staticmethod
    def create_batch(credential_type, issuer_id, filters, issuer_info):
        """Create a credential batch"""
        batch_id = generate_id("BATCH")
        
        # Filter students via Service
        students = CredentialService.filter_students(filters)
        
        # Create batch record
        batch = CredentialBatch(
            batch_id=batch_id,
            credential_type=credential_type,
            template_version="v1",
            issuer_id=issuer_id,
            issue_date=datetime.utcnow().date(),
            issuer_name=issuer_info.get("name"),
            additional_notes=issuer_info.get("notes"),
            filter_criteria=json.dumps(filters),
            credential_metadata=json.dumps(issuer_info.get("credential_metadata")) if issuer_info.get("credential_metadata") else None,
            total_students=len(students),
            status="pending"
        )
        
        db.session.add(batch)
        
        # Create issue log entries
        for student in students:
            # Check student ID key standard (API vs DB)
            s_id = student.get("student_id")
            log_entry = CredentialIssueLog(
                batch_id=batch_id,
                student_id=s_id,
                status="pending"
            )
            db.session.add(log_entry)
        
        db.session.commit()
        return batch, students
    
    @staticmethod
    def generate_credential_for_student(student_id, credential_type, batch_id, issuer_info, additional_data=None):
        """Generate a credential for a single student"""
        try:
            # Get student data
            student_data = CredentialService.get_student_data_for_credential(
                student_id, credential_type, additional_data
            )
            
            if not student_data:
                return None, "Student data not found in academic system"
            
            # Generate VC
            vc_result = VCGenerator.generate_full_vc(
                student_data, credential_type, issuer_info, credential_metadata=additional_data
            )
            
            credential_id = vc_result["credential_id"]

            # Create credential record
            credential = Credential(
                credential_id=credential_id,
                batch_id=batch_id,
                student_id=student_id,
                credential_type=credential_type,
                template_version="v1",
                vc_json=json.dumps(vc_result["credential"]),
                did_identifier=VCGenerator.generate_did(),
                proof_signature=vc_result["proof_signature"],
                issued_date=vc_result["issued_date"],
                issuer_id=issuer_info["issuer_id"],
                issuer_name=issuer_info.get("name"),
                is_revoked=False
            )
            
            db.session.add(credential)

            # For markscard credentials, also persist header + per-course records
            if credential_type == "markscard":
                courses = student_data.get("courses") or []

                # Header
                header = CredentialGradeHeader(
                    credential_id=credential_id,
                    usn=student_data.get("student_id"),
                    student_name=f"{student_data.get('first_name', '')} {student_data.get('last_name', '')}".strip(),
                    branch=student_data.get("department") or "",
                    program=student_data.get("program") or "",
                    father_or_mother_name=student_data.get("father_or_mother_name") or "",
                    exam_session=student_data.get("exam_session") or "",
                    issue_date=vc_result["issued_date"].date(),
                    total_credits=student_data.get("total_credits") or 0,
                    sgpa=student_data.get("sgpa") or 0.0,
                )
                db.session.add(header)

                # Course rows
                for idx, c in enumerate(courses, start=1):
                    record = CredentialCourseRecord(
                        credential_id=credential_id,
                        serial_no=idx,
                        course_code=c.get("course_code", ""),
                        course_name=c.get("course_name", ""),
                        credits=int(c.get("credits", 0) or 0),
                        grade=c.get("grade", ""),
                        gpa=float(c.get("gpa", 0) or 0),
                    )
                    db.session.add(record)
            
            # Update log
            log_entry = CredentialIssueLog.query.filter_by(
                batch_id=batch_id,
                student_id=student_id
            ).first()
            
            if log_entry:
                log_entry.credential_id = credential_id
                log_entry.status = "success"
                log_entry.processed_at = datetime.utcnow()
            
            db.session.commit()
            
            return credential, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def process_batch(batch_id, chunk_size=20, additional_data=None):
        """Process credential batch in chunks."""
        batch = CredentialBatch.query.get(batch_id)
        if not batch:
            return False, "Batch not found"
        
        batch.status = "processing"
        db.session.commit()
        
        # Get pending log entries
        log_entries = CredentialIssueLog.query.filter_by(
            batch_id=batch_id,
            status="pending"
        ).limit(chunk_size).all()
        
        issuer_info = {
            "issuer_id": batch.issuer_id,
            "name": batch.issuer_name,
            "did": f"did:key:{batch.issuer_id}"
        }
        
        success_count = 0
        failed_count = 0
        
        for log_entry in log_entries:
            try:
                credential, error = CredentialService.generate_credential_for_student(
                    log_entry.student_id,
                    batch.credential_type,
                    batch_id,
                    issuer_info,
                    additional_data if additional_data else (json.loads(batch.credential_metadata) if batch.credential_metadata else None),
                )
                
                if credential:
                    success_count += 1
                else:
                    failed_count += 1
                    log_entry.status = "failed"
                    log_entry.error_message = error
                    log_entry.processed_at = datetime.utcnow()
            except Exception as e:
                # Catch unexpected errors to prevent batch crash
                failed_count += 1
                log_entry.status = "failed"
                log_entry.error_message = f"Unexpected error: {str(e)}"
                log_entry.processed_at = datetime.utcnow()
        
        # Update batch statistics
        batch.processed_count += len(log_entries)
        batch.success_count += success_count
        batch.failed_count += failed_count
        
        # Check if batch is complete
        remaining = CredentialIssueLog.query.filter_by(
            batch_id=batch_id,
            status="pending"
        ).count()
        
        if remaining == 0:
            batch.status = "completed"
            batch.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return True, f"Processed {len(log_entries)} credentials. Success: {success_count}, Failed: {failed_count}"


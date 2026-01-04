// Verifier Portal JavaScript

// Build Course Completion template from verification data
function renderCourseCompletionTemplate(data) {
    const subject = data.credential_subject || {};

    const studentName = subject.name || '-';
    const courseName = subject.courseName || subject.course_name || 'Course';
    const courseCode = subject.courseCode || subject.course_code || '';
    const completionDate = subject.completionDate || subject.completion_date || '';
    const description = subject.description || '';

    let formattedDate = completionDate;
    if (completionDate) {
        try {
            const date = new Date(completionDate);
            formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch (e) { }
    }

    return `
        <div class="course-completion-wrapper">
            <div class="course-completion-border"></div>
            <div class="course-completion-header">
                <h1>Certificate</h1>
                <h2>of Completion</h2>
            </div>
            <div class="course-completion-text">This is to certify that</div>
            <div class="course-completion-student-name">${studentName}</div>
            <div class="course-completion-text">has successfully completed the course</div>
            <div class="course-completion-course-info">
                <span class="course-completion-course-name">${courseName}</span>
                ${courseCode ? `<br><small>(${courseCode})</small>` : ''}
            </div>
            <div class="course-completion-text">on ${formattedDate}</div>
            ${description ? `<div class="course-completion-details">${description}</div>` : ''}
            
            <div class="course-completion-footer">
                <div class="course-completion-sig">
                    <div class="sig-name">KLE Tech University</div>
                    <div class="sig-title">Issuing Institution</div>
                </div>
                <div class="course-completion-sig">
                    <div class="sig-name">${data.issuer?.name || 'Registrar'}</div>
                    <div class="sig-title">Authority</div>
                </div>
            </div>
        </div>
    `;
}

// Build Workshop Certificate template from verification data
function renderWorkshopCertificateTemplate(data) {
    const subject = data.credential_subject || {};

    const studentName = subject.name || '-';
    const workshopName = subject.workshopName || subject.workshop_name || 'Workshop';
    const organizer = subject.organizer || '';
    const duration = subject.durationHours || subject.duration_hours || subject.workshopDuration || subject.workshop_duration || '';
    const completionDate = subject.completionDate || subject.completion_date || subject.participationDate || subject.participation_date || '';
    const description = subject.description || '';

    let formattedDate = completionDate;
    if (completionDate) {
        try {
            const date = new Date(completionDate);
            formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch (e) { }
    }

    const issuerName = data.issuer?.name || 'KLE Tech';

    return `
        <div class="workshop-certificate-wrapper">
            <div class="workshop-certificate-border"></div>
            <div class="workshop-title">Workshop Certificate</div>
            <div class="workshop-award-text">This certificate is proudly presented to</div>
            <div class="workshop-student-name">${studentName}</div>
            <div class="workshop-award-text">for participating in the workshop</div>
            <div class="workshop-info">
                <span class="workshop-name">${workshopName}</span>
                ${organizer ? `<br><span>Organized by: ${organizer}</span>` : ''}
                ${duration ? `<br><span>Duration: ${duration}</span>` : ''}
            </div>
            <div class="workshop-meta">
                Date: ${formattedDate}
            </div>
            ${description ? `<div class="workshop-meta">${description}</div>` : ''}
            
            <div class="workshop-signatures">
                <div class="workshop-signature">
                    <div class="workshop-signature-line"></div>
                    <div class="workshop-signature-name">${organizer || 'Organizer'}</div>
                    <div class="workshop-signature-title">Organizer</div>
                </div>
                <div class="workshop-signature">
                    <div class="workshop-signature-line"></div>
                    <div class="workshop-signature-name">${issuerName}</div>
                    <div class="workshop-signature-title">Authorized Signatory</div>
                </div>
            </div>
        </div>
    `;
}

// Build Hackathon Certificate template from verification data
function renderHackathonCertificateTemplate(data) {
    const subject = data.credential_subject || {};

    const studentName = subject.name || '-';
    const hackathonName = subject.hackathonName || subject.hackathon_name || 'Hackathon';
    const organizer = subject.organizer || '';
    const teamName = subject.teamName || subject.team_name || '';
    const participationDate = subject.participationDate || subject.participation_date || '';
    const position = subject.position || '';
    const prizeWon = subject.prizeWon || subject.prize_won || '';
    const description = subject.description || '';

    // Determine certificate style (green for participation, red for winners)
    const certificateStyle = position && position.toLowerCase().includes('1st') ? 'style-red' : 'style-green';
    const certificateTitle = position ? 'Hackathon Certificate' : 'Certificate of Participation';

    // Format date
    let formattedDate = '';
    if (participationDate) {
        try {
            const date = new Date(participationDate);
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            formattedDate = `Given this ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}.`;
        } catch (e) {
            formattedDate = `Given on ${participationDate}.`;
        }
    }

    // Build reason text
    let reasonText = '';
    if (position) {
        reasonText = `for placing ${position}${prizeWon ? ` and winning ${prizeWon}` : ''} in ${hackathonName}`;
    } else {
        reasonText = `for participating in ${hackathonName}`;
    }

    if (description) {
        reasonText += ` - ${description}`;
    }

    const issuerName = data.issuer?.name || 'KLE Tech';

    return `
        <div class="hackathon-certificate-wrapper ${certificateStyle}">
            <div class="certificate-border"></div>
            <div class="decorative-shape-top-left"></div>
            <div class="decorative-shape-bottom-right"></div>
            
            <div class="certificate-content">
                <div class="certificate-logo-area">
                    <div class="certificate-logo-left">${hackathonName.substring(0, 20)}</div>
                    <div class="certificate-logo-right">${organizer || 'KLE Tech'}</div>
                </div>
                
                <div class="certificate-title">${certificateTitle}</div>
                
                <div class="certificate-award-text">This certificate is awarded to</div>
                
                <div class="certificate-student-name">${studentName}</div>
                
                <div class="certificate-reason">${reasonText}</div>
                
                ${teamName ? `<div class="certificate-details"><strong>Team:</strong> ${teamName}</div>` : ''}
                
                ${organizer ? `<div class="certificate-details"><strong>Organized by:</strong> ${organizer}</div>` : ''}
                
                ${formattedDate ? `<div class="certificate-date">${formattedDate}</div>` : ''}
                
                <div class="certificate-signatures">
                    <div class="certificate-signature">
                        <div class="certificate-signature-name">${organizer || 'Organizer'}</div>
                        <div class="certificate-signature-title">Organizer</div>
                    </div>
                    <div class="certificate-signature">
                        <div class="certificate-signature-name">${issuerName}</div>
                        <div class="certificate-signature-title">Issuing Authority</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
// Build KLE Markscard template from verification data
function renderMarkscardTemplate(data) {
    const gradeCard = data.grade_card || {};
    const header = gradeCard.credentialHeader || {};
    const studentId = header.usn || '-';
    const studentName = header.student_name || '-';
    const branch = header.branch || '-';
    const program = header.program || '';

    const courses = gradeCard.courseRecords || [];
    let rowsHtml = '';

    if (Array.isArray(courses) && courses.length) {
        rowsHtml = courses.map((course, index) => {
            const code = course.course_code || course.courseCode || course.code || '';
            const name = course.course_name || course.courseName || course.name || '';
            const credits = course.credits || course.credit || '';
            const grade = course.grade || '';
            const gpa = course.gpa != null ? course.gpa : (course.gradePoints || course.grade_points || '');
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${code}</td>
                    <td>${name}</td>
                    <td>${credits}</td>
                    <td>${grade}</td>
                    <td>${gpa}</td>
                </tr>
            `;
        }).join('');
    } else {
        rowsHtml = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No course records found.</td></tr>';
    }

    const totalCredits = header.total_credits || '';
    const sgpa = header.sgpa || '';
    const semester = header.semester || header.target_semester || '';

    return `
        <div class="markscard-wrapper">
            <div class="markscard-header">
                <div class="markscard-logo-box">
                    <div class="logo-red-part">
                        <svg viewBox="0 0 100 100" class="logo-swirl">
                            <path d="M50 20 C 30 20, 20 40, 20 60 C 20 80, 40 90, 60 90 C 80 90, 90 70, 90 50 C 90 30, 70 10, 50 10 C 30 10, 10 30, 10 55 C 10 80, 30 95, 50 95" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/>
                            <circle cx="75" cy="25" r="8" fill="white"/>
                        </svg>
                    </div>
                    <div class="logo-white-part">KLE TECH</div>
                </div>
                <div class="markscard-title-block">
                    <h1>KLE TECHNOLOGICAL UNIVERSITY</h1>
                    <h2>GRADE CARD</h2>
                    <h3>${program || 'Autonomous Institution'}</h3>
                    ${semester ? `<h4 style="margin-top: 5px; color: #b91c1c; font-weight: 700;">SEMESTER: ${semester}</h4>` : ''}
                </div>
                <div class="markscard-photo-box"></div>
            </div>

            <div class="markscard-meta">
                <div class="markscard-meta-row">
                    <div class="markscard-meta-label">USN</div>
                    <div class="markscard-meta-value">${studentId}</div>
                </div>
                <div class="markscard-meta-row">
                    <div class="markscard-meta-label">Name</div>
                    <div class="markscard-meta-value">${studentName}</div>
                </div>
                <div class="markscard-meta-row">
                    <div class="markscard-meta-label">Branch</div>
                    <div class="markscard-meta-value">${branch}</div>
                </div>
            </div>

            <table class="markscard-table">
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Credits</th>
                        <th>Grade</th>
                        <th>GPA</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="markscard-footer">
                <div class="markscard-sgpa-box">
                    <div>Total Credits: ${totalCredits || '-'}</div>
                    <div>SGPA: ${sgpa || '-'}</div>
                </div>
                <div>
                    <div style="font-size: 14px; font-weight: 600;">Computer Generated<br>Registrar</div>
                </div>
            </div>
        </div>
    `;
}

// Render Transcript template from VC data
function renderTranscriptTemplate(data) {
    const subject = data.credential_subject || {};
    const semesters = subject.semesters || [];

    // Student Details
    const studentName = subject.name || subject.student_name || '-';
    const usn = subject.usn || subject.student_id || '-';
    const program = subject.program || 'Bachelor of Technology';
    const branch = subject.branch || subject.department || '-';
    const batchYear = subject.batchYear || subject.batch_year || '-';
    const yearOfCompletion = subject.yearOfCompletion || subject.year_of_completion || '-';

    // Bottom Aggregation
    const totalCredits = subject.totalCredits || subject.total_credits || '-';
    const cgpa = subject.cgpa || '-';
    const cgpaInWords = subject.cgpaInWords || subject.cgpa_in_words || '-';
    const resultClass = subject.resultClass || subject.result_class || '-';

    // Dates
    const issuedDate = data.issued_date || '';
    const dateOfIssue = issuedDate ? new Date(issuedDate).toLocaleDateString() : '-';

    // Semesters HTML
    let semestersHtml = '';
    const semesterNames = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

    semesters.slice(0, 8).forEach((sem, idx) => {
        if (!sem.courses || sem.courses.length === 0) return;

        let coursesHtml = '';
        sem.courses.forEach((course, cIdx) => {
            coursesHtml += `
                <tr>
                    <td style="text-align: center;">${cIdx + 1}</td>
                    <td>${course.courseCode || course.course_code || ''}</td>
                    <td>${course.courseName || course.course_name || ''}</td>
                    <td style="text-align: center;">${course.credits || ''}</td>
                    <td style="text-align: center;">${course.grade || ''}</td>
                    <td style="text-align: center;">${course.gradePoints || course.grade_points || ''}</td>
                </tr>
            `;
        });

        semestersHtml += `
            <div class="transcript-semester-container">
                <div class="transcript-semester-title">Semester ${semesterNames[idx] || (idx + 1)}</div>
                <table class="transcript-semester-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">S.No</th>
                            <th style="width: 120px;">Course Code</th>
                            <th>Course Name</th>
                            <th style="width: 70px;">Credits</th>
                            <th style="width: 60px;">Grade</th>
                            <th style="width: 90px;">Grade Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coursesHtml}
                    </tbody>
                </table>
            </div>
        `;
    });

    return `
        <style>
            .transcript-page {
                background: white;
                padding: 30px;
                color: #000;
                line-height: 1.4;
                border: 1px solid #eee;
                border-radius: 8px;
            }
            .transcript-header {
                display: flex;
                justify-content: flex-start;
                align-items: flex-start;
                margin-bottom: 25px;
            }
            .transcript-logo {
                width: 120px;
                height: 70px;
                background: #b91c1c;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 24px;
                margin-right: 20px;
            }
            .transcript-header-text {
                flex: 1;
                text-align: center;
            }
            .transcript-header-text h1 {
                font-size: 22px;
                margin: 0;
                font-weight: bold;
            }
            .transcript-header-text h2 {
                font-size: 18px;
                margin: 5px 0;
                font-weight: normal;
            }
            .transcript-header-text h3 {
                font-size: 14px;
                margin: 0;
                font-weight: normal;
            }
            .transcript-student-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px 40px;
                margin: 25px 0;
                font-size: 14px;
            }
            .transcript-detail-item {
                display: flex;
                border-bottom: 1px solid #eee;
                padding-bottom: 2px;
            }
            .transcript-detail-label {
                width: 150px;
                color: #555;
            }
            .transcript-detail-value {
                font-weight: bold;
                color: #000;
            }
            .transcript-semester-title {
                font-weight: bold;
                font-size: 15px;
                margin: 20px 0 8px 0;
                border-bottom: 2px solid #000;
                display: inline-block;
                padding-right: 15px;
            }
            .transcript-semester-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                font-size: 12px;
            }
            .transcript-semester-table th, .transcript-semester-table td {
                border: 1px solid #000;
                padding: 6px 8px;
                text-align: left;
            }
            .transcript-semester-table th {
                background: #f5f5f5;
                font-weight: bold;
                text-align: center;
            }
            .transcript-aggregation {
                margin-top: 30px;
                font-size: 14px;
                border: 1px solid #000;
                padding: 12px;
                display: inline-block;
                min-width: 350px;
            }
            .transcript-aggregation-row {
                margin-bottom: 5px;
            }
            .transcript-footer {
                margin-top: 50px;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
            }
        </style>
        <div class="transcript-page">
            <div class="transcript-header">
                <div class="transcript-logo">KLE</div>
                <div class="transcript-header-text">
                    <h1>KLE TECHNOLOGICAL UNIVERSITY</h1>
                    <h2>Academic Transcript</h2>
                    <h3>Autonomous Institution</h3>
                </div>
            </div>

            <div class="transcript-student-details">
                <div class="transcript-detail-item">
                    <span class="transcript-detail-label">Student Name:</span>
                    <span class="transcript-detail-value">${studentName}</span>
                </div>
                <div class="transcript-detail-item">
                    <span class="transcript-detail-label">USN / Student ID:</span>
                    <span class="transcript-detail-value">${usn}</span>
                </div>
                <div class="transcript-detail-item">
                    <span class="transcript-detail-label">Program:</span>
                    <span class="transcript-detail-value">${program}</span>
                </div>
                <div class="transcript-detail-item">
                    <span class="transcript-detail-label">Branch:</span>
                    <span class="transcript-detail-value">${branch}</span>
                </div>
                <div class="transcript-detail-item">
                    <span class="transcript-detail-label">Batch Year:</span>
                    <span class="transcript-detail-value">${batchYear}</span>
                </div>
                <div class="transcript-detail-item">
                    <span class="transcript-detail-label">Year of Completion:</span>
                    <span class="transcript-detail-value">${yearOfCompletion}</span>
                </div>
            </div>

            <div class="transcript-semesters">
                ${semestersHtml}
            </div>

            <div class="transcript-aggregation">
                <div class="transcript-aggregation-row">Total Credits Earned: <strong>${totalCredits}</strong></div>
                <div class="transcript-aggregation-row">CGPA: <strong>${cgpa}</strong></div>
                <div class="transcript-aggregation-row">CGPA (in words): <strong>${cgpaInWords}</strong></div>
                <div class="transcript-aggregation-row">Result Class: <strong>${resultClass}</strong></div>
            </div>

            <div class="transcript-footer">
                <div>Date of Issue: ${dateOfIssue}</div>
                <div>Issued by: KLE Technological University</div>
            </div>
        </div>
    `;
}


// Check for credential ID in URL
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const credentialId = urlParams.get('credential_id');

    if (credentialId) {
        document.getElementById('credentialId').value = credentialId;
        verifyCredential(credentialId);
    }
});

// Extract credential ID from URL or input
function extractCredentialId(input) {
    if (!input) {
        input = document.getElementById('credentialId').value;
    }

    if (!input) {
        return null;
    }

    // Check if it's a URL
    if (input.includes('credential_id=')) {
        const url = new URL(input);
        return url.searchParams.get('credential_id');
    }

    // Check if it's a full URL path
    const match = input.match(/\/verifier\?credential_id=([^&]+)/);
    if (match) {
        return match[1];
    }

    // Assume it's just the credential ID
    return input.trim();
}

// Verify credential
async function verifyCredential(credentialId = null) {
    const id = credentialId || extractCredentialId();

    if (!id) {
        showAlert('Please enter a credential ID', 'error');
        return;
    }

    const resultDiv = document.getElementById('verificationResult');
    const resultContent = document.getElementById('resultContent');

    resultDiv.classList.remove('hidden');
    resultContent.innerHTML = '<div class="loading"><div class="spinner"></div><p>Verifying credential...</p></div>';

    try {
        const startTime = Date.now();
        const response = await apiRequest(`/verifier/verify/${id}`);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (response.success && response.data) {
            displayVerificationResult(response.data, duration);
        } else {
            displayError('Verification failed');
        }
    } catch (error) {
        displayError(error.message || 'Failed to verify credential');
    }
}

// Display verification result
function displayVerificationResult(data, duration) {
    const resultContent = document.getElementById('resultContent');

    const isValid = data.valid;
    const status = data.status;

    // Deep Extraction Helper: Look for populated data across potential keys
    const getPopulated = (obj, keys) => {
        for (const key of keys) {
            const val = obj[key];
            if (val && (typeof val !== 'object' || Object.keys(val).length > 0)) {
                return val;
            }
        }
        return null;
    };

    // Extract Subject: Look in top-level AND inside 'vc'
    const subject = getPopulated(data, ['credential_subject', 'credentialSubject']) ||
        getPopulated(data.vc || {}, ['credentialSubject', 'credential_subject']) || {};

    const gradeCard = getPopulated(data, ['grade_card', 'gradeCard']) || {};
    const credentialType = (data.credential_type || data.credentialType || subject.credentialType || subject.credential_type || '').toLowerCase().trim();

    console.log('Verifer Extraction Engine:', { subject, gradeCard, credentialType });

    let statusClass = 'verification-info';
    let statusIcon = 'ℹ️';
    let statusText = 'Unknown';

    if (isValid && status === 'verified') {
        statusClass = 'verification-success';
        statusIcon = '✅';
        statusText = 'VERIFIED';
    } else if (status === 'revoked') {
        statusClass = 'verification-error';
        statusIcon = '❌';
        statusText = 'REVOKED';
    } else {
        statusClass = 'verification-error';
        statusIcon = '❌';
        statusText = 'INVALID';
    }

    let html = `
        <div style="background: rgba(255,255,255,0.05); padding: 5px 10px; font-size: 10px; color: #666; margin-bottom: 20px;">
            v3.2 | Recognized Type: ${credentialType} | Subject: ${subject.id || 'Legacy'}
        </div>
        <div class="${statusClass}">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                <span style="font-size: 32px;">${statusIcon}</span>
                <div>
                    <h2 style="margin: 0;">Verification ${statusText}</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.8;">Verified in ${duration}s</p>
                </div>
            </div>
        </div>
        
        <div class="credential-details">
    `;

    // Unified Template Selection (Matches Student Portal exactly)
    let templateHtml = '';

    // Preparation: Map data into the format expected by the Student Portal templates
    // The Student Portal templates expect a 'credential' object or 'data' with specific paths.
    const normalizedData = {
        ...data,
        vc_data: data.vc || {},
        grade_card: gradeCard.credentialHeader ? gradeCard : {
            credentialHeader: {
                usn: subject.studentId || subject.student_id || subject.id || subject.usn || '-',
                student_name: subject.name || subject.student_name || subject.fullName || subject.full_name || '-',
                branch: subject.department || subject.branch || '-',
                program: subject.program || '-',
                total_credits: subject.totalCredits || subject.total_credits || '-',
                sgpa: subject.sgpa || subject.gpa || '-',
                semester: subject.semester || subject.target_semester || '-'
            },
            courseRecords: Array.isArray(subject.courses || subject.courseRecords || subject.course_records)
                ? (subject.courses || subject.courseRecords || subject.course_records)
                : (gradeCard.courseRecords || [])
        }
    };

    if (credentialType.includes('hackathon')) {
        templateHtml = renderHackathonCertificateTemplate(normalizedData);
    } else if (credentialType.includes('workshop')) {
        templateHtml = renderWorkshopCertificateTemplate(normalizedData);
    } else if (credentialType.includes('completion')) {
        templateHtml = renderCourseCompletionTemplate(normalizedData);
    } else if (credentialType.includes('transcript')) {
        templateHtml = renderTranscriptTemplate(normalizedData);
    } else if (credentialType.includes('markscard') || credentialType.includes('grade') || normalizedData.grade_card.courseRecords.length > 0) {
        templateHtml = renderMarkscardTemplate(normalizedData);
    }

    if (templateHtml) {
        // Wrap in a contrasting container to ensure visibility in dark mode portals
        html += `
            <div class="detail-section" style="color: #000 !important;">
                ${templateHtml}
            </div>
        `;
    } else {
        html += `<div class="alert alert-info">Credential data verified but no display template found for type: ${credentialType}</div>`;
    }

    // Add Raw VC JSON Section
    const formattedVC = data.vc ? JSON.stringify(data.vc, null, 2) : '{}';
    html += `
        <div class="detail-section" style="margin-top: 20px;">
            <button onclick="window.toggleRawJSON()" class="btn-secondary" style="width: 100%; text-align: center; justify-content: center;">
                📋 View Raw Credential (JSON)
            </button>
            <div id="rawJsonContainer" style="display: none; margin-top: 15px;">
                <div style="background: #1e293b; padding: 15px; border-radius: 8px; position: relative;">
                    <button onclick="window.copyRawJSON()" style="position: absolute; top: 10px; right: 10px; padding: 5px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
                    <pre id="rawJsonContent" style="color: #e2e8f0; font-family: monospace; white-space: pre-wrap; word-break: break-all; margin: 0; font-size: 13px; max-height: 400px; overflow-y: auto;">${formattedVC}</pre>
                </div>
            </div>
            <script>
                // Removed inline script
            </script>
        </div>
    `;

    // Append minimal meta info
    html += `
        <div class="detail-section">
            <h3>Verification Metadata</h3>
            <table class="credential-details-table">
                <tr>
                    <td>Credential ID</td>
                    <td><code>${data.credential_id || '-'}</code></td>
                </tr>
                <tr>
                    <td>Credential Type</td>
                    <td><strong>${(data.credential_type || '').replace('_', ' ').toUpperCase()}</strong></td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td><span class="status-badge status-${isValid ? 'verified' : 'invalid'}">${statusText}</span></td>
                </tr>
                <tr>
                    <td>Issued Date</td>
                    <td>${formatDateTime(data.issued_date) || '-'}</td>
                </tr>
                <tr>
                    <td>Verification Time</td>
                    <td>${formatDateTime(data.verification_timestamp) || '-'}</td>
                </tr>
            </table>
        </div>
    `;

    // Add credential-specific details
    if (data.credential_type === 'markscard') {
        html += `
            <div class="info-item" style="margin-top: 15px;">
                <div class="info-label">Course</div>
                <div class="info-value">${subject.course || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Marks</div>
                <div class="info-value">${subject.marksObtained || '-'} / ${subject.maxMarks || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Grade</div>
                <div class="info-value">${subject.grade || '-'}</div>
            </div>
        `;
    }

    if (data.status === 'revoked') {
        html += `
            <div class="verification-error" style="margin-top: 20px;">
                <h4>⚠️ Credential Revoked</h4>
                <p>This credential has been revoked by the issuer.</p>
                ${data.revoked_date ? `<p><strong>Revoked on:</strong> ${formatDateTime(data.revoked_date)}</p>` : ''}
                ${data.revocation_reason ? `<p><strong>Reason:</strong> ${data.revocation_reason}</p>` : ''}
            </div>
        `;
    }

    html += `</div>`;

    resultContent.innerHTML = html;
}

// Display error
function displayError(message) {
    const resultContent = document.getElementById('resultContent');

    resultContent.innerHTML = `
        <div class="verification-error">
            <h2>❌ Verification Failed</h2>
            <p>${message}</p>
            <p style="margin-top: 10px; font-size: 14px;">
                Please check the credential ID and try again. If the problem persists, the credential may not exist or may have been revoked.
            </p>
        </div>
    `;
}

// Tab switching
function showVerifyTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) activeTab.classList.remove('hidden');

    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
}

// Allow Enter key to trigger verification
document.getElementById('credentialId')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        verifyCredential();
    }
});

// Global functions for Raw JSON viewing
window.toggleRawJSON = function () {
    const el = document.getElementById('rawJsonContainer');
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';

        // Scroll to container if opening
        if (el.style.display === 'block') {
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
    }
};

window.copyRawJSON = function () {
    const content = document.getElementById('rawJsonContent');
    if (!content) return;

    const text = content.innerText;
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary tooltip or feedback
        const btn = document.querySelector('#rawJsonContainer button');
        if (btn) {
            const originalText = btn.innerText;
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerText = originalText, 2000);
        }
        alert('JSON copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};


// Verifier Portal JavaScript
// Version 3.3 | Deep Extraction + Unified Templates + Semester Info

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const credentialId = urlParams.get('credential_id');

    if (credentialId) {
        const input = document.getElementById('credentialId');
        if (input) input.value = credentialId;
        verifyCredential(credentialId);
    }
});

// Deep Extraction Helper: Look for populated data across potential keys
function getPopulated(obj, keys) {
    if (!obj) return null;
    for (const key of keys) {
        const val = obj[key];
        if (val && (typeof val !== 'object' || Object.keys(val).length > 0)) {
            return val;
        }
    }
    return null;
}

// Format utilities
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

// ---------------------------------------------------------
// TEMPLATES (Unified with Student Portal)
// ---------------------------------------------------------

function renderMarkscardTemplate(data) {
    const gradeCard = data.grade_card || {};
    const header = gradeCard.credentialHeader || {};
    const studentId = header.usn || '-';
    // Use helper if header name is missing/dash, or if header itself is weak
    const studentName = (header.student_name && header.student_name !== '-')
        ? header.student_name
        : getStudentName(data.vc_data?.credentialSubject || {});

    const branch = header.branch || '-';
    const program = header.program || '';
    const semester = header.semester || '';

    const courses = gradeCard.courseRecords || [];
    let rowsHtml = '';

    if (Array.isArray(courses) && courses.length) {
        rowsHtml = courses.map((course, index) => {
            const code = course.course_code || course.courseCode || course.code || '';
            const name = course.course_name || course.courseName || course.name || '';
            const credits = course.credits || course.credits === 0 ? course.credits : (course.credit || '');
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

    return `
        <div class="markscard-wrapper" style="color: #000 !important; background: white !important;">
            <div class="markscard-header">
                <div class="markscard-logo-box" style="background: #b91c1c !important;">
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
                    <h2 style="font-weight: 700;">GRADE CARD</h2>
                    <h3 style="font-weight: 600;">${program || 'Autonomous Institution'}</h3>
                    ${semester ? `<h4 style="margin-top: 10px; color: #b91c1c; font-weight: 800;">SEMESTER: ${semester}</h4>` : ''}
                </div>
                <div class="markscard-photo-box"></div>
            </div>

            <div class="markscard-meta">
                <div class="markscard-meta-row"><div class="markscard-meta-label">USN</div><div class="markscard-meta-value">${studentId}</div></div>
                <div class="markscard-meta-row"><div class="markscard-meta-label">Name</div><div class="markscard-meta-value">${studentName}</div></div>
                <div class="markscard-meta-row"><div class="markscard-meta-label">Branch</div><div class="markscard-meta-value">${branch}</div></div>
            </div>

            <table class="markscard-table">
                <thead><tr><th>S.No</th><th>Course Code</th><th>Course Name</th><th>Credits</th><th>Grade</th><th>GPA</th></tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>

            <div class="markscard-footer">
                <div class="markscard-sgpa-box" style="border: 1px solid #000; padding: 10px;">
                    <div>Average Total Credits: ${header.total_credits || '-'}</div>
                    <div style="font-size: 16px; font-weight: 700;">SGPA: ${header.sgpa || '-'}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 14px; font-weight: 600;">Computer Generated<br>Registrar</div>
                </div>
            </div>
        </div>
    `;
}

function renderTranscriptTemplate(data) {
    const vcData = data.vc_data || {};
    const subject = vcData.credentialSubject || vcData || {};
    const semesters = subject.semesters || [];

    // Use robust name extraction
    const studentName = getStudentName(subject);
    const usn = subject.usn || subject.student_id || subject.id || '-';
    const program = subject.program || 'Bachelor of Technology';
    const branch = subject.branch || subject.department || '-';
    const batchYear = subject.batch_year || subject.year_of_start || '';

    let semestersHtml = '';
    semesters.forEach((sem, idx) => {
        let coursesHtml = (sem.courses || []).map((c, i) => `
            <tr>
                <td>${c.courseCode || c.course_code || ''}</td>
                <td>${c.courseName || c.course_name || ''}</td>
                <td style="text-align:center">${c.credits || c.credits === 0 ? c.credits : ''}</td>
                <td style="text-align:center">${c.grade || ''}</td>
            </tr>
        `).join('');

        semestersHtml += `
            <div style="margin-bottom: 20px; border: 1px solid #000; padding: 0;">
                <div style="background: #fff; padding: 5px 10px; border-bottom: 1px solid #000; text-align: center; font-weight: bold;">
                    Semester ${sem.semester || idx + 1}
                </div>
                <table class="markscard-table" style="margin: 0; border: none;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="width: 15%; border-right: 1px solid #000;">Code</th>
                            <th style="width: 65%; border-right: 1px solid #000;">Course Title</th>
                            <th style="width: 10%; border-right: 1px solid #000; text-align: center;">Cr</th>
                            <th style="width: 10%; text-align: center;">Grade</th>
                        </tr>
                    </thead>
                    <tbody>${coursesHtml || '<tr><td colspan="4" style="text-align:center">No records</td></tr>'}</tbody>
                </table>
                <div style="text-align: right; font-weight: bold; padding: 5px 10px; border-top: 1px solid #000;">
                    SGPA: ${sem.sgpa || sem.gpa || '-'}
                </div>
            </div>
        `;
    });

    return `
        <div class="markscard-wrapper" style="color: #000 !important; background: white !important; font-family: 'Times New Roman', serif; padding: 40px; max-width: 900px; margin: 0 auto;">
            <div style="display: flex; align-items: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: #b91c1c; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: sans-serif;">KLE Logo</div>
                <div style="flex: 1; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">KLE Technological University</h1>
                    <h3 style="margin: 5px 0 0; font-size: 16px; font-weight: normal;">Official Consolidated Academic Transcript</h3>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 30px;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #000; font-weight: bold; width: 20%;">Student Name</td>
                    <td style="padding: 8px; border: 1px solid #000; width: 30%;">${studentName}</td>
                    <td style="padding: 8px; border: 1px solid #000; font-weight: bold; width: 20%;">University ID</td>
                    <td style="padding: 8px; border: 1px solid #000; width: 30%;">${usn}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Program</td>
                    <td style="padding: 8px; border: 1px solid #000;">${program}</td>
                    <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Branch</td>
                    <td style="padding: 8px; border: 1px solid #000;">${branch}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Year of Admission</td>
                    <td style="padding: 8px; border: 1px solid #000;">${batchYear}</td>
                    <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Medium</td>
                    <td style="padding: 8px; border: 1px solid #000;">English</td>
                </tr>
            </table>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                ${semestersHtml}
            </div>

            <div style="margin-top: 30px; border: 1px solid #000; padding: 15px; text-align: center; background: #f9f9f9;">
                <div style="margin-bottom: 5px;">CGPA</div>
                <div style="font-size: 24px; font-weight: bold;">${subject.cgpa || '-'}</div>
                <div style="font-size: 12px; margin-top: 5px;">(Cumulative Grade Point Average)</div>
            </div>
            
            <div style="margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end;">
                 <div style="text-align: center;">
                    <p style="margin: 0;">Date of Issue: ${formatDateTime(data.vc_data?.issuanceDate)}</p>
                 </div>
                 <div style="text-align: center;">
                    <div style="height: 50px;"></div>
                    <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto;"></div>
                    <p style="margin: 5px 0 0;">Controller of Examinations</p>
                 </div>
            </div>
        </div>
    `;
}

// ---------------------------------------------------------
// CERTIFICATE TEMPLATES (Workshop, Hackathon, Course Completion)
// ---------------------------------------------------------

function getStudentName(subject) {
    return subject.student_name || subject.name || subject.full_name || subject.fullName ||
        (subject.first_name ? `${subject.first_name} ${subject.last_name || ''}` : '-') || '-';
}

function renderHackathonCertificateTemplate(data) {
    const vcData = data.vc_data || {};
    const subject = vcData.credentialSubject || vcData || {};
    const studentName = getStudentName(subject);
    const hackathonName = subject.hackathon_name || subject.hackathonName || 'Hackathon';
    const position = subject.position || 'Participant';
    const date = formatDateTime(subject.participation_date || subject.date);

    return `
        <div class="certificate-wrapper" style="padding: 40px; text-align: center; border: 10px solid #0070f3; background: #fff; color: #000; font-family: 'Georgia', serif;">
            <div style="font-size: 30px; font-weight: bold; color: #0070f3; margin-bottom: 10px;">CERTIFICATE</div>
            <div style="font-size: 18px; letter-spacing: 2px; text-transform: uppercase;">OF ACHIEVEMENT</div>
            
            <div style="margin: 40px 0; font-style: italic; color: #555;">This is to certify that</div>
            
            <div style="font-size: 36px; font-weight: bold; margin: 20px 0; border-bottom: 2px solid #ddd; display: inline-block; padding: 0 40px 10px;">${studentName}</div>
            
            <div style="font-size: 18px; margin: 20px 0; line-height: 1.6;">
                has successfully participated and secured <br>
                <strong style="font-size: 22px; color: #000;">${position}</strong> <br>
                in the event <strong style="color: #0070f3;">${hackathonName}</strong>
            </div>
            
            <div style="margin-top: 50px; display: flex; justify-content: space-between; padding: 0 50px;">
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto 10px;"></div>
                    <div style="font-weight: bold;">Organizer</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-weight: bold; font-size: 16px;">${date}</div>
                    <div style="font-size: 12px; color: #666;">Date</div>
                </div>
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto 10px;"></div>
                    <div style="font-weight: bold;">Authority</div>
                </div>
            </div>
        </div>
    `;
}

function renderWorkshopCertificateTemplate(data) {
    const vcData = data.vc_data || {};
    const subject = vcData.credentialSubject || vcData || {};
    const studentName = getStudentName(subject);
    const workshopName = subject.workshop_name || subject.workshopName || 'Workshop';
    const duration = subject.duration_hours || subject.duration || '0';
    const date = formatDateTime(subject.completion_date || subject.date);

    return `
        <div class="certificate-wrapper" style="padding: 40px; text-align: center; border: 10px solid #f59e0b; background: #fff; color: #000; font-family: 'Arial', sans-serif;">
            <div style="font-size: 40px; font-weight: 900; color: #f59e0b; margin-bottom: 5px;">CERTIFICATE</div>
            <div style="font-size: 20px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase;">OF PARTICIPATION</div>
            
            <div style="margin: 50px 0 20px; font-size: 18px;">PROUDLY PRESENTED TO</div>
            
            <div style="font-size: 42px; font-family: 'Georgia', serif; font-weight: bold; margin: 10px 0; color: #333;">${studentName}</div>
            
            <div style="margin: 30px auto; max-width: 600px; line-height: 1.6; font-size: 18px; color: #444;">
                For successfully completing the workshop on <br>
                <strong style="font-size: 24px; color: #000;">${workshopName}</strong><br>
                <span style="font-size: 16px; color: #666;">(${duration} Hours Duration)</span>
            </div>
            
            <div style="margin-top: 60px; display: flex; justify-content: space-around;">
                <div style="text-align: center;">
                    <div style="font-size: 14px; margin-bottom: 5px;">${date}</div>
                    <div style="border-top: 2px solid #f59e0b; width: 150px; margin: 0 auto;"></div>
                    <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">DATE</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-family: 'Great Vibes', cursive; font-size: 24px; margin-bottom: 0px;">KLE Tech</div>
                    <div style="border-top: 2px solid #f59e0b; width: 150px; margin: 0 auto;"></div>
                    <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">SIGNATURE</div>
                </div>
            </div>
        </div>
    `;
}

function renderCourseCompletionTemplate(data) {
    const vcData = data.vc_data || {};
    const subject = vcData.credentialSubject || vcData || {};
    const studentName = getStudentName(subject);
    const courseName = subject.course_name || subject.courseName || 'Course';
    const date = formatDateTime(subject.completion_date || subject.date);

    return `
        <div class="certificate-wrapper" style="padding: 50px; text-align: center; border: 5px double #02040a; background: #fff; color: #000; font-family: 'Times New Roman', serif;">
            <div style="width: 100px; height: 100px; margin: 0 auto 20px; border-radius: 50%; background: #02040a; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold;">LOGO</div>
            <div style="font-size: 48px; font-weight: bold; color: #02040a;">Certificate</div>
            <div style="font-size: 18px; letter-spacing: 5px; color: #555; margin-bottom: 50px;">OF COMPLETION</div>
            
            <div style="font-size: 20px; font-style: italic; color: #666;">This is to certify that</div>
            
            <div style="font-size: 38px; font-weight: bold; margin: 30px 0; color: #000; border-bottom: 1px solid #ccc; display: inline-block; min-width: 400px;">${studentName}</div>
            
            <div style="font-size: 20px; color: #444; margin-bottom: 20px;">
                has successfully completed the course
            </div>
            
            <div style="font-size: 32px; font-weight: bold; color: #0070f3; margin-bottom: 40px;">${courseName}</div>
            
            <div style="font-size: 16px; color: #555; margin-bottom: 60px;">Given on ${date}</div>
            
            <div style="display: flex; justify-content: space-between; padding: 0 60px;">
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto 10px;"></div>
                    <div>KLE Tech University</div>
                    <div style="font-size: 12px; color: #777;">Issuing Institution</div>
                </div>
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto 10px;"></div>
                    <div>Registrar</div>
                    <div style="font-size: 12px; color: #777;">Authority</div>
                </div>
            </div>
        </div>
    `;
}

// ---------------------------------------------------------
// CORE VERIFICATION LOGIC
// ---------------------------------------------------------

async function verifyCredential(credentialId) {
    if (!credentialId) {
        credentialId = document.getElementById('credentialId').value.trim();
    }

    if (!credentialId) {
        alert('Please enter a Credential ID');
        return;
    }

    const resultContent = document.getElementById('resultContent');
    const resultDiv = document.getElementById('verificationResult');

    resultContent.innerHTML = `
        <div class="loading" style="text-align: center; padding: 40px;">
            <div class="spinner" style="border: 4px solid rgba(0,0,0,0.1); border-left-color: #0070f3; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px auto;"></div>
            <p>Cryptographically verifying credential proof...</p>
        </div>
    `;
    resultDiv.classList.remove('hidden');

    const startTime = performance.now();

    try {
        const response = await fetch(`/api/verifier/verify/${credentialId}`);
        const result = await response.json();
        const duration = ((performance.now() - startTime) / 1000).toFixed(2);

        if (result.success && result.data) {
            displayVerificationResult(result.data, duration);
        } else {
            displayError(result.message || 'Verification Failed');
        }
    } catch (error) {
        console.error('Verification Error:', error);
        displayError('Network error or server unavailable');
    }
}

function displayVerificationResult(data, duration) {
    const resultContent = document.getElementById('resultContent');
    const isValid = data.valid;
    const status = data.status || 'unknown';

    // UNIVERSAL DATA ENGINE
    const subject = getPopulated(data, ['credential_subject', 'credentialSubject']) ||
        getPopulated(data.vc || {}, ['credentialSubject', 'credential_subject']) || {};

    const gradeCard = getPopulated(data, ['grade_card', 'gradeCard']) || {};
    const credentialType = (data.credential_type || data.credentialType || subject.credentialType || subject.credential_type || 'unknown').toLowerCase().trim();

    console.log('Universal Verifier v3.3 Data Trace:', { subject, gradeCard, credentialType });

    // Normalize data for templates
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
                semester: subject.semester || subject.target_semester || subject.current_semester || subject.currentSemester || ''
            },
            courseRecords: Array.isArray(subject.courses || subject.courseRecords || subject.course_records)
                ? (subject.courses || subject.courseRecords || subject.course_records)
                : (gradeCard.courseRecords || [])
        }
    };

    let statusHtml = `
        <div style="background: rgba(255,255,255,0.05); padding: 8px 12px; font-size: 11px; color: #888; border-radius: 6px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <strong>v3.3 Universal Engine</strong> | Recognized: ${credentialType} | Ref: ${subject.id || 'Legacy-Sig'}
        </div>
        <div class="verification-${isValid ? 'success' : 'error'}" style="margin-bottom: 30px; border-left: 5px solid ${isValid ? '#00c851' : '#ff4444'}; padding-left: 20px;">
            <h2 style="margin:0; font-weight: 800;">Verification ${isValid ? 'VERIFIED ✅' : 'FAILED ❌'}</h2>
            <p style="margin:5px 0 0 0; opacity: 0.8;">Cryptographic proof validated in ${duration}s</p>
        </div>
    `;

    // SELECT TEMPLATE
    let templateHtml = '';
    if (credentialType.includes('markscard') || credentialType.includes('grade') || normalizedData.grade_card.courseRecords.length > 0) {
        templateHtml = renderMarkscardTemplate(normalizedData);
    } else if (credentialType.includes('transcript')) {
        templateHtml = renderTranscriptTemplate(normalizedData);
    } else if (credentialType.includes('hackathon')) {
        templateHtml = renderHackathonCertificateTemplate(normalizedData);
    } else if (credentialType.includes('workshop')) {
        templateHtml = renderWorkshopCertificateTemplate(normalizedData);
    } else if (credentialType.includes('completion')) {
        templateHtml = renderCourseCompletionTemplate(normalizedData);
    }

    let finalHtml = statusHtml;

    if (templateHtml) {
        finalHtml += `
            <div style="margin: 20px 0; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                ${templateHtml}
            </div>
        `;
    } else {
        finalHtml += `<div style="padding: 20px; background: rgba(0,112,243,0.1); border-radius: 8px; margin-bottom: 20px;">
            Proof is valid, but no specific layout was found for type "${credentialType}". Showing raw verification metadata below.
        </div>`;
    }

    // META INFO TABLE
    finalHtml += `
        <div class="metadata-section" style="margin-top: 40px; background: rgba(255,255,255,0.03); border-radius: 16px; padding: 25px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="margin-top:0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 20px;">Verification Metadata</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <label style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Student Name</label>
                    <div style="font-size: 16px; font-weight: 700;">${normalizedData.grade_card.credentialHeader.student_name}</div>
                </div>
                <div>
                    <label style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">USN</label>
                    <div style="font-size: 16px; font-weight: 700;">${normalizedData.grade_card.credentialHeader.usn}</div>
                </div>
                <div>
                    <label style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Credential Type</label>
                    <div style="font-size: 16px; font-weight: 700;">${credentialType.toUpperCase()}</div>
                </div>
                <div>
                    <label style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Academic Performance</label>
                    <div style="font-size: 16px; font-weight: 700;">SGPA ${normalizedData.grade_card.credentialHeader.sgpa} | Sem ${normalizedData.grade_card.credentialHeader.semester || '-'}</div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <button onclick="window.toggleRawJSON()" style="background: transparent; border: 1px solid #444; color: #888; padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                    📋 Show Technical Proof Details (JSON)
                </button>
                <div id="rawJsonContainer" style="display: none; margin-top: 15px;">
                    <pre style="background: #000; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 12px; color: #00ff00;">${JSON.stringify(data.vc || data, null, 2)}</pre>
                </div>
            </div>
        </div>
    `;

    resultContent.innerHTML = finalHtml;
}

function displayError(message) {
    const resultContent = document.getElementById('resultContent');
    resultContent.innerHTML = `
        <div style="padding: 40px; text-align: center; background: rgba(255,68,68,0.1); border-radius: 16px; border: 1px solid #ff4444;">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <h3 style="color: #ff4444; margin:0;">Identity Verification Failed</h3>
            <p style="margin: 10px 0 0 0; opacity: 0.8;">${message}</p>
            <button class="btn btn-secondary" onclick="location.reload()" style="margin-top: 20px;">Try Again</button>
        </div>
    `;
}

window.toggleRawJSON = function () {
    const el = document.getElementById('rawJsonContainer');
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

function showVerifyTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

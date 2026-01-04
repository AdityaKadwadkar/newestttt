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
    const studentName = header.student_name || '-';
    const branch = header.branch || '-';
    const program = header.program || '';
    const semester = header.semester || '';

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

    const studentName = subject.name || subject.student_name || '-';
    const usn = subject.usn || subject.student_id || subject.id || '-';
    const program = subject.program || 'Bachelor of Technology';
    const branch = subject.branch || subject.department || '-';

    let semestersHtml = '';
    semesters.forEach((sem, idx) => {
        let coursesHtml = (sem.courses || []).map((c, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${c.courseCode || c.course_code || ''}</td>
                <td>${c.courseName || c.course_name || ''}</td>
                <td style="text-align:center">${c.credits || ''}</td>
                <td style="text-align:center">${c.grade || ''}</td>
            </tr>
        `).join('');

        semestersHtml += `
            <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 10px;">
                <h4 style="border-bottom: 2px solid #000; display: inline-block;">Semester ${sem.semester || idx + 1}</h4>
                <table class="markscard-table">
                    <thead><tr><th>S.No</th><th>Code</th><th>Name</th><th>Credits</th><th>Grade</th></tr></thead>
                    <tbody>${coursesHtml || '<tr><td colspan="5" style="text-align:center">No records found</td></tr>'}</tbody>
                </table>
                <div style="text-align: right; font-weight: bold; margin-top: 5px;">SGPA: ${sem.sgpa || sem.gpa || '-'}</div>
            </div>
        `;
    });

    return `
        <div class="markscard-wrapper" style="color: #000 !important; background: white !important; font-family: serif;">
            <div style="text-align: center; border-bottom: 2px solid #b91c1c; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="margin:0; font-size: 24px;">KLE TECHNOLOGICAL UNIVERSITY</h1>
                <h2 style="margin:5px 0; font-size: 18px;">CONSOLIDATED TRANSCRIPT</h2>
            </div>
            <div class="markscard-meta">
                <div class="markscard-meta-row"><div class="markscard-meta-label">Student:</div><div>${studentName}</div></div>
                <div class="markscard-meta-row"><div class="markscard-meta-label">USN:</div><div>${usn}</div></div>
                <div class="markscard-meta-row"><div class="markscard-meta-label">Program:</div><div>${program}</div></div>
                <div class="markscard-meta-row"><div class="markscard-meta-label">Branch:</div><div>${branch}</div></div>
            </div>
            <div style="margin-top: 30px;">${semestersHtml}</div>
            <div style="margin-top: 30px; border: 2px solid #000; padding: 15px; display: inline-block;">
                <div>Total Credits: ${subject.totalCredits || subject.total_credits || '-'}</div>
                <div style="font-size: 18px; font-weight: bold;">CGPA: ${subject.cgpa || '-'}</div>
            </div>
        </div>
    `;
}

// Placeholder for other templates if needed
function renderHackathonCertificateTemplate(data) { return `<div class="alert alert-info" style="color:#000">Hackathon Certificate Rendering... (Open Raw JSON for details)</div>`; }
function renderWorkshopCertificateTemplate(data) { return `<div class="alert alert-info" style="color:#000">Workshop Certificate Rendering... (Open Raw JSON for details)</div>`; }
function renderCourseCompletionTemplate(data) { return `<div class="alert alert-info" style="color:#000">Course Completion Rendering... (Open Raw JSON for details)</div>`; }

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
            <strong>v3.4 Universal Engine</strong> | Recognized: ${credentialType} | Ref: ${subject.id || 'Legacy-Sig'}
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

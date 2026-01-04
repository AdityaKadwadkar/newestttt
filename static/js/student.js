// Student Portal JavaScript

document.addEventListener('DOMContentLoaded', function () {
    const token = Storage.getToken();
    if (token) {
        checkStudentAuth();
    }
});

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const studentId = document.getElementById('studentId').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!studentId || !password) {
        showAlert('Please enter both Student ID and Password', 'error');
        return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    try {
        console.log('Attempting student login...', studentId);
        const response = await apiRequest('/student/login', {
            method: 'POST',
            body: {
                student_id: studentId,
                password: password
            }
        });

        console.log('Login response:', response);

        if (response.success && response.data) {
            Storage.setToken(response.data.token);
            Storage.setUser(response.data.student);
            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                showDashboard();
            }, 500);
        } else {
            showAlert(response.message || 'Login failed', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login failed. Please check your Student ID and ensure the server is running.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Check student authentication
async function checkStudentAuth() {
    try {
        const response = await apiRequest('/student/profile');
        if (response.success) {
            Storage.setUser(response.data);
            showDashboard();
        }
    } catch (error) {
        Storage.clear();
        showLogin();
    }
}

// Show login page
function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('mainNav')?.classList.add('hidden');
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    document.getElementById('mainNav')?.classList.remove('hidden');

    const user = Storage.getUser();
    if (user) {
        // Find existing elements - match IDs in HTML
        const nameDisplay = document.getElementById('studentName');
        if (nameDisplay) nameDisplay.textContent = user.full_name || user.student_id;

        const navAvatar = document.getElementById('navAvatar');
        if (navAvatar && user.full_name) {
            navAvatar.textContent = user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }
    }

    loadCredentials();
    setCredentialMode('dashboard'); // Default to cinematic dashboard view
}

let currentCredentialMode = 'view';
let cachedCredentials = [];

// Load credentials
async function loadCredentials() {
    const credentialsList = document.getElementById('credentialsList');
    credentialsList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading your credentials...</p></div>';

    try {
        const response = await apiRequest('/student/credentials');

        if (response.success && response.data.credentials) {
            cachedCredentials = response.data.credentials;
            populateHeroCard(cachedCredentials);
            displayCredentials(cachedCredentials);
        } else {
            credentialsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <h3>No Credentials Yet</h3>
                    <p>You haven't been issued any credentials yet. Please contact your administrator.</p>
                </div>
            `;
        }
    } catch (error) {
        credentialsList.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
}

// Switch between Dashboard / View / Share / Download / Requests modes
function setCredentialMode(mode) {
    currentCredentialMode = mode;

    // Update tab button states
    ['dashboard', 'view', 'share', 'download', 'requests'].forEach(m => {
        const btn = document.getElementById(`tab-${m}`);
        if (btn) {
            if (m === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });

    const requestsView = document.getElementById('requestsView');
    const credentialsList = document.getElementById('credentialsList');
    const recentCard = document.getElementById('recentCredentialCard');
    const featureGrid = document.querySelector('.feature-grid');
    const dashboardTitle = document.querySelector('.dashboard-title');

    // Reset visibility
    [requestsView, credentialsList, recentCard, featureGrid].forEach(el => {
        if (el) el.classList.add('hidden');
    });

    if (mode === 'dashboard') {
        if (recentCard) recentCard.classList.remove('hidden');
        if (featureGrid) featureGrid.classList.remove('hidden');
        if (dashboardTitle) dashboardTitle.textContent = 'Dashboard';
        if (requestsView) requestsView.classList.remove('hidden');
        if (dashboardTitle) dashboardTitle.textContent = 'Credential Requests';
        loadAdmins();
        loadRequestHistory();
        setupRequestForm(); // Initialize listeners
    } else {
        // View / Share / Download modes show the full grid
        if (credentialsList) credentialsList.classList.remove('hidden');
        if (dashboardTitle) dashboardTitle.textContent = mode.charAt(0).toUpperCase() + mode.slice(1) + ' Credentials';
        if (cachedCredentials && cachedCredentials.length) {
            displayCredentials(cachedCredentials);
        }
    }
}

// Populate the Hero Card with the latest credential
function populateHeroCard(credentials) {
    if (!credentials || credentials.length === 0) return;

    // Sort by date descending
    const sorted = [...credentials].sort((a, b) => new Date(b.issued_date) - new Date(a.issued_date));
    const latest = sorted[0];

    const titleEl = document.getElementById('heroCredTitle');
    const descEl = document.getElementById('heroCredDesc');

    if (titleEl) {
        titleEl.textContent = latest.credential_type.replace(/_/g, ' ');
    }

    if (descEl) {
        descEl.textContent = `Issued by ${latest.issuer_name || 'KLE Tech'} on ${formatDate(latest.issued_date)}. This verifiable credential is fully secured by blockchain technology.`;
    }
}

// Display credentials as responsive cards
function displayCredentials(credentials) {
    const credentialsList = document.getElementById('credentialsList');

    if (credentials.length === 0) {
        credentialsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📜</div>
                <h3>No Credentials Yet</h3>
                <p>You haven't been issued any credentials yet.</p>
            </div>
        `;
        return;
    }

    let html = '';

    credentials.forEach(cred => {
        const type = (cred.credential_type || '').toLowerCase();
        const typeIcon = getCredentialIcon(type);
        const typeName = cred.credential_type.replace(/_/g, ' ').toUpperCase();
        let actions = '';

        if (currentCredentialMode === 'view' || currentCredentialMode === 'dashboard') {
            actions = `
                <button class="btn btn-primary" onclick="event.stopPropagation(); viewCredential('${cred.credential_id}', 'view')">View Details</button>
            `;
        } else if (currentCredentialMode === 'share') {
            actions = `
                <button class="btn btn-primary" onclick="event.stopPropagation(); viewCredential('${cred.credential_id}', 'share')">Share QR / Link</button>
            `;
        } else if (currentCredentialMode === 'download') {
            actions = `
                <button class="btn btn-success" onclick="event.stopPropagation(); downloadCredentialTemplate('${cred.credential_id}')">Download PDF</button>
            `;
        }

        html += `
            <div class="credential-card card" onclick="viewCredential('${cred.credential_id}', '${currentCredentialMode}')">
                <div class="credential-icon">${typeIcon}</div>
                <div class="credential-type">${typeName}</div>
                <div class="credential-date">Issued: ${formatDate(cred.issued_date)}</div>
                <div class="credential-issuer">Authority: ${cred.issuer_name || 'KLE Tech'}</div>
                <div class="credential-actions">
                    ${actions}
                </div>
            </div>
        `;
    });

    credentialsList.innerHTML = html;
}

// Get credential icon
function getCredentialIcon(type) {
    const t = (type || '').toLowerCase();
    const icons = {
        'markscard': '📝',
        'transcript': '📄',
        'course_completion': '🎓',
        'workshop': '🏫',
        'hackathon': '💻'
    };
    if (t.includes('transcript')) return icons['transcript'];
    if (t.includes('hackathon')) return icons['hackathon'];
    if (t.includes('markscard') || t.includes('grade')) return icons['markscard'];
    return '📜';
}

// View credential details (different modes)
async function viewCredential(credentialId, mode = 'view') {
    try {
        const response = await apiRequest(`/student/credential/${credentialId}`);

        if (response.success) {
            displayCredentialModal(response.data, mode);
        }
    } catch (error) {
        showAlert(error.message || 'Failed to load credential', 'error');
    }
}

// Build Course Completion template from VC data
function renderCourseCompletionTemplate(credential) {
    const vcData = credential.vc_data || {};
    const subject = vcData.credentialSubject || {};

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
                    <div class="sig-name">${credential.issuer_name || 'Registrar'}</div>
                    <div class="sig-title">Authority</div>
                </div>
            </div>
        </div>
    `;
}

// Build Workshop Certificate template from VC data
function renderWorkshopCertificateTemplate(credential) {
    const vcData = credential.vc_data || {};
    const subject = vcData.credentialSubject || {};

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
                    <div class="workshop-signature-name">${credential.issuer_name || 'KLE Tech'}</div>
                    <div class="workshop-signature-title">Authorized Signatory</div>
                </div>
            </div>
        </div>
    `;
}

// Build Hackathon Certificate template from VC data
function renderHackathonCertificateTemplate(credential) {
    const vcData = credential.vc_data || {};
    const subject = vcData.credentialSubject || {};

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
                        <div class="certificate-signature-name">${credential.issuer_name || 'KLE Tech'}</div>
                        <div class="certificate-signature-title">Issuing Authority</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Build KLE Markscard template from VC data
function renderMarkscardTemplate(credential) {
    const gradeCard = credential.grade_card || {};
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
            const gpa = course.gpa || course.sgpa || '';
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
        // Fallback single row (should rarely be used once courseRecords are stored)
        const code = '';
        const name = '';
        const credits = '';
        const grade = '';
        const gpa = '';
        rowsHtml = `
            <tr>
                <td>1</td>
                <td>${code}</td>
                <td>${name}</td>
                <td>${credits}</td>
                <td>${grade}</td>
                <td>${gpa}</td>
            </tr>
        `;
    }

    const totalCredits = header.total_credits || '';
    const sgpa = header.sgpa || '';

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
function renderTranscriptTemplate(credential) {
    const vcData = credential.vc_data || {};
    const subject = vcData.credentialSubject || {};
    const semesters = subject.semesters || [];

    // Student Details
    const studentName = subject.name || subject.student_name || '–';
    const usn = subject.usn || subject.student_id || '–';
    const program = subject.program || '–';
    const branch = subject.branch || subject.department || '–';
    const batchYear = subject.batchYear || subject.batch_year || '–';
    const medium = subject.mediumOfInstruction || subject.medium_of_instruction || 'English';

    // Bottom Aggregation
    const totalCredits = subject.totalCredits || subject.total_credits || '–';
    const cgpa = subject.cgpa || '–';
    const cgpaInWords = subject.cgpaInWords || subject.cgpa_in_words || '–';
    const resultClass = subject.resultClass || subject.result_class || '–';

    // Dates
    const issuedDate = credential.issued_date || '';
    const dateOfIssue = issuedDate ? new Date(issuedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

    // Semesters HTML
    let semestersHtml = '';
    const semesterNames = ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'];

    semesters.slice(0, 8).forEach((sem, idx) => {
        let coursesHtml = '';
        if (sem.courses && sem.courses.length > 0) {
            sem.courses.forEach(course => {
                coursesHtml += `
                    <tr>
                        <td style="border: 1px solid #000; padding: 4px 6px;">${course.courseCode || course.course_code || '–'}</td>
                        <td style="border: 1px solid #000; padding: 4px 6px;">${course.courseName || course.course_name || '–'}</td>
                        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${course.credits || '–'}</td>
                        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${course.grade || '–'}</td>
                    </tr>
                `;
            });
        }

        const sgpa = sem.sgpa || sem.gpa || '–';

        semestersHtml += `
            <div class="transcript-semester-block" style="border: 1px solid #000; padding: 10px; margin-bottom: 10px; min-height: 180px; display: flex; flex-direction: column;">
                <div style="font-weight: bold; font-size: 13px; text-align: center; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 2px;">${semesterNames[idx]}</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; flex: 1;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #000; padding: 4px; text-align: left;">Code</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: left;">Course Title</th>
                            <th style="border: 1px solid #000; padding: 4px; width: 30px; text-align: center;">Cr</th>
                            <th style="border: 1px solid #000; padding: 4px; width: 40px; text-align: center;">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coursesHtml || '<tr><td colspan="4" style="text-align: center; padding: 10px;">No records</td></tr>'}
                    </tbody>
                </table>
                <div style="text-align: right; font-weight: bold; margin-top: 5px; font-size: 12px;">SGPA: ${sgpa}</div>
            </div>
        `;
    });

    return `
        <div class="transcript-page" style="background: white; padding: 25px; color: #000; font-family: 'Times New Roman', serif; line-height: 1.3; border: 1px solid #000; max-width: 900px; margin: 0 auto;">
            <div class="transcript-header" style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div class="transcript-logo" style="width: 100px; height: 60px; background: #b91c1c; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; margin-right: 20px;">KLE Logo</div>
                <div class="transcript-header-text" style="flex: 1; text-align: center; padding-right: 120px;">
                    <h1 style="font-size: 18px; margin: 0; font-weight: bold;">KLE TECHNOLOGICAL UNIVERSITY</h1>
                    <h2 style="font-size: 14px; margin: 5px 0; font-weight: normal;">Official Consolidated Academic Transcript</h2>
                </div>
            </div>

            <div class="transcript-student-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-top: 1px solid #000; border-left: 1px solid #000; margin-bottom: 20px; font-size: 12px;">
                <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; display: flex;"><span style="width: 140px; font-weight: bold;">Student Name</span><span>${studentName}</span></div>
                <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; display: flex;"><span style="width: 140px; font-weight: bold;">University ID</span><span>${usn}</span></div>
                <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; display: flex;"><span style="width: 140px; font-weight: bold;">Program</span><span>${program}</span></div>
                <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; display: flex;"><span style="width: 140px; font-weight: bold;">Branch</span><span>${branch}</span></div>
                <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; display: flex;"><span style="width: 140px; font-weight: bold;">Year of Admission</span><span>${batchYear}</span></div>
                <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; display: flex;"><span style="width: 140px; font-weight: bold;">Medium of Instruction</span><span>${medium}</span></div>
            </div>

            <div class="transcript-semesters-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                ${semestersHtml}
            </div>

            <div class="transcript-aggregation" style="border: 1px solid #000; padding: 12px; margin-top: 20px; font-size: 13px;">
                <div style="margin-bottom: 5px;"><strong>Total Credits Earned:</strong> <span style="display: inline-block; min-width: 100px; margin-left: 50px;">${totalCredits}</span></div>
                <div style="margin-bottom: 5px;"><strong>Cumulative Grade Point Average (CGPA):</strong> <span style="margin-left: 10px;">${cgpa}</span></div>
                <div style="margin-bottom: 5px;"><strong>CGPA (in words):</strong> <span style="margin-left: 103px;">${cgpaInWords}</span></div>
                <div style="margin-bottom: 0;"><strong>Result:</strong> <span style="margin-left: 147px;">${resultClass}</span></div>
            </div>

            <div class="transcript-footer" style="margin-top: 30px; font-size: 11px; display: flex; justify-content: space-between;">
                <div>Date of Issue: ${dateOfIssue}</div>
                <div>Issued by: KLE Technological University</div>
            </div>
        </div>
    `;
}


// Display credential modal using appropriate template
function displayCredentialModal(credential, mode = 'view') {
    const modal = document.getElementById('credentialModal');
    const modalBody = document.getElementById('modalBody');

    const type = (credential.credential_type || '').toLowerCase();
    let templateHtml = '';

    if (type.includes('hackathon')) {
        templateHtml = renderHackathonCertificateTemplate(credential);
    } else if (type.includes('workshop')) {
        templateHtml = renderWorkshopCertificateTemplate(credential);
    } else if (type.includes('course_completion')) {
        templateHtml = renderCourseCompletionTemplate(credential);
    } else if (type.includes('transcript')) {
        templateHtml = renderTranscriptTemplate(credential);
    } else if (type.includes('markscard') || type.includes('grade') || credential.grade_card) {
        templateHtml = renderMarkscardTemplate(credential);
    }


    const showVerification = mode === 'share' || mode === 'share-qr' || currentCredentialMode === 'share';

    let html = `
        <h2>${credential.credential_type.replace(/_/g, ' ').toUpperCase()}</h2>
        <div class="credential-details">
            <div class="detail-section">
                ${templateHtml}
            </div>

            <div class="detail-section">
                <div class="detail-label">Credential ID</div>
                <div class="detail-value">${credential.credential_id}</div>
            </div>
            
            <div class="detail-section">
                <div class="detail-label">Issued By</div>
                <div class="detail-value">${credential.issuer_name}</div>
            </div>
            
            <div class="detail-section">
                <div class="detail-label">Issue Date</div>
                <div class="detail-value">${formatDateTime(credential.issued_date)}</div>
            </div>

            ${showVerification ? `
            <div class="detail-section">
                <h3 style="margin-bottom: 20px;">Verification & Sharing</h3>
                <div class="qr-code-container" style="text-align: center; width: 100%;">
                    <p style="color: #8b949e; margin-bottom: 20px;">Scan QR code or use the link below to verify this credential.</p>
                    <div id="modalQrCode" style="margin: 0 auto;"></div>
                    <div style="margin-top: 32px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid var(--border-glass);">
                        <p style="font-weight: 700; color: #fff; margin-bottom: 8px;">Public Verification Link</p>
                        <a href="${window.location.origin}/verifier?credential_id=${credential.credential_id}" target="_blank" style="color: #4facfe; word-break: break-all; font-size: 14px;">
                            ${window.location.origin}/verifier?credential_id=${credential.credential_id}
                        </a>
                        <div style="margin-top: 16px;">
                            <button class="btn btn-outline" onclick="copyToClipboard('${window.location.origin}/verifier?credential_id=${credential.credential_id}')">Copy Link</button>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div class="modal-actions" style="margin-top: 40px; display: flex; gap: 16px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;

    modalBody.innerHTML = html;
    modal.classList.remove('hidden');

    if (showVerification) {
        generateQRCode(`${window.location.origin}/verifier?credential_id=${credential.credential_id}`, 'modalQrCode');
    }
}

// Generate QR code
function generateQRCode(text, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Use goqr.me API which is more reliable than the deprecated Google Chart API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`;

    container.innerHTML = `
        <div style="background: white; padding: 16px; display: inline-block; border-radius: 8px; border: 1px solid #eee;">
            <img src="${qrUrl}" alt="Verification QR Code" style="width: 220px; height: 220px; display: block;" 
                 onerror="this.onerror=null; this.src='https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(text)}'; "/>
        </div>
    `;
}

// Download credential as HTML template
async function downloadCredentialTemplate(credentialId) {
    try {
        const response = await apiRequest(`/student/credential/${credentialId}`);
        if (!response.success) {
            showAlert('Failed to download template', 'error');
            return;
        }
        const credential = response.data;
        const type = (credential.credential_type || '').toLowerCase();

        // Inline selection logic
        let templateHtml = '';
        if (type.includes('hackathon')) {
            templateHtml = renderHackathonCertificateTemplate(credential);
        } else if (type.includes('workshop')) {
            templateHtml = renderWorkshopCertificateTemplate(credential);
        } else if (type.includes('course_completion')) {
            templateHtml = renderCourseCompletionTemplate(credential);
        } else if (type.includes('transcript')) {
            templateHtml = renderTranscriptTemplate(credential);
        } else if (type.includes('markscard') || type.includes('grade') || credential.grade_card) {
            templateHtml = renderMarkscardTemplate(credential);
        }

        if (!templateHtml) return;

        let title = `${credential.credential_type || 'Credential'} - ${credentialId}`;
        let cssStyles = '';

        if (type.includes('hackathon')) {
            cssStyles = `
        body { font-family: 'Georgia', 'Times New Roman', serif; background: #e5e7eb; padding: 24px; }
        .hackathon-certificate-wrapper { background: white; padding: 60px 80px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .hackathon-certificate-wrapper.style-green { border: 3px solid #2d5016; }
        .hackathon-certificate-wrapper.style-green .certificate-border { border: 2px solid #2d5016; position: absolute; top: 40px; left: 40px; right: 40px; bottom: 40px; pointer-events: none; }
        .hackathon-certificate-wrapper.style-green .decorative-shape-top-left { position: absolute; top: 0; left: 0; width: 150px; height: 150px; background: linear-gradient(135deg, #2d5016 0%, #4a7c2a 50%, #6ba84a 100%); clip-path: polygon(0 0, 100% 0, 0 100%); opacity: 0.3; }
        .hackathon-certificate-wrapper.style-green .decorative-shape-bottom-right { position: absolute; bottom: 0; right: 0; width: 150px; height: 150px; background: linear-gradient(135deg, #2d5016 0%, #4a7c2a 50%, #6ba84a 100%); clip-path: polygon(100% 0, 100% 100%, 0 100%); opacity: 0.3; }
        .hackathon-certificate-wrapper.style-red { border: 4px solid #c41e3a; }
        .hackathon-certificate-wrapper.style-red .certificate-border { border: 3px solid #c41e3a; position: absolute; top: 30px; left: 30px; right: 30px; bottom: 30px; pointer-events: none; }
        .hackathon-certificate-wrapper.style-red .decorative-shape-top-left { position: absolute; top: 0; left: 0; width: 120px; height: 120px; background: #c41e3a; opacity: 0.2; }
        .hackathon-certificate-wrapper.style-red .decorative-shape-bottom-right { position: absolute; bottom: 0; right: 0; width: 120px; height: 120px; background: #c41e3a; opacity: 0.2; }
        .certificate-content { position: relative; z-index: 1; text-align: center; width: 100%; max-width: 800px; }
        .certificate-title { font-size: 48px; font-weight: bold; color: #1a1a1a; margin-bottom: 30px; letter-spacing: 2px; font-family: 'Georgia', serif; }
        .certificate-award-text { font-size: 18px; color: #333; margin-bottom: 20px; font-style: italic; }
        .certificate-student-name { font-size: 42px; font-weight: bold; color: #2d5016; margin: 30px 0; font-style: italic; font-family: 'Georgia', serif; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 8px; }
        .hackathon-certificate-wrapper.style-red .certificate-student-name { color: #c41e3a; }
        .certificate-reason { font-size: 20px; color: #333; margin: 30px 0; line-height: 1.6; }
        .certificate-hackathon-name { font-size: 28px; font-weight: bold; color: #2d5016; margin: 20px 0; }
        .hackathon-certificate-wrapper.style-red .certificate-hackathon-name { color: #c41e3a; }
        .certificate-details { font-size: 16px; color: #555; margin: 15px 0; line-height: 1.8; }
        .certificate-date { font-size: 18px; color: #333; margin: 30px 0; font-style: italic; }
        .certificate-signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 40px; border-top: 1px solid #ddd; }
        .certificate-signature { text-align: center; flex: 1; max-width: 250px; }
        .certificate-signature-name { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 5px; font-family: 'Brush Script MT', cursive; }
        .certificate-signature-title { font-size: 14px; color: #666; margin-top: 5px; }
        .certificate-logo-area { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .certificate-logo-left, .certificate-logo-right { width: 120px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #333; }`;
        } else if (type.includes('workshop')) {
            cssStyles = `
        body { font-family: 'Segoe UI', serif; background: #f3f4f6; padding: 40px; }
        .workshop-certificate-wrapper { background: #fafaf9; padding: 50px; border: 20px solid #78350f; position: relative; text-align: center; color: #444; max-width: 800px; margin: 0 auto; }
        .workshop-certificate-border { position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px; border: 1px solid #d97706; pointer-events: none; }
        .workshop-title { font-size: 48px; color: #92400e; margin-bottom: 20px; font-weight: bold; }
        .workshop-award-text { font-size: 20px; margin-bottom: 20px; }
        .workshop-student-name { font-size: 40px; font-weight: bold; color: #78350f; margin: 20px 0; }
        .workshop-info { font-size: 22px; line-height: 1.6; margin: 30px 0; }
        .workshop-name { font-weight: bold; color: #92400e; }
        .workshop-meta { font-size: 16px; color: #666; margin-top: 20px; }
        .workshop-signatures { margin-top: 60px; display: flex; justify-content: space-around; }
        .workshop-signature { width: 220px; }
        .workshop-signature-line { border-top: 1px solid #444; margin-bottom: 8px; }
        .workshop-signature-name { font-weight: bold; font-size: 16px; }
        .workshop-signature-title { font-size: 14px; color: #666; }`;
        } else if (type.includes('course_completion')) {
            cssStyles = `
        body { font-family: 'Segoe UI', sans-serif; background: #f9fafb; padding: 40px; }
        .course-completion-wrapper { background: #fff; padding: 60px; border: 15px solid #1e40af; position: relative; text-align: center; color: #1f2937; max-width: 800px; margin: 0 auto; }
        .course-completion-border { position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 2px solid #3b82f6; pointer-events: none; }
        .course-completion-header h1 { font-size: 42px; color: #1e3a8a; margin-bottom: 10px; letter-spacing: 2px; }
        .course-completion-header h2 { font-size: 24px; color: #3b82f6; margin-bottom: 30px; font-weight: 500; }
        .course-completion-text { font-size: 18px; margin: 20px 0; font-style: italic; }
        .course-completion-student-name { font-size: 36px; font-weight: 700; color: #1e40af; margin: 20px 0; border-bottom: 2px solid #e5e7eb; display: inline-block; padding-bottom: 5px; }
        .course-completion-course-info { font-size: 22px; margin: 30px 0; line-height: 1.5; }
        .course-completion-course-name { font-weight: 700; color: #1e3a8a; }
        .course-completion-details { font-size: 16px; color: #6b7280; margin-top: 20px; }
        .course-completion-footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 40px; }
        .course-completion-sig { border-top: 1px solid #9ca3af; padding-top: 10px; width: 200px; }
        .sig-name { font-weight: 600; font-size: 16px; }
        .sig-title { font-size: 14px; color: #6b7280; }`;
        } else if (type.includes('transcript')) {
            cssStyles = `
        body { font-family: 'Times New Roman', serif; background: #f0f0f0; padding: 20px; }
        .transcript-page { background: white; max-width: 900px; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }`;
        } else {
            cssStyles = `
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #e5e7eb; padding: 24px; }
        .markscard-wrapper { background: white; padding: 30px 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .markscard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .markscard-logo-box { width: 140px; height: 80px; background: #b91c1c; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 28px; }
        .markscard-title-block { text-align: center; flex: 1; }
        .markscard-title-block h1 { font-size: 22px; letter-spacing: 2px; margin-bottom: 4px; }
        .markscard-title-block h2 { font-size: 20px; margin-bottom: 4px; }
        .markscard-title-block h3 { font-size: 18px; margin-top: 8px; }
        .markscard-photo-box { width: 120px; height: 120px; border: 1px solid #ccc; background: #f9fafb; }
        .markscard-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 4px 24px; font-size: 14px; margin-bottom: 16px; }
        .markscard-meta-row { display: flex; }
        .markscard-meta-label { width: 110px; font-weight: 600; }
        .markscard-meta-value { flex: 1; }
        .markscard-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        .markscard-table th, .markscard-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
        .markscard-table th { text-align: center; font-weight: 600; }
        .markscard-footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 13px; }
        .markscard-sgpa-box { border: 1px solid #000; padding: 8px 12px; }`;
        }


        const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>${cssStyles}</style>
</head>
<body>
${templateHtml}
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credential_${credentialId}_template.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert('Template downloaded successfully!', 'success');
    } catch (error) {
        showAlert(error.message || 'Failed to download template', 'error');
    }
}

// Share credential
function shareCredential(credentialId) {
    const url = `${window.location.origin}/verifier?credential_id=${credentialId}`;

    if (navigator.share) {
        navigator.share({
            title: 'My Digital Credential',
            text: 'Verify my credential',
            url: url
        });
    } else {
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showAlert('Verification link copied to clipboard!', 'success');
        });
    }
}

// Close modal
function closeModal() {
    document.getElementById('credentialModal').classList.add('hidden');
}

// Credential Request Logic
async function loadAdmins() {
    const adminSelect = document.getElementById('requestAdminId');
    // Only load if empty
    if (!adminSelect || adminSelect.options.length > 1) return;

    try {
        const response = await apiRequest('/student/admins');
        if (response.success) {
            response.data.forEach(admin => {
                const option = document.createElement('option');
                option.value = admin.admin_id;
                option.textContent = `${admin.full_name} (${admin.username})`;
                adminSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load admins:', error);
    }
}

async function loadRequestHistory() {
    const historyList = document.getElementById('requestHistoryList');
    try {
        const response = await apiRequest('/student/requests');
        if (response.success) {
            if (response.data.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <p>You haven't submitted any requests yet.</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Credential Type</th>
                                <th>Administrator</th>
                                <th>Status</th>
                                <th>Date Requested</th>
                                <th>Admin Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            response.data.forEach(req => {
                const statusBadge = `badge-${req.status === 'pending' ? 'pending' : (req.status === 'approved' || req.status === 'allotted') ? 'success' : 'failed'}`;
                html += `
                    <tr>
                        <td style="font-weight: 600;">${req.credential_type.replace(/_/g, ' ').toUpperCase()}</td>
                        <td>${req.admin_name}</td>
                        <td><span class="badge ${statusBadge}">${req.status.toUpperCase()}</span></td>
                        <td style="font-size: 13px;">${formatDate(req.created_at)}</td>
                        <td style="font-size: 13px; color: #666;">${req.admin_remarks || '-'}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            historyList.innerHTML = html;
        }
    } catch (error) {
        historyList.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
}

// Copy to clipboard helper
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showAlert('Link copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showAlert('Link copied to clipboard!', 'success');
    } catch (err) {
        showAlert('Failed to copy link', 'error');
    }
    document.body.removeChild(textArea);
}

// --- Dynamic Request Form Logic ---

function setupRequestForm() {
    const typeSelect = document.getElementById('requestType');
    if (typeSelect && !typeSelect.hasAttribute('data-listening')) {
        typeSelect.addEventListener('change', handleRequestTypeChange);
        typeSelect.setAttribute('data-listening', 'true');
    }
}

function handleRequestTypeChange(e) {
    const type = e.target.value;
    const container = document.getElementById('dynamicRequestFields');
    if (!container) return;

    container.innerHTML = '';
    let html = '';

    if (type === 'markscard') {
        html = `
            <div class="form-group">
                <label class="form-label">Semester</label>
                <select id="req_semester" class="form-select" required>
                    <option value="">-- Select Semester --</option>
                    ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `<option value="${i}">Semester ${i}</option>`).join('')}
                </select>
                <small style="color: #666;">Marks card for specific semester</small>
            </div>
        `;
    } else if (type === 'course_completion') {
        html = `
            <div class="form-group">
                <label class="form-label">Course Name</label>
                <input type="text" id="req_course_name" class="form-input" required placeholder="e.g. Advanced Python">
            </div>
            <div class="form-group">
                <label class="form-label">Course Code</label>
                <input type="text" id="req_course_code" class="form-input" placeholder="e.g. CS202">
            </div>
            <div class="form-group">
                <label class="form-label">Completion Date</label>
                <input type="date" id="req_completion_date" class="form-input" required>
            </div>
        `;
    } else if (type === 'workshop') {
        html = `
            <div class="form-group">
                <label class="form-label">Workshop Name</label>
                <input type="text" id="req_workshop_name" class="form-input" required placeholder="e.g. AI/ML Workshop">
            </div>
            <div class="form-group">
                <label class="form-label">Organizer</label>
                <input type="text" id="req_organizer" class="form-input" placeholder="e.g. Dept of CS">
            </div>
             <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" id="req_participation_date" class="form-input" required>
            </div>
             <div class="form-group">
                <label class="form-label">Duration</label>
                <input type="text" id="req_workshop_duration" class="form-input" placeholder="e.g. 2 Days">
            </div>
        `;
    } else if (type === 'hackathon') {
        html = `
            <div class="form-group">
                <label class="form-label">Hackathon Name</label>
                <input type="text" id="req_hackathon_name" class="form-input" required placeholder="e.g. Smart India Hackathon">
            </div>
            <div class="form-group">
                <label class="form-label">Team Name</label>
                <input type="text" id="req_team_name" class="form-input" placeholder="e.g. CodeWarriors">
            </div>
            <div class="form-group">
                <label class="form-label">Position / Prize</label>
                <input type="text" id="req_position" class="form-input" placeholder="e.g. 1st Place / Participant">
            </div>
            <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" id="req_participation_date" class="form-input" required>
            </div>
        `;
    }

    container.innerHTML = html;
}

function getRequestDetails(type) {
    const details = {};

    if (type === 'markscard') {
        const sem = document.getElementById('req_semester');
        if (sem) details.semester = sem.value;
    } else if (type === 'course_completion') {
        details.course_name = document.getElementById('req_course_name')?.value;
        details.course_code = document.getElementById('req_course_code')?.value;
        details.completion_date = document.getElementById('req_completion_date')?.value;
    } else if (type === 'workshop') {
        details.workshop_name = document.getElementById('req_workshop_name')?.value;
        details.organizer = document.getElementById('req_organizer')?.value;
        details.participation_date = document.getElementById('req_participation_date')?.value;
        details.workshop_duration = document.getElementById('req_workshop_duration')?.value;
    } else if (type === 'hackathon') {
        details.hackathon_name = document.getElementById('req_hackathon_name')?.value;
        details.team_name = document.getElementById('req_team_name')?.value;
        details.position = document.getElementById('req_position')?.value;
        details.participation_date = document.getElementById('req_participation_date')?.value;
    }

    return details;
}

document.getElementById('requestForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const adminId = document.getElementById('requestAdminId').value;
    const type = document.getElementById('requestType').value;
    const reason = document.getElementById('requestReason').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const details = getRequestDetails(type); // Capture dynamic details

        const response = await apiRequest('/student/request', {
            method: 'POST',
            body: { admin_id: adminId, credential_type: type, reason: reason, details: details }
        });

        if (response.success) {
            showAlert('Request submitted successfully!', 'success');
            e.target.reset();
            document.getElementById('dynamicRequestFields').innerHTML = ''; // Clear dynamic fields
            loadRequestHistory();
        }
    } catch (error) {
        showAlert(error.message || 'Failed to submit request', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Notification Center Logic
let notifications = [];

function toggleNotifications(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('notifDropdown');
    dropdown.classList.toggle('active');

    // Close on click outside
    if (dropdown && dropdown.classList.contains('active')) {
        const closeDropdown = (event) => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
                document.removeEventListener('click', closeDropdown);
            }
        };
        document.addEventListener('click', closeDropdown);
    }
}

function addNotification(message) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    notifications.unshift({ message, time });
    updateNotificationUI();
}

function updateNotificationUI() {
    const list = document.getElementById('notifList');
    const badge = document.getElementById('notifBadge');

    if (notifications.length > 0) {
        if (badge) {
            badge.textContent = notifications.length;
            badge.classList.remove('hidden');
        }

        if (list) {
            list.innerHTML = notifications.map(n => `
                <div class="notif-item">
                    <div class="notif-time">${n.time}</div>
                    <div class="notif-msg">${n.message}</div>
                </div>
            `).join('');
        }
    } else {
        if (badge) badge.classList.add('hidden');
        if (list) list.innerHTML = '<div class="notif-empty">No new notifications</div>';
    }
}

function clearNotifications() {
    notifications = [];
    updateNotificationUI();
}

// Support for system alerts in notification center
if (typeof window.showAlert === 'function') {
    const originalShowAlert = window.showAlert;
    window.showAlert = function (message, type) {
        originalShowAlert(message, type);
        addNotification(message);
    };
}

// Notification Polling
let lastRequestsState = {};

function startNotificationPolling() {
    setInterval(checkForUpdates, 30000); // Check every 30 seconds
}

async function checkForUpdates() {
    try {
        const response = await apiRequest('/student/requests', { method: 'GET' }, true); // Silent request if supported, or just normal
        if (response.success && response.data) {
            response.data.forEach(req => {
                const oldStatus = lastRequestsState[req.request_id];
                if (oldStatus && oldStatus !== req.status) {
                    const typeName = req.credential_type.replace(/_/g, ' ').toUpperCase();
                    if (req.status === 'issued') {
                        addNotification(`🎓 Your ${typeName} has been ISSUED! Check your dashboard.`);
                        showAlert(`Your ${typeName} request has been issued!`, 'success');
                    } else if (req.status === 'approved') {
                        addNotification(`✅ Your ${typeName} request was APPROVED.`);
                    } else if (req.status === 'rejected') {
                        addNotification(`❌ Your ${typeName} request was REJECTED.`);
                    }
                }
                lastRequestsState[req.request_id] = req.status;
            });

            // Refresh list if dashboard is active to show changes live
            if (document.getElementById('requestsView') && !document.getElementById('requestsView').classList.contains('hidden')) {
                loadRequestHistory();
            }
        }
    } catch (e) {
        // Silent fail
    }
}

// Start polling
if (window.location.pathname.includes('student')) {
    startNotificationPolling();
}



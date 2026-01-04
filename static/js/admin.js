// Admin Portal JavaScript

// Set today's date as default issue date
document.addEventListener('DOMContentLoaded', function () {
    const issueDateInput = document.getElementById('issueDate');
    if (issueDateInput) {
        const today = new Date().toISOString().split('T')[0];
        issueDateInput.value = today;
    }

    // Check if already logged in
    const token = Storage.getToken();
    if (token) {
        checkAdminAuth();
    }

    // Dynamic metadata fields visibility
    const credentialTypeSelect = document.getElementById('credentialType');
    if (credentialTypeSelect) {
        credentialTypeSelect.addEventListener('change', function () {
            const type = this.value;
            // Hide all metadata sections
            document.querySelectorAll('.metadata-section').forEach(section => {
                section.classList.add('hidden');
            });

            // Show relevant section
            if (type === 'course_completion') {
                document.getElementById('courseCompletionMetadata').classList.remove('hidden');
            } else if (type === 'workshop') {
                document.getElementById('workshopMetadata').classList.remove('hidden');
            } else if (type === 'hackathon') {
                document.getElementById('hackathonMetadata').classList.remove('hidden');
            }

            // Show Markscard Semester field ONLY for Markscard
            const mkSect = document.getElementById('markscardSemesterSection');
            if (mkSect) {
                if (type === 'markscard') {
                    mkSect.classList.remove('hidden');
                } else {
                    mkSect.classList.add('hidden');
                }
            }
        });
    }
});

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showAlert('Please enter both username and password', 'error');
        return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    try {
        console.log('Attempting admin login...');
        const response = await apiRequest('/admin/login', {
            method: 'POST',
            body: { username, password }
        });

        console.log('Login response:', response);

        if (response.success && response.data) {
            Storage.setToken(response.data.token);
            Storage.setUser(response.data.admin);
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
        showAlert(error.message || 'Login failed. Please check if the server is running.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Check admin authentication
async function checkAdminAuth() {
    try {
        const response = await apiRequest('/admin/profile');
        if (response.success) {
            Storage.setUser(response.data);
            showDashboard();
        }
    } catch (error) {
        Storage.clear();
        showLogin();
    }
}

// Logout function
function logout() {
    Storage.clear();
    window.location.href = '/admin';
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
        const label = user.full_name || user.username || 'Admin';
        const display = document.getElementById('adminNameDisplay');
        if (display) {
            display.textContent = label;
        }
    }

    // Load data if needed based on active tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const text = activeTab.textContent.toLowerCase();
        if (text.includes('history') || text.includes('batches')) loadBatches();
        if (text.includes('requests')) loadAdminRequests();
    }
}

// Tab switching
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.id === `tab-${tabName}-btn` || btn.textContent.toLowerCase().includes(tabName.toLowerCase())) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update navbar links
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.textContent.toLowerCase().includes(tabName.toLowerCase()) ||
            (tabName === 'issue' && item.textContent.toLowerCase().includes('issuance'))) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Show active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const tabEl = document.getElementById(`${tabName}Tab`);
    if (tabEl) tabEl.classList.remove('hidden');

    if (tabName === 'batches') {
        loadBatches();
    } else if (tabName === 'requests') {
        loadAdminRequests();
    }
}

// Admin profile modal controls
function openAdminProfile() {
    const user = Storage.getUser();
    if (user) {
        document.getElementById('adminProfileName').textContent = user.full_name || '-';
        document.getElementById('adminProfileUsername').textContent = user.username || '-';
        document.getElementById('adminProfileEmail').textContent = user.email || '-';
        document.getElementById('adminProfileRole').textContent = user.role || 'Admin';
    }
    const modal = document.getElementById('adminProfileModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeAdminProfile() {
    const modal = document.getElementById('adminProfileModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Preview batch
async function previewBatch() {
    const filters = getFilterCriteria();
    const safeGetValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };
    const credentialType = safeGetValue('credentialType');

    if (!credentialType) {
        showAlert('Please select a credential type', 'error');
        return;
    }

    try {
        showAlert('Loading preview...', 'info');

        const response = await apiRequest('/admin/credential/batch/preview', {
            method: 'POST',
            body: {
                ...filters,
                credential_type: credentialType,
                metadata: getMetadata(credentialType),
                markscard_semester: credentialType === 'markscard' ? document.getElementById('markscardSemester').value : null
            }
        });

        if (response.success) {
            displayPreview(response.data);
        }
    } catch (error) {
        showAlert(error.message || 'Preview failed', 'error');
    }
}

// Get filter criteria from form
// Get filter criteria from form
function getFilterCriteria() {
    const filters = {};

    const safeGetValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : null;
    };

    const studentId = safeGetValue('filterStudentId');
    const department = safeGetValue('department');
    const batchYear = safeGetValue('batchYear');
    const division = safeGetValue('division');
    const courseEnrolled = safeGetValue('courseEnrolled');
    const semester = safeGetValue('semester');
    const marksMin = safeGetValue('marksMin');
    const marksMax = safeGetValue('marksMax');

    if (studentId) filters.student_id = studentId;
    if (department) filters.department = department;
    if (batchYear) filters.batch_year = batchYear;
    if (division) filters.division = division;
    if (courseEnrolled) filters.course_enrolled = courseEnrolled;
    if (semester) filters.semester = semester;
    if (marksMin) filters.marks_min = marksMin;
    if (marksMax) filters.marks_max = marksMax;

    return filters;
}

// Get credential-specific metadata from form
// Get credential-specific metadata from form
function getMetadata(type) {
    const safeGetValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };

    const metadata = {};
    if (type === 'course_completion') {
        metadata.course_name = safeGetValue('course_name');
        metadata.course_code = safeGetValue('course_code');
        metadata.completion_date = safeGetValue('completion_date');
        metadata.description = safeGetValue('course_description');
    } else if (type === 'workshop') {
        metadata.workshop_name = safeGetValue('workshop_name');
        metadata.organizer = safeGetValue('workshop_organizer');
        metadata.workshop_duration = safeGetValue('workshop_duration');
        metadata.participation_date = safeGetValue('workshop_participation_date');
        metadata.description = safeGetValue('workshop_description');
    } else if (type === 'hackathon') {
        metadata.hackathon_name = safeGetValue('hackathon_name');
        metadata.organizer = safeGetValue('hackathon_organizer');
        metadata.participation_date = safeGetValue('hackathon_participation_date');
        metadata.team_name = safeGetValue('hackathon_team_name');
        metadata.position = safeGetValue('hackathon_position');
        metadata.prize_won = safeGetValue('hackathon_prize_won');
        metadata.description = safeGetValue('hackathon_description');
    }
    return metadata;
}

// Display preview
function displayPreview(data) {
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');

    previewSection.classList.remove('hidden');

    let html = `
        <div class="preview-stats">
            <div class="stat-card">
                <div class="stat-value">${data.student_count}</div>
                <div class="stat-label">Total Students</div>
            </div>
        </div>
    `;

    if (data.students && data.students.length > 0) {
        html += `
            <h4>Sample Students (first 10):</h4>
            <div class="student-list">
        `;

        data.students.forEach(student => {
            html += `
                <div class="student-item">
                    <div>
                        <strong>${student.full_name}</strong>
                        <div style="font-size: 12px; color: #666;">
                            ${student.student_id} | ${student.department || ''} | Batch ${student.batch_year || ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    }

    if (data.preview) {
        html += `
            <h4>Sample Credential Preview:</h4>
            <pre style="background: white; color: #333; padding: 15px; border-radius: 8px; overflow-x: auto; max-height: 300px; overflow-y: auto;">${JSON.stringify(data.preview, null, 2)}</pre>
        `;
    }

    previewContent.innerHTML = html;
}

// Issue credentials form handler
document.getElementById('issueForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const safeGetValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };

    const credentialType = safeGetValue('credentialType');
    const issuerName = safeGetValue('issuerName');
    const issueDate = safeGetValue('issueDate');
    const additionalNotes = safeGetValue('additionalNotes');

    if (!credentialType || !issuerName || !issueDate) {
        showAlert('Please fill all required fields', 'error');
        return;
    }

    const filters = getFilterCriteria();

    try {
        showAlert('Creating batch...', 'info');

        const body = {
            credential_type: credentialType,
            issuer_name: issuerName,
            issue_date: issueDate,
            additional_notes: additionalNotes,
            metadata: getMetadata(credentialType),
            ...filters
        };

        if (credentialType === 'markscard') {
            body.markscard_semester = document.getElementById('markscardSemester').value;
        }

        const response = await apiRequest('/admin/credential/batch/create', {
            method: 'POST',
            body: body
        });

        if (response.success) {
            showAlert(`Batch created successfully! Processing ${response.data.total_students} credentials...`, 'success');

            // Start processing
            processBatch(response.data.batch_id);

            // Reset form
            document.getElementById('issueForm').reset();
            document.getElementById('previewSection').classList.add('hidden');

            // Switch to batches tab
            showTab('batches');
        }
    } catch (error) {
        showAlert(error.message || 'Failed to create batch', 'error');
    }
});

// Process batch
async function processBatch(batchId) {
    try {
        const response = await apiRequest(`/admin/credential/batch/process/${batchId}`, {
            method: 'POST'
        });

        if (response.success) {
            showAlert(response.message, 'success');
            loadBatches(); // Refresh batch list
        }
    } catch (error) {
        showAlert(error.message || 'Batch processing failed', 'error');
    }
}

// Load batches
async function loadBatches() {
    const batchesList = document.getElementById('batchesList');
    if (!batchesList) return;

    batchesList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading batches...</p></div>';

    try {
        const response = await apiRequest('/admin/credential/batches');

        if (response.success && response.data.batches) {
            displayBatches(response.data.batches);
        } else {
            batchesList.innerHTML = '<p class="text-center">No batches found.</p>';
        }
    } catch (error) {
        batchesList.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
}

// Display batches
function displayBatches(batches) {
    const batchesList = document.getElementById('batchesList');

    if (batches.length === 0) {
        batchesList.innerHTML = '<p class="text-center">No batches found.</p>';
        return;
    }

    let html = '';

    batches.forEach(batch => {
        const progress = batch.total_students > 0
            ? Math.round((batch.processed_count / batch.total_students) * 100)
            : 0;

        html += `
            <div class="batch-card">
                <div class="batch-header">
                    <div>
                        <h3>${batch.credential_type.replace(/_/g, ' ').toUpperCase()}</h3>
                        <p style="color: #666; font-size: 14px;">
                            Batch ID: ${batch.batch_id} | Created: ${formatDateTime(batch.created_at)}
                        </p>
                    </div>
                    <span class="badge badge-${batch.status === 'completed' ? 'success' : batch.status === 'failed' ? 'failed' : 'pending'}">
                        ${batch.status.toUpperCase()}
                    </span>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%">
                        ${progress}%
                    </div>
                </div>
                
                <div class="batch-info">
                    <div class="batch-stat">
                        <div class="batch-stat-value">${batch.total_students}</div>
                        <div class="batch-stat-label">Total</div>
                    </div>
                    <div class="batch-stat">
                        <div class="batch-stat-value">${batch.processed_count}</div>
                        <div class="batch-stat-label">Processed</div>
                    </div>
                    <div class="batch-stat">
                        <div class="batch-stat-value" style="color: var(--success-color);">${batch.success_count}</div>
                        <div class="batch-stat-label">Success</div>
                    </div>
                    <div class="batch-stat">
                        <div class="batch-stat-value" style="color: var(--danger-color);">${batch.failed_count}</div>
                        <div class="batch-stat-label">Failed</div>
                    </div>
                </div>
                
                ${batch.status === 'pending' ? `
                    <div class="batch-actions">
                        <button class="btn btn-primary" onclick="processBatch('${batch.batch_id}')">Process Batch</button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    batchesList.innerHTML = html;
}

// Student Credential Request Management
async function loadAdminRequests() {
    const listContainer = document.getElementById('adminRequestsList');
    if (!listContainer) return;

    try {
        const response = await apiRequest('/admin/requests');
        if (response.success) {
            if (response.data.length === 0) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <p>No credential requests found.</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Credential Type</th>
                                <th>Reason</th>
                                <th>Requested On</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            response.data.forEach(req => {
                const statusBadge = `badge-${req.status === 'pending' ? 'pending' : (req.status === 'approved' || req.status === 'issued') ? 'success' : 'failed'}`;

                // Format details
                let detailsHtml = '';
                if (req.request_details) {
                    detailsHtml = '<div style="font-size: 12px; color: #555; margin-top: 4px;">';
                    for (const [key, value] of Object.entries(req.request_details)) {
                        // Skip raw if parsed
                        if (key === 'raw') continue;
                        detailsHtml += `<div><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</div>`;
                    }
                    detailsHtml += '</div>';
                }

                html += `
                    <tr>
                        <td>
                            <strong>${req.student_name}</strong><br>
                            <small>${req.student_id}</small>
                        </td>
                        <td style="font-weight: 600;">
                            ${req.credential_type.replace(/_/g, ' ').toUpperCase()}
                            ${detailsHtml}
                        </td>
                        <td style="max-width: 250px; font-size: 13px; color: #555;">${req.reason || '-'}</td>
                        <td style="font-size: 13px;">${formatDate(req.created_at)}</td>
                        <td><span class="badge ${statusBadge}">${req.status.toUpperCase()}</span></td>
                        <td>
                            ${(req.status === 'pending' || req.status === 'approved') ? `
                                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                                    ${req.status === 'pending' ? `
                                    <button class="btn btn-success" style="padding: 6px 12px; font-size: 13px;" onclick="handleRequestAction('${req.request_id}', 'approved')">Approve</button>
                                    ` : ''}
                                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 13px;" onclick="handleRequestAction('${req.request_id}', 'issued')">Issue</button>
                                    <button class="btn btn-danger" style="padding: 6px 12px; font-size: 13px;" onclick="handleRequestAction('${req.request_id}', 'rejected')">Reject</button>
                                </div>
                            ` : `<small style="color: #666;">${req.admin_remarks || 'Processed'}</small>`}
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            listContainer.innerHTML = html;
        }
    } catch (error) {
        listContainer.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
}

async function handleRequestAction(requestId, status) {
    let remarks = '';

    if (status === 'issued') {
        if (!confirm('This will generate and issue the credential to the student immediately properly using the provided details. Continue?')) {
            return;
        }
    } else {
        remarks = prompt(status === 'approved' ? 'Enter approval remarks (optional):' : 'Enter rejection reason:');
        if (status === 'rejected' && remarks === null) return; // Cancelled
    }

    try {
        const response = await apiRequest(`/admin/request/${requestId}/status`, {
            method: 'POST',
            body: { status: status, remarks: remarks || `${status.charAt(0).toUpperCase() + status.slice(1)} by Admin` }
        });

        if (response.success) {
            showAlert(`Request ${status} successfully!`, 'success');
            loadAdminRequests();
        }
    } catch (error) {
        showAlert(error.message || 'Failed to update request', 'error');
    }
}

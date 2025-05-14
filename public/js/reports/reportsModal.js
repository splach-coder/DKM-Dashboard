// DOM Elements
const modalBackdrop = document.getElementById('modalBackdrop');
const lastUpdated = document.getElementById('lastUpdated');
const statusIndicator = document.getElementById('statusIndicator');
const addCommentButton = document.getElementById('addCommentButton');
const commentInputContainer = document.getElementById('commentInputContainer');
const newCommentText = document.getElementById('newCommentText');
const cancelCommentBtn = document.getElementById('cancelComment');
const submitCommentBtn = document.getElementById('submitComment');
const cancelReportBtn = document.getElementById('cancelReport');
const saveReportBtn = document.getElementById('saveReport');

// Helper functions
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getRelativeTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === -1) return 'Yesterday';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays > -7 && diffInDays < 0) return rtf.format(diffInDays, 'day');
    if (diffInDays > 0 && diffInDays < 7) return rtf.format(diffInDays, 'day');
    
    return formatDate(date);
}

function getFileIcon(fileType) {
    const iconMap = {
        'pdf': 'fa-file-pdf',
        'excel': 'fa-file-excel',
        'word': 'fa-file-word',
        'powerpoint': 'fa-file-powerpoint',
        'csv': 'fa-file-csv',
        'text': 'fa-file-lines',
        'image': 'fa-file-image',
        'video': 'fa-file-video',
        'audio': 'fa-file-audio',
        'zip': 'fa-file-zipper',
        'code': 'fa-file-code'
    };
    
    return iconMap[fileType] || 'fa-file';
}

// API mock functions
async function updateReportStatus(reportId, status) {
    // Simulate API call with a short delay
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`Updated report ${reportId} status to ${status}`);
            resolve(true);
        }, 300);
    });
}

async function updateReportAssignment(reportId, assignedTo) {
    // Simulate API call with a short delay
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`Assigned report ${reportId} to ${assignedTo}`);
            resolve(true);
        }, 300);
    });
}

async function addReportTag(reportId, tag) {
    // Simulate API call with a short delay
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`Added tag "${tag}" to report ${reportId}`);
            resolve(true);
        }, 300);
    });
}

async function removeReportTag(reportId, tag) {
    // Simulate API call with a short delay
    return new Promise(resolve => {
        const report = currentReports.find(r => r.id === reportId);
        if (report) {
            report.tags = report.tags.filter(t => t !== tag);
            console.log(`Removed tag "${tag}" from report ${reportId}`);
        }
        resolve(true);
    });
}

async function addComment(reportId, text) {
    // Simulate API call with a short delay
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`Added comment to report ${reportId}: ${text}`);
            // In a real app, this would add the comment to the database
            // For now, we'll just update our current report
            const report = currentReports.find(r => r.id === reportId);
            if (report) {
                report.comment = text;
            }
            resolve(true);
        }, 300);
    });
}

// Main function to show report detail
function showReportDetail(reportId) {
    const report = currentReports.find(r => r.id === reportId);
    if (!report) return;

    // Display modal and backdrop
    modalBackdrop.style.display = 'block';
    reportDetail.style.display = 'flex';

    // Set basic information
    detailTitle.textContent = report.title;
    detailDate.textContent = formatDate(report.date);
    lastUpdated.textContent = getRelativeTime(report.lastUpdated);
    detailDescription.textContent = report.description;

    // Update status indicator and dropdown
    statusIndicator.className = 'status-indicator ' + report.status;
    statusDropdown.value = report.status;

    // Set up assignment dropdown
    detailAssigned.innerHTML = `
        <select class="assignment-select" id="assignmentSelect">
            <option value="Luc" ${report.assignedTo === 'Luc' ? 'selected' : ''}>Luc</option>
            <option value="Anas" ${report.assignedTo === 'Anas' ? 'selected' : ''}>Anas</option>
            <option value="Me" ${report.assignedTo === 'Me' ? 'selected' : ''}>Me</option>
        </select>
    `;

    // Set up assignment change handler
    document.getElementById('assignmentSelect').addEventListener('change', async function() {
        await updateReportAssignment(reportId, this.value);
        report.assignedTo = this.value;
    });

    // Update tags with interactive functionality
    detailTags.innerHTML = '';
    const tagInput = document.createElement('div');
    tagInput.className = 'tag-input';
    
    // Add existing tags
    report.tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <i class="fas fa-times" data-tag="${tag}"></i>
        `;
        tagInput.appendChild(tagElement);
    });
    
    // Add input field for new tags
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'new-tag-input';
    input.placeholder = 'Add tag...';
    tagInput.appendChild(input);
    
    detailTags.appendChild(tagInput);
    
    // Set up event listeners for tag removal
    document.querySelectorAll('.tag i').forEach(icon => {
        icon.addEventListener('click', async function() {
            const tag = this.getAttribute('data-tag');
            await removeReportTag(reportId, tag);
            // Refresh the detail view to show changes
            showReportDetail(reportId);
        });
    });
    
    // Set up event listener for adding tags
    input.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            const newTag = this.value.trim();
            if (!report.tags.includes(newTag)) {
                await addReportTag(reportId, newTag);
                report.tags.push(newTag);
                showReportDetail(reportId);
            }
            this.value = '';
        }
    });

    // Update files with interactive icons
    detailFiles.innerHTML = '';
    
    if (report.files.length > 0) {
        report.files.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <div class="file-icon">
                    <i class="fas ${getFileIcon(file.type)}"></i>
                </div>
                <div class="file-name">${file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}</div>
                <div class="file-actions">
                    <a href="${file.url}" download>Download</a>
                </div>
            `;
            detailFiles.appendChild(fileElement);
            
            // Add click event to show full name on tooltip or in a modal
            fileElement.addEventListener('click', function(e) {
                if (!e.target.closest('a')) {
                    alert(`File: ${file.name}`);
                    // In a real app, this could open a preview or a more detailed view
                }
            });
        });
    } else {
        detailFiles.innerHTML = '<div class="no-files">No files attached</div>';
    }

    // Update comments
    commentsContainer.innerHTML = '';
    if (report.comment && report.comment.trim() !== '') {
        commentsContainer.innerHTML = `
            <div class="comment">
                <div class="comment-author">
                    <i class="far fa-user"></i>
                    ${report.reporter}
                </div>
                <div class="comment-date">${formatDate(report.date)}</div>
                <div class="comment-content">${report.comment}</div>
            </div>
        `;
    } else {
        commentsContainer.innerHTML = '<div class="no-comments">No comments yet</div>';
    }

    // Update mark as done checkbox
    markDoneCheckbox.checked = report.status === 'closed';
}

// Event Listeners
modalBackdrop.addEventListener('click', function() {
    closeDetailView();
});

closeDetailBtn.addEventListener('click', function() {
    closeDetailView();
});

cancelReportBtn.addEventListener('click', function() {
    closeDetailView();
});

saveReportBtn.addEventListener('click', function() {
    // In a real app, this would save all changes
    alert('Changes saved successfully!');
    closeDetailView();
});

statusDropdown.addEventListener('change', async function() {
    const reportId = currentReports[0].id; // For demo purposes
    await updateReportStatus(reportId, this.value);
    
    // Update the status indicator
    statusIndicator.className = 'status-indicator ' + this.value;
    
    // Update the mark as done checkbox if status is closed
    markDoneCheckbox.checked = this.value === 'closed';
    
    // Update the report in our data store
    const report = currentReports.find(r => r.id === reportId);
    if (report) {
        report.status = this.value;
    }
});

markDoneCheckbox.addEventListener('change', async function() {
    const reportId = currentReports[0].id; // For demo purposes
    const newStatus = this.checked ? 'closed' : 'open';
    
    await updateReportStatus(reportId, newStatus);
    statusDropdown.value = newStatus;
    statusIndicator.className = 'status-indicator ' + newStatus;
    
    // Update the report in our data store
    const report = currentReports.find(r => r.id === reportId);
    if (report) {
        report.status = newStatus;
    }
});

addCommentButton.addEventListener('click', function() {
    commentInputContainer.style.display = 'block';
    addCommentButton.style.display = 'none';
    newCommentText.focus();
});

cancelCommentBtn.addEventListener('click', function() {
    commentInputContainer.style.display = 'none';
    addCommentButton.style.display = 'block';
    newCommentText.value = '';
});

submitCommentBtn.addEventListener('click', async function() {
    const comment = newCommentText.value.trim();
    if (comment) {
        const reportId = currentReports[0].id; // For demo purposes
        await addComment(reportId, comment);
        
        // Refresh the detail view
        showReportDetail(reportId);
        
        // Reset the comment input
        commentInputContainer.style.display = 'none';
        addCommentButton.style.display = 'block';
        newCommentText.value = '';
    }
});

// Function to close the detail view
function closeDetailView() {
    modalBackdrop.style.display = 'none';
    reportDetail.style.display = 'none';
}

// Sample function to update statistics (would be called after status changes)
function updateStats() {
    // In a real app, this would update dashboard statistics
    console.log('Updating statistics...');
    const openCount = currentReports.filter(r => r.status === 'open').length;
    const pendingCount = currentReports.filter(r => r.status === 'pending').length;
    const closedCount = currentReports.filter(r => r.status === 'closed').length;
    
    console.log(`Open: ${openCount}, Pending: ${pendingCount}, Closed: ${closedCount}`);
}
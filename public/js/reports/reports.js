const API_BASE_URL = '/api/reports';
let currentReports = [];
let currentCompany = '';
let currentFilter = 'all';

// DOM Elements
const currentCompanyEl = document.getElementById('currentCompany');
const reportsTableBody = document.getElementById('reportsTableBody');
const reportDetail = document.getElementById('reportDetail');
const closeDetailBtn = document.getElementById('closeDetail');
const filterTabs = document.querySelectorAll('.filter-tab');
const totalReportsEl = document.getElementById('totalReports');
const openReportsEl = document.getElementById('openReports');
const pendingReportsEl = document.getElementById('pendingReports');
const closedReportsEl = document.getElementById('closedReports');
const detailTitle = document.getElementById('detailTitle');
const detailDate = document.getElementById('detailDate');
const detailAssigned = document.getElementById('detailAssigned');
const detailDescription = document.getElementById('detailDescription');
const detailTags = document.getElementById('detailTags');
const detailFiles = document.getElementById('detailFiles');
const statusDropdown = document.getElementById('statusDropdown');
const commentsContainer = document.getElementById('commentsContainer');
const markDoneCheckbox = document.getElementById('markDone');

// New Elements
const reportsSidebar = document.createElement('div');
reportsSidebar.className = 'reports-sidebar';
reportsSidebar.innerHTML = `
    <h3>File Explorer</h3>
    <div class="reports-filter-group">
        <h4>Filter by Tag</h4>
        <div class="reports-tag-filters"></div>
    </div>
    <div class="reports-filter-group">
        <h4>Filter by Status</h4>
        <select class="reports-status-filter">
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
        </select>
    </div>
    <div class="reports-file-list"></div>
`;

document.body.appendChild(reportsSidebar);

const sidebarToggle = document.createElement('button');
sidebarToggle.className = 'reports-sidebar-toggle';
sidebarToggle.textContent = '☰ File Explorer';
document.querySelector('.dashboard-header').appendChild(sidebarToggle);


// Event Listeners
document.addEventListener('companySelected', function(event) {
    loadCompanyReports(event.detail);
});

filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderReportsTable();
    });
});

sidebarToggle.addEventListener('click', function() {
    reportsSidebar.classList.toggle('reports-sidebar-visible');
});

// Functions
async function loadCompanyReports(companyName) {
    currentCompany = companyName;
    currentCompanyEl.textContent = companyName;
    sidebarToggle.style.display = 'inline-block';
    
    reportsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading">Loading reports for ${companyName}...</td>
        </tr>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(companyName)}`);
        const reportsData = await response.json();
      
        currentReports = reportsData.runs.map(report => ({
            id: report.id,
            title: `Report from ${report.reporter}`,
            status: report.status,
            assignedTo: report.email.includes(state.currentUserEmail) ? "Me" : "Luc",
            date: report.created_at,
            files: report.files.map(fileUrl => {
                const fileExt = fileUrl.split('.').pop().toLowerCase();
                return {
                    name: fileUrl.split('/').pop(),
                    type: fileExt.includes('pdf') ? 'pdf' : 
                         (fileExt.includes('xls') ? 'excel' : 'other'),
                    url: fileUrl
                };
            }),
            description: report.issue.replace(/<\/?[^>]+(>|$)/g, ""),
            reporter: report.reporter,
            email: report.email,
            tags: [report.company, ...(report.flow !== "undefined" ? [report.flow] : [])],
            comment: report.comment
        }));

        updateStats();
        renderReportsTable();
        //updateFileExplorer(filesData);
        populateTagFilters();
        
    } catch (error) {
        console.error("Error loading reports:", error);
        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">Error loading reports: ${error.message}</td>
            </tr>
        `;
    }
}

function updateStats() {
    const total = currentReports.length;
    const open = currentReports.filter(r => r.status === 'open').length;
    const pending = currentReports.filter(r => r.status === 'pending').length;
    const closed = currentReports.filter(r => r.status === 'closed').length;
    
    totalReportsEl.textContent = total;
    openReportsEl.textContent = open;
    pendingReportsEl.textContent = pending;
    closedReportsEl.textContent = closed;
}

function renderReportsTable(reports = currentReports) {
    if (currentFilter !== 'all') {
        reports = reports.filter(report => report.status === currentFilter);
    }

    if (reports.length === 0) {
        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    No ${currentFilter === 'all' ? '' : currentFilter} reports found
                </td>
            </tr>
        `;
        return;
    }

    reportsTableBody.innerHTML = reports.map(report => `
        <tr data-id="${report.id}">
            <td>${report.title}</td>
            <td>
                <span class="status-badge status-${report.status}">
                    ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
            </td>
            <td>${report.assignedTo}</td>
            <td>${formatDate(report.date)}</td>
        </tr>
    `).join('');

    document.querySelectorAll('.reports-table tbody tr').forEach(row => {
        row.addEventListener('click', function() {
            showReportDetail(this.dataset.id);
        });
    });
}

function updateFileExplorer(files) {
    const fileList = reportsSidebar.querySelector('.reports-file-list');
    fileList.innerHTML = files.map(file => {
        const ext = file.url.split('.').pop().toLowerCase();
        const type = ext.includes('pdf') ? 'pdf' : ext.includes('xls') ? 'excel' : 'other';
        return `
            <div class="reports-file-item" data-tags="${file.tags.join(',')}">
                <span class="file-icon">${type === 'pdf' ? '📄' : '📊'}</span>
                <span class="file-name">${file.name}</span>
                <a href="${file.url}" class="download-button">Download</a>
            </div>
        `;
    }).join('');
}

function populateTagFilters() {
    const allTags = [...new Set(currentReports.flatMap(r => r.tags))];
    const tagFilters = reportsSidebar.querySelector('.reports-tag-filters');
    tagFilters.innerHTML = allTags.map(tag => `
        <label>
            <input type="checkbox" value="${tag}">
            ${tag}
        </label>
    `).join('');

    tagFilters.querySelectorAll('input').forEach(checkbox => {
        checkbox.addEventListener('change', filterReportsByTags);
    });
}

function filterReportsByTags() {
    const selectedTags = [...reportsSidebar.querySelectorAll('.reports-tag-filters input:checked')]
        .map(c => c.value);
    
    if (selectedTags.length === 0) {
        renderReportsTable();
        return;
    }

    const filtered = currentReports.filter(report => 
        selectedTags.every(tag => report.tags.includes(tag))
    );
    renderReportsTable(filtered);
}

async function updateReportStatus(reportId, status) {
    try {
        await fetch(`${API_BASE_URL}/${reportId}/status`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status })
        });
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
}

async function updateReportAssignment(reportId, assignee) {
    try {
        await fetch(`${API_BASE_URL}/${reportId}/assign`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ assignee })
        });
    } catch (error) {
        console.error('Error updating assignment:', error);
        throw error;
    }
}

async function addReportTag(reportId, tag) {
    try {
        await fetch(`${API_BASE_URL}/${reportId}/tags`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ tag })
        });
    } catch (error) {
        console.error('Error adding tag:', error);
        throw error;
    }
}

async function removeReportTag(reportId, tag) {
    try {
        await fetch(`${API_BASE_URL}/${reportId}/tags`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ tag })
        });
    } catch (error) {
        console.error('Error removing tag:', error);
        throw error;
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid date' : 
            date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
        console.error("Error formatting date:", error);
        return dateString || 'Unknown date';
    }
}

// Initialize
renderReportsTable();
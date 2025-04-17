/**
 * Sidebar Component JavaScript
 * Handles company loading, searching, pinning, and selection
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchInput = document.getElementById('company-search');
    const pinnedCompaniesList = document.getElementById('pinned-companies');
    const allCompaniesList = document.getElementById('all-companies');
    const emptyPinsMessage = document.getElementById('empty-pins-message');
    
    // State
    let companies = [];
    let selectedCompanyId = null;
    let pinnedCompanies = new Set();
    
    // Initialize
    init();
    
    /**
     * Initialize the sidebar component
     */
    async function init() {
        // Load pinned companies from localStorage
        loadPinnedCompanies();
        
        // Load companies from JSON file
        await loadCompanies();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    /**
     * Load pinned companies from localStorage
     */
    function loadPinnedCompanies() {
        const storedPins = localStorage.getItem('pinnedCompanies');
        if (storedPins) {
            pinnedCompanies = new Set(JSON.parse(storedPins));
        }
    }
    
    /**
     * Save pinned companies to localStorage
     */
    function savePinnedCompanies() {
        localStorage.setItem('pinnedCompanies', JSON.stringify([...pinnedCompanies]));
    }
    
    /**
     * Load companies from JSON file
     * Only loads once and caches in memory
     */
    async function loadCompanies() {
        try {
            // Check if we have cached companies
            if (companies.length === 0) {
                const response = await fetch('/data/companies.json');
                
                if (!response.ok) {
                    throw new Error('Failed to load companies');
                }
                
                companies = await response.json();
                
                // Add unique IDs to companies for easier reference
                companies = companies.map((company, index) => ({
                    ...company,
                    id: `company-${index}`
                }));
            }
            
            // Render companies
            renderCompanies();
        } catch (error) {
            console.error('Error loading companies:', error);
            allCompaniesList.innerHTML = '<li class="empty-message">Failed to load companies</li>';
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', handleSearch);
    }
    
    /**
     * Handle company search
     */
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        renderCompanies(searchTerm);
    }
    
    /**
     * Render companies based on search term and pinned status
     */
    function renderCompanies(searchTerm = '') {
        // Filter companies based on search term
        const filteredCompanies = companies.filter(company => 
            company.name.toLowerCase().includes(searchTerm) ||
            company.type.toLowerCase().includes(searchTerm)
        );
        
        // Render pinned companies
        renderPinnedCompanies(filteredCompanies);
        
        // Render all companies
        renderAllCompanies(filteredCompanies);
    }
    
    /**
     * Render pinned companies
     */
    function renderPinnedCompanies(filteredCompanies) {
        // Get pinned companies that match the filter
        const pinnedCompanyList = filteredCompanies.filter(company => 
            pinnedCompanies.has(company.id)
        );
        
        // Show/hide empty message
        emptyPinsMessage.style.display = pinnedCompanyList.length === 0 ? 'block' : 'none';
        
        // Generate HTML for pinned companies
        if (pinnedCompanyList.length > 0) {
            const pinnedHtml = pinnedCompanyList.map(company => 
                createCompanyItemHTML(company, true)
            ).join('');
            
            pinnedCompaniesList.innerHTML = pinnedHtml;
            attachCompanyEventListeners(pinnedCompaniesList);
        } else if (pinnedCompaniesList.children.length === 1 && pinnedCompaniesList.children[0] === emptyPinsMessage) {
            // Keep the empty message
        } else {
            pinnedCompaniesList.innerHTML = '';
            pinnedCompaniesList.appendChild(emptyPinsMessage);
        }
    }
    
    /**
     * Render all companies
     */
    function renderAllCompanies(filteredCompanies) {
        if (filteredCompanies.length === 0) {
            allCompaniesList.innerHTML = '<li class="empty-message">No companies found</li>';
            return;
        }
        
        // Generate HTML for all companies
        const allCompaniesHtml = filteredCompanies.map(company => 
            createCompanyItemHTML(company, pinnedCompanies.has(company.id))
        ).join('');
        
        allCompaniesList.innerHTML = allCompaniesHtml;
        attachCompanyEventListeners(allCompaniesList);
    }
    
    /**
     * Create HTML for a company item
     */
    function createCompanyItemHTML(company, isPinned) {
        const typeClass = `type-${company.type.toLowerCase()}`;
        const selectedClass = company.id === selectedCompanyId ? 'selected' : '';
        const pinnedClass = isPinned ? 'pinned' : '';
        
        return `
            <li class="company-item ${selectedClass}" data-id="${company.id}">
                <div class="company-info">
                    <span class="company-name">${company.name}</span>
                    <span class="company-type ${typeClass}">${company.type}</span>
                </div>
                <button class="pin-button ${pinnedClass}" data-id="${company.id}" title="${isPinned ? 'Unpin' : 'Pin'} company">
                    ${isPinned ? 
                    '<svg class="pin-icon"  viewBox="0 0 24 24"><use href="#icon-pin-filled"/></svg>' : 
                    '<svg class="pin-icon"  viewBox="0 0 24 24"><use href="#icon-pin-outline"/></svg>'}
                </button>
            </li>
        `;
    }
    
    /**
     * Attach event listeners to company items
     */
    function attachCompanyEventListeners(containerElement) {
        // Company selection
        const companyItems = containerElement.querySelectorAll('.company-item');
        companyItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Ignore clicks on the pin button
                if (e.target.classList.contains('pin-button') || e.target.closest('.pin-button')) {
                    return;
                }
                
                const companyId = item.dataset.id;
                selectCompany(companyId);
            });
        });
        
        // Pin/unpin buttons
        const pinButtons = containerElement.querySelectorAll('.pin-button');
        pinButtons.forEach(button => {
            button.addEventListener('click', () => {
                const companyId = button.dataset.id;
                toggleCompanyPin(companyId);
            });
        });
    }
    
    /**
     * Select a company
     */
    function selectCompany(companyId) {
        // Deselect all previously selected company instances
        const previouslySelectedItems = document.querySelectorAll('.company-item.selected');
        previouslySelectedItems.forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select all instances of the new company
        const companyItems = document.querySelectorAll(`.company-item[data-id="${companyId}"]`);
        companyItems.forEach(item => {
            item.classList.add('selected');
        });
        
        // Update selected company ID
        selectedCompanyId = companyId;
        
        // Find company data
        const company = companies.find(c => c.id === companyId);
        
        // Call the callback function (will be replaced with actual functionality later)
        if (company) {
            document.dispatchEvent(new CustomEvent('companySelected', { detail: company.name }));
        }
    }
    
    /**
     * Toggle company pin status
     */
    function toggleCompanyPin(companyId) {
        if (pinnedCompanies.has(companyId)) {
            // Unpin company
            pinnedCompanies.delete(companyId);
        } else {
            // Pin company
            pinnedCompanies.add(companyId);
        }
        
        // Save pinned companies to localStorage
        savePinnedCompanies();
        
        // Re-render companies
        renderCompanies(searchInput.value.toLowerCase().trim());
    }
});
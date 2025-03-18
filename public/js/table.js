

// Global state
let tableData = [];
let filteredData = [];
let currentPage = 1;
let currentSort = { column: tableConfig.columns[0].key, direction: "desc" };

// DOM elements
const tableBody = document.querySelector("#dataTable tbody");
const pagination = document.getElementById("pagination");
const rowsPerPageSelect = document.getElementById("rowsPerPage");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const showArchived = document.getElementById("showArchived");
const showFiltersBtn = document.getElementById("showFilters");
const filterPanel = document.getElementById("filterPanel");
const applyFiltersBtn = document.getElementById("applyFilters");
const clearFiltersBtn = document.getElementById("clearFilters");
const exportCsvBtn = document.getElementById("exportCsv");
const refreshTableBtn = document.getElementById("refreshTable");

// Initialize table
async function initTable() {
  try {
    const response = await fetch(tableConfig.apiUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    tableData = await response.json();
    filteredData = [...tableData];
    renderTable();
    setupEventListeners();
  } catch (error) {
    console.error("Error loading table data:", error);
  }
}

// Render table with current data and settings
function renderTable() {
  // Clear table body
  tableBody.innerHTML = "";

  // Calculate pagination
  const startIndex = (currentPage - 1) * tableConfig.rowsPerPage;
  const endIndex = startIndex + tableConfig.rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Render table rows
  paginatedData.forEach(item => {
    const row = document.createElement("tr");

    // Format each cell based on column configuration
    row.innerHTML = tableConfig.columns
      .map(column => {
        let cellContent = item[column.key];
        
        // Add custom formatting logic here if needed
        if (column.key === "amount") {
          cellContent = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
          }).format(cellContent);
        } else if (column.key === "Date_of_Acceptance") {
          cellContent = formatDate(cellContent);
        } else if (column.key === "Type_of_Declaration") {
          cellContent = `<span class="status-badge ${item[column.key]}">${item[column.key]}</span>`;
        }

        return `<td>${cellContent}</td>`;
      })
      .join("");

    tableBody.appendChild(row);
  });

  // Update pagination
  renderPagination();
}

// Format date to more readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// Render pagination controls
function renderPagination() {
  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / tableConfig.rowsPerPage);

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "&lt;";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });
  pagination.appendChild(prevButton);

  // Page buttons
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.toggle("active", i === currentPage);
    pageButton.addEventListener("click", () => {
      currentPage = i;
      renderTable();
    });
    pagination.appendChild(pageButton);
  }

  // Next button
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "&gt;";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });
  pagination.appendChild(nextButton);
}

// Sort data by column
function sortData(columnKey) {
  // Toggle sort direction if clicking the same column
  if (currentSort.column === columnKey) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort = { column: columnKey, direction: "asc" };
  }

  // Sort data
  filteredData.sort((a, b) => {
    let valueA = a[columnKey];
    let valueB = b[columnKey];

    // Convert to numbers for numerical columns
    if (columnKey === "id" || columnKey === "amount") {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
    }

    // Date comparison
    if (columnKey === "date") {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }

    // String comparison (case insensitive)
    if (typeof valueA === "string" && typeof valueB === "string") {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    // Sort direction
    const direction = currentSort.direction === "asc" ? 1 : -1;

    if (valueA < valueB) return -1 * direction;
    if (valueA > valueB) return 1 * direction;
    return 0;
  });

  // Update sort indicators in table headers
  const headers = document.querySelectorAll("#dataTable th");
  headers.forEach(header => {
    header.classList.remove("sorted", "asc", "desc");
    if (header.dataset.sort === columnKey) {
      header.classList.add("sorted");
      header.classList.add(currentSort.direction);
    }
  });

  // Reset to first page and re-render
  currentPage = 1;
  renderTable();
}

// Apply all filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;
  const showArchivedValue = showArchived.checked;

  // Additional filter panel values
  const nameFilter = document.getElementById("filterName").value.toLowerCase();
  const statusPanelFilter = document.getElementById("filterStatus").value;
  const dateFilter = document.getElementById("filterDate").value;

  filteredData = tableData.filter(item => {
    // Basic search across all fields
    const matchesSearch =
      searchTerm === "" ||
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm)
      );

    // Status dropdown filter
    const matchesStatus = statusValue === "" || item.status === statusValue;

    // Name filter from advanced panel
    const matchesName =
      nameFilter === "" || item.name.toLowerCase().includes(nameFilter);

    // Status filter from advanced panel
    const matchesStatusPanel =
      statusPanelFilter === "" || item.status === statusPanelFilter;

    // Date filter from advanced panel
    const matchesDate = dateFilter === "" || item.date === dateFilter;

    // Archived filter (for demonstration - assumes items with status 'inactive' are archived)
    const matchesArchived = showArchivedValue || item.status !== "inactive";

    return (
      matchesSearch &&
      matchesStatus &&
      matchesName &&
      matchesStatusPanel &&
      matchesDate &&
      matchesArchived
    );
  });

  // Reset to first page
  currentPage = 1;
  renderTable();
}

// Export table data to CSV
function exportToCsv() {
  // Headers
  const headers = tableConfig.columns.map(column => column.label);

  // Convert data to CSV format
  let csvContent = headers.join(",") + "\n";

  filteredData.forEach(item => {
    const row = tableConfig.columns.map(column => {
      let value = item[column.key];
      // Handle special formatting
      if (column.key === "amount") {
        value = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD"
        }).format(value);
      } else if (column.key === "date") {
        value = formatDate(value);
      }
      // Quote strings to handle commas
      return typeof value === "string" ? `"${value}"` : value;
    });
    csvContent += row.join(",") + "\n";
  });

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "table_data.csv");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Setup event listeners
function setupEventListeners() {
  // Column sorting
  const headers = document.querySelectorAll("#dataTable th");
  headers.forEach(header => {
    if (header.dataset.sort) {
      header.addEventListener("click", () => {
        sortData(header.dataset.sort);
      });
    }
  });

  // Rows per page change
  rowsPerPageSelect.addEventListener("change", () => {
    tableConfig.rowsPerPage = parseInt(rowsPerPageSelect.value);
    currentPage = 1;
    renderTable();
  });

  // Search input
  searchInput.addEventListener("input", () => {
    applyFilters();
    renderTable();
  });

  // Status filter
  statusFilter.addEventListener("change", () => {
    applyFilters();
    renderTable();
  });

  // Show archived checkbox
  showArchived.addEventListener("change", () => {
    applyFilters();
    renderTable();
  });

  // Show/hide filter panel
  showFiltersBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("active");
  });

  // Apply filters button
  applyFiltersBtn.addEventListener("click", () => {
    applyFilters();
    renderTable();
  });

  // Clear filters button
  clearFiltersBtn.addEventListener("click", () => {
    document.getElementById("filterName").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterDate").value = "";
    applyFilters();
    renderTable();
  });

  // Export CSV button
  exportCsvBtn.addEventListener("click", exportToCsv);

  // Refresh table button
  refreshTableBtn.addEventListener("click", () => {
    initTable();
  });
}

// Initialize table on page load
document.addEventListener("DOMContentLoaded", initTable);
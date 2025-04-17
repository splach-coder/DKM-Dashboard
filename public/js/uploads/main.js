// Cache DOM elements
const noCompanyMessage = document.getElementById("no-company-selected");
const loadingContainer = document.getElementById("loading-container");
const resultsContainer = document.getElementById("results-container");
const runsTableBody = document.getElementById("runs-table-body");
const showingCount = document.getElementById("showing-count");
const seeMoreButton = document.getElementById("see-more-button");
const refreshButton = document.getElementById("refresh-button");
const statusFilterr = document.getElementById("status-filter");
const timeFilter = document.getElementById("time-filter");
const customDateContainer = document.getElementById("custom-date-container");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const autoRefreshCheckbox = document.getElementById("auto-refresh");
const reportButton = document.getElementById("open-editor-modal");

// State management
var state = {
  currentCompany: null,
  currentPage: 1,
  pageSize: 40,
  totalShown: 0,
  totalAvailable: 0,
  filters: {
    status: "all",
    timeRange: "24h",
    startDate: null,
    endDate: null,
  },
  allRuns: [], // Store all fetched runs
  filteredRuns: [], // Store filtered runs
  displayedRuns: [], // Store runs currently displayed
  isLoading: false,
  autoRefreshInterval: null,
};

updateReportButtonState();

function updateReportButtonState() {
  if (state.currentCompany) {
    reportButton.disabled = false;
    reportButton.classList.remove("disabled");
  } else {
    reportButton.disabled = true;
    reportButton.classList.add("disabled");
  }
}

// Initialize date inputs with today and yesterday
const today = new Date();
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

startDateInput.valueAsDate = yesterday;
endDateInput.valueAsDate = today;
state.filters.startDate = formatDateForAPI(yesterday);
state.filters.endDate = formatDateForAPI(today);

// Setup event listeners
setupEventListeners();

// Handle company selection from sidebar
function setupEventListeners() {
  // Listen for company selection from sidebar
  document.addEventListener("companySelected", (event) => {
    const companyName = event.detail;
    handleCompanySelected(companyName);
  });

  // Filter changes
  statusFilterr.addEventListener("change", handleFilterChange);
  timeFilter.addEventListener("change", handleTimeRangeChange);
  startDateInput.addEventListener("change", handleDateChange);
  endDateInput.addEventListener("change", handleDateChange);

  // Refresh button
  refreshButton.addEventListener("click", handleRefresh);

  // See more button
  seeMoreButton.addEventListener("click", handleSeeMore);

  // Auto-refresh toggle
  autoRefreshCheckbox.addEventListener("change", handleAutoRefreshToggle);

  // Initial setup of auto-refresh if checked
  if (autoRefreshCheckbox.checked) {
    setupAutoRefresh();
  }
}

function handleCompanySelected(companyName) {
  clearAutoRefresh();
  state.currentCompany = companyName;
  state.currentPage = 1;
  state.totalShown = 0;
  state.allRuns = [];
  state.filteredRuns = [];
  state.displayedRuns = [];

  // Reset UI
  runsTableBody.innerHTML = "";
  showingCount.textContent = "Showing 0 runs";
  seeMoreButton.disabled = true;

  loadAllRunData();

  // Setup auto-refresh if enabled
  if (autoRefreshCheckbox.checked) {
    setupAutoRefresh();
  }

  updateReportButtonState();
}

function handleFilterChange() {
  state.filters.status = statusFilterr.value;
  applyFiltersAndRender();
}

function handleTimeRangeChange() {
  state.filters.timeRange = timeFilter.value;

  // Show/hide custom date inputs
  if (timeFilter.value === "custom") {
    customDateContainer.style.display = "flex";
  } else {
    customDateContainer.style.display = "none";
  }

  applyFiltersAndRender();
}

function handleDateChange() {
  if (startDateInput.value && endDateInput.value) {
    state.filters.startDate = formatDateForAPI(new Date(startDateInput.value));
    state.filters.endDate = formatDateForAPI(new Date(endDateInput.value));
    applyFiltersAndRender();
  }
}

function handleRefresh() {
  // Reset the state and fetch all data again
  state.currentPage = 1;
  state.totalShown = 0;
  state.allRuns = [];
  state.filteredRuns = [];
  state.displayedRuns = [];
  runsTableBody.innerHTML = "";
  loadAllRunData();
}

function handleSeeMore() {
  state.currentPage++;
  displayMoreRuns();
}

function handleAutoRefreshToggle(e) {
  if (e.target.checked) {
    setupAutoRefresh();
  } else {
    clearAutoRefresh();
  }
}

function setupAutoRefresh() {
  clearAutoRefresh(); // Clear any existing interval
  state.autoRefreshInterval = setInterval(() => {
    if (state.currentCompany) {
      handleRefresh();
    }
  }, 10 * 60 * 1000); // 10 minutes
}

function clearAutoRefresh() {
  if (state.autoRefreshInterval) {
    clearInterval(state.autoRefreshInterval);
    state.autoRefreshInterval = null;
  }
}

function applyFiltersAndRender() {
  // Reset pagination
  state.currentPage = 1;
  state.totalShown = 0;

  // Apply filters to allRuns
  filterRuns();

  // Clear the table
  runsTableBody.innerHTML = "";

  // Display the first page of filtered runs
  displayMoreRuns(false);
}

async function loadAllRunData() {
  if (!state.currentCompany || state.isLoading) return;

  state.isLoading = true;
  updateLoadingState(true);

  try {
    const url = buildApiUrl();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched data:", data);

    // Update allRuns with fetched data, ordered by date (newest first)
    state.allRuns = data.runs.sort((a, b) => {
      return new Date(b.logicAppTimestamp) - new Date(a.logicAppTimestamp);
    });

    // Apply filters to get filteredRuns
    filterRuns();

    // Show results container
    noCompanyMessage.style.display = "none";
    resultsContainer.style.display = "flex";

    // Display the first page of filtered runs
    displayMoreRuns(false);
  } catch (error) {
    console.error("Error fetching run data:", error);
    // Show error state or notification here if needed
  } finally {
    state.isLoading = false;
    updateLoadingState(false);
  }
}

function filterRuns() {
  let filtered = [...state.allRuns];

  // Filter by status
  if (state.filters.status !== "all") {
    filtered = filtered.filter((run) => {
      const status = getStatus(run.finalResult);
      return status.toLowerCase() === state.filters.status.toLowerCase();
    });
  }

  // Filter by time range
  const now = new Date();
  let startDate;
  let endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999); // End of today

  switch (state.filters.timeRange) {
    case "24h":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "7d":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "custom":
      if (state.filters.startDate && state.filters.endDate) {
        startDate = new Date(state.filters.startDate);
        endDate = new Date(state.filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the selected day
      }
      break;
    default:
      startDate = new Date(0); // Beginning of time
  }

  if (startDate) {
    filtered = filtered.filter((run) => {
      const runDate = new Date(run.logicAppTimestamp);
      return runDate >= startDate && runDate <= endDate;
    });
  }

  // Update state with filtered runs
  state.filteredRuns = filtered;
  state.totalAvailable = filtered.length;
}

function displayMoreRuns(append = true) {
  const startIndex = append ? state.totalShown : 0;
  const endIndex = Math.min(
    startIndex + state.pageSize,
    state.filteredRuns.length
  );

  // Get runs to display for this page
  const runsToDisplay = state.filteredRuns.slice(startIndex, endIndex);

  // Update displayed runs
  if (append) {
    state.displayedRuns = [...state.displayedRuns, ...runsToDisplay];
  } else {
    state.displayedRuns = runsToDisplay;
  }

  // Update totalShown
  state.totalShown = state.displayedRuns.length;

  // Render runs
  renderRunsTable(runsToDisplay, append);

  // Update UI elements
  updateShowingCount();
  updateSeeMoreButton();
}

function buildApiUrl() {
  const baseUrl = `/api/runs/${encodeURIComponent(state.currentCompany)}`;
  // We'll fetch all data at once, then filter client-side
  return baseUrl;
}

function renderRunsTable(runs, append = false) {
  if (!append) {
    runsTableBody.innerHTML = "";
  }

  const fragment = document.createDocumentFragment();

  runs.forEach((run) => {
    const row = document.createElement("tr");

    // Make row clickable
    row.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("runSelected", { detail: run }));
    });

    row.innerHTML = `
        <td>
          <a href="#" class="run-id" title="${getID(run.logicAppRunId)}">
            ${getID(run.logicAppRunId)}...
            <span class="copy-icon" data-id="${getID(run.logicAppRunId)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
              </svg>
            </span>
          </a>
        </td>
        <td>
          <div class="status-indicator">
            <div class="status-icon status-${getStatus(run.finalResult)}">
              ${getStatusIcon(getStatus(run.finalResult))}
            </div>
            ${getStatus(run.finalResult)}
          </div>
        </td>
        <td>${formatDate(run.logicAppTimestamp)}</td>
        <td>${addRandomDurationAndGetDuration(run.logicAppTimestamp)}</td>
        <td>${run.staticResults || ""}</td>
      `;

    fragment.appendChild(row);
  });

  runsTableBody.appendChild(fragment);

  // Setup copy icon click handlers
  document.querySelectorAll(".copy-icon").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent row click
      const id = e.currentTarget.dataset.id;
      copyToClipboard(id);
    });
  });
}

function getID(id) {
  return id.split("/").pop(); // Extract the last part of the ID
}
function getStatus(status) {
  const succeeded = status.allStepsSucceeded;
  if (succeeded === true) {
    return "succeeded";
  } else {
    return "failed";
  }
}

function formatDate(isoDateString) {
  const date = new Date(isoDateString);

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  return date.toLocaleDateString("en-US", options);
}

function addRandomDurationAndGetDuration(isoDateString) {
  const originalDate = new Date(isoDateString);

  // Generate a random duration between 30 seconds and 80 seconds
  const minSeconds = 30;
  const maxSeconds = 80;
  const randomSeconds =
    Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;

  // Add the random duration to the original date
  const newDate = new Date(originalDate.getTime() + randomSeconds * 1000);

  // Calculate the duration spent
  const durationMillis = newDate - originalDate;
  const durationSeconds = Math.floor(durationMillis / 1000);

  // Format the duration in a friendly format
  if (durationSeconds < 60) {
    return `${durationSeconds} Seconds`;
  } else {
    const minutes = durationSeconds / 60;
    return `${minutes.toFixed(1)} Minutes`;
  }
}

function getStatusIcon(status) {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === "succeeded") {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>';
  } else if (lowerStatus === "failed") {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>';
  }
  return "";
}

function updateShowingCount() {
  showingCount.textContent = `Showing ${state.totalShown} of ${state.totalAvailable} runs`;
}

function updateSeeMoreButton() {
  if (state.totalShown < state.totalAvailable) {
    seeMoreButton.disabled = false;
  } else {
    seeMoreButton.disabled = true;
  }
}

function updateLoadingState(isLoading) {
  if (isLoading) {
    loadingContainer.style.display = "flex";
    resultsContainer.style.display = "none";
    refreshButton.classList.add("loading");
  } else {
    loadingContainer.style.display = "none";
    resultsContainer.style.display = "flex";
    refreshButton.classList.remove("loading");
  }
}

function formatDateForAPI(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Could show a small tooltip here
      console.log("Copied to clipboard");
    })
    .catch((err) => {
      console.error("Could not copy text: ", err);
    });
}

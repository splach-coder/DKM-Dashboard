document.addEventListener("DOMContentLoaded", function () {
  const verifyButton = document.getElementById("verify-button");
  const containerIdInput = document.getElementById("container-id");
  const containerResult = document.getElementById("container-result");

  // Validate container ID format
  function isValidContainerId(id) {
    // Add your container ID validation logic here
    // Example: Basic check for alphanumeric string of correct length
    return /^[A-Z]{4}\d{7}$/.test(id);
  }

  verifyButton.addEventListener("click", async function () {
    const containerId = containerIdInput.value.trim().toUpperCase();

    // Input validation
    if (!containerId) {
      containerResult.innerHTML = `
        <div class="alert alert-error">
            Please enter a container ID
        </div>`;
      return;
    }

    if (!isValidContainerId(containerId)) {
      containerResult.style.display = "block";
      containerResult.innerHTML = `
        <div class="alert alert-error">
            Invalid container ID format. Please check and try again.
        </div>`;
      return;
    }

    try {
      // Show loading state
      containerResult.innerHTML = `<div class="spinner" style="margin: 20px auto;"></div>`;
      containerResult.style.display = "block";

      const response = await fetch(`/api/containers/${containerId}`);
      
      if (response.status === 404) {
        throw new Error("Container not found");
      }
      
      if (!response.ok) {
        throw new Error("Server error");
      }

      const container = await response.json();

      containerResult.innerHTML = container.isValid 
        ? `<div class="alert alert-success">
             ${container.id} is Valid.
           </div>`
        : `<div class="alert alert-error">
             ${container.id} is Invalid.
           </div>`;

    } catch (error) {
      console.error("Error:", error);
      
      const errorMessage = error.message === "Container not found"
        ? "Container not found. Please check the ID and try again."
        : "An error occurred during verification. Please try again later.";

      containerResult.innerHTML = `
        <div class="alert alert-error">
            ${errorMessage}
        </div>`;
    }
  });
});


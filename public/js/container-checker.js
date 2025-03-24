document.addEventListener("DOMContentLoaded", function () {
  const verifyButton = document.getElementById("verify-button");
  const containerIdInput = document.getElementById("container-id");
  const containerResult = document.getElementById("container-result");

  verifyButton.addEventListener("click", async function () {
    const containerId = containerIdInput.value.trim();

    if (!containerId) {
      alert("Please enter a container ID");
      return;
    }

    // Show loading
    containerResult.innerHTML = `<div class="spinner" style="margin: 20px auto;"></div>`;
    containerResult.style.display = "block";

    try {
      const response = await fetch(`/api/containers/${containerId}`);

      if (!response.ok) {
        throw new Error("Container not found");
      }

      const container = await response.json();

      if (container.isValid) {
        // Display container information
        containerResult.innerHTML = `
                    <div class="alert alert-success">
                        ${container.id} is Valid.
                    </div>
                `;
      } else {
        // Display container information
        containerResult.innerHTML = `
                    <div class="alert alert-error">
                        ${container.id} is Invalid.
                    </div>
                `;
      }
    } catch (error) {
      console.error("Error:", error);
      containerResult.innerHTML = `
                    <div class="alert alert-error">
                        Container not found or error in verification process.
                        Please check the ID and try again.
                    </div>
                `;
    }
  });
});

feather.replace();

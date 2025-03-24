document.addEventListener("DOMContentLoaded", () => {
  // Initialize first team as expanded
  const firstTeamHeader = document.querySelector(".ai-team-header");
  if (firstTeamHeader) {
    firstTeamHeader.classList.add("expanded");
  }

  // Add click event listeners to all team headers
  document.querySelectorAll(".ai-team-header").forEach((header) => {
    header.addEventListener("click", function () {
      this.classList.toggle("expanded");
    });
  });

  // Expand team that contains active assistant
  const activeAssistant = document.querySelector(".ai-assistant-item.active");
  if (activeAssistant) {
    const parentTeam = activeAssistant
      .closest(".ai-team-container")
      .querySelector(".ai-team-header");
    if (parentTeam) {
      parentTeam.classList.add("expanded");
    }
  }

  // Track currently active assistant ID
  let currentAssistantId = activeAssistant
    ? activeAssistant.getAttribute("data-assistant-id")
    : null;

  // Variable to track selected assistant item
  let selectedAssistantItem = null;

  // Add click event listeners to assistant items
  document.querySelectorAll(".ai-assistant-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent parent click handlers from firing

      // If the selected assistant is already active, do nothing
      if (this.classList.contains("active")) {
        return;
      }

      // Store which assistant was selected
      selectedAssistantItem = this;

      // Show confirmation popup
      const popup = document.getElementById("confirmationPopup");
      popup.style.display = "flex";
    });
  });

  // Handle confirmation
  document.getElementById("confirmSwitch").addEventListener("click", () => {
    const popup = document.getElementById("confirmationPopup");
    popup.style.display = "none";

    if (selectedAssistantItem) {
      // Set all items as inactive
      document.querySelectorAll(".ai-assistant-item").forEach((item) => {
        item.classList.remove("active");
      });

      // Set this item as active
      selectedAssistantItem.classList.add("active");

      // Get assistant ID
      const assistantId =
        selectedAssistantItem.getAttribute("data-assistant-id");
      currentAssistantId = assistantId;

      // Clear chat messages
      document.querySelectorAll(".message").forEach((el) => el.remove());

      // Re-add the greeting message
      document.querySelector(".greetings-message").style.display = "block";

      // Clear the selected item reference
      selectedAssistantItem = null;
    }
  });

  // Handle cancellation
  document.getElementById("cancelSwitch").addEventListener("click", () => {
    document.getElementById("confirmationPopup").style.display = "none";
    selectedAssistantItem = null;
  });

  // Close popup when clicking outside
  document.querySelector(".popup-container").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById("confirmationPopup").style.display = "none";
      selectedAssistantItem = null;
    }
  });

  /* Handle the send and attached buttons */
  const textInput = document.querySelector(".input-wrapper textarea");
  const sendButton = document.querySelector(".send-button");
  const attachButton = document.querySelector(".attach-button");
  const fileInput = document.getElementById("fileInput");
  const attachedFilesContainer = document.querySelector(
    ".attached-files-container"
  );

  // Enable send button when text is entered & change opacity
  textInput.addEventListener("input", function () {
    sendButton.disabled = textInput.value.trim() === "";
    sendButton.style.opacity = sendButton.disabled ? "0.2" : "1";

    // Check if Enter key was pressed without Shift key (Shift+Enter allows for new lines)
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent default Enter behavior (new line)

      // Only send if the button is enabled (there's text in the input)
      if (!sendButton.disabled) {
        // Trigger the send button click
        sendButton.click();
      }
    }
  });

  // Click attach button to open file input
  attachButton.addEventListener("click", function () {
    fileInput.click();
  });

  // Track attached files

  let attachedFiles = new Set();

  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  }

  // Get appropriate icon for file type
  function getFileIcon(fileName) {
    const extension = fileName.split(".").pop().toLowerCase();
    const imageExts = ["jpg", "jpeg", "png", "gif", "svg", "webp"];
    const docExts = ["doc", "docx", "pdf", "txt", "rtf"];
    const spreadsheetExts = ["xls", "xlsx", "csv"];

    if (imageExts.includes(extension)) return "fa-image blue";
    if (docExts.includes(extension)) return "fa-file-alt red";
    if (spreadsheetExts.includes(extension)) return "fa-file-excel green";
    return "fa-file";
  }

  // Handle file selection and display attached files
  fileInput.addEventListener("change", function () {
    Array.from(fileInput.files).forEach((file) => {
      // Skip if file already attached (by name for simplicity)
      if (Array.from(attachedFiles).some((f) => f.name === file.name)) {
        return;
      }

      attachedFiles.add(file);

      const fileElement = document.createElement("div");
      fileElement.classList.add("attached-file");
      fileElement.innerHTML = `
            <div class="file-info">
                <i class="fas ${getFileIcon(file.name)} file-icon"></i>
                <span>${file.name.slice(0, 3)}...${file.name.slice(-3)}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
            <button class="remove-file">×</button>
        `;
      attachedFilesContainer.appendChild(fileElement);

      // Remove file when clicking ×
      fileElement
        .querySelector(".remove-file")
        .addEventListener("click", function () {
          fileElement.remove();
          attachedFiles.delete(file);

          // Hide container if empty
          if (attachedFiles.size === 0) {
            attachedFilesContainer.style.display = "none";
          }
        });
    });

    // Show container if files exist
    if (attachedFiles.size > 0) {
      attachedFilesContainer.style.display = "flex";
    }

    // Reset input to allow selecting same files again
    fileInput.value = "";
  });

  // handle the copy past feature to attachemnts
  handleClipboardPaste(textInput, attachedFilesContainer);

  // Handle "Enter" key to send
  textInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent new line in textarea
      if (!sendButton.disabled) {
        sendMessage();
      }
    }
  });

  // Initially hide the container
  attachedFilesContainer.style.display = "none";

  // Add to your existing JavaScript - Chat message handling
  const chatMessages = document.querySelector(".chat-messages");
  let waitingForResponse = false;

  // Add click handler to send button
  sendButton.addEventListener("click", sendMessage);

  // Function to handle sending messages
  async function sendMessage() {
    if (waitingForResponse || textInput.value.trim() === "") return;

    const userMessage = textInput.value.trim();

    // Get file information to display in the message
    const attachmentInfo = [];
    if (attachedFiles && attachedFiles.size > 0) {
      attachedFiles.forEach((file) => {
        attachmentInfo.push({
          name: file.name,
          type: file.type,
          size: formatFileSize(file.size),
        });
      });
    }

    // Remove greeting if present
    const greetingMessage = document.querySelector(".greetings-message");
    if (greetingMessage) {
      greetingMessage.style.display = "none";
    }

    // Add user message to chat with attachments
    addMessageToChat("user", userMessage, attachmentInfo);

    // Clear input
    textInput.value = "";
    sendButton.disabled = true;
    sendButton.style.opacity = "0.2";

    // Show AI is thinking
    const thinkingId = addThinkingIndicator();

    // Create FormData to send message and files
    const formData = new FormData();
    formData.append("message", userMessage);
    formData.append("assistantId", currentAssistantId);

    // Add all attached files if they exist
    if (attachedFiles && attachedFiles.size > 0) {
      attachedFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Clear attached files after sending
      attachedFiles.clear();
      attachedFilesContainer.innerHTML = "";
      attachedFilesContainer.style.display = "none";
    }

    // Determine the endpoint based on assistantId
    const endpoint = "/api/chat";

    // Send data to API
    waitingForResponse = true;

    try {
      // Use the determined endpoint
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Remove thinking indicator
      document.getElementById(thinkingId).remove();

      // Display AI response
      addMessageToChat("ai", data.response);
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove thinking indicator
      document.getElementById(thinkingId).remove();

      // Show error message
      addMessageToChat(
        "ai",
        "Sorry, there was an error processing your request."
      );
    } finally {
      waitingForResponse = false;
    }
  }

  // Function to add message to chat
  function addMessageToChat(sender, content, attachments = []) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `${sender}-message`);

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar");
    avatarDiv.innerHTML =
      sender === "user"
        ? '<i class="fas fa-user"></i>'
        : '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");

    // Apply markdown formatting if it's AI message
    if (sender === "ai") {
      contentDiv.innerHTML = markdownToHtml(content);

      // Create action buttons container
      const actionsDiv = document.createElement("div");
      actionsDiv.classList.add("message-actions");

      // Add copy button
      const copyBtn = document.createElement("button");
      copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
      copyBtn.classList.add("action-btn", "copy-btn");
      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(content)
          .then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
          })
          .catch((err) => {
            console.error("Failed to copy text: ", err);
          });
      });

      // Add export as PDF button
      const exportBtn = document.createElement("button");
      exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Export as PDF';
      exportBtn.classList.add("action-btn", "export-btn");
      exportBtn.addEventListener("click", () => {
        exportMessageAsPDF(content);
      });

      // Append buttons to actions container
      actionsDiv.appendChild(copyBtn);
      actionsDiv.appendChild(exportBtn);

      // Append actions to message
      messageDiv.appendChild(actionsDiv);
    } else {
      contentDiv.textContent = content;

      // Add attachments if there are any
      if (attachments && attachments.length > 0) {
        const attachmentsDiv = document.createElement("div");
        attachmentsDiv.classList.add("message-attachments");

        attachments.forEach((file) => {
          const fileElement = document.createElement("div");
          fileElement.classList.add("message-attachment-item");

          // Determine icon based on file type
          let iconClass = getFileIcon(file.name);

          fileElement.innerHTML = `
            <i class="fas ${iconClass} file-icon"></i>
            <span>${
              file.name.slice(0, 3) + "...  " + file.name.slice(-4)
            }</span>
            <span class="file-size">${file.size}</span>
          `;
          attachmentsDiv.appendChild(fileElement);
        });

        contentDiv.appendChild(attachmentsDiv);
      }
    }

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Add thinking indicator
  function addThinkingIndicator() {
    const id = "thinking-" + Date.now();
    const thinkingDiv = document.createElement("div");
    thinkingDiv.classList.add("message", "ai-message");
    thinkingDiv.id = id;

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar");
    avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content", "thinking");
    contentDiv.innerHTML =
      '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

    thinkingDiv.appendChild(avatarDiv);
    thinkingDiv.appendChild(contentDiv);
    chatMessages.appendChild(thinkingDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return id;
  }

  // Simple markdown converter function
  function markdownToHtml(markdown) {
    // This is a very simple implementation
    // Consider using a library like marked.js for production
    let html = markdown;

    // Convert headers
    html = html.replace(/## (.*)/g, "<h2>$1</h2>");
    html = html.replace(/# (.*)/g, "<h1>$1</h1>");

    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Convert lists
    html = html.replace(/- (.*)/g, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");

    // Convert line breaks
    html = html.replace(/\n/g, "<br>");

    return html;
  }

  /**
   * Enhanced PDF export function with professional branding for DKM Customs
   * @param {string} content - The content to be exported to PDF
   */
  function exportMessageAsPDF(content) {
    // Check if jsPDF is available
    const { jsPDF } = window.jspdf || {};

    if (typeof jsPDF === "undefined") {
      console.error(
        "jsPDF library not found. Please include it in your project."
      );
      alert("PDF export feature requires jsPDF library");
      return;
    }

    // Create new document with A4 dimensions (210 × 297 mm)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set document properties
    doc.setProperties({
      title: "DKM Customs Document",
      subject: "AI Generated Content",
      author: "DKM Customs",
      creator: "DKM Customs AI Assistant",
    });

    // Add logo from public directory
    try {
      const logoPath = "/images/logo.png"; // Adjust path as needed
      doc.addImage(logoPath, "PNG", 15, 15, 60, 15); // (path, format, x, y, width, height)
    } catch (error) {
      console.warn("Could not add logo image:", error);
      // Add company name as fallback if logo fails to load
      doc.setFontSize(22);
      doc.setTextColor(229, 76, 55);
      doc.setFont("helvetica", "bold");
      doc.text("DKM CUSTOMS", 15, 25);
    }

    // Add horizontal line below header
    doc.setDrawColor(229, 76, 55);
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);

    // Format content for PDF
    // Strip markdown formatting
    const plainText = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/```([\s\S]*?)```/g, "$1")
      .replace(/#+ (.*?)(\n|$)/g, "$1\n"); // Replace headers

    // Set text formatting for body content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50); // Dark gray for better readability

    // Split text into lines that fit on PDF
    const contentWidth = 170; // Slightly narrower than page for margins
    const lines = doc.splitTextToSize(plainText, contentWidth);

    // Calculate maximum content height to avoid overlapping with footer
    const footerHeight = 20;
    const pageHeight = doc.internal.pageSize.height;
    const maxContentHeight = pageHeight - footerHeight - 45; // Account for header and margins

    // Add content with pagination
    let currentY = 50; // Start below header
    const lineHeight = 7;

    for (let i = 0; i < lines.length; i++) {
      // Check if we need a new page
      if (currentY > maxContentHeight) {
        doc.addPage();
        currentY = 20; // Reset Y position on new page

        // Add smaller header on continuation pages
        try {
          doc.addImage(logoPath, "PNG", 15, 15, 20, 10);
        } catch (error) {
          doc.setFontSize(14);
          doc.setTextColor(229, 76, 55);
          doc.setFont("helvetica", "bold");
          doc.text("DKM CUSTOMS", 15, 20);
        }

        doc.setDrawColor(229, 76, 55);
        doc.line(15, 30, 195, 30);
        currentY = 40;
      }

      doc.text(lines[i], 15, currentY);
      currentY += lineHeight;
    }

    // Add footer to all pages with disclaimer
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Add horizontal line above footer
      doc.setDrawColor(229, 76, 55);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 15, 195, pageHeight - 15);

      // Add disclaimer text
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100); // Light gray
      doc.setFont("helvetica", "italic");
      doc.text(
        "This information was generated by DKM Customs AI assistant and should be reviewed by a qualified professional.",
        15,
        pageHeight - 10
      );

      // Add page number
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${i} of ${pageCount}`, 180, pageHeight - 10, {
        align: "right",
      });
    }

    // Add timestamp
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${dateStr}`, 15, 45);

    // Save the PDF with a professional name
    const fileName = `DKM_Customs_Document_${now.getFullYear()}${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.pdf`;
    doc.save(fileName);
  }

  // Function to handle pasting from clipboard to attachments
  function handleClipboardPaste(textAreaElement, attachedFilesContainer) {
    // Get the text area element to listen for paste events
    const textArea = textAreaElement;

    // Listen for paste events on the text area
    textArea.addEventListener("paste", function (event) {
      // Check if the clipboard has any items
      if (event.clipboardData && event.clipboardData.items) {
        const items = event.clipboardData.items;
        let imageFound = false;

        // Loop through clipboard items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Check if the item is an image
          if (item.type.indexOf("image") !== -1) {
            imageFound = true;

            // Get the image as a file
            const file = item.getAsFile();
            let uniqueBit = Date.now() + Math.random().toString(36).slice(2, 5); // timestamp + random junk
            let newName = `image-${uniqueBit}`;
            file.name = newName + ".png";

            // Skip if file already attached (by name for simplicity)
            if (Array.from(attachedFiles).some((f) => f.name === file.name)) {
              continue;
            }

            // Generate a name for the pasted image if it doesn't have one
            const fileName =
              file.name || `pasted-image-${new Date().getTime()}.png`;

            // Create a file with a proper name if needed
            const namedFile = file.name
              ? file
              : new File([file], fileName, { type: file.type });

            // Add to attachedFiles set
            attachedFiles.add(namedFile);

            // Create file element
            const fileElement = document.createElement("div");
            fileElement.classList.add("attached-file");
            fileElement.innerHTML = `
            <div class="file-info">
                <i class="fas ${getFileIcon(file.name)} file-icon"></i>
                <span>${fileName.slice(0, 3)}...${fileName.slice(-3)}</span>
                <span class="file-size">${formatFileSize(namedFile.size)}</span>
            </div>
            <button class="remove-file">×</button>
          `;
            attachedFilesContainer.appendChild(fileElement);

            // Remove file when clicking ×
            fileElement
              .querySelector(".remove-file")
              .addEventListener("click", function () {
                fileElement.remove();
                attachedFiles.delete(namedFile);

                // Hide container if empty
                if (attachedFiles.size === 0) {
                  attachedFilesContainer.style.display = "none";
                }
              });

            // Show the attached files container
            if (attachedFiles.size > 0) {
              attachedFilesContainer.style.display = "flex";
            }

            // Prevent the default paste behavior for images
            event.preventDefault();
            break;
          }
        }

        // If we found and processed an image, don't do the default paste
        if (imageFound) {
          event.preventDefault();
        }
      }
    });
  }

  // Setup drag and drop for file attachments
  setupDragAndDrop();

  // enhance file handling capabilities
  enhanceFileHandling();

  // Improved file handling with upload status indicators
  function enhanceFileHandling() {
    const attachedFilesContainer = document.querySelector(
      ".attached-files-container"
    );
    const fileInput = document.getElementById("fileInput");
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
      "application/msword", // doc
    ];

    // Create a toast notification system
    const toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);

    function showToast(message, type = "info") {
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas fa-${
          type === "error"
            ? "exclamation-circle"
            : type === "success"
            ? "check-circle"
            : "info-circle"
        }"></i>
      </div>
      <div class="toast-message">${message}</div>
    `;

      toastContainer.appendChild(toast);

      // Animate in
      setTimeout(() => {
        toast.classList.add("show");
      }, 10);

      // Remove after delay
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 5000);
    }

    // Function to validate a file before processing
    function validateFile(file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        showToast(`File "${file.name}" exceeds maximum size of 25MB`, "error");
        return false;
      }

      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast(`File type "${file.type}" is not supported`, "error");
        return false;
      }

      return true;
    }

    // Enhanced processing of files
    function processFiles(files) {
      let validFilesCount = 0;

      Array.from(files).forEach((file) => {
        if (validateFile(file)) {
          // If file is valid and not already attached
          if (!Array.from(attachedFiles).some((f) => f.name === file.name)) {
            attachedFiles.add(file);

            // Create file element with upload progress
            const fileElement = document.createElement("div");
            fileElement.classList.add("attached-file");
            fileElement.dataset.fileName = file.name;
            fileElement.innerHTML = `
            <div class="file-info">
              <i class="fas ${getFileIcon(file.name)} file-icon"></i>
              <div class="file-details">
                <span class="file-name">${
                  file.name.length > 20
                    ? file.name.slice(0, 10) + "..." + file.name.slice(-10)
                    : file.name
                }</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
              </div>
            </div>
            <div class="file-progress">
              <div class="progress-bar"></div>
            </div>
            <button class="remove-file" title="Remove file">×</button>
          `;

            attachedFilesContainer.appendChild(fileElement);

            // Simulate progress for demonstration (would be real upload progress in production)
            simulateFileProgress(fileElement, 500);

            // Remove file when clicking ×
            fileElement
              .querySelector(".remove-file")
              .addEventListener("click", function () {
                attachedFiles.delete(file);
                fileElement.classList.add("removing");

                setTimeout(() => {
                  fileElement.remove();

                  // Hide container if empty
                  if (attachedFiles.size === 0) {
                    attachedFilesContainer.style.display = "none";
                  }
                }, 300);
              });

            validFilesCount++;
          } else {
            showToast(`File "${file.name}" is already attached`, "info");
          }
        }
      });

      // Show container if valid files were added
      if (validFilesCount > 0) {
        attachedFilesContainer.style.display = "flex";
        showToast(
          `${validFilesCount} file${
            validFilesCount !== 1 ? "s" : ""
          } added successfully`,
          "success"
        );
      }
    }

    // Simulate file upload progress
    function simulateFileProgress(fileElement, duration) {
      const progressBar = fileElement.querySelector(".progress-bar");
      let progress = 0;
      const interval = 30;
      const increment = (interval / duration) * 100;

      progressBar.style.width = "0%";

      const timer = setInterval(() => {
        progress += increment;

        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);

          setTimeout(() => {
            fileElement.querySelector(".file-progress").style.display = "none";
          }, 300);
        }

        progressBar.style.width = `${progress}%`;
      }, interval);
    }

    // Override the file input change handler
    fileInput.addEventListener("change", function (e) {
      if (this.files.length > 0) {
        processFiles(this.files);
        this.value = ""; // Reset input to allow selecting same files again
      }
    });

    // Override the handleDroppedFiles function
    window.handleDroppedFiles = function (files) {
      processFiles(files);
    };
  }

  function setupDragAndDrop() {
    const chatMainContent = document.querySelector(".chat-main-content");

    if (!chatMainContent) {
      console.error("Chat main content element not found");
      return;
    }

    // Create overlay element for drag visual feedback
    const dropOverlay = document.createElement("div");
    dropOverlay.className = "drop-overlay";
    dropOverlay.innerHTML = `
    <div class="drop-container">
      <div class="drop-icon">
        <i class="fas fa-cloud-upload-alt"></i>
      </div>
      <div class="drop-message">
        <h3>Drop files to upload</h3>
        <p>Upload documents, images, or other files</p>
      </div>
    </div>
  `;
    document.body.appendChild(dropOverlay);

    // Track drag counter to handle nested elements
    let dragCounter = 0;

    // Handle drag enter
    chatMainContent.addEventListener("dragenter", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;

      if (dragCounter === 1) {
        dropOverlay.classList.add("active");
      }
    });

    // Handle drag over
    chatMainContent.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    });

    // Handle drag leave
    chatMainContent.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;

      if (dragCounter === 0) {
        dropOverlay.classList.remove("active");
      }
    });

    // Handle drop
    chatMainContent.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      dropOverlay.classList.remove("active");

      const files = e.dataTransfer.files;

      if (files.length > 0) {
        // Process the dropped files
        handleDroppedFiles(files);
      }
    });

    // Reset counter when mouse leaves window
    window.addEventListener("mouseout", function (e) {
      if (e.relatedTarget === null) {
        dragCounter = 0;
        dropOverlay.classList.remove("active");
      }
    });

    // Prevent default browser behavior for drag and drop
    document.addEventListener("dragover", function (e) {
      e.preventDefault();
    });

    document.addEventListener("drop", function (e) {
      e.preventDefault();
    });
  }

  // Function to handle the dropped files
  function handleDroppedFiles(files) {
    const fileInput = document.getElementById("fileInput");
    const attachedFilesContainer = document.querySelector(
      ".attached-files-container"
    );

    // Create a DataTransfer object
    const dataTransfer = new DataTransfer();

    // Add each file to it
    Array.from(files).forEach((file) => {
      dataTransfer.items.add(file);
    });

    // Assign the DataTransfer files to the file input
    fileInput.files = dataTransfer.files;

    // Trigger the change event to process the files
    const event = new Event("change", { bubbles: true });
    fileInput.dispatchEvent(event);
  }
});

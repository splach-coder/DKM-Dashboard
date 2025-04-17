document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("editorModal");
    const closeBtn = document.querySelector(".close");
    const cancelBtn = document.querySelector(".cancel-btn");
    const fileInput = document.getElementById("fileInput");
    const dropzone = document.getElementById("dropzone");
    const fileList = document.getElementById("fileList");
    const form = document.getElementById("reportForm");
    const openModalButton = document.getElementById("open-editor-modal");
    const reporter = document.getElementById("reporter");
    const email = document.getElementById("email");
  
    let filesToSend = [];
  
    // Initialize Quill
    const quill = new Quill('#editor-container', {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['link', 'code-block'],
          [{ 'header': [1, 2, 3, false] }]
        ]
      },
      placeholder: 'Describe the issue...'
    });
  
    // Drag & drop functionality
    dropzone.addEventListener("click", () => fileInput.click());
    
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.style.background = "#e6f2fb";
      dropzone.style.borderColor = "#106ebe";
    });
    
    dropzone.addEventListener("dragleave", () => {
      dropzone.style.background = "rgba(0, 120, 212, 0.05)";
      dropzone.style.borderColor = "#0078d4";
    });
    
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.style.background = "rgba(0, 120, 212, 0.05)";
      dropzone.style.borderColor = "#0078d4";
      handleFiles([...e.dataTransfer.files]);
    });
    
    fileInput.addEventListener("change", (e) => {
      handleFiles([...e.target.files]);
    });
  
    // Handle file uploads
    function handleFiles(files) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      
      files.forEach(file => {
        // Check file type
        const fileType = file.type;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileType) && 
            !['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
          alert(`${file.name} is not an allowed file type. Please upload PDFs, Word documents, Excel files, or images.`);
          return;
        }
        
        // Check file size (10MB limit)
        if (file.size <= 10 * 1024 * 1024) {
          filesToSend.push(file);
          refreshFileList();
        } else {
          alert(`${file.name} is too large. Maximum file size is 10MB.`);
        }
      });
    }
    
    // Remove file from list
    function removeFile(index) {
      filesToSend.splice(index, 1);
      refreshFileList();
    }
    
    // Refresh file list display
    function refreshFileList() {
      fileList.innerHTML = '';
      filesToSend.forEach((file, index) => {
        // Create file icon based on file type
        const fileType = file.type;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        let fileIcon = '';
        
        if (fileType.includes('image')) {
          fileIcon = '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>';
        } else if (fileType.includes('pdf') || fileExtension === 'pdf') {
          fileIcon = '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path></svg>';
        } else if (fileExtension === 'docx') {
          fileIcon = '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>';
        } else if (fileExtension === 'xlsx') {
          fileIcon = '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clip-rule="evenodd"></path></svg>';
        } else {
          fileIcon = '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path></svg>';
        }
        
        const li = document.createElement("li");
        li.className = "file-item";
        li.innerHTML = `
          <div class="file-info">
            ${fileIcon}
            <span class="file-name">${file.name}</span>
            <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <button type="button" class="file-remove" data-index="${index}">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        `;
        fileList.appendChild(li);
        
        // Add remove button event listener
        li.querySelector('.file-remove').addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          removeFile(index);
        });
      });
    }

    cancelBtn.addEventListener('click', () => {
      // Reset form
      quill.root.innerHTML = '';
      filesToSend = [];
      fileList.innerHTML = '';
    });
  
    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const formData = new FormData(form);
      formData.set("issue", quill.root.innerHTML);
      formData.set("reporter", reporter.value);
      formData.set("email", email.value);
      formData.set("company", state.currentCompany);
      formData.set("flow", state.LogicAppName);
  
      filesToSend.forEach(file => {
        formData.append("files", file);
      });    
  
      try {
        const res = await fetch("/api/report", {
          method: "POST",
          body: formData
        });
  
        const data = await res.json();

        if (data) {
          modal.style.display = "none";
          
          // Reset form
          quill.root.innerHTML = '';
          filesToSend = [];
          fileList.innerHTML = '';
        } else {
          console.log("❌ Error sending report: " + (data.message || "Unknown error"));
        }
      } catch (error) {
        console.log("❌ Error sending report: " + error.message);
      }
    });
  
    // Modal controls
    closeBtn.addEventListener('click', () => {
      modal.style.display = "none";
    });
    
    cancelBtn.addEventListener('click', () => {
      modal.style.display = "none";
    });
    
    openModalButton.addEventListener('click', () => {
      modal.style.display = "flex";
    });
  
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });
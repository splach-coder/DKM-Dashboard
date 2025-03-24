document.addEventListener("DOMContentLoaded", () => {
    function updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        let greeting;
    
        if (hour >= 5 && hour < 12) {
            greeting = "Good Morning ☀️";
        } else if (hour >= 12 && hour < 18) {
            greeting = "Good Afternoon 🌤️";
        } else if (hour >= 18 && hour < 22) {
            greeting = "Good Evening 🌙";
        } else {
            greeting = "Good Night 🌌";
        }
    
        document.getElementById("greeting-msg").textContent = greeting;
    }
    
    // Run on page load
    updateGreeting();
    
    // Check and update every hour
    setInterval(updateGreeting, 60 * 60 * 1000);



    /* enhance the user prompt  */
    // Get the input actions container to add our new button
  const inputActions = document.querySelector('.input-actions .send-actions');
  
  // Create enhance button with SVG
  const enhanceButton = document.createElement('button');
  enhanceButton.className = 'action-button enhance-button hidden';
  enhanceButton.id = 'enhanceButton';
  enhanceButton.innerHTML = `
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#e54c37" class="bi bi-stars"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z"></path> </g></svg>
  `;
  enhanceButton.title = "Enhance prompt with AI";
  
  // Insert enhance button before the send button
  inputActions.insertBefore(enhanceButton, document.querySelector('.attach-button'));
  
  // Create overlay and spinner for loading state
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'textarea-overlay';
  overlayDiv.innerHTML = `
    <div class="spinner">
      <div class="bounce1"></div>
      <div class="bounce2"></div>
      <div class="bounce3"></div>
    </div>
    <p>Enhancing your prompt...</p>
  `;
  
  // Add the overlay to the input wrapper
  const inputWrapper = document.querySelector('.input-wrapper');
  inputWrapper.appendChild(overlayDiv);
  
  // Add event listener to the enhance button
  enhanceButton.addEventListener('click', enhancePrompt);
  
  // Get the textarea element
  const textarea = document.querySelector('.input-wrapper textarea');
  
  // Add input event listener to show/hide enhance button based on content
  textarea.addEventListener('input', function() {
    if (this.value.trim()) {
      enhanceButton.classList.remove('hidden');
    } else {
      enhanceButton.classList.add('hidden');
    }
  });
});  

// Function to handle the enhance button click
async function enhancePrompt() {
    const textarea = document.querySelector('.input-wrapper textarea');
    const overlay = document.querySelector('.textarea-overlay');
    const text = textarea.value.trim();
    const formData = new FormData();
    formData.append('message', text);
    
    // Don't do anything if textarea is empty
    if (!text) return;
    
    // Show overlay and spinner
    overlay.classList.add('active');
    
    try {
      // Send the request to the enhance API
      const response = await fetch('/api/enhance', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }
      
      const data = await response.json();
      
      // Replace the textarea content with the enhanced prompt
      textarea.value = data.response;
      
      // Focus the textarea and trigger input event to enable send button if needed
      textarea.focus();
      textarea.dispatchEvent(new Event('input'));
      
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    } finally {
      // Hide overlay
      overlay.classList.remove('active');
    }
  }
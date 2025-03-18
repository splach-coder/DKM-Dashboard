document.addEventListener("DOMContentLoaded", () => {
  const assistantItems = document.querySelectorAll(".ai-assistant-item");
  const emptyState = document.getElementById("empty-state");
  const chatContainer = document.getElementById("chat-container");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const chatSubmit = document.getElementById("chat-submit");
  const initialInput = document.getElementById("initial-input");
  const sendInitialButton = document.getElementById("send-initial-button");

  let currentAssistantId = document
    .querySelector(".ai-assistant-item.active")
    .getAttribute("data-assistant-id");

  updateGreeting();

  // Update every hour (3600000 milliseconds)
  setInterval(updateGreeting, 3600000);

  // Enable submit button when input has text
  userInput.addEventListener("input", () => {
    chatSubmit.disabled = !userInput.value.trim();

    // Auto-resize the textarea
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + "px";
  });

  initialInput.addEventListener("input", () => {
    sendInitialButton.style.opacity = initialInput.value.trim() ? "1" : "0.1";
  });

  // Handle assistant selection
  let selectedAssistantItem = null; // To track which assistant was selected

  assistantItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent any parent click handlers from firing

      // Store which assistant was selected
      selectedAssistantItem = item;

      if (item.classList.contains("active")) {
        // If the selected assistant is already active, do nothing
        return;
      }

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
      assistantItems.forEach((ai) => ai.classList.remove("active"));

      // Set this item as active
      selectedAssistantItem.classList.add("active");

      // Get assistant ID
      const assistantId =
        selectedAssistantItem.getAttribute("data-assistant-id");
      currentAssistantId = assistantId;

      // Clear chat messages and reset to empty state
      chatMessages.innerHTML = "";
      emptyState.style.display = "flex";
      chatContainer.style.display = "none";

      // Reset inputs
      userInput.value = "";
      initialInput.value = "";
      chatSubmit.disabled = true;

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

  // Handle initial message from empty state
  sendInitialButton.addEventListener("click", () => {
    const message = initialInput.value.trim();
    if (!message || !currentAssistantId) return;

    // Switch from empty state to chat interface
    emptyState.style.display = "none";
    chatContainer.style.display = "flex";

    // Add user message and process it
    addUserMessage(message);
    processUserMessage(message);

    // Clear inputs
    initialInput.value = "";
  });

  // Handle form submission from chat interface
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Add user message and process it
    addUserMessage(message);
    processUserMessage(message);

    // Clear input and reset height
    userInput.value = "";
    userInput.style.height = "52px";
    chatSubmit.disabled = true;
  });

  // Initial input enter key handling
  initialInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendInitialButton.click();
    }
  });

  // Add this code here
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!chatSubmit.disabled) {
        chatSubmit.click();
      }
    }
  });

  // Process user message
  async function processUserMessage(message) {
    // Show typing indicator
    showTypingIndicator();

    try {
      // Send message to server
      // Include the assistant ID to route to the correct AI model
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          assistantId: currentAssistantId,
        }),
      });

      const data = await response.json();

      // Remove typing indicator
      removeTypingIndicator();

      if (data.error) {
        // Handle error
        addAIMessage("Sorry, I encountered an error. Please try again later.");
        console.error(data.error);
      } else {
        // Add AI response with typing effect
        // Wait a small delay to simulate thinking
        setTimeout(() => {
          addAIMessage(data.response);
        }, 500);
      }
    } catch (error) {
      // Remove typing indicator
      removeTypingIndicator();

      // Handle network error
      addAIMessage(
        "Sorry, there was a network error. Please check your connection and try again."
      );
      console.error("Network error:", error);
    }

    // Scroll to bottom
    scrollToBottom();
  }

  // Function to add user message to chat
  function addUserMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.className = "user-message";
    messageElement.innerHTML = `
            <div class="user-bubble">${message}</div>
        `;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }

  // Function to add AI message to chat with typing effect
  function addAIMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.className = "message-container";
    messageElement.innerHTML = `
            <div class="ai-message">
                <div class="ai-bubble">
                    <div class="ai-avatar">
                        <div class="green-orb"></div>
                    </div>
                    <div class="ai-content">
                        <div class="ai-text"><span class="cursor"></span></div>
                    </div>
                </div>
            </div>
        `;
    chatMessages.appendChild(messageElement);

    // Get the text element where we'll show the typing effect
    const textElement = messageElement.querySelector(".ai-text");
    const cursor = textElement.querySelector(".cursor");

    // Make cursor visible
    cursor.classList.add("typing-cursor");

    // Break message into sentences for more natural typing
    const sentences = message.match(/[^.!?]+[.!?]+|\s*$/g) || [message];
    let currentSentenceIndex = 0;
    let i = 0;

    function getRandomTypingSpeed() {
      // Randomize typing speed slightly to make it look more natural
      return Math.floor(Math.random() * 20) + 20; // 20-40ms per character
    }

    // Update this part of your addAIMessage function
    function typeNextChar() {
      if (currentSentenceIndex < sentences.length) {
        const currentSentence = sentences[currentSentenceIndex];

        if (i < currentSentence.length) {
          // Type the next character
          const char = currentSentence.charAt(i);
          const span = document.createElement("span");
          span.textContent = char;
          textElement.insertBefore(span, cursor);
          i++;

          // Scroll as typing happens
          scrollToBottom();

          // Continue typing with a slightly random delay
          setTimeout(typeNextChar, getRandomTypingSpeed());
        } else {
          // Move to next sentence with a slightly longer pause
          i = 0;
          currentSentenceIndex++;
          setTimeout(typeNextChar, 400); // Pause between sentences
        }
      } else {
        // Remove cursor when done typing
        cursor.remove();

        // Apply markdown formatting after typing is complete
        const rawText = textElement.textContent;
        textElement.innerHTML = convertMarkdownToHTML(rawText);
      }
    }

    // Start typing with a small initial delay
    setTimeout(typeNextChar, 200);
  }

  // Function to show typing indicator
  function showTypingIndicator() {
    const typingElement = document.createElement("div");
    typingElement.className = "message-container typing-container";
    typingElement.innerHTML = `
            <div class="ai-message">
                <div class="ai-bubble">
                    <div class="ai-avatar">
                        <div class="green-orb"></div>
                    </div>
                    <div class="ai-content">
                        <div class="ai-text">
                            Thinking
                            <span class="typing-indicator">
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    chatMessages.appendChild(typingElement);
    scrollToBottom();
  }

  // Function to remove typing indicator
  function removeTypingIndicator() {
    const typingContainer = document.querySelector(".typing-container");
    if (typingContainer) {
      typingContainer.remove();
    }
  }

  // Function to scroll to bottom of chat
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getTimeBasedGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return `Good morning,`;
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon`;
    } else if (hour >= 17 && hour < 21) {
      return `Good evening`;
    } else {
      return `Good night`;
    }
  }

  function updateGreeting() {
    const greetingElement = document.getElementById("greeting-message");
    greetingElement.textContent = getTimeBasedGreeting();
  }

  // Add this function to your code
  function convertMarkdownToHTML(text) {
    // Handle bold text (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle italic text (*text*)
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Handle headers (# Header)
    text = text.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    text = text.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.*$)/gm, "<h1>$1</h1>");

    // Handle lists (- item)
    text = text.replace(/^\- (.*$)/gm, "<li>$1</li>");
    text = text.replace(/(<li>.*<\/li>)/gms, "<ul>$1</ul>");

    // Handle line breaks
    text = text.replace(/\n/g, "<br>");

    return text;
  }
});

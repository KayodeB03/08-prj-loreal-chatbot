// Get DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Add a dedicated element above the chat window for the latest question
let latestQuestionDiv = document.createElement("div");
latestQuestionDiv.id = "latestQuestion";
latestQuestionDiv.style =
  "font-weight: bold; margin-bottom: 10px; min-height: 24px;";
chatWindow.parentNode.insertBefore(latestQuestionDiv, chatWindow);

// Set initial greeting message
chatWindow.innerHTML = `<div class="msg ai">👋 Hello! How can I help you today?</div>`;

const workerUrl = "https://astrobot-worker.kbankole.workers.dev/";
// Function to add a message to the chat window
function addMessage(text, sender) {
  // sender: 'user' or 'ai'
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

// Track the conversation context for multi-turn interactions
const systemPrompt = {
  role: "system",
  content:
    "You are a helpful and knowledgeable chatbot named Lora for L’Oréal. Only answer questions about L’Oréal products, skincare, haircare, beauty routines, or beauty-related topics. If a user asks about anything unrelated to L’Oréal or beauty, politely refuse and say: 'Sorry, I can only answer questions about L’Oréal products, routines, or beauty-related topics. Please ask me something about L’Oréal.' Remember details the user shares, like their name or preferences, and use them in future responses to make the conversation feel natural and personal.",
};
let messages = [systemPrompt];

// Function to call the Cloudflare Worker API with conversation context
async function getAIResponse(userMessage) {
  // Add the user's message to the conversation history
  messages.push({ role: "user", content: userMessage });

  // Show a loading message
  addMessage("Thinking...", "ai");

  // Prepare the request for the Cloudflare Worker endpoint
  const endpoint = workerUrl;
  const headers = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({ messages });

  try {
    // Make the API request using fetch and async/await
    const response = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: body,
    });

    // Remove the loading message
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }

    if (!response.ok) {
      addMessage("Sorry, there was a problem connecting to the AI.", "ai");
      return;
    }

    const data = await response.json();
    // Get the AI's reply from the response
    const aiReply =
      data.choices && data.choices[0] && data.choices[0].message.content
        ? data.choices[0].message.content.trim()
        : "Sorry, I didn't understand that.";
    addMessage(aiReply, "ai");
  } catch (error) {
    // Show error message
    addMessage("Error: " + error.message, "ai");
  }
}

// Handle form submit
chatForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  // Show user's message in the chat
  addMessage(message, "user");
  userInput.value = "";

  // Display the latest question above the chat window
  latestQuestionDiv.textContent = `You asked: "${message}"`;

  // Get AI response with conversation context
  getAIResponse(message);
});

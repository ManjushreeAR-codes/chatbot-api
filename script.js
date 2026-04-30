const API_KEY = "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";

let messages = {
    history: [],
};

const chatContainer = document.querySelector(".chat");
const inputField = document.querySelector(".chat-window input");
const sendButton = document.querySelector(".chat-window .input-area button");
const chatWindow = document.querySelector(".chat-window");
const chatButton = document.querySelector(".chat-button");
const closeButton = document.querySelector(".chat-window .close");
const overlay = document.querySelector(".overlay");

// Enter key support
inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// Send message function
async function sendMessage() {
    const userMessage = inputField.value.trim();
    if (!userMessage) return;

    // Clear input
    inputField.value = "";

    // Add user message
    addMessage(userMessage, "user");

    // Simple date check
    if (userMessage.toLowerCase().includes("date") || userMessage.toLowerCase().includes("today")) {
        const today = new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        addMessage(`Today's date is ${today}`, "model");
        return;
    }

    // Show loader
    const loader = document.createElement("div");
    loader.className = "loader";
    chatContainer.appendChild(loader);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href,
                "X-Title": document.title,
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-super-120b-a12b:free",
                messages: [
                    ...messages.history.map(m => ({
                        role: m.role === "model" ? "assistant" : "user",
                        content: m.text
                    })),
                    { role: "user", content: userMessage }
                ],
                stream: false
            })
        });

        // Remove loader
        if (loader.parentNode) loader.parentNode.removeChild(loader);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "API request failed");
        }

        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";

        // Add bot response
        addMessage(reply, "model");

        // Update history
        messages.history.push({ role: "user", text: userMessage });
        messages.history.push({ role: "model", text: reply });

    } catch (error) {
        console.error("Error:", error);
        if (loader.parentNode) loader.parentNode.removeChild(loader);
        addMessage("Sorry, something went wrong. Please try again.", "error");
    }
}

// Add message to chat
function addMessage(text, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = type;
    
    if (type === "model") {
        messageDiv.innerHTML = `<div class="chat-text">${marked.parse(text)}</div>`;
    } else {
        const p = document.createElement("p");
        p.textContent = text;
        messageDiv.appendChild(p);
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Event listeners
sendButton.addEventListener("click", sendMessage);
chatButton.addEventListener("click", () => {
    document.body.classList.add("chat-open");
});
closeButton.addEventListener("click", () => {
    document.body.classList.remove("chat-open");
});
overlay.addEventListener("click", () => {
    document.body.classList.remove("chat-open");
});

// Auto-focus input when chat opens
document.body.addEventListener("chat-open", () => {
    inputField.focus();
});
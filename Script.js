let socket;

const MessageType = {
  NORMAL: 'normal',
  ERROR: 'error',
};

try {
  // Attempt to create a WebSocket connection
  socket = new WebSocket('ws://localhost:8765');
  
  // Event listener for WebSocket connection opened successfully
  socket.onopen = function(event) {
    console.log('WebSocket connection established.');
  };

  // Event listener for WebSocket messages
  socket.onmessage = function(event) {
    console.log('Message received:', event.data);
    createMessageDiv(event.data, );
  };

  // Event listener for WebSocket connection closed
  socket.onclose = function(event) {
      createMessageDiv("Server closed", MessageType.ERROR);
  };

  // Event listener for WebSocket connection errors
  socket.onerror = function(exception) {
    console.error('WebSocket error:', exception);
    // Handle the error here, such as displaying a message to the user
    createMessageDiv("Something went wrong, are you sure the server is up?", MessageType.ERROR);
  };
} catch (exception) {
  console.error("Something went wrong! Error: ", exception);
  createMessageDiv("Something went wrong, are you sure the server is up?", MessageType.ERROR);
}

function createMessageDiv(message, status) {
  // Create new div element for message
  var messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  if (status == MessageType.ERROR) {
    messageDiv.style.color = "rgb(255,0,0)";
  }

  var messagesContainer = document.getElementById("displaymessages");

  messagesContainer.appendChild(messageDiv);
}

function Submit() {
  var message = document.getElementById('fname').value;
  if (message != "") {
    console.log("Message:", message);
    socket.send(message);
    //Clear input after send
    document.getElementById('fname').value = "";
  }
} 

document.getElementById('fname').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent the default action (form submission)
    Submit();
  }
});

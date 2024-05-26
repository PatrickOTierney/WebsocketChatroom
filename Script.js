let socket;
let json;
const MessageType = {
  NORMAL: 'normal',
  ERROR: 'error',
};

let ErrorMessageJson = {"author": "Server", "message": "Something went wrong, are you sure the server is up?", "timestamp": new Date().toLocaleString()}

try {
  // Attempt to create a WebSocket connection
  socket = new WebSocket('ws://localhost:8765');
  
  // Event listener for WebSocket connection opened successfully
  socket.onopen = function(event) {
    console.log('WebSocket connection established.');
  };

  // Event listener for WebSocket messages
  socket.onmessage = function(event) {
    json = JSON.parse(event.data);
    console.log('Message received:', json);
    createMessageDiv(json, MessageType.NORMAL);
  };

  // Event listener for WebSocket connection closed
  socket.onclose = function(event) {
      createMessageDiv(ErrorMessageJson, MessageType.ERROR);
  };

  // Event listener for WebSocket connection errors
  socket.onerror = function(exception) {
    console.error('WebSocket error:', exception);
    // Handle the error here, such as displaying a message to the user
    createMessageDiv(ErrorMessageJson, MessageType.ERROR);
  };
} catch (exception) {
  console.error("Something went wrong! Error: ", exception);
  createMessageDiv(ErrorMessageJson, MessageType.ERROR);
}

function createMessageDiv(message, status) {
  var messageDiv = document.createElement("div");
  if (status == MessageType.ERROR) {
    messageDiv.style.color = "rgb(174,0,0)";
  }

  messageDiv.textContent = `${message.author} (${message.timestamp}): ${message.message}`;
  messageDiv.style.backgroundColor = "rgb(237, 238, 201)";
  messageDiv.style.borderColor = "rgb(221,231,199)";
  messageDiv.style.borderWidth = "1px";
  messageDiv.style.borderRadius = "5px";
  messageDiv.style.borderStyle = "solid";
  messageDiv.style.paddingLeft = "5px";
  messageDiv.style.paddingRight = "5px"; 
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

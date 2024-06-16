let PublicKeyReceived = false;
var b64ServerPublicKey;
window.PublicKeyBuffer = null;

const MessageType = {
    NORMAL: 'normal',
    ERROR: 'error',
  };
let ErrorMessageJson; //{"author": "Client", "message": "Something went wrong, are you sure the server is up?", "timestamp": new Date().toLocaleString()}
// -----------------Encryption Jargon ----------------
async function importPublicKey(base64PublicKey) {
  // Decode base64 public key to ArrayBuffer
  const binaryDerString = window.atob(base64PublicKey);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  // Import the public key
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' }
    },
    true,
    ['encrypt']
  );

  return publicKey;
}

try {
    // Attempt to create a WebSocket connection
    if (!window.socket) {
        window.socket = new WebSocket('ws://localhost:8765');
    }
    
    // Event listener for WebSocket connection opened successfully
    socket.onopen = function(event) {
      console.log('WebSocket connection established.');
    };
  
    // Event listener for WebSocket messages
    socket.onmessage = function(event) {
      if (!PublicKeyReceived) {
        b64ServerPublicKey = event.data;
        console.log("Received server public key = "+b64ServerPublicKey);
        PublicKeyBuffer = importPublicKey(b64ServerPublicKey);
        PublicKeyReceived = true;
      } else {
        json = JSON.parse(event.data);
        console.log('Message received:', json);
        createMessageDiv(json, MessageType.NORMAL);
      }
    };
  
    // Event listener for WebSocket connection closed
    socket.onclose = function(event) {
       ErrorMessageJson = {"author": "Client", "message": "Socket closed", "timestamp": new Date().toLocaleString()}
        createMessageDiv(ErrorMessageJson, MessageType.ERROR);
    };
  
    // Event listener for WebSocket connection errors
    socket.onerror = function(exception) {
      console.error('WebSocket error:', exception);
      // Handle the error here, such as displaying a message to the user
      ErrorMessageJson = {"author": "Client", "message": "Websocket error thrown", "timestamp": new Date().toLocaleString()};
      createMessageDiv(ErrorMessageJson, MessageType.ERROR);
    };
  } catch (exception) {
    console.error("Something went wrong! Error: ", exception);
    ErrorMessageJson = {"author": "Client", "message": "Unknown error occured?", "timestamp": new Date().toLocaleString()};
    createMessageDiv(ErrorMessageJson, MessageType.ERROR);
  }

  function createMessageDiv(message, status) {
    var messageDiv = document.createElement("div");
    if (status == MessageType.ERROR) {
      messageDiv.style.color = "rgb(0,0,0)";
      messageDiv.style.backgroundImage = "linear-gradient(to left, rgba(200, 0, 0, 0.1), rgba(255, 0, 0, 0.3))";
      messageDiv.style.borderColor = "rgb(255, 20, 40)";
    } else {
      messageDiv.style.backgroundColor = "rgb(164, 168, 209)";
      messageDiv.style.backgroundImage = "linear-gradient(to left, rgba(122, 26, 255, 0.1 ), rgba(122, 26, 255, 0.3))";
      messageDiv.style.borderColor = "rgb(221,231,199)";
      messageDiv.style.borderColor = "rgb(122, 26, 255)";
    }
  
    messageDiv.textContent = `${message.author} (${message.timestamp}): ${message.message}`;
  
    messageDiv.style.borderWidth = "0px"; // Apply CSS styles to message div
    messageDiv.style.borderRadius = "5px";
    messageDiv.style.borderStyle = "solid";
    messageDiv.style.paddingLeft = "15px";
    messageDiv.style.paddingRight = "5px";
    messageDiv.style.paddingTop = "3px";
    messageDiv.style.paddingBottom = "3px";
    messageDiv.style.margin = "0.5vh";
    messageDiv.style.fontFamily = "Comic Sans MS, cursive"
  
    // Add created div to message container div
    var messagesContainer = document.getElementById("displaymessages");
    messagesContainer.appendChild(messageDiv);
  }
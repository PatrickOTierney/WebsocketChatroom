let PublicKeyReceived = false;
window.PublicKeyB64 = null;
window.PublicKeySent = false;
window.clientPublicKey = null;
window.clientPrivateKey = null;
window.serverPublicKeyB64 = null;

const MessageType = {
    NORMAL: 'normal',
    ERROR: 'error',
  };
let ErrorMessageJson; 

// -----------------Encryption Jargon ----------------
window.encryptMessage = async function(publicKey, message) { // Note key first, then message, seems strange but also seems to be how it's done elsewhere
  //console.log("KEY: "+publicKey)
  // Convert the message to an ArrayBuffer
  const enc = new TextEncoder();
  const encodedMessage = enc.encode(message);

  // Encrypt the message using the public key
  const encryptedMessage = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey,
    encodedMessage
  );

  return encryptedMessage;
}

window.arrayBufferToBase64 = function(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}


window.importPublicKey = async function(base64PublicKey) {
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

async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
      {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: { name: "SHA-256" }
      },
      true,
      ["encrypt", "decrypt"]
  );

  window.clientPublicKey = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
  );

  window.clientPrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
  );

  console.log("Generated client public key:", arrayBufferToBase64(clientPublicKey));

  // Now that keys are generated, establish WebSocket connection
  //establishWebSocketConnection();
}

function arrayBufferToString(buffer) {
  const decoder = new TextDecoder('utf-8');
  
  return decoder.decode(buffer);
}






// -------------------Socket jargon---------------------------
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
    socket.onmessage = async function(event) {
      if (!PublicKeyReceived) {
        // This might be the worst code ever written in the history of mankind, using a new variable rather than the already declared global variable for client public key in b64
        await generateKeyPair();
        window.serverPublicKeyB64 = event.data; // First message assumed to be plaintext public key of server
        console.log("Received server public key = " + window.serverPublicKeyB64);
    
        // Convert to "Array Buffer" for use in cryptography
        const PublicKeyCrypto = await window.importPublicKey(window.serverPublicKeyB64); 
        
        console.log("Public Key Crypto", PublicKeyCrypto); // Log the resolved value
    
        PublicKeyReceived = true; // Note receipt of public key to treat other messages differently

        PublicKeyB64 = window.arrayBufferToBase64(window.clientPublicKey)
    
        // Sending client public key back to server encrypted using server public key
        console.log("client public key " + PublicKeyB64); 
        socket.send(PublicKeyB64);

        
        /*const encryptedMessage = await window.encryptMessage(PublicKeyBuffer, window.clientPublicKey);
        console.log("encrypted client public key" +encryptedMessage); 
        const base64EncryptedMessage = window.arrayBufferToBase64(encryptedMessage);
        console.log("base64 encrypted message " + base64EncryptedMessage);
        socket.send(base64EncryptedMessage);*/
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
    messageDiv.classList.add("message");
  
    // Add specific message type class based on status
    if (status === MessageType.ERROR) {
      messageDiv.classList.add("error");
    } else {
      messageDiv.classList.add("normal");
    }
  
    messageDiv.textContent = `${message.author} (${message.timestamp}): ${message.message}`;
  
    var messagesContainer = document.getElementById("displaymessages");
    messagesContainer.appendChild(messageDiv);
  }
  
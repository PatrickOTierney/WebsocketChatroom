let PublicKeyReceived = false;
//"global" variables, as in can be used by other javascript code in the same html file
window.PublicKeyB64 = null;
window.PublicKeySent = false;
window.clientPublicKey = null;
window.clientPrivateKey = null;
window.serverPublicKeyB64 = null;

// Used in function CreateMessageDiv()
const MessageType = {
    NORMAL: 'normal',
    ERROR: 'error',
    SUCCESS: 'success'
  };

let ErrorMessageJson; 

// ----------------------------------------------------Encryption Jargon --------------------------------------------------------
window.encryptMessage = async function(publicKey, message) { // Note key first, then message, seems strange but also seems to be how it's done elsewhere
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

window.decryptMessage = async function(privateKey, encryptedMessage) {
  const decryptedMessage = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedMessage
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedMessage);
}

// Keys are stored using "arrayBuffers," which are arrays of numbers, requiring conversion to something that can be sent through a websocket, e.g. base 64
window.arrayBufferToBase64 = function(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

window.base64ToArrayBuffer = function(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Similarly, conversion from base64 through socket connection to arraybuffer is required for using the keys received from the server
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

window.importPrivateKey = async function(arrayBuffer) {
  return await window.crypto.subtle.importKey(
    "pkcs8", //standard for private keys
    arrayBuffer,
    {
      name: "RSA-OAEP",
      hash: { name: "SHA-256" }
    },
    true,
    ["decrypt"]
  );
}


async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
      {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537, a large exponent commonly used due to its simple representation in low level bytes (?)
          hash: { name: "SHA-256" } // As opposed to SHA-1 or SHA-2, which are considered less secure
      },
      true,
      ["encrypt", "decrypt"]
  );

  window.clientPublicKey = await window.crypto.subtle.exportKey(
      "spki", //standard for public keys
      keyPair.publicKey
  );

  window.clientPrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8", //standard for private keys
      keyPair.privateKey
  );

  console.log("Generated client public key:", arrayBufferToBase64(clientPublicKey));

}



// Only necessary for printing/debugging
function arrayBufferToString(buffer) {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buffer);
}


// ------------------------------------------------------Socket jargon----------------------------------------------------------
try {
    // Attempt to create a WebSocket connection
    if (!window.socket) {
        window.socket = new WebSocket('ws://localhost:8765'); // Address to connect to
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
        window.serverPublicKeyB64 = event.data; // First message received assumed to be plaintext public key of server
        console.log("Received server public key = " + window.serverPublicKeyB64);
    
        // Convert to "Array Buffer" for use in cryptography
        const PublicKeyCrypto = await window.importPublicKey(window.serverPublicKeyB64); 
        
        console.log("Public Key Crypto", PublicKeyCrypto); // Log the resolved value
    
        PublicKeyReceived = true; // Note receipt of public key as next messages will be encrypted

        PublicKeyB64 = window.arrayBufferToBase64(window.clientPublicKey)
    
        // Sending client public key back to server encrypted using server public key
        console.log("client public key " + PublicKeyB64); 
        socket.send(PublicKeyB64);

        //No need to encrypt client public key...?
        /*const encryptedMessage = await window.encryptMessage(PublicKeyBuffer, window.clientPublicKey);
        console.log("encrypted client public key" +encryptedMessage); 
        const base64EncryptedMessage = window.arrayBufferToBase64(encryptedMessage);
        console.log("base64 encrypted message " + base64EncryptedMessage);
        socket.send(base64EncryptedMessage);*/
        
        // Enable text box after key generation to ensure that message gets sent
        // Is this a security risk? Technically one could reenable this in their browser before public key generation
        // Maybe send something to the server that isn't a public key for its first message, thus throwing an error? Seems a bit pointless
        document.getElementById("inputbox").disabled = false;
        successjson = {"author": "Client", "message": "Connection success", "timestamp": new Date().toLocaleString()};
        console.log("what is successjson?: "+typeof successjson)
        createMessageDiv(successjson, MessageType.SUCCESS);
      } else {
        // console.log("event data "+event.data);
        // let decryptedincomingmessage = decryptMessage(await window.importPrivateKey(await window.privateKey), event.data);
        // json = JSON.parse(decryptedincomingmessage);
        // //console.log('Message received:', json);
        // createMessageDiv(json, MessageType.NORMAL);

        const encryptedMessageArrayBuffer = window.base64ToArrayBuffer(event.data);

        // Import the private key (if not already a CryptoKey)
        if (!(window.clientPrivateKey instanceof CryptoKey)) {
          window.clientPrivateKey = await window.importPrivateKey(window.clientPrivateKey);
        }

        // Decrypt the message
        const decryptedMessage = await window.decryptMessage(window.clientPrivateKey, encryptedMessageArrayBuffer);
        console.log('Decrypted message:', decryptedMessage);
        let json;
        try {
          json = JSON.parse(decryptedMessage);
          console.log('Parsed JSON:', json);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          // Handle parsing error if necessary
        }
        console.log("author: "+json.author);
        createMessageDiv(json, MessageType.NORMAL);
        
        }
    };
  
    // Event listener for WebSocket connection closed
    socket.onclose = function(event) {
       ErrorMessageJson = {"author": "Client", "message": "Socket closed", "timestamp": new Date().toLocaleString()};
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

  // ----------------------------------------------------- Actual front end interfacing -----------------------------------------------------------
  // Add message to div, status = colour of message essentially
  function createMessageDiv(message, status) {
    
    console.log("div: "+message);
    var messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
  
    // Add specific message type class based on status
    if (status === MessageType.ERROR) {
      messageDiv.classList.add("error");
    } if (status === MessageType.NORMAL) {
      messageDiv.classList.add("normal");
    } if (status === MessageType.SUCCESS) {
      messageDiv.classList.add("success");
    } 
    
    // If message isn't a json, things will go very badly
    messageDiv.textContent = `${message.author} (${message.timestamp}): ${message.message}`;
  
    var messagesContainer = document.getElementById("displaymessages");
    messagesContainer.appendChild(messageDiv);
  }
  
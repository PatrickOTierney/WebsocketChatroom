let socket = window.socket; // Global websocket variable
let username = "User";
let PublicKeyBuffer = window.PublicKeyBuffer;

async function encryptMessage(publicKey, message) {
  console.log("KEY: "+publicKey)
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

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

document.getElementById('inputbox').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent the default action (form submission)
    Submit();
  }
});

async function Submit() {
  var message = document.getElementById('inputbox').value; // Take text from message box

  if (message != "") { // Check input is not empty
    var data = {
      "username": username,
      "message": message
    };
    console.log("Message:", data);

    if (PublicKeyBuffer) {
      const publicKey = await PublicKeyBuffer;

      const encryptedMessage = await encryptMessage(publicKey, JSON.stringify(data));

      const base64EncryptedMessage = arrayBufferToBase64(encryptedMessage);
      console.log(base64EncryptedMessage);
      socket.send(base64EncryptedMessage);

      document.getElementById('inputbox').value = "";
    } else {
      console.error("Public key is not yet available.");
    }
  }
}

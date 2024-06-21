let socket = window.socket; // Global websocket variable
let username = "User";
let clientPublicKeyB64 = window.clientPublicKeyB64;
let serverPublicKeyB64 = window.serverPublicKeyB64;
let PublicKeySent = window.PublicKeySent;

// ------------------ Actually sending messages -------------
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

    
    if (PublicKeyB64) {
      const serverPublicKey = await window.serverPublicKeyB64; 
      const encryptedMessage = await window.encryptMessage(await window.importPublicKey(serverPublicKey), JSON.stringify(data));
      const base64EncryptedMessage = window.arrayBufferToBase64(encryptedMessage);
      console.log("base64 encrypted message "+base64EncryptedMessage);
      socket.send(base64EncryptedMessage);

      document.getElementById('inputbox').value = "";
    } else {
      console.error("Public key is not yet available.");
    }
  }
}

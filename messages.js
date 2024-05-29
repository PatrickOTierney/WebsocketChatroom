let socket = window.socket;
let username = "Shoe";



  document.getElementById('fname').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default action (form submission)
      Submit();
    }
  });

  function Submit() {
    var message = document.getElementById('fname').value;
    if (message != "") {
      var data = {
        "username": username,
        "message": message
      };
      console.log("Message:", data);
      socket.send(JSON.stringify(data));
      //Clear input after send
      document.getElementById('fname').value = "";
    }
  } 
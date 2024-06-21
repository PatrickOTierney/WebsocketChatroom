# Websocket chat room

This repository both server and client side code.
## Server:
 - Server.py is the python file that starts the websocket server at the address and port specified.
 - GenerateKeys.py is the python file that generates an RSA private and public keypair (PEM files) for use in Server.py

## Client:
 - ChatFrontEnd.html is the html file displayed in the browser, quite little html but plenty of CSS
 - socket.js is the javascript file that handles the connections to the websocket, as well as encryption
 - messages.js is the javascript file that handles taking messages from user input and sending them through the websocket connection.

On connection, both server and client send their public keys to one another, and future messages are encoded accordingly. This still uses the unencrypted "ws://" protocol as opposed to the "wss://" protocol. Additionally, while this uses RSA encryption, there are currently no preventions in place for man in the middle attacks.

### TO DO:
- Protect from man in the middle attacks (using message signing with private key and inclusion of signature?)
- Split javascript into sepeare files, one is currently 150 lines, and the other is 40
- Easier functionality for switching to different rooms/IPs/direct messages?
- Create seperate CSS file outside HTML
- User friendly
  1. Inputting addresses/ports by hand in the code (in both client/server)
  2. Still plenty of debug statements in the client and server console
  3. Unhelpful error messages appearing to client
  4. UI front end not allowing for anything other than connection to predisposed IP
  

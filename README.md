# Websocket chat room

This repository contains both Server side code and client side code.

Server.py and the generated messages.json are the server-side files, while ChatFrontEnd.html, messages.js and socket.js are used to create the client side in a browser to connect to the server. Messages are sent and stored on the server as a JSON, storing the author of the message, the text contents and a timestamp. It is currently not encrypted, using the unencrypted websockets "ws://"
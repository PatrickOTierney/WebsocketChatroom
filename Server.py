import websockets
import asyncio
import json
from datetime import datetime
import os
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
import base64

# Load RSA keys
with open("private_key.pem", "rb") as f:
    private_key = serialization.load_pem_private_key(
        f.read(),
        password=None
    )

with open("public_key.pem", "rb") as f:
    public_key = serialization.load_pem_public_key(
        f.read()
    )

connected_clients = set()
client_public_keys = {}

async def initialize_json_file():
    """Initialize the JSON file if it does not exist or is empty."""
    if not os.path.exists("messages.json") or os.path.getsize("messages.json") == 0:
        with open("messages.json", 'w') as file:
            json.dump([], file, indent=4) # Add square brackets to start and end of file to make it a proper json file
            
async def load_messages():
    """Load messages from the JSON file into the in-memory list."""
    global messages
    try:
        with open("messages.json", 'r') as file:
            messages = json.load(file)
    except FileNotFoundError:
        messages = []

async def save_message(message_data):
    """Save a new message to the in-memory list and the JSON file."""
    messages.append(message_data)
    with open("messages.json", 'w') as file:
        json.dump(messages, file, indent=4)

async def connection_handler(websocket, path):
    
    #   client_public_key_received = False
    client_public_key = None
    """Handle incoming WebSocket connections."""
    connected_clients.add(websocket)
    
    # Serialize the public key in DER format and encode it in base64
    public_key_data = public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    await websocket.send(base64.b64encode(public_key_data).decode('utf-8'))
    print("Sent public key to client")

    # Receive the client's public key
    client_public_key_message = await websocket.recv()
    print(f"Client public key received: {client_public_key_message}")

    client_public_key_bin = base64.b64decode(client_public_key_message)
    client_public_key = serialization.load_der_public_key(client_public_key_bin)
    client_public_keys[websocket] = client_public_key
    print("Received and stored client's public key")
    
    try:
        # Send the last 5 messages to the newly connected client
        #for message in messages[-5:]:
            #message_json = json.dumps(message)
            #await websocket.send(message_json)
            #print("Sent "+message_json)
        
        

        async for message in websocket:
            if message.strip(): # If message is not blank
                
                print(f"Encrypted message received: {message}")
                try:
                    # Decode base64 and decrypt the message
                    encrypted_message = base64.b64decode(message)
                    decrypted_message = private_key.decrypt(
                        encrypted_message,
                        padding.OAEP(
                            mgf=padding.MGF1(algorithm=hashes.SHA256()),
                            algorithm=hashes.SHA256(),
                            label=None
                        )
                    )

                    print(decrypted_message)

                    
                    
                    # Decode decrypted message from bytes to string
                    decrypted_message_str = decrypted_message.decode('utf-8')
                    print("dec message string"+decrypted_message_str)
                    #if not client_public_key_received:
                        #client_public_key = decrypted_message_str
                        #print("client public key: "+client_public_key)
                    #else:
                        # Split received JSON into username and text of message
                    messagedata = json.loads(decrypted_message_str)
                    username = messagedata.get('username', 'User')
                    text = messagedata.get('message', '')
                    now = datetime.now()
                    formatted_datetime = now.strftime("%d-%m-%y %H:%M:%S")
                    message_data = {
                        "author": username,
                        "message": text,
                        "timestamp": formatted_datetime
                    }
                    message_json = json.dumps(message_data)

                    # Print the received message
                    print(f"Received message: {decrypted_message_str}")

                    # Save the new message
                    await save_message(message_data)

                    # Send to other connected clients
                    await broadcast(message_json)
                except json.JSONDecodeError as e:
                    print("Error decoding JSON:", e)
    finally:    
        # Unregister client and remove keys from dictionary
        connected_clients.remove(websocket)
        if websocket in client_public_keys:
            del client_public_keys[websocket]

async def broadcast(message):
    """Broadcast a message to all connected clients."""
    if connected_clients:  # Check if there are any connected clients
        tasks = []
        for client in connected_clients:
            client_public_key = client_public_keys.get(client)
            if client_public_key:
                encrypted_message = client_public_key.encrypt(
                    message.encode('utf-8'),
                    padding.OAEP(
                        mgf=padding.MGF1(algorithm=hashes.SHA256()),
                        algorithm=hashes.SHA256(),
                        label=None
                    )
                )
                encrypted_message_b64 = base64.b64encode(encrypted_message).decode('utf-8')
                tasks.append(asyncio.create_task(client.send(encrypted_message_b64)))
                print("sent message to client(s): "+encrypted_message_b64)
        await asyncio.wait(tasks)

async def start_server():
    """Start the WebSocket server."""
    await initialize_json_file()  # Initialize the JSON file if needed
    await load_messages()  # Load messages when the server starts
    async with websockets.serve(connection_handler, "localhost", 8765):
        print("WebSocket server started. Listening on ws://localhost:8765")
        # Keep the server running indefinitely
        await asyncio.Future()

asyncio.run(start_server())
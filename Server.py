import websockets
import asyncio
import json
from datetime import datetime
import os

connected_clients = set()

async def initialize_json_file():
    """Initialize the JSON file if it does not exist or is empty."""
    if not os.path.exists("messages.json") or os.path.getsize("messages.json") == 0:
        with open("messages.json", 'w') as file:
            json.dump([], file, indent=4)
            
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
    """Handle incoming WebSocket connections."""
    connected_clients.add(websocket)
    
    try:
        # Send the last 5 messages to the newly connected client
        for message in messages[-5:]:
            message_json = json.dumps(message)
            await websocket.send(message_json)

        async for message in websocket:
            if message.strip():
                try:
                    messagedata = json.loads(message)
                    username = messagedata.get('username', 'User')
                    text = messagedata.get('message', '')
                    now = datetime.now()
                    formatted_datetime = now.strftime("%Y-%m-%d %H:%M:%S")
                    message_data = {
                        "author": username,
                        "message": text,
                        "timestamp": formatted_datetime
                    }
                    message_json = json.dumps(message_data)
                    # Print the received message
                    print(f"Received message: {message}")

                    # Save the new message
                    await save_message(message_data)

                    await broadcast(message_json)
                except json.JSONDecodeError as e:
                    print("Error decoding JSON:", e)
            else:
                print("Empty message received.")
    finally:
        # Unregister client
        connected_clients.remove(websocket)

async def broadcast(message):
    """Broadcast a message to all connected clients."""
    if connected_clients:  # Check if there are any connected clients
        tasks = [asyncio.create_task(client.send(message)) for client in connected_clients]
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
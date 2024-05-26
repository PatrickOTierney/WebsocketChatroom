import websockets
import asyncio
import json
from datetime import datetime
import os

connected_clients = set()

async def read_last_messages():
    try:
        with open("messages.json", 'r') as file:
            # Read each line and parse it as JSON
            data = [json.loads(line.strip()) for line in file.readlines()]
            return data
    except FileNotFoundError:
        return []

async def connection_handler(websocket, path):
    connected_clients.add(websocket)
    
    try:
        #last_messages = await read_last_messages()
        #for message in last_messages[-5:]:
            #message_json = json.dumps({"author": "Admin", "message": message, "timestamp": datetime.now().isoformat()})
            #await websocket.send(message_json)

        async for message in websocket:
            if message.strip(): 
                message_json = json.dumps({"author": "Admin", "message": message, "timestamp": datetime.now().isoformat()})
                # Print the received message
                print(f"Received message: {message}")

                with open('messages.json', '') as file:  
                    if os.path.getsize("messages.json") == 0: # Check if file is empty
                        file.write(message_json)
                    else:
                        file.write(',\n'+message_json)

                await broadcast(message_json)
    finally:
        # Unregister client
        connected_clients.remove(websocket)

async def broadcast(message):
    if connected_clients:  # Check if there are any connected clients
        tasks = [asyncio.create_task(client.send(message)) for client in connected_clients]
        await asyncio.wait(tasks)

async def start_server():
    async with websockets.serve(connection_handler, "localhost", 8765):
        print("WebSocket server started. Listening on ws://localhost:8765")
        # Keep the server running indefinitely
        await asyncio.Future()

asyncio.run(start_server())

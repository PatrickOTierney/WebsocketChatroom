import websockets
import asyncio

connected_clients = set()

def read_last_messages():
    try:
        with open("messages.txt", 'r') as file:
            # Read the last 5 lines of the file
            last_lines = file.readlines()[-5:]
        return last_lines
    except FileNotFoundError:
        return []

async def connection_handler(websocket, path):
    connected_clients.add(websocket)
    
    try:
        last_messages = read_last_messages()
        for message in last_messages:
            await websocket.send(message.strip())
        async for message in websocket:
            # Print the received message
            print(f"Received message: {message}")
            with open('messages.txt', 'a') as file:  # Append mode
                # Write the message to the file
                file.write(message + '\n')

            
            await broadcast(message)
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

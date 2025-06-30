import socketio
import time

sio = socketio.Client()

USERNAME = "Bob"  # Change to "Bob" in the second terminal

@sio.event
def connect():
    print('Connected to server')
    sio.emit('join_room', {'room': 'testroom', 'username': USERNAME})

@sio.on('user_list')
def on_user_list(data):
    print('User list:', data)

@sio.on('canvas_state')
def on_canvas_state(data):
    print('Canvas state:', data)
    print('Number of operations on canvas:', len(data['canvas']))

@sio.on('draw_operation')
def on_draw_operation(data):
    print('Received draw operation:', data)

@sio.on('cursor_update')
def on_cursor_update(data):
    print('Received cursor update:', data)

@sio.on('error')
def on_error(data):
    print('Error:', data)

@sio.event
def disconnect():
    print('Disconnected from server')

sio.connect('http://localhost:5001')

# Wait for join and canvas state
time.sleep(1)

# After connecting and joining the room
time.sleep(1)  # Give the server time to process the join

# Emit multiple drawing operations in quick succession
test_color = '#FF0000' if USERNAME == "Alice" else '#0000FF'
for i in range(3):
    sio.emit('draw_operation', {
        'room': 'testroom',
        'operation': {
            'type': 'line',
            'start': [10 + i*20, 10 + i*20],
            'end': [100 + i*20, 100 + i*20],
            'color': test_color,
            'thickness': 2
        }
    })
    time.sleep(0.2)  # Small delay to simulate rapid drawing

# Wait before emitting text and image operations
time.sleep(0.5)

# Emit a text operation
test_text = {
    'type': 'text',
    'position': [200, 200],
    'text': f'Hello from {USERNAME}',
    'color': '#00AA00',
    'size': 18
}
print("Emitting text operation:", test_text)
sio.emit('draw_operation', {'room': 'testroom', 'operation': test_text})

# Emit an image operation
test_image = {
    'type': 'image',
    'position': [300, 300],
    'src': 'https://via.placeholder.com/50',
    'width': 50,
    'height': 50
}
print("Emitting image operation:", test_image)
sio.emit('draw_operation', {'room': 'testroom', 'operation': test_image})

# Emit a cursor update
sio.emit('cursor_update', {
    'room': 'testroom',
    'position': [150, 200] if USERNAME == "Alice" else [300, 400]
})

# Wait and then emit undo
time.sleep(1)
print(f"{USERNAME} emitting undo")
sio.emit('undo', {'room': 'testroom'})

# Wait and then emit redo
time.sleep(1)
print(f"{USERNAME} emitting redo")
sio.emit('redo', {'room': 'testroom'})

input("Press Enter to disconnect...")
sio.disconnect()

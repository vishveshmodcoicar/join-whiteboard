"""
Join: An Interactive Whiteboard - Backend
"""
import eventlet
import time
import os
from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

# In-memory data structure to track rooms and users
rooms = {}  # { room_id: { 'users': { sid: { 'username': str, 'cursor': (x, y) } }, 'canvas': [], 'redo_stack': [] } }

@app.route('/')
def index():
    return 'Join: An Interactive Whiteboard Backend is running.'

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    build_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/build'))
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(build_dir, path)
    else:
        return send_from_directory(build_dir, 'index.html')

@socketio.on('join_room')
def handle_join_room(data):
    """
    Handles a user joining a room.
    data = { 'room': str, 'username': str }
    """
    room_id = data['room']
    username = data['username']
    sid = request.sid

    # Create room if it doesn't exist
    if room_id not in rooms:
        rooms[room_id] = {'users': {}, 'canvas': [], 'redo_stack': []}
    # Add user to room
    rooms[room_id]['users'][sid] = {'username': username, 'cursor': None}
    join_room(room_id)

    # Notify all users in the room about the new user list
    user_list = [user['username'] for user in rooms[room_id]['users'].values()]
    emit('user_list', {'users': user_list}, room=room_id)

    # Send current canvas state to the new user (sorted by timestamp)
    emit('canvas_state', {'canvas': get_sorted_canvas(room_id)}, room=sid)

@socketio.on('leave_room')
def handle_leave_room(data):
    """
    Handles a user leaving a room.
    data = { 'room': str }
    """
    room_id = data['room']
    sid = request.sid
    if room_id in rooms and sid in rooms[room_id]['users']:
        del rooms[room_id]['users'][sid]
        leave_room(room_id)
        # Notify remaining users
        user_list = [user['username'] for user in rooms[room_id]['users'].values()]
        emit('user_list', {'users': user_list}, room=room_id)
        # Clean up room if empty
        if not rooms[room_id]['users']:
            del rooms[room_id]

@socketio.on('disconnect')
def handle_disconnect():
    """
    Handles user disconnects and cleans up from all rooms.
    """
    sid = request.sid
    rooms_to_remove = []
    for room_id, room in rooms.items():
        if sid in room['users']:
            del room['users'][sid]
            # Notify remaining users
            user_list = [user['username'] for user in room['users'].values()]
            emit('user_list', {'users': user_list}, room=room_id)
            if not room['users']:
                rooms_to_remove.append(room_id)
    # Remove empty rooms
    for room_id in rooms_to_remove:
        del rooms[room_id]

def valid_operation(operation):
    """
    Robust validation for drawing operations.
    Checks for required fields based on type.
    """
    print(f"Validating operation: {operation}")
    if 'type' not in operation:
        print("Validation failed: missing 'type'")
        return False
    t = operation['type']
    if t == 'line':
        # Accept either (start, end, color, thickness) or (points, color, size)
        has_straight = all(k in operation for k in ('start', 'end', 'color', 'thickness'))
        has_pen = all(k in operation for k in ('points', 'color', 'size'))
        valid = has_straight or has_pen
        if not valid:
            print("Validation failed: line missing required fields")
        return valid
    if t == 'rect':
        valid = all(k in operation for k in ('start', 'end', 'color', 'thickness'))
        if not valid:
            print("Validation failed: rect missing required fields")
        return valid
    if t == 'circle':
        valid = all(k in operation for k in ('center', 'radius', 'color', 'thickness'))
        if not valid:
            print("Validation failed: circle missing required fields")
        return valid
    if t == 'text':
        valid = all(k in operation for k in ('position', 'text', 'color', 'size'))
        if not valid:
            print("Validation failed: text missing required fields")
        return valid
    if t == 'image':
        print("Image operation keys:", list(operation.keys()))
        valid = all(k in operation for k in ('position', 'src', 'width', 'height'))
        if not valid:
            print("Validation failed: image missing required fields")
        return valid
    print(f"Validation failed: unknown type {t}")
    return False

@socketio.on('draw_operation')
def handle_draw_operation(data):
    """
    Handles drawing operations from clients.
    data = { 'room': str, 'operation': dict }
    """
    room_id = data.get('room')
    operation = data.get('operation')
    sid = request.sid

    # Validate room and operation
    if room_id not in rooms or not valid_operation(operation):
        emit('error', {'message': 'Invalid room or operation'}, room=sid)
        return

    # Assign a timestamp if not present
    if 'timestamp' not in operation:
        operation['timestamp'] = time.time()

    # Store operation in room's canvas state
    rooms[room_id]['canvas'].append(operation)
    # Clear redo stack on new operation
    rooms[room_id]['redo_stack'].clear()

    # Broadcast to all other users in the room
    emit('draw_operation', operation, room=room_id, include_self=False)

# Helper to get sorted canvas by timestamp
def get_sorted_canvas(room_id):
    return sorted(rooms[room_id]['canvas'], key=lambda op: op.get('timestamp', 0))

@socketio.on('cursor_update')
def handle_cursor_update(data):
    """
    Handles cursor position updates from clients.
    data = { 'room': str, 'position': [x, y] }
    """
    room_id = data.get('room')
    position = data.get('position')
    sid = request.sid

    # Update the user's cursor position in the room
    if room_id in rooms and sid in rooms[room_id]['users']:
        rooms[room_id]['users'][sid]['cursor'] = position
        # Broadcast to all other users in the room
        emit('cursor_update', {
            'user': rooms[room_id]['users'][sid]['username'],
            'position': position
        }, room=room_id, include_self=False)

@socketio.on('undo')
def handle_undo(data):
    """
    Handles undo requests from clients.
    data = { 'room': str }
    """
    print("Undo event received for room:", data.get('room'))
    room_id = data.get('room')
    if room_id in rooms and rooms[room_id]['canvas']:
        op = rooms[room_id]['canvas'].pop()
        rooms[room_id]['redo_stack'].append(op)
        print(f"Canvas after undo (len={len(rooms[room_id]['canvas'])}):", rooms[room_id]['canvas'])
        print(f"Redo stack after undo (len={len(rooms[room_id]['redo_stack'])}):", rooms[room_id]['redo_stack'])
        emit('canvas_state', {'canvas': get_sorted_canvas(room_id)}, room=room_id)

@socketio.on('redo')
def handle_redo(data):
    """
    Handles redo requests from clients.
    data = { 'room': str }
    """
    print("Redo event received for room:", data.get('room'))
    room_id = data.get('room')
    if room_id in rooms and rooms[room_id]['redo_stack']:
        op = rooms[room_id]['redo_stack'].pop()
        # Ensure the operation has a timestamp; if not, assign one
        if 'timestamp' not in op:
            import time
            op['timestamp'] = time.time()
        rooms[room_id]['canvas'].append(op)
        print(f"Canvas after redo (len={len(rooms[room_id]['canvas'])}):", rooms[room_id]['canvas'])
        print(f"Redo stack after redo (len={len(rooms[room_id]['redo_stack'])}):", rooms[room_id]['redo_stack'])
        emit('canvas_state', {'canvas': get_sorted_canvas(room_id)}, room=room_id)

@socketio.on('clear_canvas')
def handle_clear_canvas(data):
    """
    Handles clear canvas requests from clients.
    data = { 'room': str }
    """
    print("Clear canvas event received for room:", data.get('room'))
    room_id = data.get('room')
    if room_id in rooms:
        rooms[room_id]['canvas'].clear()
        rooms[room_id]['redo_stack'].clear()
        emit('canvas_state', {'canvas': []}, room=room_id)

if __name__ == '__main__':
    # Use eventlet for async support
    socketio.run(app, host='0.0.0.0', port=5001) 
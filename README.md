# Join: An Interactive Whiteboard

A real-time collaborative whiteboard application built with React and Flask-SocketIO. Draw, share, and collaborate with others in real-time!

## Features

- 🎨 **Multiple Drawing Tools**: Pen, line, rectangle, circle, text, image, and eraser
- 👥 **Real-time Collaboration**: Multiple users can draw simultaneously in the same room
- 🎯 **Live Cursor Tracking**: See where other users are pointing on the canvas
- ↩️ **Undo/Redo**: Full undo and redo functionality
- 🎨 **Customizable**: Adjustable brush size and color picker
- 🚀 **Real-time Sync**: All changes are synchronized instantly across all connected clients

## Tech Stack

- **Frontend**: React 19, React Konva, Socket.IO Client, React Icons
- **Backend**: Flask, Flask-SocketIO, Gevent
- **Real-time Communication**: WebSockets via Socket.IO

## Prerequisites

- Python 3.10 or higher
- Node.js 14 or higher
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
```

3. Activate the virtual environment:
```bash
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Option 1: Using the provided scripts

**Terminal 1 - Backend:**
```bash
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start_frontend.sh
```

### Option 2: Manual startup

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The backend will run on `http://localhost:5001` and the frontend on `http://localhost:3000`.

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter a username and room name
3. Click "Join" to enter the whiteboard room
4. Start drawing! Your changes will be visible to all users in the same room in real-time

## Project Structure

```
join_whiteboard_project/
├── backend/
│   ├── app.py              # Flask-SocketIO server
│   ├── requirements.txt    # Python dependencies
│   └── venv/               # Virtual environment (gitignored)
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── background.png
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css
│   │   ├── index.js        # React entry point
│   │   └── components/
│   │       ├── Canvas.js   # Canvas drawing component
│   │       └── ToolBar.js  # Toolbar component
│   ├── package.json
│   └── node_modules/        # Node dependencies (gitignored)
├── start_backend.sh        # Backend startup script
├── start_frontend.sh       # Frontend startup script
└── README.md
```

## API Endpoints

### Socket.IO Events

#### Client → Server:
- `join_room`: Join a room with username
  ```javascript
  socket.emit('join_room', { username: 'John', room: 'room1' })
  ```
- `draw_operation`: Send a drawing operation
  ```javascript
  socket.emit('draw_operation', { room: 'room1', operation: {...} })
  ```
- `cursor_update`: Update cursor position
  ```javascript
  socket.emit('cursor_update', { room: 'room1', position: [x, y] })
  ```
- `undo`: Undo last operation
- `redo`: Redo last undone operation
- `clear_canvas`: Clear the entire canvas

#### Server → Client:
- `user_list`: List of users in the room
- `canvas_state`: Current canvas state (sent on join)
- `draw_operation`: New drawing operation from another user
- `cursor_update`: Cursor position update from another user

## Development

### Backend Development

The backend uses Flask-SocketIO with Gevent for async support. The server maintains an in-memory data structure for rooms, users, and canvas state.

### Frontend Development

The frontend uses React with React Konva for canvas rendering. Socket.IO client handles real-time communication.

## Deployment

### Backend Deployment

For production deployment, consider:
- Using a production WSGI server like Gunicorn
- Setting up environment variables for configuration
- Implementing persistent storage (database) instead of in-memory storage
- Adding authentication and authorization

### Frontend Deployment

1. Build the React app:
```bash
cd frontend
npm run build
```

2. The `build` folder can be served by the Flask backend or any static file server.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with React and Flask
- Real-time communication powered by Socket.IO
- Canvas rendering using React Konva

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import ToolBar from './components/ToolBar.js';
import Canvas from './components/Canvas.js';
import './App.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('');
  const [selectedTool, setSelectedTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('user_list', (data) => setUsers(data.users));
    s.on('connect_error', (err) => setStatus('Connection error: ' + err.message));
    return () => s.disconnect();
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (socket && username && room) {
      socket.emit('join_room', { username, room });
      setJoined(true);
      setStatus('Joined room: ' + room);
    }
  };

  const backgroundStyle = {
    minHeight: '100vh',
    width: '100vw',
    display: joined ? 'block' : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    background: `url(${process.env.PUBLIC_URL}/background.png) no-repeat center center fixed`,
    backgroundSize: 'cover',
    backgroundColor: '#f7f7fa',
  };

  return (
    <div style={backgroundStyle}>
      {!joined ? (
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 24px #0002',
            padding: 40,
            minWidth: 320,
            maxWidth: 400,
            width: '90vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontFamily: '"Agrandir Narrow", sans-serif', textAlign: 'center', marginBottom: 16 }}>Join: An Interactive Whiteboard</h2>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>Status: {connected ? 'Connected' : 'Disconnected'}</div>
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: '100%', maxWidth: 250 }}
            />
            <input
              type="text"
              placeholder="Room"
              value={room}
              onChange={e => setRoom(e.target.value)}
              required
              style={{ width: '100%', maxWidth: 250 }}
            />
            <button type="submit" style={{ width: '100%', maxWidth: 250 }}>Join</button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 }}>
          <div style={{ marginRight: 24 }}>
            <ToolBar
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
              color={color}
              setColor={setColor}
              size={size}
              setSize={setSize}
            />
            <div style={{ marginTop: 24 }}>
              <b>Users in room:</b>
              <ul>
                {users.map(u => <li key={u}>{u}</li>)}
              </ul>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => socket && room && socket.emit('undo', { room })} disabled={!joined}>Undo</button>
              <button onClick={() => socket && room && socket.emit('redo', { room })} disabled={!joined}>Redo</button>
            </div>
            <Canvas selectedTool={selectedTool} color={color} size={size} socket={socket} room={room} username={username} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
import React from 'react';
import { FaPen, FaMinus, FaSquare, FaCircle, FaFont, FaImage, FaEraser } from 'react-icons/fa';

const tools = [
  { name: 'pen', icon: <FaPen /> },
  { name: 'line', icon: <FaMinus /> },
  { name: 'rect', icon: <FaSquare /> },
  { name: 'circle', icon: <FaCircle /> },
  { name: 'text', icon: <FaFont /> },
  { name: 'image', icon: <FaImage /> },
  { name: 'eraser', icon: <FaEraser /> },
];

export default function ToolBar({ selectedTool, setSelectedTool, color, setColor, size, setSize }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8, background: '#f5f5f5', borderRadius: 8, boxShadow: '0 2px 8px #0001', gap: 12 }}>
      {tools.map(tool => (
        <button
          key={tool.name}
          onClick={() => setSelectedTool(tool.name)}
          style={{
            background: selectedTool === tool.name ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: 4,
            padding: 8,
            fontSize: 20,
            cursor: 'pointer',
            outline: selectedTool === tool.name ? '2px solid #1976d2' : 'none',
          }}
          title={tool.name.charAt(0).toUpperCase() + tool.name.slice(1)}
        >
          {tool.icon}
        </button>
      ))}
      <input
        type="color"
        value={color}
        onChange={e => setColor(e.target.value)}
        title="Color picker"
        style={{ marginTop: 16, width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
      />
      <input
        type="range"
        min={1}
        max={20}
        value={size}
        onChange={e => setSize(Number(e.target.value))}
        title="Brush size"
        style={{ marginTop: 8, width: 32, writingMode: 'bt-lr', transform: 'rotate(270deg)' }}
      />
    </div>
  );
}
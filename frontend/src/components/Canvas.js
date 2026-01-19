import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Image as KonvaImage } from 'react-konva';

const CURSOR_COLORS = [
  '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac', '#ff8a65', '#a1887f', '#90a4ae', '#f06292'
];

export default function Canvas({ selectedTool, color, size, socket, room, username }) {
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]); // for line, rect, circle
  const [texts, setTexts] = useState([]); // for text
  const [images, setImages] = useState([]); // for image
  const [drawing, setDrawing] = useState(null); // preview shape
  const [cursors, setCursors] = useState({}); // { username: { x, y } }
  const isDrawing = useRef(false);
  const startPos = useRef(null);
  const [imageCache, setImageCache] = useState({}); // for loaded images

  // Listen for remote draw operations, canvas state, and cursor updates
  useEffect(() => {
    if (!socket) return;
    const handleDrawOperation = (operation) => {
      if (operation.type === 'line' && operation.points) {
        setLines(prev => [...prev, operation]);
      } else if (operation.type === 'line' && operation.start && operation.end) {
        setShapes(prev => [...prev, { ...operation, shape: 'line' }]);
      } else if (operation.type === 'rect') {
        setShapes(prev => [...prev, { ...operation, shape: 'rect' }]);
      } else if (operation.type === 'circle') {
        setShapes(prev => [...prev, { ...operation, shape: 'circle' }]);
      } else if (operation.type === 'text') {
        setTexts(prev => [...prev, operation]);
      } else if (operation.type === 'image') {
        setImages(prev => [...prev, operation]);
      }
    };
    const handleCanvasState = (data) => {
      console.log('Received canvas_state:', data);
      if (data.canvas.length === 0) {
        setLines([]);
        setShapes([]);
        setTexts([]);
        setImages([]);
        return;
      }
      setLines(data.canvas.filter(op => op.type === 'line' && op.points));
      setShapes(data.canvas.filter(op =>
        (op.type === 'line' && op.start && op.end) || op.type === 'rect' || op.type === 'circle'
      ).map(op => {
        if (op.type === 'line') return { ...op, shape: 'line' };
        if (op.type === 'rect') return { ...op, shape: 'rect' };
        if (op.type === 'circle') return { ...op, shape: 'circle' };
        return op;
      }));
      setTexts(data.canvas.filter(op => op.type === 'text'));
      setImages(data.canvas.filter(op => op.type === 'image'));
    };
    const handleCursorUpdate = (data) => {
      if (!data.user || data.user === username) return;
      setCursors(prev => ({ ...prev, [data.user]: data.position }));
    };
    socket.on('draw_operation', handleDrawOperation);
    socket.on('canvas_state', handleCanvasState);
    socket.on('cursor_update', handleCursorUpdate);
    return () => {
      socket.off('draw_operation', handleDrawOperation);
      socket.off('canvas_state', handleCanvasState);
      socket.off('cursor_update', handleCursorUpdate);
    };
  }, [socket, username]);

  // Load images for Konva
  useEffect(() => {
    images.forEach(imgOp => {
      if (!imageCache[imgOp.src]) {
        const img = new window.Image();
        img.src = imgOp.src;
        img.onload = () => setImageCache(cache => ({ ...cache, [imgOp.src]: img }));
      }
    });
  }, [images, imageCache]);

  // Emit cursor position on mouse move
  const handleStageMouseMove = (e) => {
    if (!socket || !room || !username) return;
    const pos = e.target.getStage().getPointerPosition();
    socket.emit('cursor_update', { room, position: pos });
  };

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      isDrawing.current = true;
      setLines([...lines, { type: 'line', tool: selectedTool, points: [pos.x, pos.y], color, size }]);
    } else if (['line', 'rect', 'circle'].includes(selectedTool)) {
      isDrawing.current = true;
      startPos.current = pos;
      setDrawing({ tool: selectedTool, start: pos, end: pos, color, size });
    } else if (selectedTool === 'text') {
      const text = window.prompt('Enter text:');
      if (text && socket && room) {
        const operation = { type: 'text', position: pos, text, color, size: size * 4 };
        socket.emit('draw_operation', { room, operation });
        setTexts(prev => [...prev, operation]);
      }
    } else if (selectedTool === 'image') {
      const src = window.prompt('Enter image URL:');
      if (src && socket && room) {
        const operation = { type: 'image', position: pos, src, width: 80, height: 80 };
        socket.emit('draw_operation', { room, operation });
        setImages(prev => [...prev, operation]);
      }
    }
  };

  const handleMouseMove = (e) => {
    handleStageMouseMove(e);
    if (!isDrawing.current) return;
    const pos = e.target.getStage().getPointerPosition();
    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setLines(prevLines => {
        const lastLine = { ...prevLines[prevLines.length - 1] };
        lastLine.points = lastLine.points.concat([pos.x, pos.y]);
        return [...prevLines.slice(0, -1), lastLine];
      });
    } else if (['line', 'rect', 'circle'].includes(selectedTool) && drawing) {
      setDrawing({ ...drawing, end: pos });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      const lastLine = lines[lines.length - 1];
      if (socket && room && lastLine) {
        socket.emit('draw_operation', { room, operation: lastLine });
      }
    } else if (['line', 'rect', 'circle'].includes(selectedTool) && drawing) {
      const { start, end } = drawing;
      let operation = null;
      if (selectedTool === 'line') {
        operation = { type: 'line', start, end, color, thickness: size };
      } else if (selectedTool === 'rect') {
        operation = { type: 'rect', start, end, color, thickness: size };
      } else if (selectedTool === 'circle') {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        operation = { type: 'circle', center: start, radius, color, thickness: size };
      }
      if (operation && socket && room) {
        socket.emit('draw_operation', { room, operation });
        setShapes(prev => [...prev, { ...operation, shape: selectedTool }]);
      }
      setDrawing(null);
    }
  };

  // Assign a color to each user for their cursor
  const getCursorColor = (user) => {
    let hash = 0;
    for (let i = 0; i < user.length; i++) hash = user.charCodeAt(i) + ((hash << 5) - hash);
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, background: 'white', margin: 16, position: 'relative' }}>
      <Stage
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        style={{ borderRadius: 8, background: 'white' }}
      >
        <Layer>
          {/* Render freehand lines and eraser */}
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.tool === 'eraser' ? '#fff' : line.color}
              strokeWidth={line.size}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
            />
          ))}
          {/* Render shapes (line, rect, circle) */}
          {shapes.map((shape, i) => {
            if (shape.shape === 'line') {
              return <Line key={i} points={[shape.start.x, shape.start.y, shape.end.x, shape.end.y]} stroke={shape.color} strokeWidth={shape.thickness} />;
            }
            if (shape.shape === 'rect') {
              const x = Math.min(shape.start.x, shape.end.x);
              const y = Math.min(shape.start.y, shape.end.y);
              const w = Math.abs(shape.end.x - shape.start.x);
              const h = Math.abs(shape.end.y - shape.start.y);
              return <Rect key={i} x={x} y={y} width={w} height={h} stroke={shape.color} strokeWidth={shape.thickness} fillEnabled={false} />;
            }
            if (shape.shape === 'circle') {
              return <Circle key={i} x={shape.center.x} y={shape.center.y} radius={shape.radius} stroke={shape.color} strokeWidth={shape.thickness} fillEnabled={false} />;
            }
            return null;
          })}
          {/* Render text */}
          {texts.map((t, i) => (
            <Text key={i} x={t.position.x} y={t.position.y} text={t.text} fontSize={t.size} fill={t.color} />
          ))}
          {/* Render images */}
          {images.map((img, i) => (
            imageCache[img.src] ? (
              <KonvaImage key={i} x={img.position.x} y={img.position.y} image={imageCache[img.src]} width={img.width} height={img.height} />
            ) : null
          ))}
          {/* Render other users' cursors */}
          {Object.entries(cursors).map(([user, pos], i) => (
            <>
              <Circle key={user} x={pos.x} y={pos.y} radius={7} fill={getCursorColor(user)} opacity={0.7} />
              <Text key={user + '-label'} x={pos.x + 10} y={pos.y - 10} text={user} fontSize={14} fill={getCursorColor(user)} />
            </>
          ))}
          {/* Render preview shape */}
          {drawing && drawing.tool === 'line' && (
            <Line points={[drawing.start.x, drawing.start.y, drawing.end.x, drawing.end.y]} stroke={drawing.color} strokeWidth={drawing.size} dash={[8, 8]} />
          )}
          {drawing && drawing.tool === 'rect' && (
            <Rect x={Math.min(drawing.start.x, drawing.end.x)} y={Math.min(drawing.start.y, drawing.end.y)} width={Math.abs(drawing.end.x - drawing.start.x)} height={Math.abs(drawing.end.y - drawing.start.y)} stroke={drawing.color} strokeWidth={drawing.size} dash={[8, 8]} fillEnabled={false} />
          )}
          {drawing && drawing.tool === 'circle' && (
            <Circle x={drawing.start.x} y={drawing.start.y} radius={Math.sqrt(Math.pow(drawing.end.x - drawing.start.x, 2) + Math.pow(drawing.end.y - drawing.start.y, 2))} stroke={drawing.color} strokeWidth={drawing.size} dash={[8, 8]} fillEnabled={false} />
          )}
        </Layer>
      </Stage>
      <div style={{ position: 'absolute', top: 8, right: 16, background: '#fff8', padding: '2px 8px', borderRadius: 4, fontSize: 14 }}>
        Tool: <b>{selectedTool}</b>
      </div>
    </div>
  );
}
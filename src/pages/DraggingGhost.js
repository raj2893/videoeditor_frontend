// DraggingGhost.js
import React from 'react';

const DraggingGhost = ({ draggingItem, snapIndicators, timeScale, dragLayer, layers }) => {
  if (!draggingItem || snapIndicators.length === 0) return null;

  return (
    <div
      className="snapping-ghost"
      style={{
        position: 'absolute',
        left: `${(snapIndicators[0].time - (snapIndicators[0].edge === 'end' ? draggingItem.duration : 0)) * timeScale}px`,
        top: `${(layers.length - 1 - (dragLayer || 0)) * 80 + 5}px`,
        width: `${draggingItem.duration * timeScale}px`,
        height: '70px',
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        border: '2px dashed #ff9800',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 9
      }}
    />
  );
};

export default DraggingGhost;
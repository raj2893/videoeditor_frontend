// TimelineLayer.js
import React from 'react';

const TimelineLayer = ({
  layer,
  layerIndex,
  timeScale,
  handleDragStart,
  playingVideoId,
  handleVideoSelect,
  handleEditTextSegment
}) => {
  return (
    <div className="timeline-layer">
      <div className="layer-label">Layer {layerIndex}</div>
      {layer.map(item => (
        <div
          key={item.id}
          className={`timeline-clip ${item.type === 'text' ? 'text-clip' : 'video-clip'} ${playingVideoId === item.id ? 'active' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          style={{
            left: `${item.startTime * timeScale}px`,
            width: `${item.duration * timeScale}px`,
            backgroundImage: item.type === 'video' && item.thumbnail ? `url(${item.thumbnail})` : 'none',
            backgroundColor: item.type === 'text' ?
              (item.backgroundColor !== 'transparent' ? item.backgroundColor : '#4a6ddf') : undefined
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (item.type === 'text') {
              handleEditTextSegment(item, e);
            } else {
              handleVideoSelect(item.id);
            }
          }}
        >
          {item.type === 'text' && (
            <div className="text-preview" style={{
              fontFamily: item.fontFamily || 'Arial',
              fontSize: `${Math.min(item.fontSize / 3, 14)}px`, // Scale down for preview
              color: item.fontColor || '#FFFFFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <span className="text-icon">T</span>
              {item.text.substring(0, 15)}{item.text.length > 15 ? '...' : ''}
            </div>
          )}
          {item.type === 'video' && (
            <div className="clip-title">
              {item.title || item.displayPath || item.filename}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TimelineLayer;
import React from 'react';

const TimelineLayer = ({
  layer,
  layerIndex,
  timeScale,
  handleDragStart,
  handleResizeStart,
  playingVideoId,
  handleVideoSelect,
  handleEditTextSegment,
  selectedSegmentId,
}) => {
  const totalVideoLayers = layer.some(item => item.layer >= 0)
    ? layerIndex + 1
    : layerIndex - layer.filter(l => l.some(item => item.layer >= 0)).length + 1;
  const isAudioLayer = layer.some(item => item.layer < 0);
  const displayLayerIndex = isAudioLayer ? layerIndex - totalVideoLayers + 1 : layerIndex;

  return (
    <div className="layer">
      <div className="layer-label">Layer {displayLayerIndex}</div>
      <div className="layer-items">
        {layer.map((item, index) => (
          <div
            key={item.id}
            className={`timeline-item ${
              item.type === 'text' ? 'text-segment' : item.type === 'audio' ? 'audio-segment' : 'video-segment'
            } ${item.id === playingVideoId ? 'playing' : ''} ${
              item.id === selectedSegmentId ? 'selected' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, item, layerIndex)}
            style={{
              left: `${item.startTime * timeScale}px`,
              width: `${item.duration * timeScale}px`,
              backgroundImage: item.type === 'video' && item.thumbnail ? `url(${item.thumbnail})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: item.type === 'video' && !item.thumbnail ? '#4285f4' : 'transparent',
              zIndex: index,
              top: '5px',
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
            <div
              className="resize-handle resize-left"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, item, layerIndex, 'left');
              }}
            />
            {item.type === 'text' && (
              <div
                className="text-segment-preview"
                style={{
                  backgroundColor: item.backgroundColor || 'rgba(0, 0, 0, 0.7)',
                  color: item.fontColor || '#FFFFFF',
                  fontFamily: item.fontFamily || 'Arial',
                  fontSize: `${Math.min(item.fontSize / 2, 14)}px` || '12px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px',
                  boxSizing: 'border-box',
                }}
              >
                <div className="text-segment-icon">T</div>
                <div className="text-segment-content">
                  {item.text.substring(0, 15)}
                  {item.text.length > 15 ? '...' : ''}
                </div>
              </div>
            )}
            {item.type === 'video' && (
              <div className="video-title">
                {item.title || item.displayPath || item.filePath || item.filename || 'Unnamed Video'}
              </div>
            )}
            {item.type === 'audio' && (
              <div className="audio-segment-preview">
                <div className="audio-segment-icon">🎵</div>
                <div className="audio-segment-content">
                  {(item.audioFileName || 'Unnamed Audio').split('/').pop().substring(0, 15)}
                  {(item.audioFileName || '').length > 15 ? '...' : ''}
                </div>
              </div>
            )}
            <div
              className="resize-handle resize-right"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, item, layerIndex, 'right');
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineLayer;
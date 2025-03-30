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
  const isAudioLayer = layer.some(item => item.type === 'audio');

  return (
    <div className="layer">
      <div className="layer-label">{isAudioLayer ? `Layer ${layerIndex}` : `Layer ${layerIndex}`}</div>
      <div className="layer-items">
        {layer.map((item, index) => {
          const style = {
            left: `${item.startTime * timeScale}px`,
            width: `${item.duration * timeScale}px`,
            backgroundImage: item.thumbnail ? `url(${item.thumbnail})` : (item.type === 'image' && item.filePath ? `url(${item.filePath})` : item.type === 'audio' ? `url(${item.waveformImage})` : 'none'),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: item.type === 'video' && !item.thumbnail ? '#4285f4' : item.type === 'image' && !item.thumbnail && !item.filePath ? '#ff5722' : item.type === 'audio' ? 'transparent' : 'transparent',
            zIndex: index,
            top: '5px',
          };
          return (
            <div
              key={item.id}
              className={`timeline-item ${
                item.type === 'text' ? 'text-segment' : item.type === 'image' ? 'image-segment' : item.type === 'audio' ? 'audio-segment' : 'video-segment'
              } ${item.id === playingVideoId ? 'playing' : ''} ${
                item.id === selectedSegmentId ? 'selected' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, item, layerIndex)}
              style={style}
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
              {(item.type === 'video' || item.type === 'image' || item.type === 'audio') && (
                <div className="video-title">
                  {item.type === 'video'
                    ? (item.title || item.displayPath || item.filePath || item.filename || 'Unnamed Video')
                    : item.type === 'image'
                    ? (item.fileName || 'Unnamed Image')
                    : (item.displayName || 'Unnamed Audio')}
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
          );
        })}
      </div>
    </div>
  );
};

export default TimelineLayer;
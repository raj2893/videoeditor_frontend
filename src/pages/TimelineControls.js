// TimelineControls.js
import React from 'react';

const TimelineControls = ({
  isPlaying,
  togglePlayback,
  currentTime,
  totalDuration,
  formatTime,
  historyIndex,
  history,
  handleUndo,
  handleRedo,
  isSaving,
  timeScale,
  setTimeScale,
  openAddTextDialog,
  toggleSplitMode,
  isSplitMode,
}) => {
  return (
    <div className="timeline-controls">
      <button onClick={togglePlayback}>
        {isPlaying ? '⏸️ Pause' : '▶️ Play'}
      </button>
      <span className="time-display">
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </span>
      <div className="history-controls">
        <button onClick={handleUndo} disabled={historyIndex <= 0}>
          ↩️ Undo
        </button>
        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
          ↪️ Redo
        </button>
        {isSaving && <span className="saving-indicator">Saving...</span>}
      </div>
      <div className="add-text-control">
        <button onClick={openAddTextDialog}>Add Text</button>
      </div>
      <div className="split-control">
        <button
          onClick={toggleSplitMode}
          className={isSplitMode ? 'active' : ''}
          title="Split Segment"
        >
          ✂️
        </button>
      </div>
      <div className="zoom-controls">
        <button onClick={() => setTimeScale(prev => Math.max(20, prev - 10))}>-</button>
        <span>Zoom: {timeScale}px/s</span>
        <button onClick={() => setTimeScale(prev => prev + 10)}>+</button>
      </div>
    </div>
  );
};

export default TimelineControls;
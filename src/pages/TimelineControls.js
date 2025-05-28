import React from 'react';

const TimelineControls = ({
  isPlaying,
  togglePlayback,
  currentTime,
  totalDuration,
  formatTime,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  isSaving,
  onAddTextClick,
  toggleSplitMode,
  isSplitMode,
}) => {
  return (
    <div className="timeline-controls">
      <button onClick={togglePlayback}>
        <span className="button-icon">{isPlaying ? '⏸️' : '▶️'}</span>
        <span className="button-text">{isPlaying ? 'Pause' : 'Play'}</span>
      </button>
      <span className="time-display">
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </span>
      <div className="add-text-control">
        <button onClick={onAddTextClick}>
          <span className="button-text">Add Text</span>
        </button>
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
      {isSaving && <span className="saving-indicator">Saving...</span>}
    </div>
  );
};

export default TimelineControls;
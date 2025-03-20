// TimelineRuler.js
import React from 'react';

const TimelineRuler = ({ totalDuration, timeScale, formatTime }) => {
  // Generate time markers for the ruler
  const generateTimeMarkers = () => {
    const markers = [];
    const markerInterval = 1; // Show a marker every second
    const numMarkers = Math.ceil(totalDuration / markerInterval);

    for (let i = 0; i <= numMarkers; i++) {
      const time = i * markerInterval;
      markers.push(
        <div
          key={`marker-${i}`}
          className="time-marker"
          style={{ left: `${time * timeScale}px` }}
        >
          <div className="marker-line"></div>
          <div className="marker-label">{formatTime(time)}</div>
        </div>
      );
    }

    return markers;
  };

  return <div className="timeline-ruler">{generateTimeMarkers()}</div>;
};

export default TimelineRuler;
// SnapIndicators.js
import React from 'react';

const SnapIndicators = ({ snapIndicators, timeScale, layers }) => {
  return (
    <>
      {snapIndicators.map((indicator, index) => (
        <div
          key={`snap-${index}`}
          className={`snap-indicator ${indicator.edge === 'end' ? 'snap-end' : 'snap-start'} ${indicator.time === 0 ? 'snap-timeline-start' : ''}`}
          style={{
            left: `${indicator.time * timeScale}px`,
            top: `${(layers.length - indicator.layerIdx) * 80}px`,
            height: '80px'
          }}
        />
      ))}
    </>
  );
};

export default SnapIndicators;
import React from 'react';

const SnapIndicators = ({ snapIndicators, timeScale, layers }) => {
  const layerIndices = Object.keys(layers).map(idx => parseInt(idx)).sort((a, b) => a - b);
  const totalLayers = layerIndices.length;

  return (
    <>
      {snapIndicators.map((indicator, index) => {
        const layerIndex = indicator.layerIdx >= 0 ? layerIndices.indexOf(indicator.layerIdx) : layerIndices.indexOf(indicator.layerIdx);
        return (
          <div
            key={`snap-${index}`}
            className={`snap-indicator ${indicator.edge === 'end' ? 'snap-end' : 'snap-start'} ${indicator.time === 0 ? 'snap-timeline-start' : ''}`}
            style={{
              left: `${indicator.time * timeScale}px`,
              top: `${(totalLayers - layerIndex) * 40}px`,
              height: '40px',
            }}
          />
        );
      })}
    </>
  );
};

export default SnapIndicators;
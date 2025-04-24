import React from 'react';

const KeyframeControls = ({
  selectedSegment,
  keyframes,
  currentTimeInSegment,
  tempSegmentValues,
  editingProperty,
  setTempSegmentValues,
  setEditingProperty,
  toggleKeyframe,
  navigateKeyframes,
  updateSegmentProperty,
  handleTimeUpdate,
  areTimesEqual,
  getValueAtTime,
  setCurrentTimeInSegment, // Add this to the destructured props
}) => {
  if (!selectedSegment) return null;

  let properties = [];
  switch (selectedSegment.type) {
    case 'video':
      properties = [
        { name: 'positionX', label: 'Position X', unit: 'px', step: 1, min: -9999, max: 9999 },
        { name: 'positionY', label: 'Position Y', unit: 'px', step: 1, min: -9999, max: 9999 },
        { name: 'scale', label: 'Scale', unit: '', step: 0.01, min: 0.1, max: 5 },
        { name: 'opacity', label: 'Opacity', unit: '', step: 0.01, min: 0, max: 1 },
      ];
      break;
    case 'image':
      properties = [
        { name: 'positionX', label: 'Position X', unit: 'px', step: 1, min: -9999, max: 9999 },
        { name: 'positionY', label: 'Position Y', unit: 'px', step: 1, min: -9999, max: 9999 },
        { name: 'scale', label: 'Scale', unit: '', step: 0.01, min: 0.1, max: 5 },
        { name: 'opacity', label: 'Opacity', unit: '', step: 0.01, min: 0, max: 1 },
      ];
      break;
    case 'text':
      properties = [
        { name: 'positionX', label: 'Position X', unit: 'px', step: 1, min: -9999, max: 9999 },
        { name: 'positionY', label: 'Position Y', unit: 'px', step: 1, min: -9999, max: 9999 },
        { name: 'scale', label: 'Scale', unit: '', step: 0.01, min: 0.1, max: 5 },
        { name: 'opacity', label: 'Opacity', unit: '', step: 0.01, min: 0, max: 1 },
      ];
      break;
    case 'audio':
      properties = [
        { name: 'volume', label: 'Volume', unit: '', step: 0.01, min: 0, max: 1 },
      ];
      break;
    default:
      return null;
  }

  const startDragging = (e, property) => {
    e.preventDefault();
    const initialX = e.clientX;
    const initialValue = parseFloat(
      tempSegmentValues[property.name] ||
      selectedSegment[property.name] ||
      (property.name === 'scale' || property.name === 'opacity' ? 1 : 0)
    );
    const step = property.step;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialX;
      const sensitivity = step < 1 ? 0.1 : 1;
      let newValue = initialValue + (deltaX * step * sensitivity);
      newValue = Math.max(property.min, Math.min(property.max, newValue));
      newValue = Math.round(newValue / step) * step;
      setTempSegmentValues((prev) => ({ ...prev, [property.name]: newValue }));
      updateSegmentProperty(property.name, newValue);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleValueClick = (property) => {
    setEditingProperty(property.name);
  };

  const handleInputChange = (e, property) => {
    let newValue = parseFloat(e.target.value);
    if (isNaN(newValue)) return;
    newValue = Math.max(property.min, Math.min(property.max, newValue));
    newValue = Math.round(newValue / property.step) * property.step;
    setTempSegmentValues((prev) => ({ ...prev, [property.name]: newValue }));
    updateSegmentProperty(property.name, newValue);
  };

  const handleInputKeyDown = (e, property) => {
    if (e.key === 'Enter') {
      setEditingProperty(null);
    }
  };

  const handleInputBlur = (property) => {
    setEditingProperty(null);
  };

  return (
    <div className="keyframe-section">
      {properties.map((prop) => {
        const hasKeyframes = keyframes[prop.name] && keyframes[prop.name].length > 0;
        const isAtKeyframe = hasKeyframes && keyframes[prop.name].some((kf) => areTimesEqual(kf.time, currentTimeInSegment));
        const currentValue = hasKeyframes
          ? getValueAtTime(keyframes[prop.name], currentTimeInSegment)
          : (tempSegmentValues[prop.name] !== undefined
             ? tempSegmentValues[prop.name]
             : selectedSegment[prop.name] || (prop.name === 'scale' || prop.name === 'opacity' ? 1 : 0));
        const miniTimelineWidth = 200;
        const duration = selectedSegment.duration;

        return (
          <div key={prop.name} className="property-row">
            <div className="property-header">
              <button
                className={`keyframe-toggle ${isAtKeyframe ? 'active' : ''}`}
                onClick={() => toggleKeyframe(prop.name)}
                title="Toggle Keyframe"
              >
                ⏱
              </button>
              <label>{prop.label}</label>
            </div>
            <div className="property-controls">
              {editingProperty === prop.name ? (
                <input
                  type="text"
                  className="value-scrubber"
                  defaultValue={currentValue.toFixed(prop.step < 1 ? 2 : 0)}
                  onChange={(e) => handleInputChange(e, prop)}
                  onKeyDown={(e) => handleInputKeyDown(e, prop)}
                  onBlur={() => handleInputBlur(prop)}
                  autoFocus
                  style={{ width: '60px', textAlign: 'center' }}
                />
              ) : (
                <div
                  className="value-scrubber"
                  onClick={() => handleValueClick(prop)}
                  onMouseDown={(e) => startDragging(e, prop)}
                >
                  {currentValue.toFixed(prop.step < 1 ? 2 : 0)} {prop.unit}
                </div>
              )}
              <div className="keyframe-nav">
                <button
                  onClick={() => navigateKeyframes(prop.name, 'prev')}
                  disabled={!hasKeyframes}
                >
                  ◄
                </button>
                <button
                  onClick={() => navigateKeyframes(prop.name, 'next')}
                  disabled={!hasKeyframes}
                >
                  ►
                </button>
              </div>
            </div>
            <div className="mini-timeline">
              <div
                className="mini-playhead"
                style={{ left: `${(currentTimeInSegment / duration) * miniTimelineWidth}px` }}
              />
              {(keyframes[prop.name] || []).map((kf, index) => (
                <div
                  key={index}
                  className="keyframe-marker"
                  style={{ left: `${(kf.time / duration) * miniTimelineWidth}px` }}
                  onClick={() => {
                    setTempSegmentValues((prev) => ({ ...prev, [prop.name]: kf.value }));
                    setCurrentTimeInSegment(kf.time);
                    handleTimeUpdate(selectedSegment.startTime + kf.time);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KeyframeControls;
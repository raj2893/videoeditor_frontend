// SegmentPropertiesPanel.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CSS/SegmentPropertiesPanel.css';

const API_BASE_URL = 'http://localhost:8080';

const SegmentPropertiesPanel = ({ segment, onUpdate, projectId, sessionId, onClose }) => {
  const [positionX, setPositionX] = useState(segment?.positionX || 50);
  const [positionY, setPositionY] = useState(segment?.positionY || 50);
  const [scale, setScale] = useState(segment?.scale || 1);

  useEffect(() => {
    if (segment) {
      setPositionX(segment.positionX || 50);
      setPositionY(segment.positionY || 50);
      setScale(segment.scale || 1);
    }
  }, [segment]);

  const handleChange = async (field, value) => {
    const token = localStorage.getItem('token');
    const updatedSegment = { ...segment, [field]: value };

    // Update local state for live preview
    if (field === 'positionX') setPositionX(value);
    if (field === 'positionY') setPositionY(value);
    if (field === 'scale') setScale(value);

    // Notify parent for live preview
    onUpdate(updatedSegment);

    // Send API request to update backend
    try {
      if (segment.type === 'text') {
        await axios.put(
          `${API_BASE_URL}/projects/${projectId}/update-text`,
          {
            segmentId: segment.id,
            text: segment.text,
            fontFamily: segment.fontFamily,
            fontSize: segment.fontSize,
            fontColor: segment.fontColor,
            backgroundColor: segment.backgroundColor,
            positionX: field === 'positionX' ? value : segment.positionX,
            positionY: field === 'positionY' ? value : segment.positionY,
            timelineStartTime: segment.startTime,
            timelineEndTime: segment.startTime + segment.duration,
            layer: segment.layer,
          },
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.put(
          `${API_BASE_URL}/projects/${projectId}/update-segment`,
          {
            segmentId: segment.id,
            positionX: field === 'positionX' ? value : segment.positionX,
            positionY: field === 'positionY' ? value : segment.positionY,
            scale: field === 'scale' ? value : segment.scale,
            timelineStartTime: segment.startTime,
            timelineEndTime: segment.startTime + segment.duration,
            layer: segment.layer,
            startTime: 0,
            endTime: segment.duration,
          },
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      console.error('Error updating segment properties:', error);
    }
  };

  if (!segment) return null;

  return (
    <div className="segment-properties-panel">
      <div className="panel-header">
        <h3>Segment Properties</h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="panel-content">
        <div className="form-group">
          <label>Position X (%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={positionX}
            onChange={(e) => handleChange('positionX', parseInt(e.target.value))}
          />
          <span>{positionX}%</span>
        </div>
        <div className="form-group">
          <label>Position Y (%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={positionY}
            onChange={(e) => handleChange('positionY', parseInt(e.target.value))}
          />
          <span>{positionY}%</span>
        </div>
        {segment.type === 'video' && (
          <div className="form-group">
            <label>Scale</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={scale}
              onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
            />
            <span>{scale.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentPropertiesPanel;
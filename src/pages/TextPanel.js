import React from 'react';
import '../CSS/TextPanel.css';

const TextPanel = ({ textSettings, updateTextSettings, isTextEmpty }) => {
  return (
    <div className="section-content tool-subpanel text-tool-panel">
      <h3>Text Settings</h3>
      <div className="control-group">
        <label>Text Content</label>
        <textarea
          value={textSettings.text}
          onChange={(e) => updateTextSettings({ ...textSettings, text: e.target.value })}
          rows="4"
          style={{
            width: '100%',
            resize: 'vertical',
            padding: '8px',
            fontSize: '14px',
            borderRadius: '4px',
            border: isTextEmpty ? '2px solid red' : '1px solid #ccc',
            boxSizing: 'border-box',
          }}
          placeholder={isTextEmpty ? 'Text cannot be empty' : 'Enter text (press Enter for new line)'}
        />
      </div>
      <div className="control-group">
        <label>Font Family</label>
        <select
          value={textSettings.fontFamily}
          onChange={(e) => updateTextSettings({ ...textSettings, fontFamily: e.target.value })}
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Impact">Impact</option>
        </select>
      </div>
      <div className="control-group">
        <label>Font Color</label>
        <input
          type="color"
          value={textSettings.fontColor}
          onChange={(e) => updateTextSettings({ ...textSettings, fontColor: e.target.value })}
        />
      </div>
      <div className="control-group">
        <label>Background Color</label>
        <input
          type="color"
          value={textSettings.backgroundColor === 'transparent' ? '#000000' : textSettings.backgroundColor}
          onChange={(e) =>
            updateTextSettings({
              ...textSettings,
              backgroundColor: e.target.value === '#000000' ? 'transparent' : e.target.value,
            })
          }
        />
      </div>
      <div className="control-group">
        <label>Background Opacity</label>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={textSettings.backgroundOpacity}
            onChange={(e) => updateTextSettings({ ...textSettings, backgroundOpacity: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            value={textSettings.backgroundOpacity}
            onChange={(e) => updateTextSettings({ ...textSettings, backgroundOpacity: parseFloat(e.target.value) || 1.0 })}
            step="0.01"
            min="0"
            max="1"
            style={{ width: '60px', marginLeft: '10px' }}
          />
        </div>
      </div>
      <div className="control-group">
        <label>Background Border Width</label>
        <input
          type="number"
          value={textSettings.backgroundBorderWidth}
          onChange={(e) => updateTextSettings({ ...textSettings, backgroundBorderWidth: parseInt(e.target.value) || 0 })}
          min="0"
          step="1"
          style={{ width: '60px' }}
        />
      </div>
      <div className="control-group">
        <label>Background Border Color</label>
        <input
          type="color"
          value={textSettings.backgroundBorderColor}
          onChange={(e) => updateTextSettings({ ...textSettings, backgroundBorderColor: e.target.value })}
        />
      </div>
      <div className="control-group">
        <label>Background Height</label>
        <input
          type="number"
          value={textSettings.backgroundH}
          onChange={(e) => updateTextSettings({ ...textSettings, backgroundH: parseInt(e.target.value) })}
          min="0"
          step="1"
          style={{ width: '60px' }}
        />
      </div>
      <div className="control-group">
        <label>Background Width</label>
        <input
          type="number"
          value={textSettings.backgroundW}
          onChange={(e) => updateTextSettings({ ...textSettings, backgroundW: parseInt(e.target.value) })}
          min="0"
          step="1"
          style={{ width: '60px' }}
        />
      </div>
      <div className="control-group">
        <label>Background Border Radius</label>
        <input
          type="number"
          value={textSettings.backgroundBorderRadius}
          onChange={(e) => updateTextSettings({ ...textSettings, backgroundBorderRadius: parseInt(e.target.value) || 0 })}
          min="0"
          step="1"
          style={{ width: '60px' }}
        />
      </div>
      <div className="control-group">
        <label>Text Border Color</label>
        <input
          type="color"
          value={textSettings.textBorderColor === 'transparent' ? '#000000' : textSettings.textBorderColor}
          onChange={(e) =>
            updateTextSettings({
              ...textSettings,
              textBorderColor: e.target.value === '#000000' ? 'transparent' : e.target.value,
            })
          }
        />
      </div>
      <div className="control-group">
        <label>Text Border Width</label>
        <input
          type="number"
          value={textSettings.textBorderWidth}
          onChange={(e) => updateTextSettings({ ...textSettings, textBorderWidth: parseInt(e.target.value) || 0 })}
          min="0"
          step="1"
          style={{ width: '60px' }}
        />
      </div>
      <div className="control-group">
        <label>Text Border Opacity</label>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={textSettings.textBorderOpacity}
            onChange={(e) => updateTextSettings({ ...textSettings, textBorderOpacity: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            value={textSettings.textBorderOpacity}
            onChange={(e) => updateTextSettings({ ...textSettings, textBorderOpacity: parseFloat(e.target.value) || 1.0 })}
            step="0.01"
            min="0"
            max="1"
            style={{ width: '60px', marginLeft: '10px' }}
          />
        </div>
      </div>
      <div className="control-group">
        <label>Letter Spacing (px)</label>
        <input
          type="number"
          value={textSettings.letterSpacing}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            if (value >= 0) {
              updateTextSettings({ ...textSettings, letterSpacing: value });
            }
          }}
          min="0"
          step="0.1"
          style={{ width: '60px' }}
        />
      </div>
      <div className="control-group">
        <label>Line Spacing</label>
        <input
          type="number"
          value={textSettings.lineSpacing}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            if (value >= 0) {
              updateTextSettings({ ...textSettings, lineSpacing: value });
            }
          }}
          min="0"
          step="0.1"
          style={{ width: '60px' }}
        />
      </div>
      <div className="control-group">
        <label>Alignment</label>
        <select
          value={textSettings.alignment}
          onChange={(e) => updateTextSettings({ ...textSettings, alignment: e.target.value })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
};

export default TextPanel;
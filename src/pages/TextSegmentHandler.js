import React from 'react';
import axios from 'axios';

const TextSegmentHandler = ({
  projectId,
  sessionId,
  videoLayers,
  setVideoLayers,
  saveHistory,
  autoSave,
  loadProjectTimeline,
  API_BASE_URL,
  timelineRef
}) => {
  const addTextToTimeline = async (targetLayer = 0, startTime = 0, updatedTextSettings) => {
    if (!sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      const textEndTime = startTime + (updatedTextSettings.duration || 5);
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-text`,
        {
          text: updatedTextSettings.text,
          layer: targetLayer,
          timelineStartTime: startTime,
          timelineEndTime: textEndTime,
          fontFamily: updatedTextSettings.fontFamily,
          fontSize: updatedTextSettings.fontSize,
          fontColor: updatedTextSettings.fontColor,
          backgroundColor: updatedTextSettings.backgroundColor,
          positionX: updatedTextSettings.positionX,
          positionY: updatedTextSettings.positionY,
        },
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      loadProjectTimeline();
    } catch (error) {
      console.error('Error adding text to timeline:', error);
    }
  };

  const updateTextSegment = async (segmentId, updatedTextSettings, newStartTime = null, newLayer = null) => {
    if (!sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      const requestBody = {
        segmentId,
        text: updatedTextSettings.text,
        fontFamily: updatedTextSettings.fontFamily,
        fontSize: updatedTextSettings.fontSize,
        fontColor: updatedTextSettings.fontColor,
        backgroundColor: updatedTextSettings.backgroundColor,
        positionX: updatedTextSettings.positionX,
        positionY: updatedTextSettings.positionY,
      };
      if (newStartTime !== null) {
        requestBody.timelineStartTime = newStartTime;
        requestBody.timelineEndTime = newStartTime + (updatedTextSettings.duration || 5);
      }
      if (newLayer !== null) requestBody.layer = newLayer;
      await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-text`,
        requestBody,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`Updated text segment ${segmentId}`);
    } catch (error) {
      console.error('Error updating text segment:', error);
    }
  };

  const handleTextDrop = async (e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators) => {
    if (!sessionId || !timelineRef.current) return null;
    const timelineRect = timelineRef.current.getBoundingClientRect(); // Use ref instead of e.currentTarget
    const layerHeight = 40;
    const reversedIndex = Math.floor((mouseY - timelineRect.top) / layerHeight);
    let targetLayer = videoLayers.length - reversedIndex;
    if (reversedIndex < 0) targetLayer = videoLayers.length;
    targetLayer = Math.max(0, Math.min(targetLayer, videoLayers.length));

    if (!draggingItem) {
      const dataString = e.dataTransfer.getData('application/json');
      if (dataString) {
        const data = JSON.parse(dataString);
        if (data.type === 'text') {
          const dropTimePosition = (mouseX - timelineRect.left) / timeScale;
          return { layer: targetLayer, startTime: dropTimePosition, isNew: true };
        }
      }
      return null;
    }

    if (draggingItem.type !== 'text') return null;

    let actualLayerIndex = targetLayer;
    const newStartTime = snapIndicators.length > 0
      ? snapIndicators[0].time - (snapIndicators[0].edge === 'end' ? draggingItem.duration : 0)
      : (mouseX - timelineRect.left) / timeScale - dragOffset;
    const adjustedStartTime = Math.max(0, newStartTime);
    let newVideoLayers = [...videoLayers];
    while (newVideoLayers.length <= actualLayerIndex) newVideoLayers.push([]);

    const hasOverlap = newVideoLayers[actualLayerIndex].some(video => {
      if (draggingItem && video.id === draggingItem.id) return false;
      const videoStart = video.startTime;
      const videoEnd = videoStart + video.duration;
      const newVideoEnd = adjustedStartTime + draggingItem.duration;
      return (adjustedStartTime < videoEnd && newVideoEnd > videoStart);
    });

    if (hasOverlap) {
      console.log('Overlap detected. Cannot place item here.');
      return null;
    }

    if (actualLayerIndex === dragLayer) {
      newVideoLayers[actualLayerIndex] = newVideoLayers[actualLayerIndex].filter(v => v.id !== draggingItem.id);
    } else {
      newVideoLayers[dragLayer] = newVideoLayers[dragLayer].filter(v => v.id !== draggingItem.id);
    }
    const updatedItem = { ...draggingItem, startTime: adjustedStartTime, layer: actualLayerIndex };
    newVideoLayers[actualLayerIndex].push(updatedItem);
    setVideoLayers(newVideoLayers);
    saveHistory(newVideoLayers, []);
    autoSave(newVideoLayers, []);
    await updateTextSegment(draggingItem.id, updatedItem, adjustedStartTime, actualLayerIndex);
    return null;
  };

  const handleSaveTextSegment = async (updatedTextSettings, editingTextSegment) => {
    if (!editingTextSegment) {
      console.error('editingTextSegment is undefined');
      return;
    }
    if (editingTextSegment.isNew) {
      await addTextToTimeline(editingTextSegment.layer, editingTextSegment.startTime, updatedTextSettings);
      const tempId = `text-temp-${Date.now()}`;
      const newTextSegment = {
        id: tempId,
        type: 'text',
        text: updatedTextSettings.text,
        startTime: editingTextSegment.startTime,
        duration: updatedTextSettings.duration || 5,
        layer: editingTextSegment.layer,
        fontFamily: updatedTextSettings.fontFamily,
        fontSize: updatedTextSettings.fontSize,
        fontColor: updatedTextSettings.fontColor,
        backgroundColor: updatedTextSettings.backgroundColor,
        positionX: updatedTextSettings.positionX,
        positionY: updatedTextSettings.positionY,
      };
      const newVideoLayers = [...videoLayers];
      while (newVideoLayers.length <= editingTextSegment.layer) newVideoLayers.push([]);
      newVideoLayers[editingTextSegment.layer].push(newTextSegment);
      setVideoLayers(newVideoLayers);
      saveHistory(newVideoLayers, []); // Pass empty audioLayers since only videoLayers changed
      autoSave(newVideoLayers, []); // Pass empty audioLayers since only videoLayers changed
      await loadProjectTimeline();
    } else {
      if (!editingTextSegment.id) {
        console.error('Editing text segment has no ID');
        return;
      }
      await updateTextSegment(editingTextSegment.id, updatedTextSettings);
      const newVideoLayers = videoLayers.map(layer =>
        layer.map(item =>
          item.id === editingTextSegment.id && item.type === 'text'
            ? {
                ...item,
                text: updatedTextSettings.text,
                fontFamily: updatedTextSettings.fontFamily,
                fontSize: updatedTextSettings.fontSize,
                fontColor: updatedTextSettings.fontColor,
                backgroundColor: updatedTextSettings.backgroundColor,
                positionX: updatedTextSettings.positionX,
                positionY: updatedTextSettings.positionY,
                duration: updatedTextSettings.duration || item.duration,
              }
            : item
        )
      );
      setVideoLayers(newVideoLayers);
      saveHistory(newVideoLayers, []); // Pass empty audioLayers since only videoLayers changed
      autoSave(newVideoLayers, []); // Pass empty audioLayers since only videoLayers changed
      await loadProjectTimeline();
    }
  };

  return { addTextToTimeline, updateTextSegment, handleTextDrop, handleSaveTextSegment };
};

export default TextSegmentHandler;
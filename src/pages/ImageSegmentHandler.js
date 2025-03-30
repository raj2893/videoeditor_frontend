import React from 'react';
import axios from 'axios';

const ImageSegmentHandler = ({
  projectId,
  sessionId,
  videoLayers,
  setVideoLayers,
  saveHistory,
  autoSave,
  loadProjectTimeline,
  API_BASE_URL,
  timelineRef,
}) => {
  const generateImageThumbnail = async (imagePath) => {
    const filename = imagePath.split('/').pop();
    const fullImagePath = `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(filename)}`;
    console.log(`Generating thumbnail for: ${fullImagePath}`);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fullImagePath;
      img.onload = () => {
        console.log(`Image loaded successfully: ${fullImagePath}`);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 120;
        const maxHeight = 80;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const thumbnail = canvas.toDataURL('image/jpeg');
        console.log(`Thumbnail generated: ${thumbnail.substring(0, 50)}...`);
        resolve(thumbnail);
      };
      img.onerror = () => {
        console.error(`Failed to load image for thumbnail: ${fullImagePath}`);
        resolve(null);
      };
    });
  };

  const addImageToTimeline = async (imageFileName, layer, timelineStartTime, timelineEndTime) => {
    if (!sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-project-image-to-timeline`,
        {
          imageFileName,
          layer,
          timelineStartTime,
          timelineEndTime,
        },
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await loadProjectTimeline();
    } catch (error) {
      console.error('Error adding image to timeline:', error);
    }
  };

  const updateImageSegment = async (segmentId, newStartTime, newLayer, newDuration, updatedSettings = {}) => {
    if (!sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      const layer = videoLayers[newLayer];
      const item = layer.find(i => i.id === segmentId);
      if (!item) {
        console.error(`Image segment with ID ${segmentId} not found in layer ${newLayer}`);
        return;
      }
      const duration = newDuration || item.duration;
      const requestBody = {
        segmentId,
        timelineStartTime: newStartTime,
        timelineEndTime: newStartTime + duration,
        layer: newLayer,
        positionX: updatedSettings.positionX || item.positionX || 50,
        positionY: updatedSettings.positionY || item.positionY || 50,
        scale: updatedSettings.scale || item.scale || 1,
        opacity: updatedSettings.opacity || item.opacity || 1.0,
        width: updatedSettings.width || item.width,
        height: updatedSettings.height || item.height,
        effectiveWidth: updatedSettings.effectiveWidth || item.effectiveWidth,
        effectiveHeight: updatedSettings.effectiveHeight || item.effectiveHeight,
        maintainAspectRatio: updatedSettings.maintainAspectRatio !== undefined ? updatedSettings.maintainAspectRatio : item.maintainAspectRatio,
      };
      await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-image`,
        requestBody,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`Updated image segment ${segmentId}`);
      // Removed loadProjectTimeline() to prevent overwriting local state
    } catch (error) {
      console.error('Error updating image segment:', error);
      // Optionally, reload the timeline if the update fails to ensure consistency
      await loadProjectTimeline();
    }
  };

  const handleImageDrop = async (e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId) return;
    if (!timelineRef.current) {
      console.error('Timeline ref is not available');
      return;
    }
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const layerHeight = 40;
    const relativeMouseY = mouseY - timelineRect.top;
    const timelineLayers = timelineRef.current.querySelectorAll('.timeline-layer');
    if (!timelineLayers) {
      console.error('Timeline layers not found');
      return;
    }
    const totalVideoLayers = videoLayers.length;
    const reversedIndex = Math.floor(relativeMouseY / layerHeight);
    let targetLayer;
    if (reversedIndex <= totalVideoLayers) {
      targetLayer = totalVideoLayers - reversedIndex;
    } else {
      console.log('Cannot drop image in audio layers');
      return;
    }
    targetLayer = Math.max(0, Math.min(targetLayer, videoLayers.length - 1));
    if (!draggingItem) {
      const dataString = e.dataTransfer.getData('application/json');
      if (dataString) {
        const data = JSON.parse(dataString);
        if (data.type === 'photo') {
          const photo = data.photo;
          let dropTimePosition = (mouseX - timelineRect.left) / timeScale;
          let adjustedStartTime = Math.max(0, dropTimePosition);
          const duration = photo.duration || 5;
          let newVideoLayers = [...videoLayers];
          while (newVideoLayers.length <= targetLayer) newVideoLayers.push([]);
          const targetLayerItems = newVideoLayers[targetLayer];
          let hasOverlap = true;
          while (hasOverlap) {
            hasOverlap = targetLayerItems.some(existingItem => {
              const existingStart = existingItem.startTime;
              const existingEnd = existingStart + existingItem.duration;
              const newEnd = adjustedStartTime + duration;
              return adjustedStartTime < existingEnd && newEnd > existingStart;
            });
            if (hasOverlap) {
              const overlappingItem = targetLayerItems.find(existingItem => {
                const existingStart = existingItem.startTime;
                const existingEnd = existingStart + existingItem.duration;
                const newEnd = adjustedStartTime + duration;
                return adjustedStartTime < existingEnd && newEnd > existingStart;
              });
              if (overlappingItem) {
                adjustedStartTime = overlappingItem.startTime + overlappingItem.duration;
              } else break;
            }
          }
          console.log(`Dropping photo: ${photo.fileName} at layer ${targetLayer}, time ${adjustedStartTime}`);
          await addImageToTimeline(photo.fileName, targetLayer, adjustedStartTime, adjustedStartTime + duration);
        }
      }
      return;
    }
    if (draggingItem.type !== 'image') return;
    let actualLayerIndex = targetLayer;
    const newStartTime = snapIndicators.length > 0
      ? snapIndicators[0].time - (snapIndicators[0].edge === 'end' ? draggingItem.duration : 0)
      : (mouseX - timelineRect.left) / timeScale - dragOffset;
    const adjustedStartTime = Math.max(0, newStartTime);
    let newVideoLayers = [...videoLayers];
    while (newVideoLayers.length <= actualLayerIndex) newVideoLayers.push([]);

    const hasOverlap = newVideoLayers[actualLayerIndex].some(item => {
      if (draggingItem && item.id === draggingItem.id) return false;
      const itemStart = item.startTime;
      const itemEnd = itemStart + item.duration;
      const newEnd = adjustedStartTime + draggingItem.duration;
      return adjustedStartTime < itemEnd && newEnd > itemStart;
    });
    if (hasOverlap) {
      console.log('Overlap detected. Cannot place item here.');
      return;
    }
    if (actualLayerIndex === dragLayer) {
      newVideoLayers[actualLayerIndex] = newVideoLayers[actualLayerIndex].filter(v => v.id !== draggingItem.id);
    } else {
      newVideoLayers[dragLayer] = newVideoLayers[dragLayer].filter(v => v.id !== draggingItem.id);
    }
    const updatedItem = { ...draggingItem, startTime: adjustedStartTime, layer: actualLayerIndex };
    newVideoLayers[actualLayerIndex].push(updatedItem);
    setVideoLayers(newVideoLayers); // Update state immediately
    saveHistory(newVideoLayers, []);
    autoSave(newVideoLayers, []);
    await updateImageSegment(draggingItem.id, adjustedStartTime, actualLayerIndex, draggingItem.duration, {
      positionX: draggingItem.positionX,
      positionY: draggingItem.positionY,
      scale: draggingItem.scale,
      opacity: draggingItem.opacity,
      width: draggingItem.width,
      height: draggingItem.height,
      effectiveWidth: draggingItem.effectiveWidth,
      effectiveHeight: draggingItem.effectiveHeight,
      maintainAspectRatio: draggingItem.maintainAspectRatio,
    });
  };

  return { addImageToTimeline, updateImageSegment, handleImageDrop };
};

export default ImageSegmentHandler;
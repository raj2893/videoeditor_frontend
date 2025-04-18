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
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-project-image-to-timeline`,
        {
          imageFileName,
          layer,
          timelineStartTime,
          timelineEndTime,
          positionX: 0,
          positionY: 0,
          scale: 1,
        },
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const segment = response.data;
      const thumbnail = await generateImageThumbnail(imageFileName);
      const newSegment = {
        id: segment.id,
        type: 'image',
        fileName: imageFileName,
        filePath: `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(imageFileName)}`,
        thumbnail,
        startTime: timelineStartTime,
        duration: timelineEndTime - timelineStartTime,
        layer,
        positionX: 0,
        positionY: 0,
        scale: 1,
      };
      setVideoLayers(prev => {
        const newLayers = [...prev];
        while (newLayers.length <= layer) newLayers.push([]);
        newLayers[layer].push(newSegment);
        return newLayers;
      });
      saveHistory([...videoLayers, newSegment], []);
      autoSave([...videoLayers, newSegment], []);
    } catch (error) {
      console.error('Error adding image to timeline:', error.response?.data || error.message);
      await loadProjectTimeline();
    }
  };

  const updateImageSegment = async (segmentId, newStartTime, newLayer, newDuration, updatedSettings = {}) => {
    if (!sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      // Find the item in any layer
      let item;
      for (const layer of videoLayers) {
        item = layer.find(i => i.id === segmentId);
        if (item) break;
      }
      if (!item) {
        console.error(`Image segment with ID ${segmentId} not found`);
        return;
      }
      const duration = newDuration || item.duration;
      const requestBody = {
        segmentId,
        timelineStartTime: newStartTime,
        timelineEndTime: newStartTime + duration,
        layer: newLayer,
        positionX: updatedSettings.positionX || item.positionX || 0,
        positionY: updatedSettings.positionY || item.positionY || 0,
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
    } catch (error) {
      console.error('Error updating image segment:', error.response?.data || error.message);
      await loadProjectTimeline();
    }
  };

  const handleImageDrop = async (e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId || !timelineRef.current) {
      console.error('Session ID or timeline ref is not available');
      return;
    }

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const layerHeight = 40; // Ensure this matches the CSS height of .timeline-layer
    const relativeMouseY = mouseY - timelineRect.top;
    const totalVideoLayers = videoLayers.length;

    // Calculate target layer
    const reversedIndex = Math.floor(relativeMouseY / layerHeight);
    let targetLayer = totalVideoLayers - reversedIndex; // Adjust for top-down layer order

    // Allow new layer creation if dragging above the topmost layer
    targetLayer = Math.max(0, reversedIndex < 0 ? totalVideoLayers : targetLayer);

    // Handle new photo drop from media panel
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

          // Adjust start time to avoid overlaps
          let hasOverlap = true;
          while (hasOverlap) {
            hasOverlap = targetLayerItems.some((existingItem) => {
              const existingStart = existingItem.startTime;
              const existingEnd = existingStart + existingItem.duration;
              const newEnd = adjustedStartTime + duration;
              return adjustedStartTime < existingEnd && newEnd > existingStart;
            });
            if (hasOverlap) {
              const overlappingItem = targetLayerItems.find((existingItem) => {
                const existingStart = existingItem.startTime;
                const existingEnd = existingItem.startTime + existingItem.duration;
                const newEnd = adjustedStartTime + duration;
                return adjustedStartTime < existingEnd && newEnd > existingStart;
              });
              if (overlappingItem) {
                adjustedStartTime = overlappingItem.startTime + overlappingItem.duration;
              } else {
                break;
              }
            }
          }

          const imageFileName = photo.fileName;
          console.log('Dropping new photo:', { imageFileName, targetLayer, adjustedStartTime });
          await addImageToTimeline(imageFileName, targetLayer, adjustedStartTime, adjustedStartTime + duration);
        }
      }
      return;
    }

    // Handle moving existing image segment
    if (draggingItem.type !== 'image') {
      console.log('Only image segments can be moved');
      return;
    }

    const newStartTime = snapIndicators.length > 0
      ? snapIndicators[0].time - (snapIndicators[0].edge === 'end' ? draggingItem.duration : 0)
      : (mouseX - timelineRect.left) / timeScale - dragOffset;
    const adjustedStartTime = Math.max(0, newStartTime);

    let newVideoLayers = [...videoLayers];
    while (newVideoLayers.length <= targetLayer) newVideoLayers.push([]);

    // Check for overlaps in the target layer
    const hasOverlap = newVideoLayers[targetLayer].some((item) => {
      if (item.id === draggingItem.id) return false; // Ignore the dragging item itself
      const itemStart = item.startTime;
      const itemEnd = itemStart + item.duration;
      const newEnd = adjustedStartTime + draggingItem.duration;
      return adjustedStartTime < itemEnd && newEnd > itemStart;
    });

    if (hasOverlap) {
      console.log('Cannot move image: Overlap detected in target layer');
      return;
    }

    // Remove from source layer
    newVideoLayers[dragLayer] = newVideoLayers[dragLayer].filter((v) => v.id !== draggingItem.id);

    // Add to target layer
    const updatedItem = { ...draggingItem, startTime: adjustedStartTime, layer: targetLayer };
    newVideoLayers[targetLayer].push(updatedItem);

    setVideoLayers(newVideoLayers);
    saveHistory(newVideoLayers, []);
    autoSave(newVideoLayers, []);

    // Update backend
    await updateImageSegment(draggingItem.id, adjustedStartTime, targetLayer, draggingItem.duration, {
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

  const handleImageSplit = async (item, clickTime, layerIndex) => {
    const splitTime = clickTime - item.startTime;
    if (splitTime <= 0.1 || splitTime >= item.duration - 0.1) return;

    const firstPartDuration = splitTime;
    const secondPartDuration = item.duration - splitTime;
    let newVideoLayers = [...videoLayers];
    const layer = newVideoLayers[layerIndex];
    const itemIndex = layer.findIndex(i => i.id === item.id);

    const firstPart = { ...item, duration: firstPartDuration, timelineEndTime: item.startTime + firstPartDuration };
    layer[itemIndex] = firstPart;

    const secondPart = {
      ...item,
      id: `${item.id}-split-${Date.now()}`,
      startTime: item.startTime + splitTime,
      duration: secondPartDuration,
      timelineStartTime: item.startTime + splitTime,
      timelineEndTime: item.startTime + item.duration,
    };
    layer.push(secondPart);

    newVideoLayers[layerIndex] = layer;
    setVideoLayers(newVideoLayers);
    saveHistory(newVideoLayers, []);

    await updateImageSegment(item.id, item.startTime, layerIndex, firstPartDuration);

    const imageFileName = item.fileName.split('/').pop();
    console.log('Original item.fileName:', item.fileName);
    console.log('Sending imageFileName to backend:', imageFileName);

    try {
      await addImageToTimeline(
        imageFileName,
        layerIndex,
        secondPart.startTime,
        secondPart.startTime + secondPartDuration
      );
      console.log('Successfully added split image to timeline');
    } catch (error) {
      console.error('Error adding split image:', error.response?.data || error.message);
      throw error;
    }

    autoSave(newVideoLayers, []);
    await loadProjectTimeline();
  };

  return { addImageToTimeline, updateImageSegment, handleImageDrop, handleImageSplit };
};

export default ImageSegmentHandler;
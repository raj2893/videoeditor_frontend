import React from 'react';
import axios from 'axios';

const VideoSegmentHandler = ({
  projectId,
  sessionId,
  videoLayers,
  setVideoLayers,
  addVideoToTimeline,
  saveHistory,
  autoSave,
  loadProjectTimeline,
  API_BASE_URL,
  timelineRef,
}) => {
  const updateSegmentPosition = async (segmentId, newStartTime, newLayer, newDuration) => {
    if (!projectId || !sessionId) return;
    try {
      const token = localStorage.getItem('token');
      const layer = videoLayers[newLayer];
      const item = layer.find(i => i.id === segmentId);
      const originalDuration = item.duration;
      const timelineEndTime = newStartTime + (newDuration || originalDuration);
      const requestBody = {
        segmentId,
        timelineStartTime: newStartTime,
        timelineEndTime: timelineEndTime,
        layer: newLayer,
        startTime: item.startTimeWithinVideo || 0,
        endTime: item.endTimeWithinVideo || newDuration || originalDuration,
      };
      await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-segment`,
        requestBody,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`Updated segment ${segmentId} to start at ${newStartTime}s, end at ${timelineEndTime}s, layer ${newLayer}`);
    } catch (error) {
      console.error('Error updating segment position:', error);
    }
  };

  const handleVideoDrop = async (e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators) => {
    if (!sessionId || draggingItem?.type === 'text' || draggingItem?.type === 'audio') return;

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
    const totalAudioLayers = timelineLayers.length - totalVideoLayers - 2;
    const reversedIndex = Math.floor(relativeMouseY / layerHeight);
    let targetLayer;

    if (reversedIndex <= totalVideoLayers) {
      targetLayer = totalVideoLayers - reversedIndex;
    } else {
      console.log('Cannot drop video in audio layers');
      return;
    }

    targetLayer = Math.max(0, Math.min(targetLayer, videoLayers.length));

    if (!draggingItem) {
      const dataString = e.dataTransfer.getData('application/json');
      if (dataString) {
        const data = JSON.parse(dataString);
        if (data.type === 'media') {
          const video = data.video;
          let dropTimePosition = (mouseX - timelineRect.left) / timeScale;
          let newVideoLayers = [...videoLayers];
          while (newVideoLayers.length <= targetLayer) newVideoLayers.push([]);
          const targetLayerVideos = newVideoLayers[targetLayer];
          let adjustedStartTime = Math.max(0, dropTimePosition);
          let hasOverlap = true;
          while (hasOverlap) {
            hasOverlap = targetLayerVideos.some(existingVideo => {
              const existingStart = existingVideo.startTime;
              const existingEnd = existingStart + existingVideo.duration;
              const newVideoEnd = adjustedStartTime + video.duration;
              return (adjustedStartTime < existingEnd && newVideoEnd > existingStart);
            });
            if (hasOverlap) {
              const overlappingVideo = targetLayerVideos.find(existingVideo => {
                const existingStart = existingVideo.startTime;
                const existingEnd = existingStart + existingVideo.duration;
                const newVideoEnd = adjustedStartTime + video.duration;
                return (adjustedStartTime < existingEnd && newVideoEnd > existingStart);
              });
              if (overlappingVideo) {
                adjustedStartTime = overlappingVideo.startTime + overlappingVideo.duration;
              } else break;
            }
          }
          await addVideoToTimeline(video.filePath, targetLayer, adjustedStartTime, null);
          loadProjectTimeline();
        }
      }
      return;
    }

    if (draggingItem.type !== 'video') return;

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
      return;
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
    await updateSegmentPosition(draggingItem.id, adjustedStartTime, actualLayerIndex);
  };

  const handleVideoSplit = async (item, clickTime, layerIndex) => {
    const splitTime = clickTime - item.startTime;
    if (splitTime <= 0.1 || splitTime >= item.duration - 0.1) return;

    const firstPartDuration = splitTime;
    const secondPartDuration = item.duration - splitTime;
    let newVideoLayers = [...videoLayers];
    const layer = newVideoLayers[layerIndex];
    const itemIndex = layer.findIndex(i => i.id === item.id);

    const originalVideoStartTime = item.startTimeWithinVideo || 0;
    const originalVideoEndTime = item.endTimeWithinVideo || item.duration;

    const firstPart = {
      ...item,
      duration: firstPartDuration,
      endTimeWithinVideo: originalVideoStartTime + firstPartDuration,
    };
    layer[itemIndex] = firstPart;

    const secondPart = {
      ...item,
      id: `${item.id}-split-${Date.now()}`,
      startTime: item.startTime + splitTime,
      duration: secondPartDuration,
      startTimeWithinVideo: originalVideoStartTime + firstPartDuration,
      endTimeWithinVideo: originalVideoEndTime,
    };
    layer.push(secondPart);

    newVideoLayers[layerIndex] = layer;
    setVideoLayers(newVideoLayers);
    saveHistory(newVideoLayers, []);

    await updateSegmentPosition(item.id, item.startTime, layerIndex, firstPartDuration);
    await addVideoToTimeline(
      item.filePath || item.filename,
      layerIndex,
      secondPart.startTime,
      secondPart.startTime + secondPartDuration,
      secondPart.startTimeWithinVideo,
      secondPart.endTimeWithinVideo
    );
    autoSave(newVideoLayers, []);
    await loadProjectTimeline();
  };

  return { handleVideoDrop, updateSegmentPosition, handleVideoSplit };
};

export default VideoSegmentHandler;
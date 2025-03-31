import React from 'react';
import axios from 'axios';

const AudioSegmentHandler = ({
  projectId,
  sessionId,
  audioLayers,
  setAudioLayers,
  saveHistory,
  autoSave,
  loadProjectTimeline,
  API_BASE_URL,
  timelineRef,
}) => {
  const updateAudioSegment = async (audioSegmentId, newStartTime, newLayer, newDuration, startTimeWithinAudio, endTimeWithinAudio,draggingItem) => {
    if (!projectId || !sessionId) return;
    try {
      const token = localStorage.getItem('token');
      // Use draggingItem directly if provided, otherwise search in audioLayers
      let item = draggingItem;
      if (!item) {
        const layer = audioLayers[Math.abs(newLayer) - 1];
        item = layer.find(i => i.id === audioSegmentId);
      }
      if (!item) {
        throw new Error(`Audio segment with ID ${audioSegmentId} not found in layer ${newLayer}`);
      }
      const originalDuration = item.duration;
      const timelineEndTime = newStartTime + (newDuration || originalDuration);
      const requestBody = {
        audioSegmentId,
        timelineStartTime: newStartTime,
        timelineEndTime: timelineEndTime,
        layer: newLayer,
        startTime: startTimeWithinAudio !== undefined ? startTimeWithinAudio : item.startTimeWithinAudio || 0,
        endTime: endTimeWithinAudio !== undefined ? endTimeWithinAudio : item.endTimeWithinAudio || (item.startTimeWithinAudio || 0) + (newDuration || originalDuration),
      };
      await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-audio`,
        requestBody,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`Updated audio segment ${audioSegmentId} to start at ${newStartTime}s, end at ${timelineEndTime}s, layer ${newLayer}, startTimeWithinAudio at ${startTimeWithinAudio}s, endTimeWithinAudio at ${endTimeWithinAudio}s`);
    } catch (error) {
      console.error('Error updating audio segment:', error);
    }
  };

  const handleAudioDrop = async (e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators) => {
    if (!sessionId || !timelineRef.current) {
      console.error('Session ID or timeline ref missing');
      return undefined;
    }

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const layerHeight = 40;
    const relativeMouseY = mouseY - timelineRect.top;
    const totalVideoLayers = timelineRef.current.querySelectorAll('.timeline-layer').length - audioLayers.length - 2;
    const reversedIndex = Math.floor(relativeMouseY / layerHeight);

    // Total layers include video layers, audio layers, and two "Drop to create new layer" areas
    const audioLayerStartIndex = totalVideoLayers + 1; // After video layers and top drop area
    const audioLayerEndIndex = totalVideoLayers + 1 + audioLayers.length; // Before bottom drop area

    let targetLayerIndex;
    if (reversedIndex < audioLayerStartIndex) {
      console.log('Cannot drop audio in video layers or top drop area');
      return undefined;
    } else if (reversedIndex >= audioLayerStartIndex && reversedIndex < audioLayerEndIndex) {
      // Map directly to audio layer index (top-down order)
      targetLayerIndex = reversedIndex - audioLayerStartIndex;
    } else {
      // Dropped in bottom "Drop to create new layer" area
      targetLayerIndex = audioLayers.length; // New audio layer
    }

    targetLayerIndex = Math.max(0, targetLayerIndex);
    const backendLayer = -(targetLayerIndex + 1);

    let newAudioLayers = audioLayers.map(layer => [...layer]); // Deep copy

    if (!draggingItem) {
      const dataString = e.dataTransfer.getData('application/json');
      if (dataString) {
        const data = JSON.parse(dataString);
        if (data.type === 'audio') {
          const audio = data.audio;
          let adjustedStartTime = Math.max(0, (mouseX - timelineRect.left) / timeScale);
          while (newAudioLayers.length <= targetLayerIndex) newAudioLayers.push([]);
          const targetLayerAudios = newAudioLayers[targetLayerIndex];
          let hasOverlap = true;

          while (hasOverlap) {
            hasOverlap = targetLayerAudios.some(existing => {
              const start = existing.startTime;
              const end = start + existing.duration;
              const newEnd = adjustedStartTime + audio.duration;
              return adjustedStartTime < end && newEnd > start;
            });
            if (hasOverlap) {
              const overlapping = targetLayerAudios.find(existing => {
                const start = existing.startTime;
                const end = start + existing.duration;
                const newEnd = adjustedStartTime + audio.duration;
                return adjustedStartTime < end && newEnd > start;
              });
              adjustedStartTime = overlapping.startTime + overlapping.duration;
            }
          }

          await axios.post(
            `${API_BASE_URL}/projects/${projectId}/add-project-audio-to-timeline`,
            {
              audioFileName: audio.fileName,
              layer: backendLayer,
              timelineStartTime: adjustedStartTime,
              timelineEndTime: adjustedStartTime + audio.duration,
              startTime: 0,
              endTime: audio.duration,
            },
            {
              params: { sessionId },
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }
          );
          await loadProjectTimeline();
          return undefined;
        }
      }
      return undefined;
    }

    if (draggingItem.type !== 'audio') return undefined;

    const newStartTime = snapIndicators.length > 0
      ? snapIndicators[0].time - (snapIndicators[0].edge === 'end' ? draggingItem.duration : 0)
      : Math.max(0, (mouseX - timelineRect.left) / timeScale - dragOffset);

    console.log('Calculated newStartTime:', newStartTime); // Debug log

    while (newAudioLayers.length <= targetLayerIndex) newAudioLayers.push([]);

    const hasOverlap = newAudioLayers[targetLayerIndex].some(audio => {
      if (audio.id === draggingItem.id) return false;
      const start = audio.startTime;
      const end = start + audio.duration;
      const newEnd = newStartTime + draggingItem.duration;
      return newStartTime < end && newEnd > start;
    });

    if (hasOverlap) {
      console.log('Overlap detected. Cannot move audio here.');
      return undefined;
    }

    const sourceLayerIndex = draggingItem.layer ? Math.abs(draggingItem.layer) - 1 : -1;
    const isSameLayer = sourceLayerIndex === targetLayerIndex;

    const updatedItem = {
      ...draggingItem,
      startTime: newStartTime,
      layer: backendLayer,
      timelineStartTime: newStartTime,
      timelineEndTime: newStartTime + draggingItem.duration,
    };

    if (isSameLayer) {
      const layer = newAudioLayers[targetLayerIndex];
      const itemIndex = layer.findIndex(a => a.id === draggingItem.id);
      layer[itemIndex] = updatedItem;
    } else {
      if (sourceLayerIndex !== -1) {
        newAudioLayers[sourceLayerIndex] = newAudioLayers[sourceLayerIndex].filter(a => a.id !== draggingItem.id);
      }
      newAudioLayers[targetLayerIndex].push(updatedItem);
    }

    setAudioLayers(newAudioLayers);
    saveHistory([], newAudioLayers);
    autoSave([], newAudioLayers);
    await updateAudioSegment(
      draggingItem.id,
      newStartTime,
      backendLayer,
      draggingItem.duration,
      updatedItem.startTimeWithinAudio, // Pass startTimeWithinAudio
      updatedItem.endTimeWithinAudio ,   // Pass endTimeWithinAudio
      updatedItem
    );

    return updatedItem;
  };

  const handleAudioSplit = async (item, clickTime, layerIndex) => {
    const splitTime = clickTime - item.startTime;
    if (splitTime <= 0.1 || splitTime >= item.duration - 0.1) return;

    const firstPartDuration = splitTime;
    const secondPartDuration = item.duration - splitTime;
    let newAudioLayers = [...audioLayers];
    const layer = newAudioLayers[layerIndex];
    const itemIndex = layer.findIndex(i => i.id === item.id);

    const startWithinAudio = item.startTimeWithinAudio || 0;
    const firstPart = {
      ...item,
      duration: firstPartDuration,
      timelineEndTime: item.startTime + firstPartDuration,
      endTimeWithinAudio: startWithinAudio + firstPartDuration,
    };
    layer[itemIndex] = firstPart;

    const secondPart = {
      ...item,
      id: `${item.id}-split-${Date.now()}`,
      startTime: item.startTime + splitTime,
      timelineStartTime: item.startTime + splitTime,
      duration: secondPartDuration,
      timelineEndTime: item.startTime + item.duration,
      startTimeWithinAudio: startWithinAudio + firstPartDuration,
      endTimeWithinAudio: startWithinAudio + item.duration,
    };
    layer.push(secondPart);

    newAudioLayers[layerIndex] = layer;
    setAudioLayers(newAudioLayers);
    saveHistory([], newAudioLayers);

    await updateAudioSegment(
      item.id,
      item.startTime,
      item.layer,
      firstPartDuration,
      firstPart.startTimeWithinAudio, // Pass startTimeWithinAudio
      firstPart.endTimeWithinAudio,   // Pass endTimeWithinAudio
      firstPart
    );
    await axios.post(
      `${API_BASE_URL}/projects/${projectId}/add-project-audio-to-timeline`,
      {
        audioFileName: item.fileName,
        layer: item.layer,
        timelineStartTime: secondPart.startTime,
        timelineEndTime: secondPart.timelineEndTime,
        startTime: secondPart.startTimeWithinAudio, // Use startTimeWithinAudio
        endTime: secondPart.endTimeWithinAudio,     // Use endTimeWithinAudio
      },
      {
        params: { sessionId },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
    );
    autoSave([], newAudioLayers);
    await loadProjectTimeline();
  };

  return { handleAudioDrop, updateAudioSegment, handleAudioSplit };
};

export default AudioSegmentHandler;
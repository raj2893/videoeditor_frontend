import React, { useCallback, useEffect } from 'react';

const GeneralSegmentHandler = ({
  videoLayers,
  audioLayers,
  setVideoLayers,
  setAudioLayers,
  timeScale,
  setSnapIndicators,
  draggingItem,
  setDraggingItem,
  dragLayer,
  setDragLayer,
  dragOffset,
  setDragOffset,
  resizingItem,
  setResizingItem,
  resizeEdge,
  setResizeEdge,
  timelineRef,
  isSplitMode,
  saveHistory,
  autoSave,
  SNAP_THRESHOLD,
  updateSegmentPosition,
  updateTextSegment,
  updateImageSegment,
  updateAudioSegment,
}) => {
  const handleDragStart = (e, item, layerIndex) => {
    if (isSplitMode) return;
    setDraggingItem(item);
    setDragLayer(item.layer); // Use original layer value (negative for audio)
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    setDragOffset(offsetX / timeScale);
    e.currentTarget.classList.add('dragging');
  };

  useEffect(() => {
    const handleDragHover = (e) => {
      if (!draggingItem || !timelineRef.current) return;
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const mouseY = e.clientY - timelineRect.top;
      if (mouseY < 0) {
        timelineRef.current.classList.add('showing-new-layer-top');
      } else {
        timelineRef.current.classList.remove('showing-new-layer-top');
      }
    };
    document.addEventListener('dragover', handleDragHover);
    return () => document.removeEventListener('dragover', handleDragHover);
  }, [draggingItem]);

  const handleDragOver = (e) => {
    if (isSplitMode) return;
    e.preventDefault();
    if (!draggingItem || !timelineRef.current) return;
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - timelineRect.left;
    let potentialStartTime = (mouseX / timeScale) - dragOffset;
    potentialStartTime = Math.max(0, potentialStartTime);
    const newSnapIndicators = [];
    const snapPoints = [];
    [...videoLayers, ...audioLayers].forEach((layer, layerIdx) => {
      layer.forEach(item => {
        if (item.id === draggingItem.id) return;
        snapPoints.push({ time: item.startTime, layerIdx, type: 'start' });
        snapPoints.push({ time: item.startTime + item.duration, layerIdx, type: 'end' });
        snapPoints.push({ time: 0, layerIdx: -1, type: 'timelineStart' });
      });
    });
    let closestSnapPoint = null;
    let minDistance = SNAP_THRESHOLD;
    snapPoints.forEach(point => {
      const currentThreshold = point.time === 0 ? SNAP_THRESHOLD * 2 : SNAP_THRESHOLD;
      const distanceToStart = Math.abs(point.time - potentialStartTime);
      if (distanceToStart < minDistance) {
        minDistance = distanceToStart;
        closestSnapPoint = { time: point.time, layerIdx: point.layerIdx, type: point.type, edge: 'start' };
      }
      const itemEndTime = potentialStartTime + draggingItem.duration;
      const distanceToEnd = Math.abs(point.time - itemEndTime);
      if (distanceToEnd < minDistance) {
        minDistance = distanceToEnd;
        closestSnapPoint = { time: point.time - draggingItem.duration, layerIdx: point.layerIdx, type: point.type, edge: 'end' };
      }
    });
    if (closestSnapPoint) {
      potentialStartTime = closestSnapPoint.time;
      newSnapIndicators.push({
        time: closestSnapPoint.edge === 'start' ? potentialStartTime : potentialStartTime + draggingItem.duration,
        layerIdx: closestSnapPoint.layerIdx,
        edge: closestSnapPoint.edge,
      });
    }
    setSnapIndicators(newSnapIndicators);
  };

  const handleDragEnd = () => {
    if (!draggingItem) return;
    setSnapIndicators([]);
    const dragElements = document.querySelectorAll('.dragging');
    dragElements.forEach(el => el.classList.remove('dragging'));
    if (timelineRef.current) {
      timelineRef.current.classList.remove('showing-new-layer');
    }
    setDraggingItem(null);
    setDragLayer(null);
    setDragOffset(0);
  };

  useEffect(() => {
    document.addEventListener('dragend', handleDragEnd);
    return () => document.removeEventListener('dragend', handleDragEnd);
  }, [draggingItem]);

  const handleResizeStart = (e, item, layerIndex, edge) => {
    if (isSplitMode) return;
    e.stopPropagation();
    setResizingItem({ ...item, layerIndex });
    setResizeEdge(edge);
    e.preventDefault();
  };

  const handleResizeMove = useCallback(
    (e) => {
      if (!resizingItem || !timelineRef.current) return;
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - timelineRect.left;
      const newTime = Math.max(0, mouseX / timeScale);
      const isAudioLayer = resizingItem.layer < 0;
      const layerArray = isAudioLayer ? audioLayers : videoLayers;
      const layerIndex = isAudioLayer ? Math.abs(resizingItem.layer) - 1 : resizingItem.layerIndex;
      let newVideoLayers = [...videoLayers];
      let newAudioLayers = [...audioLayers];
      const layer = isAudioLayer ? newAudioLayers[layerIndex] : newVideoLayers[layerIndex];
      const itemIndex = layer.findIndex(i => i.id === resizingItem.id);
      if (itemIndex === -1) return;
      const item = { ...layer[itemIndex] };
      let newStartTime = item.startTime;
      let newDuration = item.duration;
      let newStartWithin = item.startTimeWithinAudio || item.startTimeWithinVideo || 0;
      let newEndWithin = item.endTimeWithinAudio || item.endTimeWithinVideo || item.duration;

      if (resizeEdge === 'left') {
        const originalEndTime = item.startTime + item.duration;
        newStartTime = Math.min(newTime, originalEndTime - 0.1);
        newDuration = originalEndTime - newStartTime;
        if (item.type === 'video' || item.type === 'audio') {
          newStartWithin = newStartWithin + (item.startTime - newStartTime);
        }
      } else if (resizeEdge === 'right') {
        const newEndTime = Math.max(newTime, item.startTime + 0.1);
        newDuration = newEndTime - item.startTime;
        if (item.type === 'video' || item.type === 'audio') {
          newEndWithin = newStartWithin + newDuration;
        }
      }

      item.startTime = newStartTime;
      item.duration = newDuration;
      item.timelineStartTime = newStartTime; // Sync timelineStartTime
      item.timelineEndTime = newStartTime + newDuration; // Sync timelineEndTime
      if (item.type === 'audio') {
        item.startTimeWithinVideo = newStartWithin;
        item.endTimeWithinVideo = newEndWithin;
      } else if (item.type === 'video') {
        item.startTimeWithinAudio = newStartWithin;
        item.endTimeWithinAudio = newEndWithin;
      }
      layer[itemIndex] = item;
      if (isAudioLayer) {
        newAudioLayers[layerIndex] = layer;
        setAudioLayers(newAudioLayers);
      } else {
        newVideoLayers[layerIndex] = layer;
        setVideoLayers(newVideoLayers);
      }
    },
    [resizingItem, resizeEdge, videoLayers, audioLayers, timeScale, setVideoLayers, setAudioLayers]
  );

  const handleResizeEnd = async () => {
    if (!resizingItem) return;
    const isAudioLayer = resizingItem.layer < 0;
    const layerArray = isAudioLayer ? audioLayers : videoLayers;
    const layerIndex = isAudioLayer ? Math.abs(resizingItem.layer) - 1 : resizingItem.layerIndex;
    const layer = layerArray[layerIndex];
    const item = layer.find(i => i.id === resizingItem.id);
    if (item) {
      saveHistory(videoLayers, audioLayers);
      autoSave(videoLayers, audioLayers);
      const newStartTime = resizeEdge === 'left' ? item.startTime : item.startTime;
      const newDuration = item.duration;
      const updatedSettings = {
        positionX: item.positionX,
        positionY: item.positionY,
        scale: item.scale,
        opacity: item.opacity,
        width: item.width,
        height: item.height,
        effectiveWidth: item.effectiveWidth,
        effectiveHeight: item.effectiveHeight,
        maintainAspectRatio: item.maintainAspectRatio,
      };
      if (item.type === 'text') {
        const updatedTextSettings = { ...item, duration: newDuration };
        await updateTextSegment(item.id, updatedTextSettings, newStartTime, item.layer);
      } else if (item.type === 'image') {
        await updateImageSegment(item.id, newStartTime, item.layer, newDuration, updatedSettings);
      } else if (item.type === 'audio') {
        await updateAudioSegment(item.id, newStartTime, item.layer, newDuration);
      } else {
        await updateSegmentPosition(item.id, newStartTime, item.layer, newDuration);
      }
    }
    setResizingItem(null);
    setResizeEdge(null);
  };

  useEffect(() => {
    if (resizingItem) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingItem, handleResizeMove, handleResizeEnd]);

  return {
    handleDragStart,
    handleDragOver,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  };
};

export default GeneralSegmentHandler;
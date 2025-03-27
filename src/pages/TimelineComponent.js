import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../CSS/Timeline.css';
import { useCallback } from 'react';
import TextSegmentDialog from './TextSegmentDialog';
import TimelineControls from './TimelineControls';
import TimelineRuler from './TimelineRuler';
import TimelineLayer from './TimelineLayer';
import SnapIndicators from './SnapIndicators';
import DraggingGhost from './DraggingGhost';

const TimelineComponent = ({
  videos,
  sessionId,
  projectId,
  totalDuration,
  setTotalDuration,
  onVideoSelect,
  canvasDimensions,
  addVideoToTimeline,
  onTimeUpdate,
  onSegmentSelect,
}) => {
  const [timelineVideos, setTimelineVideos] = useState([]);
  const [timeScale, setTimeScale] = useState(50);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layers, setLayers] = useState([[], [], []]);
  const [draggingItem, setDraggingItem] = useState(null);
  const [dragLayer, setDragLayer] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [snapIndicators, setSnapIndicators] = useState([]);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textDialogPosition, setTextDialogPosition] = useState({ x: 0, y: 0 });
  const [editingTextSegment, setEditingTextSegment] = useState(null);
  const [textSettings, setTextSettings] = useState({
    text: 'New Text',
    fontFamily: 'Arial',
    fontSize: 24,
    fontColor: '#FFFFFF',
    backgroundColor: 'transparent',
    positionX: 50,
    positionY: 50,
    duration: 5,
  });
  const [resizingItem, setResizingItem] = useState(null);
  const [resizeEdge, setResizeEdge] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isSplitMode, setIsSplitMode] = useState(false); // New state for split mode

  const SNAP_THRESHOLD = 0.5;
  const SNAP_VISUAL_INDICATOR_WIDTH = 3;

  const timelineRef = useRef(null);
  const playheadRef = useRef(null);
  const playIntervalRef = useRef(null);
  const API_BASE_URL = 'http://localhost:8080';

  useEffect(() => {
    const calculateDuration = () => {
      let maxDuration = 0;
      layers.forEach(layer => {
        layer.forEach(item => {
          const endTime = item.startTime + item.duration;
          if (endTime > maxDuration) {
            maxDuration = endTime;
          }
        });
      });
      setTotalDuration(maxDuration > 0 ? maxDuration : 0);
    };
    calculateDuration();
  }, [layers, setTotalDuration]);

  const calculateLayerEndTime = (layerIndex) => {
    if (!layers[layerIndex] || layers[layerIndex].length === 0) return 0;
    const layerVideos = layers[layerIndex];
    let maxEndTime = 0;
    layerVideos.forEach(video => {
      const endTime = video.startTime + video.duration;
      if (endTime > maxEndTime) {
        maxEndTime = endTime;
      }
    });
    return maxEndTime;
  };

  const handleDragStart = (e, item, layerIndex) => {
    if (isSplitMode) return; // Disable dragging in split mode
    setDraggingItem(item);
    setDragLayer(layerIndex);
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
    if (isSplitMode) return; // Disable drag over in split mode
    e.preventDefault();
    if (!draggingItem) return;
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - timelineRect.left;
    const mouseY = e.clientY - timelineRect.top;
    const layerHeight = 40;
    const reversedIndex = Math.floor(mouseY / layerHeight);
    let targetLayer = layers.length - 1 - reversedIndex;
    if (reversedIndex < 0) {
      targetLayer = layers.length;
      timelineRef.current.classList.add('showing-new-layer');
    } else if (targetLayer >= 0) {
      timelineRef.current.classList.remove('showing-new-layer');
    }
    let potentialStartTime = (mouseX / timeScale) - dragOffset;
    potentialStartTime = Math.max(0, potentialStartTime);
    const newSnapIndicators = [];
    if (targetLayer < layers.length) {
      const snapPoints = [];
      layers.forEach((layer, layerIdx) => {
        layer.forEach(video => {
          if (video.id === draggingItem.id) return;
          snapPoints.push({ time: video.startTime, layerIdx, type: 'start' });
          snapPoints.push({ time: video.startTime + video.duration, layerIdx, type: 'end' });
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
        const videoEndTime = potentialStartTime + draggingItem.duration;
        const distanceToEnd = Math.abs(point.time - videoEndTime);
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
    }
    setSnapIndicators(newSnapIndicators);
  };

  const handleDrop = async (e) => {
    if (isSplitMode) return; // Disable drop in split mode
    e.preventDefault();
    if (!sessionId) return;
    try {
      const dragElements = document.querySelectorAll('.dragging');
      dragElements.forEach(el => el.classList.remove('dragging'));
      if (timelineRef.current) {
        timelineRef.current.classList.remove('showing-new-layer');
      }
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - timelineRect.left;
      const mouseY = e.clientY - timelineRect.top;
      const layerHeight = 40;
      try {
        const dataString = e.dataTransfer.getData('application/json');
        if (dataString) {
          const data = JSON.parse(dataString);
          if (data.type === 'media') {
            const video = data.video;
            const reversedIndex = Math.floor(mouseY / layerHeight);
            let targetLayer = layers.length - reversedIndex;
            if (reversedIndex < 0) targetLayer = layers.length;
            targetLayer = Math.max(0, Math.min(targetLayer, layers.length));
            let dropTimePosition = mouseX / timeScale;
            let newLayers = [...layers];
            while (newLayers.length <= targetLayer) newLayers.push([]);
            const targetLayerVideos = newLayers[targetLayer];
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
            return;
          }
          if (data.type === 'text') {
            const reversedIndex = Math.floor(mouseY / layerHeight);
            let targetLayer = layers.length - reversedIndex;
            if (reversedIndex < 0) targetLayer = layers.length;
            targetLayer = Math.max(0, Math.min(targetLayer, layers.length));
            const dropTimePosition = mouseX / timeScale;
            setTextDialogPosition({ x: e.clientX, y: e.clientY });
            setShowTextDialog(true);
            setEditingTextSegment({ isNew: true, layer: targetLayer, startTime: dropTimePosition });
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing drop data:', error);
      }
      if (!draggingItem) return;
      const dropAreaRect = document.querySelector('.new-layer-drop-area').getBoundingClientRect();
      const isNewLayerDrop = e.clientY >= dropAreaRect.top && e.clientY <= dropAreaRect.bottom;
      let actualLayerIndex = isNewLayerDrop ? layers.length : layers.length - Math.floor(mouseY / layerHeight);
      actualLayerIndex = Math.max(0, Math.min(actualLayerIndex, layers.length - 1));
      const newStartTime = snapIndicators.length > 0 ?
        snapIndicators[0].time - (snapIndicators[0].edge === 'end' ? draggingItem.duration : 0) :
        (mouseX / timeScale) - dragOffset;
      const adjustedStartTime = Math.max(0, newStartTime);
      let newLayers = [...layers];
      while (newLayers.length <= actualLayerIndex) newLayers.push([]);
      const hasOverlap = newLayers[actualLayerIndex].some(video => {
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
        newLayers[actualLayerIndex] = newLayers[actualLayerIndex].filter(v => v.id !== draggingItem.id);
      } else {
        newLayers[dragLayer] = newLayers[dragLayer].filter(v => v.id !== draggingItem.id);
      }
      const updatedItem = { ...draggingItem, startTime: adjustedStartTime, layer: actualLayerIndex };
      newLayers[actualLayerIndex].push(updatedItem);
      setLayers(newLayers);
      saveHistory(newLayers);
      autoSave(newLayers);
      if (draggingItem.type === 'text') {
        await updateTextSegment(
          draggingItem.id,
          { ...draggingItem, startTime: adjustedStartTime, layer: actualLayerIndex },
          adjustedStartTime,
          actualLayerIndex
        );
      } else {
        await updateSegmentPosition(draggingItem.id, adjustedStartTime, actualLayerIndex);
      }
      setDraggingItem(null);
      setDragLayer(null);
      setDragOffset(0);
      setSnapIndicators([]);
    } catch (error) {
      console.error('Error updating item position:', error);
      setSnapIndicators([]);
    }
  };

  const handleDragEnd = () => {
    if (!draggingItem) return;
    setSnapIndicators([]);
    const dragElements = document.querySelectorAll('.dragging');
    dragElements.forEach(el => el.classList.remove('dragging'));
    if (timelineRef.current) {
      timelineRef.current.classList.remove('showing-new-layer');
    }
  };

  useEffect(() => {
    document.addEventListener('dragend', handleDragEnd);
    return () => document.removeEventListener('dragend', handleDragEnd);
  }, [draggingItem]);

  const handleResizeStart = (e, item, layerIndex, edge) => {
    if (isSplitMode) return; // Disable resizing in split mode
    e.stopPropagation();
    setResizingItem({ ...item, layerIndex });
    setResizeEdge(edge);
    e.preventDefault();
  };

  const handleResizeMove = useCallback((e) => {
    if (!resizingItem || !timelineRef.current) return;
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - timelineRect.left;
    const newTime = Math.max(0, mouseX / timeScale);
    let newLayers = [...layers];
    const layer = newLayers[resizingItem.layerIndex];
    const itemIndex = layer.findIndex(i => i.id === resizingItem.id);
    if (itemIndex === -1) return;
    const item = { ...layer[itemIndex] };
    let newStartTime = item.startTime;
    let newDuration = item.duration;
    if (resizeEdge === 'left') {
      const originalEndTime = item.startTime + item.duration;
      newStartTime = Math.min(newTime, originalEndTime - 0.1);
      newDuration = originalEndTime - newStartTime;
    } else if (resizeEdge === 'right') {
      const newEndTime = Math.max(newTime, item.startTime + 0.1);
      newDuration = newEndTime - item.startTime;
    }
    item.startTime = newStartTime;
    item.duration = newDuration;
    layer[itemIndex] = item;
    newLayers[resizingItem.layerIndex] = layer;
    setLayers(newLayers);
  }, [resizingItem, resizeEdge, layers, timeScale]);

  const handleResizeEnd = async () => {
    if (!resizingItem) return;
    const layer = layers[resizingItem.layerIndex];
    const item = layer.find(i => i.id === resizingItem.id);
    if (item) {
      saveHistory(layers);
      autoSave(layers);
      if (item.type === 'text') {
        const updatedTextSettings = {
          ...item,
          duration: item.duration,
        };
        const newStartTime = resizeEdge === 'left' ? item.startTime : item.startTime;
        const newEndTime = item.startTime + item.duration;
        await updateTextSegment(
          item.id,
          updatedTextSettings,
          newStartTime,
          item.layer
        );
      } else {
        const newStartTime = resizeEdge === 'left' ? item.startTime : item.startTime;
        const newDuration = item.duration;
        const videoStartTime = resizeEdge === 'left' ? newStartTime : item.startTime;
        const videoEndTime = item.startTime + item.duration;
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

  const handleTimelineClick = async (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const clickTime = clickX / timeScale;
    const layerHeight = 40;
    const reversedIndex = Math.floor(clickY / layerHeight);
    const clickedLayerIndex = layers.length - 1 - reversedIndex;

    if (!isSplitMode) {
      setPlayhead(clickTime);
      setCurrentTime(clickTime);
      if (onTimeUpdate) onTimeUpdate(clickTime);
      setPlayingVideoId(null);
      setSelectedSegment(null);
      if (onSegmentSelect) onSegmentSelect(null);
    }

    if (clickedLayerIndex >= 0 && clickedLayerIndex < layers.length) {
      const layerItems = layers[clickedLayerIndex];
      const foundItem = layerItems.find(item => {
        const itemStart = item.startTime;
        const itemEnd = itemStart + item.duration;
        return clickTime >= itemStart && clickTime < itemEnd;
      });

      if (foundItem && isSplitMode) {
        const splitTime = clickTime - foundItem.startTime; // Time within the segment
        if (splitTime > 0.1 && splitTime < foundItem.duration - 0.1) { // Ensure split is not at edges
          const firstPartDuration = splitTime;
          const secondPartDuration = foundItem.duration - splitTime;

          let newLayers = [...layers];
          const layer = newLayers[clickedLayerIndex];
          const itemIndex = layer.findIndex(i => i.id === foundItem.id);

          // Determine original video startTime and endTime
          const originalVideoStartTime = foundItem.startTimeWithinVideo || 0;
          const originalVideoEndTime = foundItem.endTimeWithinVideo || foundItem.duration;

          // First part (update existing segment)
          const firstPart = {
            ...foundItem,
            duration: firstPartDuration,
            endTimeWithinVideo: originalVideoStartTime + firstPartDuration,
          };
          layer[itemIndex] = firstPart;

          // Second part (create new segment)
          const secondPart = {
            ...foundItem,
            id: `${foundItem.id}-split-${Date.now()}`, // Temporary unique ID
            startTime: foundItem.startTime + splitTime, // Timeline start time
            duration: secondPartDuration,
            startTimeWithinVideo: originalVideoStartTime + firstPartDuration, // Start where first part ends
            endTimeWithinVideo: originalVideoEndTime, // Original end time
          };
          layer.push(secondPart);

          newLayers[clickedLayerIndex] = layer;
          setLayers(newLayers);
          saveHistory(newLayers);

          // Update backend
          if (foundItem.type === 'text') {
            await updateTextSegment(foundItem.id, firstPart, firstPart.startTime, clickedLayerIndex);
            await addTextToTimeline(clickedLayerIndex, secondPart.startTime, secondPart);
          } else {
            // Update first part
            await updateSegmentPosition(
              foundItem.id,
              foundItem.startTime,
              clickedLayerIndex,
              firstPartDuration
            );
            // Add second part with specific startTime and endTime relative to the video
            await addVideoToTimeline(
              foundItem.filePath || foundItem.filename, // Source video path
              clickedLayerIndex,                        // Layer
              secondPart.startTime,                     // Timeline start time
              secondPart.startTime + secondPartDuration,// Timeline end time
              secondPart.startTimeWithinVideo,          // Video start time
              secondPart.endTimeWithinVideo             // Video end time
            );
          }

          autoSave(newLayers);
          setIsSplitMode(false); // Exit split mode after splitting
          await loadProjectTimeline(); // Reload to get proper IDs from backend
        }
        return;
      }

      if (foundItem && !isSplitMode) {
        if (foundItem.type === 'text') {
          setEditingTextSegment(foundItem);
          setTextDialogPosition({ x: e.clientX, y: e.clientY });
          setShowTextDialog(true);
        } else {
          setPlayingVideoId(foundItem.id);
          if (onVideoSelect) onVideoSelect(clickTime, foundItem);
        }
        return;
      }
    }

    if (!isSplitMode && onVideoSelect) onVideoSelect(clickTime);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
    } else {
      playIntervalRef.current = setInterval(() => {
        setPlayhead(prev => {
          const newPosition = prev + 0.1;
          if (newPosition >= totalDuration) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            setCurrentTime(0);
            if (onTimeUpdate) onTimeUpdate(0);
            return 0;
          }
          if (onTimeUpdate) onTimeUpdate(newPosition);
          return newPosition;
        });
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= totalDuration) return 0;
          return newTime;
        });
      }, 100);
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const loadProjectTimeline = async () => {
    if (!projectId || !sessionId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const project = response.data;
      if (project && project.timelineState) {
        const timelineState = typeof project.timelineState === 'string' ? JSON.parse(project.timelineState) : project.timelineState;
        const newLayers = [[], [], []];
        if (timelineState.segments && timelineState.segments.length > 0) {
          for (const segment of timelineState.segments) {
            let videoFileName = segment.sourceVideoPath;
            const normalizedVideoPath = videoFileName.startsWith('videos/') ? videoFileName.substring(7) : videoFileName;
            let video = videos.find(v => {
              const vPath = (v.filePath || v.filename);
              const normalizedVPath = vPath.startsWith('videos/') ? vPath.substring(7) : vPath;
              return normalizedVPath === normalizedVideoPath;
            });
            if (video) {
              const layerIndex = segment.layer || 0;
              while (newLayers.length <= layerIndex) newLayers.push([]);
              newLayers[layerIndex].push({
                ...video,
                type: 'video',
                id: segment.id,
                startTime: segment.timelineStartTime,
                duration: segment.timelineEndTime - segment.timelineStartTime,
                layer: layerIndex,
                filePath: normalizedVideoPath,
                positionX: segment.positionX || 50,
                positionY: segment.positionY || 50,
                scale: segment.scale || 1,
                startTimeWithinVideo: segment.startTime, // Use backend startTime
                endTimeWithinVideo: segment.endTime,     // Use backend endTime
              });
            }
          }
        }
        if (timelineState.textSegments && timelineState.textSegments.length > 0) {
          for (const textSegment of timelineState.textSegments) {
            const layerIndex = textSegment.layer || 0;
            while (newLayers.length <= layerIndex) newLayers.push([]);
            newLayers[layerIndex].push({
              id: textSegment.id,
              type: 'text',
              text: textSegment.text,
              startTime: textSegment.timelineStartTime,
              duration: textSegment.timelineEndTime - textSegment.timelineStartTime,
              layer: layerIndex,
              fontFamily: textSegment.fontFamily || 'Arial',
              fontSize: textSegment.fontSize || 24,
              fontColor: textSegment.fontColor || '#FFFFFF',
              backgroundColor: textSegment.backgroundColor || 'transparent',
              positionX: textSegment.positionX || 50,
              positionY: textSegment.positionY || 50,
            });
          }
        }
        setLayers(newLayers);
        setHistory([]);
        setHistoryIndex(-1);
        let maxEndTime = 0;
        newLayers.forEach(layer => {
          layer.forEach(item => {
            const endTime = item.startTime + item.duration;
            if (endTime > maxEndTime) maxEndTime = endTime;
          });
        });
        setTotalDuration(maxEndTime > 0 ? maxEndTime : 0);
      }
    } catch (error) {
      console.error('Error loading project timeline:', error);
    }
  };

  useEffect(() => {
    if (projectId && sessionId && videos.length > 0) loadProjectTimeline();
  }, [projectId, sessionId, videos]);

  const handleVideoSelect = (videoId) => {
    if (isSplitMode) return; // Disable selection in split mode
    setPlayingVideoId(videoId);
    let selected = null;
    for (let i = 0; i < layers.length; i++) {
      const video = layers[i].find(v => v.id === videoId);
      if (video) {
        selected = { ...video, layerIndex: i };
        setSelectedSegment(selected);
        if (onVideoSelect) {
          onVideoSelect(video.startTime, video);
        }
        break;
      }
    }
    if (onSegmentSelect) onSegmentSelect(selected);
  };

  const updateSegmentPosition = async (segmentId, newStartTime, newLayer, newDuration) => {
    if (!projectId || !sessionId) return;
    try {
      const token = localStorage.getItem('token');
      const layer = layers[newLayer];
      const item = layer.find(i => i.id === segmentId);
      const originalDuration = item.duration;
      const timelineEndTime = newStartTime + (newDuration || originalDuration);
      const requestBody = {
        segmentId,
        timelineStartTime: newStartTime,
        timelineEndTime: timelineEndTime,
        layer: newLayer,
        startTime: 0,
        endTime: newDuration || originalDuration,
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

  const handleDragOverNewLayer = (e) => {
    if (isSplitMode) return; // Disable new layer drag in split mode
    e.preventDefault();
    if (!draggingItem) return;
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeaveNewLayer = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const autoSaveTimeout = useRef(null);

  const saveHistory = useCallback((newLayers) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newLayers));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const autoSave = useCallback((newLayers) => {
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    autoSaveTimeout.current = setTimeout(async () => {
      if (!projectId || !sessionId) return;
      try {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_BASE_URL}/projects/${projectId}/save`,
          { timelineState: { segments: flattenLayersToSegments(newLayers) } },
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Project auto-saved');
      } catch (error) {
        console.error('Error during auto-save:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  }, [projectId, sessionId]);

  const flattenLayersToSegments = (layers) => {
    const segments = [];
    layers.forEach((layer, layerIndex) => {
      layer.forEach(item => {
        if (item.type === 'text') {
          segments.push({
            id: item.id,
            type: 'text',
            text: item.text,
            layer: layerIndex,
            timelineStartTime: item.startTime,
            timelineEndTime: item.startTime + item.duration,
            fontFamily: item.fontFamily,
            fontSize: item.fontSize,
            fontColor: item.fontColor,
            backgroundColor: item.backgroundColor,
            positionX: item.positionX,
            positionY: item.positionY,
          });
        } else {
          segments.push({
            id: item.id,
            type: 'video',
            sourceVideoPath: item.filePath || item.filename,
            layer: layerIndex,
            timelineStartTime: item.startTime,
            timelineEndTime: item.startTime + item.duration,
            startTime: 0,
            endTime: item.duration,
            positionX: item.positionX,
            positionY: item.positionY,
            scale: item.scale,
          });
        }
      });
    });
    return segments;
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const previousLayers = JSON.parse(history[newIndex]);
    setLayers(previousLayers);
    autoSave(previousLayers);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const nextLayers = JSON.parse(history[newIndex]);
    setLayers(nextLayers);
    autoSave(nextLayers);
  };

  useEffect(() => {
    if (layers.length > 0 && history.length === 0) {
      const timer = setTimeout(() => {
        saveHistory(layers);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [layers, history.length, saveHistory]);

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

  const handleSaveTextSegment = async (updatedTextSettings) => {
    try {
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
        const newLayers = [...layers];
        while (newLayers.length <= editingTextSegment.layer) newLayers.push([]);
        newLayers[editingTextSegment.layer].push(newTextSegment);
        setLayers(newLayers);
        saveHistory(newLayers);
        autoSave(newLayers);
        await loadProjectTimeline();
      } else {
        if (!editingTextSegment.id) {
          console.error('Editing text segment has no ID');
          return;
        }
        await updateTextSegment(editingTextSegment.id, updatedTextSettings);
        const newLayers = layers.map(layer =>
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
        setLayers(newLayers);
        saveHistory(newLayers);
        autoSave(newLayers);
        await loadProjectTimeline();
      }
      setShowTextDialog(false);
      setEditingTextSegment(null);
      setTextSettings(updatedTextSettings);
    } catch (error) {
      console.error('Error saving text segment:', error);
    }
  };

  const openAddTextDialog = () => {
    const startTime = currentTime || 0;
    const duration = textSettings.duration || 5;
    const endTime = startTime + duration;
    const hasSpaceInLayer = (layer) => {
      return !layer.some(item => {
        const itemStart = item.startTime;
        const itemEnd = itemStart + item.duration;
        return (startTime < itemEnd && endTime > itemStart);
      });
    };
    let targetLayer = -1;
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      if (hasSpaceInLayer(layers[layerIndex])) {
        targetLayer = layerIndex;
        break;
      }
    }
    if (targetLayer === -1) targetLayer = layers.length;
    setTextDialogPosition({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
    setShowTextDialog(true);
    setEditingTextSegment({ isNew: true, layer: targetLayer, startTime });
  };

  const handleEditTextSegment = (item, e) => {
    setEditingTextSegment(item);
    setTextDialogPosition({ x: e.clientX, y: e.clientY });
    setShowTextDialog(true);
    setSelectedSegment({ ...item, layerIndex: item.layer });
    if (onSegmentSelect) onSegmentSelect({ ...item, layerIndex: item.layer });
  };

  const toggleSplitMode = () => {
    setIsSplitMode(prev => !prev);
    setDraggingItem(null); // Clear any dragging state
    setResizingItem(null); // Clear any resizing state
  };

  return (
    <div className="timeline-container">
      <TimelineControls
        isPlaying={isPlaying}
        togglePlayback={togglePlayback}
        currentTime={currentTime}
        totalDuration={totalDuration}
        formatTime={formatTime}
        historyIndex={historyIndex}
        history={history}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        isSaving={isSaving}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        openAddTextDialog={openAddTextDialog}
        toggleSplitMode={toggleSplitMode}
        isSplitMode={isSplitMode}
      />
      <div className="timeline-scroll-container">
        <TimelineRuler
          totalDuration={totalDuration}
          timeScale={timeScale}
          formatTime={formatTime}
        />
        <div
          className={`timeline ${isSplitMode ? 'split-mode' : ''}`}
          ref={timelineRef}
          onClick={handleTimelineClick}
          style={{ width: `${totalDuration * timeScale}px` }}
        >
          <div
            className="playhead"
            ref={playheadRef}
            style={{ left: `${playhead * timeScale}px` }}
          ></div>
          <div
            className="timeline-layer new-layer-drop-area"
            onDragOver={handleDragOverNewLayer}
            onDragLeave={handleDragLeaveNewLayer}
            onDrop={(e) => {
              e.currentTarget.classList.remove('drag-over');
              handleDrop(e);
            }}
          >
            <div className="layer-label">Drop to create new layer</div>
          </div>
          {[...layers].reverse().map((layer, reversedIndex) => {
            const layerIndex = layers.length - 1 - reversedIndex;
            return (
              <div
                key={`layer-${layerIndex}`}
                className="timeline-layer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <TimelineLayer
                  layer={layer}
                  layerIndex={layerIndex}
                  timeScale={timeScale}
                  handleDragStart={handleDragStart}
                  handleResizeStart={handleResizeStart}
                  playingVideoId={playingVideoId}
                  handleVideoSelect={handleVideoSelect}
                  handleEditTextSegment={handleEditTextSegment}
                  selectedSegmentId={selectedSegment ? selectedSegment.id : null}
                />
              </div>
            );
          })}
          <SnapIndicators
            snapIndicators={snapIndicators}
            timeScale={timeScale}
            layers={layers}
          />
          <DraggingGhost
            draggingItem={draggingItem}
            snapIndicators={snapIndicators}
            timeScale={timeScale}
            dragLayer={dragLayer}
            layers={layers}
          />
        </div>
      </div>
      {showTextDialog && (
        <TextSegmentDialog
          showTextDialog={showTextDialog}
          textDialogPosition={textDialogPosition}
          editingTextSegment={editingTextSegment}
          textSettings={textSettings}
          onClose={() => {
            setShowTextDialog(false);
            setEditingTextSegment(null);
          }}
          onSave={handleSaveTextSegment}
          onTextSettingsChange={(newSettings) => setTextSettings(newSettings)}
        />
      )}
    </div>
  );
};

export default TimelineComponent;
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
import VideoSegmentHandler from './VideoSegmentHandler';
import TextSegmentHandler from './TextSegmentHandler';
import ImageSegmentHandler from './ImageSegmentHandler';
import GeneralSegmentHandler from './GeneralSegmentHandler';

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
  const [isSplitMode, setIsSplitMode] = useState(false);

  const SNAP_THRESHOLD = 0.5;
  const API_BASE_URL = 'http://localhost:8080';

  const timelineRef = useRef(null);
  const playheadRef = useRef(null);
  const playIntervalRef = useRef(null);

  const saveHistory = useCallback((newLayers) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newLayers));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const autoSave = useCallback((newLayers) => {
    const autoSaveTimeout = setTimeout(async () => {
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
    return () => clearTimeout(autoSaveTimeout);
  }, [projectId, sessionId]);

  const generateImageThumbnail = async (imagePath) => {
    const filename = imagePath.split('/').pop();
    const fullImagePath = `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(filename)}`;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fullImagePath;
      img.onload = () => {
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
        resolve(thumbnail);
      };
      img.onerror = () => {
        console.error(`Failed to load image for thumbnail: ${fullImagePath}`);
        resolve(null);
      };
    });
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

        // Process video segments
        if (timelineState.segments && timelineState.segments.length > 0) {
          for (const segment of timelineState.segments) {
            const layerIndex = segment.layer || 0;
            while (newLayers.length <= layerIndex) newLayers.push([]);
            if (segment.sourceVideoPath) {
              let videoFileName = segment.sourceVideoPath;
              const normalizedVideoPath = videoFileName.startsWith('videos/') ? videoFileName.substring(7) : videoFileName;
              let video = videos.find(v => {
                const vPath = (v.filePath || v.filename);
                const normalizedVPath = vPath.startsWith('videos/') ? vPath.substring(7) : vPath;
                return normalizedVPath === normalizedVideoPath;
              });
              if (video) {
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
                  startTimeWithinVideo: segment.startTime,
                  endTimeWithinVideo: segment.endTime,
                });
              }
            }
          }
        }

        // Process image segments
        if (timelineState.imageSegments && timelineState.imageSegments.length > 0) {
          for (const segment of timelineState.imageSegments) {
            const layerIndex = segment.layer || 0;
            while (newLayers.length <= layerIndex) newLayers.push([]);
            const filename = segment.imagePath.split('/').pop();
            const filePath = `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(filename)}`;
            const thumbnail = await generateImageThumbnail(segment.imagePath);
            newLayers[layerIndex].push({
              id: segment.id,
              type: 'image',
              fileName: filename,
              filePath,
              thumbnail,
              startTime: segment.timelineStartTime,
              duration: segment.timelineEndTime - segment.timelineStartTime,
              layer: layerIndex,
              positionX: segment.positionX || 50,
              positionY: segment.positionY || 50,
              scale: segment.scale || 1,
            });
          }
        }

        // Process text segments
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

  const videoHandler = VideoSegmentHandler({
    projectId,
    sessionId,
    layers,
    setLayers,
    addVideoToTimeline,
    saveHistory,
    autoSave,
    loadProjectTimeline,
    API_BASE_URL,
    timelineRef,
  });

  const textHandler = TextSegmentHandler({
    projectId,
    sessionId,
    layers,
    setLayers,
    saveHistory,
    autoSave,
    loadProjectTimeline,
    API_BASE_URL,
  });

  const imageHandler = ImageSegmentHandler({
    projectId,
    sessionId,
    layers,
    setLayers,
    saveHistory,
    autoSave,
    loadProjectTimeline,
    API_BASE_URL,
    timelineRef,
  });

  const generalHandler = GeneralSegmentHandler({
    layers,
    setLayers,
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
    updateSegmentPosition: videoHandler.updateSegmentPosition,
    updateTextSegment: textHandler.updateTextSegment,
    updateImageSegment: imageHandler.updateImageSegment,
  });

  useEffect(() => {
    const calculateDuration = () => {
      let maxDuration = 0;
      layers.forEach(layer => {
        layer.forEach(item => {
          const endTime = item.startTime + item.duration;
          if (endTime > maxDuration) maxDuration = endTime;
        });
      });
      setTotalDuration(maxDuration > 0 ? maxDuration : 0);
    };
    calculateDuration();
  }, [layers, setTotalDuration]);

  const handleDrop = async (e) => {
    if (isSplitMode) return;
    e.preventDefault();
    const dragElements = document.querySelectorAll('.dragging');
    dragElements.forEach(el => el.classList.remove('dragging'));
    if (timelineRef.current) timelineRef.current.classList.remove('showing-new-layer');
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const textDropResult = await textHandler.handleTextDrop(e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators);
    if (textDropResult) {
      setTextDialogPosition({ x: e.clientX, y: e.clientY });
      setShowTextDialog(true);
      setEditingTextSegment(textDropResult);
      setDraggingItem(null);
      setDragLayer(null);
      setDragOffset(0);
      setSnapIndicators([]);
      return;
    }

    const imageDropResult = await imageHandler.handleImageDrop(e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators);
    if (imageDropResult === undefined) {
      setDraggingItem(null);
      setDragLayer(null);
      setDragOffset(0);
      setSnapIndicators([]);
      return;
    }

    await videoHandler.handleVideoDrop(e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators);
    setDraggingItem(null);
    setDragLayer(null);
    setDragOffset(0);
    setSnapIndicators([]);
  };

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

      if (foundItem) {
        if (isSplitMode && foundItem.type === 'video') {
          await videoHandler.handleVideoSplit(foundItem, clickTime, clickedLayerIndex);
          setIsSplitMode(false);
          return;
        }

        if (!isSplitMode) {
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

  const handleVideoSelect = (videoId) => {
    if (isSplitMode) return;
    setPlayingVideoId(videoId);
    let selected = null;
    for (let i = 0; i < layers.length; i++) {
      const item = layers[i].find(v => v.id === videoId);
      if (item) {
        selected = { ...item, layerIndex: i };
        setSelectedSegment(selected);
        if (onVideoSelect && item.type !== 'text') onVideoSelect(item.startTime, item);
        break;
      }
    }
    if (onSegmentSelect) onSegmentSelect(selected);
  };

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
        } else if (item.type === 'video') {
          segments.push({
            id: item.id,
            type: 'video',
            sourceVideoPath: item.filePath || item.filename,
            layer: layerIndex,
            timelineStartTime: item.startTime,
            timelineEndTime: item.startTime + item.duration,
            startTime: item.startTimeWithinVideo || 0,
            endTime: item.endTimeWithinVideo || item.duration,
            positionX: item.positionX,
            positionY: item.positionY,
            scale: item.scale,
          });
        } else if (item.type === 'image') {
          segments.push({
            id: item.id,
            type: 'image',
            imageFileName: item.fileName,
            layer: layerIndex,
            timelineStartTime: item.startTime,
            timelineEndTime: item.startTime + item.duration,
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
      const timer = setTimeout(() => saveHistory(layers), 100);
      return () => clearTimeout(timer);
    }
  }, [layers, history.length, saveHistory]);

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

  const toggleSplitMode = () => {
    setIsSplitMode(prev => !prev);
    setDraggingItem(null);
    setResizingItem(null);
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
        <TimelineRuler totalDuration={totalDuration} timeScale={timeScale} formatTime={formatTime} />
        <div
          className={`timeline ${isSplitMode ? 'split-mode' : ''}`}
          ref={timelineRef}
          onClick={handleTimelineClick}
          style={{ width: `${totalDuration * timeScale}px` }}
          onDragOver={generalHandler.handleDragOver}
          onDrop={handleDrop}
        >
          <div className="playhead" ref={playheadRef} style={{ left: `${playhead * timeScale}px` }}></div>
          <div
            className="timeline-layer new-layer-drop-area"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="layer-label">Drop to create new layer</div>
          </div>
          {[...layers].reverse().map((layer, reversedIndex) => {
            const layerIndex = layers.length - 1 - reversedIndex;
            return (
              <div key={`layer-${layerIndex}`} className="timeline-layer" onDragOver={generalHandler.handleDragOver} onDrop={handleDrop}>
                <TimelineLayer
                  layer={layer}
                  layerIndex={layerIndex}
                  timeScale={timeScale}
                  handleDragStart={generalHandler.handleDragStart}
                  handleResizeStart={generalHandler.handleResizeStart}
                  playingVideoId={playingVideoId}
                  handleVideoSelect={handleVideoSelect}
                  handleEditTextSegment={(item, e) => {
                    setEditingTextSegment(item);
                    setTextDialogPosition({ x: e.clientX, y: e.clientY });
                    setShowTextDialog(true);
                    setSelectedSegment({ ...item, layerIndex: item.layer });
                    if (onSegmentSelect) onSegmentSelect({ ...item, layerIndex: item.layer });
                  }}
                  selectedSegmentId={selectedSegment ? selectedSegment.id : null}
                />
              </div>
            );
          })}
          <SnapIndicators snapIndicators={snapIndicators} timeScale={timeScale} layers={layers} />
          <DraggingGhost draggingItem={draggingItem} snapIndicators={snapIndicators} timeScale={timeScale} dragLayer={dragLayer} layers={layers} />
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
          onSave={(updatedSettings) => textHandler.handleSaveTextSegment(updatedSettings, editingTextSegment)}
          onTextSettingsChange={setTextSettings}
        />
      )}
    </div>
  );
};

export default TimelineComponent;
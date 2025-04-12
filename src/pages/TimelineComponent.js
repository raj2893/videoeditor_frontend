import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../CSS/Timeline.css';
import { useCallback } from 'react';
import TimelineControls from './TimelineControls';
import TimelineRuler from './TimelineRuler';
import TimelineLayer from './TimelineLayer';
import SnapIndicators from './SnapIndicators';
import DraggingGhost from './DraggingGhost';
import VideoSegmentHandler from './VideoSegmentHandler';
import TextSegmentHandler from './TextSegmentHandler';
import ImageSegmentHandler from './ImageSegmentHandler';
import AudioSegmentHandler from './AudioSegmentHandler';
import GeneralSegmentHandler from './GeneralSegmentHandler';

const TimelineComponent = ({
  videos,
  audios,
  sessionId,
  projectId,
  totalDuration,
  setTotalDuration,
  onVideoSelect,
  canvasDimensions,
  addVideoToTimeline,
  onTimeUpdate,
  onSegmentSelect,
  videoLayers,
  audioLayers,
  setVideoLayers,
  setAudioLayers,
  thumbnailsGenerated,
  openTextTool,
  timeScale,
  setTimeScale,
  setPlayheadFromParent,
}) => {
  const [timelineVideos, setTimelineVideos] = useState([]);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draggingItem, setDraggingItem] = useState(null);
  const [dragLayer, setDragLayer] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [snapIndicators, setSnapIndicators] = useState([]);
  const [resizingItem, setResizingItem] = useState(null);
  const [resizeEdge, setResizeEdge] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isSplitMode, setIsSplitMode] = useState(false);

  const SNAP_THRESHOLD = 0.1;
  const API_BASE_URL = 'http://localhost:8080';
  const MIN_TIME_SCALE = 0.1;
  const MAX_TIME_SCALE = 200;

  const timelineRef = useRef(null);
  const playheadRef = useRef(null);
  const playIntervalRef = useRef(null);

  const saveHistory = useCallback(
    (newVideoLayers, newAudioLayers) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify({ videoLayers: newVideoLayers, audioLayers: newAudioLayers }));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const autoSave = useCallback(
    (newVideoLayers, newAudioLayers) => {
      const autoSaveTimeout = setTimeout(async () => {
        if (!projectId || !sessionId) return;
        try {
          setIsSaving(true);
          const token = localStorage.getItem('token');
          const segments = flattenLayersToSegments([...newVideoLayers, ...newAudioLayers]);
          await axios.post(
            `${API_BASE_URL}/projects/${projectId}/save`,
            { timelineState: { segments } },
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
    },
    [projectId, sessionId]
  );

  // Unified function to update both playhead and currentTime
  const updatePlayheadAndTime = (newTime, shouldUpdateParent = true) => {
    setPlayhead(newTime);
    setCurrentTime(newTime);
    if (shouldUpdateParent && onTimeUpdate) {
      onTimeUpdate(newTime);
    }
  };

  useEffect(() => {
    if (setPlayheadFromParent) {
      setPlayheadFromParent((newTime, shouldUpdateParent = true) =>
        updatePlayheadAndTime(newTime, shouldUpdateParent)
      );
    }
  }, [setPlayheadFromParent]);

  const generateVideoThumbnail = async (videoPath) => {
    const fullVideoPath = `${API_BASE_URL}/videos/${encodeURIComponent(videoPath.split('/').pop())}`;
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = fullVideoPath;
      video.muted = true;
      video.preload = 'metadata';

      video.onloadeddata = () => {
        video.currentTime = 1;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 120;
        const maxHeight = 80;
        let width = video.videoWidth;
        let height = video.videoHeight;

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
        ctx.drawImage(video, 0, 0, width, height);
        const thumbnail = canvas.toDataURL('image/jpeg');
        resolve(thumbnail);
      };

      video.onerror = () => {
        console.error(`Failed to load video for thumbnail: ${fullVideoPath}`);
        resolve(null);
      };
    });
  };

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
        const newVideoLayers = [[], [], []];
        const newAudioLayers = [[], [], []];

        if (timelineState.segments && timelineState.segments.length > 0) {
          for (const segment of timelineState.segments) {
            const layerIndex = segment.layer || 0;
            if (layerIndex < 0) continue;
            if (segment.sourceVideoPath) {
              while (newVideoLayers.length <= layerIndex) newVideoLayers.push([]);
              let videoFileName = segment.sourceVideoPath;
              const normalizedVideoPath = videoFileName.startsWith('videos/') ? videoFileName.substring(7) : videoFileName;
              let video = videos.find((v) => {
                const vPath = v.filePath || v.filename;
                const normalizedVPath = vPath.startsWith('videos/') ? vPath.substring(7) : vPath;
                return normalizedVPath === normalizedVideoPath;
              });
              if (video) {
                const thumbnail = await generateVideoThumbnail(normalizedVideoPath);
                newVideoLayers[layerIndex].push({
                  ...video,
                  type: 'video',
                  id: segment.id,
                  startTime: segment.timelineStartTime,
                  duration: segment.timelineEndTime - segment.timelineStartTime,
                  layer: layerIndex,
                  filePath: normalizedVideoPath,
                  positionX: segment.positionX || 0,
                  positionY: segment.positionY || 0,
                  scale: segment.scale || 1,
                  startTimeWithinVideo: segment.startTime,
                  endTimeWithinVideo: segment.endTime,
                  thumbnail,
                });
              }
            }
          }
        }

        if (timelineState.imageSegments && timelineState.imageSegments.length > 0) {
          for (const imageSegment of timelineState.imageSegments) {
            const layerIndex = imageSegment.layer || 0;
            if (layerIndex < 0) continue;
            while (newVideoLayers.length <= layerIndex) newVideoLayers.push([]);
            const filename = imageSegment.imagePath.split('/').pop();
            const filePath = `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(filename)}`;
            const thumbnail = await generateImageThumbnail(imageSegment.imagePath);
            newVideoLayers[layerIndex].push({
              id: imageSegment.id,
              type: 'image',
              fileName: filename,
              filePath,
              thumbnail,
              startTime: imageSegment.timelineStartTime,
              duration: imageSegment.timelineEndTime - imageSegment.timelineStartTime,
              layer: layerIndex,
              positionX: imageSegment.positionX || 0,
              positionY: imageSegment.positionY || 0,
              scale: imageSegment.scale || 1,
              opacity: imageSegment.opacity || 1.0,
              width: imageSegment.width,
              height: imageSegment.height,
              effectiveWidth: imageSegment.effectiveWidth,
              effectiveHeight: imageSegment.effectiveHeight,
              maintainAspectRatio: imageSegment.maintainAspectRatio,
            });
          }
        }

        if (timelineState.textSegments && timelineState.textSegments.length > 0) {
          for (const textSegment of timelineState.textSegments) {
            const layerIndex = textSegment.layer || 0;
            if (layerIndex < 0) continue;
            while (newVideoLayers.length <= layerIndex) newVideoLayers.push([]);
            newVideoLayers[layerIndex].push({
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
              positionX: textSegment.positionX || 0,
              positionY: textSegment.positionY || 0,
            });
          }
        }

        if (timelineState.audioSegments && timelineState.audioSegments.length > 0) {
          for (const audioSegment of timelineState.audioSegments) {
            const backendLayer = audioSegment.layer || -1;
            const layerIndex = Math.abs(backendLayer) - 1;
            while (newAudioLayers.length <= layerIndex) newAudioLayers.push([]);
            newAudioLayers[layerIndex].push({
              id: audioSegment.id,
              type: 'audio',
              fileName: audioSegment.audioFileName || audioSegment.audioPath.split('/').pop(),
              startTime: audioSegment.timelineStartTime || 0,
              duration: audioSegment.timelineEndTime - audioSegment.timelineStartTime || 0,
              timelineStartTime: audioSegment.timelineStartTime || 0,
              timelineEndTime: audioSegment.timelineEndTime || 0,
              layer: backendLayer,
              startTimeWithinAudio: audioSegment.startTime || 0,
              endTimeWithinAudio: audioSegment.endTime || (audioSegment.timelineEndTime - audioSegment.timelineStartTime) || 0,
              displayName: audioSegment.audioFileName ? audioSegment.audioFileName.split('/').pop() : audioSegment.audioPath.split('/').pop(),
              waveformImage: '/images/audio.jpeg',
            });
          }
        }

        setVideoLayers(newVideoLayers);
        setAudioLayers(newAudioLayers);
        setHistory([]);
        setHistoryIndex(-1);
        let maxEndTime = 0;
        [...newVideoLayers, ...newAudioLayers].forEach((layer) => {
          layer.forEach((item) => {
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
    if (projectId && sessionId && videos.length > 0 && thumbnailsGenerated) loadProjectTimeline();
  }, [projectId, sessionId, videos]);

  const videoHandler = VideoSegmentHandler({
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
  });

  const textHandler = TextSegmentHandler({
    projectId,
    sessionId,
    videoLayers,
    setVideoLayers,
    saveHistory,
    autoSave,
    loadProjectTimeline,
    API_BASE_URL,
    timelineRef,
  });

  const imageHandler = ImageSegmentHandler({
    projectId,
    sessionId,
    videoLayers,
    setVideoLayers,
    saveHistory,
    autoSave,
    loadProjectTimeline,
    API_BASE_URL,
    timelineRef,
  });

  const audioHandler = AudioSegmentHandler({
    projectId,
    sessionId,
    audioLayers,
    setAudioLayers,
    saveHistory,
    autoSave,
    loadProjectTimeline,
    API_BASE_URL,
    timelineRef,
  });

  const generalHandler = GeneralSegmentHandler({
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
    updateSegmentPosition: videoHandler.updateSegmentPosition,
    updateTextSegment: textHandler.updateTextSegment,
    updateImageSegment: imageHandler.updateImageSegment,
    updateAudioSegment: audioHandler.updateAudioSegment,
    fetchVideoDuration: videoHandler.fetchVideoDuration,
  });

  useEffect(() => {
    const calculateDuration = () => {
      let maxDuration = 0;
      [...videoLayers, ...audioLayers].forEach((layer) => {
        layer.forEach((item) => {
          const endTime = item.startTime + item.duration;
          if (endTime > maxDuration) maxDuration = endTime;
        });
      });
      setTotalDuration(maxDuration > 0 ? maxDuration : 0);
    };
    calculateDuration();
  }, [videoLayers, audioLayers, setTotalDuration]);

  const handleDrop = async (e) => {
    if (isSplitMode) return;
    e.preventDefault();
    e.stopPropagation();
    const dragElements = document.querySelectorAll('.dragging');
    dragElements.forEach((el) => el.classList.remove('dragging'));
    if (timelineRef.current) timelineRef.current.classList.remove('showing-new-layer');

    setDraggingItem(null);
    setDragLayer(null);
    setDragOffset(0);
    setSnapIndicators([]);

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const dataString = e.dataTransfer.getData('application/json');
    let dragData = null;
    if (dataString) {
      try {
        dragData = JSON.parse(dataString);
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    }

    if (dragData?.type === 'audio' || (draggingItem && draggingItem.type === 'audio')) {
      const audioDropResult = await audioHandler.handleAudioDrop(e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators);
      if (audioDropResult === undefined) {
        setDraggingItem(null);
        setDragLayer(null);
        setDragOffset(0);
        setSnapIndicators([]);
        return;
      }
    }

    if (dragData?.type === 'media' || (draggingItem && draggingItem.type === 'video')) {
      await videoHandler.handleVideoDrop(e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators);
      setDraggingItem(null);
      setDragLayer(null);
      setDragOffset(0);
      setSnapIndicators([]);
      return;
    }

    if (dragData?.type === 'photo' || (draggingItem && draggingItem.type === 'image')) {
      const imageDropResult = await imageHandler.handleImageDrop(e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators);
      if (imageDropResult === undefined) {
        setDraggingItem(null);
        setDragLayer(null);
        setDragOffset(0);
        setSnapIndicators([]);
        return;
      }
    }

    const textDropResult = await textHandler.handleTextDrop(e, draggingItem, dragLayer, mouseX, mouseY, timeScale, dragOffset, snapIndicators);
    if (textDropResult) {
      setDraggingItem(null);
      setDragLayer(null);
      setDragOffset(0);
      setSnapIndicators([]);
      return;
    }

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
    const totalVideoLayers = videoLayers.length;
    const totalAudioLayers = audioLayers.length;
    const totalLayers = totalVideoLayers + totalAudioLayers + 2;
    const reversedIndex = Math.floor(clickY / layerHeight);
    let clickedLayerIndex;
    let isAudioLayer = false;

    if (reversedIndex <= totalVideoLayers) {
      clickedLayerIndex = totalVideoLayers - reversedIndex;
    } else if (reversedIndex >= totalVideoLayers + 1 && reversedIndex < totalLayers - 1) {
      clickedLayerIndex = totalLayers - 2 - reversedIndex;
      isAudioLayer = true;
    } else {
      clickedLayerIndex = -1;
    }

    if (!isSplitMode) {
      updatePlayheadAndTime(clickTime);
      setPlayingVideoId(null);
      setSelectedSegment(null);
      if (onSegmentSelect) onSegmentSelect(null);
    }

    const targetLayers = isAudioLayer ? audioLayers : videoLayers;
    const adjustedLayerIndex = isAudioLayer ? clickedLayerIndex : clickedLayerIndex >= 0 ? clickedLayerIndex : 0;

    if (adjustedLayerIndex >= 0 && adjustedLayerIndex < targetLayers.length) {
      const layerItems = targetLayers[adjustedLayerIndex];
      const foundItem = layerItems.find((item) => {
        const itemStart = item.startTime;
        const itemEnd = itemStart + item.duration;
        return clickTime >= itemStart && clickTime < itemEnd;
      });

      if (foundItem) {
        if (isSplitMode) {
          if (foundItem.type === 'video') {
            await videoHandler.handleVideoSplit(foundItem, clickTime, adjustedLayerIndex);
          } else if (foundItem.type === 'audio') {
            await audioHandler.handleAudioSplit(foundItem, clickTime, adjustedLayerIndex);
          } else if (foundItem.type === 'text') {
            await textHandler.handleTextSplit(foundItem, clickTime, adjustedLayerIndex);
          } else if (foundItem.type === 'image') {
            await imageHandler.handleImageSplit(foundItem, clickTime, adjustedLayerIndex);
          }
          setIsSplitMode(false);
          setSelectedSegment(null);
          setPlayingVideoId(null);
          return;
        } else {
          if (foundItem.type === 'text') {
            handleVideoSelect(foundItem.id);
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
        updatePlayheadAndTime((prev) => {
          const newPosition = prev + 0.1;
          if (newPosition >= totalDuration) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            updatePlayheadAndTime(0);
            return 0;
          }
          return newPosition;
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
    for (let i = 0; i < videoLayers.length; i++) {
      const item = videoLayers[i].find((v) => v.id === videoId);
      if (item) {
        selected = { ...item, layerIndex: i };
        setSelectedSegment(selected);
        if (onVideoSelect && item.type !== 'text') onVideoSelect(item.startTime, item);
        break;
      }
    }
    if (!selected) {
      for (let i = 0; i < audioLayers.length; i++) {
        const item = audioLayers[i].find((v) => v.id === videoId);
        if (item) {
          selected = { ...item, layerIndex: i };
          setSelectedSegment(selected);
          break;
        }
      }
    }
    if (onSegmentSelect) onSegmentSelect(selected);
  };

  const flattenLayersToSegments = (layers) => {
    const segments = [];
    layers.forEach((layer, layerIndex) => {
      layer.forEach((item) => {
        if (item.type === 'text') {
          segments.push({
            id: item.id,
            type: 'text',
            text: item.text,
            layer: item.layer,
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
            layer: item.layer,
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
            layer: item.layer,
            timelineStartTime: item.startTime,
            timelineEndTime: item.startTime + item.duration,
            positionX: item.positionX,
            positionY: item.positionY,
            scale: item.scale,
          });
        } else if (item.type === 'audio') {
          segments.push({
            id: item.id,
            type: 'audio',
            audioFileName: item.fileName,
            layer: item.layer,
            timelineStartTime: item.startTime,
            timelineEndTime: item.startTime + item.duration,
            startTime: item.startTimeWithinAudio || 0,
            endTime: item.endTimeWithinAudio || item.duration,
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
    const previousState = JSON.parse(history[newIndex]);
    setVideoLayers(previousState.videoLayers);
    setAudioLayers(previousState.audioLayers);
    autoSave(previousState.videoLayers, previousState.audioLayers);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const nextState = JSON.parse(history[newIndex]);
    setVideoLayers(nextState.videoLayers);
    setAudioLayers(nextState.audioLayers);
    autoSave(nextState.videoLayers, nextState.audioLayers);
  };

  useEffect(() => {
    if (videoLayers.length > 0 || audioLayers.length > 0) {
      const timer = setTimeout(() => saveHistory(videoLayers, audioLayers), 100);
      return () => clearTimeout(timer);
    }
  }, [videoLayers, audioLayers, history.length, saveHistory]);

  const toggleSplitMode = () => {
    setIsSplitMode((prev) => !prev);
    setDraggingItem(null);
    setResizingItem(null);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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
        canUndo={canUndo}
        canRedo={canRedo}
        isSaving={isSaving}
        onAddTextClick={openTextTool}
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
          <div className="timeline-layer new-layer-drop-area" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <div className="layer-label">Drop to create new layer</div>
          </div>
          {[...videoLayers].reverse().map((layer, reversedIndex) => {
            const layerIndex = videoLayers.length - 1 - reversedIndex;
            return (
              <div key={`video-layer-${layerIndex}`} className="timeline-layer" onDragOver={generalHandler.handleDragOver} onDrop={handleDrop}>
                <TimelineLayer
                  layer={layer}
                  layerIndex={layerIndex}
                  timeScale={timeScale}
                  handleDragStart={generalHandler.handleDragStart}
                  handleResizeStart={generalHandler.handleResizeStart}
                  playingVideoId={playingVideoId}
                  handleVideoSelect={handleVideoSelect}
                  handleEditTextSegment={(item) => {
                    setSelectedSegment({ ...item, layerIndex: item.layer });
                    if (onSegmentSelect) onSegmentSelect({ ...item, layerIndex: item.layer });
                  }}
                  selectedSegmentId={selectedSegment ? selectedSegment.id : null}
                  showResizeHandles={(item) => item.id === (selectedSegment ? selectedSegment.id : null)}
                />
              </div>
            );
          })}
          <div className="timeline-layer audio-section-label">
            <div className="layer-label">Audio</div>
          </div>
          {[...audioLayers].map((layer, index) => (
            <div key={`audio-layer-${-(index + 1)}`} className="timeline-layer" onDragOver={generalHandler.handleDragOver} onDrop={handleDrop}>
              <TimelineLayer
                layer={layer}
                layerIndex={index}
                timeScale={timeScale}
                handleDragStart={generalHandler.handleDragStart}
                handleResizeStart={generalHandler.handleResizeStart}
                playingVideoId={playingVideoId}
                handleVideoSelect={handleVideoSelect}
                handleEditTextSegment={() => {}}
                selectedSegmentId={selectedSegment ? selectedSegment.id : null}
                showResizeHandles={(item) => item.id === (selectedSegment ? selectedSegment.id : null)}
              />
            </div>
          ))}
          <div className="timeline-layer new-layer-drop-area" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <div className="layer-label">Drop to create new layer</div>
          </div>
          <SnapIndicators snapIndicators={snapIndicators} timeScale={timeScale} layers={[...videoLayers, ...audioLayers]} />
          <DraggingGhost
            draggingItem={draggingItem}
            snapIndicators={snapIndicators}
            timeScale={timeScale}
            dragLayer={dragLayer}
            layers={[...videoLayers, ...audioLayers]}
          />
        </div>
      </div>
    </div>
  );
};

export default TimelineComponent;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../CSS/ProjectEditor.css';
import TimelineComponent from './TimelineComponent.js';
import VideoPreview from './VideoPreview';
import KeyframeControls from './KeyframeControls';
import FilterControls from './FilterControls';
import TransitionsPanel from './TransitionsPanel';
import TextPanel from './TextPanel'; // Adjust the path based on your project structure
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';
import { API_BASE_URL, CDN_URL } from '../Config.js';


const ProjectEditor = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1080, height: 1920 });
  const [currentTime, setCurrentTime] = useState(0);
  const [videoLayers, setVideoLayers] = useState([[], [], []]);
  const [audioLayers, setAudioLayers] = useState([[], [], []]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineHeight, setTimelineHeight] = useState(30);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [tempSegmentValues, setTempSegmentValues] = useState({});
  const [isTransformOpen, setIsTransformOpen] = useState(false);
  const [thumbnailsGenerated, setThumbnailsGenerated] = useState(false);
  const [isMediaPanelOpen, setIsMediaPanelOpen] = useState(true);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);
  const [previewHeight, setPreviewHeight] = useState('auto');
  const [isTextToolOpen, setIsTextToolOpen] = useState(false);
  const [editingTextSegment, setEditingTextSegment] = useState(null);
  const [textSettings, setTextSettings] = useState({
    text: 'New Text',
    fontFamily: 'Arial',
    scale: 1.0,
    fontColor: '#FFFFFF',
    backgroundColor: 'transparent',
    duration: 5,
    alignment: 'center',
    backgroundOpacity: 1.0,
    backgroundBorderWidth: 0,
    backgroundBorderColor: '#000000',
    backgroundH: 0, // Add this
    backgroundW: 0, // Add this
    backgroundBorderRadius: 0,
    textBorderColor: 'transparent', // Added for text border
    textBorderWidth: 0, // Added for text border
    textBorderOpacity: 1.0, // Added for text border
    letterSpacing: 0, // Added
    lineSpacing: 1.2, // Added
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterParams, setFilterParams] = useState({});
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [timeScale, setTimeScale] = useState(20);
  const [keyframes, setKeyframes] = useState({});
  const [currentTimeInSegment, setCurrentTimeInSegment] = useState(0);
  const [editingProperty, setEditingProperty] = useState(null);
  const [isTransitionsOpen, setIsTransitionsOpen] = useState(false);
  const [transitions, setTransitions] = useState([]);
  const [availableTransitions] = useState([
    { type: 'Slide', label: 'Slide', icon: '/icons/slide.png' },
    { type: 'Zoom', label: 'Zoom', icon: '/icons/zoom.png' },
  ]);
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [projectFps, setProjectFps] = useState(25);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loadedAudioSegments, setLoadedAudioSegments] = useState(new Set()); // Track loaded audio segments
  // Add this to the existing state declarations at the top of ProjectEditor
  const [elementSearchQuery, setElementSearchQuery] = useState('');
  // Add this to the existing state declarations at the top of ProjectEditor
  const [isTimelineSelected, setIsTimelineSelected] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [isTextEmpty, setIsTextEmpty] = useState(false);
  const [userRole, setUserRole] = useState('BASIC'); // Default to BASIC
  const [videoUploadError, setVideoUploadError] = useState('');
  const [defaultTextStyles, setDefaultTextStyles] = useState([]);
  // Add to existing state declarations at the top of ProjectEditor
  const [uploadProgress, setUploadProgress] = useState({}); // Object to store progress for each file
  const [tempThumbnails, setTempThumbnails] = useState({}); // Store temporary blurred thumbnails
  const [isContentPanelOpen, setIsContentPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textSettingsRef = useRef(textSettings);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  // Add this to the top of ProjectEditor with other refs
  const timelineRef = useRef(null);

  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation(); // Add this line
  const updateTimeoutRef = useRef(null);
  const filterUpdateTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(performance.now());
  const transitionSaveTimeoutRef = useRef(null); // New ref for debouncing transition saves

  const MIN_TIME_SCALE = 2;
  const MAX_TIME_SCALE = 250;
  const baseFontSize = 24;
  let timelineSetPlayhead = null;

  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    textSettingsRef.current = textSettings;
  }, [textSettings]);

  // Add this useEffect to handle clicks outside the timeline
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timelineRef.current && !timelineRef.current.contains(event.target)) {
        setIsTimelineSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchTextStyles = async () => {
      try {
        const response = await fetch('/data/textStyles.json'); // Adjust path if needed
        if (!response.ok) {
          throw new Error('Failed to fetch text styles');
        }
        const styles = await response.json();
        setDefaultTextStyles(styles);
      } catch (error) {
        console.error('Error fetching text styles:', error);
        // Fallback to empty array or hardcoded styles if needed
        setDefaultTextStyles([]);
      }
    };

    fetchTextStyles();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, assuming BASIC role');
          setUserRole('BASIC');
          return;
        }

        // Check localStorage first
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile.role) {
            setUserRole(profile.role);
            return;
          }
        }

        // Fetch from API
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const role = response.data.role || 'BASIC';
        setUserRole(role);

        // Update localStorage
        const updatedProfile = {
          ...JSON.parse(storedProfile || '{}'),
          role,
        };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('BASIC'); // Fallback to BASIC on error
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userProfile');
          navigate('/', { state: { error: 'Session expired. Please log in again.' } });
        }
      }
    };

    fetchUserRole();
  }, [navigate]);

  // Playback animation
  useEffect(() => {
    if (isPlaying) {
      const updatePlayback = (now) => {
        const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // Convert to seconds
        lastUpdateTimeRef.current = now;

        setCurrentTime((prevTime) => {
          const newTime = prevTime + deltaTime;
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return newTime;
        });

        animationFrameRef.current = requestAnimationFrame(updatePlayback);
      };

      lastUpdateTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(updatePlayback);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  // Update loaded audio segments
  const handleLoadedAudioSegmentsUpdate = (newLoadedAudioSegments) => {
    setLoadedAudioSegments(newLoadedAudioSegments);
  };

  const getProjectState = () => ({
    videoLayers,
    audioLayers,
    transitions,
    keyframes,
    filterParams,
    appliedFilters,
    textSettings,
    selectedSegment,
  });

  const saveHistory = () => {
    const newState = getProjectState();
    const newHistory = [...history.slice(0, historyIndex + 1), newState];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const autoSaveUndoRedo = async (projectState, retries = 3) => {
    if (!projectId || !sessionId) {
      console.warn('Cannot auto-save undo/redo: Missing projectId or sessionId');
      return;
    }
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const token = localStorage.getItem('token');
        const videoLayersToSave = projectState.videoLayers;
        const audioLayersToSave = projectState.audioLayers;
        const transitionsToSave = projectState.transitions;

        const seenSegmentIds = new Set();
        const segments = [];

        videoLayersToSave.forEach((layer, layerIndex) => {
          if (!Array.isArray(layer)) {
            console.warn(`Skipping invalid video layer at index ${layerIndex}:`, layer);
            return;
          }
          layer.forEach((item) => {
            if (seenSegmentIds.has(item.id)) {
              console.warn(`Duplicate segment ID ${item.id} found in video layer ${layerIndex}`);
              return;
            }
            seenSegmentIds.add(item.id);
            if (item.type === 'video') {
              segments.push({
                id: item.id,
                type: 'video',
                sourceVideoPath: item.filePath,
                layer: item.layer,
                timelineStartTime: item.startTime,
                timelineEndTime: item.startTime + item.duration,
                startTime: item.startTimeWithinVideo || 0,
                endTime: item.endTimeWithinVideo || item.duration,
                positionX: item.positionX,
                positionY: item.positionY,
                scale: item.scale,
                opacity: item.opacity,
                filters: item.filters || [],
                keyframes: item.keyframes || {},
              });
            } else if (item.type === 'image') {
              segments.push({
                id: item.id,
                type: 'image',
                imagePath: item.fileName,
                layer: item.layer,
                timelineStartTime: item.startTime,
                timelineEndTime: item.startTime + item.duration,
                positionX: item.positionX,
                positionY: item.positionY,
                scale: item.scale,
                opacity: item.opacity,
                filters: item.filters || [],
                keyframes: item.keyframes || {},
              });
            } else if (item.type === 'text') {
              segments.push({
                id: item.id,
                type: 'text',
                text: item.text,
                layer: item.layer,
                timelineStartTime: item.startTime,
                timelineEndTime: item.startTime + item.duration,
                fontFamily: item.fontFamily,
                scale: item.scale,
                fontColor: item.fontColor,
                backgroundColor: item.backgroundColor,
                positionX: item.positionX,
                positionY: item.positionY,
                opacity: item.opacity,
                alignment: item.alignment,
                backgroundOpacity: item.backgroundOpacity,
                backgroundBorderWidth: item.backgroundBorderWidth,
                backgroundBorderColor: item.backgroundBorderColor,
                backgroundPadding: item.backgroundPadding,
                keyframes: item.keyframes || {},
              });
            }
          });
        });

        audioLayersToSave.forEach((layer, layerIndex) => {
          if (!Array.isArray(layer)) {
            console.warn(`Skipping invalid audio layer at index ${layerIndex}:`, layer);
            return;
          }
          layer.forEach((item) => {
            if (seenSegmentIds.has(item.id)) {
              console.warn(`Duplicate segment ID ${item.id} found in audio layer ${layerIndex}`);
              return;
            }
            seenSegmentIds.add(item.id);
            segments.push({
              id: item.id,
              type: 'audio',
              audioPath: item.fileName,
              layer: item.layer,
              timelineStartTime: item.startTime,
              timelineEndTime: item.startTime + item.duration,
              startTime: item.startTimeWithinAudio || 0,
              endTime: item.endTimeWithinAudio || item.duration,
              volume: item.volume,
              keyframes: item.keyframes || {},
            });
          });
        });

        const timelineState = {
          segments,
          textSegments: segments.filter((s) => s.type === 'text'),
          imageSegments: segments.filter((s) => s.type === 'image'),
          audioSegments: segments.filter((s) => s.type === 'audio'),
          transitions: transitionsToSave || [],
        };

        await axios.post(
          `${API_BASE_URL}/projects/${projectId}/saveForUndoRedo`,
          { timelineState },
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Undo/Redo state saved successfully');
        return;
      } catch (error) {
        console.error(`Error during undo/redo auto-save (attempt ${attempt}):`, error);
        if (attempt === retries) {
          alert('Failed to save changes after undo/redo. Please try again.');
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const handleUndo = async () => {
    if (!canUndo) {
      console.log('Cannot undo: No previous state');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];

      setVideoLayers(previousState.videoLayers.map((layer) => [...layer]));
      setAudioLayers(previousState.audioLayers.map((layer) => [...layer]));
      setTransitions([...previousState.transitions]);
      setKeyframes({ ...previousState.keyframes });
      setFilterParams({ ...previousState.filterParams });
      setAppliedFilters([...previousState.appliedFilters]);
      setTextSettings({ ...previousState.textSettings });
      setSelectedSegment(previousState.selectedSegment ? { ...previousState.selectedSegment } : null);
      setHistoryIndex(newIndex);

      await autoSaveUndoRedo(previousState);
      console.log('Undo performed and state saved successfully');
    } catch (error) {
      console.error('Failed to perform undo:', error);
      alert('Failed to perform undo. Please try again.');
    }
  };

  const handleRedo = async () => {
    if (!canRedo) {
      console.log('Cannot redo: No next state');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];

      setVideoLayers(nextState.videoLayers.map((layer) => [...layer]));
      setAudioLayers(nextState.audioLayers.map((layer) => [...layer]));
      setTransitions([...nextState.transitions]);
      setKeyframes({ ...nextState.keyframes });
      setFilterParams({ ...nextState.filterParams });
      setAppliedFilters([...nextState.appliedFilters]);
      setTextSettings({ ...nextState.textSettings });
      setSelectedSegment(nextState.selectedSegment ? { ...nextState.selectedSegment } : null);
      setHistoryIndex(newIndex);

      await autoSaveUndoRedo(nextState);
      console.log('Redo performed and state saved successfully');
    } catch (error) {
      console.error('Failed to perform redo:', error);
      alert('Failed to perform redo. Please try again.');
    }
  };

  const autoSaveProject = async (updatedVideoLayers = videoLayers, updatedAudioLayers = audioLayers) => {
    if (!projectId || !sessionId) {
      console.warn('Cannot auto-save: Missing projectId or sessionId');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const segments = [];
      updatedVideoLayers.forEach((layer, layerIndex) => {
        layer.forEach((item) => {
          if (item.type === 'video') {
            segments.push({
              id: item.id,
              type: 'video',
              sourceVideoPath: item.filePath,
              layer: item.layer,
              timelineStartTime: item.startTime,
              timelineEndTime: item.startTime + item.duration,
              startTime: item.startTimeWithinVideo || 0,
              endTime: item.endTimeWithinVideo || item.duration,
              positionX: item.positionX,
              positionY: item.positionY,
              scale: item.scale,
              opacity: item.opacity,
              filters: item.filters || [],
              keyframes: item.keyframes || {},
            });
          } else if (item.type === 'image') {
            segments.push({
              id: item.id,
              type: 'image',
              imagePath: item.fileName,
              layer: item.layer,
              timelineStartTime: item.startTime,
              timelineEndTime: item.startTime + item.duration,
              positionX: item.positionX,
              positionY: item.positionY,
              scale: item.scale,
              opacity: item.opacity,
              filters: item.filters || [],
              keyframes: item.keyframes || {},
            });
          } else if (item.type === 'text') {
            segments.push({
              id: item.id,
              type: 'text',
              text: item.text,
              layer: item.layer,
              timelineStartTime: item.startTime,
              timelineEndTime: item.startTime + item.duration,
              fontFamily: item.fontFamily,
              scale: item.scale,
              fontColor: item.fontColor,
              backgroundColor: item.backgroundColor,
              positionX: item.positionX,
              positionY: item.positionY,
              opacity: item.opacity,
              alignment: item.alignment,
              backgroundOpacity: item.backgroundOpacity,
              backgroundBorderWidth: item.backgroundBorderWidth,
              backgroundBorderColor: item.backgroundBorderColor,
              backgroundH: item.backgroundH,
              backgroundW: item.backgroundW,
              backgroundBorderRadius: item.backgroundBorderRadius,
              textBorderColor: item.textBorderColor, // Added
              textBorderWidth: item.textBorderWidth, // Added
              textBorderOpacity: item.textBorderOpacity, // Added
              letterSpacing: item.letterSpacing,
              lineSpacing: item.lineSpacing, // Added
              keyframes: item.keyframes || {},
            });
          }
        });
      });
      updatedAudioLayers.forEach((layer, layerIndex) => {
        layer.forEach((item) => {
          segments.push({
            id: item.id,
            type: 'audio',
            audioPath: item.fileName,
            layer: item.layer,
            timelineStartTime: item.startTime,
            timelineEndTime: item.startTime + item.duration,
            startTime: item.startTimeWithinAudio || 0,
            endTime: item.endTimeWithinAudio || item.duration,
            volume: item.volume,
            keyframes: item.keyframes || {},
          });
        });
      });

      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/save`,
        {
          timelineState: {
            segments,
            textSegments: segments.filter((s) => s.type === 'text'),
            imageSegments: segments.filter((s) => s.type === 'image'),
            audioSegments: segments.filter((s) => s.type === 'audio'),
          },
        },
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Project auto-saved successfully');
    } catch (error) {
      console.error('Error during auto-save:', error);
    }
  };

  const roundToThreeDecimals = (num) => {
    return Math.round(num * 1000) / 1000;
  };

  const findAvailableLayer = (startTime, endTime, layers) => {
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      const hasOverlap = layer.some(
        (segment) =>
          startTime < segment.startTime + segment.duration &&
          endTime > segment.startTime
      );
      if (!hasOverlap) {
        return layerIndex;
      }
    }
    return layers.length;
  };

  const handleElementClick = async (element, isDragEvent = false) => {
    if (uploading || isDragEvent) return;
    try {
      let endTime = 0;
      videoLayers.forEach((layer) => {
        layer.forEach((segment) => {
          const segmentEndTime = segment.startTime + segment.duration;
          if (segmentEndTime > endTime) endTime = segmentEndTime;
        });
      });
      const timelineStartTime = endTime;
      const duration = 5;
      const selectedLayer = findAvailableLayer(timelineStartTime, timelineStartTime + duration, videoLayers);

      const newSegment = await addImageToTimeline(
        element.fileName,
        selectedLayer,
        roundToThreeDecimals(timelineStartTime),
        roundToThreeDecimals(timelineStartTime + duration),
        true // isElement
      );

      // Explicitly add the segment to videoLayers with isElement: true
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        while (newLayers.length <= selectedLayer) newLayers.push([]);
        const exists = newLayers[selectedLayer].some((segment) => segment.id === newSegment.id);
        if (!exists) {
          newLayers[selectedLayer].push({ ...newSegment, isElement: true }); // Ensure isElement is set
        } else {
          console.warn(`Segment with id ${newSegment.id} already exists in layer ${selectedLayer}`);
        }
        return newLayers;
      });

      setTotalDuration((prev) => Math.max(prev, timelineStartTime + duration));
      saveHistory();

      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        autoSaveProject(videoLayers, audioLayers);
      }, 1000);
    } catch (error) {
      console.error('Error adding element to timeline:', error);
      alert('Failed to add element to timeline. Please try again.');
    }
  };

const handleAudioClick = debounce(async (audio, isDragEvent = false) => {
  if (uploading || isDragEvent) return;
  try {
    const token = localStorage.getItem('token');
    if (!sessionId || !projectId || !token) {
      throw new Error('Missing sessionId, projectId, or token');
    }

    const duration = audio.duration || 5;
    let timelineStartTime = roundToThreeDecimals(currentTime);

    const findAvailableLayer = (start, end, layers) => {
      for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        const hasOverlap = layers[layerIndex].some((segment) => {
          const segmentStart = segment.startTime;
          const segmentEnd = segmentStart + segment.duration;
          return start < segmentEnd && end > segmentStart;
        });
        if (!hasOverlap) return layerIndex;
      }
      return layers.length;
    };

    const proposedEndTime = timelineStartTime + duration;
    let selectedLayerIndex = findAvailableLayer(timelineStartTime, proposedEndTime, audioLayers);

    if (selectedLayerIndex >= audioLayers.length) {
      let earliestStartTime = timelineStartTime;
      let foundLayer = -1;

      for (let layerIndex = 0; layerIndex < audioLayers.length; layerIndex++) {
        const layer = audioLayers[layerIndex];
        let layerEndTime = 0;
        layer.forEach((segment) => {
          const segmentEnd = segment.startTime + segment.duration;
          if (segmentEnd > layerEndTime) layerEndTime = segmentEnd;
        });
        if (layerEndTime < earliestStartTime) {
          earliestStartTime = layerEndTime;
          foundLayer = layerIndex;
        }
      }

      if (foundLayer >= 0) {
        selectedLayerIndex = foundLayer;
        timelineStartTime = roundToThreeDecimals(earliestStartTime);
      } else {
        selectedLayerIndex = audioLayers.length;
      }
    }

    const backendLayer = -(selectedLayerIndex + 1);

    const doesIdExist = (id) => {
      return audioLayers.some((layer) => layer.some((segment) => segment.id === id));
    };
    let tempId = `temp-${uuidv4()}`;
    while (doesIdExist(tempId)) {
      tempId = `temp-${uuidv4()}`;
    }

    const newSegment = {
      id: tempId,
      type: 'audio',
      fileName: audio.fileName,
      url: audio.extracted
        ? `${CDN_URL}/audio/projects/${projectId}/extracted/${encodeURIComponent(audio.fileName)}`
        : `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(audio.fileName)}`,
      displayName: audio.displayName || audio.fileName.split('/').pop(),
      waveformJsonPath: audio.waveformJsonPath,
      startTime: timelineStartTime,
      duration: duration,
      layer: backendLayer,
      volume: 1.0,
      startTimeWithinAudio: 0,
      endTimeWithinAudio: duration,
      timelineStartTime: timelineStartTime,
      timelineEndTime: timelineStartTime + duration,
      keyframes: {},
      extracted: audio.extracted || false,
    };

    let updatedAudioLayers = audioLayers;
    setAudioLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      while (newLayers.length <= selectedLayerIndex) newLayers.push([]);

      let existingLayerIndex = -1;
      let existingSegment = null;
      for (let i = 0; i < newLayers.length; i++) {
        const found = newLayers[i].find((s) => s.id === newSegment.id);
        if (found) {
          existingSegment = found;
          existingLayerIndex = i;
          break;
        }
      }

      if (existingSegment) {
        console.warn(`Segment with ID ${newSegment.id} already exists in layer ${existingLayerIndex}. Updating instead.`);
        newLayers[existingLayerIndex] = newLayers[existingLayerIndex].map((s) =>
          s.id === newSegment.id ? { ...s, ...newSegment, layer: backendLayer } : s
        );
      } else {
        newLayers[selectedLayerIndex].push(newSegment);
      }

      updatedAudioLayers = newLayers;
      return newLayers;
    });

    setTotalDuration((prev) => Math.max(prev, timelineStartTime + duration));
    saveHistory();

    const response = await axios.post(
      `${API_BASE_URL}/projects/${projectId}/add-project-audio-to-timeline`,
      {
        audioFileName: audio.fileName,
        layer: backendLayer,
        timelineStartTime: roundToThreeDecimals(timelineStartTime),
        timelineEndTime: roundToThreeDecimals(timelineStartTime + duration),
        startTime: roundToThreeDecimals(0),
        endTime: roundToThreeDecimals(duration),
        volume: 1.0,
      },
      { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
    );

    const newAudioSegment = response.data;

    if (!newAudioSegment.audioSegmentId) {
      throw new Error('Backend did not return audioSegmentId');
    }

    let finalSegmentId = newAudioSegment.audioSegmentId.replace(/[^a-zA-Z0-9]/g, '-');
    if (doesIdExist(finalSegmentId)) {
      console.warn(`Backend returned duplicate audioSegmentId ${finalSegmentId}. Generating new ID.`);
      finalSegmentId = `${finalSegmentId}-${uuidv4()}`;
    }

    const waveformJsonPath = newAudioSegment.waveformJsonPath
      ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(newAudioSegment.waveformJsonPath.split('/').pop())}`
      : audio.waveformJsonPath
      ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(audio.waveformJsonPath.split('/').pop())}`
      : null;

    setAudioLayers((prevLayers) => {
      const newLayers = prevLayers.map((layer, index) => {
        if (index === selectedLayerIndex) {
          return layer.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  id: finalSegmentId,
                  volume: newAudioSegment.volume || 1.0,
                  keyframes: newAudioSegment.keyframes || {},
                  startTimeWithinAudio: roundToThreeDecimals(newAudioSegment.startTime || 0),
                  endTimeWithinAudio: roundToThreeDecimals(newAudioSegment.endTime || duration),
                  duration: roundToThreeDecimals(
                    newAudioSegment.timelineEndTime - newAudioSegment.timelineStartTime
                  ),
                  timelineStartTime: roundToThreeDecimals(newAudioSegment.timelineStartTime),
                  timelineEndTime: roundToThreeDecimals(newAudioSegment.timelineEndTime),
                  layer: newAudioSegment.layer || backendLayer,
                  url: newAudioSegment.extracted
                    ? `${CDN_URL}/audio/projects/${projectId}/extracted/${encodeURIComponent(audio.fileName)}`
                    : `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(audio.fileName)}`,
                  waveformJsonPath: waveformJsonPath,
                  extracted: newAudioSegment.extracted || false,
                }
              : item
          );
        }
        return layer;
      });
      updatedAudioLayers = newLayers;
      return newLayers;
    });

    setTotalDuration((prev) => Math.max(prev, newAudioSegment.timelineEndTime));

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      autoSaveProject(videoLayers, updatedAudioLayers);
    }, 1000);

  } catch (error) {
    console.error('Error adding audio to timeline:', error.response?.data || error.message);
    setAudioLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      newLayers.forEach((layer, index) => {
        newLayers[index] = layer.filter((item) => !item.id.startsWith('temp-'));
      });
      return newLayers;
    });
    let maxEndTime = 0;
    [...videoLayers, ...audioLayers].forEach((layer) => {
      layer.forEach((item) => {
        const endTime = item.startTime + item.duration;
        if (endTime > maxEndTime) maxEndTime = endTime;
      });
    });
    setTotalDuration(maxEndTime);
    alert('Failed to add audio to timeline. Please try again.');
  }
}, 300);

  const toggleTransitionsPanel = () => {
    setIsTransitionsOpen((prev) => {
      const newState = !prev;
      setIsContentPanelOpen(newState);
      setExpandedSection(newState ? 'transitions' : null);
      return newState;
    });
    setIsTransformOpen(false);
    setIsFiltersOpen(false);
    setIsTextToolOpen(false);
  };

  const handleTransitionSelect = (transition) => {
    setSelectedTransition(transition);
    setIsTransitionsOpen(true);
    setIsTransformOpen(false);
    setIsFiltersOpen(false);
    setIsTextToolOpen(false);
  };

  const handleTransitionDurationChange = async (newDuration) => {
    if (!selectedTransition || !sessionId || !projectId) return;
    if (newDuration <= 0) {
      alert('Duration must be positive');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-transition`,
        {
          transitionId: selectedTransition.id,
          type: selectedTransition.type,
          duration: newDuration,
          segmentId: selectedTransition.segmentId,
          start: selectedTransition.start,
          end: selectedTransition.end,
          layer: selectedTransition.layer,
          parameters: selectedTransition.parameters || {},
        },
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedTransition = response.data;
      setTransitions((prev) =>
        prev.map((t) =>
          t.id === selectedTransition.id ? { ...t, duration: newDuration } : t
        )
      );
      setSelectedTransition((prev) => ({ ...prev, duration: newDuration }));
    } catch (error) {
      console.error('Error updating transition duration:', error);
      alert('Failed to update transition duration');
    }
  };

  const handleTransitionDirectionChange = async (direction) => {
    if (!selectedTransition || !sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      const updatedParameters = { ...selectedTransition.parameters, direction };
      const response = await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-transition`,
        {
          transitionId: selectedTransition.id,
          type: selectedTransition.type,
          duration: selectedTransition.duration,
          segmentId: selectedTransition.segmentId,
          start: selectedTransition.start,
          end: selectedTransition.end,
          layer: selectedTransition.layer,
          parameters: updatedParameters,
        },
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedTransition = response.data;
      setTransitions((prev) =>
        prev.map((t) =>
          t.id === selectedTransition.id ? { ...t, parameters: updatedParameters } : t
        )
      );
      setSelectedTransition((prev) => ({ ...prev, parameters: updatedParameters }));
    } catch (error) {
      console.error('Error updating transition direction:', error);
      alert('Failed to update transition direction');
    }
  };

    const handleTransitionDelete = async () => {
      if (!selectedTransition || !sessionId || !projectId) return;
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${API_BASE_URL}/projects/${projectId}/remove-transition`,
          {
            params: { sessionId, transitionId: selectedTransition.id },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        let updatedTransitions = transitions;
        setTransitions((prev) => {
          updatedTransitions = prev.filter((t) => t.id !== selectedTransition.id);
          return updatedTransitions;
        });
        setSelectedTransition(null);
        saveHistory();

        // Schedule auto-save with updated transitions
        if (transitionSaveTimeoutRef.current) clearTimeout(transitionSaveTimeoutRef.current);
        transitionSaveTimeoutRef.current = setTimeout(() => {
          autoSaveProject(videoLayers, audioLayers);
          console.log('Auto-saved project after transition delete:', selectedTransition.id);
        }, 1000);
      } catch (error) {
        console.error('Error deleting transition:', error);
        alert('Failed to delete transition');
      }
    };

  const fetchTransitions = async () => {
    if (!sessionId || !projectId || !localStorage.getItem('token')) {
      console.warn('Cannot fetch transitions: Missing sessionId, projectId, or token');
      setTransitions([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/transitions`, {
        params: { sessionId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransitions(response.data || []);
    } catch (error) {
      console.error('Error fetching transitions:', error);
      if (error.response?.status === 403) {
        try {
          const token = localStorage.getItem('token');
          const sessionResponse = await axios.post(
            `${API_BASE_URL}/projects/${projectId}/session`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSessionId(sessionResponse.data);
          const retryResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}/transitions`, {
            params: { sessionId: sessionResponse.data },
            headers: { Authorization: `Bearer ${token}` },
          });
          setTransitions(retryResponse.data || []);
        } catch (retryError) {
          console.error('Error retrying transitions fetch:', retryError);
          setTransitions([]);
        }
      } else if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setTransitions([]);
      }
    }
  };

  const areTimesEqual = (time1, time2, epsilon = 0.0001) => Math.abs(time1 - time2) < epsilon;

  const toggleTransformPanel = () => {
    toggleSection('transform');
  };
  
  const toggleFiltersPanel = () => {
    toggleSection('filters');
  };
  
  const toggleTextTool = () => {
    if (selectedSegment && selectedSegment.type === 'text') {
      toggleSection('text');
    } else {
      setIsTextToolOpen(false);
      setIsContentPanelOpen(false);
      setExpandedSection(null);
    }
  };

  const toggleMediaPanel = () => setIsMediaPanelOpen((prev) => !prev);

  const handleTextSegmentSelect = (segment) => {
    setEditingTextSegment(segment);
    if (segment && segment.type === 'text') {
      const text = segment.text?.trim() || 'Default Text';
      setTextSettings({
        text: text,
        fontFamily: segment.fontFamily || 'Arial',
        scale: segment.scale || 1.0,
        fontColor: segment.fontColor || '#FFFFFF',
        backgroundColor: segment.backgroundColor || 'transparent',
        duration: segment.duration || 5,
        alignment: segment.alignment || 'center',
        backgroundOpacity: segment.backgroundOpacity ?? 1.0,
        backgroundBorderWidth: segment.backgroundBorderWidth ?? 0,
        backgroundBorderColor: segment.backgroundBorderColor || '#000000',
        backgroundH: segment.backgroundH ?? 0,
        backgroundW: segment.backgroundW ?? 0,
        backgroundBorderRadius: segment.backgroundBorderRadius ?? 0,
        textBorderColor: segment.textBorderColor || 'transparent',
        textBorderWidth: segment.textBorderWidth ?? 0,
        textBorderOpacity: segment.textBorderOpacity ?? 1.0,
        letterSpacing: segment.letterSpacing ?? 0, // Added
        lineSpacing: segment.lineSpacing ?? 1.2, // Added
      });
      setIsTextEmpty(!text.trim());
      setIsTextToolOpen(true);
    } else {
      setIsTextToolOpen(false);
      setIsTextEmpty(false);
    }
  };

  const updateTextSettings = (newSettings) => {
    const trimmedText = newSettings.text?.trim();
    const isEmpty = !trimmedText;

    setIsTextEmpty(isEmpty);
    setTextSettings(newSettings);

    if (editingTextSegment && !isEmpty) {
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[editingTextSegment.layer] = newLayers[editingTextSegment.layer].map((item) =>
          item.id === editingTextSegment.id
            ? {
                ...item,
                // Text-specific properties from newSettings
                text: newSettings.text,
                fontFamily: newSettings.fontFamily,
                fontColor: newSettings.fontColor,
                backgroundColor: newSettings.backgroundColor,
                duration: newSettings.duration,
                timelineEndTime: item.startTime + newSettings.duration,
                alignment: newSettings.alignment,
                backgroundOpacity: newSettings.backgroundOpacity,
                backgroundBorderWidth: newSettings.backgroundBorderWidth,
                backgroundBorderColor: newSettings.backgroundBorderColor,
                backgroundH: newSettings.backgroundH,
                backgroundW: newSettings.backgroundW,
                backgroundBorderRadius: newSettings.backgroundBorderRadius,
                textBorderColor: newSettings.textBorderColor,
                textBorderWidth: newSettings.textBorderWidth,
                textBorderOpacity: newSettings.textBorderOpacity,
                letterSpacing: newSettings.letterSpacing, // Added
                lineSpacing: newSettings.lineSpacing,
                // Preserve transform properties from tempSegmentValues or existing segment
                positionX: tempSegmentValues.positionX !== undefined ? tempSegmentValues.positionX : item.positionX,
                positionY: tempSegmentValues.positionY !== undefined ? tempSegmentValues.positionY : item.positionY,
                scale: tempSegmentValues.scale !== undefined ? tempSegmentValues.scale : item.scale,
                opacity: tempSegmentValues.opacity !== undefined ? tempSegmentValues.opacity : item.opacity,
                // Preserve keyframes
                keyframes: keyframes,
              }
            : item
        );
        return newLayers;
      });

      // Update tempSegmentValues with new scale if provided
      setTempSegmentValues((prev) => ({
        ...prev,
        scale: newSettings.scale !== undefined ? newSettings.scale : prev.scale,
      }));

      setTotalDuration((prev) => {
        const layer = videoLayers[editingTextSegment.layer];
        const updatedSegment = layer.find((item) => item.id === editingTextSegment.id);
        return Math.max(prev, updatedSegment?.startTime + updatedSegment?.duration || prev);
      });

      // Debounced auto-save for text changes only if text is not empty
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        handleSaveTextSegment(textSettingsRef.current);
      }, 1000);
    }
  };

  const handleSaveTextSegment = async (settings = textSettings) => {
    if (!editingTextSegment || !sessionId || !projectId) return;
    const trimmedText = settings.text?.trim();
    if (!trimmedText) {
      setIsTextEmpty(true);
      return; // Prevent saving empty text
    }

    try {
      const token = localStorage.getItem('token');
      const updatedTextSegment = {
        ...editingTextSegment,
        text: trimmedText,
        fontFamily: settings.fontFamily,
        fontColor: settings.fontColor,
        backgroundColor: settings.backgroundColor,
        timelineStartTime: editingTextSegment.startTime,
        timelineEndTime: editingTextSegment.startTime + settings.duration,
        alignment: settings.alignment,
        backgroundOpacity: settings.backgroundOpacity,
        backgroundBorderWidth: settings.backgroundBorderWidth,
        backgroundBorderColor: settings.backgroundBorderColor,
        backgroundH: settings.backgroundH,
        backgroundW: settings.backgroundW,
        backgroundBorderRadius: settings.backgroundBorderRadius,
        textBorderColor: settings.textBorderColor,
        textBorderWidth: settings.textBorderWidth,
        textBorderOpacity: settings.textBorderOpacity,
        letterSpacing: settings.letterSpacing, // Added
        lineSpacing: settings.lineSpacing, // Added
        // Include transform properties from tempSegmentValues
        positionX: tempSegmentValues.positionX !== undefined ? tempSegmentValues.positionX : editingTextSegment.positionX,
        positionY: tempSegmentValues.positionY !== undefined ? tempSegmentValues.positionY : editingTextSegment.positionY,
        scale: tempSegmentValues.scale !== undefined ? tempSegmentValues.scale : editingTextSegment.scale,
        opacity: tempSegmentValues.opacity !== undefined ? tempSegmentValues.opacity : editingTextSegment.opacity,
        keyframes: keyframes,
      };
      await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-text`,
        {
          segmentId: editingTextSegment.id,
          text: updatedTextSegment.text,
          fontFamily: updatedTextSegment.fontFamily,
          scale: updatedTextSegment.scale,
          fontColor: updatedTextSegment.fontColor,
          backgroundColor: updatedTextSegment.backgroundColor,
          timelineStartTime: updatedTextSegment.timelineStartTime,
          timelineEndTime: updatedTextSegment.timelineEndTime,
          layer: updatedTextSegment.layer,
          positionX: updatedTextSegment.positionX,
          positionY: updatedTextSegment.positionY,
          opacity: updatedTextSegment.opacity,
          alignment: updatedTextSegment.alignment,
          backgroundOpacity: updatedTextSegment.backgroundOpacity,
          backgroundBorderWidth: updatedTextSegment.backgroundBorderWidth,
          backgroundBorderColor: updatedTextSegment.backgroundBorderColor,
          backgroundH: updatedTextSegment.backgroundH,
          backgroundW: updatedTextSegment.backgroundW,
          backgroundBorderRadius: updatedTextSegment.backgroundBorderRadius,
          textBorderColor: updatedTextSegment.textBorderColor,
          textBorderWidth: updatedTextSegment.textBorderWidth,
          textBorderOpacity: updatedTextSegment.textBorderOpacity,
          letterSpacing: updatedTextSegment.letterSpacing, // Added
          lineSpacing: updatedTextSegment.lineSpacing, // Added
          keyframes: updatedTextSegment.keyframes,
        },
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      );

      // Update videoLayers with the latest segment data
      let updatedVideoLayers = videoLayers;
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[editingTextSegment.layer] = newLayers[editingTextSegment.layer].map((item) =>
          item.id === editingTextSegment.id ? { ...updatedTextSegment } : item
        );
        updatedVideoLayers = newLayers;
        return newLayers;
      });

      saveHistory();

      // Fetch updated segment data to ensure synchronization
      await fetchKeyframes(editingTextSegment.id, 'text');

      // Trigger auto-save of the project with updated videoLayers
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        autoSaveProject(updatedVideoLayers, audioLayers);
        console.log('Auto-saved project after text segment save:', editingTextSegment.id);
      }, 1000);
    } catch (error) {
      console.error('Error saving text segment:', error);
      alert('Failed to save text segment. Please try again.');
    }
  };

  const openTextTool = async () => {
    if (!sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      let startTime = currentTime;
      if (videoLayers[0].length > 0) {
        const lastSegment = videoLayers[0][videoLayers[0].length - 1];
        startTime = Math.max(startTime, lastSegment.startTime + lastSegment.duration);
      }
      const duration = textSettings.duration;

      // Create temporary segment with UUID
      const tempSegmentId = `temp-${uuidv4()}`;
      const tempSegment = {
        id: tempSegmentId,
        type: 'text',
        text: textSettings.text,
        startTime: roundToThreeDecimals(startTime),
        duration: duration,
        layer: 0,
        fontFamily: textSettings.fontFamily,
        scale: textSettings.scale || 1.0,
        rotation: 0, // Add rotation
        fontColor: textSettings.fontColor,
        backgroundColor: textSettings.backgroundColor,
        positionX: 0,
        positionY: 0,
        alignment: textSettings.alignment,
        backgroundOpacity: textSettings.backgroundOpacity,
        backgroundBorderWidth: textSettings.backgroundBorderWidth,
        backgroundBorderColor: textSettings.backgroundBorderColor,
        backgroundH: textSettings.backgroundH,
        backgroundW: textSettings.backgroundW,
        backgroundBorderRadius: textSettings.backgroundBorderRadius,
        textBorderColor: textSettings.textBorderColor, // Added
        textBorderWidth: textSettings.textBorderWidth, // Added
        textBorderOpacity: textSettings.textBorderOpacity, // Added
        letterSpacing: textSettings.letterSpacing, // Added
        lineSpacing: textSettings.lineSpacing, // Added
        keyframes: {},
      };

      // Add temporary segment to videoLayers for instant rendering
      let updatedVideoLayers = videoLayers;
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[0] = [...(newLayers[0] || []), tempSegment];
        updatedVideoLayers = newLayers;
        return newLayers;
      });

      // Make API call
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-text`,
        {
          text: textSettings.text,
          layer: 0,
          timelineStartTime: roundToThreeDecimals(startTime),
          timelineEndTime: roundToThreeDecimals(startTime + duration),
          fontFamily: textSettings.fontFamily,
          scale: textSettings.scale || 1.0,
          fontColor: textSettings.fontColor,
          backgroundColor: textSettings.backgroundColor,
          positionX: 0,
          positionY: 0,
          alignment: textSettings.alignment,
          backgroundOpacity: textSettings.backgroundOpacity,
          backgroundBorderWidth: textSettings.backgroundBorderWidth,
          backgroundBorderColor: textSettings.backgroundBorderColor,
          backgroundH: textSettings.backgroundH,
          backgroundW: textSettings.backgroundW,
          backgroundBorderRadius: textSettings.backgroundBorderRadius,
          textBorderColor: textSettings.textBorderColor, // Added
          textBorderWidth: textSettings.textBorderWidth, // Added
          textBorderOpacity: textSettings.textBorderOpacity, // Added
          letterSpacing: textSettings.letterSpacing, // Added
          lineSpacing: textSettings.lineSpacing, // Added
        },
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      );

      const newTextSegment = response.data;

      // Validate response
      if (!newTextSegment.textSegmentId) {
        throw new Error('Backend did not return textSegmentId');
      }

      // Update temporary segment with backend data
      const updatedSegment = {
        id: newTextSegment.textSegmentId,
        type: 'text',
        text: newTextSegment.text,
        startTime: roundToThreeDecimals(newTextSegment.timelineStartTime),
        duration: roundToThreeDecimals(newTextSegment.timelineEndTime - newTextSegment.timelineStartTime),
        layer: newTextSegment.layer,
        fontFamily: newTextSegment.fontFamily,
        scale: newTextSegment.scale || 1.0,
        rotation: newTextSegment.rotation || 0, // Add rotation
        fontColor: newTextSegment.fontColor,
        backgroundColor: newTextSegment.backgroundColor,
        positionX: newTextSegment.positionX || 0,
        positionY: newTextSegment.positionY || 0,
        alignment: newTextSegment.alignment,
        backgroundOpacity: newTextSegment.backgroundOpacity ?? 1.0,
        backgroundBorderWidth: newTextSegment.backgroundBorderWidth ?? 0,
        backgroundBorderColor: newTextSegment.backgroundBorderColor || '#000000',
        backgroundH: newTextSegment.backgroundH ?? 0,
        backgroundW: newTextSegment.backgroundW ?? 0,
        backgroundBorderRadius: newTextSegment.backgroundBorderRadius ?? 0,
        textBorderColor: newTextSegment.textBorderColor || 'transparent', // Added
        textBorderWidth: newTextSegment.textBorderWidth ?? 0, // Added
        textBorderOpacity: newTextSegment.textBorderOpacity ?? 1.0, // Added
        letterSpacing: newTextSegment.letterSpacing ?? 0, // Added
        lineSpacing: newTextSegment.lineSpacing ?? 1.2, // Added
        keyframes: newTextSegment.keyframes || {},
      };

      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[0] = newLayers[0].map((item) =>
          item.id === tempSegmentId ? updatedSegment : item
        );
        updatedVideoLayers = newLayers;
        return newLayers;
      });

      setTotalDuration((prev) => Math.max(prev, startTime + duration));
      setSelectedSegment(updatedSegment);
      setEditingTextSegment(updatedSegment);
      setTextSettings({
        text: updatedSegment.text,
        fontFamily: updatedSegment.fontFamily,
        scale: updatedSegment.scale,
        fontColor: updatedSegment.fontColor,
        backgroundColor: updatedSegment.backgroundColor,
        duration: updatedSegment.duration,
        alignment: updatedSegment.alignment,
        backgroundOpacity: updatedSegment.backgroundOpacity,
        backgroundBorderWidth: updatedSegment.backgroundBorderWidth,
        backgroundBorderColor: updatedSegment.backgroundBorderColor,
        backgroundH: updatedSegment.backgroundH,
        backgroundW: updatedSegment.backgroundW,
        backgroundBorderRadius: updatedSegment.backgroundBorderRadius,
        textBorderColor: updatedSegment.textBorderColor, // Added
        textBorderWidth: updatedSegment.textBorderWidth, // Added
        textBorderOpacity: updatedSegment.textBorderOpacity, // Added
        letterSpacing: updatedSegment.letterSpacing, // Added
        lineSpacing: updatedSegment.lineSpacing, // Added
      });
      setIsTextToolOpen(true);
      saveHistory();

      // Auto-save the project with updated videoLayers
      autoSaveProject(updatedVideoLayers, audioLayers);
    } catch (error) {
      console.error('Error adding text to timeline:', error);
      alert('Failed to add text to timeline. Please try again.');
    }
  };

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
      setLoading(false);
      return;
    }

    const initializeProject = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/', { state: { error: 'Please log in to access the project.' } });
          return;
        }

        // Step 1: Verify project ownership
        const projectResponse = await axios.get(
          `${API_BASE_URL}/projects/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const project = projectResponse.data;
        if (!project || !project.id) {
          throw new Error('Project not found or access denied');
        }

        // Step 2: Create session
        const sessionResponse = await axios.post(
          `${API_BASE_URL}/projects/${projectId}/session`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSessionId(sessionResponse.data);

        // Step 3: Fetch other data only after ownership is confirmed
        await Promise.all([
          fetchVideos(),
          fetchAudios(),
          fetchPhotos(),
          fetchTransitions(),
          fetchElements(),
        ]);

        // Step 4: Set project settings
        if (project.width && project.height) {
          setCanvasDimensions({ width: project.width, height: project.height });
        }
        if (project.fps) {
          setProjectFps(project.fps);
        }
      } catch (error) {
        console.error('Error initializing project:', error);
        console.log('Error response:', error.response?.status, error.response?.data);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userProfile');
          navigate('/', { state: { error: 'Session expired. Please log in again.' } });
        } else if (error.response?.status === 403 || error.response?.status === 404) {
          navigate('/dashboard', {
            state: { error: 'This Project does not belong to you.' },
          });
        } else {
          navigate('/dashboard', {
            state: { error: 'Failed to load project.' },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    initializeProject();

    const handleBeforeUnload = () => {};
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, navigate]);

  useEffect(() => {
    if (location.state?.error) {
      const timer = setTimeout(() => {
        navigate('/dashboard', { state: {}, replace: true }); // Clear error after 5 seconds
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state?.error, navigate]);

  const fetchVideos = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const project = response.data;
    if (project.videosJson) {
      let videoFiles =
        typeof project.videosJson === 'string' ? JSON.parse(project.videosJson) : project.videosJson;
      if (Array.isArray(videoFiles)) {
        const updatedVideos = await Promise.all(
          videoFiles.map(async (video) => {
            const fullFileName = video.videoPath.split('/').pop();
            const originalFileName = fullFileName.replace(`${projectId}_`, '').replace(/^\d+_/, '');
            // Sanitize the filename for use in id
            const sanitizedId = `video-${fullFileName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
            let duration = video.duration;
            if (!duration) {
              try {
                const durationResponse = await axios.get(
                  `${API_BASE_URL}/projects/${projectId}/video-duration/${encodeURIComponent(fullFileName)}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                duration = durationResponse.data;
              } catch (error) {
                console.error(`Error fetching duration for video ${fullFileName}:`, error);
                duration = 5; // Fallback duration
              }
            }
            return {
              id: sanitizedId,
              fileName: fullFileName,
              displayName: originalFileName,
              filePath: `${CDN_URL}/videos/projects/${projectId}/${encodeURIComponent(fullFileName)}`,
              duration: duration,
              audioPath: video.audioPath
                  ? `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(video.audioPath.split('/').pop())}`
                  : null,
              waveformJsonPath: video.waveformJsonPath
                ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(video.waveformJsonPath.split('/').pop())}`
                : null,
            };
          })
        );
        setVideos(updatedVideos);
        await Promise.all(updatedVideos.map((video) => generateVideoThumbnail(video)));
        setThumbnailsGenerated(true);
      } else {
        setVideos([]);
      }
    } else {
      setVideos([]);
    }
  } catch (error) {
    console.error('Error fetching videos:', error);
    setVideos([]);
  }
};

const fetchAudios = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const project = response.data;
    if (project.audioJson) {
      let audioFiles =
        typeof project.audioJson === 'string' ? JSON.parse(project.audioJson) : project.audioJson;
      if (Array.isArray(audioFiles)) {
        const updatedAudios = audioFiles.map((audio) => {
          const fullFileName = audio.audioPath.split('/').pop();
          const originalFileName = fullFileName.replace(`${projectId}_`, '').replace(/^\d+_/, '');
          const sanitizedId = `audio-${fullFileName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
          return {
            id: sanitizedId,
            fileName: fullFileName,
            displayName: originalFileName,
            audioPath: `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(fullFileName)}`,
            waveformJsonPath: audio.waveformJsonPath
              ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(audio.waveformJsonPath.split('/').pop())}`
              : null,
          };
        });
        setAudios(updatedAudios);
      } else {
        setAudios([]);
      }
    } else {
      setAudios([]);
    }
  } catch (error) {
    console.error('Error fetching audios:', error);
    setAudios([]);
  }
};

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const project = response.data;
      if (project.imagesJson) {
        let imageFiles =
          typeof project.imagesJson === 'string' ? JSON.parse(project.imagesJson) : project.imagesJson;
        if (Array.isArray(imageFiles)) {
          // Filter out elements (assuming elements have isElement: true or specific path)
          imageFiles = imageFiles.filter(image => !image.isElement);
          const updatedPhotos = await Promise.all(
            imageFiles.map(async (image) => {
              const fullFileName = image.imagePath.split('/').pop();
              const originalFileName = fullFileName.replace(`${projectId}_`, '').replace(/^\d+_/, '');
              const thumbnail = await new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = `${CDN_URL}/image/projects/${projectId}/${encodeURIComponent(fullFileName)}`;
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
                  resolve(canvas.toDataURL('image/jpeg'));
                };
                img.onerror = () => resolve(null);
              });
              return {
                id: image.imagePath || `image-${fullFileName}-${Date.now()}`,
                fileName: fullFileName,
                displayName: originalFileName,
                filePath: `${CDN_URL}/image/projects/${projectId}/${encodeURIComponent(fullFileName)}`,
                thumbnail,
              };
            })
          );
          setPhotos(updatedPhotos);
        } else {
          setPhotos([]);
        }
      } else {
        setPhotos([]);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    }
  };

  const handleTransitionDragStart = (e, transition) => {
    const dragData = {
      type: 'transition',
      transition: {
        type: transition.type,
        duration: 1,
        label: transition.label,
      },
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTransitionDrop = async (segmentId, start, end, layer, timelinePosition, transitionType) => {
    if (!sessionId || !projectId || !transitionType || !segmentId) {
      console.error('Missing required parameters for transition drop:', {
        sessionId,
        projectId,
        transitionType,
        segmentId,
      });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      let parameters = {};
      if (transitionType === 'Zoom') {
        parameters.direction = 'in';
      }  else if (transitionType === 'Slide') {
        parameters.direction = 'right';
      }
      const payload = {
        type: transitionType,
        duration: 1,
        segmentId,
        start,
        end,
        layer,
        parameters,
      };
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-transition`,
        payload,
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      );
      const newTransition = response.data;
      setTransitions((prev) => [...prev, newTransition]);
      await fetchTransitions();
      saveHistory();

      // Schedule auto-save with updated transitions
      if (transitionSaveTimeoutRef.current) clearTimeout(transitionSaveTimeoutRef.current);
      transitionSaveTimeoutRef.current = setTimeout(() => {
        autoSaveProject(videoLayers, audioLayers);
        console.log('Auto-saved project after transition drop:', newTransition);
      }, 1000);

    } catch (error) {
      console.error('Error adding transition:', error.response?.data || error.message);
      alert('Failed to add transition. Please try again.');
    }
  };

  useEffect(() => {
    const fetchAndSetLayers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        });
        const project = response.data;
        if (project && project.timelineState) {
          let timelineState =
            typeof project.timelineState === 'string' ? JSON.parse(project.timelineState) : project.timelineState;
          const newVideoLayers = [[], [], []];
          const newAudioLayers = [[], [], []];
  
          const filterMap = {};
          (timelineState.filters || []).forEach((filter) => {
            if (!filterMap[filter.segmentId]) {
              filterMap[filter.segmentId] = [];
            }
            filterMap[filter.segmentId].push(filter);
          });
  
          if (timelineState.segments && timelineState.segments.length > 0) {
            for (const segment of timelineState.segments) {
              const layerIndex = segment.layer || 0;
              if (layerIndex < 0) continue;
              if (layerIndex >= newVideoLayers.length) {
                while (newVideoLayers.length <= layerIndex) newVideoLayers.push([]);
              }
              if (segment.sourceVideoPath) {
                let videoFileName = segment.sourceVideoPath.split('/').pop();
                let video = videos.find((v) => v.fileName === videoFileName);
                if (video) {
                  const thumbnail = await generateVideoThumbnail(segment.sourceVideoPath);
                  const filters = filterMap[segment.id] || [];
                  newVideoLayers[layerIndex].push({
                    ...video,
                    type: 'video',
                    id: segment.id,
                    startTime: segment.timelineStartTime || 0,
                    duration: (segment.timelineEndTime - segment.timelineStartTime) || 0,
                    layer: layerIndex,
                    filePath: `${CDN_URL}/videos/projects/${projectId}/${encodeURIComponent(videoFileName)}`,
                    positionX: segment.positionX ?? 0,
                    positionY: segment.positionY ?? 0,
                    scale: segment.scale ?? 1,
                    rotation: segment.rotation ?? 0,
                    startTimeWithinVideo: segment.startTime || 0,
                    endTimeWithinVideo: segment.endTime || 0,
                    thumbnail,
                    keyframes: segment.keyframes || {},
                    filters,
                    cropL: segment.cropL ?? 0,
                    cropR: segment.cropR ?? 0,
                    cropT: segment.cropT ?? 0,
                    cropB: segment.cropB ?? 0,
                    opacity: segment.opacity ?? 1,
                    speed: segment.speed ?? 1.0,
                  });
                }
              }
            }
          }
  
          if (timelineState.imageSegments && timelineState.imageSegments.length > 0) {
            for (const imageSegment of timelineState.imageSegments) {
              const layerIndex = imageSegment.layer || 0;
              if (layerIndex < 0) continue;
              if (layerIndex >= newVideoLayers.length) {
                while (newVideoLayers.length <= layerIndex) newVideoLayers.push([]);
              }
              const filename = imageSegment.imagePath.split('/').pop();
              const isElement = imageSegment.element || false;
              const filePath = isElement
                ? `${CDN_URL}/elements/${encodeURIComponent(filename)}`
                : `${CDN_URL}/image/projects/${projectId}/${encodeURIComponent(filename)}`;
              const thumbnail = await generateImageThumbnail(imageSegment.imagePath, isElement);
              const filters = filterMap[imageSegment.id] || [];
              newVideoLayers[layerIndex].push({
                id: imageSegment.id,
                type: 'image',
                fileName: filename,
                filePath,
                thumbnail,
                startTime: imageSegment.timelineStartTime || 0,
                duration: (imageSegment.timelineEndTime - imageSegment.timelineStartTime) || 5,
                layer: layerIndex,
                positionX: imageSegment.positionX || 0,
                positionY: imageSegment.positionY || 0,
                scale: imageSegment.scale || 1,
                rotation: imageSegment.rotation || 0,
                opacity: imageSegment.opacity || 1.0,
                width: imageSegment.width,
                height: imageSegment.height,
                effectiveWidth: imageSegment.effectiveWidth,
                effectiveHeight: imageSegment.effectiveHeight,
                maintainAspectRatio: imageSegment.maintainAspectRatio,
                isElement,
                keyframes: imageSegment.keyframes || {},
                filters,
                cropL: imageSegment.cropL ?? 0,
                cropR: imageSegment.cropR ?? 0,
                cropT: imageSegment.cropT ?? 0,
                cropB: imageSegment.cropB ?? 0,
              });
            }
          }
  
          if (timelineState.textSegments && timelineState.textSegments.length > 0) {
            for (const textSegment of timelineState.textSegments) {
              const layerIndex = textSegment.layer || 0;
              if (layerIndex < 0) continue;
              if (layerIndex >= newVideoLayers.length) {
                while (newVideoLayers.length <= layerIndex) newVideoLayers.push([]);
              }
              const text = textSegment.text?.trim() || 'Default Text';
              newVideoLayers[layerIndex].push({
                id: textSegment.id,
                type: 'text',
                text: text,
                startTime: textSegment.timelineStartTime || 0,
                duration: (textSegment.timelineEndTime - textSegment.timelineStartTime) || 0,
                layer: layerIndex,
                fontFamily: textSegment.fontFamily || 'Arial',
                scale: textSegment.scale || 1.0,
                rotation: textSegment.rotation || 0,
                fontColor: textSegment.fontColor || '#FFFFFF',
                backgroundColor: textSegment.backgroundColor || 'transparent',
                positionX: textSegment.positionX || 0,
                positionY: textSegment.positionY || 0,
                alignment: textSegment.alignment || 'center',
                backgroundOpacity: textSegment.backgroundOpacity ?? 1.0,
                backgroundBorderWidth: textSegment.backgroundBorderWidth ?? 0,
                backgroundBorderColor: textSegment.backgroundBorderColor || '#000000',
                backgroundH: textSegment.backgroundH ?? 0,
                backgroundW: textSegment.backgroundW ?? 0,
                backgroundBorderRadius: textSegment.backgroundBorderRadius ?? 0,
                textBorderColor: textSegment.textBorderColor || 'transparent',
                textBorderWidth: textSegment.textBorderWidth ?? 0,
                textBorderOpacity: textSegment.textBorderOpacity ?? 1.0,
                letterSpacing: textSegment.letterSpacing ?? 0,
                lineSpacing: textSegment.lineSpacing ?? 1.2,
                keyframes: textSegment.keyframes || {},
                opacity: textSegment.opacity || 1,
              });
            }
          }
  
          if (timelineState.audioSegments && timelineState.audioSegments.length > 0) {
            for (const audioSegment of timelineState.audioSegments) {
              const backendLayer = audioSegment.layer || -1;
              const layerIndex = Math.abs(backendLayer) - 1;
              if (layerIndex >= newAudioLayers.length) {
                while (newAudioLayers.length <= layerIndex) newAudioLayers.push([]);
              }
              const filename = audioSegment.audioFileName || audioSegment.audioPath.split('/').pop();
              const extracted = audioSegment.extracted || false;
              const audioUrl = extracted
                ? `${CDN_URL}/audio/projects/${projectId}/extracted/${encodeURIComponent(filename)}`
                : `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(filename)}`;
              const waveformJsonPath = audioSegment.waveformJsonPath
                ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(audioSegment.waveformJsonPath.split('/').pop())}`
                : null;
              const sanitizedId = audioSegment.id.replace(/[^a-zA-Z0-9]/g, '-');
              newAudioLayers[layerIndex].push({
                id: sanitizedId,
                type: 'audio',
                fileName: filename,
                url: audioUrl,
                startTime: audioSegment.timelineStartTime || 0,
                duration: (audioSegment.timelineEndTime - audioSegment.timelineStartTime) || 0,
                timelineStartTime: audioSegment.timelineStartTime || 0,
                timelineEndTime: audioSegment.timelineEndTime || 0,
                layer: backendLayer,
                startTimeWithinAudio: audioSegment.startTime || 0,
                endTimeWithinAudio: audioSegment.endTime || (audioSegment.timelineEndTime - audioSegment.timelineStartTime) || 0,
                displayName: filename,
                waveformJsonPath: waveformJsonPath,
                volume: audioSegment.volume || 1.0,
                keyframes: audioSegment.keyframes || {},
                extracted,
              });
            }
          }
  
          setVideoLayers(newVideoLayers);
          setAudioLayers(newAudioLayers);
          let maxEndTime = 0;
          [...newVideoLayers, ...newAudioLayers].forEach((layer) => {
            layer.forEach((item) => {
              const endTime = item.startTime + item.duration;
              if (endTime > maxEndTime) maxEndTime = endTime;
            });
          });
          setTotalDuration(maxEndTime > 0 ? maxEndTime : 0);
          if (timelineState.textSegments?.some((s) => !s.text?.trim())) {
            autoSaveProject(newVideoLayers, newAudioLayers);
          }
        }
      } catch (error) {
        console.error('Error fetching timeline data for layers:', error);
      }
    };
    if (projectId && sessionId) fetchAndSetLayers();
  }, [projectId, sessionId, videos, photos, audios]);

    useEffect(() => {
      if (videoLayers.some((layer) => layer.length > 0) || audioLayers.some((layer) => layer.length > 0)) {
      }
    }, [videoLayers, audioLayers]);

  useEffect(() => {
    if (videoLayers.some((layer) => layer.length > 0) || audioLayers.some((layer) => layer.length > 0)) {
    }
  }, [videoLayers, audioLayers]);

const handleVideoUpload = async (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  // Check user role and video limit for Basic users
  if (userRole === 'BASIC') {
    if (videos.length >= 5) {
      setVideoUploadError('Basic users are limited to uploading a maximum of 5 videos. Upgrade to a premium plan to upload more.');
      setTimeout(() => setVideoUploadError(''), 5000);
      return;
    }
    if (videos.length + files.length > 5) {
      setVideoUploadError(`Basic users can only upload up to 5 videos. You can upload ${5 - videos.length} more video(s).`);
      setTimeout(() => setVideoUploadError(''), 5000);
      return;
    }
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('video', file);
    formData.append('videoFileNames', file.name);
  });

  try {
    setUploading(true);
    // Initialize progress for all files
    setUploadProgress(
      files.reduce((acc, file) => ({ ...acc, [file.name]: 0 }), {})
    );

    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/projects/${projectId}/upload-video`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        // Ensure progress events are captured
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const loaded = progressEvent.loaded;
          const percentCompleted = Math.round((loaded * 100) / total);
          console.log(`Upload progress: ${percentCompleted}%`); // Debug log

          // Update progress for all files
          setUploadProgress((prev) => {
            const updatedProgress = { ...prev };
            files.forEach((file) => {
              updatedProgress[file.name] = percentCompleted;
            });
            return updatedProgress;
          });
        },
      }
    );
    const { project, videoFiles } = response.data;

    if (videoFiles && Array.isArray(videoFiles)) {
      const updatedVideos = videoFiles.map((video) => {
        const fullFileName = video.videoFileName.split('/').pop();
        const originalFileName = fullFileName.replace(`${projectId}_`, '').replace(/^\d+_/, '');
        const sanitizedId = `video-${fullFileName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        return {
          id: sanitizedId,
          fileName: fullFileName,
          displayName: originalFileName,
          filePath: `${CDN_URL}/videos/projects/${projectId}/${encodeURIComponent(fullFileName)}`,
          duration: video.duration || 5,
          audioPath: video.audioPath
            ? `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(video.audioPath.split('/').pop())}`
            : null,
          waveformJsonPath: video.waveformJsonPath
            ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(video.waveformJsonPath.split('/').pop())}`
            : null,
        };
      });
      setVideos((prev) => [...prev, ...updatedVideos]);
      await Promise.all(updatedVideos.map((video) => generateVideoThumbnail(video)));
      setThumbnailsGenerated(true);
    }

    if (project) await fetchVideos();
  } catch (error) {
    console.error('Error uploading video:', error.response?.data || error.message);
    setVideoUploadError('Failed to upload video(s). Please try again.');
    setTimeout(() => setVideoUploadError(''), 5000);
  } finally {
    setUploading(false);
    setUploadProgress({}); // Clear progress
  }
};

  const fetchElements = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found in localStorage');
          setElements([]);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/global-elements`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Global elements response:', response.data); // Debug response

        const updatedElements = response.data
          .filter((element) => element.fileName && typeof element.fileName === 'string') // Filter valid elements
          .map((element) => {
            if (!element.fileName) {
              console.warn('Element with missing fileName:', element);
            }
            return {
              id: element.id || `element-${element.fileName || 'unknown'}-${Date.now()}`,
              fileName: element.fileName || 'unknown.png', // Fallback
              displayName: element.fileName || 'Untitled Element', // Use fileName directly
              filePath: `${CDN_URL}/elements/${encodeURIComponent(element.fileName || 'unknown.png')}`,
              thumbnail: `${CDN_URL}/elements/${encodeURIComponent(element.fileName || 'unknown.png')}`,
            };
          });

        setElements(updatedElements);
      } catch (error) {
        console.error('Error fetching global elements:', error);
        if (error.response?.status === 401) {
          alert('Session expired. Please log in again.');
          navigate('/login');
        } else if (error.response?.status === 403) {
          alert('You do not have permission to fetch elements. Please contact support.');
        } else {
          alert('Failed to fetch global elements. Please try again.');
        }
        setElements([]);
      }
    };

  const handleAudioUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('audio', file);
      formData.append('audioFileNames', file.name);
    });

    try {
      setUploading(true);
      setUploadProgress((prev) => ({
        ...prev,
        ...files.reduce((acc, file) => ({ ...acc, [file.name]: 0 }), {}),
      }));

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/upload-audio`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 1;
            const loaded = progressEvent.loaded;
            const percentCompleted = Math.round((loaded * 100) / total);
            files.forEach((file) => {
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: percentCompleted,
              }));
            });
          },
        }
      );
      const { project, audioFiles } = response.data;

      if (audioFiles && Array.isArray(audioFiles)) {
        const updatedAudios = audioFiles.map((audio) => {
          const fullFileName = audio.audioFileName.split('/').pop();
          const originalFileName = fullFileName.replace(`${projectId}_`, '').replace(/^\d+_/, '');
          const sanitizedId = `audio-${fullFileName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
          return {
            id: sanitizedId,
            fileName: fullFileName,
            displayName: originalFileName,
            audioPath: `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(fullFileName)}`,
            waveformJsonPath: audio.waveformJsonPath
              ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(audio.waveformJsonPath.split('/').pop())}`
              : null,
          };
        });
        setAudios(updatedAudios);
      }

      if (project) await fetchAudios();
    } catch (error) {
      console.error('Error uploading audio files:', error);
      alert('Failed to upload one or more audio files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({}); // Clear progress
    }
  };

const generateVideoThumbnail = async (video) => {
  if (!video || !video.fileName) return;
  if (video.thumbnail) return;
  const path = video.fileName; // fileName is the filename from videosJson
  const videoUrl = `${CDN_URL}/videos/projects/${projectId}/${encodeURIComponent(path)}`;
  try {
    const videoElement = document.createElement('video');
    videoElement.crossOrigin = 'anonymous';
    videoElement.src = videoUrl;
    await new Promise((resolve, reject) => {
      videoElement.onloadeddata = resolve;
      videoElement.onerror = reject;
      setTimeout(resolve, 5000);
    });
    const seekTime = Math.min(1, (video.duration || 0) * 0.25);
    videoElement.currentTime = seekTime;
    await new Promise((resolve) => {
      videoElement.onseeked = resolve;
      setTimeout(resolve, 2000);
    });
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const thumbnail = canvas.toDataURL('image/jpeg');
    video.thumbnail = thumbnail;
    setVideos((prevVideos) =>
      prevVideos.map((v) =>
        v.fileName === video.fileName ? { ...v, thumbnail } : v
      )
    );
  } catch (error) {
    console.error('Error creating thumbnail for video:', path, error);
  }
};

  const generateImageThumbnail = async (imagePath, isElement = false) => {
    const filename = imagePath.split('/').pop();
    const fullImagePath = `${CDN_URL}/image/projects/${projectId}/${encodeURIComponent(filename)}`;
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

  const handleSaveProject = async () => {
    if (!projectId || !sessionId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/save`,
        {},
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Project saved successfully!');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  };

  // const handleExportProject = async () => {
  //   if (!projectId || !sessionId) return;
  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await axios.post(
  //       `${API_BASE_URL}/projects/${projectId}/export`,
  //       {},
  //       { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     const exportedFileName = response.data;
  //     alert(`Project exported successfully as ${exportedFileName}!`);
  //   } catch (error) {
  //     console.error('Error exporting project:', error);
  //     alert('Failed to export project. Please try again.');
  //   }
  // };

  const handleExportProject = debounce(() => {
  if (!projectId || !sessionId) {
    alert('Cannot export: Missing project ID or session ID');
    return;
  }
  navigate(`/export/${projectId}`, { state: { sessionId } });
}, 300);

  const handleMediaDragStart = (e, media, type) => {
  const mediaId = media.id || `media-${media.fileName || media.displayName}-${Date.now()}`;
  const dragData = {
    type: type,
    isDragOperation: true,
    [type === 'media' ? 'video' : type === 'photo' ? 'photo' : type === 'audio' ? 'audio' : 'element']: {
      id: mediaId,
      filePath: type === 'media' ? `videos/projects/${projectId}/${media.fileName}` : undefined,
      fileName: type === 'audio' || type === 'photo' || type === 'element' ? media.fileName : media.fileName,
      displayPath: media.displayName || media.fileName?.split('/').pop(),
      duration: media.duration || 5,
      thumbnail: media.thumbnail || (type === 'photo' || type === 'element' ? media.filePath : undefined),
    },
  };
  const jsonString = JSON.stringify(dragData);
  e.dataTransfer.setData('application/json', jsonString);
  e.dataTransfer.setData('text/plain', jsonString);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'copyMove';
};

  const handleTextStyleDragStart = (e, style) => {
    const dragData = {
      type: 'textStyle',
      textStyle: {
        ...style,
        id: `text-style-${Date.now()}`,
      },
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTextStyleClick = async (style) => {
    if (!sessionId || !projectId || uploading) return;
    try {
      const token = localStorage.getItem('token');
      let startTime = roundToThreeDecimals(currentTime);
      let maxEndTime = 0;
      videoLayers.forEach((layer) => {
        layer.forEach((segment) => {
          const segmentEndTime = segment.startTime + segment.duration;
          if (segmentEndTime > maxEndTime) maxEndTime = segmentEndTime;
        });
      });
      startTime = Math.max(startTime, maxEndTime);

      const duration = style.duration || 5;

      // Create temporary segment with UUID
      const tempSegmentId = `temp-${uuidv4()}`;
      const tempSegment = {
        id: tempSegmentId,
        type: 'text',
        text: style.text,
        startTime: roundToThreeDecimals(startTime),
        duration: duration,
        layer: 0,
        fontFamily: style.fontFamily || 'Arial',
        scale: style.scale || 1.0,
        fontColor: style.fontColor || '#FFFFFF',
        backgroundColor: style.backgroundColor || 'transparent',
        positionX: style.positionX || 0,
        positionY: style.positionY || 0,
        alignment: style.alignment || 'center',
        backgroundOpacity: style.backgroundOpacity ?? 1.0,
        backgroundBorderWidth: style.backgroundBorderWidth ?? 0,
        backgroundBorderColor: style.backgroundBorderColor || '#000000',
        backgroundH: style.backgroundH ?? 0,
        backgroundW: style.backgroundW ?? 0,
        backgroundBorderRadius: style.backgroundBorderRadius ?? 0,
        textBorderColor: style.textBorderColor || 'transparent', // Added
        textBorderWidth: style.textBorderWidth ?? 0, // Added
        textBorderOpacity: style.textBorderOpacity ?? 1.0, // Added
        letterSpacing: style.letterSpacing ?? 0, // Added
        lineSpacing: style.lineSpacing ?? 1.2, // Added
        keyframes: {},
      };

      // Add temporary segment to videoLayers
      let updatedVideoLayers = videoLayers;
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[0] = [...(newLayers[0] || []), tempSegment];
        updatedVideoLayers = newLayers;
        return newLayers;
      });

      // Make API call
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-text`,
        {
          text: style.text,
          layer: 0,
          timelineStartTime: roundToThreeDecimals(startTime),
          timelineEndTime: roundToThreeDecimals(startTime + duration),
          fontFamily: style.fontFamily || 'Arial',
          scale: style.scale || 1.0,
          fontColor: style.fontColor || '#FFFFFF',
          backgroundColor: style.backgroundColor || 'transparent',
          positionX: style.positionX || 0,
          positionY: style.positionY || 0,
          alignment: style.alignment || 'center',
          backgroundOpacity: style.backgroundOpacity ?? 1.0,
          backgroundBorderWidth: style.backgroundBorderWidth ?? 0,
          backgroundBorderColor: style.backgroundBorderColor || '#000000',
          backgroundH: style.backgroundH ?? 0,
          backgroundW: style.backgroundW ?? 0,
          backgroundBorderRadius: style.backgroundBorderRadius ?? 0,
          textBorderColor: style.textBorderColor || 'transparent', // Added
          textBorderWidth: style.textBorderWidth ?? 0, // Added
          textBorderOpacity: style.textBorderOpacity ?? 1.0, // Added
          letterSpacing: style.letterSpacing ?? 0, // Added
          lineSpacing: style.lineSpacing ?? 1.2, // Added
        },
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      );

      const newTextSegment = response.data;

      // Validate response
      if (!newTextSegment.textSegmentId) {
        throw new Error('Backend did not return textSegmentId');
      }

      // Update temporary segment with backend data
      const updatedSegment = {
        id: newTextSegment.textSegmentId,
        type: 'text',
        text: newTextSegment.text,
        startTime: roundToThreeDecimals(newTextSegment.timelineStartTime),
        duration: roundToThreeDecimals(newTextSegment.timelineEndTime - newTextSegment.timelineStartTime),
        layer: newTextSegment.layer,
        fontFamily: newTextSegment.fontFamily,
        scale: newTextSegment.scale || 1.0,
        fontColor: newTextSegment.fontColor,
        backgroundColor: newTextSegment.backgroundColor,
        positionX: newTextSegment.positionX || 0,
        positionY: newTextSegment.positionY || 0,
        alignment: newTextSegment.alignment,
        backgroundOpacity: newTextSegment.backgroundOpacity ?? 1.0,
        backgroundBorderWidth: newTextSegment.backgroundBorderWidth ?? 0,
        backgroundBorderColor: newTextSegment.backgroundBorderColor || '#000000',
        backgroundH: newTextSegment.backgroundH ?? 0,
        backgroundW: newTextSegment.backgroundW ?? 0,
        backgroundBorderRadius: newTextSegment.backgroundBorderRadius ?? 0,
        textBorderColor: newTextSegment.textBorderColor || 'transparent', // Added
        textBorderWidth: newTextSegment.textBorderWidth ?? 0, // Added
        textBorderOpacity: newTextSegment.textBorderOpacity ?? 1.0, // Added
        letterSpacing: newTextSegment.letterSpacing ?? 0, // Added
        lineSpacing: newTextSegment.lineSpacing ?? 1.2, // Added
        keyframes: newTextSegment.keyframes || {},
      };

      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[0] = newLayers[0].map((item) =>
          item.id === tempSegmentId ? updatedSegment : item
        );
        updatedVideoLayers = newLayers;
        return newLayers;
      });

      setTotalDuration((prev) => Math.max(prev, startTime + duration));
      setSelectedSegment(updatedSegment);
      setEditingTextSegment(updatedSegment);
      setTextSettings({
        text: updatedSegment.text,
        fontFamily: updatedSegment.fontFamily,
        scale: updatedSegment.scale,
        fontColor: updatedSegment.fontColor,
        backgroundColor: updatedSegment.backgroundColor,
        duration: updatedSegment.duration,
        alignment: updatedSegment.alignment,
        backgroundOpacity: updatedSegment.backgroundOpacity,
        backgroundBorderWidth: updatedSegment.backgroundBorderWidth,
        backgroundBorderColor: updatedSegment.backgroundBorderColor,
        backgroundH: updatedSegment.backgroundH,
        backgroundW: updatedSegment.backgroundW,
        backgroundBorderRadius: updatedSegment.backgroundBorderRadius,
        textBorderColor: updatedSegment.textBorderColor, // Added
        textBorderWidth: updatedSegment.textBorderWidth, // Added
        textBorderOpacity: updatedSegment.textBorderOpacity, // Added
        letterSpacing: updatedSegment.letterSpacing, // Added
        lineSpacing: updatedSegment.lineSpacing, // Added
      });
      setIsTextToolOpen(true);
      saveHistory();

      // Trigger auto-save
      setTimeout(() => {
        autoSaveProject(updatedVideoLayers, audioLayers);
      }, 1000);
    } catch (error) {
      console.error('Error adding text style to timeline:', error);
      alert('Failed to add text style to timeline. Please try again.');
    }
  };

  const handleVideoClick = debounce(async (video, isDragEvent = false) => {
    if (isDragEvent) return;
    setSelectedVideo(video);
    if (!sessionId || !projectId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
        params: { sessionId },
        headers: { Authorization: `Bearer ${token}` },
      });
      let timelineState =
        response.data.timelineState
          ? typeof response.data.timelineState === 'string'
            ? JSON.parse(response.data.timelineState)
            : response.data.timelineState
          : { segments: [], textSegments: [], imageSegments: [] };

      let endTime = 0;
      const allSegments = [
        ...(timelineState.segments || []),
        ...(timelineState.textSegments || []),
        ...(timelineState.imageSegments || []),
      ];
      if (allSegments.length > 0) {
        allSegments.forEach((segment) => {
          const segmentEndTime = segment.timelineStartTime + (segment.timelineEndTime - segment.timelineStartTime);
          if (segmentEndTime > endTime) endTime = segmentEndTime;
        });
      }

      const timelineStartTime = endTime;
      let selectedLayer = findAvailableLayer(timelineStartTime, null, videoLayers);

      let updatedVideoLayers = videoLayers;
      let updatedAudioLayers = audioLayers;

      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        while (newLayers.length <= selectedLayer) {
          newLayers.push([]);
        }
        updatedVideoLayers = newLayers;
        return newLayers;
      });

      const newSegment = await addVideoToTimeline(
        video.fileName,
        selectedLayer,
        timelineStartTime,
        null,
        0,
        null
      );

      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        while (newLayers.length <= selectedLayer) newLayers.push([]);
        const exists = newLayers[selectedLayer].some((segment) => segment.id === newSegment.id);
        if (!exists) {
          newLayers[selectedLayer].push(newSegment);
        } else {
          console.warn(`Segment with id ${newSegment.id} already exists in layer ${selectedLayer}`);
        }
        updatedVideoLayers = newLayers;
        return newLayers;
      });

      const segmentDuration = newSegment.timelineEndTime - newSegment.timelineStartTime;
      setTotalDuration((prev) => Math.max(prev, timelineStartTime + segmentDuration));


      // Save history and auto-save with updated layers
      saveHistory();
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        autoSaveProject(updatedVideoLayers, updatedAudioLayers);
      }, 1000);
    } catch (error) {
      console.error('Error adding video to timeline:', error);
      alert('Failed to add video to timeline. Please try again.');
    }
  }, 300);

  const addImageToTimeline = async (imageFileName, layer, timelineStartTime, timelineEndTime, isElement = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-project-image-to-timeline`,
        {
          imageFileName,
          layer: layer || 0,
          timelineStartTime: timelineStartTime || 0,
          timelineEndTime: timelineEndTime || timelineStartTime + 5,
          isElement,
        },
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      );
  
      const newImageSegment = response.data;
      if (!newImageSegment) {
        throw new Error(`Failed to add image segment for ${imageFileName}`);
      }
  
      const photo = isElement ? elements.find((e) => e.fileName === imageFileName) : photos.find((p) => p.fileName === imageFileName);
      if (!photo && !isElement) {
        throw new Error(`Photo with fileName ${imageFileName} not found`);
      }
  
      const newSegment = {
        id: newImageSegment.id,
        type: 'image',
        fileName: imageFileName,
        filePath: isElement
          ? `${CDN_URL}/elements/${encodeURIComponent(imageFileName)}`
          : `${CDN_URL}/image/projects/${projectId}/${encodeURIComponent(imageFileName)}`,
        startTime: newImageSegment.timelineStartTime,
        duration: newImageSegment.timelineEndTime - newImageSegment.timelineStartTime,
        layer: layer || 0,
        positionX: newImageSegment.positionX || 0,
        positionY: newImageSegment.positionY || 0,
        scale: newImageSegment.scale || 1,
        opacity: newImageSegment.opacity || 1,
        filters: newImageSegment.filters || [],
        keyframes: newImageSegment.keyframes || {},
        thumbnail: photo?.thumbnail,
        isElement: isElement || newImageSegment.element || false,
        width: newImageSegment.width,
        height: newImageSegment.height,
        effectiveWidth: newImageSegment.effectiveWidth,
        effectiveHeight: newImageSegment.effectiveHeight,
        maintainAspectRatio: newImageSegment.maintainAspectRatio,
        rotation: newImageSegment.rotation || 0,
      };
  
      let updatedVideoLayers = videoLayers;
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        while (newLayers.length <= layer) newLayers.push([]);
        const exists = newLayers[layer].some((segment) => segment.id === newSegment.id);
        if (!exists) {
          newLayers[layer].push(newSegment);
        } else {
          console.warn(`Segment with id ${newSegment.id} already exists in layer ${layer}`);
        }
        updatedVideoLayers = newLayers;
        return newLayers;
      });
  
      setTotalDuration((prev) => Math.max(prev, newSegment.startTime + newSegment.duration));
  
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        autoSaveProject(updatedVideoLayers, audioLayers);
      }, 1000);
  
      saveHistory();
      return newSegment;
    } catch (error) {
      console.error('Error adding image to timeline:', error);
      throw error;
    }
  };

const addVideoToTimeline = async (videoPath, layer, timelineStartTime, timelineEndTime, startTimeWithinVideo, endTimeWithinVideo) => {
  try {
    if (!videoPath) {
      throw new Error('videoPath is undefined or null');
    }
    const token = localStorage.getItem('token');
    const fileName = videoPath.includes('/') ? videoPath.split('/').pop() : videoPath;
    const response = await axios.post(
      `${API_BASE_URL}/projects/${projectId}/add-to-timeline`,
      {
        videoPath: fileName,
        layer: layer || 0,
        timelineStartTime: timelineStartTime || 0,
        timelineEndTime: timelineEndTime || null,
        startTime: startTimeWithinVideo || 0,
        endTime: endTimeWithinVideo || null,
        speed: 1.0,
      },
      { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
    );
    const { videoSegmentId, audioSegmentId, audioPath, waveformJsonPath } = response.data;

    const segmentResponse = await axios.get(
      `${API_BASE_URL}/projects/${projectId}/get-segment`,
      {
        params: { sessionId, segmentId: videoSegmentId },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const videoSegment = segmentResponse.data.videoSegment;
    if (!videoSegment) {
      throw new Error(`Newly created video segment ${videoSegmentId} not found`);
    }

    const video = videos.find((v) => v.fileName === fileName);
    if (!video) {
      throw new Error(`Video with fileName ${fileName} not found in videos list`);
    }

    const newSegment = {
      id: videoSegment.id,
      type: 'video',
      startTime: videoSegment.timelineStartTime,
      duration: videoSegment.timelineEndTime - videoSegment.timelineStartTime,
      filePath: `${CDN_URL}/videos/projects/${projectId}/${encodeURIComponent(fileName)}`,
      layer: layer || 0,
      positionX: videoSegment.positionX || 0,
      positionY: videoSegment.positionY || 0,
      scale: videoSegment.scale || 1,
      startTimeWithinVideo: videoSegment.startTime || 0,
      endTimeWithinVideo: videoSegment.endTime || (videoSegment.timelineEndTime - videoSegment.timelineStartTime),
      thumbnail: video.thumbnail,
      filters: videoSegment.filters || [],
      audioSegmentId: audioSegmentId || null,
      speed: videoSegment.speed || 1.0,
      rotation: videoSegment.rotation || 0,
      displayName: video.displayName || fileName,
    };

    let updatedVideoLayers = videoLayers;
    setVideoLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      while (newLayers.length <= layer) newLayers.push([]);
      newLayers[layer] = [...newLayers[layer], newSegment];
      updatedVideoLayers = newLayers;
      return newLayers;
    });

    let updatedAudioLayers = audioLayers;
    if (audioSegmentId && segmentResponse.data.audioSegment) {
      const audioSegment = segmentResponse.data.audioSegment;
      const audioLayerIndex = Math.abs(audioSegment.layer) - 1;
      const sanitizedAudioId = audioSegment.id.replace(/[^a-zA-Z0-9]/g, '-');
      let tempSegmentId = `temp-${uuidv4()}`;
      while (updatedAudioLayers.some((layer) => layer.some((segment) => segment.id === tempSegmentId))) {
        tempSegmentId = `temp-${uuidv4()}`;
      }

      const tempAudioSegment = {
        id: tempSegmentId,
        type: 'audio',
        fileName: audioSegment.audioFileName || audioSegment.audioPath.split('/').pop(),
        url: audioSegment.extracted
          ? `${CDN_URL}/audio/projects/${projectId}/extracted/${encodeURIComponent(audioSegment.audioPath.split('/').pop())}`
          : audioPath
          ? `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(audioPath.split('/').pop())}`
          : null,
        waveformJsonPath: audioSegment.waveformJsonPath
          ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(audioSegment.waveformJsonPath.split('/').pop())}`
          : waveformJsonPath
          ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(waveformJsonPath.split('/').pop())}`
          : null,
        startTime: roundToThreeDecimals(audioSegment.timelineStartTime),
        duration: roundToThreeDecimals(audioSegment.timelineEndTime - audioSegment.timelineStartTime),
        timelineStartTime: roundToThreeDecimals(audioSegment.timelineStartTime),
        timelineEndTime: roundToThreeDecimals(audioSegment.timelineEndTime),
        startTimeWithinAudio: roundToThreeDecimals(audioSegment.startTime || 0),
        endTimeWithinAudio: roundToThreeDecimals(audioSegment.endTime || (audioSegment.timelineEndTime - audioSegment.timelineStartTime)),
        layer: audioSegment.layer,
        displayName: audioSegment.audioPath
          ? audioSegment.audioPath.split('/').pop()
          : audioSegment.audioFileName,
        volume: audioSegment.volume || 1.0,
        keyframes: audioSegment.keyframes || {},
        extracted: audioSegment.extracted || false,
      };

      setAudioLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        while (newLayers.length <= audioLayerIndex) newLayers.push([]);
        const existingSegment = newLayers[audioLayerIndex].find((s) => s.id === tempAudioSegment.id);
        if (existingSegment) {
          console.warn(`Segment with ID ${tempAudioSegment.id} already exists in layer ${audioLayerIndex}. Updating instead.`);
          newLayers[audioLayerIndex] = newLayers[audioLayerIndex].map((s) =>
            s.id === tempAudioSegment.id ? { ...s, ...tempAudioSegment, layer: audioSegment.layer } : s
          );
        } else {
          newLayers[audioLayerIndex].push(tempAudioSegment);
        }
        updatedAudioLayers = newLayers;

        // Initialize waveform for temporary ID
        if (window.initializeWaveform) {
          console.log('Calling initializeWaveform for temporary audio segment:', tempAudioSegment.id);
          window.initializeWaveform(tempAudioSegment).then((cleanupFn) => {
            if (typeof cleanupFn === 'function') {
              // Store cleanup function if needed
              console.log(`Waveform initialized for temp ID ${tempAudioSegment.id}`);
            }
          });
        }

        return newLayers;
      });

      setAudioLayers((prevLayers) => {
        const updatedLayers = prevLayers.map((layer, index) => {
          if (index === audioLayerIndex) {
            return layer.map((item) =>
              item.id === tempSegmentId
                ? {
                    ...item,
                    id: sanitizedAudioId,
                    startTime: roundToThreeDecimals(audioSegment.timelineStartTime),
                    duration: roundToThreeDecimals(audioSegment.timelineEndTime - audioSegment.timelineStartTime),
                    timelineStartTime: roundToThreeDecimals(audioSegment.timelineStartTime),
                    timelineEndTime: roundToThreeDecimals(audioSegment.timelineEndTime),
                    startTimeWithinAudio: roundToThreeDecimals(audioSegment.startTime || 0),
                    endTimeWithinAudio: roundToThreeDecimals(audioSegment.endTime || (audioSegment.timelineEndTime - audioSegment.timelineStartTime)),
                    volume: audioSegment.volume || 1.0,
                    keyframes: audioSegment.keyframes || {},
                    waveformJsonPath: audioSegment.waveformJsonPath
                      ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(audioSegment.waveformJsonPath.split('/').pop())}`
                      : waveformJsonPath,
                    url: audioSegment.extracted
                      ? `${CDN_URL}/audio/projects/${projectId}/extracted/${encodeURIComponent(audioSegment.audioPath.split('/').pop())}`
                      : `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(audioSegment.audioPath.split('/').pop())}`,
                    extracted: audioSegment.extracted || false,
                  }
                : item
            );
          }
          return layer;
        });
        updatedAudioLayers = updatedLayers;

        // Transfer WaveSurfer instance from tempSegmentId to sanitizedAudioId
        if (window.waveSurferInstances && window.waveSurferInstances.current.has(tempSegmentId)) {
          console.log(`Transferring WaveSurfer instance from ${tempSegmentId} to ${sanitizedAudioId}`);
          const wavesurfer = window.waveSurferInstances.current.get(tempSegmentId);
          window.waveSurferInstances.current.set(sanitizedAudioId, wavesurfer);
          window.waveSurferInstances.current.delete(tempSegmentId);
          // Update waveform with final segment data
          if (window.updateWaveform) {
            console.log('Calling updateWaveform for audio segment with final ID:', sanitizedAudioId);
            window.updateWaveform({
              ...tempAudioSegment,
              id: sanitizedAudioId,
              waveformJsonPath: audioSegment.waveformJsonPath
                ? `${CDN_URL}/audio/projects/${projectId}/waveforms/${encodeURIComponent(audioSegment.waveformJsonPath.split('/').pop())}`
                : waveformJsonPath,
              url: audioSegment.extracted
                ? `${CDN_URL}/audio/projects/${projectId}/extracted/${encodeURIComponent(audioSegment.audioPath.split('/').pop())}`
                : `${CDN_URL}/audio/projects/${projectId}/${encodeURIComponent(audioSegment.audioPath.split('/').pop())}`,
              extracted: audioSegment.extracted || false,
            });
          }
        }

        return updatedLayers;
      });
    }

    setTotalDuration((prev) => Math.max(prev, newSegment.startTime + newSegment.duration));

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      autoSaveProject(updatedVideoLayers, updatedAudioLayers);
    }, 1000);

    saveHistory();
    return newSegment;
  } catch (error) {
    console.error('Error adding video to timeline:', error.response?.data || error.message);
    throw error;
  }
};

const handleTimeUpdate = (newTime, updatePlayhead = true) => {
  const clampedTime = Math.max(0, Math.min(totalDuration, newTime));
  setCurrentTime(clampedTime);
  if (updatePlayhead && timelineSetPlayhead) {
    timelineSetPlayhead(clampedTime, false);
  }
};

const handleDeleteSegment = async () => {
  if (!selectedSegment || !sessionId || !projectId) return;

  try {
    const token = localStorage.getItem('token');
    let endpoint = '';
    switch (selectedSegment.type) {
      case 'video':
        endpoint = `${API_BASE_URL}/projects/timeline/video/${sessionId}/${selectedSegment.id}`;
        break;
      case 'audio':
        endpoint = `${API_BASE_URL}/projects/timeline/audio/${sessionId}/${selectedSegment.id}`;
        break;
      case 'image':
        endpoint = `${API_BASE_URL}/projects/timeline/image/${sessionId}/${selectedSegment.id}`;
        break;
      case 'text':
        endpoint = `${API_BASE_URL}/projects/timeline/text/${sessionId}/${selectedSegment.id}`;
        break;
      default:
        console.error('Unknown segment type:', selectedSegment.type);
        return;
    }

    await axios.delete(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const transitionsToDelete = transitions.filter(
      (transition) => transition.segmentId === selectedSegment.id
    );

    for (const transition of transitionsToDelete) {
      try {
        await axios.delete(
          `${API_BASE_URL}/projects/${projectId}/remove-transition`,
          {
            params: { sessionId, transitionId: transition.id },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        console.error(`Error deleting transition ${transition.id}:`, error);
      }
    }

    let updatedVideoLayers = videoLayers;
    let updatedAudioLayers = audioLayers;
    if (selectedSegment.type === 'audio') {
      setAudioLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        const layerIndex = Math.abs(selectedSegment.layer) - 1;
        newLayers[layerIndex] = newLayers[layerIndex].filter(
          (item) => item.id !== selectedSegment.id
        );
        updatedAudioLayers = newLayers;
        return newLayers;
      });
    } else {
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[selectedSegment.layer] = newLayers[selectedSegment.layer].filter(
          (item) => item.id !== selectedSegment.id
        );
        updatedVideoLayers = newLayers;
        return newLayers;
      });
    }

    setTransitions((prevTransitions) =>
      prevTransitions.filter(
        (transition) => transition.segmentId !== selectedSegment.id
      )
    );

    const allLayers = [...updatedVideoLayers, ...updatedAudioLayers];
    let maxEndTime = 0;
    allLayers.forEach((layer) => {
      layer.forEach((item) => {
        const endTime = item.startTime + item.duration;
        if (endTime > maxEndTime) maxEndTime = endTime;
      });
    });
    setTotalDuration(maxEndTime);

    setSelectedSegment(null);
    setIsTextToolOpen(false);
    setIsTransformOpen(false);
    setIsFiltersOpen(false);

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      autoSaveProject(updatedVideoLayers, updatedAudioLayers);
    }, 1000);
  } catch (error) {
    console.error('Error deleting segment:', error);
    alert('Failed to delete segment. Please try again.');
  }
};

// Replace the existing useEffect for keydown events
// In ProjectEditor.js, replace or update the existing keydown useEffect
useEffect(() => {
  const frameDuration = 1 / projectFps;
  const handleKeyDown = (e) => {
    if (!isPlaying) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault(); // Prevent scrolling
        handleTimeUpdate(Math.max(0, currentTime - frameDuration), true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault(); // Prevent scrolling
        handleTimeUpdate(Math.min(totalDuration, currentTime + frameDuration), true);
      } else if (isTimelineSelected && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault(); // Prevent scrolling
        // Collect all segment start and end times
        const times = [];
        [...videoLayers, ...audioLayers].forEach((layer) => {
          layer.forEach((segment) => {
            times.push(segment.startTime); // Start time
            times.push(segment.startTime + segment.duration); // End time
          });
        });
        // Remove duplicates and sort
        const uniqueTimes = [...new Set(times)].sort((a, b) => a - b);
        if (uniqueTimes.length === 0) return;
        let newTime;
        if (e.key === 'ArrowUp') {
          // Move to previous boundary
          // If exactly on a boundary, find the previous one; otherwise, include current boundary
          const isOnBoundary = uniqueTimes.some((t) => Math.abs(t - currentTime) < 0.0001);
          newTime = uniqueTimes
            .slice()
            .reverse()
            .find((t) => (isOnBoundary ? t < currentTime : t <= currentTime)) || uniqueTimes[0];
        } else {
          // Move to next boundary
          newTime = uniqueTimes.find((t) => t > currentTime) || uniqueTimes[uniqueTimes.length - 1];
        }
        if (newTime !== undefined) {
          handleTimeUpdate(newTime, true);
        }
      }
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isPlaying, totalDuration, currentTime, projectFps, isTimelineSelected, videoLayers, audioLayers, handleTimeUpdate]);

useEffect(() => {
  if (isPlaying && currentTime >= totalDuration) {
    setIsPlaying(false);
    setCurrentTime(totalDuration);
  }
}, [currentTime, isPlaying, totalDuration]);

const handleMouseDown = (e) => {
  e.preventDefault();
  setIsDraggingHandle(true);
};

const handleTouchStart = (e) => {
  e.preventDefault();
  setIsDraggingHandle(true);
};

const handleMouseMove = (e) => {
  if (!isDraggingHandle) return;
  const contentWrapper = document.querySelector('.content-wrapper');
  const wrapperHeight = contentWrapper.clientHeight;
  const controlsPanelHeight = 60;
  const resizeHandleHeight = 6;
  const zoomSliderHeight = 40;
  const previewMarginTotal = 40;

  // Use clientY from mouse or first touch
  const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;

  const availableHeight = wrapperHeight - controlsPanelHeight - resizeHandleHeight - zoomSliderHeight - previewMarginTotal;

  const wrapperTop = contentWrapper.getBoundingClientRect().top;
  const distanceFromTop = clientY - wrapperTop;

  const previewHeightPx = distanceFromTop - resizeHandleHeight - 20;
  const minPreviewHeight = 100;
  const maxPreviewHeight = availableHeight - 100;
  const clampedPreviewHeight = Math.max(minPreviewHeight, Math.min(maxPreviewHeight, previewHeightPx));

  const remainingHeight = availableHeight - clampedPreviewHeight;
  const timelineHeightPercent = (remainingHeight / availableHeight) * 100;
  const minTimelineHeight = 10;
  const maxTimelineHeight = 75;
  const clampedTimelineHeight = Math.max(minTimelineHeight, Math.min(maxTimelineHeight, timelineHeightPercent));

  setPreviewHeight(`${clampedPreviewHeight}px`);
  setTimelineHeight(clampedTimelineHeight);
};

const handleMouseUp = () => {
  setIsDraggingHandle(false);
};

const handleTouchEnd = () => {
  setIsDraggingHandle(false);
};

useEffect(() => {
  if (isMobile) return; // Skip event listeners for mobile

  const handleTouchMove = (e) => {
    handleMouseMove(e);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
}, [isDraggingHandle, isMobile]);

const toggleSection = (section) => {
  if (expandedSection === section) {
    setExpandedSection(null);
    setIsContentPanelOpen(false);
    // Reset tool panel states when closing
    setIsTransformOpen(false);
    setIsFiltersOpen(false);
    setIsTextToolOpen(false);
    setIsTransitionsOpen(false);
  } else {
    setExpandedSection(section);
    setIsContentPanelOpen(true);
    // Update tool panel states based on section
    setIsTransformOpen(section === 'transform');
    setIsFiltersOpen(section === 'filters');
    setIsTextToolOpen(section === 'text' && selectedSegment?.type === 'text');
    setIsTransitionsOpen(section === 'transitions');
  }
};

const handleSegmentSelect = async (segment) => {
  setSelectedSegment(segment);
  if (segment) {
    let initialValues = {};
    switch (segment.type) {
      case 'video':
        initialValues = {
          positionX: segment.positionX || 0,
          positionY: segment.positionY || 0,
          scale: segment.scale || 1,
          opacity: segment.opacity || 1,
          cropL: segment.cropL !== undefined ? segment.cropL : 0,
          cropR: segment.cropR !== undefined ? segment.cropR : 0,
          cropT: segment.cropT !== undefined ? segment.cropT : 0,
          cropB: segment.cropB !== undefined ? segment.cropB : 0,
          speed: segment.speed || 1.0, // Add speed with default 1.0
          rotation: segment.rotation || 0, // Add rotation
      };
      break;
      case 'image':
        initialValues = {
          positionX: segment.positionX || 0,
          positionY: segment.positionY || 0,
          scale: segment.scale || 1,
          opacity: segment.opacity || 1,
          cropL: segment.cropL !== undefined ? segment.cropL : 0,
          cropR: segment.cropR !== undefined ? segment.cropR : 0,
          cropT: segment.cropT !== undefined ? segment.cropT : 0,
          cropB: segment.cropB !== undefined ? segment.cropB : 0,
          rotation: segment.rotation || 0, // Add rotation
        };
        break;
      case 'text':
        initialValues = {
          positionX: segment.positionX || 0,
          positionY: segment.positionY || 0,
          scale: segment.scale || 1,
          opacity: segment.opacity || 1,
          rotation: segment.rotation || 0, // Add rotation
        };
        break;
      case 'audio':
        initialValues = {
          volume: segment.volume || 1.0,
        };
        break;
      default:
        break;
    }

    // Fetch keyframes and ensure they're set correctly
    const segmentData = await fetchKeyframes(segment.id, segment.type);
    const keyframesData = segmentData?.keyframes || {};
    console.log(`Setting keyframes for ${segment.type} ${segment.id}:`, keyframesData);

    // Calculate relative time
    const relativeTime = currentTime - segment.startTime;
    setCurrentTimeInSegment(Math.max(0, Math.min(segment.duration, relativeTime)));

    // Update initialValues with keyframe values
    Object.keys(keyframesData).forEach((prop) => {
      const propKeyframes = keyframesData[prop] || [];
      if (propKeyframes.length > 0) {
        const value = getValueAtTime(propKeyframes, currentTimeInSegment);
        if (value !== null) {
          initialValues[prop] = value;
        }
      }
    });

    console.log('Initial tempSegmentValues:', initialValues);
    setTempSegmentValues(initialValues);

    // Update layers with keyframes
    if (segment.type !== 'audio') {
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[segment.layer] = newLayers[segment.layer].map((item) =>
          item.id === segment.id ? { ...item, keyframes: keyframesData } : item
        );
        console.log(`Updated videoLayers[${segment.layer}] for ${segment.id}:`, newLayers[segment.layer]);
        return newLayers;
      });
    } else {
      setAudioLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        const layerIndex = Math.abs(segment.layer) - 1;
        newLayers[layerIndex] = newLayers[layerIndex].map((item) =>
          item.id === segment.id ? { ...item, keyframes: keyframesData } : item
        );
        return newLayers;
      });
    }

    // Update textSettings for text segments
    if (segment.type === 'text') {
      setTextSettings({
        text: segment.text || 'New Text',
        fontFamily: segment.fontFamily || 'Arial',
        fontColor: segment.fontColor || '#FFFFFF',
        backgroundColor: segment.backgroundColor || 'transparent',
        duration: segment.duration || 5,
        alignment: segment.alignment || 'center',
        backgroundOpacity: segment.backgroundOpacity ?? 1.0,
        backgroundBorderWidth: segment.backgroundBorderWidth ?? 0,
        backgroundBorderColor: segment.backgroundBorderColor || '#000000',
        backgroundH: segment.backgroundH ?? 0,
        backgroundW: segment.backgroundW ?? 0,
        backgroundBorderRadius: segment.backgroundBorderRadius ?? 0,
        textBorderColor: segment.textBorderColor || 'transparent',
        textBorderWidth: segment.textBorderWidth ?? 0,
        textBorderOpacity: segment.textBorderOpacity ?? 1.0,
        // Include transform properties from initialValues
        scale: initialValues.scale,
        positionX: initialValues.positionX,
        positionY: initialValues.positionY,
        opacity: initialValues.opacity,
      });
      setIsTextToolOpen(true);
    } else {
      setIsTextToolOpen(false);
    }

    // Fetch filters for video/image
    if (segment.type === 'video' || segment.type === 'image') {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_BASE_URL}/projects/${projectId}/segments/${segment.id}/filters`,
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const filters = response.data || [];
        setAppliedFilters(filters);

        const initialFilterParams = {
          brightness: 0,
          contrast: 1,
          saturation: 1,
          hue: 0,
          blur: 0,
          sharpen: 0,
          grayscale: '',
          invert: '',
          flip: '',
        };
        filters.forEach((filter) => {
          if (filter.filterName === 'flip') {
            initialFilterParams.flip = ['horizontal', 'vertical', 'both'].includes(filter.filterValue)
              ? filter.filterValue
              : '';
          } else {
            initialFilterParams[filter.filterName] =
              parseFloat(filter.filterValue) || initialFilterParams[filter.filterName];
          }
        });

        setFilterParams(initialFilterParams);

        setVideoLayers((prevLayers) => {
          const newLayers = [...prevLayers];
          newLayers[segment.layer] = newLayers[segment.layer].map((item) =>
            item.id === segment.id ? { ...item, filters } : item
          );
          return newLayers;
        });

        // Force re-render of VideoPreview to ensure filters are applied
        setCurrentTime((prev) => prev + 0);
      } catch (error) {
        console.error('Error fetching filters for segment:', error);
        setAppliedFilters([]);
        setFilterParams({
          brightness: 0,
          contrast: 1,
          saturation: 1,
          hue: 0,
          blur: 0,
          sharpen: 0,
          grayscale: '',
          invert: '',
          flip: '',
        });
      }
    } else {
      setAppliedFilters([]);
      setFilterParams({
        brightness: 0,
        contrast: 1,
        saturation: 1,
        hue: 0,
        blur: 0,
        sharpen: 0,
        grayscale: '',
        invert: '',
        flip: '',
      });
    }
    await fetchTransitions();
  } else {
    setTempSegmentValues({});
    setAppliedFilters([]);
    setFilterParams({
      brightness: 0,
      contrast: 1,
      saturation: 1,
      hue: 0,
      blur: 0,
      sharpen: 0,
    });
    setKeyframes({});
    setCurrentTimeInSegment(0);
    setIsTextToolOpen(false);
  }
  handleTextSegmentSelect(segment);
};

const fetchKeyframes = async (segmentId, segmentType) => {
  try {
    const token = localStorage.getItem('token');
    let response;
    switch (segmentType) {
      case 'video':
      case 'image':
      case 'text':
      case 'audio':
        response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        });
        const timelineState =
          typeof response.data.timelineState === 'string'
            ? JSON.parse(response.data.timelineState)
            : response.data.timelineState;
        let segments;
        if (segmentType === 'video') {
          segments = timelineState.segments || [];
        } else if (segmentType === 'image') {
          segments = timelineState.imageSegments || [];
        } else if (segmentType === 'text') {
          segments = timelineState.textSegments || [];
        } else {
          segments = timelineState.audioSegments || [];
        }
        const segment = segments.find((s) => s.id === segmentId);
        response = { data: segment || {} };
        break;
      default:
        throw new Error('Invalid segment type');
    }
    const segmentData = response.data;
    console.log(`Fetched keyframes for ${segmentType} segment ${segmentId}:`, segmentData.keyframes);
    const keyframesData = segmentData?.keyframes || {};
    setKeyframes(keyframesData);
    return segmentData;
  } catch (error) {
    console.error(`Error fetching keyframes for ${segmentType}:`, error);
    setKeyframes({});
    return null;
  }
};

const getValueAtTime = (keyframesArray, time) => {
  if (!keyframesArray || keyframesArray.length === 0) return null;
  const sorted = [...keyframesArray].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      const t = (time - sorted[i].time) / (sorted[i + 1].time - sorted[i].time);
      return sorted[i].value + t * (sorted[i + 1].value - sorted[i].value);
    }
  }
  return sorted[0].value;
};

const addKeyframe = async (property, value) => {
  if (!selectedSegment) return;
  const time = currentTimeInSegment;

  const currentKeyframes = keyframes || {};
  const updatedPropertyKeyframes = (currentKeyframes[property] || []).filter(
    (kf) => !areTimesEqual(kf.time, time)
  );
  updatedPropertyKeyframes.push({ time, value, interpolationType: 'linear' });
  updatedPropertyKeyframes.sort((a, b) => a.time - b.time);

  const updatedKeyframes = {
    ...currentKeyframes,
    [property]: updatedPropertyKeyframes,
  };

  setKeyframes(updatedKeyframes);

  let updatedVideoLayers = videoLayers;
  let updatedAudioLayers = audioLayers;
  if (selectedSegment.type === 'audio') {
    setAudioLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      const layerIndex = Math.abs(selectedSegment.layer) - 1;
      newLayers[layerIndex] = newLayers[layerIndex].map((item) =>
        item.id === selectedSegment.id ? { ...item, keyframes: updatedKeyframes } : item
      );
      updatedAudioLayers = newLayers;
      return newLayers;
    });
  } else {
    setVideoLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      newLayers[selectedSegment.layer] = newLayers[selectedSegment.layer].map((item) =>
        item.id === selectedSegment.id ? { ...item, keyframes: updatedKeyframes } : item
      );
      updatedVideoLayers = newLayers;
      return newLayers;
    });
  }

  setTempSegmentValues((prev) => ({
    ...prev,
    [property]: value,
  }));

  try {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_BASE_URL}/projects/${projectId}/add-keyframe`,
      {
        segmentId: selectedSegment.id,
        segmentType: selectedSegment.type,
        property,
        time,
        value,
        interpolationType: 'linear',
      },
      { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
    );

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      autoSaveProject(updatedVideoLayers, updatedAudioLayers);
    }, 1000);
  } catch (error) {
    console.error('Error adding keyframe:', error);
  }
};

const removeKeyframe = async (property, time) => {
  if (!selectedSegment) return;

  // Store the current keyframes for potential rollback
  const previousKeyframes = { ...keyframes };

  // Optimistically update the keyframes state
  const updatedKeyframes = {
    ...keyframes,
    [property]: (keyframes[property] || []).filter((kf) => !areTimesEqual(kf.time, time)),
  };
  setKeyframes(updatedKeyframes);

  // Update layers with the optimistic keyframes
  let updatedVideoLayers = videoLayers;
  let updatedAudioLayers = audioLayers;
  if (selectedSegment.type === 'audio') {
    setAudioLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      const layerIndex = Math.abs(selectedSegment.layer) - 1;
      newLayers[layerIndex] = newLayers[layerIndex].map((item) =>
        item.id === selectedSegment.id ? { ...item, keyframes: updatedKeyframes } : item
      );
      updatedAudioLayers = newLayers;
      return newLayers;
    });
  } else {
    setVideoLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      newLayers[selectedSegment.layer] = newLayers[selectedSegment.layer].map((item) =>
        item.id === selectedSegment.id ? { ...item, keyframes: updatedKeyframes } : item
      );
      updatedVideoLayers = newLayers;
      return newLayers;
    });
  }

  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE_URL}/projects/${projectId}/remove-keyframe`, {
      params: {
        sessionId,
        segmentId: selectedSegment.id,
        segmentType: selectedSegment.type,
        property,
        time,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    // Schedule auto-save
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      autoSaveProject(updatedVideoLayers, updatedAudioLayers);
    }, 1000);

    // Optionally fetch keyframes to ensure sync, but only if necessary
    // await fetchKeyframes(selectedSegment.id, selectedSegment.type);
  } catch (error) {
    console.error('Error removing keyframe:', error);
    // Revert to previous keyframes on error
    setKeyframes(previousKeyframes);
    // Revert layers
    if (selectedSegment.type === 'audio') {
      setAudioLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        const layerIndex = Math.abs(selectedSegment.layer) - 1;
        newLayers[layerIndex] = newLayers[layerIndex].map((item) =>
          item.id === selectedSegment.id ? { ...item, keyframes: previousKeyframes } : item
        );
        return newLayers;
      });
    } else {
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[selectedSegment.layer] = newLayers[selectedSegment.layer].map((item) =>
          item.id === selectedSegment.id ? { ...item, keyframes: previousKeyframes } : item
        );
        return newLayers;
      });
    }
    alert('Failed to remove keyframe. Please try again.');
  }
};

const toggleKeyframe = (property) => {
  const currentKeyframes = keyframes[property] || [];
  const keyframeAtTime = currentKeyframes.find((kf) => areTimesEqual(kf.time, currentTimeInSegment));
  if (keyframeAtTime) {
    removeKeyframe(property, currentTimeInSegment);
  } else {
    const value = tempSegmentValues[property] !== undefined
      ? tempSegmentValues[property]
      : (currentKeyframes.length > 0
         ? getValueAtTime(currentKeyframes, currentTimeInSegment)
         : (property === 'scale' || property === 'opacity' ? 1 : 0));
    addKeyframe(property, value);
  }
};

const navigateKeyframes = (property, direction) => {
  if (!selectedSegment || !keyframes[property]) return;
  const sortedKeyframes = keyframes[property].sort((a, b) => a.time - b.time);
  const currentIndex = sortedKeyframes.findIndex((kf) => kf.time >= currentTimeInSegment);
  let newIndex;
  if (direction === 'prev') {
    newIndex = currentIndex === -1 ? sortedKeyframes.length - 1 : Math.max(0, currentIndex - 1);
  } else {
    newIndex = currentIndex === -1 ? 0 : Math.min(sortedKeyframes.length - 1, currentIndex + 1);
  }
  if (sortedKeyframes[newIndex]) {
    const newTime = sortedKeyframes[newIndex].time;
    setCurrentTimeInSegment(newTime);
    handleTimeUpdate(selectedSegment.startTime + newTime);
  }
};

  const updateSegmentProperty = (property, value) => {

    // Validate speed property
    if (property === 'speed') {
      const speedValue = Number(value);
      if (isNaN(speedValue) || speedValue < 0.1 || speedValue > 5.0) {
        console.warn(`Invalid speed value: ${value}. Speed must be between 0.1 and 5.0.`);
        return; // Skip update and rely on KeyframeControls error message
      }
    }

    // Validate crop properties
    if (['cropL', 'cropR', 'cropT', 'cropB'].includes(property)) {
      const currentValues = {
        cropL: Number(tempSegmentValues.cropL) || 0,
        cropR: Number(tempSegmentValues.cropR) || 0,
        cropT: Number(tempSegmentValues.cropT) || 0,
        cropB: Number(tempSegmentValues.cropB) || 0,
      };
      const newValues = { ...currentValues, [property]: Number(value) };

      // Validate crop values
      if (isNaN(newValues[property]) || newValues[property] < 0 || newValues[property] > 100) {
        console.warn(`Invalid crop value for ${property}: ${value}`);
        return; // Skip update and rely on KeyframeControls error message
      }
      if (newValues.cropL + newValues.cropR >= 100) {
        console.warn(`Invalid crop: cropL (${newValues.cropL}) + cropR (${newValues.cropR}) >= 100%`);
        return; // Skip update
      }
      if (newValues.cropT + newValues.cropB >= 100) {
        console.warn(`Invalid crop: cropT (${newValues.cropT}) + cropB (${newValues.cropB}) >= 100%`);
        return; // Skip update
      }
    }

    // Update tempSegmentValues
    setTempSegmentValues((prev) => {
      const newValues = { ...prev, [property]: value };
      console.log(`Updating ${property} to ${value}, new tempSegmentValues:`, newValues);
      return newValues;
    });

    // Update layers
    const targetLayers = selectedSegment.layer < 0 ? audioLayers : videoLayers;
    const layerIndex = selectedSegment.layer < 0 ? Math.abs(selectedSegment.layer) - 1 : selectedSegment.layer;
    const newLayers = targetLayers.map((layer, idx) =>
      idx === layerIndex
        ? layer.map((item) => (item.id === selectedSegment.id ? { ...item, [property]: value } : item))
        : layer
    );

    if (selectedSegment.layer < 0) {
      setAudioLayers(newLayers);
    } else {
      setVideoLayers(newLayers);
      // Update textSettings for text segments to keep transform properties in sync
      if (selectedSegment.type === 'text') {
        setTextSettings((prev) => ({
          ...prev,
          [property]: value,
        }));
      }
    }

    // Schedule save only for valid updates
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      console.log(`Scheduling saveSegmentChanges for ${property}: ${value}`);
      saveSegmentChanges(keyframes, { ...tempSegmentValues, [property]: value });
    }, 500);
  };

  const saveSegmentChanges = async (updatedKeyframes = keyframes, tempValues = tempSegmentValues) => {
    if (!selectedSegment || !sessionId || !projectId) {
      console.error('Cannot save segment changes: Missing required data', {
        selectedSegment,
        sessionId,
        projectId,
      });
      return;
    }

    console.log('Saving segment changes with tempValues:', tempValues);

    // Validate crop values before proceeding
    if (selectedSegment.type === 'video' || selectedSegment.type === 'image') {
      const cropValues = {
        cropL: Number(tempValues.cropL) || 0,
        cropR: Number(tempValues.cropR) || 0,
        cropT: Number(tempValues.cropT) || 0,
        cropB: Number(tempValues.cropB) || 0,
      };

      if (
        Object.values(cropValues).some((val) => isNaN(val) || val < 0 || val > 100) ||
        cropValues.cropL + cropValues.cropR >= 100 ||
        cropValues.cropT + cropValues.cropB >= 100
      ) {
        console.warn('Invalid crop values, skipping backend save:', cropValues);
        return; // Skip backend call, rely on KeyframeControls error message
      }
    }

    try {
      const token = localStorage.getItem('token');
      let updatedVideoLayers = videoLayers;
      let updatedAudioLayers = audioLayers;

      switch (selectedSegment.type) {
        case 'video':
          const normalizedTempValues = {
            positionX: tempValues.positionX !== undefined ? Number(tempValues.positionX) : 0,
            positionY: tempValues.positionY !== undefined ? Number(tempValues.positionY) : 0,
            scale: tempValues.scale !== undefined ? Number(tempValues.scale) : 1,
            opacity: tempValues.opacity !== undefined ? Number(tempValues.opacity) : 1,
            cropL: tempValues.cropL !== undefined ? Number(tempValues.cropL) : 0,
            cropR: tempValues.cropR !== undefined ? Number(tempValues.cropR) : 0,
            cropT: tempValues.cropT !== undefined ? Number(tempValues.cropT) : 0,
            cropB: tempValues.cropB !== undefined ? Number(tempValues.cropB) : 0,
            speed: tempValues.speed !== undefined ? Number(tempValues.speed) : 1.0,
            rotation: tempValues.rotation !== undefined ? Number(tempValues.rotation) : 0, // Add rotation
          };

          console.log('Normalized temp values for video:', normalizedTempValues);

          const videoPayload = {
            segmentId: selectedSegment.id || '',
            positionX: updatedKeyframes.positionX && updatedKeyframes.positionX.length > 0 ? undefined : normalizedTempValues.positionX,
            positionY: updatedKeyframes.positionY && updatedKeyframes.positionY.length > 0 ? undefined : normalizedTempValues.positionY,
            scale: updatedKeyframes.scale && updatedKeyframes.scale.length > 0 ? undefined : normalizedTempValues.scale,
            rotation: updatedKeyframes.rotation && updatedKeyframes.rotation.length > 0 ? undefined : normalizedTempValues.rotation, // Add rotation
            opacity: normalizedTempValues.opacity,
            layer: Number(selectedSegment.layer) || 0,
            timelineStartTime: Number(selectedSegment.startTime) || 0,
            timelineEndTime: Number(selectedSegment.startTime + selectedSegment.duration) || 0,
            startTime: Number(selectedSegment.startTimeWithinVideo) || 0,
            endTime: Number(selectedSegment.endTimeWithinVideo) || 0,
            cropL: normalizedTempValues.cropL,
            cropR: normalizedTempValues.cropR,
            cropT: normalizedTempValues.cropT,
            cropB: normalizedTempValues.cropB,
            speed: updatedKeyframes.speed && updatedKeyframes.speed.length > 0 ? undefined : normalizedTempValues.speed,
            keyframes: updatedKeyframes || {},
          };

          console.log('Video segment payload:', JSON.stringify(videoPayload, null, 2));

          const videoResponse = await axios.put(
            `${API_BASE_URL}/projects/${projectId}/update-segment`,
            videoPayload,
            { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('Server response for video segment update:', videoResponse.data);

          // Fetch updated segment data to get the latest timelineEndTime and other properties
          const segmentResponse = await axios.get(
            `${API_BASE_URL}/projects/${projectId}/get-segment`,
            {
              params: { sessionId, segmentId: selectedSegment.id },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const updatedSegment = segmentResponse.data.videoSegment;

          if (!updatedSegment) {
            throw new Error(`Failed to fetch updated video segment ${selectedSegment.id}`);
          }

          // Update videoLayers with the latest segment data from backend
          setVideoLayers((prev) => {
            const newLayers = [...prev];
            const layerIndex = selectedSegment.layer;
            const segmentIndex = newLayers[layerIndex].findIndex((s) => s.id === selectedSegment.id);
            if (segmentIndex !== -1) {
              newLayers[layerIndex][segmentIndex] = {
                ...newLayers[layerIndex][segmentIndex],
                cropL: updatedSegment.cropL ?? videoPayload.cropL,
                cropR: updatedSegment.cropR ?? videoPayload.cropR,
                cropT: updatedSegment.cropT ?? videoPayload.cropT,
                cropB: updatedSegment.cropB ?? videoPayload.cropB,
                positionX: updatedSegment.positionX ?? (videoPayload.positionX !== undefined ? videoPayload.positionX : newLayers[layerIndex][segmentIndex].positionX || 0),
                positionY: updatedSegment.positionY ?? (videoPayload.positionY !== undefined ? videoPayload.positionY : newLayers[layerIndex][segmentIndex].positionY || 0),
                scale: updatedSegment.scale ?? (videoPayload.scale !== undefined ? videoPayload.scale : newLayers[layerIndex][segmentIndex].scale || 1),
                rotation: updatedSegment.rotation ?? (videoPayload.rotation !== undefined ? videoPayload.rotation : newLayers[layerIndex][segmentIndex].rotation || 0), // Add rotation
                opacity: updatedSegment.opacity ?? (videoPayload.opacity !== undefined ? videoPayload.opacity : newLayers[layerIndex][segmentIndex].opacity || 1),
                speed: updatedSegment.speed ?? (videoPayload.speed !== undefined ? videoPayload.speed : newLayers[layerIndex][segmentIndex].speed || 1.0),
                startTime: updatedSegment.timelineStartTime ?? videoPayload.timelineStartTime,
                duration: (updatedSegment.timelineEndTime - updatedSegment.timelineStartTime) ?? (videoPayload.timelineEndTime - videoPayload.timelineStartTime),
                startTimeWithinVideo: updatedSegment.startTime ?? videoPayload.startTime,
                endTimeWithinVideo: updatedSegment.endTime ?? videoPayload.endTime,
                layer: updatedSegment.layer ?? videoPayload.layer,
                keyframes: updatedSegment.keyframes ?? videoPayload.keyframes,
              };
            }
            updatedVideoLayers = newLayers;
            // Update totalDuration based on new segment duration
            let maxEndTime = 0;
            newLayers.forEach((layer) => {
              layer.forEach((item) => {
                const endTime = item.startTime + item.duration;
                if (endTime > maxEndTime) maxEndTime = endTime;
              });
            });
            setTotalDuration(maxEndTime);
            return newLayers;
          });
          break;

        case 'image':
          const normalizedImageValues = {
            positionX: tempValues.positionX !== undefined ? Number(tempValues.positionX) : 0,
            positionY: tempValues.positionY !== undefined ? Number(tempValues.positionY) : 0,
            rotation: tempValues.rotation !== undefined ? Number(tempValues.rotation) : 0, // Add rotation
            scale: tempValues.scale !== undefined ? Number(tempValues.scale) : 1,
            opacity: tempValues.opacity !== undefined ? Number(tempValues.opacity) : 1,
            cropL: tempValues.cropL !== undefined ? Number(tempValues.cropL) : 0,
            cropR: tempValues.cropR !== undefined ? Number(tempValues.cropR) : 0,
            cropT: tempValues.cropT !== undefined ? Number(tempValues.cropT) : 0,
            cropB: tempValues.cropB !== undefined ? Number(tempValues.cropB) : 0,
          };

          const payload = {
            segmentId: selectedSegment.id || '',
            positionX: updatedKeyframes.positionX && updatedKeyframes.positionX.length > 0 ? undefined : normalizedImageValues.positionX,
            positionY: updatedKeyframes.positionY && updatedKeyframes.positionY.length > 0 ? undefined : normalizedImageValues.positionY,
            scale: updatedKeyframes.scale && updatedKeyframes.scale.length > 0 ? undefined : normalizedImageValues.scale,
            rotation: updatedKeyframes.rotation && updatedKeyframes.rotation.length > 0 ? undefined : normalizedImageValues.rotation, // Add rotation
            opacity: updatedKeyframes.opacity && updatedKeyframes.opacity.length > 0 ? undefined : normalizedImageValues.opacity,
            layer: Number(selectedSegment.layer) || 0,
            timelineStartTime: Number(selectedSegment.startTime) || 0,
            timelineEndTime: Number(selectedSegment.startTime + selectedSegment.duration) || 0,
            cropL: normalizedImageValues.cropL,
            cropR: normalizedImageValues.cropR,
            cropT: normalizedImageValues.cropT,
            cropB: normalizedImageValues.cropB,
            keyframes: updatedKeyframes || {},
            filters: Array.isArray(appliedFilters)
              ? appliedFilters.map((filter) => ({
                  filterName: filter.filterName,
                  filterValue: String(filter.filterValue),
                  filterId: filter.filterId,
                }))
              : [],
            filtersToRemove: [],
          };

          console.log('Image segment payload:', JSON.stringify(payload, null, 2));

          const imageResponse = await axios.put(
            `${API_BASE_URL}/projects/${projectId}/update-image`,
            payload,
            { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('Server response for image segment update:', imageResponse.data);

          // Update videoLayers
          setVideoLayers((prev) => {
            const newLayers = [...prev];
            const layerIndex = selectedSegment.layer;
            const segmentIndex = newLayers[layerIndex].findIndex((s) => s.id === selectedSegment.id);
            if (segmentIndex !== -1) {
              newLayers[layerIndex][segmentIndex] = {
                ...newLayers[layerIndex][segmentIndex],
                cropL: payload.cropL,
                cropR: payload.cropR,
                cropT: payload.cropT,
                cropB: payload.cropB,
                positionX: payload.positionX !== undefined ? payload.positionX : newLayers[layerIndex][segmentIndex].positionX || 0,
                positionY: payload.positionY !== undefined ? payload.positionY : newLayers[layerIndex][segmentIndex].positionY || 0,
                rotation: payload.rotation !== undefined ? payload.rotation : newLayers[layerIndex][segmentIndex].rotation || 0, // Add rotation
                scale: payload.scale !== undefined ? payload.scale : newLayers[layerIndex][segmentIndex].scale || 1,
                opacity: payload.opacity !== undefined ? payload.opacity : newLayers[layerIndex][segmentIndex].opacity || 1,
                startTime: payload.timelineStartTime,
                duration: payload.timelineEndTime - payload.timelineStartTime,
                layer: payload.layer,
                keyframes: payload.keyframes,
                filters: payload.filters,
              };
            }
            updatedVideoLayers = newLayers;
            return newLayers;
          });
          break;

        case 'text':
          const textPayload = {
            segmentId: selectedSegment.id,
            text: textSettings.text,
            fontFamily: textSettings.fontFamily,
            fontColor: textSettings.fontColor,
            backgroundColor: textSettings.backgroundColor,
            timelineStartTime: selectedSegment.startTime,
            timelineEndTime: selectedSegment.startTime + textSettings.duration,
            layer: selectedSegment.layer,
            rotation: updatedKeyframes.rotation && updatedKeyframes.rotation.length > 0 ? undefined : tempValues.rotation, // Add rotation
            scale: updatedKeyframes.scale && updatedKeyframes.scale.length > 0 ? undefined : tempValues.scale,
            positionX: updatedKeyframes.positionX && updatedKeyframes.positionX.length > 0 ? undefined : tempValues.positionX,
            positionY: updatedKeyframes.positionY && updatedKeyframes.positionY.length > 0 ? undefined : tempValues.positionY,
            opacity: updatedKeyframes.opacity && updatedKeyframes.opacity.length > 0 ? undefined : tempValues.opacity,
            alignment: textSettings.alignment,
            backgroundOpacity: textSettings.backgroundOpacity,
            backgroundBorderWidth: textSettings.backgroundBorderWidth,
            backgroundBorderColor: textSettings.backgroundBorderColor,
            backgroundPadding: textSettings.backgroundPadding,
            backgroundBorderRadius: textSettings.backgroundBorderRadius,
            textBorderColor: textSettings.textBorderColor,
            textBorderWidth: textSettings.textBorderWidth,
            textBorderOpacity: textSettings.textBorderOpacity,
            keyframes: updatedKeyframes,
          };

          console.log('Text segment payload:', JSON.stringify(textPayload, null, 2));

          await axios.put(
            `${API_BASE_URL}/projects/${projectId}/update-text`,
            textPayload,
            { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
          );

          // Update videoLayers
          setVideoLayers((prev) => {
            const newLayers = [...prev];
            const layerIndex = selectedSegment.layer;
            const segmentIndex = newLayers[layerIndex].findIndex((s) => s.id === selectedSegment.id);
            if (segmentIndex !== -1) {
              newLayers[layerIndex][segmentIndex] = {
                ...newLayers[layerIndex][segmentIndex],
                text: textPayload.text,
                fontFamily: textPayload.fontFamily,
                fontColor: textPayload.fontColor,
                backgroundColor: textPayload.backgroundColor,
                rotation: textPayload.rotation !== undefined ? textPayload.rotation : newLayers[layerIndex][segmentIndex].rotation || 0, // Add rotation
                scale: textPayload.scale !== undefined ? textPayload.scale : newLayers[layerIndex][segmentIndex].scale || 1,
                positionX: textPayload.positionX !== undefined ? textPayload.positionX : newLayers[layerIndex][segmentIndex].positionX || 0,
                positionY: textPayload.positionY !== undefined ? textPayload.positionY : newLayers[layerIndex][segmentIndex].positionY || 0,
                opacity: textPayload.opacity !== undefined ? textPayload.opacity : newLayers[layerIndex][segmentIndex].opacity || 1,
                startTime: textPayload.timelineStartTime,
                duration: textPayload.timelineEndTime - textPayload.timelineStartTime,
                layer: textPayload.layer,
                alignment: textPayload.alignment,
                backgroundOpacity: textPayload.backgroundOpacity,
                backgroundBorderWidth: textPayload.backgroundBorderWidth,
                backgroundBorderColor: textPayload.backgroundBorderColor,
                backgroundPadding: textPayload.backgroundPadding,
                backgroundBorderRadius: textPayload.backgroundBorderRadius,
                textBorderColor: textPayload.textBorderColor,
                textBorderWidth: textPayload.textBorderWidth,
                textBorderOpacity: textPayload.textBorderOpacity,
                keyframes: textPayload.keyframes,
              };
            }
            updatedVideoLayers = newLayers;
            return newLayers;
          });
          break;

        case 'audio':
          const audioPayload = {
            audioSegmentId: selectedSegment.id,
            volume: updatedKeyframes.volume && updatedKeyframes.volume.length > 0 ? undefined : tempValues.volume,
            keyframes: updatedKeyframes,
          };

          console.log('Audio segment payload:', JSON.stringify(audioPayload, null, 2));

          await axios.put(
            `${API_BASE_URL}/projects/${projectId}/update-audio`,
            audioPayload,
            { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
          );

          // Update audioLayers
          setAudioLayers((prev) => {
            const newLayers = [...prev];
            const layerIndex = Math.abs(selectedSegment.layer) - 1;
            const segmentIndex = newLayers[layerIndex].findIndex((s) => s.id === selectedSegment.id);
            if (segmentIndex !== -1) {
              newLayers[layerIndex][segmentIndex] = {
                ...newLayers[layerIndex][segmentIndex],
                volume: audioPayload.volume !== undefined ? audioPayload.volume : newLayers[layerIndex][segmentIndex].volume || 1,
                keyframes: audioPayload.keyframes,
              };
            }
            updatedAudioLayers = newLayers;
            return newLayers;
          });
          break;

        default:
          console.warn('Unknown segment type:', selectedSegment.type);
          return;
      }

      // Update history after successful save
      saveHistory();

      // Refresh keyframes after saving
      await fetchKeyframes(selectedSegment.id, selectedSegment.type);
      await fetchTransitions();

      // Trigger auto-save of the project with updated layers
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        console.log('Triggering auto-save for project with updated layers:', {
          updatedVideoLayers,
          updatedAudioLayers,
        });
        autoSaveProject(updatedVideoLayers, updatedAudioLayers);
      }, 1000);
    } catch (error) {
      console.error('Error saving segment changes:', error);
      if (error.response) {
        console.error('Server error details:', error.response.data);
      }
      // Do not throw the error to avoid red screen
    }
  };

const handlePhotoUpload = async (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('image', file);
    formData.append('imageFileNames', file.name);
  });

  try {
    setUploading(true);
    setUploadProgress((prev) => ({
      ...prev,
      ...files.reduce((acc, file) => ({ ...acc, [file.name]: 0 }), {}),
    }));

    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/projects/${projectId}/upload-image`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const loaded = progressEvent.loaded;
          const percentCompleted = Math.round((loaded * 100) / total);
          files.forEach((file) => {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percentCompleted,
            }));
          });
        },
      }
    );
    const updatedProject = response.data;
    if (updatedProject) await fetchPhotos();
  } catch (error) {
    console.error('Error uploading images:', error);
    alert('Failed to upload one or more images. Please try again.');
  } finally {
    setUploading(false);
    setUploadProgress({}); // Clear progress
  }
};

const handlePhotoClick = async (photo, isDragEvent = false) => {
  if (uploading) return;
  if (isDragEvent) return;
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
      params: { sessionId },
      headers: { Authorization: `Bearer ${token}` },
    });
    let timelineState =
      response.data.timelineState
        ? typeof response.data.timelineState === 'string'
          ? JSON.parse(response.data.timelineState)
          : response.data.timelineState
        : { segments: [], textSegments: [], imageSegments: [] };

    let endTime = 0;
    const allSegments = [
      ...(timelineState.segments || []),
      ...(timelineState.textSegments || []),
      ...(timelineState.imageSegments || []),
    ];
    if (allSegments.length > 0) {
      allSegments.forEach((segment) => {
        const segmentEndTime = segment.timelineStartTime + (segment.timelineEndTime - segment.timelineStartTime);
        if (segmentEndTime > endTime) endTime = segmentEndTime;
      });
    }

    const timelineStartTime = endTime;
    const timelineEndTime = endTime + 5;

    let selectedLayer = findAvailableLayer(timelineStartTime, timelineEndTime, videoLayers);

    setVideoLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      while (newLayers.length <= selectedLayer) {
        newLayers.push([]);
      }
      return newLayers;
    });

    const newSegment = await addImageToTimeline(
      photo.fileName,
      selectedLayer,
      timelineStartTime,
      timelineEndTime,
      false
    );

    setTotalDuration((prev) => Math.max(prev, timelineStartTime + (timelineEndTime - timelineStartTime)));
    saveHistory();
  } catch (error) {
    console.error('Error adding photo to timeline:', error);
    alert('Failed to add photo to timeline. Please try again.');
  }
};

const updateFilters = async (newFilterParams) => {
  if (!selectedSegment || !sessionId || !projectId || Object.keys(newFilterParams).length === 0) return;
  if (selectedSegment.type !== 'video' && selectedSegment.type !== 'image') return;

  try {
    const token = localStorage.getItem('token');
    const updatedFilters = [...appliedFilters];

    for (const [filterName, filterValue] of Object.entries(newFilterParams)) {
      const existingFilter = updatedFilters.find((f) => f.filterName === filterName);
      if (existingFilter) {
        await axios.put(
          `${API_BASE_URL}/projects/${projectId}/update-filter`,
          {
            segmentId: selectedSegment.id,
            filterId: existingFilter.filterId,
            filterName,
            filterValue: filterValue.toString(),
          },
          { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
        );
        existingFilter.filterValue = filterValue.toString();
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/projects/${projectId}/apply-filter`,
          {
            segmentId: selectedSegment.id,
            filterName,
            filterValue: filterValue.toString(),
          },
          { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
        );
        updatedFilters.push(response.data);
      }
    }

    // Update appliedFilters state
    setAppliedFilters(updatedFilters);

    // Update videoLayers with the new filters
    let updatedVideoLayers = videoLayers;
    setVideoLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      newLayers[selectedSegment.layer] = newLayers[selectedSegment.layer].map((item) =>
        item.id === selectedSegment.id ? { ...item, filters: updatedFilters } : item
      );
      updatedVideoLayers = newLayers;
      return newLayers;
    });

    // Update selectedSegment to propagate filter changes
    setSelectedSegment((prev) => ({ ...prev, filters: updatedFilters }));

    // Force VideoPreview to re-render
    setCurrentTime((prev) => prev + 0); // Micro-update to trigger re-render

    // Schedule auto-save
    if (filterUpdateTimeoutRef.current) clearTimeout(filterUpdateTimeoutRef.current);
    filterUpdateTimeoutRef.current = setTimeout(() => {
      autoSaveProject(updatedVideoLayers, audioLayers);
    }, 1000);

    saveHistory();
  } catch (error) {
    console.error('Error updating filters:', error);
    alert('Failed to apply filters. Please try again.');
  }
};

const handleRemoveFilter = async (filterName) => {
  if (!selectedSegment || !sessionId || !projectId) return;
  try {
    const token = localStorage.getItem('token');
    const filterToRemove = appliedFilters.find((f) => f.filterName === filterName);
    if (!filterToRemove) return;
    await axios.post(
      `${API_BASE_URL}/projects/${projectId}/remove-filter`,
      {
        segmentId: selectedSegment.id,
        filterId: filterToRemove.filterId,
      },
      { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
    );
    const updatedFilters = appliedFilters.filter((f) => f.filterName !== filterName);

    setAppliedFilters(updatedFilters);
    let updatedVideoLayers = videoLayers;
    setVideoLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      newLayers[selectedSegment.layer] = newLayers[selectedSegment.layer].map((item) =>
        item.id === selectedSegment.id ? { ...item, filters: updatedFilters } : item
      );
      updatedVideoLayers = newLayers;
      return newLayers;
    });
    setSelectedSegment((prev) => ({ ...prev, filters: updatedFilters }));
    setFilterParams((prev) => {
      const newSettings = { ...prev };
      delete newSettings[filterName];
      return newSettings;
    });

    if (filterUpdateTimeoutRef.current) clearTimeout(filterUpdateTimeoutRef.current);
    filterUpdateTimeoutRef.current = setTimeout(() => {
      autoSaveProject(updatedVideoLayers, audioLayers);
    }, 1000);
  } catch (error) {
    console.error('Error removing filter:', error);
  }
};

const updateFilterSetting = (filterName, filterValue) => {
  if (!selectedSegment || !projectId || !sessionId) {
    console.warn('Cannot update filter: Missing selectedSegment, projectId, or sessionId');
    return;
  }

  console.log(`updateFilterSetting: filterName=${filterName}, filterValue=${filterValue} (type: ${typeof filterValue})`);

  // Update filterParams for the UI
  setFilterParams((prev) => ({
    ...prev,
    [filterName]: filterValue,
  }));

  // Debounce the filter update
  if (filterUpdateTimeoutRef.current) {
    clearTimeout(filterUpdateTimeoutRef.current);
  }
  filterUpdateTimeoutRef.current = setTimeout(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for API request');
        alert('Authentication token missing. Please log in again.');
        navigate('/login');
        return;
      }

      const segmentId = selectedSegment.id;

      // Fetch the latest filters from the backend to ensure sync
      const filterResponse = await axios.get(
        `${API_BASE_URL}/projects/${projectId}/segments/${segmentId}/filters`,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const latestFilters = filterResponse.data || [];
      setAppliedFilters(latestFilters); // Update appliedFilters with fresh data

      let updatedVideoLayers = videoLayers;
      let newFilters = [];

      // Update local videoLayers and appliedFilters
      setVideoLayers((prevLayers) => {
        const newLayers = prevLayers.map((layer, layerIndex) =>
          layer.map((segment) => {
            if (
              segment.id === selectedSegment.id &&
              segment.layer === selectedSegment.layer &&
              layerIndex === selectedSegment.layer
            ) {
              const currentFilters = latestFilters; // Use latest filters from backend
              newFilters = [...currentFilters];

              if (
                filterValue === '' ||
                filterValue === null ||
                filterValue === undefined ||
                (['grayscale', 'invert'].includes(filterName) && filterValue === '')
              ) {
                // Remove the filter
                newFilters = currentFilters.filter((f) => f.filterName !== filterName);
                console.log(`Removed filter ${filterName} from segment ${segmentId}. New filters:`, newFilters);
              } else {
                // Update or add the filter
                const existingFilter = currentFilters.find((f) => f.filterName === filterName);
                const filterId = existingFilter ? existingFilter.filterId : crypto.randomUUID();
                newFilters = [
                  ...currentFilters.filter((f) => f.filterName !== filterName),
                  { filterId, filterName, filterValue: filterValue.toString(), segmentId },
                ];
                console.log(`Added/Updated filter ${filterName}=${filterValue} for segment ${segmentId}. New filters:`, newFilters);
              }

              return {
                ...segment,
                filters: newFilters,
              };
            }
            return segment;
          })
        );
        updatedVideoLayers = newLayers;
        return newLayers;
      });

      // Update appliedFilters
      setAppliedFilters(newFilters);

      // Update selectedSegment with the new filters
      setSelectedSegment((prev) => {
        if (!prev) return prev;
        return { ...prev, filters: newFilters };
      });

      // Save to backend
      if (
        filterValue === '' ||
        filterValue === null ||
        filterValue === undefined ||
        (['grayscale', 'invert'].includes(filterName) && filterValue === '')
      ) {
        const filterToRemove = latestFilters.find((f) => f.filterName === filterName);
        if (filterToRemove) {
          console.log(`Sending DELETE request to remove filter ${filterName} (filterId: ${filterToRemove.filterId}) for segment ${segmentId}`);
          await axios.delete(`${API_BASE_URL}/projects/${projectId}/remove-filter`, {
            params: {
              sessionId,
              segmentId,
              filterId: filterToRemove.filterId,
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log(`Successfully removed filter ${filterName} from backend`);
        } else {
          console.log(`Filter ${filterName} not found in backend data, skipping DELETE request`);
        }
      } else {
        const existingFilter = latestFilters.find((f) => f.filterName === filterName);
        const filterId = existingFilter ? existingFilter.filterId : crypto.randomUUID();
        const requestBody = {
          filterId,
          segmentId,
          filterName,
          filterValue: filterValue.toString(),
        };
        console.log(`Sending POST request to apply filter ${filterName}=${filterValue} (filterId: ${filterId}) for segment ${segmentId}`);
        const response = await axios.post(
          `${API_BASE_URL}/projects/${projectId}/apply-filter`,
          requestBody,
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Update appliedFilters with the backend response
        setAppliedFilters((prev) => [
          ...prev.filter((f) => f.filterName !== filterName),
          response.data,
        ]);
        console.log(`Successfully applied filter ${filterName} to backend`);
      }

      // Trigger auto-save
      await autoSaveProject(updatedVideoLayers, audioLayers);
      saveHistory();

      // Force VideoPreview to re-render
      setCurrentTime((prev) => prev + 0);
    } catch (error) {
      console.error('Error saving filter to backend:', error.response?.data || error.message);
      if (error.response?.status === 404 && error.response?.data?.includes('Filter not found')) {
        console.log(`Filter ${filterName} not found on backend, syncing frontend state`);
        // Remove the filter from appliedFilters to prevent further errors
        setAppliedFilters((prev) => prev.filter((f) => f.filterName !== filterName));
        setVideoLayers((prevLayers) => {
          const newLayers = prevLayers.map((layer, layerIndex) =>
            layer.map((segment) => {
              if (
                segment.id === selectedSegment.id &&
                segment.layer === selectedSegment.layer &&
                layerIndex === selectedSegment.layer
              ) {
                return {
                  ...segment,
                  filters: segment.filters.filter((f) => f.filterName !== filterName),
                };
              }
              return segment;
            })
          );
          return newLayers;
        });
        setSelectedSegment((prev) => ({
          ...prev,
          filters: prev.filters.filter((f) => f.filterName !== filterName),
        }));
      } else {
        alert(`Failed to save filter changes: ${error.message}`);
      }
    }
  }, 500);
};

useEffect(() => {
  if (selectedSegment) {
    const relativeTime = currentTime - selectedSegment.startTime;
    setCurrentTimeInSegment(Math.max(0, Math.min(selectedSegment.duration, relativeTime)));
  }
}, [currentTime, selectedSegment]);

const resetFilters = async () => {
  if (!selectedSegment || !sessionId || !projectId) return;
  if (selectedSegment.type !== 'video' && selectedSegment.type !== 'image') return;

  try {
    const token = localStorage.getItem('token');
    // Send a single DELETE request to remove all filters for the segment
    await axios.delete(`${API_BASE_URL}/projects/${projectId}/remove-filter`, {
      params: {
        sessionId,
        segmentId: selectedSegment.id,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    setAppliedFilters([]);
    setFilterParams({
      brightness: 0,
      contrast: 1,
      saturation: 1,
      hue: 0,
      blur: 0,
      sharpen: 0,
      grayscale: '',
      invert: '',
      flip: '',
    });

    let updatedVideoLayers = videoLayers;
    setVideoLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      newLayers[selectedSegment.layer] = newLayers[selectedSegment.layer].map((item) =>
        item.id === selectedSegment.id ? { ...item, filters: [] } : item
      );
      updatedVideoLayers = newLayers;
      return newLayers;
    });
    setSelectedSegment((prev) => ({ ...prev, filters: [] }));

    // Save history to capture the reset state
    saveHistory();

    // Trigger auto-save immediately with updated layers
    if (filterUpdateTimeoutRef.current) clearTimeout(filterUpdateTimeoutRef.current);
    await autoSaveProject(updatedVideoLayers, audioLayers);
  } catch (error) {
    console.error('Error resetting filters:', error);
    alert('Failed to reset filters. Please try again.');
  }
};

// Add this before the return statement
const filteredElements = elements.filter((element) =>
  element.displayName.toLowerCase().includes(elementSearchQuery.toLowerCase())
);

  // In ProjectEditor.js, add the updateKeyframe function
  const updateKeyframe = (property, newValue) => {
    const time = currentTimeInSegment;
    const currentKeyframes = keyframes || {};
    const updatedPropertyKeyframes = (currentKeyframes[property] || []).map((kf) =>
      areTimesEqual(kf.time, time) ? { ...kf, value: newValue } : kf
    );

    const updatedKeyframes = {
      ...currentKeyframes,
      [property]: updatedPropertyKeyframes,
    };

    // Update keyframes state
    setKeyframes(updatedKeyframes);

    // Update segment in layers
    if (selectedSegment.type === 'audio') {
      setAudioLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        const layerIndex = Math.abs(selectedSegment.layer) - 1;
        newLayers[layerIndex] = newLayers[layerIndex].map((item) =>
          item.id === selectedSegment.id ? { ...item, keyframes: updatedKeyframes } : item
        );
        return newLayers;
      });
    } else {
      setVideoLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers[selectedSegment.layer] = newLayers[selectedSegment.layer].map((item) =>
          item.id === selectedSegment.id ? { ...item, keyframes: updatedKeyframes } : item
        );
        return newLayers;
      });
    }

    // Update tempSegmentValues
    setTempSegmentValues((prev) => ({
      ...prev,
      [property]: newValue,
    }));

    // Save to backend
    const token = localStorage.getItem('token');
    axios
      .post(
        `${API_BASE_URL}/projects/${projectId}/update-keyframe`,
        {
          segmentId: selectedSegment.id,
          segmentType: selectedSegment.type,
          property,
          time,
          value: newValue,
          interpolationType: 'linear',
        },
        { params: { sessionId }, headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        // Schedule auto-save
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = setTimeout(() => {
          autoSaveProject(videoLayers, audioLayers);
        }, 1000);
      })
      .catch((error) => {
        console.error('Error updating keyframe:', error);
      });
  };

  const handleSegmentPositionUpdate = (segment, { positionX, positionY }) => {
    if (!segment) return;

    // Round position values to integers for backend compatibility
    const roundedPositionX = Math.round(Number(positionX));
    const roundedPositionY = Math.round(Number(positionY));

    // Get current keyframes for the segment
    const segmentKeyframes = segment.keyframes || {};

    // Determine if we should update keyframes or static values
    const hasPositionXKeyframes = segmentKeyframes.positionX && segmentKeyframes.positionX.length > 0;
    const hasPositionYKeyframes = segmentKeyframes.positionY && segmentKeyframes.positionY.length > 0;

    // Calculate current time within segment
    const relativeTime = currentTime - segment.startTime;
    const timeInSegment = Math.max(0, Math.min(segment.duration, relativeTime));

    // Update state based on keyframe presence
    setTempSegmentValues((prev) => {
      const newValues = { ...prev };
      if (!hasPositionXKeyframes) newValues.positionX = roundedPositionX;
      if (!hasPositionYKeyframes) newValues.positionY = roundedPositionY;
      return newValues;
    });

    // Update videoLayers for static values (if no keyframes)
    let updatedVideoLayers = videoLayers;
    setVideoLayers((prevLayers) => {
      const newLayers = [...prevLayers];
      newLayers[segment.layer] = newLayers[segment.layer].map((item) =>
        item.id === segment.id
          ? {
              ...item,
              positionX: hasPositionXKeyframes ? item.positionX : roundedPositionX,
              positionY: hasPositionYKeyframes ? item.positionY : roundedPositionY,
            }
          : item
      );
      updatedVideoLayers = newLayers;
      return newLayers;
    });

    // Update textSettings if segment is text (for static values)
    if (segment.type === 'text' && (!hasPositionXKeyframes || !hasPositionYKeyframes)) {
      setTextSettings((prev) => ({
        ...prev,
        positionX: hasPositionXKeyframes ? prev.positionX : roundedPositionX,
        positionY: hasPositionYKeyframes ? prev.positionY : roundedPositionY,
      }));
    }

    // Handle keyframe addition or update for positionX
    if (hasPositionXKeyframes) {
      const existingKeyframe = segmentKeyframes.positionX.find((kf) =>
        areTimesEqual(kf.time, timeInSegment)
      );
      if (existingKeyframe) {
        updateKeyframe('positionX', roundedPositionX);
      } else {
        addKeyframe('positionX', roundedPositionX);
      }
    }

    // Handle keyframe addition or update for positionY
    if (hasPositionYKeyframes) {
      const existingKeyframe = segmentKeyframes.positionY.find((kf) =>
        areTimesEqual(kf.time, timeInSegment)
      );
      if (existingKeyframe) {
        updateKeyframe('positionY', roundedPositionY);
      } else {
        addKeyframe('positionY', roundedPositionY);
      }
    }

    // Debounce save to backend for static value changes
    if (!hasPositionXKeyframes || !hasPositionYKeyframes) {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        saveSegmentChanges(keyframes, {
          ...tempSegmentValues,
          positionX: hasPositionXKeyframes ? tempSegmentValues.positionX : roundedPositionX,
          positionY: hasPositionYKeyframes ? tempSegmentValues.positionY : roundedPositionY,
        });
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="branding-container">
          <h1>
            <span className="letter">S</span>
            <span className="letter">C</span>
            <span className="letter">E</span>
            <span className="letter">N</span>
            <span className="letter">I</span>
            <span className="letter">T</span>
            <span className="letter">H</span>
          </h1>
          <div className="logo-element"></div>
        </div>
      </div>
    );
  }

return (
  <div className="project-editor">
    <aside className={`media-panel ${isMediaPanelOpen ? 'open' : 'closed'}`}>
      <div className="panel-header">
        <button className="toggle-button" onClick={toggleMediaPanel}>
          {isMediaPanelOpen ? '◄' : '►'}
        </button>
      </div>
      {isMediaPanelOpen && (
        <div className="panel-content">
          <div className="media-section">
            <button className="section-button" data-section="videos" onClick={() => toggleSection('videos')}>
              Videos
            </button>
          </div>
          <div className="media-section">
            <button className="section-button" data-section="photos" onClick={() => toggleSection('photos')}>
              Photos
            </button>
          </div>
          <div className="media-section">
            <button className="section-button" data-section="audios" onClick={() => toggleSection('audios')}>
              Audio
            </button>
          </div>
          <div className="media-section">
            <button className="section-button" data-section="elements" onClick={() => toggleSection('elements')}>
              Elements
            </button>
          </div>
          <div className="media-section">
            <button className="section-button" data-section="textStyles" onClick={() => toggleSection('textStyles')}>
              Text Styles
            </button>
          </div>
          <div className="media-section">
            <button
              className="section-button coming-soon"
              data-section="aiSubtitles"
              disabled
              aria-disabled="true"
            >
              <span>AI Subtitles</span>
            </button>
          </div>
          {/* Tool Sections */}
          <div className="media-section">
            <button
              className={`section-button ${expandedSection === 'transform' ? 'active' : ''}`}
              data-section="transform"
              onClick={toggleTransformPanel}
            >
              Transform
            </button>
          </div>
          <div className="media-section">
            <button
              className={`section-button ${expandedSection === 'filters' ? 'active' : ''}`}
              data-section="filters"
              onClick={toggleFiltersPanel}
            >
              Filters
            </button>
          </div>
          <div className="media-section">
            <button
              className={`section-button ${expandedSection === 'text' ? 'active' : ''}`}
              data-section="text"
              onClick={toggleTextTool}
              disabled={!selectedSegment || selectedSegment.type !== 'text'}
            >
              Text
            </button>
          </div>
          <div className="media-section">
            <button
              className={`section-button ${expandedSection === 'transitions' ? 'active' : ''}`}
              data-section="transitions"
              onClick={toggleTransitionsPanel}
            >
              Transitions
            </button>
          </div>
        </div>
      )}
    </aside>

    {/* Content Panel */}
    {isContentPanelOpen && (
      <aside className="content-panel open">
        <div className="panel-header">
          <button className="toggle-button" onClick={() => {
            setIsContentPanelOpen(false);
            setExpandedSection(null);
            // Reset tool panel states when closing
            setIsTransformOpen(false);
            setIsFiltersOpen(false);
            setIsTextToolOpen(false);
            setIsTransitionsOpen(false);
          }}>
            ◄
          </button>
        </div>
        <div className="panel-content">
          {expandedSection === 'videos' && (
            <div className="section-content">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                id="upload-video"
                className="hidden-input"
                multiple
              />
              <label htmlFor="upload-video" className="upload-icon-button">
                <svg className="upload-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L12 14M12 2L8 6M12 2L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </label>
              {videos.length === 0 ? (
                <div className="empty-state">Pour it in, I am waiting!</div>
              ) : (
                <div className="video-list">
                  {videos.map((video) => (
                    <div
                      key={video.id || video.filePath || video.filename}
                      className={`video-item ${
                        selectedVideo && (selectedVideo.id === video.id || selectedVideo.filePath === video.filePath)
                          ? 'selected'
                          : ''
                      }`}
                      draggable={true}
                      onDragStart={(e) => handleMediaDragStart(e, video, 'media')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoClick(video);
                      }}
                      onDragEnd={(e) => e.stopPropagation()}
                    >
                      {typeof uploadProgress[video.displayName] === 'number' ? (
                        <div className="video-thumbnail uploading">
                          <div
                            className="video-thumbnail-image"
                            style={{
                              backgroundImage: `url(${tempThumbnails[video.displayName] || video.thumbnail || ''})`,
                              height: '130px',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: '4px',
                              filter: tempThumbnails[video.displayName] ? 'blur(5px)' : 'none',
                            }}
                          ></div>
                          <div className="upload-progress-overlay">
                            <div className="upload-progress-bar">
                              <div
                                className="upload-progress-fill"
                                style={{ width: `${uploadProgress[video.displayName]}%` }}
                              ></div>
                            </div>
                            <div className="upload-progress-text">
                              Uploading video: {uploadProgress[video.displayName]}%
                            </div>
                          </div>
                        </div>
                      ) : video.thumbnail ? (
                        <div
                          className="video-thumbnail"
                          style={{
                            backgroundImage: `url(${video.thumbnail})`,
                            height: '130px',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: '4px',
                          }}
                        ></div>
                      ) : (
                        <div className="video-thumbnail-placeholder"></div>
                      )}
                      <div className="video-title">
                        {video.title || (video.displayName ? video.displayName.split('/').pop().replace(/^\d+_/, '') : 'Untitled Video')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {expandedSection === 'photos' && (
            <div className="section-content">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                id="upload-photo"
                className="hidden-input"
                multiple
              />
              <label htmlFor="upload-photo" className="upload-icon-button">
                <svg className="upload-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L12 14M12 2L8 6M12 2L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </label>
              {photos.length === 0 ? (
                <div className="empty-state">Pour it in, I am waiting!</div>
              ) : (
                <div className="photo-list">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="photo-item"
                      draggable={true}
                      onDragStart={(e) => handleMediaDragStart(e, photo, 'photo')}
                      onClick={() => handlePhotoClick(photo)}
                    >
                      {uploadProgress[photo.displayName] !== undefined && (
                        <div className="upload-progress-overlay">
                          <div className="upload-progress-bar">
                            <div
                              className="upload-progress-fill"
                              style={{ width: `${uploadProgress[photo.displayName]}%` }}
                            ></div>
                          </div>
                          <div className="upload-progress-text">
                            Uploading photo: {uploadProgress[photo.displayName]}%
                          </div>
                        </div>
                      )}
                      <img src={photo.filePath} alt={photo.displayName} className="photo-thumbnail" />
                      <div className="photo-title">{photo.displayName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {expandedSection === 'audios' && (
            <div className="section-content">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                id="upload-audio"
                className="hidden-input"
                multiple
              />
              <label htmlFor="upload-audio" className="upload-icon-button">
                <svg className="upload-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L12 14M12 2L8 6M12 2L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </label>
              {audios.length === 0 ? (
                <div className="empty-state">Pour it in, I am waiting!</div>
              ) : (
                <div className="audio-list">
                  {audios.map((audio) => (
                    <div
                      key={audio.id}
                      className="audio-item"
                      draggable={true}
                      onDragStart={(e) => handleMediaDragStart(e, audio, 'audio')}
                      onClick={() => handleAudioClick(audio)}
                    >
                      {uploadProgress[audio.displayName] !== undefined ? (
                        <div className="upload-progress-overlay">
                          <div className="upload-progress-bar">
                            <div
                              className="upload-progress-fill"
                              style={{ width: `${uploadProgress[audio.displayName]}%` }}
                            ></div>
                          </div>
                          <div className="upload-progress-text">
                            Uploading audio: {uploadProgress[audio.displayName]}%
                          </div>
                        </div>
                      ) : (
                        <img
                          src="/images/audio.jpeg" // Adjust the path based on where you place audio.jpeg
                          alt={audio.displayName}
                          className="audio-thumbnail"
                          style={{
                            width: '90%',
                            height: '65px', // Match video/photo thumbnail height
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      <div className="audio-title">{audio.displayName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {expandedSection === 'elements' && (
            <div className="section-content">
              <input
                type="text"
                placeholder="Search elements..."
                value={elementSearchQuery}
                onChange={(e) => setElementSearchQuery(e.target.value)}
                className="search-input"
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
              {filteredElements.length === 0 ? (
                <div className="empty-state">
                  {elementSearchQuery ? 'No elements match your search.' : 'No elements available!'}
                </div>
              ) : (
                <div className="element-list">
                  {filteredElements.map((element) => (
                    <div
                      key={element.id}
                      className="element-item"
                      draggable={true}
                      onDragStart={(e) => handleMediaDragStart(e, element, 'element')}
                      onClick={() => handleElementClick(element)}
                    >
                      <img
                        src={element.thumbnail || element.filePath}
                        alt={element.displayName}
                        className="element-thumbnail"
                      />
                      <div className="element-title">{element.displayName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {expandedSection === 'textStyles' && (
            <div className="section-content">
              {defaultTextStyles.length === 0 ? (
                <div className="empty-state">No text styles available!</div>
              ) : (
                <div className="text-style-list">
                  {defaultTextStyles.map((style, index) => (
                    <div
                      key={`text-style-${index}`}
                      className="text-style-item"
                      draggable={true}
                      onDragStart={(e) => handleTextStyleDragStart(e, style)}
                      onClick={() => handleTextStyleClick(style)}
                      style={{
                        backgroundColor: style.backgroundColor,
                        color: style.fontColor,
                        fontFamily: style.fontFamily,
                        padding: `${Math.max(style.backgroundH / 2, style.backgroundW / 2)}px`,
                        borderRadius: `${style.backgroundBorderRadius}px`,
                        border: `${style.backgroundBorderWidth}px solid ${style.backgroundBorderColor}`,
                        opacity: style.backgroundOpacity,
                        textAlign: style.alignment,
                        margin: '10px 0',
                        cursor: 'pointer',
                        WebkitTextStroke: style.textBorderWidth > 0 ? `${style.textBorderWidth}px ${style.textBorderColor}` : 'none',
                        WebkitTextStrokeOpacity: style.textBorderOpacity || 1.0,
                      }}
                    >
                      {style.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {expandedSection === 'transform' && (
            <div className="section-content tool-subpanel transform-panel">
              <h3>Transform</h3>
              <KeyframeControls
                selectedSegment={selectedSegment}
                keyframes={keyframes}
                currentTimeInSegment={currentTimeInSegment}
                tempSegmentValues={tempSegmentValues}
                editingProperty={editingProperty}
                setTempSegmentValues={setTempSegmentValues}
                setEditingProperty={setEditingProperty}
                toggleKeyframe={toggleKeyframe}
                navigateKeyframes={navigateKeyframes}
                updateSegmentProperty={updateSegmentProperty}
                handleTimeUpdate={handleTimeUpdate}
                areTimesEqual={areTimesEqual}
                getValueAtTime={getValueAtTime}
                setCurrentTimeInSegment={setCurrentTimeInSegment}
                addKeyframe={addKeyframe}
                updateKeyframe={updateKeyframe}
                canvasDimensions={canvasDimensions}
              />
            </div>
          )}
          {expandedSection === 'filters' && (
            <div className="section-content tool-subpanel filter-panel">
              <h3>Filters</h3>
              <FilterControls
                selectedSegment={selectedSegment}
                filterParams={filterParams}
                appliedFilters={appliedFilters}
                updateFilterSetting={updateFilterSetting}
                resetFilters={resetFilters}
              />
            </div>
          )}
          {expandedSection === 'text' && selectedSegment && selectedSegment.type === 'text' && (
            <TextPanel
              textSettings={textSettings}
              updateTextSettings={updateTextSettings}
              isTextEmpty={isTextEmpty}
            />
          )}
          {expandedSection === 'transitions' && (
            <div className="section-content tool-subpanel transitions-panel">
              <h3>Transitions</h3>
              <TransitionsPanel
                availableTransitions={availableTransitions}
                selectedTransition={selectedTransition}
                handleTransitionDragStart={handleTransitionDragStart}
                handleTransitionDurationChange={handleTransitionDurationChange}
                handleTransitionDirectionChange={handleTransitionDirectionChange}
                handleTransitionDelete={handleTransitionDelete}
              />
            </div>
          )}
        </div>
    </aside>
  )}

    <div className="main-content">
      <div className="content-wrapper">
        <div className="preview-section" style={{ height: previewHeight }}>
          <VideoPreview
            videoLayers={videoLayers}
            audioLayers={audioLayers}
            currentTime={currentTime}
            isPlaying={isPlaying}
            canvasDimensions={canvasDimensions}
            totalDuration={totalDuration}
            onTimeUpdate={handleTimeUpdate}
            setIsPlaying={setIsPlaying}
            containerHeight={previewHeight}
            videos={videos}
            photos={photos}
            transitions={transitions}
            fps={projectFps}
            onLoadedAudioSegmentsUpdate={handleLoadedAudioSegmentsUpdate}
            onSegmentSelect={handleSegmentSelect}
            onSegmentPositionUpdate={handleSegmentPositionUpdate}
            selectedSegment={selectedSegment}
            updateSegmentProperty={updateSegmentProperty}
            projectId={projectId}
          />
        </div>
        {!isMobile && (
          <div
            className={`resize-preview-section ${isDraggingHandle ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          ></div>
        )}
        <div className="controls-panel">
          <button className="control-button" onClick={handleSaveProject} title="Save Project">
            💾
          </button>
          <button
            className="delete-button"
            onClick={handleDeleteSegment}
            disabled={!selectedSegment}
            title="Delete Segment"
          >
            🗑️
          </button>
          <button className="control-button" onClick={handleExportProject} title="Export Project">
            ⬆️
          </button>
        </div>
        <div
          className={`timeline-section ${isTimelineSelected ? 'selected' : ''}`}
          style={{ height: `${timelineHeight}%` }}
          ref={timelineRef}
        >
          {sessionId ? (
            <TimelineComponent
              videos={videos}
              audios={audios}
              sessionId={sessionId}
              projectId={projectId}
              totalDuration={totalDuration}
              setTotalDuration={setTotalDuration}
              onVideoSelect={(time, video) => setCurrentTime(time)}
              canvasDimensions={canvasDimensions}
              addVideoToTimeline={addVideoToTimeline}
              onTimeUpdate={(newTime) => handleTimeUpdate(newTime, false)}
              onSegmentSelect={handleSegmentSelect}
              videoLayers={videoLayers}
              audioLayers={audioLayers}
              setVideoLayers={setVideoLayers}
              setAudioLayers={setAudioLayers}
              thumbnailsGenerated={thumbnailsGenerated}
              openTextTool={openTextTool}
              timeScale={timeScale}
              setTimeScale={setTimeScale}
              setPlayheadFromParent={(setPlayhead) => (timelineSetPlayhead = setPlayhead)}
              onDeleteSegment={handleDeleteSegment}
              transitions={transitions}
              setTransitions={setTransitions}
              handleTransitionDrop={handleTransitionDrop}
              onTransitionSelect={handleTransitionSelect}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              fps={projectFps}
              saveHistory={saveHistory}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              currentTime={currentTime}
              onTimelineClick={() => setIsTimelineSelected(true)}
              MIN_TIME_SCALE={MIN_TIME_SCALE}
              MAX_TIME_SCALE={MAX_TIME_SCALE}
            />
          ) : (
            <div className="loading-container">
              <div className="branding-container">
                <h1>
                  <span className="letter">S</span>
                  <span className="letter">C</span>
                  <span className="letter">E</span>
                  <span className="letter">N</span>
                  <span className="letter">I</span>
                  <span className="letter">T</span>
                  <span className="letter">H</span>
                </h1>
                <div className="logo-element"></div>
              </div>
            </div>
          )}
        </div>
        <div className="zoom-slider-container">
          <input
            type="range"
            min={MIN_TIME_SCALE}
            max={MAX_TIME_SCALE}
            step={0.1}
            value={timeScale}
            onChange={(e) => {
              const newTimeScale = Number(e.target.value);
              const clampedTimeScale = Math.max(MIN_TIME_SCALE, Math.min(MAX_TIME_SCALE, newTimeScale));
              setTimeScale(clampedTimeScale);
            }}
            className="zoom-slider"
          />
          <span>Zoom: {timeScale.toFixed(1)}px/s</span>
        </div>
      </div>
    </div>
  </div>
);
};

export default ProjectEditor;
import React, { useRef, useEffect, useState, useMemo } from 'react';
import '../CSS/VideoPreview.css';
import fx from 'glfx';
import PropTypes from 'prop-types';

const API_BASE_URL = 'http://localhost:8080';
const baseFontSize = 24.0;

const VideoPreview = ({
  videoLayers,
  audioLayers = [],
  currentTime,
  isPlaying,
  canvasDimensions = { width: 1080, height: 1920 },
  onTimeUpdate,
  totalDuration = 0,
  setIsPlaying,
  containerHeight,
  videos = [],
  photos = [],
  transitions = [],
  fps = 25,
  onLoadedAudioSegmentsUpdate, // New prop to share loadedAudioSegments
  onSegmentSelect,
  onSegmentPositionUpdate,
}) => {
  const [loadingVideos, setLoadingVideos] = useState(new Set());
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [scale, setScale] = useState(1);
  const [loadedAudioSegments, setLoadedAudioSegments] = useState(new Set());
  const previewContainerRef = useRef(null);
  const videoRefs = useRef({});
  const preloadRefs = useRef({});
  const audioRefs = useRef({});
  const animationFrameRef = useRef(null);
  const glCanvasRef = useRef(null);
  const glTextureRefs = useRef({});
  const fxCanvasRef = useRef(null);
  const [videoDimensions, setVideoDimensions] = useState({});

    const [isDragging, setIsDragging] = useState(false);
    const [draggedSegment, setDraggedSegment] = useState(null);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [initialSegmentPos, setInitialSegmentPos] = useState({ positionX: 0, positionY: 0 });

    // Convert canvas coordinates to normalized canvas space
    const getCanvasCoordinates = (clientX, clientY) => {
      const canvasWrapper = document.querySelector('.canvas-wrapper');
      if (!canvasWrapper || !previewContainerRef.current) return { x: 0, y: 0 };

      const rect = canvasWrapper.getBoundingClientRect();
      const scaleFactor = 1 / scale; // Adjust for canvas scaling
      const x = (clientX - rect.left) * scaleFactor;
      const y = (clientY - rect.top) * scaleFactor;
      return { x, y };
    };

    // Determine if a point is within a segment's bounds
    const isPointInSegment = (x, y, element, scaleFactor) => {
      const posX = getKeyframeValue(
        element.keyframes?.positionX,
        element.localTime,
        element.positionX || 0
      );
      const posY = getKeyframeValue(
        element.keyframes?.positionY,
        element.localTime,
        element.positionY || 0
      );
      const segScale = getKeyframeValue(
        element.keyframes?.scale,
        element.localTime,
        element.scale || 1
      );

      let width, height;
      if (element.type === 'video') {
        width = (videoDimensions[element.id]?.width || canvasDimensions.width) * segScale;
        height = (videoDimensions[element.id]?.height || canvasDimensions.height) * segScale;
      } else if (element.type === 'image') {
        width = (element.width || canvasDimensions.width) * segScale;
        height = (element.height || canvasDimensions.height) * segScale;
      } else if (element.type === 'text') {
        const fontSize = baseFontSize * segScale;
        const textLines = element.text.split('\n');
        const lineHeight = fontSize * 1.2;
        const textHeight = textLines.length * lineHeight;
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${fontSize}px ${element.fontFamily || 'Arial'}`;
        const textWidths = textLines.map(line => ctx.measureText(line).width);
        const maxTextWidth = Math.max(...textWidths);
        width = (element.backgroundW === 0 ? maxTextWidth : maxTextWidth + element.backgroundW) + (element.textBorderWidth || 0) * 2;
        height = textHeight + (element.backgroundH || 0) + (element.textBorderWidth || 0) * 2;
      } else {
        return false;
      }

      // Center the bounds around the segment's position
      const centerX = canvasDimensions.width / 2 + posX;
      const centerY = canvasDimensions.height / 2 + posY;
      const left = centerX - width / 2;
      const top = centerY - height / 2;
      const right = left + width;
      const bottom = top + height;

      return x >= left && x <= right && y >= top && y <= bottom;
    };

    // Find the topmost segment at the click position
    const findTopSegmentAtPosition = (x, y) => {
      const visible = getVisibleElements();
      // Sort by layerIndex descending to get topmost segment
      const sortedElements = visible.sort((a, b) => b.layerIndex - a.layerIndex);
      for (const element of sortedElements) {
        if (isPointInSegment(x, y, element)) {
          return element;
        }
      }
      return null;
    };

    // Handle mouse down to start dragging or select segment
    const handleMouseDown = (e) => {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      const topSegment = findTopSegmentAtPosition(x, y);
      if (topSegment) {
        setDraggedSegment(topSegment);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setInitialSegmentPos({
          positionX: getKeyframeValue(
            topSegment.keyframes?.positionX,
            topSegment.localTime,
            topSegment.positionX || 0
          ),
          positionY: getKeyframeValue(
            topSegment.keyframes?.positionY,
            topSegment.localTime,
            topSegment.positionY || 0
          ),
        });
        setIsDragging(true);
        // Notify parent to select the segment
        if (onSegmentSelect) {
          onSegmentSelect(topSegment);
        }
      } else {
        // Deselect if clicking outside any segment
        if (onSegmentSelect) {
          onSegmentSelect(null);
        }
      }
    };

    // Handle mouse move during dragging
    const handleMouseMove = (e) => {
      if (!isDragging || !draggedSegment) return;

      const scaleFactor = 1 / scale; // Adjust for canvas scaling
      const deltaX = (e.clientX - dragStartPos.x) * scaleFactor;
      const deltaY = (e.clientY - dragStartPos.y) * scaleFactor;

      const newPositionX = initialSegmentPos.positionX + deltaX;
      const newPositionY = initialSegmentPos.positionY + deltaY;

      // Notify parent to update position (temporary, until mouse up)
      if (onSegmentPositionUpdate) {
        onSegmentPositionUpdate(draggedSegment, { positionX: newPositionX, positionY: newPositionY });
      }
    };

    // Handle mouse up to finalize dragging
    const handleMouseUp = () => {
      if (isDragging && draggedSegment) {
        // Finalize position update
        const scaleFactor = 1 / scale;
        const deltaX = (dragStartPos.x - dragStartPos.x) * scaleFactor; // Note: This seems incorrect, should use current mouse position
        const deltaY = (dragStartPos.y - dragStartPos.y) * scaleFactor;
        const newPositionX = initialSegmentPos.positionX + deltaX;
        const newPositionY = initialSegmentPos.positionY + deltaY;

        // Since deltaX and deltaY are zero due to using dragStartPos, we rely on the last update from mouse move
        // The onSegmentPositionUpdate in mouse move handles the final position
      }
      setIsDragging(false);
      setDraggedSegment(null);
      setDragStartPos({ x: 0, y: 0 });
      setInitialSegmentPos({ positionX: 0, positionY: 0 });
    };

    // Add mouse event listeners
    useEffect(() => {
      const canvasWrapper = document.querySelector('.canvas-wrapper');
      if (canvasWrapper) {
        canvasWrapper.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
        if (canvasWrapper) {
          canvasWrapper.removeEventListener('mousedown', handleMouseDown);
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, draggedSegment, dragStartPos, initialSegmentPos, scale, onSegmentSelect, onSegmentPositionUpdate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const lerp = (a, b, t) => a + (b - a) * Math.min(Math.max(t, 0), 1);

  const getKeyframeValue = (keyframes, time, defaultValue) => {
    if (!keyframes || keyframes.length === 0) return defaultValue;
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    if (time <= sorted[0].time) return sorted[0].value;
    if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

    for (let i = 0; i < sorted.length - 1; i++) {
      if (time >= sorted[i].time && time <= sorted[i + 1].time) {
        const t = (time - sorted[i].time) / (sorted[i + 1].time - sorted[i].time);
        return lerp(sorted[i].value, sorted[i + 1].value, t);
      }
    }
    return defaultValue;
  };

  // Initialize audio elements
  useEffect(() => {
    console.log('Audio initialization useEffect triggered with audioLayers:', audioLayers);
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage for audio initialization');
      return;
    }

    const promises = audioLayers.flat().map((segment) => {
      console.log(`Processing audio segment ${segment.id}:`, segment);
      if (!segment.url) {
        console.warn(`No URL for audio segment ${segment.id}:`, segment);
        return Promise.resolve();
      }

      if (audioRefs.current[segment.id]) {
        console.log(`Audio element for ${segment.id} already exists`);
        setLoadedAudioSegments((prev) => new Set(prev).add(segment.id));
        return Promise.resolve();
      }

      console.log(`Creating audio element for segment ${segment.id}: ${segment.url}`);
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.playbackRate = 1.0;

      return fetch(segment.url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          console.log(`Fetch response for audio ${segment.id}:`, response.status, response.statusText);
          if (!response.ok) {
            throw new Error(`Failed to fetch audio ${segment.url}: ${response.status} ${response.statusText}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          audio.src = blobUrl;
          audioRefs.current[segment.id] = audio;
          setLoadedAudioSegments((prev) => new Set(prev).add(segment.id));
          console.log(`Audio ${segment.id} loaded with blob URL: ${blobUrl}`);
          audio.addEventListener('loadeddata', () => {
            console.log(`Audio ${segment.id} loadeddata event fired`);
          });
          audio.addEventListener('error', (e) => {
            console.error(`Error loading audio ${segment.url}:`, e);
          });
        })
        .catch((error) => {
          console.error(`Error fetching audio ${segment.url}:`, error);
        });
    });

    Promise.all(promises).then(() => {
      console.log('Updated audioRefs:', Object.keys(audioRefs.current));
    });

    return () => {
      console.log('Cleaning up audio elements');
      Object.entries(audioRefs.current).forEach(([id, audio]) => {
        audio.pause();
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
          audio.src = '';
        }
        delete audioRefs.current[id];
        setLoadedAudioSegments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      });
    };
  }, [audioLayers]);

  // Share loadedAudioSegments with parent
  useEffect(() => {
    if (onLoadedAudioSegmentsUpdate) {
      onLoadedAudioSegmentsUpdate(loadedAudioSegments);
    }
  }, [loadedAudioSegments, onLoadedAudioSegmentsUpdate]);

  // Synchronize audio playback
  useEffect(() => {
    console.log(`Playback state: isPlaying=${isPlaying}, currentTime=${currentTime}, loadedAudioSegments=`, Array.from(loadedAudioSegments));

    // Pause all audio elements when not playing
    if (!isPlaying) {
      Object.values(audioRefs.current).forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
          console.log(`Paused audio ${audio.src}`);
        }
      });
      return;
    }

    // Process audio playback when playing
    audioLayers.forEach((layer) => {
      layer.forEach((segment) => {
        if (!loadedAudioSegments.has(segment.id)) {
          console.log(`Audio ${segment.id} not yet loaded, skipping playback`);
          return;
        }

        const audio = audioRefs.current[segment.id];
        if (!audio) {
          console.warn(`No audio element for segment ${segment.id}`);
          return;
        }

        // Ensure playback rate is 1.0
        audio.playbackRate = 1.0;

        const startTime = segment.timelineStartTime || segment.startTime || 0;
        const endTime = segment.timelineEndTime || startTime + (segment.duration || 0);
        const startWithinAudio = segment.startTimeWithinAudio || 0;
        const relativeTime = currentTime - startTime + startWithinAudio;

        console.log(
          `Audio ${segment.id}: start=${startTime}, end=${endTime}, relativeTime=${relativeTime}, duration=${segment.duration}, readyState=${audio.readyState}`
        );

        if (currentTime >= startTime && currentTime < endTime) {
          // Only update currentTime if significantly out of sync (increased threshold to 0.5s)
          if (Math.abs(audio.currentTime - relativeTime) > 0.5) {
            audio.currentTime = relativeTime;
            console.log(`Set audio ${segment.id} time to ${relativeTime}`);
          }

          // Attempt to play audio if paused and ready
          if (audio.paused && audio.readyState >= 4) {
            console.log(`Attempting to play audio ${segment.id}`);
            audio
              .play()
              .then(() => console.log(`Audio ${segment.id} started playing`))
              .catch((e) => {
                console.error(`Error playing audio ${segment.id}:`, e);
                if (e.name === 'NotAllowedError') {
                  setIsPlaying(false);
                  alert('Audio playback blocked. Please click the play button or interact with the page.');
                }
              });
          }
        } else {
          // Pause audio if outside its playback window
          if (!audio.paused) {
            audio.pause();
            console.log(`Paused audio ${segment.id}`);
          }
        }

        // Apply volume with keyframe support
        const volume = segment.keyframes?.volume
          ? getKeyframeValue(segment.keyframes.volume, relativeTime - startWithinAudio, segment.volume || 1.0)
          : segment.volume || 1.0;
        audio.volume = Math.max(0, Math.min(1, volume));
        console.log(`Set audio ${segment.id} volume to ${audio.volume}`);
      });
    });
  }, [currentTime, isPlaying, audioLayers, loadedAudioSegments, setIsPlaying, getKeyframeValue]);

  const computeTransitionEffects = (element, localTime) => {
    const relevantTransitions = transitions.filter(
      (t) =>
        t.segmentId === element.id &&
        element.layer === t.layer &&
        currentTime >= t.timelineStartTime &&
        currentTime <= t.timelineStartTime + t.duration
    );

    let effects = {
      opacity: null,
      positionX: 0,
      positionY: 0,
      clipPath: null,
      scale: null,
      rotate: null,
    };

    for (const transition of relevantTransitions) {
      const progress = (currentTime - transition.timelineStartTime) / transition.duration;
      const parameters = transition.parameters || {};

      // Determine if this is an incoming or outgoing transition
      const isIncoming = transition.start; // Transition at segment start
      const isOutgoing = transition.end;  // Transition at segment end

      if (transition.type === 'Fade') {
        if (isIncoming) {
          effects.opacity = lerp(0, 1, progress); // Fade in
        } else if (isOutgoing) {
          effects.opacity = lerp(1, 0, progress); // Fade out
        }
      } else if (transition.type === 'Slide') {
        const direction = parameters.direction || 'right';
        const canvasWidth = canvasDimensions.width;
        const canvasHeight = canvasDimensions.height;

        if (isIncoming) {
          // Slide in
          if (direction === 'right') {
            effects.positionX = lerp(canvasWidth, 0, progress);
          } else if (direction === 'left') {
            effects.positionX = lerp(-canvasWidth, 0, progress);
          } else if (direction === 'top') {
            effects.positionY = lerp(-canvasHeight, 0, progress);
          } else if (direction === 'bottom') {
            effects.positionY = lerp(canvasHeight, 0, progress);
          }
        } else if (isOutgoing) {
          // Slide out
          if (direction === 'right') {
            effects.positionX = lerp(0, -canvasWidth, progress);
          } else if (direction === 'left') {
            effects.positionX = lerp(0, canvasWidth, progress);
          } else if (direction === 'top') {
            effects.positionY = lerp(0, canvasHeight, progress);
          } else if (direction === 'bottom') {
            effects.positionY = lerp(0, -canvasHeight, progress);
          }
        }
      } else if (transition.type === 'Wipe') {
        const direction = parameters.direction || 'left';
        if (isIncoming) {
          // Wipe in
          if (direction === 'left') {
            effects.clipPath = `inset(0 calc((1 - ${progress}) * 100%) 0 0)`;
          } else if (direction === 'right') {
            effects.clipPath = `inset(0 0 0 calc((1 - ${progress}) * 100%))`;
          } else if (direction === 'top') {
            effects.clipPath = `inset(calc((1 - ${progress}) * 100%) 0 0 0)`;
          } else if (direction === 'bottom') {
            effects.clipPath = `inset(0 0 calc((1 - ${progress}) * 100%) 0)`;
          }
        } else if (isOutgoing) {
          // Wipe out
          if (direction === 'left') {
            effects.clipPath = `inset(0 calc(${progress} * 100%) 0 0)`;
          } else if (direction === 'right') {
            effects.clipPath = `inset(0 0 0 calc(${progress} * 100%))`;
          } else if (direction === 'top') {
            effects.clipPath = `inset(calc(${progress} * 100%) 0 0 0)`;
          } else if (direction === 'bottom') {
            effects.clipPath = `inset(0 0 calc(${progress} * 100%) 0)`;
          }
        }
      } else if (transition.type === 'Zoom') {
        const direction = parameters.direction || 'in';
        if (isIncoming) {
          // Zoom in
          effects.scale = direction === 'in' ? lerp(0.1, 1, progress) : lerp(2, 1, progress);
        } else if (isOutgoing) {
          // Zoom out
          effects.scale = direction === 'in' ? lerp(1, 0.1, progress) : lerp(1, 2, progress);
        }
      } else if (transition.type === 'Rotate') {
        const direction = parameters.direction || 'clockwise';
        const rotationSpeed = direction === 'clockwise' ? 720 : -720;
        const angle = rotationSpeed * transition.duration;
        if (isIncoming) {
          // Rotate in
          effects.rotate = lerp(angle, 0, progress);
        } else if (isOutgoing) {
          // Rotate out
          effects.rotate = lerp(0, angle, progress);
        }
      } else if (transition.type === 'Push') {
        const direction = parameters.direction || 'right';
        const canvasWidth = canvasDimensions.width;
        const canvasHeight = canvasDimensions.height;

        if (isIncoming) {
          // Push in
          if (direction === 'right') {
            effects.positionX = lerp(-canvasWidth, 0, progress);
          } else if (direction === 'left') {
            effects.positionX = lerp(canvasWidth, 0, progress);
          } else if (direction === 'top') {
            effects.positionY = lerp(canvasHeight, 0, progress);
          } else if (direction === 'bottom') {
            effects.positionY = lerp(-canvasHeight, 0, progress);
          }
        } else if (isOutgoing) {
          // Push out
          if (direction === 'right') {
            effects.positionX = lerp(0, canvasWidth, progress);
          } else if (direction === 'left') {
            effects.positionX = lerp(0, -canvasWidth, progress);
          } else if (direction === 'top') {
            effects.positionY = lerp(0, -canvasHeight, progress);
          } else if (direction === 'bottom') {
            effects.positionY = lerp(0, canvasHeight, progress);
          }
        }
      }
    }

    return effects;
  };

  const computeFilterStyle = (filters, localTime) => {
    if (!filters || !Array.isArray(filters)) return { css: '', webgl: [] };

    const cssFilterMap = {
      brightness: (value) => `brightness(${parseFloat(value) + 1})`,
      contrast: (value) => `contrast(${parseFloat(value)})`,
      saturation: (value) => `saturate(${parseFloat(value)})`,
      hue: (value) => `hue-rotate(${parseInt(value)}deg)`,
      grayscale: (value) => (parseFloat(value) > 0 ? `grayscale(1)` : ''),
      invert: (value) => (parseFloat(value) > 0 ? `invert(1)` : ''),
      rotate: () => {
        console.log('Rotate filter applied via transform, not CSS filter.');
        return '';
      },
      flip: () => {
        console.log('Flip filter applied via transform, not CSS filter.');
        return '';
      },
    };

    const cssStyles = [];

    filters.forEach((filter) => {
      const { filterName, filterValue } = filter;
      if (cssFilterMap[filterName]) {
        const style = cssFilterMap[filterName](filterValue);
        if (style) cssStyles.push(style);
      } else {
        console.log(`Filter "${filterName}" is not supported in preview and will be ignored.`);
      }
    });

    return {
      css: cssStyles.length > 0 ? cssStyles.join(' ') : '',
      webgl: [],
    };
  };

  const videoLayerIds = useMemo(() => {
    return videoLayers
      .flat()
      .filter((item) => item.type === 'video' || item.type === 'image')
      .map((item) => `${item.id}-${item.filePath}`)
      .join('|');
  }, [videoLayers]);

  useEffect(() => {
    try {
      fxCanvasRef.current = fx.canvas();
      glCanvasRef.current = fxCanvasRef.current;
      glCanvasRef.current.style.display = 'none';
      document.body.appendChild(glCanvasRef.current);
    } catch (e) {
      console.error('Failed to initialize WebGL:', e);
    }

    return () => {
      if (glCanvasRef.current) {
        glCanvasRef.current.remove();
        glCanvasRef.current = null;
        fxCanvasRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const preloadVideos = () => {
      const allVideoItems = videoLayers.flat().filter((item) => item.type === 'video');
      const preloadPromises = allVideoItems.map((item) => {
        const normalizedFilePath = item.filePath.startsWith('videos/')
          ? item.filePath.substring(7)
          : item.filePath;
        const videoUrl = `${API_BASE_URL}/videos/${encodeURIComponent(normalizedFilePath)}`;

        if (!preloadRefs.current[item.id]) {
          const video = document.createElement('video');
          video.preload = 'auto';
          video.src = videoUrl;
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.style.display = 'none';
          document.body.appendChild(video);
          preloadRefs.current[item.id] = video;

          return new Promise((resolve) => {
            video.onloadedmetadata = () => {
              setVideoDimensions((prev) => ({
                ...prev,
                [item.id]: { width: video.videoWidth, height: video.videoHeight },
              }));
              try {
                if (fxCanvasRef.current) {
                  const texture = fxCanvasRef.current.texture(video);
                  glTextureRefs.current[item.id] = texture;
                }
              } catch (e) {
                console.error(`Failed to create WebGL texture for video ${item.id}:`, e);
              }
              setLoadingVideos((prev) => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
              });
              resolve();
            };
            video.onerror = () => {
              console.error(`Failed to preload video ${item.filePath}`);
              resolve();
            };
          });
        }
        return Promise.resolve();
      });

      setLoadingVideos(new Set(allVideoItems.map((item) => item.id)));
      Promise.all(preloadPromises).then(() => {
        setPreloadComplete(true);
        console.log('All videos preloaded');
      });
    };

    preloadVideos();

    return () => {
      Object.values(preloadRefs.current).forEach((video) => {
        video.pause();
        document.body.removeChild(video);
      });
      Object.values(glTextureRefs.current).forEach((texture) => {
        try {
          texture.destroy();
        } catch (e) {
          console.error('Error destroying texture:', e);
        }
      });
      preloadRefs.current = {};
      glTextureRefs.current = {};
    };
  }, [videoLayerIds]);

  useEffect(() => {
    const preloadImages = () => {
      const allImageItems = videoLayers.flat().filter((item) => item.type === 'image');
      allImageItems.forEach((item) => {
        if (!glTextureRefs.current[item.id]) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = item.filePath;
          img.onload = () => {
            try {
              if (fxCanvasRef.current) {
                const texture = fxCanvasRef.current.texture(img);
                glTextureRefs.current[item.id] = texture;
              }
            } catch (e) {
              console.error(`Failed to create WebGL texture for image ${item.id}:`, e);
            }
          };
          img.onerror = () => {
            console.error(`Failed to preload image ${item.filePath}`);
          };
        }
      });
    };

    preloadImages();
  }, [videoLayers]);

  useEffect(() => {
    const visibleElements = getVisibleElements();
    const setVideoTimeFunctions = new Map();

    visibleElements.forEach((element) => {
      if (element.type === 'video') {
        const videoRef = videoRefs.current[element.id];
        if (videoRef) {
          const normalizedFilePath = element.filePath.startsWith('videos/')
            ? element.filePath.substring(7)
            : element.filePath;
          const videoUrl = `${API_BASE_URL}/videos/${encodeURIComponent(normalizedFilePath)}`;

          if (!videoRef.src) {
            videoRef.src = videoUrl;
            videoRef.crossOrigin = 'anonymous';
            videoRef.load();
          }

          const setVideoTime = () => {
            const targetTime = element.localTime + (element.startTimeWithinVideo || 0);
            if (Math.abs(videoRef.currentTime - targetTime) > 0.05) {
              videoRef.currentTime = targetTime;
            }
          };
          setVideoTimeFunctions.set(element.id, setVideoTime);

          if (videoRef.readyState >= 2) {
            setVideoTime();
          } else {
            videoRef.addEventListener('loadeddata', setVideoTime, { once: true });
          }

          if (isPlaying && preloadComplete) {
            videoRef.play().catch((error) => console.error('Playback error:', error));
          } else {
            videoRef.pause();
          }
        }
      }
    });

    const visibleIds = visibleElements.map((el) => el.id);
    Object.entries(videoRefs.current).forEach(([id, videoRef]) => {
      if (!visibleIds.includes(id) && videoRef) {
        videoRef.pause();
      }
    });

    return () => {
      setVideoTimeFunctions.forEach((setVideoTime, id) => {
        const videoRef = videoRefs.current[id];
        if (videoRef) {
          videoRef.removeEventListener('loadeddata', setVideoTime);
        }
      });
    };
  }, [currentTime, isPlaying, videoLayers, preloadComplete]);

  useEffect(() => {
    if (previewContainerRef.current) {
      const calculateSize = () => {
        const containerWidth = previewContainerRef.current.clientWidth;
        const containerHeightPx =
          containerHeight && containerHeight !== 'auto'
            ? parseFloat(containerHeight)
            : previewContainerRef.current.clientHeight;
        const canvasAspectRatio = canvasDimensions.width / canvasDimensions.height;

        let newScale = Math.min(
          containerWidth / canvasDimensions.width,
          containerHeightPx / canvasDimensions.height
        );

        const minPreviewHeight = 100;
        const minScale = minPreviewHeight / canvasDimensions.height;
        const maxScale = 1.0;

        newScale = Math.max(minScale, Math.min(maxScale, newScale));
        setScale(newScale);

        const canvasWrapper = document.querySelector('.canvas-wrapper');
        if (canvasWrapper) {
          canvasWrapper.style.transform = `scale(${newScale})`;
          canvasWrapper.style.width = `${canvasDimensions.width}px`;
          canvasWrapper.style.height = `${canvasDimensions.height}px`;
        }

        const previewArea = document.querySelector('.preview-area');
        if (previewArea) {
          previewArea.style.width = `${canvasDimensions.width * newScale}px`;
          previewArea.style.height = `${canvasDimensions.height * newScale}px`;
        }
      };

      calculateSize();
      window.addEventListener('resize', calculateSize);
      return () => window.removeEventListener('resize', calculateSize);
    }
  }, [canvasDimensions, containerHeight]);

  const getVisibleElements = () => {
    const visibleElements = [];
    videoLayers.forEach((layer, layerIndex) => {
      layer.forEach((item) => {
        const itemStartTime = item.startTime || 0;
        const itemEndTime = itemStartTime + item.duration;
        if (currentTime >= itemStartTime && currentTime < itemEndTime) {
          visibleElements.push({
            ...item,
            layerIndex,
            localTime: currentTime - itemStartTime,
          });
        }
      });
    });
    return visibleElements.sort((a, b) => a.layerIndex - b.layerIndex);
  };

  const applyWebGLFilters = (element, sourceElement) => {
    return sourceElement;
  };

  const visibleElements = getVisibleElements();

    return (
      <div className="video-preview-container" ref={previewContainerRef}>
        <div className="preview-area">
          <div
            className="canvas-wrapper"
            style={{
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'black',
              transformOrigin: 'top left',
              cursor: isDragging ? 'grabbing' : 'pointer', // Indicate draggable state
            }}
          >
            {visibleElements.map((element) => {
              const positionX = getKeyframeValue(
                element.keyframes && element.keyframes.positionX,
                element.localTime,
                element.positionX || 0
              );
              const positionY = getKeyframeValue(
                element.keyframes && element.keyframes.positionY,
                element.localTime,
                element.positionY || 0
              );
              const scaleFactor = getKeyframeValue(
                element.keyframes && element.keyframes.scale,
                element.localTime,
                element.scale || 1
              );
              let opacity = getKeyframeValue(
                element.keyframes && element.keyframes.opacity,
                element.localTime,
                element.opacity || 1
              );

              console.log(`Rendering ${element.type} ${element.id}: localTime=${element.localTime}, positionX=${positionX}, positionY=${positionY}, scale=${scaleFactor}, opacity=${opacity}`);

              const transitionEffects = computeTransitionEffects(element, element.localTime);
              if (transitionEffects.opacity !== null) {
                opacity = transitionEffects.opacity;
              }
              const transitionPosX = transitionEffects.positionX || 0;
              const transitionPosY = transitionEffects.positionY || 0;
              let clipPath = transitionEffects.clipPath;
              const transitionScale = transitionEffects.scale;
              const transitionRotate = transitionEffects.rotate;

              const { css: filterStyle, webgl: webglFilters } = computeFilterStyle(
                element.filters,
                element.localTime
              );

              // Compute crop values
              const cropL = element.cropL || 0;
              const cropR = element.cropR || 0;
              const cropT = element.cropT || 0;
              const cropB = element.cropB || 0;

              // Validate crop percentages
              if (cropL < 0 || cropL > 100 || cropR < 0 || cropR > 100 || cropT < 0 || cropT > 100 || cropB < 0 || cropB > 100) {
                console.warn(`Invalid crop percentages for ${element.type} ${element.id}: cropL=${cropL}, cropR=${cropR}, cropT=${cropT}, cropB=${cropB}`);
              } else if (cropL + cropR >= 100 || cropT + cropB >= 100) {
                console.warn(`Total crop percentages exceed 100% for ${element.type} ${element.id}: cropL+cropR=${cropL + cropR}, cropT+cropB=${cropT + cropB}`);
              } else {
                // Apply crop using clip-path if any crop values are non-zero
                if (cropL > 0 || cropR > 0 || cropT > 0 || cropB > 0) {
                  const cropClipPath = `inset(${cropT}% ${cropR}% ${cropB}% ${cropL}%)`;
                  // Combine with transition clipPath if it exists
                  clipPath = clipPath ? `${cropClipPath} ${clipPath}` : cropClipPath;
                }
              }

              // Combine all transform operations
              let transform = '';
              // Positioning transform
              const totalPosX = positionX + transitionPosX;
              const totalPosY = positionY + transitionPosY;
              transform += `translate(${totalPosX}px, ${totalPosY}px) `;
              // Other transforms (rotate, flip, scale, etc.)
              const rotateFilter = element.filters?.find((f) => f.filterName === 'rotate');
              const flipFilter = element.filters?.find((f) => f.filterName === 'flip');
              if (rotateFilter) {
                transform += `rotate(${parseInt(rotateFilter.filterValue)}deg) `;
              }
              if (flipFilter) {
                if (flipFilter.filterValue === 'horizontal' || flipFilter.filterValue === 'both') {
                  transform += 'scaleX(-1) ';
                }
                if (flipFilter.filterValue === 'vertical' || flipFilter.filterValue === 'both') {
                  transform += 'scaleY(-1) ';
                }
              }
              if (transitionScale !== null) {
                transform += `scale(${transitionScale}) `;
              }
              if (transitionRotate !== null) {
                transform += `rotate(${transitionRotate}deg) `;
              }

              if (element.type === 'video') {
                const videoWidth = videoDimensions[element.id]?.width || canvasDimensions.width;
                const videoHeight = videoDimensions[element.id]?.height || canvasDimensions.height;

                let displayWidth = videoWidth * scaleFactor;
                let displayHeight = videoHeight * scaleFactor;

                // Center the element on the canvas
                const centerX = canvasDimensions.width / 2 - displayWidth / 2;
                const centerY = canvasDimensions.height / 2 - displayHeight / 2;

                return (
                  <React.Fragment key={element.id}>
                    <video
                      ref={(el) => (videoRefs.current[element.id] = el)}
                      className="preview-video"
                      muted={true}
                      crossOrigin="anonymous"
                      style={{
                        position: 'absolute',
                        left: `${centerX}px`, // Center horizontally
                        top: `${centerY}px`, // Center vertically
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        zIndex: element.layerIndex,
                        opacity,
                        objectFit: 'contain',
                        filter: filterStyle,
                        transform: transform.trim(),
                        clipPath,
                        display: webglFilters.length > 0 ? 'none' : 'block',
                        transition: 'transform 0.016s linear, opacity 0.016s linear',
                        transformOrigin: 'center center',
                      }}
                      onError={(e) => console.error(`Error loading video ${element.filePath}:`, e)}
                      onLoadedData={() => {
                        console.log(`Video ${element.filePath} loaded`);
                        // Update dimensions if not already set
                        if (videoRefs.current[element.id] && !videoDimensions[element.id]) {
                          setVideoDimensions((prev) => ({
                            ...prev,
                            [element.id]: {
                              width: videoRefs.current[element.id].videoWidth,
                              height: videoRefs.current[element.id].videoHeight,
                            },
                          }));
                        }
                      }}
                      preload="auto"
                    />
                    {webglFilters.length > 0 && (
                      <canvas
                        style={{
                          position: 'absolute',
                          left: `${centerX}px`,
                          top: `${centerY}px`,
                          width: `${displayWidth}px`,
                          height: `${displayHeight}px`,
                          zIndex: element.layerIndex,
                          opacity,
                          transform: transform.trim(),
                          clipPath,
                          transition: 'transform 0.016s linear, opacity 0.016s linear',
                          transformOrigin: 'center center',
                        }}
                        ref={(canvas) => {
                          if (canvas && videoRefs.current[element.id]) {
                            const filtered = applyWebGLFilters(element, videoRefs.current[element.id]);
                            if (filtered === videoRefs.current[element.id]) {
                              canvas.style.display = 'none';
                              if (videoRefs.current[element.id]) {
                                videoRefs.current[element.id].style.display = 'block';
                              }
                            } else {
                              canvas.width = displayWidth;
                              canvas.height = displayHeight;
                              const ctx = canvas.getContext('2d');
                              ctx.drawImage(filtered, 0, 0, displayWidth, displayHeight);
                            }
                          }
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              } else if (element.type === 'image') {
                const imgWidth = element.width || canvasDimensions.width;
                const imgHeight = element.height || canvasDimensions.height;
                const displayWidth = imgWidth * scaleFactor;
                const displayHeight = imgHeight * scaleFactor;

                // Center the element on the canvas
                const centerX = canvasDimensions.width / 2 - displayWidth / 2;
                const centerY = canvasDimensions.height / 2 - displayHeight / 2;

                const photo = photos.find((p) => p.fileName === element.fileName) || {
                  filePath: element.filePath,
                };

                const safeFilters = Array.isArray(element.filters) ? element.filters : [];
                const rotateFilter = safeFilters.find((f) => f.filterName === 'rotate');
                const flipFilter = safeFilters.find((f) => f.filterName === 'flip');

                return (
                  <React.Fragment key={element.id}>
                    <img
                      src={webglFilters.length > 0 ? null : photo.filePath}
                      alt="Preview"
                      crossOrigin="anonymous"
                      style={{
                        position: 'absolute',
                        left: `${centerX}px`,
                        top: `${centerY}px`,
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        zIndex: element.layerIndex,
                        opacity,
                        filter: filterStyle,
                        transform: transform.trim(),
                        clipPath,
                        display: webglFilters.length > 0 ? 'none' : 'block',
                        transition: 'transform 0.016s linear, opacity 0.016s linear',
                        transformOrigin: 'center center',
                      }}
                    />
                    {webglFilters.length > 0 && (
                      <canvas
                        style={{
                          position: 'absolute',
                          left: `${centerX}px`,
                          top: `${centerY}px`,
                          width: `${displayWidth}px`,
                          height: `${displayHeight}px`,
                          zIndex: element.layerIndex,
                          opacity,
                          transform: transform.trim(),
                          clipPath,
                          transition: 'transform 0.016s linear, opacity 0.016s linear',
                          transformOrigin: 'center center',
                        }}
                        ref={(canvas) => {
                          if (canvas) {
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.src = photo.filePath;
                            img.onload = () => {
                              const filtered = applyWebGLFilters(element, img);
                              canvas.width = displayWidth;
                              canvas.height = displayHeight;
                              const ctx = canvas.getContext('2d');
                              ctx.drawImage(filtered, 0, 0, displayWidth, displayHeight);
                            };
                            img.onerror = () => {
                              console.error(`Failed to load image for WebGL filtering: ${photo.filePath}`);
                            };
                          }
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              } else if (element.type === 'text') {
                const RESOLUTION_MULTIPLIER = canvasDimensions.width >= 3840 ? 1.5 : 2.0;
                const fontSize = baseFontSize * scaleFactor;

                const centerX = canvasDimensions.width / 2;
                const centerY = canvasDimensions.height / 2;

                const bgHeight = (element.backgroundH || 0) * scaleFactor;
                const bgWidth = (element.backgroundW || 0) * scaleFactor;
                const borderWidth = (element.backgroundBorderWidth || 0) * scaleFactor;
                const bgOpacity = element.backgroundOpacity !== undefined ? element.backgroundOpacity : 1.0;
                let bgColorStyle = 'transparent';

                if (element.backgroundColor && element.backgroundColor !== 'transparent') {
                  if (element.backgroundColor.startsWith('#')) {
                    const hex = element.backgroundColor.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    bgColorStyle = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;
                  } else {
                    bgColorStyle = element.backgroundColor;
                  }
                }

                const baseRadius = element.backgroundBorderRadius || 0;
                const correctionFactor = 0.55;
                const bgBorderRadius = baseRadius * scaleFactor * correctionFactor;

                const borderColor = element.backgroundBorderColor && element.backgroundBorderColor !== 'transparent'
                  ? element.backgroundBorderColor
                  : 'transparent';

                // Text border properties
                const textBorderWidth = (element.textBorderWidth || 0) * scaleFactor;
                const textBorderOpacity = element.textBorderOpacity !== undefined ? element.textBorderOpacity : 1.0;
                let textBorderColor = element.textBorderColor || 'transparent';

                // Convert textBorderColor to rgba format for canvas
                if (textBorderColor !== 'transparent' && textBorderColor.startsWith('#')) {
                  const hex = textBorderColor.replace('#', '');
                  const r = parseInt(hex.substring(0, 2), 16);
                  const g = parseInt(hex.substring(2, 4), 16);
                  const b = parseInt(hex.substring(4, 6), 16);
                  textBorderColor = `rgba(${r}, ${g}, ${b}, ${textBorderOpacity})`;
                } else if (textBorderColor !== 'transparent') {
                  textBorderColor = `rgba(${textBorderColor}, ${textBorderOpacity})`;
                }

                const textLines = element.text.split('\n');
                const lineHeight = fontSize * 1.2;
                const textHeight = textLines.length * lineHeight;

                // Calculate text width more accurately
                const ctx = document.createElement('canvas').getContext('2d');
                ctx.font = `${fontSize}px ${element.fontFamily || 'Arial'}`;
                // Replace textWidths calculation
                const textWidths = textLines.map(line => ctx.measureText(line).width);
                const maxTextWidth = Math.max(...textWidths);

                // Replace the existing calculations
                const effectiveContentWidth = element.backgroundW === 0
                  ? maxTextWidth + textBorderWidth * 2 // Include text border width for zero bgWidth
                  : maxTextWidth + bgWidth + textBorderWidth * 2; // Include text border width
                const contentHeight = textHeight + bgHeight + textBorderWidth * 2; // Include text border height

                const minDimension = Math.min(effectiveContentWidth, contentHeight);
                const maxRadius = minDimension / 2;
                const effectiveBorderRadius = Math.min(bgBorderRadius, maxRadius);

                // Replace canvas size calculation
                const canvasWidth = effectiveContentWidth + 2 * textBorderWidth + 2 * borderWidth;
                const canvasHeight = contentHeight + 2 * textBorderWidth + 2 * borderWidth;

                // Replace canvas position calculation
                const leftPos = centerX - (effectiveContentWidth + 2 * textBorderWidth + 2 * borderWidth) / 2 + positionX + transitionPosX;
                const topPos = centerY - (contentHeight + 2 * textBorderWidth + 2 * borderWidth) / 2 + positionY + transitionPosY;

                return (
                  <canvas
                    key={element.id}
                    ref={(canvas) => {
                      if (canvas) {
                        canvas.width = canvasWidth;
                        canvas.height = canvasHeight;
                        const ctx = canvas.getContext('2d');

                        // Clear canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Set background with rounded corners if needed
                        // Inside the canvas ref callback, replace the background drawing logic
                        // Replace background drawing logic
                        // Replace background drawing logic (only the border drawing part)
                        if (bgColorStyle !== 'transparent') {
                          ctx.save();
                          ctx.fillStyle = bgColorStyle;
                          const offset = textBorderWidth + borderWidth; // Match backend's bgBorderWidth + textBorderWidth
                          if (effectiveBorderRadius > 0) {
                            const x = offset;
                            const y = offset;
                            const width = effectiveContentWidth;
                            const height = contentHeight;
                            const radius = effectiveBorderRadius;

                            ctx.beginPath();
                            ctx.moveTo(x + radius, y);
                            ctx.lineTo(x + width - radius, y);
                            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                            ctx.lineTo(x + width, y + height - radius);
                            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                            ctx.lineTo(x + radius, y + height);
                            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                            ctx.lineTo(x, y + radius);
                            ctx.quadraticCurveTo(x, y, x + radius, y);
                            ctx.closePath();
                            ctx.fill();
                          } else {
                            ctx.fillRect(offset, offset, effectiveContentWidth, contentHeight);
                          }

                          // Draw border if needed
                          if (borderWidth > 0 && borderColor !== 'transparent') {
                            ctx.lineWidth = borderWidth;
                            ctx.strokeStyle = borderColor;
                            const borderOffset = textBorderWidth + borderWidth / 2; // Match backend's bgBorderWidth / 2 + textBorderWidth
                            if (effectiveBorderRadius > 0) {
                              const x = borderOffset;
                              const y = borderOffset;
                              const width = effectiveContentWidth + borderWidth;
                              const height = contentHeight + borderWidth;
                              const radius = effectiveBorderRadius + borderWidth;

                              ctx.beginPath();
                              ctx.moveTo(x + radius, y);
                              ctx.lineTo(x + width - radius, y);
                              ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                              ctx.lineTo(x + width, y + height - radius);
                              ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                              ctx.lineTo(x + radius, y + height);
                              ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                              ctx.lineTo(x, y + radius);
                              ctx.quadraticCurveTo(x, y, x + radius, y);
                              ctx.closePath();
                              ctx.stroke();
                            } else {
                              ctx.strokeRect(borderOffset, borderOffset, effectiveContentWidth + borderWidth, contentHeight + borderWidth);
                            }
                          }
                          ctx.restore();
                        }

                        // Prepare font settings
                        ctx.textBaseline = 'middle';
                        const fontStyle = `${fontSize}px ${element.fontFamily || 'Arial'}`;
                        ctx.font = fontStyle;

                        // Calculate text alignment
                        // Replace text alignment and vertical center calculations
                        let textX = textBorderWidth + borderWidth; // Match backend's bgBorderWidth + textBorderWidth
                        const alignment = element.alignment || 'center';

                        // Calculate text position based on alignment
                        if (alignment === 'center') {
                          ctx.textAlign = 'center';
                          textX += effectiveContentWidth / 2;
                        } else if (alignment === 'left') {
                          ctx.textAlign = 'left';
                        } else if (alignment === 'right') {
                          ctx.textAlign = 'right';
                          textX += effectiveContentWidth;
                        }

                        // Calculate the vertical center of the content area
                        const contentVerticalCenter = textBorderWidth + borderWidth + contentHeight / 2;
                        const totalTextBlockHeight = textLines.length * lineHeight;
                        const startY = contentVerticalCenter - totalTextBlockHeight / 2 + lineHeight / 2;

                        // Draw text border if needed
                        if (textBorderWidth > 0 && textBorderColor !== 'transparent') {
                          ctx.lineWidth = textBorderWidth; // Double for better visibility
                          ctx.strokeStyle = textBorderColor;
                          ctx.lineJoin = 'round'; // Smooth corners for text stroke

                          // Draw each line of text with border
                          textLines.forEach((line, index) => {
                            const textY = startY + index * lineHeight;
                            ctx.strokeText(line, textX, textY);
                          });
                        }

                        // Draw the text fill
                        ctx.fillStyle = element.fontColor || '#FFFFFF';
                        textLines.forEach((line, index) => {
                          const textY = startY + index * lineHeight;
                          ctx.fillText(line, textX, textY);
                        });
                      }
                    }}
                    className="preview-text-canvas"
                    style={{
                      position: 'absolute',
                      left: `${leftPos}px`,
                      top: `${topPos}px`,
                      zIndex: element.layerIndex,
                      opacity,
                      filter: filterStyle,
                      transform: transform.trim(),
                      clipPath,
                      transition: 'transform 0.016s linear, opacity 0.016s linear',
                      transformOrigin: 'center center',
                    }}
                  />
                );
              }
              return null;
            })}
          </div>

          {visibleElements.length === 0 && <div className="preview-empty-state"></div>}

          {loadingVideos.size > 0 && (
            <div className="preview-loading">
              <div className="preview-spinner"></div>
            </div>
          )}

          <div className="preview-time">{formatTime(currentTime)}</div>
        </div>
      </div>
    );
  };

  export default VideoPreview;
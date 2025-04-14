import React, { useRef, useEffect, useState, useMemo } from 'react';
import '../CSS/VideoPreview.css';

const API_BASE_URL = 'http://localhost:8080';

const VideoPreview = ({
  videoLayers, // Renamed from layers
  audioLayers = [], // Added for audio support
  currentTime,
  isPlaying,
  canvasDimensions = { width: 1080, height: 1920 },
  onTimeUpdate,
  totalDuration = 0,
  setIsPlaying, // Optional
  containerHeight,
  videos = [], // Added for video metadata
  photos = [], // Added for image metadata
}) => {
  const [loadingVideos, setLoadingVideos] = useState(new Set());
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [scale, setScale] = useState(1);
  const previewContainerRef = useRef(null);
  const videoRefs = useRef({});
  const preloadRefs = useRef({});
  const audioRefs = useRef({});
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Linear interpolation for keyframes (matches renderFinalVideo)
  const lerp = (a, b, t) => a + (b - a) * Math.min(Math.max(t, 0), 1);

  // Get keyframe value at time (matches renderFinalVideo)
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

  const videoLayerIds = useMemo(() => {
    return videoLayers
      .flat()
      .filter((item) => item.type === 'video')
      .map((item) => `${item.id}-${item.filePath}`)
      .join('|');
  }, [videoLayers]);

  // Preload videos
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
          video.muted = true;
          video.style.display = 'none';
          document.body.appendChild(video);
          preloadRefs.current[item.id] = video;

          return new Promise((resolve) => {
            video.onloadeddata = () => {
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
      preloadRefs.current = {};
    };
  }, [videoLayerIds]);

  // Preload audio
  useEffect(() => {
    const preloadAudio = () => {
      audioLayers.flat().forEach((segment) => {
        if (segment.type === 'audio' && !audioRefs.current[segment.id]) {
          const audioUrl = `${API_BASE_URL}/projects/${segment.projectId || '77'}/audio/${encodeURIComponent(segment.fileName)}`;
          const audio = document.createElement('audio');
          audio.preload = 'auto';
          audio.src = audioUrl;
          audioRefs.current[segment.id] = audio;

          audio.onloadeddata = () => {
            console.log(`Audio ${segment.fileName} loaded`);
          };
          audio.onerror = () => {
            console.error(`Failed to load audio ${segment.fileName}`);
          };
        }
      });
    };

    preloadAudio();

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
      });
    };
  }, [audioLayers]);

  // Sync video playback
  useEffect(() => {
    const visibleElements = getVisibleElements();

    const topmostVideo = visibleElements
      .filter((el) => el.type === 'video')
      .sort((a, b) => b.layerIndex - a.layerIndex)[0];

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

          videoRef.muted = topmostVideo && topmostVideo.id !== element.id;

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
        videoRef.muted = true;
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

  // Sync audio playback
  useEffect(() => {
    audioLayers.flat().forEach((segment) => {
      const audio = audioRefs.current[segment.id];
      if (!audio) return;

      const start = segment.startTime || 0;
      const end = start + segment.duration;
      const relativeTime = currentTime - start;

      const volume = getKeyframeValue(
        segment.keyframes && segment.keyframes.volume,
        relativeTime,
        segment.volume || 1
      );

      if (currentTime >= start && currentTime < end) {
        if (audio.paused && isPlaying) {
          audio.currentTime = relativeTime + (segment.startTimeWithinAudio || 0);
          audio.volume = volume;
          audio.play().catch((e) => console.error('Audio play error:', e));
        } else if (!audio.paused) {
          audio.volume = volume;
          if (Math.abs(audio.currentTime - (relativeTime + (segment.startTimeWithinAudio || 0))) > 0.05) {
            audio.currentTime = relativeTime + (segment.startTimeWithinAudio || 0);
          }
        }
      } else if (!audio.paused) {
        audio.pause();
      }
    });
  }, [currentTime, isPlaying, audioLayers]);

  // Update playhead
  useEffect(() => {
    const updatePlayhead = (timestamp) => {
      if (isPlaying) {
        const delta = (timestamp - lastUpdateTimeRef.current) / 1000;
        lastUpdateTimeRef.current = timestamp;
        const newTime = Math.min(totalDuration, currentTime + delta);
        onTimeUpdate(newTime);
        if (newTime >= totalDuration) {
          if (setIsPlaying) setIsPlaying(false);
          onTimeUpdate(0);
        }
      }
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    if (isPlaying) {
      lastUpdateTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, onTimeUpdate, totalDuration, setIsPlaying]);

  // Update canvas size and scale
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
          // Debug keyframes
          console.log(`Visible ${item.type} ${item.id} at t=${currentTime.toFixed(2)}:`, item.keyframes || {});
        }
      });
    });
    return visibleElements.sort((a, b) => a.layerIndex - b.layerIndex);
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
          }}
        >
          {visibleElements.map((element) => {
            const relativeTime = currentTime - (element.startTime || 0);

            // Get keyframed properties
            const positionX = getKeyframeValue(
              element.keyframes && element.keyframes.positionX,
              relativeTime,
              element.positionX || 0
            );
            const positionY = getKeyframeValue(
              element.keyframes && element.keyframes.positionY,
              relativeTime,
              element.positionY || 0
            );
            const scaleFactor = getKeyframeValue(
              element.keyframes && element.keyframes.scale,
              relativeTime,
              element.scale || 1
            );
            const opacity = getKeyframeValue(
              element.keyframes && element.keyframes.opacity,
              relativeTime,
              element.opacity || 1
            );

            // Debug keyframes
            if (element.keyframes) {
              console.log(`Element ${element.id} at t=${relativeTime.toFixed(2)}:`, {
                positionX,
                positionY,
                scale: scaleFactor,
                opacity,
              });
            }

            if (element.type === 'video') {
              const videoWidth = element.width || 1080;
              const videoHeight = element.height || 1920;
              const videoAspectRatio = videoWidth / videoHeight;

              let displayWidth = canvasDimensions.width;
              let displayHeight = canvasDimensions.height;

              if (canvasDimensions.height / canvasDimensions.width > videoAspectRatio) {
                displayHeight = canvasDimensions.width / videoAspectRatio;
              } else {
                displayWidth = canvasDimensions.height * videoAspectRatio;
              }

              displayWidth *= scaleFactor;
              displayHeight *= scaleFactor;

              // Position matches renderFinalVideo: (W-w)/2 + positionX - w/2*(scale-1)
              const posX =
                (canvasDimensions.width - displayWidth) / 2 +
                positionX -
                (displayWidth * (scaleFactor - 1)) / 2;
              const posY =
                (canvasDimensions.height - displayHeight) / 2 +
                positionY -
                (displayHeight * (scaleFactor - 1)) / 2;

              return (
                <video
                  key={element.id}
                  ref={(el) => (videoRefs.current[element.id] = el)}
                  className="preview-video"
                  muted={false}
                  style={{
                    position: 'absolute',
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    left: `${posX}px`,
                    top: `${posY}px`,
                    zIndex: element.layerIndex,
                    opacity,
                  }}
                  onError={(e) => console.error(`Error loading video ${element.filePath}:`, e)}
                  onLoadedData={() => console.log(`Video ${element.filePath} loaded`)}
                  preload="auto"
                />
              );
            } else if (element.type === 'image') {
              const imgWidth = element.width || canvasDimensions.width;
              const imgHeight = element.height || canvasDimensions.height;
              const displayWidth = imgWidth * scaleFactor;
              const displayHeight = imgHeight * scaleFactor;

              // Position matches renderFinalVideo
              const posX =
                (canvasDimensions.width - displayWidth) / 2 +
                positionX -
                (displayWidth * (scaleFactor - 1)) / 2;
              const posY =
                (canvasDimensions.height - displayHeight) / 2 +
                positionY -
                (displayHeight * (scaleFactor - 1)) / 2;

              // Use photos prop for accurate filePath
              const photo = photos.find((p) => p.fileName === element.fileName) || {
                filePath: element.filePath,
              };

              return (
                <img
                  key={element.id}
                  src={photo.filePath}
                  alt="Preview"
                  style={{
                    position: 'absolute',
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    left: `${posX}px`,
                    top: `${posY}px`,
                    opacity,
                    zIndex: element.layerIndex,
                  }}
                />
              );
            } else if (element.type === 'text') {
              const fontSize = (element.fontSize || 24) * scaleFactor;
              const textWidth = element.text.length * fontSize * 0.6; // Rough estimate
              const textHeight = fontSize * 1.2;

              // Position matches renderFinalVideo: (w-tw)/2 + positionX
              const posX = (canvasDimensions.width - textWidth) / 2 + positionX;
              const posY = (canvasDimensions.height - textHeight) / 2 + positionY;

              return (
                <div
                  key={element.id}
                  className="preview-text"
                  style={{
                    position: 'absolute',
                    left: `${posX}px`,
                    top: `${posY}px`,
                    fontFamily: element.fontFamily || 'Arial',
                    fontSize: `${fontSize}px`,
                    color: element.fontColor || '#FFFFFF',
                    backgroundColor: element.backgroundColor
                      ? `${element.backgroundColor}${element.backgroundColor.startsWith('#') ? '80' : ''}`
                      : 'transparent',
                    padding: `${5 * scale}px`,
                    zIndex: element.layerIndex + 10,
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center',
                    opacity,
                  }}
                >
                  {element.text}
                </div>
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
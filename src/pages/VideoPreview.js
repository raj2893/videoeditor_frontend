import React, { useRef, useEffect, useState, useMemo } from 'react';
import '../CSS/VideoPreview.css';

const API_BASE_URL = 'http://localhost:8080';

const VideoPreview = ({
  layers,
  currentTime,
  isPlaying,
  canvasDimensions = { width: 1080, height: 1920 },
  onTimeUpdate,
  totalDuration = 0,
  setIsPlaying,
  containerHeight,
}) => {
  const [loadingVideos, setLoadingVideos] = useState(new Set());
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [scale, setScale] = useState(1);
  const previewContainerRef = useRef(null);
  const videoRefs = useRef({});
  const preloadRefs = useRef({});
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const videoLayerIds = useMemo(() => {
    return layers
      .flat()
      .filter(item => item.type === 'video')
      .map(item => `${item.id}-${item.filePath}`)
      .join('|');
  }, [layers]);

  useEffect(() => {
    const preloadVideos = () => {
      const allVideoItems = layers.flat().filter(item => item.type === 'video');
      const preloadPromises = allVideoItems.map(item => {
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
              setLoadingVideos(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
              });
              resolve();
            };
            video.onerror = () => resolve();
          });
        }
        return Promise.resolve();
      });

      setLoadingVideos(new Set(allVideoItems.map(item => item.id)));
      Promise.all(preloadPromises).then(() => {
        setPreloadComplete(true);
        console.log('All videos preloaded');
      });
    };

    preloadVideos();

    return () => {
      Object.values(preloadRefs.current).forEach(video => {
        video.pause();
        document.body.removeChild(video);
      });
      preloadRefs.current = {};
    };
  }, [videoLayerIds]);

  useEffect(() => {
    const visibleElements = getVisibleElements();

    const topmostVideo = visibleElements
      .filter(el => el.type === 'video')
      .sort((a, b) => b.layerIndex - a.layerIndex)[0];

    const setVideoTimeFunctions = new Map();

    visibleElements.forEach(element => {
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
            videoRef.play().catch(error => console.error("Playback error:", error));
          } else {
            videoRef.pause();
          }
        }
      }
    });

    const visibleIds = visibleElements.map(el => el.id);
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
  }, [currentTime, isPlaying, layers, preloadComplete]);

  useEffect(() => {
    const updatePlayhead = (timestamp) => {
      if (isPlaying) {
        const delta = (timestamp - lastUpdateTimeRef.current) / 1000;
        lastUpdateTimeRef.current = timestamp;
        const newTime = Math.min(totalDuration, currentTime + delta);
        onTimeUpdate(newTime);
        if (newTime >= totalDuration) {
          setIsPlaying(false);
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

  useEffect(() => {
    if (previewContainerRef.current) {
      const calculateSize = () => {
        const containerWidth = previewContainerRef.current.clientWidth;
        const containerHeightPx = containerHeight && containerHeight !== 'auto'
          ? parseFloat(containerHeight)
          : previewContainerRef.current.clientHeight;
        const canvasAspectRatio = canvasDimensions.width / canvasDimensions.height;

        // Calculate base scale based on container dimensions
        let newScale = Math.min(
          containerWidth / canvasDimensions.width,
          containerHeightPx / canvasDimensions.height
        );

        // Define scale limits synchronized with ProjectEditor's minPreviewHeight
        const minPreviewHeight = 100; // Match ProjectEditor's minimum
        const minScale = minPreviewHeight / canvasDimensions.height; // e.g., 100 / 1920 ≈ 0.052
        const maxScale = 1.0; // Content won't exceed original size

        // Clamp the scale
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
    layers.forEach((layer, layerIndex) => {
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
          {visibleElements.map(element => {
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

              const scaleFactor = element.scale || 1;
              displayWidth *= scaleFactor;
              displayHeight *= scaleFactor;

              return (
                <video
                  key={element.id}
                  ref={el => (videoRefs.current[element.id] = el)}
                  className="preview-video"
                  muted={false}
                  style={{
                    position: 'absolute',
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    top: `${element.positionY || 50}%`,
                    left: `${element.positionX || 50}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: element.layerIndex,
                  }}
                  onError={(e) => console.error(`Error loading video ${element.filePath}:`, e)}
                  onLoadedData={() => console.log(`Video ${element.filePath} loaded`)}
                  preload="auto"
                />
              );
            } else if (element.type === 'image') {
              return (
                <img
                  key={element.id}
                  src={element.filePath}
                  alt="Preview"
                  style={{
                    position: 'absolute',
                    width: element.width ? `${element.width}px` : 'auto',
                    height: element.height ? `${element.height}px` : 'auto',
                    top: `${element.positionY || 50}%`,
                    left: `${element.positionX || 50}%`,
                    transform: `translate(-50%, -50%) scale(${element.scale || 1})`,
                    opacity: element.opacity || 1,
                    zIndex: element.layerIndex,
                  }}
                />
              );
            } else if (element.type === 'text') {
              return (
                <div
                  key={element.id}
                  className="preview-text"
                  style={{
                    position: 'absolute',
                    left: `${element.positionX}%`,
                    top: `${element.positionY}%`,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: element.fontFamily || 'Arial',
                    fontSize: `${(element.fontSize || 24) * scale}px`,
                    color: element.fontColor || '#FFFFFF',
                    backgroundColor: element.backgroundColor || 'transparent',
                    padding: `${5 * scale}px`,
                    zIndex: element.layerIndex + 10,
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center',
                  }}
                >
                  {element.text}
                </div>
              );
            }
            return null;
          })}
        </div>

        {visibleElements.length === 0 && (
          <div className="preview-empty-state">
          </div>
        )}

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
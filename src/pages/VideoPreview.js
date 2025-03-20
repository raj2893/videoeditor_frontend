import React, { useRef, useEffect, useState } from 'react';
import '../CSS/VideoPreview.css';

// Add this at the top of the file
const API_BASE_URL = 'http://localhost:8080';

const VideoPreview = ({
  layers,
  currentTime,
  isPlaying,
  canvasDimensions = { width: 1280, height: 720 },
  onTimeUpdate,
}) => {
  const [aspectRatio, setAspectRatio] = useState(16/9);
  const previewContainerRef = useRef(null);
  const videoRefs = useRef({});
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  // Calculate the visible elements at the current time
  const getVisibleElements = () => {
    const visibleElements = [];

    // Process all layers in order (layer 0 at bottom, highest layer on top)
    layers.forEach((layer, layerIndex) => {
      layer.forEach(item => {
        // Check if the item is visible at the current time
        const itemStartTime = item.startTime;
        const itemEndTime = item.startTime + item.duration;

        // Add this inside getVisibleElements function in VideoPreview.js
        console.log(`Checking visibility for item:`, item);
        console.log(`Item time range: ${itemStartTime} to ${itemEndTime}, Current time: ${currentTime}`);

        if (currentTime >= itemStartTime && currentTime < itemEndTime) {
          visibleElements.push({
            ...item,
            layerIndex,
            localTime: currentTime - itemStartTime
          });
        }
      });
    });

    return visibleElements.sort((a, b) => a.layerIndex - b.layerIndex);
  };

  // Update video time positions
  useEffect(() => {
    const updateVideoTimes = () => {
      const visibleElements = getVisibleElements();

      // For each visible element that is a video, update its current time
      visibleElements.forEach(element => {
        if (element.type === 'video') {
          const videoRef = videoRefs.current[element.id];
          if (videoRef) {
            // Set the current time based on the local position in the clip
            const targetTime = element.localTime;

            // Only update if the difference is significant
            if (Math.abs(videoRef.currentTime - targetTime) > 0.1) {
              videoRef.currentTime = targetTime;
            }
          }
        }
      });
    };

    updateVideoTimes();
  }, [currentTime]);

  // Handle play/pause for all videos
  useEffect(() => {
    Object.values(videoRefs.current).forEach(videoRef => {
      if (isPlaying) {
        // Use the play promise to catch any autoplay restrictions
        const playPromise = videoRef.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Playback was prevented:", error);
          });
        }
      } else {
        videoRef.pause();
      }
    });
  }, [isPlaying]);

  // Set up the animation loop for simulating video playback during timeline scrubbing
  useEffect(() => {
    const updatePlayhead = (timestamp) => {
      // Only update if we're playing
      if (isPlaying) {
        // Calculate time delta and update
        const now = performance.now();
        const delta = (now - lastUpdateTimeRef.current) / 1000; // Convert to seconds

        if (delta > 0.01) { // Update at most 100 times per second
          lastUpdateTimeRef.current = now;

          if (onTimeUpdate) {
            onTimeUpdate(currentTime + delta);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);

    // Clean up
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, onTimeUpdate]);

  // Calculate preview dimensions to maintain aspect ratio
  useEffect(() => {
    if (previewContainerRef.current) {
      const calculateSize = () => {
        const containerWidth = previewContainerRef.current.clientWidth;
        const containerHeight = previewContainerRef.current.clientHeight;

        // Calculate the aspect ratio from canvas dimensions
        const aspectRatio = canvasDimensions.width / canvasDimensions.height;
        setAspectRatio(aspectRatio);

        // Resize the preview to maintain aspect ratio within the container
        const previewArea = document.querySelector('.preview-area');
        if (previewArea) {
          if (containerWidth / aspectRatio <= containerHeight) {
            // Width constrained
            previewArea.style.width = `${containerWidth}px`;
            previewArea.style.height = `${containerWidth / aspectRatio}px`;
          } else {
            // Height constrained
            previewArea.style.height = `${containerHeight}px`;
            previewArea.style.width = `${containerHeight * aspectRatio}px`;
          }
        }
      };

      // Calculate initial size
      calculateSize();

      // Add resize listener
      window.addEventListener('resize', calculateSize);
      return () => window.removeEventListener('resize', calculateSize);
    }
  }, [canvasDimensions]);

  // Render visible elements based on current playhead position
  const visibleElements = getVisibleElements();

  return (
    <div className="video-preview-container" ref={previewContainerRef}>
      <div className="preview-area" style={{ position: 'relative', backgroundColor: 'black' }}>
        {/* Render each visible element */}
        {visibleElements.map(element => {
          if (element.type === 'video') {
            return (
              <video
                key={element.id}
                ref={el => {
                  if (el) videoRefs.current[element.id] = el;
                }}
                src={`${API_BASE_URL}/videos/${encodeURIComponent(element.filePath)}`}
                className="preview-video"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  zIndex: element.layerIndex
                }}
                onError={(e) => console.error(`Error loading video ${element.filePath}:`, e)}
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
                  fontSize: `${element.fontSize}px`,
                  color: element.fontColor || '#FFFFFF',
                  backgroundColor: element.backgroundColor || 'transparent',
                  padding: '5px',
                  zIndex: element.layerIndex + 10, // Text always appears above videos
                  whiteSpace: 'pre-wrap',
                  textAlign: 'center'
                }}
              >
                {element.text}
              </div>
            );
          }
          return null;
        })}

        {/* Show empty state when nothing is visible at current time */}
        {visibleElements.length === 0 && (
          <div className="preview-empty-state">
            No media at current playhead position
          </div>
        )}

        {/* Time indicator */}
        <div className="preview-time">
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  );
};

// Helper function to format time as MM:SS.ms
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export default VideoPreview;
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../CSS/Timeline.css'; // We'll create this CSS file later
import { useCallback } from 'react';
import TextSegmentDialog from './TextSegmentDialog'; // Import the new component
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
  onTimeUpdate
}) => {
  const [timelineVideos, setTimelineVideos] = useState([]); // Videos in the timeline
  const [timeScale, setTimeScale] = useState(50); // pixels per second
  const [playhead, setPlayhead] = useState(0); // current playhead position in seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [layers, setLayers] = useState([[], [], []]); // Initialize with 3 empty layers
  const [draggingItem, setDraggingItem] = useState(null);
  const [dragLayer, setDragLayer] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  // Add these state variables to TimelineComponent
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  // Add state for snap indicators
  const [snapIndicators, setSnapIndicators] = useState([]);
  // Add these state variables for text features
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
    duration: 5 // Default duration in seconds
  });

  // Add these constants near the top of your component
  const SNAP_THRESHOLD = 0.5; // Threshold in seconds for magnetic snapping
  const SNAP_VISUAL_INDICATOR_WIDTH = 3;

  const timelineRef = useRef(null);
  const playheadRef = useRef(null);
  const playIntervalRef = useRef(null);
  const API_BASE_URL = 'http://localhost:8080'; // Same as in your ProjectEditor

  // Calculate the total duration of all videos in the timeline
  useEffect(() => {
    const calculateDuration = () => {
      let maxDuration = 0;

      // Find the maximum end time across all layers
      layers.forEach(layer => {
        layer.forEach(video => {
          const endTime = video.startTime + video.duration;
          if (endTime > maxDuration) {
            maxDuration = endTime;
          }
        });
      });

      setTotalDuration(maxDuration > 0 ? maxDuration : 0);
    };

    calculateDuration();
  }, [layers, setTotalDuration]);

  // Calculate the end time of the last video in a layer
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

  // Handle dragging start for timeline videos
  const handleDragStart = (e, video, layerIndex) => {
    setDraggingItem(video);
    setDragLayer(layerIndex);

    // Calculate offset within the clip where the drag started
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    setDragOffset(offsetX / timeScale); // Convert pixels to seconds

    // Add a dragging class for styling
    e.currentTarget.classList.add('dragging');
  };

  // Add this function to your component for improved visual feedback
  useEffect(() => {
    const handleDragHover = (e) => {
      if (!draggingItem || !timelineRef.current) return;

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const mouseY = e.clientY - timelineRect.top;

      // If mouse is above the highest layer, show feedback for new layer
      if (mouseY < 0) {
        timelineRef.current.classList.add('showing-new-layer-top');
      } else {
        timelineRef.current.classList.remove('showing-new-layer-top');
      }
    };

    document.addEventListener('dragover', handleDragHover);
    return () => document.removeEventListener('dragover', handleDragHover);
  }, [draggingItem]);

  // Fix handleDragOver function to properly detect potential new layers
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!draggingItem) return;

    // Calculate new position based on mouse and timeline
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - timelineRect.left;

    // Calculate which layer based on Y position
    const mouseY = e.clientY - timelineRect.top;
    const layerHeight = 80; // Same as the CSS height for a layer

      // Get the reversed layer index (since we display layers in reverse)
      const reversedIndex = Math.floor(mouseY / layerHeight);
      // Convert to actual layer index
      let targetLayer = layers.length - 1 - reversedIndex;

     // Allow dropping above the highest layer to create a new one
     // If mouse is above the highest visible layer
     if (reversedIndex < 0) {
       targetLayer = layers.length; // This would be a new layer above current highest
       timelineRef.current.classList.add('showing-new-layer');
     } else if (targetLayer >= 0) {
       timelineRef.current.classList.remove('showing-new-layer');
     } else {
       // If trying to drop below the bottom-most layer, don't allow
       timelineRef.current.classList.remove('showing-new-layer');
     }

     // Calculate potential position in seconds
       let potentialStartTime = (mouseX / timeScale) - dragOffset;
       potentialStartTime = Math.max(0, potentialStartTime);

       // Initialize snap indicators
       const newSnapIndicators = [];

       // Skip layers checks if we're creating a new layer
       if (targetLayer < layers.length) {
         // Find all potential snap points in all layers
         const snapPoints = [];

         layers.forEach((layer, layerIdx) => {
           layer.forEach(video => {
             // Skip the video being dragged
             if (video.id === draggingItem.id) return;

             // Add start and end times of existing videos as snap points
             snapPoints.push({
               time: video.startTime,
               layerIdx,
               type: 'start'
             });

             snapPoints.push({
               time: video.startTime + video.duration,
               layerIdx,
               type: 'end'
             });

             // Add the 0-second position as a special snap point
             snapPoints.push({
               time: 0,
               layerIdx: -1, // Special value to indicate this is the timeline start
               type: 'timelineStart'
             });
           });
         });

         // Find the closest snap point within threshold
         let closestSnapPoint = null;
         let minDistance = SNAP_THRESHOLD;

         snapPoints.forEach(point => {
           const currentThreshold = point.time === 0 ? SNAP_THRESHOLD * 2 : SNAP_THRESHOLD;

           // Check distance to video start
           const distanceToStart = Math.abs(point.time - potentialStartTime);
           if (distanceToStart < minDistance) {
             minDistance = distanceToStart;
             closestSnapPoint = {
               time: point.time,
               layerIdx: point.layerIdx,
               type: point.type,
               edge: 'start'
             };
           }

           // Check distance to video end
           const videoEndTime = potentialStartTime + draggingItem.duration;
           const distanceToEnd = Math.abs(point.time - videoEndTime);
           if (distanceToEnd < minDistance) {
             minDistance = distanceToEnd;
             closestSnapPoint = {
               time: point.time - draggingItem.duration,
               layerIdx: point.layerIdx,
               type: point.type,
               edge: 'end'
             };
           }
         });

         // Apply snapping if a close point is found
         if (closestSnapPoint) {
           potentialStartTime = closestSnapPoint.time;

           // Create visual indicator for the snap
           newSnapIndicators.push({
             time: closestSnapPoint.edge === 'start' ?
               potentialStartTime :
               potentialStartTime + draggingItem.duration,
             layerIdx: closestSnapPoint.layerIdx,
             edge: closestSnapPoint.edge // Store which edge is snapping
           });
         }
       }

       // Update snap indicators
       setSnapIndicators(newSnapIndicators);

       // Update visual position of dragged item (optional - only if you're showing a ghost/preview)
       if (draggingItem) {
         // You could update some state here to show the potential position
         // This is optional and depends on how you want to visualize the drag
       }
  };

  // Update the handleDrop function to handle the layers properly:
  const handleDrop = async (e) => {
    e.preventDefault();
    if (!sessionId) return;

    try {
      // Remove dragging class and potential new layer indicator
      const dragElements = document.querySelectorAll('.dragging');
      dragElements.forEach(el => el.classList.remove('dragging'));
      if (timelineRef.current) {
            timelineRef.current.classList.remove('showing-new-layer');
          }

      // Calculate new position in seconds
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - timelineRect.left;
      const mouseY = e.clientY - timelineRect.top;
      const layerHeight = 80;

      // Check if dropped from media library
          try {
            const dataTransfer = e.dataTransfer;
            if (!dataTransfer) {
              console.error('DataTransfer is null or undefined');
              return;
            }

            const dataString = dataTransfer.getData('application/json');
            console.log('Dropped data:', dataString);

            if (dataString) {
              const data = JSON.parse(dataString);

              if (data.type === 'media') {
                // This is a drop from the media library
                const video = data.video;

                // Calculate which layer to add to
                // First get the reversed index (since layers are displayed in reverse order)
                const reversedIndex = Math.floor(mouseY / layerHeight);
                // Convert to actual layer index
                let targetLayer = layers.length - reversedIndex;

                // Handle drop area for new layer
                if (reversedIndex < 0) {
                  targetLayer = layers.length; // This would be a new layer
                }

                // Ensure valid layer index
                targetLayer = Math.max(0, Math.min(targetLayer, layers.length));

                // Calculate start time at drop position
                const dropTimePosition = mouseX / timeScale;

                console.log(`Dropping video at layer ${targetLayer}, time: ${dropTimePosition}s`);

                // Call the API to add video to timeline
                try {
                  // Use parent component's addVideoToTimeline function via props
                  await addVideoToTimeline(
                    video.filePath,
                    targetLayer,
                    dropTimePosition,
                    null // Use entire video
                  );

                  // Refresh timeline
                  loadProjectTimeline();

                  return; // Exit the function
                } catch (error) {
                  console.error('Error adding video to timeline:', error);
                }
              }
              if (data.type === 'text') {
                        // This is a drop from a text tool button
                        // Calculate which layer to add to
                        const reversedIndex = Math.floor(mouseY / layerHeight);
                        // Convert to actual layer index
                        let targetLayer = layers.length - reversedIndex;

                        // Handle drop area for new layer
                        if (reversedIndex < 0) {
                          targetLayer = layers.length; // This would be a new layer
                        }

                        // Ensure valid layer index
                        targetLayer = Math.max(0, Math.min(targetLayer, layers.length));

                        // Calculate start time at drop position
                        const dropTimePosition = mouseX / timeScale;

                        console.log(`Adding text at layer ${targetLayer}, time: ${dropTimePosition}s`);

                        // Open the text dialog at drop position
                        setTextDialogPosition({ x: e.clientX, y: e.clientY });
                        setShowTextDialog(true);
                        setEditingTextSegment({
                          isNew: true,
                          layer: targetLayer,
                          startTime: dropTimePosition
                        });

                        return; // Exit the function
              }
            }
          } catch (error) {
            console.error('Error parsing drop data:', error);
          }

          // If we get here, it's a regular drag within the timeline
          if (!draggingItem) return;

      // Check if dropped in the new layer drop area
      const dropAreaRect = document.querySelector('.new-layer-drop-area').getBoundingClientRect();
      const isNewLayerDrop = e.clientY >= dropAreaRect.top && e.clientY <= dropAreaRect.bottom;

      let actualLayerIndex;
      if (isNewLayerDrop) {
        // Create a new layer above the highest
        actualLayerIndex = layers.length;
      } else {
        // Get the reversed index first based on mouse position
        const reversedIndex = Math.floor(mouseY / layerHeight);
        // Convert reversed index to actual layer index, accounting for the new drop area
        actualLayerIndex = layers.length - reversedIndex;
        // Ensure we don't go below layer 0
        actualLayerIndex = Math.max(0, Math.min(actualLayerIndex, layers.length - 1));
      }

     // In handleDrop function - Fix how we use snap indicators
     const newStartTime = snapIndicators.length > 0 ?
       snapIndicators[0].time - (snapIndicators[0].edge === 'end' ? draggingItem.duration : 0) :
       (mouseX / timeScale) - dragOffset;
     const adjustedStartTime = Math.max(0, newStartTime);

      // Create new layers if needed
      let newLayers = [...layers];
      while (newLayers.length <= actualLayerIndex) {
        newLayers.push([]);
      }

      // Check for overlap in the target layer
      const hasOverlap = newLayers[actualLayerIndex].some(video => {
        // Skip checking against the video being dragged
        if (draggingItem && video.id === draggingItem.id) return false;

        const videoStart = video.startTime;
        const videoEnd = videoStart + video.duration;
        const newVideoEnd = adjustedStartTime + draggingItem.duration;

        // Check if there's any overlap
        return (adjustedStartTime < videoEnd && newVideoEnd > videoStart);
      });

      if (hasOverlap) {
        console.log('Overlap detected. Cannot place video here.');
        return;
      }

      // If we're moving within the same layer, remove the item from its original position
      if (actualLayerIndex === dragLayer) {
        newLayers[actualLayerIndex] = newLayers[actualLayerIndex].filter(v => v.id !== draggingItem.id);
      } else {
        // Moving to a different layer
        // Remove from original layer
        newLayers[dragLayer] = newLayers[dragLayer].filter(v => v.id !== draggingItem.id);
      }

      // Add to target layer
      const updatedVideo = {
        ...draggingItem,
        startTime: adjustedStartTime,
        layer: actualLayerIndex
      };
      newLayers[actualLayerIndex].push(updatedVideo);

      setLayers(newLayers);
      console.log(`Moved video to layer ${actualLayerIndex} at ${adjustedStartTime}s`);

      // Save to history
      saveHistory(newLayers);

      // Auto-save to backend
      autoSave(newLayers);

      // Update the backend
      await updateSegmentPosition(draggingItem.id, adjustedStartTime, actualLayerIndex);

      // Branch for text vs video segment updates
          if (draggingItem.type === 'text') {
            // Update text segment position
           await updateTextSegment(
             draggingItem.id,
             {
               ...draggingItem,
               startTime: adjustedStartTime,
               layer: actualLayerIndex
             },
             adjustedStartTime,
             actualLayerIndex
           );
          } else {
            // Update video segment position (existing code)
            await updateSegmentPosition(draggingItem.id, adjustedStartTime, actualLayerIndex);
          }

      // Reset dragging state
      setDraggingItem(null);
      setDragLayer(null);
      setDragOffset(0);

      // Clear snap indicators
      setSnapIndicators([]);

    } catch (error) {
      console.error('Error updating video position:', error);

      // Clear snap indicators on error too
      setSnapIndicators([]);
    }
  };

  // Add a cleanup function when dragging ends
  const handleDragEnd = () => {
    if (!draggingItem) return;

    // Clear snap indicators
    setSnapIndicators([]);

    // Remove any drag-related classes
    const dragElements = document.querySelectorAll('.dragging');
    dragElements.forEach(el => el.classList.remove('dragging'));

    if (timelineRef.current) {
      timelineRef.current.classList.remove('showing-new-layer');
    }
  };

  // Add event listener for dragend
  useEffect(() => {
    document.addEventListener('dragend', handleDragEnd);
    return () => document.removeEventListener('dragend', handleDragEnd);
  }, [draggingItem]);

  // Update the handleTimelineClick function:
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const clickTime = clickX / timeScale;

    // Calculate which layer was clicked
    const layerHeight = 80;
    const reversedIndex = Math.floor(clickY / layerHeight);

    // Convert to actual layer index
    const clickedLayerIndex = layers.length - 1 - reversedIndex;

    setPlayhead(clickTime);
    setCurrentTime(clickTime);

    // Reset playingVideoId first
    setPlayingVideoId(null);

    // Only look for videos in the clicked layer
    if (clickedLayerIndex >= 0 && clickedLayerIndex < layers.length) {
      const layerItems = layers[clickedLayerIndex];
      const foundItem = layerItems.find(item => {
        const itemStart = item.startTime;
        const itemEnd = itemStart + item.duration;
        return clickTime >= itemStart && clickTime < itemEnd;
      });

       if (foundItem) {
         if (foundItem.type === 'text') {
           // Handle text segment click - open editor
           setEditingTextSegment(foundItem);
           setTextDialogPosition({ x: e.clientX, y: e.clientY });
           setShowTextDialog(true);
         } else {
           // Handle video segment click
           setPlayingVideoId(foundItem.id);
           if (onVideoSelect) {
             onVideoSelect(clickTime, foundItem);
           }
         }
         return;
       }
    }

    // If no video found at that time and layer, just move the playhead
    if (onVideoSelect) {
      onVideoSelect(clickTime);
    }
  };

  // Modify togglePlayback to sync time
  const togglePlayback = () => {
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
    } else {
      playIntervalRef.current = setInterval(() => {
        setPlayhead(prev => {
          const newPosition = prev + 0.1; // Update every 100ms
          if (newPosition >= totalDuration) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          // Notify VideoPreview of time update
          if (onTimeUpdate) onTimeUpdate(newPosition);
          return newPosition;
        });

        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= totalDuration) {
            return 0;
          }
          return newTime;
        });
      }, 100);
    }

    setIsPlaying(!isPlaying);
  };

  // Format seconds as MM:SS.ms
    // Format seconds as MM:SS.ms (keep this helper in the main component)
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 100);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

  // Modify this function to handle text segments
  const loadProjectTimeline = async () => {
    if (!projectId || !sessionId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const project = response.data;
      if (project && project.timelineState) {
        let timelineState;
        try {
          timelineState = typeof project.timelineState === 'string'
            ? JSON.parse(project.timelineState)
            : project.timelineState;

          console.log("Loaded timeline state:", timelineState);
        } catch (e) {
          console.error("Failed to parse timeline state:", e);
          return;
        }

        // Process segments from timeline state
        if (timelineState.segments && timelineState.segments.length > 0) {
          // Create new layers structure based on the timeline segments
          const newLayers = [[], [], []]; // Initialize with 3 empty layers

          for (const segment of timelineState.segments) {
            // Check if it's a text segment
            if (segment.type === 'text') {
              // Create text segment object
              const textSegment = {
                id: segment.id,
                type: 'text',
                text: segment.text,
                startTime: segment.timelineStartTime,
                duration: segment.timelineEndTime - segment.timelineStartTime,
                layer: segment.layer || 0,
                fontFamily: segment.fontFamily || 'Arial',
                fontSize: segment.fontSize || 24,
                fontColor: segment.fontColor || '#FFFFFF',
                backgroundColor: segment.backgroundColor || 'transparent',
                positionX: segment.positionX || 50,
                positionY: segment.positionY || 50
              };

              const layerIndex = segment.layer || 0;
              if (layerIndex >= newLayers.length) {
                // Expand layers array if needed
                while (newLayers.length <= layerIndex) {
                  newLayers.push([]);
                }
              }

              newLayers[layerIndex].push(textSegment);
            } else {
              // It's a video segment - process as before
              let videoFileName = segment.sourceVideoPath;
              // Normalize paths by removing 'videos/' prefix if it exists
              const normalizedVideoPath = videoFileName.startsWith('videos/')
                ? videoFileName.substring(7)
                : videoFileName;

              // Try to find the video with both versions of the path
              let video = videos.find(v => {
                const vPath = (v.filePath || v.filename);
                const normalizedVPath = vPath.startsWith('videos/') ? vPath.substring(7) : vPath;
                return normalizedVPath === normalizedVideoPath;
              });

              if (video) {
                // Add the video to the appropriate layer
                const layerIndex = segment.layer || 0;
                if (layerIndex >= newLayers.length) {
                  // Expand layers array if needed
                  while (newLayers.length <= layerIndex) {
                    newLayers.push([]);
                  }
                }

                // Create timeline video object
                const timelineVideo = {
                  ...video,
                  type: 'video',
                  id: segment.id || `timeline-${video.id || video.filePath}-${Date.now()}`,
                  startTime: segment.timelineStartTime,
                  duration: segment.endTime - segment.startTime,
                  layer: layerIndex,
                  filePath: normalizedVideoPath // Ensure consistent file path
                };

                newLayers[layerIndex].push(timelineVideo);
              } else {
                console.error(`Could not find video for path: ${videoFileName}`);
              }
            }
          }

          // Update the layers state
          setLayers(newLayers);

          // Reset history when loading from server
          setHistory([]);
          setHistoryIndex(-1);

          // Calculate total duration based on all videos and text segments
          let maxEndTime = 0;
          newLayers.forEach(layer => {
            layer.forEach(item => {
              const endTime = item.startTime + item.duration;
              if (endTime > maxEndTime) {
                maxEndTime = endTime;
              }
            });
          });

          setTotalDuration(maxEndTime > 0 ? maxEndTime : 0);
        } else {
          console.log("No segments found in timeline state");
        }
      }
    } catch (error) {
      console.error('Error loading project timeline:', error);
    }
  };

  // Add this useEffect hook to load the timeline when component mounts
  useEffect(() => {
    if (projectId && sessionId && videos.length > 0) {
      loadProjectTimeline();
    }
  }, [projectId, sessionId, videos]);

  // Add this function to mark a video as playing/selected
  const handleVideoSelect = (videoId) => {
    setPlayingVideoId(videoId);

    // Find the video in the layers
    for (let i = 0; i < layers.length; i++) {
      const video = layers[i].find(v => v.id === videoId);
      if (video) {
        // If you have an onVideoSelect callback, pass the time and video
        if (onVideoSelect) {
          onVideoSelect(video.startTime, video);
        }
        break;
      }
    }
  };

  // Add this function to update the segment position in the backend
  const updateSegmentPosition = async (segmentId, newStartTime, newLayer) => {
    if (!projectId || !sessionId) return;

    try {
      await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-segment`,
        {
          segmentId,
          timelineStartTime: newStartTime,
          layer: newLayer
        },
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      console.log(`Updated segment ${segmentId} position to layer ${newLayer} at ${newStartTime}s`);
    } catch (error) {
      console.error('Error updating segment position:', error);
    }
  };

  // Add this function to enhance drag feedback
  const handleDragOverNewLayer = (e) => {
    e.preventDefault();
    if (!draggingItem) return;

    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeaveNewLayer = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  // Add debounced auto-save function
  const autoSaveTimeout = useRef(null);

  const saveHistory = useCallback((newLayers) => {
    // Save current state to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newLayers));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const autoSave = useCallback((newLayers) => {
    // Clear any existing timeout
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    // Set a new timeout for auto-save
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
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log('Project auto-saved');
      } catch (error) {
        console.error('Error during auto-save:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second delay for auto-save
  }, [projectId, sessionId]);

  // Update this function to handle text segments
  const flattenLayersToSegments = (layers) => {
    const segments = [];
    layers.forEach((layer, layerIndex) => {
      layer.forEach(item => {
        if (item.type === 'text') {
          // Text segment
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
            positionY: item.positionY
          });
        } else {
          // Video segment
          segments.push({
            id: item.id,
            type: 'video',
            sourceVideoPath: item.filePath || item.filename,
            layer: layerIndex,
            timelineStartTime: item.startTime,
            startTime: 0, // Start from beginning of video
            endTime: item.duration, // Use full duration
          });
        }
      });
    });
    return segments;
  };

  // Add undo function
  const handleUndo = () => {
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);

    const previousLayers = JSON.parse(history[newIndex]);
    setLayers(previousLayers);

    // Auto-save the undone state
    autoSave(previousLayers);
  };

  // Add redo function
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);

    const nextLayers = JSON.parse(history[newIndex]);
    setLayers(nextLayers);

    // Auto-save the redone state
    autoSave(nextLayers);
  };

  // Initialize history when timeline loads
  useEffect(() => {
    if (layers.length > 0) {
      // Only initialize history if not already done AND it's not the initial load
      if (history.length === 0) {
        // Add a small delay to ensure this happens after the initial load completes
        const timer = setTimeout(() => {
          saveHistory(layers);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [layers, history.length, saveHistory]);

  // Add this function to create text segments
  const addTextToTimeline = async (targetLayer = 0, startTime = 0) => {
    if (!sessionId || !projectId) return;

    try {
      const token = localStorage.getItem('token');
      const textEndTime = startTime + textSettings.duration;

      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-text`,
        {
          text: textSettings.text,
          layer: targetLayer,
          timelineStartTime: startTime,
          timelineEndTime: textEndTime,
          fontFamily: textSettings.fontFamily,
          fontSize: textSettings.fontSize,
          fontColor: textSettings.fontColor,
          backgroundColor: textSettings.backgroundColor,
          positionX: textSettings.positionX,
          positionY: textSettings.positionY
        },
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Refresh timeline to show the new text segment
      loadProjectTimeline();

      return response.data;
    } catch (error) {
      console.error('Error adding text to timeline:', error);
    }
  };

  // Add this function to update text segments
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
        positionY: updatedTextSettings.positionY
      };

      // Add timelineStartTime and layer if they're being changed
      if (newStartTime !== null) {
        requestBody.timelineStartTime = newStartTime;
      }

      if (newLayer !== null) {
        requestBody.layer = newLayer;
      }

      await axios.put(
        `${API_BASE_URL}/projects/${projectId}/update-text`,
        requestBody,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log(`Updated text segment ${segmentId}`);

      // Refresh timeline
      loadProjectTimeline();
    } catch (error) {
      console.error('Error updating text segment:', error);
    }
  };

  const handleSaveTextSegment = async (updatedTextSettings) => {
      try {
        if (editingTextSegment.isNew) {
          // Create new text segment
          await addTextToTimeline(
            editingTextSegment.layer,
            editingTextSegment.startTime
          );
        } else {
          // Update existing text segment
          await updateTextSegment(
            editingTextSegment.id,
            updatedTextSettings
          );
        }

        setShowTextDialog(false);
        setEditingTextSegment(null);
      } catch (error) {
        console.error('Error saving text segment:', error);
      }
    };

    const openAddTextDialog = () => {
        const startTime = currentTime || 0;
        const targetLayer = 0; // Default to top layer

        setTextDialogPosition({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
        setShowTextDialog(true);
        setEditingTextSegment({
          isNew: true,
          layer: targetLayer,
          startTime: startTime
        });
      };

      const handleEditTextSegment = (item, e) => {
        setEditingTextSegment(item);
        setTextDialogPosition({ x: e.clientX, y: e.clientY });
        setShowTextDialog(true);
      };

      // Add this to handle time updates from VideoPreview
      const handleTimeUpdate = (newTime) => {
        setPlayhead(newTime);
        setCurrentTime(newTime);
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
        />

        <div className="timeline-scroll-container">
          <TimelineRuler
            totalDuration={totalDuration}
            timeScale={timeScale}
            formatTime={formatTime}
          />

          <div
            className="timeline"
            ref={timelineRef}
            onClick={handleTimelineClick}
            style={{ width: `${totalDuration * timeScale}px` }}
          >
            {/* Playhead */}
            <div
              className="playhead"
              ref={playheadRef}
              style={{ left: `${playhead * timeScale}px` }}
            ></div>

            {/* New layer drop area */}
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

            {/* Layers */}
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
                    handleDragStart={(e, item) => handleDragStart(e, item, layerIndex)}
                    playingVideoId={playingVideoId}
                    handleVideoSelect={handleVideoSelect}
                    handleEditTextSegment={handleEditTextSegment}
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
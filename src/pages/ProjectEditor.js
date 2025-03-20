import React, { useState, useEffect, useRef } from 'react';
 import { useNavigate, useParams } from 'react-router-dom';
 import axios from 'axios';
 import '../CSS/ProjectEditor.css';
 import TimelineComponent from './TimelineComponent.js';
 import VideoPreview from './VideoPreview';


 const API_BASE_URL = 'http://localhost:8080'; // Define base URL

 const ProjectEditor = () => {
   const [selectedVideo, setSelectedVideo] = useState(null);
   const [videos, setVideos] = useState([]);
   const [uploading, setUploading] = useState(false);
   const [sessionId, setSessionId] = useState(null);
   const [timelineThumbnails, setTimelineThumbnails] = useState([]);
   const [timelineVideos, setTimelineVideos] = useState([]);
   const [totalDuration, setTotalDuration] = useState(0);
   const [canvasDimensions, setCanvasDimensions] = useState({ width: 1080, height: 1920 });
   const [currentTime, setCurrentTime] = useState(0);
   const [layers, setLayers] = useState([[], [], []]); // Pass this to VideoPreview
   const [isPlaying, setIsPlaying] = useState(false);
   // Add this new state to the existing state declarations at the top:
   const [previewHeight, setPreviewHeight] = useState(60); // Default to 60% of the available space
   const [isDraggingHandle, setIsDraggingHandle] = useState(false);


   const navigate = useNavigate();
   const { projectId } = useParams();

   useEffect(() => {
     if (!projectId) {
       navigate('/dashboard');
       return;
     }

     const initializeProject = async () => {
       try {

       await fetchVideos();
         // Start the editing session
         const token = localStorage.getItem('token');
         const sessionResponse = await axios.post(
           `${API_BASE_URL}/projects/${projectId}/session`,
           {},
           {
             headers: { Authorization: `Bearer ${token}` },
           }
         );
         setSessionId(sessionResponse.data);

         // Fetch project details
         const projectResponse = await axios.get(
           `${API_BASE_URL}/projects/${projectId}`,
           {
             headers: { Authorization: `Bearer ${token}` },
           }
         );

         const project = projectResponse.data;

         // Set canvas dimensions from project
         if (project.width && project.height) {
            setCanvasDimensions({ width: project.width, height: project.height });
         }
       } catch (error) {
         console.error('Error initializing project:', error);
         navigate('/dashboard');
       }
     };

     initializeProject();

     const handleBeforeUnload = () => {
         // Handle any cleanup if needed
       };

       window.addEventListener('beforeunload', handleBeforeUnload);
       return () => {
         window.removeEventListener('beforeunload', handleBeforeUnload);
       };
   }, [projectId, navigate]);

   // Fetch timeline data from the backend
     const fetchTimelineData = async () => {
       try {
         const token = localStorage.getItem('token');
         const response = await axios.get(
           `${API_BASE_URL}/projects/${projectId}`,
           {
             params: { sessionId },
             headers: { Authorization: `Bearer ${token}` },
           }
         );

         // Process timeline data
         if (response.data && Array.isArray(response.data)) {
           const formattedTimelineVideos = response.data.map(segment => ({
             ...segment,
             id: `timeline-${segment.videoPath}-${segment.startTime}`,
             displayPath: segment.videoPath.split('/').pop(),
             // Ensure we have thumbnail for timeline videos
             thumbnail: findThumbnailForVideo(segment.videoPath)
           }));

           setTimelineVideos(formattedTimelineVideos);
         }
       } catch (error) {
         console.error('Error fetching timeline data:', error);
       }
     };

    // Helper function to find thumbnail for a video
      const findThumbnailForVideo = (videoPath) => {
        const video = videos.find(v => (v.filePath || v.filename) === videoPath);
        return video?.thumbnail || null;
      };

   // Update thumbnail generation for all videos
   const fetchVideos = async () => {
     try {
       const token = localStorage.getItem('token');
       const response = await axios.get(`${API_BASE_URL}/videos/my-videos`, {
         headers: { Authorization: `Bearer ${token}` },
       });

       // Map the response data to ensure each video has a consistent property name for the file path
       const updatedVideos = response.data.map(video => ({
         ...video,
         // Handle both possible property names that might come from your API
         filePath: video.filePath || video.filename,
         displayPath: video.title || (video.filePath || video.filename).split('/').pop()
       }));

       setVideos(updatedVideos);

       // Generate thumbnails for all videos
       for (const video of updatedVideos) {
         await generateVideoThumbnail(video);
       }
     } catch (error) {
       console.error('Error fetching videos:', error);
     }
   };

   const handleVideoUpload = async (event) => {
     const file = event.target.files[0];
     const formData = new FormData();
     formData.append('file', file);
     formData.append('title', file.name);

     try {
       setUploading(true);
       const token = localStorage.getItem('token');
       const response = await axios.post(`${API_BASE_URL}/videos/upload`, formData, {
         headers: {
           'Content-Type': 'multipart/form-data',
           Authorization: `Bearer ${token}`,
         },
       });
       const newVideo = response.data; // Assuming the response contains the new video data
       if (newVideo) {
         await fetchVideos(); // Refresh the video list
       }
     } catch (error) {
       console.error('Error uploading video:', error);
     } finally {
       setUploading(false);
     }
   };

   const calculateTotalDuration = (videos) => {
     let total = 0;
     videos.forEach(video => {
       if (video.segmentInfo) {
         const start = video.segmentInfo.startTime || 0;
         const end = video.segmentInfo.endTime === -1 ? video.duration : video.segmentInfo.endTime;
         total += (end - start);
       } else {
         total += video.duration;
       }
     });
     console.log(`Total timeline duration: ${total} seconds`);
     setTotalDuration(total);
     return total;
   };

   // Improved timeline thumbnails generation
   const generateTimelineThumbnails = async (videoUrl, duration) => {
     const numberOfThumbnails = 10;
     const interval = duration / numberOfThumbnails;
     const thumbnails = [];

     try {
       const video = document.createElement('video');
       video.crossOrigin = "anonymous";
       video.src = videoUrl;

       // Wait for video to be ready
       await new Promise((resolve) => {
         video.onloadeddata = resolve;
         video.onerror = resolve; // Continue even if error
       });

       for (let i = 0; i < numberOfThumbnails; i++) {
         const time = i * interval;

         // Seek to the time
         video.currentTime = time;

         // Wait for the frame to be loaded
         await new Promise(resolve => {
           const seekListener = () => {
             // Create a canvas to draw the thumbnail
             const canvas = document.createElement('canvas');
             canvas.width = 120;
             canvas.height = 80;
             const ctx = canvas.getContext('2d');
             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

             try {
               const thumbnailDataUrl = canvas.toDataURL('image/jpeg');
               thumbnails.push(thumbnailDataUrl);
             } catch (error) {
               console.error("Error creating thumbnail:", error);
               thumbnails.push(''); // Push empty string as fallback
             }

             video.removeEventListener('seeked', seekListener);
             resolve();
           };

           video.addEventListener('seeked', seekListener, { once: true });
         });
       }
     } catch (error) {
       console.error("Error generating timeline thumbnails:", error);
     }

     setTimelineThumbnails(thumbnails);
   };

   // Improved video thumbnail generation
   const generateVideoThumbnail = async (video) => {
     if (!video || (!video.filePath && !video.filename)) return;

     // Skip if video already has thumbnail
     if (video.thumbnail) return;

     // Fix potential double path issue
     let path = video.filePath || video.filename;
     if (path.startsWith('videos/')) {
       path = path.substring(7); // Remove 'videos/' prefix
     }

     const videoUrl = `${API_BASE_URL}/videos/${encodeURIComponent(path)}`;

     try {
       const videoElement = document.createElement('video');
       videoElement.crossOrigin = "anonymous";
       videoElement.src = videoUrl;

       // Create a promise to handle video loading
       await new Promise((resolve, reject) => {
         videoElement.onloadeddata = resolve;
         videoElement.onerror = reject;

         // Set a timeout to avoid hanging indefinitely
         setTimeout(resolve, 5000);
       });

       // Seek to a point in the video (1 second or 25% in)
       const seekTime = Math.min(1, (video.duration || 0) * 0.25);
       videoElement.currentTime = seekTime;

       // Wait for the seek to complete
       await new Promise(resolve => {
         videoElement.onseeked = resolve;

         // Set a timeout to avoid hanging
         setTimeout(resolve, 2000);
       });

       // Create canvas and thumbnail
       const canvas = document.createElement('canvas');
       canvas.width = 120;
       canvas.height = 80;
       const ctx = canvas.getContext('2d');
       ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

       const thumbnail = canvas.toDataURL('image/jpeg');

       // Update the video object with the thumbnail
       video.thumbnail = thumbnail;

       setVideos(prevVideos =>
         prevVideos.map(v =>
           (v.filePath || v.filename) === (video.filePath || video.filename) ? { ...v, thumbnail } : v
         )
       );

       // Also update timeline videos with thumbnails
       setTimelineVideos(prevVideos =>
         prevVideos.map(v =>
           (v.filePath || v.filename) === (video.filePath || video.filename) ? { ...v, thumbnail } : v
         )
       );
     } catch (error) {
       console.error("Error creating thumbnail for video:", path, error);
     }
   };

   // Add these functions to your ProjectEditor.js component
   const handleSaveProject = async () => {
     if (!projectId || !sessionId) return;

     try {
       const token = localStorage.getItem('token');
       await axios.post(
         `${API_BASE_URL}/projects/${projectId}/save`,
         {},
         {
           params: { sessionId },
           headers: { Authorization: `Bearer ${token}` }
         }
       );

       await fetchTimelineData();

       alert('Project saved successfully!');
     } catch (error) {
       console.error('Error saving project:', error);
       alert('Failed to save project. Please try again.');
     }
   };

   const handleExportProject = async () => {
     if (!projectId || !sessionId) return;

     try {
       const token = localStorage.getItem('token');
       const response = await axios.post(
         `${API_BASE_URL}/projects/${projectId}/export`,
         {},
         {
           params: { sessionId },
           headers: { Authorization: `Bearer ${token}` }
         }
       );

       const exportedFileName = response.data;
       alert(`Project exported successfully as ${exportedFileName}!`);

       // Optionally, provide a download link
       // window.location.href = `${API_BASE_URL}/downloads/${exportedFileName}`;
     } catch (error) {
       console.error('Error exporting project:', error);
       alert('Failed to export project. Please try again.');
     }
   };

   // Handle dragging from media library
   const handleMediaDragStart = (e, video) => {
     // Generate a unique ID if the video doesn't have one
     const videoId = video.id || `media-${video.filePath || video.filename}-${Date.now()}`;

     // Create a data object with all necessary properties
     const dragData = {
       type: 'media',
       video: {
         id: videoId,
         filePath: video.filePath || video.filename,
         displayPath: video.displayPath || (video.filePath || video.filename).split('/').pop(),
         duration: video.duration || 0,
         thumbnail: video.thumbnail || ''
       }
     };

     // Set the data for the drag operation
     // Stringify the drag data
     const jsonString = JSON.stringify(dragData);

     // Log the data being set
     console.log('Setting drag data:', jsonString);

     // Set the data in multiple formats to ensure compatibility
     e.dataTransfer.setData('application/json', jsonString);
     e.dataTransfer.setData('text/plain', jsonString);

     // Add visual feedback
     e.currentTarget.classList.add('dragging');

     // Set effectAllowed to indicate this is a copy or move operation
     e.dataTransfer.effectAllowed = 'copyMove';
   };

   // Handle clicking on a video in the media library
   const handleVideoClick = async (video) => {
     if (!sessionId || !projectId) return;

     setSelectedVideo(video);

     try {
       // Fetch the current timeline data to ensure we have the latest state
       const token = localStorage.getItem('token');
       const response = await axios.get(
         `${API_BASE_URL}/projects/${projectId}`,
         {
           params: { sessionId },
           headers: { Authorization: `Bearer ${token}` },
         }
       );

       // Get the timeline state from the response
       let timelineState;
       if (response.data && response.data.timelineState) {
         try {
           timelineState = typeof response.data.timelineState === 'string'
             ? JSON.parse(response.data.timelineState)
             : response.data.timelineState;
         } catch (e) {
           console.error("Failed to parse timeline state:", e);
           timelineState = { segments: [] };
         }
       } else {
         timelineState = { segments: [] };
       }

       // Calculate the end time of layer 0
       let endTime = 0;
       if (timelineState.segments && timelineState.segments.length > 0) {
         const layer0Segments = timelineState.segments.filter(seg => seg.layer === 0);

         layer0Segments.forEach(segment => {
           const segmentEndTime = segment.timelineStartTime + (segment.endTime - segment.startTime);
           if (segmentEndTime > endTime) {
             endTime = segmentEndTime;
           }
         });
       }

       console.log(`Adding video to layer 0 at time: ${endTime}s`);

       // Add the video to the end of layer 0
       await addVideoToTimeline(
         video.filePath || video.filename,
         0, // Layer 0
         endTime, // Add at the end of layer 0
         null // Use entire video duration
       );

       // Immediately update the UI by updating local state
       // Create a new timeline video object
       const newTimelineVideo = {
         ...video,
         id: `timeline-${video.filePath || video.filename}-${Date.now()}`,
         startTime: endTime,
         duration: video.duration || 0,
         layer: 0,
         // Add these missing properties needed for timeline display
         videoPath: video.filePath || video.filename,
         displayPath: video.displayPath || (video.filePath || video.filename).split('/').pop(),
         timelineStartTime: endTime
       };

       // Update the timeline videos state
       setTimelineVideos(prev => [...prev, newTimelineVideo]);

       // Refresh the timeline
       await fetchTimelineData();
     } catch (error) {
       console.error('Error adding video to timeline:', error);
     }
   };

   // Add video to timeline function
   const addVideoToTimeline = async (videoPath, layer, timelineStartTime, timelineEndTime) => {
     try {
       const token = localStorage.getItem('token');
       await axios.post(
         `${API_BASE_URL}/projects/${projectId}/add-to-timeline`,
         {
           videoPath,
           layer,
           timelineStartTime,
           timelineEndTime
         },
         {
           params: { sessionId },
           headers: { Authorization: `Bearer ${token}` }
         }
       );

       console.log(`Added video ${videoPath} to layer ${layer} at ${timelineStartTime}s`);

       await fetchTimelineData();

     } catch (error) {
       console.error('Error adding video to timeline:', error);
       throw error;
     }
   };

   // Add this useEffect to convert timeline videos into layers format for VideoPreview
   useEffect(() => {
     if (timelineVideos.length > 0) {
       // Convert timelineVideos into the layers format expected by VideoPreview
       const newLayers = [[], [], []]; // 3 layers as initialized in your state

       timelineVideos.forEach(video => {
         const layerIndex = video.layer || 0; // Default to layer 0 if not specified

         if (layerIndex < newLayers.length) {
           newLayers[layerIndex].push({
             id: video.id,
             type: 'video',
             startTime: video.timelineStartTime || 0,
             duration: video.duration || 0,
             filePath: video.videoPath || video.filePath || video.filename,
             // Add these properties for consistency
             layer: layerIndex,
             endTime: (video.timelineStartTime || 0) + (video.duration || 0)
           });
         }
       });

       setLayers(newLayers);
     }
   }, [timelineVideos]);

   // Add this function to handle time updates from timeline
   const handleTimelinePositionChange = (newTime) => {
     setCurrentTime(newTime);
     // If playing, pause when manually seeking
     if (isPlaying && newTime !== currentTime + (1/30)) { // Small delta for normal playback
       setIsPlaying(false);
     }
   };

   // Add this useEffect for keyboard shortcuts
   useEffect(() => {
     const handleKeyDown = (e) => {
       // Space bar toggles play/pause
       if (e.key === ' ' || e.code === 'Space') {
         e.preventDefault(); // Prevent page scrolling
         setIsPlaying(prev => !prev);
       }

       // Left/right arrows for frame-by-frame navigation (when paused)
       if (!isPlaying) {
         if (e.key === 'ArrowLeft') {
           setCurrentTime(time => Math.max(0, time - 1/30)); // Back 1 frame (assuming 30fps)
         } else if (e.key === 'ArrowRight') {
           setCurrentTime(time => Math.min(totalDuration, time + 1/30)); // Forward 1 frame
         }
       }
     };

     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isPlaying, totalDuration]);

   // Add this effect to handle stopping at the end of timeline
   useEffect(() => {
     if (isPlaying && currentTime >= totalDuration) {
       setIsPlaying(false);
       setCurrentTime(totalDuration);
     }
   }, [currentTime, isPlaying, totalDuration]);

   // Handle the start of resize
   const handleResizeStart = (e) => {
     e.preventDefault();
     setIsDraggingHandle(true);
     document.addEventListener('mousemove', handleResize);
     document.addEventListener('mouseup', handleResizeEnd);
   };

   // Handle resizing while dragging
   const handleResize = (e) => {
     if (!isDraggingHandle) return;

     const mainContentHeight = document.querySelector('.main-content').clientHeight;
     const minPreviewHeight = 20; // Minimum 20% for preview
     const maxPreviewHeight = 80; // Maximum 80% for preview (ensures min timeline height)

     // Calculate new preview height as percentage of container
     const mouseY = e.clientY;
     const containerTop = document.querySelector('.main-content').getBoundingClientRect().top;
     const newHeightPercent = ((mouseY - containerTop) / mainContentHeight) * 100;

     // Apply constraints
     const clampedHeight = Math.max(minPreviewHeight, Math.min(maxPreviewHeight, newHeightPercent));
     setPreviewHeight(clampedHeight);
   };

   // Handle end of resize
   const handleResizeEnd = () => {
     setIsDraggingHandle(false);
     document.removeEventListener('mousemove', handleResize);
     document.removeEventListener('mouseup', handleResizeEnd);
   };

   // Clean up event listeners when component unmounts
   useEffect(() => {
     return () => {
       document.removeEventListener('mousemove', handleResize);
       document.removeEventListener('mouseup', handleResizeEnd);
     };
   }, [isDraggingHandle]);

   // Add a useEffect to calculate the total duration of timeline content
   useEffect(() => {
     if (timelineVideos.length > 0) {
       calculateTotalDuration(timelineVideos);
     }
   }, [timelineVideos]);

   return (
     <div className="project-editor">
       {/* Sidebar */}
       <aside className="sidebar">
         <h2>Media Library</h2>
         <input
           type="file"
           accept="video/*"
           onChange={handleVideoUpload}
           id="upload-video"
           className="hidden-input"
         />
         <label
           htmlFor="upload-video"
           className="upload-button"

         >
           {uploading ? 'Uploading...' : 'Upload Video'}
         </label>

         <div className="video-list">
           {videos.map((video) => (
             <div
               key={video.id || video.filePath || video.filename}
               className={`video-item ${
                 selectedVideo?.id === video.id ? 'selected' : ''
               }`}
               draggable={true}
               onDragStart={(e) => handleMediaDragStart(e, video)}
               onClick={() => handleVideoClick(video)}
             >
               {video.thumbnail ? (
                 <div
                   className="video-thumbnail"
                   style={{
                     backgroundImage: `url(${video.thumbnail})`,
                     height: '130px',
                     backgroundSize: 'cover',
                     backgroundPosition: 'center',
                     borderRadius: '4px'
                   }}
                 ></div>
               ) : (
                 <div className="video-thumbnail-placeholder" style={{width: '120px', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '4px'}}></div>
               )}
               <div className="video-title">{video.title || video.displayPath}</div>
             </div>
           ))}
         </div>
       </aside>

       {/* Main content area - will contain both controls and timeline */}
       <div className="main-content">

         <div className="preview-panel" style={{ height: `${previewHeight}%` }}>
           <VideoPreview
             layers={layers}
             currentTime={currentTime}
             isPlaying={isPlaying} // You'll need to add state for this
             canvasDimensions={canvasDimensions}
             onTimeUpdate={setCurrentTime}
           />
         </div>

         {/* Resize handle */}
         <div
           className={`resize-handle ${isDraggingHandle ? 'dragging' : ''}`}
           style={{ top: `${previewHeight}%` }}
           onMouseDown={handleResizeStart}
         ></div>

         {/* Add new controls panel here */}
         <div className="controls-panel">
           <button className="control-button" onClick={handleSaveProject}>Save Project</button>
           <button className="control-button" onClick={handleExportProject}>Export Video</button>
           {/* Add play/pause controls */}
           <button
             className="control-button"
             onClick={() => setIsPlaying(prev => !prev)}
           >
             {isPlaying ? 'Pause' : 'Play'}
           </button>
         </div>

         {/* Timeline wrapper */}
         <div className="timeline-wrapper" style={{ height: `calc(100% - ${previewHeight}% - 60px)` }}>
           {sessionId && (
             <TimelineComponent
               videos={videos}
               sessionId={sessionId}
               projectId={projectId}
               totalDuration={totalDuration}
               setTotalDuration={setTotalDuration}
               currentTime={currentTime} // Add this prop
               onPositionChange={handleTimelinePositionChange} // Add this handler
               onVideoSelect={(time, video) => {
                   setCurrentTime(time);
                   setSelectedVideo(video);
                 }}
               canvasDimensions={canvasDimensions}
               addVideoToTimeline={addVideoToTimeline}
               isPlaying={isPlaying} // Add this prop
             />
           )}
         </div>
       </div>
     </div>
   );
 };

 export default ProjectEditor;






//import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { Scissors, Merge, Save, Play, Pause, Undo, Redo } from 'lucide-react';
// import axios from 'axios';
// import '../CSS/ProjectEditor.css';
//
//
// const API_BASE_URL = 'http://localhost:8080'; // Define base URL
//
// const ProjectEditor = () => {
//   const [selectedVideo, setSelectedVideo] = useState(null);
//   const [videos, setVideos] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const [splitMode, setSplitMode] = useState(false);
//   const [mergeMode, setMergeMode] = useState(false);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [videoSource, setVideoSource] = useState(null);
//   const [sessionId, setSessionId] = useState(null);
//   const [selectedClips, setSelectedClips] = useState([]);
//   const [projectHistory, setProjectHistory] = useState([]);
//   const [historyIndex, setHistoryIndex] = useState(-1);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [timelineThumbnails, setTimelineThumbnails] = useState([]);
//   const [videoDimensions, setVideoDimensions] = useState({ width: '100%', height: 'auto' });
//   const [timelineVideos, setTimelineVideos] = useState([]);
//   const [isSaving, setIsSaving] = useState(false);
//   const [splitPoint, setSplitPoint] = useState(null);
//   const [totalDuration, setTotalDuration] = useState(0);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [timelinePosition, setTimelinePosition] = useState(0);
//   const [timelineScale, setTimelineScale] = useState(10);
//   const [canvasDimensions, setCanvasDimensions] = useState({ width: 1080, height: 1920 });
//   const [selectedText, setSelectedText] = useState(null);
//   const [textSegments, setTextSegments] = useState([]);
//   const [dragStartPos, setDragStartPos] = useState(null);
//   const [draggingText, setDraggingText] = useState(null);
//   const [text, setText] = useState(null);
//   const [layers, setLayers] = useState([[], []]); // Initialize with two layers
//
//   const navigate = useNavigate();
//   const { projectId } = useParams();
//   const videoRef = useRef(null);
//   const timelineRef = useRef(null);
//   const videoPlayerContainerRef = useRef(null);
//
//   useEffect(() => {
//     const updateTimelinePosition = () => {
//       if (videoRef.current && timelineVideos.length > 0) {
//         // Find the current video index
//         const currentIndex = timelineVideos.findIndex(
//           v => v.segmentInfo?.id === selectedVideo?.segmentInfo?.id
//         );
//
//         if (currentIndex !== -1) {
//           // Calculate accumulated duration before the current video
//           let accumulatedDuration = 0;
//           for (let i = 0; i < currentIndex; i++) {
//             const video = timelineVideos[i];
//             const segmentDuration = video.segmentInfo
//               ? (video.segmentInfo.endTime !== -1 ? video.segmentInfo.endTime : video.duration) - (video.segmentInfo.startTime || 0)
//               : (video.duration || 0);
//             accumulatedDuration += segmentDuration;
//           }
//
//           // Calculate current position within the current video
//           const segmentStartTime = selectedVideo.segmentInfo ? (selectedVideo.segmentInfo.startTime || 0) : 0;
//           const currentVideoTime = videoRef.current.currentTime - segmentStartTime;
//
//           // Calculate total position in timeline
//           const totalPosition = accumulatedDuration + currentVideoTime;
//
//           // Calculate the pixel position based on our timelineScale
//           const positionInPixels = totalPosition * timelineScale;
//
//           // Set the playhead pixel position (not percentage)
//           // We need to modify the markerStyle to use pixels instead of percentage
//           setTimelinePosition(positionInPixels);
//
//           // Auto-scroll the timeline to keep the playhead visible if necessary
//           const timelineTrack = timelineRef.current?.querySelector('.timeline-track');
//           if (timelineTrack) {
//             const containerWidth = timelineRef.current.clientWidth;
//             const scrollLeft = timelineTrack.scrollLeft;
//
//             // If playhead is outside the visible area, scroll to it
//             if (positionInPixels < scrollLeft || positionInPixels > scrollLeft + containerWidth - 20) {
//               timelineTrack.scrollLeft = positionInPixels - containerWidth / 2;
//             }
//           }
//         }
//       }
//     };
//
//     const intervalId = setInterval(updateTimelinePosition, 50);
//     return () => clearInterval(intervalId);
//   }, [selectedVideo, timelineVideos, totalDuration, timelineScale]);
//
//      const timelineStyle = {
//       width: '100%',
//       height: '10px',
//       backgroundColor: 'gray',
//       position: 'relative',
//       cursor: 'pointer',
//     };
//
//     const markerStyle = {
//       position: 'absolute',
//       top: 0,
//       left: `${timelinePosition}px`, // Using pixels instead of percentage
//       width: '2px',
//       height: '100%',
//       backgroundColor: 'red',
//       zIndex: 10,
//       pointerEvents: 'none'
//     };
//
//
//   useEffect(() => {
//     if (!projectId) {
//       navigate('/dashboard');
//       return;
//     }
//
//     const initializeProject = async () => {
//       try {
//
//       await fetchVideos();
//         // Start the editing session
//         const token = localStorage.getItem('token');
//         const sessionResponse = await axios.post(
//           `${API_BASE_URL}/projects/${projectId}/session`,
//           {},
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         setSessionId(sessionResponse.data);
//
//         // Fetch project details
//         const projectResponse = await axios.get(
//           `${API_BASE_URL}/projects/${projectId}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//
//         const project = projectResponse.data;
//
//         // Set canvas dimensions from project
//         if (project.width && project.height) {
//            setCanvasDimensions({ width: project.width, height: project.height });
//         }
//
//         // Load the project timeline after videos are fetched
//         await loadProjectTimeline();
//       } catch (error) {
//         console.error('Error initializing project:', error);
//         navigate('/dashboard');
//       }
//     };
//
//     initializeProject();
//
//     const handleBeforeUnload = () => {
//         // Handle any cleanup if needed
//       };
//
//       window.addEventListener('beforeunload', handleBeforeUnload);
//       return () => {
//         window.removeEventListener('beforeunload', handleBeforeUnload);
//       };
//   }, [projectId, navigate]);
//
//   useEffect(() => {
//     if (sessionId) {
//       loadProjectTimeline();
//     }
//   }, [sessionId]);
//
//   // Update thumbnail generation for all videos
//   const fetchVideos = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.get(`${API_BASE_URL}/videos/my-videos`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//
//       // Map the response data to ensure each video has a consistent property name for the file path
//       const updatedVideos = response.data.map(video => ({
//         ...video,
//         // Handle both possible property names that might come from your API
//         filePath: video.filePath || video.filename,
//         displayPath: video.title || (video.filePath || video.filename).split('/').pop()
//       }));
//
//       setVideos(updatedVideos);
//
//       // Generate thumbnails for all videos
//       for (const video of updatedVideos) {
//         await generateVideoThumbnail(video);
//       }
//     } catch (error) {
//       console.error('Error fetching videos:', error);
//     }
//   };
//
//   const handleVideoUpload = async (event) => {
//     const file = event.target.files[0];
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('title', file.name);
//
//     try {
//       setUploading(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.post(`${API_BASE_URL}/videos/upload`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const newVideo = response.data; // Assuming the response contains the new video data
//       if (newVideo) {
//         await fetchVideos(); // Refresh the video list
//       }
//     } catch (error) {
//       console.error('Error uploading video:', error);
//     } finally {
//       setUploading(false);
//     }
//   };
//
//     const handleSplitVideo = async () => {
//       if (!selectedVideo || !sessionId) {
//         alert("Cannot split: missing video or session");
//         return;
//       }
//
//       // Use current playback position as split point
//       const splitTime = videoRef.current ? videoRef.current.currentTime : null;
//
//       if (splitTime === null) {
//         alert("Please play the video and set a position before splitting");
//         return;
//       }
//
//       // Get the actual split point relative to the segment
//       const segmentStartTime = selectedVideo.segmentInfo ? (selectedVideo.segmentInfo.startTime || 0) : 0;
//       const adjustedSplitPoint = splitTime - segmentStartTime;
//
//       // Validate split point is reasonable (not too close to start or end)
//       const videoDuration = selectedVideo.duration || 300; // Default to 5 mins if unknown
//       const segmentDuration = selectedVideo.segmentInfo && selectedVideo.segmentInfo.endTime !== -1
//         ? selectedVideo.segmentInfo.endTime - segmentStartTime
//         : videoDuration - segmentStartTime;
//
//       if (adjustedSplitPoint < 0.5) {
//         alert("Split point too close to the beginning of the video. Please select a point at least 0.5 seconds in.");
//         return;
//       }
//
//       if (segmentDuration && adjustedSplitPoint > (segmentDuration - 0.5)) {
//         alert("Split point too close to the end of the video. Please select a point at least 0.5 seconds before the end.");
//         return;
//       }
//
//       try {
//         console.log(`Splitting video at ${adjustedSplitPoint} seconds (video duration: ${segmentDuration}s)`);
//         const token = localStorage.getItem('token');
//
//         // Ensure we're using the correct path format for the backend
//         let videoPath = selectedVideo.filePath || selectedVideo.filename;
//         if (videoPath.startsWith('videos/')) {
//           videoPath = videoPath.substring(7);
//         }
//
//         if (!selectedVideo.segmentInfo || !selectedVideo.segmentInfo.id) {
//           alert("Missing segment information. Cannot split this video.");
//           return;
//         }
//
//         const segmentId = selectedVideo.segmentInfo.id;
//
//         console.log("Selected video for splitting:", selectedVideo);
//         console.log("Video path being sent to backend:", videoPath);
//         console.log("Segment ID being sent to backend:", segmentId);
//         console.log("Split point being sent:", adjustedSplitPoint);
//
//         const response = await axios.post(
//           `${API_BASE_URL}/projects/${projectId}/split`,
//           {
//             videoPath: videoPath,
//             splitTimeSeconds: adjustedSplitPoint,
//             segmentId: segmentId
//           },
//           {
//             headers: { Authorization: `Bearer ${token}` },
//             params: { sessionId }
//           }
//         );
//
//         console.log("Split response:", response.data);
//
//         // Handle success response here
//         alert("Video split successfully!");
//
//         // Save the project first
//         await handleSaveProject();
//
//         // Then refresh the video library
//         await fetchVideos();
//
//         // Finally reload the timeline with the new segments
//         await loadProjectTimeline();
//
//         // Clear split mode
//         setSplitMode(false);
//       } catch (error) {
//         console.error('Error splitting video:', error);
//
//         // Enhanced error reporting
//         let errorMessage = "Failed to split video. ";
//
//         if (error.response) {
//           const status = error.response.status;
//           const data = error.response.data;
//
//           console.error('Server response status:', status);
//           console.error('Server response data:', data);
//
//           if (typeof data === 'string') {
//             errorMessage += data;
//           } else if (data && data.message) {
//             errorMessage += data.message;
//           } else {
//             errorMessage += `Server error (${status})`;
//           }
//         } else if (error.request) {
//           errorMessage += "No response received from server. Check your network connection.";
//         } else {
//           errorMessage += error.message || "Unknown error occurred";
//         }
//
//         alert(errorMessage);
//       }
//     };
//
//
//
//
//   const handleAddToTimeline = async (video) => {
//     if (!sessionId || !video) return;
//
//     try {
//       const token = localStorage.getItem('token');
//
//       // Make sure we use the correct path
//       let videoPath = video.filePath || video.filename;
//
//       if (videoPath.startsWith('videos/')) {
//             videoPath = videoPath.substring(7);
//           }
//
//       // Calculate initial position to center the segment on the canvas
//       const initialPositionX = (canvasDimensions.width - video.videoWidth) / 2;
//       const initialPositionY = (canvasDimensions.height - video.videoHeight) / 2;
//
//       await axios.post(
//         `${API_BASE_URL}/projects/${projectId}/add-to-timeline`,
//         { videoPath, positionX: initialPositionX, positionY: initialPositionY, scale: 1.0 },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { sessionId }
//         }
//       );
//
//       // Update timeline videos
//       const updatedVideos = [...timelineVideos, video];
//       setTimelineVideos(updatedVideos);
//
//       // Update total duration
//       calculateTotalDuration(updatedVideos);
//
//       // Add to history
//       const newHistory = projectHistory.slice(0, historyIndex + 1);
//       newHistory.push({ type: 'add', video });
//       setProjectHistory(newHistory);
//       setHistoryIndex(newHistory.length - 1);
//
//       // Always save project after adding video to timeline
//       await handleSaveProject();
//
//       // Immediately load the timeline again to ensure consistency
//       await loadProjectTimeline();
//     } catch (error) {
//       console.error('Error adding video to timeline:', error);
//     }
//   };
//
//   const calculateTotalDuration = (videos) => {
//     let total = 0;
//     videos.forEach(video => {
//       if (video.segmentInfo) {
//         const start = video.segmentInfo.startTime || 0;
//         const end = video.segmentInfo.endTime === -1 ? video.duration : video.segmentInfo.endTime;
//         total += (end - start);
//       } else {
//         total += video.duration;
//       }
//     });
//     console.log(`Total timeline duration: ${total} seconds`);
//     setTotalDuration(total);
//     return total;
//   };
//
//   const handleUndo = async () => {
//     if (historyIndex > -1) {
//       setHistoryIndex(historyIndex - 1);
//       // Implement state reverting
//       await handleSaveProject();
//       await loadProjectTimeline();
//     }
//   };
//
//   const handleRedo = async () => {
//     if (historyIndex < projectHistory.length - 1) {
//       setHistoryIndex(historyIndex + 1);
//       // Implement state applying
//       await handleSaveProject();
//       await loadProjectTimeline();
//     }
//   };
//
//   const handleSaveProject = async () => {
//     if (!sessionId) {
//       console.log("No session found!");
//       return;
//     };
//
//     try {
//       setIsSaving(true);
//       const token = localStorage.getItem('token');
//       await axios.post(
//         `${API_BASE_URL}/projects/${projectId}/save`,
//         {},
//         {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { sessionId }
//         }
//       );
//       console.log("Project saved successfully!");
//     } catch (error) {
//       console.error('Error saving project:', error);
//       alert("Failed to save project. Please try again.");
//     } finally {
//       setIsSaving(false);
//     }
//   };
//
//   // Handle video selection
//   const handleVideoSelect = async (video, addToTimeline = false) => {
//     if (!video) {
//       console.error('Invalid video object:', video);
//       return;
//     }
//
//     let videoFileName = video.filePath || video.filename;
//
//     if (!videoFileName) {
//       console.error('Video has no file path:', video);
//       return;
//     }
//
//     setSelectedVideo(video);
//     let path = videoFileName;
//     if (path.startsWith('videos/')) {
//       path = path.substring(7); // Remove 'videos/' prefix
//     }
//
//     const videoUrl = `${API_BASE_URL}/videos/${encodeURIComponent(path)}`;
//     console.log('Loading video from URL:', videoUrl);
//     setVideoSource(videoUrl);
//
//     try {
//       const videoElement = document.createElement("video");
//       videoElement.crossOrigin = "anonymous"; // Add if needed for CORS
//
//       // Create a promise to handle video metadata loading
//       const loadMetadata = new Promise((resolve, reject) => {
//         videoElement.onloadedmetadata = () => {
//           // Set video player dimensions
//           setVideoDimensions({ width: videoElement.videoWidth, height: videoElement.videoHeight });
//
//           // Store duration with the video object
//           if (video && !video.duration) {
//             video.duration = videoElement.duration;
//             if (timelineVideos.length > 0) {
//               calculateTotalDuration(timelineVideos);
//             }
//           }
//
//           resolve(videoElement.duration);
//         };
//         videoElement.onerror = (error) => reject(error);
//       });
//
//       videoElement.src = videoUrl;
//
//       // Wait for metadata to load
//       const duration = await loadMetadata;
//       setVideoDuration(duration);
//
//       // Update video player
//       if (videoRef.current) {
//         videoRef.current.src = videoUrl;
//         videoRef.current.load();
//
//         if (video.segmentInfo && video.segmentInfo.startTime !== undefined) {
//                 videoRef.current.addEventListener('loadedmetadata', () => {
//                   videoRef.current.currentTime = video.segmentInfo.startTime || 0;
//                 }, { once: true });
//               }
//       }
//
//       generateTimelineThumbnails(videoUrl, duration);
//
//       if (addToTimeline && sessionId) {
//         await handleAddToTimeline(video);
//       }
//
//     } catch (error) {
//       console.error("Error loading video:", error);
//       setVideoSource(null);
//       setVideoDuration(0);
//       alert("Failed to load video. Please try again.");
//     }
//   };
//
//   const playTimelineVideos = async () => {
//     if (timelineVideos.length === 0) return;
//
//     if (isPlaying) {
//       if (videoRef.current) {
//         videoRef.current.pause();
//         setIsPlaying(false);
//       }
//       return;
//     }
//
//     // Play the selected video first, or the first video in timeline if none selected
//     let currentVideoIndex = 0;
//     if (selectedVideo) {
//       currentVideoIndex = timelineVideos.findIndex(
//         v => (v.filePath || v.filename) === (selectedVideo.filePath || selectedVideo.filename) &&
//         v.segmentInfo?.startTime === selectedVideo.segmentInfo?.startTime &&
//         v.segmentInfo?.endTime === selectedVideo.segmentInfo?.endTime
//       );
//
//       if (currentVideoIndex === -1) currentVideoIndex = 0;
//     }
//
//     await handleVideoSelect(timelineVideos[currentVideoIndex], false);
//
//     if (timelineVideos[currentVideoIndex].segmentInfo && videoRef.current) {
//       videoRef.current.currentTime = timelineVideos[currentVideoIndex].segmentInfo.startTime || 0;
//     }
//
//     if (videoRef.current) {
//       videoRef.current.play();
//       setIsPlaying(true);
//     }
//   };
//
//   const loadProjectTimeline = async () => {
//     if (!projectId || !sessionId) return;
//
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.get(
//         `${API_BASE_URL}/projects/${projectId}`,
//         {
//           headers: { Authorization: `Bearer ${token}` }
//         }
//       );
//
//       const project = response.data;
//       if (project && project.timelineState) {
//         let timelineState;
//         try {
//           timelineState = typeof project.timelineState === 'string'
//             ? JSON.parse(project.timelineState)
//             : project.timelineState;
//
//           console.log("Loaded timeline state:", timelineState);
//         } catch (e) {
//           console.error("Failed to parse timeline state:", e);
//           return;
//         }
//
//         // Load timeline videos
//         if (timelineState.segments && timelineState.segments.length > 0) {
//           const loadedVideos = [];
//
//           for (const segment of timelineState.segments) {
//             // Find the corresponding video in your videos array
//             let videoFileName = segment.sourceVideoPath;
//             // Normalize paths by removing 'videos/' prefix if it exists
//             const normalizedVideoPath = videoFileName.startsWith('videos/')
//               ? videoFileName.substring(7)
//               : videoFileName;
//
//                       // Try to find the video with both versions of the path
//                       let video = videos.find(v => {
//                         const vPath = (v.filePath || v.filename);
//                         const normalizedVPath = vPath.startsWith('videos/') ? vPath.substring(7) : vPath;
//                         return normalizedVPath === normalizedVideoPath;
//                       });
//
//             if (!video && videos.length === 0) {
//                         // This could happen if videos haven't been loaded yet
//                         await fetchVideos();
//                         video = videos.find(v => {
//                           const vPath = v.filePath || v.filename;
//                           return vPath === videoFileName || vPath === normalizedVideoPath;
//                         });
//                       }
//
//             if (video) {
//                         // Create a deep copy of the video to prevent reference issues
//                         const videoWithSegment = {
//                           ...JSON.parse(JSON.stringify(video)),
//                           segmentInfo: {
//                             startTime: segment.startTime,
//                             endTime: segment.endTime,
//                             id: segment.id
//                           }
//                         };
//                         if (!videoWithSegment.duration) {
//                           try {
//                             const encodedFilename = encodeURIComponent(videoWithSegment.filename);
//                             const durationResponse = await axios.get(
//                               `${API_BASE_URL}/videos/duration/${encodedFilename}`, // API call
//                               {
//                                 headers: { Authorization: `Bearer ${token}` }
//                               }
//                             );
//                             videoWithSegment.duration = durationResponse.data;
//                           } catch (error) {
//                             console.error('Error fetching video duration:', error);
//                             // Handle error, e.g., set a default duration
//                             videoWithSegment.duration = 300; // 5 minutes default
//                           }
//                         }
//               // Generate thumbnails for this video if not already done
//               await generateVideoThumbnail(videoWithSegment);
//
//               loadedVideos.push(videoWithSegment);
//             } else {
//                           console.error(`Could not find video for path: ${videoFileName}`);
//                         }
//           }
//
//           setTimelineVideos(loadedVideos);
//           calculateTotalDuration(loadedVideos);
//
//           // If we have videos, select the first one
//           if (loadedVideos.length > 0 && !selectedVideo) {
//             await handleVideoSelect(loadedVideos[0], false);
//           }
//         } else {
//           console.log("No segments found in timeline state");
//         }
//
//         // Add this code to load text segments
//         if (timelineState.textSegments && timelineState.textSegments.length > 0) {
//            setTextSegments(timelineState.textSegments);
//         }
//       }
//     } catch (error) {
//       console.error('Error loading project timeline:', error);
//     }
//   };
//
//   // Improved timeline thumbnails generation
//   const generateTimelineThumbnails = async (videoUrl, duration) => {
//     const numberOfThumbnails = 10;
//     const interval = duration / numberOfThumbnails;
//     const thumbnails = [];
//
//     try {
//       const video = document.createElement('video');
//       video.crossOrigin = "anonymous";
//       video.src = videoUrl;
//
//       // Wait for video to be ready
//       await new Promise((resolve) => {
//         video.onloadeddata = resolve;
//         video.onerror = resolve; // Continue even if error
//       });
//
//       for (let i = 0; i < numberOfThumbnails; i++) {
//         const time = i * interval;
//
//         // Seek to the time
//         video.currentTime = time;
//
//         // Wait for the frame to be loaded
//         await new Promise(resolve => {
//           const seekListener = () => {
//             // Create a canvas to draw the thumbnail
//             const canvas = document.createElement('canvas');
//             canvas.width = 120;
//             canvas.height = 80;
//             const ctx = canvas.getContext('2d');
//             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//
//             try {
//               const thumbnailDataUrl = canvas.toDataURL('image/jpeg');
//               thumbnails.push(thumbnailDataUrl);
//             } catch (error) {
//               console.error("Error creating thumbnail:", error);
//               thumbnails.push(''); // Push empty string as fallback
//             }
//
//             video.removeEventListener('seeked', seekListener);
//             resolve();
//           };
//
//           video.addEventListener('seeked', seekListener, { once: true });
//         });
//       }
//     } catch (error) {
//       console.error("Error generating timeline thumbnails:", error);
//     }
//
//     setTimelineThumbnails(thumbnails);
//   };
//
//   // Improved video thumbnail generation
//   const generateVideoThumbnail = async (video) => {
//     if (!video || (!video.filePath && !video.filename)) return;
//
//     // Skip if video already has thumbnail
//     if (video.thumbnail) return;
//
//     // Fix potential double path issue
//     let path = video.filePath || video.filename;
//     if (path.startsWith('videos/')) {
//       path = path.substring(7); // Remove 'videos/' prefix
//     }
//
//     const videoUrl = `${API_BASE_URL}/videos/${encodeURIComponent(path)}`;
//
//     try {
//       const videoElement = document.createElement('video');
//       videoElement.crossOrigin = "anonymous";
//       videoElement.src = videoUrl;
//
//       // Create a promise to handle video loading
//       await new Promise((resolve, reject) => {
//         videoElement.onloadeddata = resolve;
//         videoElement.onerror = reject;
//
//         // Set a timeout to avoid hanging indefinitely
//         setTimeout(resolve, 5000);
//       });
//
//       // Seek to a point in the video (1 second or 25% in)
//       const seekTime = Math.min(1, (video.duration || 0) * 0.25);
//       videoElement.currentTime = seekTime;
//
//       // Wait for the seek to complete
//       await new Promise(resolve => {
//         videoElement.onseeked = resolve;
//
//         // Set a timeout to avoid hanging
//         setTimeout(resolve, 2000);
//       });
//
//       // Create canvas and thumbnail
//       const canvas = document.createElement('canvas');
//       canvas.width = 120;
//       canvas.height = 80;
//       const ctx = canvas.getContext('2d');
//       ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
//
//       const thumbnail = canvas.toDataURL('image/jpeg');
//
//       // Update the video object with the thumbnail
//       video.thumbnail = thumbnail;
//
//       setVideos(prevVideos =>
//         prevVideos.map(v =>
//           (v.filePath || v.filename) === (video.filePath || video.filename) ? { ...v, thumbnail } : v
//         )
//       );
//
//       // Also update timeline videos with thumbnails
//       setTimelineVideos(prevVideos =>
//         prevVideos.map(v =>
//           (v.filePath || v.filename) === (video.filePath || video.filename) ? { ...v, thumbnail } : v
//         )
//       );
//     } catch (error) {
//       console.error("Error creating thumbnail for video:", path, error);
//     }
//   };
//
//   // Custom video player controls
//   const togglePlay = () => {
//     if (videoRef.current) {
//       if (videoRef.current.paused || videoRef.current.ended) {
//         videoRef.current.play();
//         setIsPlaying(true);
//       } else {
//         videoRef.current.pause();
//         setIsPlaying(false);
//       }
//     }
//   };
//
//   const toggleFullscreen = () => {
//     if (!videoPlayerContainerRef.current) return;
//
//     if (!document.fullscreenElement) {
//       videoPlayerContainerRef.current.requestFullscreen().catch(err => {
//         console.error(`Error attempting to enable full-screen mode: ${err.message}`);
//       });
//       setIsFullscreen(true);
//     } else {
//       document.exitFullscreen();
//       setIsFullscreen(false);
//     }
//   };
//
//   useEffect(() => {
//     const handleFullscreenChange = () => {
//       setIsFullscreen(!!document.fullscreenElement);
//     };
//
//     document.addEventListener('fullscreenchange', handleFullscreenChange);
//     return () => {
//       document.removeEventListener('fullscreenchange', handleFullscreenChange);
//     };
//   }, []);
//
//   // Update the handleTimeUpdate function
//   const handleTimeUpdate = () => {
//     if (videoRef.current) {
//       setCurrentTime(videoRef.current.currentTime);
//
//       // Get segment info for the current video if available
//       const segmentStartTime = selectedVideo?.segmentInfo?.startTime || 0;
//       const segmentEndTime = selectedVideo?.segmentInfo?.endTime !== undefined &&
//                             selectedVideo.segmentInfo.endTime !== -1 ?
//                             selectedVideo.segmentInfo.endTime :
//                             selectedVideo?.duration;
//
//           // Preload next video when approaching the end (e.g., 3 seconds before end)
//               if (segmentEndTime && videoRef.current.currentTime >= segmentEndTime - 3) {
//                 preloadNextVideo();
//               }
//
//       // Check if we need to stop at segment end
//       // Check if current time is before segment start time and adjust if needed
//           if (selectedVideo?.segmentInfo && videoRef.current.currentTime < segmentStartTime) {
//             videoRef.current.currentTime = segmentStartTime;
//           }
//
//           // Check if we need to stop at segment end
//           if (selectedVideo?.segmentInfo && videoRef.current.currentTime >= segmentEndTime) {
//             // We've reached the end of the segment
//             const currentIndex = timelineVideos.findIndex(
//               v => v.segmentInfo?.id === selectedVideo?.segmentInfo?.id
//             );
//
//             if (currentIndex !== -1 && currentIndex < timelineVideos.length - 1) {
//               // Play next video in timeline
//               const nextVideo = timelineVideos[currentIndex + 1];
//               console.log("Moving to next timeline video:", nextVideo);
//
//               handleVideoSelect(nextVideo, false).then(() => {
//                         if (videoRef.current) {
//                           // If we have a preloaded element, swap it
//                           if (nextVideo.preloadedElement) {
//                             const preloadedTime = nextVideo.preloadedElement.currentTime;
//                             videoRef.current.src = nextVideo.preloadedElement.src;
//
//                             videoRef.current.addEventListener('loadedmetadata', () => {
//                               videoRef.current.currentTime = preloadedTime;
//                               if (isPlaying) {
//                                 videoRef.current.play();
//                               }
//                             }, { once: true });
//                           } else {
//                             // Fallback to normal loading
//                             if (nextVideo.segmentInfo) {
//                               videoRef.current.currentTime = nextVideo.segmentInfo.startTime || 0;
//                             }
//                             if (isPlaying) {
//                               videoRef.current.play();
//                             }
//                           }
//                         }
//               });
//             } else if (currentIndex === timelineVideos.length - 1) {
//               // End of timeline reached
//               videoRef.current.pause();
//               setIsPlaying(false);
//             }
//           }
//           // Standard end of video check
//           else if (videoRef.current.ended && timelineVideos.length > 1) {
//             const currentIndex = timelineVideos.findIndex(
//               v => (v.filePath || v.filename) === (selectedVideo?.filePath || selectedVideo?.filename) &&
//                    v.segmentInfo?.startTime === selectedVideo?.segmentInfo?.startTime &&
//                    v.segmentInfo?.endTime === selectedVideo?.segmentInfo?.endTime
//             );
//
//             if (currentIndex !== -1 && currentIndex < timelineVideos.length - 1) {
//               // Play next video in timeline
//               handleVideoSelect(timelineVideos[currentIndex + 1], false).then(() => {
//                 if (videoRef.current) {
//                   if (isPlaying) {
//                     videoRef.current.play();
//                   }
//                 }
//               });
//             } else if (currentIndex === timelineVideos.length - 1) {
//               videoRef.current.pause(); // Explicitly pause the video
//               // End of timeline reached
//               setIsPlaying(false);
//             }
//           }
//         }
//       };
//
//   const handleTimelineClick = (e) => {
//     const timelineTrack = timelineRef.current.querySelector('.timeline-track');
//       const timelineRect = timelineTrack.getBoundingClientRect();
//       const clickPosition = e.clientX - timelineRect.left + timelineTrack.scrollLeft;
//
//       const clickTime = clickPosition / timelineScale;
//
//     if (splitMode) {
//         // In split mode, we're working with the current selected video
//         if (selectedVideo) {
//           // Find which segment of the timeline this click is in
//           let accumulatedDuration = 0;
//           let segmentIndex = -1;
//           let segmentDuration = 0; // Ensure it is always defined
//
//           for (let i = 0; i < timelineVideos.length; i++) {
//             const video = timelineVideos[i];
//             const segmentDuration =
//               (video.segmentInfo?.endTime !== -1 ? video.segmentInfo?.endTime : video.duration) -
//               (video.segmentInfo?.startTime || 0);
//
//             if (clickTime >= accumulatedDuration && clickTime < accumulatedDuration + segmentDuration) {
//               segmentIndex = i;
//               break;
//             }
//
//             accumulatedDuration += segmentDuration;
//           }
//
//           if (segmentIndex !== -1) {
//             const video = timelineVideos[segmentIndex];
//             const segmentStartTime = video.segmentInfo?.startTime || 0;
//             const clickTimeInSegment = clickTime - (accumulatedDuration - segmentDuration);
//             const targetTime = segmentStartTime + clickTimeInSegment;
//
//             setSplitPoint(targetTime);
//
//             // Position playhead at split point
//             if (videoRef.current) {
//               videoRef.current.currentTime = targetTime;
//             }
//           }
//         }
//       } else {
//         // In normal mode, find which video this click corresponds to
//         let accumulatedDuration = 0;
//         let targetVideo = null;
//         let targetTime = 0;
//
//         for (const video of timelineVideos) {
//           // Calculate the actual segment duration
//           const segmentDuration =
//             (video.segmentInfo?.endTime !== -1 ? video.segmentInfo?.endTime : video.duration) -
//             (video.segmentInfo?.startTime || 0);
//
//           if (clickTime >= accumulatedDuration && clickTime < accumulatedDuration + segmentDuration) {
//             targetVideo = video;
//             // Calculate the actual time within the video, accounting for segment start time
//             targetTime = (video.segmentInfo?.startTime || 0) + (clickTime - accumulatedDuration);
//             break;
//           }
//
//           accumulatedDuration += segmentDuration;
//         }
//
//         if (targetVideo) {
//           handleVideoSelect(targetVideo, false).then(() => {
//             if (videoRef.current) {
//               videoRef.current.currentTime = targetTime;
//             }
//           });
//         }
//       }
//     };
//
//   const handleExportProject = async () => {
//     if (!sessionId) return;
//
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.post(
//         `${API_BASE_URL}/projects/${projectId}/export`,
//         {},
//         {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { sessionId }
//         }
//       );
//
//       alert(`Project exported successfully! File: ${response.data}`);
//     } catch (error) {
//       console.error('Error exporting project:', error);
//       alert('Failed to export project. Please try again.');
//     }
//   };
//
//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
//   };
//
//   const calculatePlayheadPosition = () => {
//     if (!selectedVideo || timelineVideos.length === 0) return '0%';
//
//     // Find the current video index
//     const currentIndex = timelineVideos.findIndex(
//       v => v.segmentInfo?.id === selectedVideo?.segmentInfo?.id
//     );
//
//     if (currentIndex === -1) return '0%';
//
//     // Calculate accumulated duration before the current video
//     let accumulatedDuration = 0;
//     for (let i = 0; i < currentIndex; i++) {
//       const video = timelineVideos[i];
//       const segmentDuration = video.segmentInfo
//         ? (video.segmentInfo.endTime !== -1 ? video.segmentInfo.endTime : video.duration) - (video.segmentInfo.startTime || 0)
//         : (video.duration || 0);
//       accumulatedDuration += segmentDuration;
//     }
//
//     // Calculate current video's segment start time
//     const segmentStartTime = selectedVideo.segmentInfo ? (selectedVideo.segmentInfo.startTime || 0) : 0;
//
//     // Add the current playback position, adjusted for segment
//     const adjustedCurrentTime = currentTime - segmentStartTime;
//     const totalPosition = accumulatedDuration + adjustedCurrentTime;
//
//     // Calculate percentage along the entire timeline
//     return `${(totalPosition / totalDuration) * 100}%`;
//   };
//
//   // Add this function to preload the next video in the timeline
//   const preloadNextVideo = () => {
//     if (!selectedVideo || timelineVideos.length <= 1) return;
//
//     // Find current video index
//     const currentIndex = timelineVideos.findIndex(
//       v => v.segmentInfo?.id === selectedVideo?.segmentInfo?.id
//     );
//
//     // If there's a next video, preload it
//     if (currentIndex !== -1 && currentIndex < timelineVideos.length - 1) {
//       const nextVideo = timelineVideos[currentIndex + 1];
//       const nextVideoPath = nextVideo.filePath || nextVideo.filename;
//
//       // Create a hidden video element for preloading
//       const preloadVideo = document.createElement('video');
//       preloadVideo.style.display = 'none';
//       preloadVideo.preload = 'auto';
//
//       // Fix path format if needed
//       let path = nextVideoPath;
//       if (path.startsWith('videos/')) {
//         path = path.substring(7);
//       }
//
//       const videoUrl = `${API_BASE_URL}/videos/${encodeURIComponent(path)}`;
//       preloadVideo.src = videoUrl;
//
//       // Seek to the start position if segment info exists
//       preloadVideo.addEventListener('loadedmetadata', () => {
//         if (nextVideo.segmentInfo && nextVideo.segmentInfo.startTime !== undefined) {
//           preloadVideo.currentTime = nextVideo.segmentInfo.startTime || 0;
//         }
//       });
//
//       // Store the preloaded video element for later use
//       nextVideo.preloadedElement = preloadVideo;
//
//       // Add to DOM temporarily for preloading
//       document.body.appendChild(preloadVideo);
//
//       // Remove after preloading
//       preloadVideo.addEventListener('loadeddata', () => {
//         // Keep in memory but remove from DOM
//         document.body.removeChild(preloadVideo);
//       });
//     }
//   };
//
//   const getTotalTimelineDisplay = () => {
//     if (timelineVideos.length === 0) return '0:00 / 0:00';
//
//     // 1. Calculate accumulated time up to the current video
//     let accumulatedTime = 0;
//     let currentIndex = timelineVideos.findIndex(v => v.segmentInfo?.id === selectedVideo?.segmentInfo?.id);
//     if (currentIndex !== -1) {
//       for (let i = 0; i < currentIndex; i++) {
//         const video = timelineVideos[i];
//         const segmentDuration = video.segmentInfo
//           ? (video.segmentInfo.endTime !== -1 ? video.segmentInfo.endTime : video.duration) - (video.segmentInfo.startTime || 0)
//           : (video.duration || 0);
//         accumulatedTime += segmentDuration;
//       }
//     }
//
//     // 2. Add the current video's time (adjust for segment start)
//     const segmentStartTime = selectedVideo?.segmentInfo?.startTime || 0;
//     const totalCurrentTime = accumulatedTime + (currentTime - segmentStartTime);
//
//     // 3. Format the times
//     const formattedCurrentTime = formatTime(totalCurrentTime);
//     const formattedTotalTime = formatTime(totalDuration);
//
//     return `${formattedCurrentTime} / ${formattedTotalTime}`;
//   };
//
//   const zoomInTimeline = () => {
//     setTimelineScale(prev => Math.min(prev * 1.5, 50)); // Increase scale with a maximum limit
//   };
//
//   const zoomOutTimeline = () => {
//     setTimelineScale(prev => Math.max(prev / 1.5, 5)); // Decrease scale with a minimum limit
//   };
//
//   useEffect(() => {
//     if (selectedVideo && videoRef.current) {
//       const segment = selectedVideo.segmentInfo;
//       if (segment) {
//         videoRef.current.style.transform = `translate(${segment.positionX || 0}px, ${
//           segment.positionY || 0
//         }px) scale(${segment.scale || 1})`;
//         videoRef.current.style.transformOrigin = 'top left';
//       } else {
//         videoRef.current.style.transform = 'none'; // Reset transformations if no segment info
//       }
//     }
//   }, [selectedVideo]);
//
//   const calculateVideoTransform = (video, canvasDimensions) => {
//     const scale = video.segmentInfo?.scale || 1;
//     const positionX = video.segmentInfo?.positionX || 0;
//     const positionY = video.segmentInfo?.positionY || 0;
//
//     return {
//       transform: `translate(${positionX}px, ${positionY}px) scale(${scale})`,
//       transformOrigin: 'center',
//     };
//   };
//
//   // Add this function
//   const handleTextEdit = async (updatedTextData) => {
//     if (!selectedText || !sessionId) return;
//
//     try {
//       const token = localStorage.getItem('token');
//
//       await axios.put(
//         `${API_BASE_URL}/projects/${projectId}/update-text`,
//         {
//           segmentId: selectedText.id,
//           ...updatedTextData
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { sessionId }
//         }
//       );
//
//       // Update local state to reflect changes
//       setTextSegments(prev =>
//         prev.map(text =>
//           text.id === selectedText.id
//             ? { ...text, ...updatedTextData }
//             : text
//         )
//       );
//
//       // Save project after edit
//       await handleSaveProject();
//
//     } catch (error) {
//       console.error('Error updating text:', error);
//     }
//   };
//
//   // Add a UI component for text editing
//   const TextEditPanel = () => {
//     if (!selectedText) return null;
//
//     return (
//       <div className="text-edit-panel" style={{
//         padding: '10px',
//         border: '1px solid #ddd',
//         borderRadius: '4px',
//         marginTop: '10px',
//         backgroundColor: '#f9f9f9'
//       }}>
//         <h4>Edit Text</h4>
//
//         <div className="form-row">
//           <label>Text:</label>
//           <input
//             type="text"
//             value={selectedText.text}
//             onChange={(e) => handleTextEdit({ text: e.target.value })}
//           />
//         </div>
//
//         <div className="form-row">
//           <label>Font:</label>
//           <select
//             value={selectedText.fontFamily}
//             onChange={(e) => handleTextEdit({ fontFamily: e.target.value })}
//           >
//             <option value="Arial">Arial</option>
//             <option value="Times New Roman">Times New Roman</option>
//             <option value="Courier New">Courier New</option>
//             <option value="Impact">Impact</option>
//             <option value="Georgia">Georgia</option>
//           </select>
//         </div>
//
//         <div className="form-row">
//           <label>Size:</label>
//           <input
//             type="number"
//             value={selectedText.fontSize}
//             min="8"
//             max="72"
//             onChange={(e) => handleTextEdit({ fontSize: parseInt(e.target.value) })}
//           />
//         </div>
//
//         <div className="form-row">
//           <label>Color:</label>
//           <input
//             type="color"
//             value={selectedText.fontColor || '#ffffff'}
//             onChange={(e) => handleTextEdit({ fontColor: e.target.value })}
//           />
//         </div>
//
//         <div className="form-row">
//           <label>Position:</label>
//           <div style={{ display: 'flex', gap: '10px' }}>
//             <span>X: <input
//               type="number"
//               value={selectedText.positionX}
//               min="0"
//               max={canvasDimensions.width}
//               onChange={(e) => handleTextEdit({ positionX: parseInt(e.target.value) })}
//               style={{ width: '60px' }}
//             /></span>
//             <span>Y: <input
//               type="number"
//               value={selectedText.positionY}
//               min="0"
//               max={canvasDimensions.height}
//               onChange={(e) => handleTextEdit({ positionY: parseInt(e.target.value) })}
//               style={{ width: '60px' }}
//             /></span>
//           </div>
//         </div>
//
//         <div className="form-row">
//           <button
//             onClick={() => {
//               if (window.confirm('Are you sure you want to delete this text?')) {
//                 // Implementation needed for text deletion
//                 // You'll need to add a backend API endpoint for this
//               }
//             }}
//             style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '5px 10px' }}
//           >
//             Delete Text
//           </button>
//         </div>
//       </div>
//     );
//   };
//
//   // Add this function to handle custom text input
//   const handleAddCustomText = () => {
//     const customText = prompt("Enter your text:", "");
//
//     if (customText !== null && customText.trim() !== "") {
//       // Create new text object
//       const newTextSegment = {
//         id: Date.now().toString(), // Temporary ID until backend assigns one
//         text: customText,
//         fontFamily: "Arial",
//         fontSize: 24,
//         fontColor: "#ffffff",
//         backgroundColor: null,
//         positionX: Math.floor(canvasDimensions.width / 2) - 50,
//         positionY: Math.floor(canvasDimensions.height / 2) - 20,
//         timelineStartTime: currentTime,
//         timelineEndTime: currentTime + 5.0,
//         layer: Math.max(...textSegments.map(t => t.layer || 0), 0) + 1
//       };
//
//       // Add to local state first (for immediate feedback)
//       setTextSegments(prev => [...prev, newTextSegment]);
//       setSelectedText(newTextSegment);
//
//       // Try to save to backend
//       const saveToBackend = async () => {
//         try {
//           const token = localStorage.getItem('token');
//
//           await axios.post(
//             `${API_BASE_URL}/projects/${projectId}/add-text`,
//             newTextSegment,
//             {
//               headers: { Authorization: `Bearer ${token}` },
//               params: { sessionId }
//             }
//           );
//
//           // Reload timeline to get server-assigned IDs
//           await loadProjectTimeline();
//         } catch (error) {
//           console.error('Error adding text:', error);
//           // Keep the text in UI even if backend fails
//         }
//       };
//
//       saveToBackend();
//     }
//   };
//
//   // Add React-DnD or implement a simple drag handler:
//   const handleTextDragStart = (e, text) => {
//     setDraggingText(text);
//     setDragStartPos({
//       x: e.clientX,
//       y: e.clientY
//     });
//   };
//
//   const handleTextDragMove = (e) => {
//     if (!draggingText || !dragStartPos) return;
//
//     const deltaX = e.clientX - dragStartPos.x;
//     const deltaY = e.clientY - dragStartPos.y;
//
//     // Update position in UI immediately
//     setTextSegments(prev =>
//       prev.map(text =>
//         text.id === draggingText.id
//           ? {
//               ...text,
//               positionX: Math.max(0, Math.min(canvasDimensions.width - 50, text.positionX + deltaX)),
//               positionY: Math.max(0, Math.min(canvasDimensions.height - 30, text.positionY + deltaY))
//             }
//           : text
//       )
//     );
//
//     setDragStartPos({
//       x: e.clientX,
//       y: e.clientY
//     });
//   };
//
//   const handleTextDragEnd = async () => {
//     if (!draggingText) return;
//
//     // Find the updated text
//     const updatedText = textSegments.find(t => t.id === draggingText.id);
//     if (!updatedText) return;
//
//     // Save the new position to the server
//     await handleTextEdit({
//       positionX: updatedText.positionX,
//       positionY: updatedText.positionY
//     });
//
//     setDraggingText(null);
//     setDragStartPos(null);
//   };
//
//   // Add these event handlers to the text div in the video player
//   const textOverlayProps = {
//     onMouseDown: (e) => {
//       if (selectedText?.id === text.id) {
//         handleTextDragStart(e, text);
//       }
//     }
//   };
//
//   // Add the mouse events to the video container
//   useEffect(() => {
//     const handleMouseMove = (e) => handleTextDragMove(e);
//     const handleMouseUp = () => handleTextDragEnd();
//
//     if (draggingText) {
//       window.addEventListener('mousemove', handleMouseMove);
//       window.addEventListener('mouseup', handleMouseUp);
//     }
//
//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [draggingText, dragStartPos]);
//
//   return (
//     <div className="project-editor">
//       {/* Sidebar */}
//       <aside className="sidebar">
//         <h2>Media Library</h2>
//         <input
//           type="file"
//           accept="video/*"
//           onChange={handleVideoUpload}
//           id="upload-video"
//           className="hidden-input"
//         />
//         <label
//           htmlFor="upload-video"
//           className="upload-button"
//         >
//           {uploading ? 'Uploading...' : 'Upload Video'}
//         </label>
//
//         <div className="video-list">
//           {videos.map((video) => (
//             <div
//               key={video.id || video.filePath || video.filename}
//               className={`video-item ${
//                 selectedVideo?.id === video.id ? 'selected' : ''
//               }`}
//               onClick={() => handleVideoSelect(video, true)}
//             >
//               {video.thumbnail ? (
//                 <div
//                   className="video-thumbnail"
//                   style={{
//                     backgroundImage: `url(${video.thumbnail})`,
//                     width: '120px',
//                     height: '80px',
//                     backgroundSize: 'cover',
//                     backgroundPosition: 'center',
//                     borderRadius: '4px'
//                   }}
//                 ></div>
//               ) : (
//                 <div className="video-thumbnail-placeholder" style={{width: '120px', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '4px'}}></div>
//               )}
//               <div className="video-item-title">
//                 {((video.title || (video.filePath || video.filename).split('/').pop()) || '').substring(0, 15)}...
//               </div>
//             </div>
//           ))}
//         </div>
//       </aside>
//
//       {/* Main Content Area */}
//       <main className="main-content">
//         <div className="toolbar">
//           <button
//             className={`toolbar-button ${splitMode ? 'active' : ''}`}
//             onClick={() => {
//               if (splitMode) {
//                 // Execute split operation when already in split mode
//                 handleSplitVideo();
//               } else {
//                 // Just enable split mode
//                 setSplitMode(true);
//               }
//             }}
//             title={splitMode ? "Click to confirm split" : "Enable split mode"}
//           >
//             <Scissors className="icon" />
//           </button>
//           <button
//             className="toolbar-button save-button"
//             onClick={handleSaveProject}
//             disabled={isSaving}
//           >
//             <Save className="icon" />
//             {isSaving ? 'Saving...' : ''}
//           </button>
//           <button
//             className="toolbar-button"
//             onClick={handleUndo}
//             disabled={historyIndex < 0}
//           >
//             <Undo className="icon" />
//           </button>
//           <button
//             className="toolbar-button"
//             onClick={handleRedo}
//             disabled={historyIndex >= projectHistory.length - 1}
//           >
//             <Redo className="icon" />
//           </button>
//           <button
//             className="toolbar-button play-button"
//             onClick={playTimelineVideos}
//           >
//             {isPlaying ? <Pause className="icon" /> : <Play className="icon" />}
//           </button>
//           <button
//             className="toolbar-button export-button"
//             onClick={handleExportProject}
//           >
//             Export
//           </button>
//           <button
//               className="toolbar-button"
//               onClick={handleAddCustomText}
//             >
//               Add Text
//             </button>
//         </div>
//         {/* Custom Video Player */}
//         <div
//           className="video-player-container"
//           ref={videoPlayerContainerRef}
//           onDoubleClick={toggleFullscreen}
//           style={{
////             width: '100%',
////             maxWidth: `${canvasDimensions.width}px`,
//             aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`,
//             backgroundColor: 'white',
//             position: 'relative',
//             overflow: 'hidden',
//             margin: '0 auto',
////             boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
////             border: '1px solid #ddd'
//           }}
//         >
//           {videoSource ? (
//             <div className="video-wrapper" onClick={togglePlay}>
//               <video
//                 ref={videoRef}
//                 className="video-player"
//                 onTimeUpdate={handleTimeUpdate}
//                 preload = "auto"
//                 style={{
////                   aspectRatio: `${canvasDimensions.width}`/`${canvasDimensions.height}`,
//                   position: 'absolute',
//                   maxWidth: 'none', // Allow video to exceed container width
//                   maxHeight: 'none', // Allow video to exceed container height
//
//                 }}
//               >
//                 <source src={videoSource} type="video/mp4" />
//               </video>
//               {/* Text Overlays */}
//                   {textSegments.map((text, index) => {
//                     // Only render text that should be visible at the current time
//                     if (currentTime >= text.timelineStartTime && currentTime <= text.timelineEndTime) {
//                       return (
//                         <div
//                           key={`text-overlay-${text.id}`}
//                           style={{
//                             position: 'absolute',
//                             left: `${text.positionX}px`,
//                             top: `${text.positionY}px`,
//                             color: text.fontColor || 'white',
//                             fontFamily: text.fontFamily || 'Arial',
//                             fontSize: `${text.fontSize || 24}px`,
//                             backgroundColor: text.backgroundColor || 'transparent',
//                             padding: text.backgroundColor ? '5px' : '0',
//                             zIndex: 10 + (text.layer || 0),
//                             userSelect: 'none',
//                             pointerEvents: selectedText?.id === text.id ? 'auto' : 'none',
//                             border: selectedText?.id === text.id ? '1px dashed white' : 'none'
//                           }}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setSelectedText(text);
//                           }}
//                         >
//                           {text.text}
//                         </div>
//                       );
//                     }
//                     return null;
//                   })}
//
//               {splitMode && (
//                   <div
//                     className="video-split-line"
//                     style={{
//                       position: 'absolute',
//                       top: 0,
//                       bottom: 0,
//                       left: '50%',
//                       width: '2px',
//                       backgroundColor: 'red',
//                       zIndex: 5
//                     }}
//                   ></div>
//                 )}
//               <div className="video-controls">
//                 <div className="video-timeline">
//                   <div
//                     className="video-progress"
//                     style={{ width: `${(currentTime / videoDuration) * 100}%` }}
//                   ></div>
//                 </div>
//                 <div className="video-time">
//                   {timelineVideos.length > 0 ? getTotalTimelineDisplay() : `${formatTime(currentTime)} / ${formatTime(videoDuration)}`}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="no-video-message">
//               No video selected
//             </div>
//           )}
//         </div>
//
//         <div
//           className="timeline-container"
//           ref={timelineRef}
//           onClick={handleTimelineClick}
//         >
//           <div className="timeline-header">
//             <h3>Timeline</h3>
//             <div className="timeline-controls">
//               <button className="timeline-zoom-button" onClick={zoomOutTimeline} title="Zoom Out">-</button>
//               <button className="timeline-zoom-button" onClick={zoomInTimeline} title="Zoom In">+</button>
//             </div>
//             {splitMode && (
//               <div className="timeline-info">
//                 Click on timeline to set split point
//               </div>
//             )}
//           </div>
//
//           <div className="timeline-professional">
//             {/* Time indicator ruler */}
//             <div className="timeline-ruler" style={{
//               width: `${totalDuration * timelineScale}px`,
//               minWidth: '100%',
//               height: '20px',
//               position: 'relative',
//               backgroundColor: '#2a2a2a',
//               marginBottom: '8px',
//               borderBottom: '1px solid #444'
//             }}>
//               {/* Time markers */}
//               {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
//                 <div key={`time-${i}`} style={{
//                   position: 'absolute',
//                   left: `${i * timelineScale}px`,
//                   top: '0',
//                   fontSize: '10px',
//                   color: '#aaa'
//                 }}>
//                   {formatTime(i)}
//                 </div>
//               ))}
//             </div>
//
//             {/* Display video tracks */}
//             <div className="track-section" style={{ marginBottom: '12px' }}>
//               <div className="track-label" style={{
//                 padding: '5px',
//                 backgroundColor: '#333',
//                 color: 'white',
//                 fontSize: '12px',
//                 fontWeight: 'bold',
//                 width: '80px',
//                 textAlign: 'center',
//                 borderRadius: '3px',
//                 marginBottom: '5px'
//               }}>
//                 Video
//               </div>
//               <div className="timeline-tracks-container" style={{ overflowX: 'auto' }}>
//                 <div className="timeline-track"
//                   style={{
//                     width: `${totalDuration * timelineScale}px`,
//                     minWidth: '100%',
//                     position: 'relative',
//                     height: '60px',
//                     backgroundColor: 'rgba(41, 98, 255, 0.1)',
//                     borderRadius: '3px'
//                   }}
//                 >
//                   {timelineVideos.map((video, index) => {
//                     // Calculate segment duration properly
//                     const segmentDuration =
//                       (video.segmentInfo?.endTime !== -1 ? video.segmentInfo?.endTime : video.duration) -
//                       (video.segmentInfo?.startTime || 0);
//
//                     // Calculate accumulated duration for positioning
//                     let accumulatedDuration = 0;
//                     for (let i = 0; i < index; i++) {
//                       const prevVideo = timelineVideos[i];
//                       const prevDuration =
//                         (prevVideo.segmentInfo?.endTime !== -1 ? prevVideo.segmentInfo?.endTime : prevVideo.duration) -
//                         (prevVideo.segmentInfo?.startTime || 0);
//                       accumulatedDuration += prevDuration;
//                     }
//
//                     return (
//                       <div
//                         key={`timeline-${index}-${video.segmentInfo?.id || 'unsegmented'}`}
//                         className={`timeline-clip ${
//                           selectedVideo?.segmentInfo?.id === video.segmentInfo?.id ? 'selected-clip' : ''
//                         }`}
//                         style={{
//                           position: 'absolute',
//                           left: `${accumulatedDuration * timelineScale}px`,
//                           width: `${segmentDuration * timelineScale}px`,
//                           minWidth: '80px',
//                           height: '100%',
//                           backgroundColor: '#3a6ea5',
//                           borderRadius: '3px',
//                           boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
//                           overflow: 'hidden',
//                           cursor: 'pointer',
//                           ...calculateVideoTransform(video, canvasDimensions),
//                         }}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setSelectedVideo(video);
//                           handleVideoSelect(video, false);
//                         }}
//                       >
//                         {video.thumbnail ? (
//                           <div
//                             className="clip-thumbnail"
//                             style={{
//                               backgroundImage: `url(${video.thumbnail})`,
//                               backgroundSize: 'cover',
//                               backgroundPosition: 'center',
//                               height: '100%',
//                               width: '100%'
//                             }}
//                           ></div>
//                         ) : (
//                           <div className="clip-thumbnail-placeholder" style={{ height: '100%' }}></div>
//                         )}
//                         <div className="clip-title" style={{
//                           position: 'absolute',
//                           bottom: '0',
//                           left: '0',
//                           right: '0',
//                           padding: '2px 5px',
//                           backgroundColor: 'rgba(0,0,0,0.7)',
//                           fontSize: '10px',
//                           whiteSpace: 'nowrap',
//                           overflow: 'hidden',
//                           textOverflow: 'ellipsis'
//                         }}>
//                           {video.title || video.displayPath || (video.filePath || video.filename).split('/').pop().substring(0, 10)}...
//                           {video.segmentInfo && (
//                             <span className="segment-info" style={{fontSize: '9px', display: 'block'}}>
//                               {formatTime(video.segmentInfo.startTime || 0)}-{formatTime(video.segmentInfo.endTime !== -1 ? video.segmentInfo.endTime : video.duration)}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//
//             {/* Display text tracks */}
//             <div className="track-section">
//               <div className="track-label" style={{
//                 padding: '5px',
//                 backgroundColor: '#333',
//                 color: 'white',
//                 fontSize: '12px',
//                 fontWeight: 'bold',
//                 width: '80px',
//                 textAlign: 'center',
//                 borderRadius: '3px',
//                 marginBottom: '5px'
//               }}>
//                 Text
//               </div>
//               <div className="timeline-tracks-container" style={{ overflowX: 'auto' }}>
//                 <div className="timeline-track"
//                   style={{
//                     width: `${totalDuration * timelineScale}px`,
//                     minWidth: '100%',
//                     position: 'relative',
//                     height: '40px',
//                     backgroundColor: 'rgba(76, 175, 80, 0.1)',
//                     borderRadius: '3px'
//                   }}
//                 >
//                   {textSegments.map((text, index) => {
//                     const textDuration = text.timelineEndTime - text.timelineStartTime;
//
//                     return (
//                       <div
//                         key={`text-timeline-${text.id}`}
//                         className={`timeline-clip ${selectedText?.id === text.id ? 'selected-clip' : ''}`}
//                         style={{
//                           position: 'absolute',
//                           left: `${text.timelineStartTime * timelineScale}px`,
//                           width: `${textDuration * timelineScale}px`,
//                           minWidth: '60px',
//                           height: '100%',
//                           backgroundColor: '#4CAF50',
//                           opacity: 0.8,
//                           borderRadius: '3px',
//                           cursor: 'pointer',
//                           boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
//                           overflow: 'hidden'
//                         }}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setSelectedText(text);
//                           // Seek to the text position if needed
//                           if (videoRef.current) {
//                             videoRef.current.currentTime = text.timelineStartTime;
//                           }
//                         }}
//                       >
//                         <div className="clip-title" style={{
//                           padding: '2px 5px',
//                           fontSize: '10px',
//                           whiteSpace: 'nowrap',
//                           overflow: 'hidden',
//                           textOverflow: 'ellipsis',
//                           height: '100%',
//                           display: 'flex',
//                           flexDirection: 'column',
//                           justifyContent: 'center'
//                         }}>
//                           {text.text.substring(0, 15)}{text.text.length > 15 ? '...' : ''}
//                           <span className="segment-info" style={{fontSize: '9px', display: 'block'}}>
//                             {formatTime(text.timelineStartTime)}-{formatTime(text.timelineEndTime)}
//                           </span>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//
//             {/* Playhead indicator */}
//             {/* Playhead indicator */}
//             <div
//               className="playhead"
//               style={markerStyle}
//             ></div>
//
//             {/* Split point indicator */}
//             {splitMode && (
//               <div className="split-indicator">
//                 Split point: {formatTime(videoRef.current ? videoRef.current.currentTime : 0)}
//               </div>
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };
//
// export default ProjectEditor;
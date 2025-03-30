import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../CSS/ProjectEditor.css';
import TimelineComponent from './TimelineComponent.js';
import VideoPreview from './VideoPreview';

const API_BASE_URL = 'http://localhost:8080';

const ProjectEditor = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]); // State for audio files
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1080, height: 1920 });
  const [currentTime, setCurrentTime] = useState(0);
  const [videoLayers, setVideoLayers] = useState([[], [], []]); // For videos, images, texts
  const [audioLayers, setAudioLayers] = useState([[], [], []]); // For audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(60);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [tempSegmentValues, setTempSegmentValues] = useState({});
  const [isTransformOpen, setIsTransformOpen] = useState(false);

  const navigate = useNavigate();
  const { projectId } = useParams();
  const updateTimeoutRef = useRef(null);

  const toggleTransformPanel = () => {
    setIsTransformOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
      return;
    }
    const initializeProject = async () => {
      try {
        await fetchVideos();
        await fetchAudios(); // Fetch audios on project initialization
        await fetchPhotos(); // Add this line
        const token = localStorage.getItem('token');
        const sessionResponse = await axios.post(
          `${API_BASE_URL}/projects/${projectId}/session`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSessionId(sessionResponse.data);
        const projectResponse = await axios.get(
          `${API_BASE_URL}/projects/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const project = projectResponse.data;
        if (project.width && project.height) {
          setCanvasDimensions({ width: project.width, height: project.height });
        }
      } catch (error) {
        console.error('Error initializing project:', error);
        navigate('/dashboard');
      }
    };
    initializeProject();
    const handleBeforeUnload = () => {};
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [projectId, navigate]);

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/videos/my-videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedVideos = response.data.map(video => ({
        ...video,
        filePath: video.filePath || video.filename,
        displayPath: video.title || (video.filePath || video.filename).split('/').pop(),
      }));
      setVideos(updatedVideos);
      for (const video of updatedVideos) {
        await generateVideoThumbnail(video);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchAudios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const project = response.data;
      console.log('Project data:', project); // Debug log to inspect the project data
      if (project.audioJson) {
        let audioFiles;
        try {
          // Parse audio_json since it's a JSON string
          audioFiles = typeof project.audioJson === 'string'
            ? JSON.parse(project.audioJson)
            : project.audioJson;
        } catch (e) {
          console.error('Error parsing audio_json:', e);
          audioFiles = [];
        }
        if (Array.isArray(audioFiles)) {
          const updatedAudios = audioFiles.map(audio => ({
            id: audio.audioPath || `audio-${audio.audioFileName}-${Date.now()}`, // Use audioPath as a unique ID
            fileName: audio.audioFileName,
            displayName: audio.audioFileName.split('/').pop(),
            waveformImage: '/images/audio.jpeg', // Path to the waveform image
          }));
          setAudios(updatedAudios);
          console.log('Fetched audios:', updatedAudios); // Debug log
        } else {
          setAudios([]);
          console.log('audio_json is not an array:', audioFiles);
        }
      } else {
        setAudios([]);
        console.log('No audio_json field found in project');
      }
    } catch (error) {
      console.error('Error fetching audios:', error);
      setAudios([]);
    }
  };

  useEffect(() => {
    const fetchAndSetLayers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_BASE_URL}/projects/${projectId}`,
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const project = response.data;
        if (project && project.timelineState) {
          let timelineState;
          try {
            timelineState = typeof project.timelineState === 'string'
              ? JSON.parse(project.timelineState)
              : project.timelineState;
          } catch (e) {
            console.error("Failed to parse timeline state:", e);
            timelineState = { segments: [], textSegments: [], audioSegments: [] };
          }
          const newVideoLayers = [[], [], []]; // For videos, images, texts
          const newAudioLayers = [[], [], []]; // For audio

          // Video Segments
          if (timelineState.segments && timelineState.segments.length > 0) {
            for (const segment of timelineState.segments) {
              const layerIndex = segment.layer || 0;
              if (layerIndex < 0) continue; // Skip audio segments here
              if (layerIndex >= newVideoLayers.length) {
                while (newVideoLayers.length <= layerIndex) newVideoLayers.push([]);
              }
              if (segment.sourceVideoPath) {
                const video = videos.find(v => {
                  const vPath = (v.filePath || v.filename);
                  const normalizedVPath = vPath.startsWith('videos/') ? vPath.substring(7) : vPath;
                  const normalizedVideoPath = segment.sourceVideoPath.startsWith('videos/')
                    ? segment.sourceVideoPath.substring(7)
                    : segment.sourceVideoPath;
                  return normalizedVPath === normalizedVideoPath;
                });
                if (video) {
                  newVideoLayers[layerIndex].push({
                    id: segment.id,
                    type: 'video',
                    startTime: segment.timelineStartTime || 0,
                    duration: (segment.timelineEndTime - segment.timelineStartTime) || 0,
                    filePath: segment.sourceVideoPath,
                    layer: layerIndex,
                    positionX: segment.positionX || 50,
                    positionY: segment.positionY || 50,
                    scale: segment.scale || 1,
                  });
                }
              } else if (segment.imageFileName) {
                const photo = photos.find(p => p.fileName === segment.imageFileName);
                if (photo) {
                  newVideoLayers[layerIndex].push({
                    id: segment.id,
                    type: 'image',
                    startTime: segment.timelineStartTime || 0,
                    duration: (segment.timelineEndTime - segment.timelineStartTime) || 5,
                    fileName: segment.imageFileName,
                    filePath: photo.filePath,
                    layer: layerIndex,
                    positionX: segment.positionX || 50,
                    positionY: segment.positionY || 50,
                    scale: segment.scale || 1,
                  });
                }
              }
            }
          }

          // Text Segments
          if (timelineState.textSegments && timelineState.textSegments.length > 0) {
            for (const textSegment of timelineState.textSegments) {
              const layerIndex = textSegment.layer || 0;
              if (layerIndex < 0) continue; // Skip if mistakenly in audio layer
              if (layerIndex >= newVideoLayers.length) {
                while (newVideoLayers.length <= layerIndex) newVideoLayers.push([]);
              }
              newVideoLayers[layerIndex].push({
                id: textSegment.id,
                type: 'text',
                text: textSegment.text,
                startTime: textSegment.timelineStartTime || 0,
                duration: (textSegment.timelineEndTime - textSegment.timelineStartTime) || 0,
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

          // Audio Segments
          if (timelineState.audioSegments && timelineState.audioSegments.length > 0) {
            for (const audioSegment of timelineState.audioSegments) {
              const backendLayer = audioSegment.layer || -1; // Negative layer from backend
              const layerIndex = Math.abs(backendLayer) - 1; // Map -1 to 0, -2 to 1, etc.
              if (layerIndex >= newAudioLayers.length) {
                while (newAudioLayers.length <= layerIndex) newAudioLayers.push([]);
              }
              newAudioLayers[layerIndex].push({
                id: audioSegment.id,
                type: 'audio',
                fileName: audioSegment.audioFileName || audioSegment.audioPath.split('/').pop(),
                startTime: audioSegment.timelineStartTime || 0,
                duration: (audioSegment.timelineEndTime - audioSegment.timelineStartTime) || 0,
                layer: backendLayer, // Keep original negative layer for backend
                displayName: audioSegment.audioFileName ? audioSegment.audioFileName.split('/').pop() : audioSegment.audioPath.split('/').pop(),
                waveformImage: '/images/audio.jpeg', // Use the same waveform image as in media library
              });
            }
          }

          setVideoLayers(newVideoLayers);
          setAudioLayers(newAudioLayers);
          let maxEndTime = 0;
          [...newVideoLayers, ...newAudioLayers].forEach(layer => {
            layer.forEach(item => {
              const endTime = item.startTime + item.duration;
              if (endTime > maxEndTime) maxEndTime = endTime;
            });
          });
          setTotalDuration(maxEndTime > 0 ? maxEndTime : 0);
        }
      } catch (error) {
        console.error('Error fetching timeline data for layers:', error);
      }
    };
    if (projectId && sessionId && videos.length > 0) fetchAndSetLayers();
  }, [projectId, sessionId, videos, photos]);

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
      const newVideo = response.data;
      if (newVideo) {
        await fetchVideos();
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAudioUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('audioFileName', file.name);
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/upload-audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedProject = response.data;
      if (updatedProject) {
        await fetchAudios(); // Fetch updated audios after upload
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
    } finally {
      setUploading(false);
    }
  };

  const generateVideoThumbnail = async (video) => {
    if (!video || (!video.filePath && !video.filename)) return;
    if (video.thumbnail) return;
    let path = video.filePath || video.filename;
    if (path.startsWith('videos/')) {
      path = path.substring(7);
    }
    const videoUrl = `${API_BASE_URL}/videos/${encodeURIComponent(path)}`;
    try {
      const videoElement = document.createElement('video');
      videoElement.crossOrigin = "anonymous";
      videoElement.src = videoUrl;
      await new Promise((resolve, reject) => {
        videoElement.onloadeddata = resolve;
        videoElement.onerror = reject;
        setTimeout(resolve, 5000);
      });
      const seekTime = Math.min(1, (video.duration || 0) * 0.25);
      videoElement.currentTime = seekTime;
      await new Promise(resolve => {
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
      setVideos(prevVideos =>
        prevVideos.map(v =>
          (v.filePath || v.filename) === (video.filePath || video.filename) ? { ...v, thumbnail } : v
        )
      );
    } catch (error) {
      console.error("Error creating thumbnail for video:", path, error);
    }
  };

  const handleSaveProject = async () => {
    if (!projectId || !sessionId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/save`,
        {},
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const exportedFileName = response.data;
      alert(`Project exported successfully as ${exportedFileName}!`);
    } catch (error) {
      console.error('Error exporting project:', error);
      alert('Failed to export project. Please try again.');
    }
  };

  const handleMediaDragStart = (e, media, type) => {
    const mediaId = media.id || `media-${media.filePath || media.fileName || media.filename || media.imageFileName}-${Date.now()}`;
    const dragData = {
      type: type,
      isDragOperation: true,
      [type === 'media' ? 'video' : type === 'photo' ? 'photo' : 'audio']: {
        id: mediaId,
        filePath: type === 'media' ? (media.filePath || media.filename) : undefined,
        fileName: type === 'audio' ? media.fileName : type === 'photo' ? media.fileName : undefined,
        displayPath: media.displayPath || media.displayName || (media.filePath || media.fileName || media.filename || media.imageFileName)?.split('/').pop(),
        duration: media.duration || 5, // Default duration for photos and videos if not specified
        thumbnail: media.thumbnail || (type === 'photo' ? media.filePath : undefined),
      },
    };
    const jsonString = JSON.stringify(dragData);
    e.dataTransfer.setData('application/json', jsonString);
    e.dataTransfer.setData('text/plain', jsonString);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleVideoClick = async (video, isDragEvent=false) => {
    if (isDragEvent) return; // Skip if this is a drag event
    setSelectedVideo(video);
    if (!sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/projects/${projectId}`,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      await addVideoToTimeline(
        video.filePath || video.filename,
        0,
        endTime,
        null
      );
    } catch (error) {
      console.error('Error adding video to timeline:', error);
    }
  };

  const addVideoToTimeline = async (videoPath, layer, timelineStartTime, timelineEndTime, startTimeWithinVideo, endTimeWithinVideo) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-to-timeline`,
        {
          videoPath,
          layer: layer || 0,
          timelineStartTime: timelineStartTime || 0,
          timelineEndTime: timelineEndTime || null, // Let backend calculate if null
          startTime: startTimeWithinVideo || 0,
          endTime: endTimeWithinVideo || null,
        },
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`Added video ${videoPath} to layer ${layer} at ${timelineStartTime}s`);
    } catch (error) {
      console.error('Error adding video to timeline:', error);
      throw error;
    }
  };

  const handleTimeUpdate = (newTime) => {
    setCurrentTime(newTime);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
      if (!isPlaying) {
        if (e.key === 'ArrowLeft') {
          setCurrentTime(time => Math.max(0, time - 1/30));
        } else if (e.key === 'ArrowRight') {
          setCurrentTime(time => Math.min(totalDuration, time + 1/30));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (isPlaying && currentTime >= totalDuration) {
      setIsPlaying(false);
      setCurrentTime(totalDuration);
    }
  }, [currentTime, isPlaying, totalDuration]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsDraggingHandle(true);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResize = (e) => {
    if (!isDraggingHandle) return;
    const mainContentHeight = document.querySelector('.main-content').clientHeight;
    const minPreviewHeight = 20;
    const maxPreviewHeight = 80;
    const mouseY = e.clientY;
    const containerTop = document.querySelector('.main-content').getBoundingClientRect().top;
    const newHeightPercent = ((mouseY - containerTop) / mainContentHeight) * 100;
    const clampedHeight = Math.max(minPreviewHeight, Math.min(maxPreviewHeight, newHeightPercent));
    setPreviewHeight(clampedHeight);
  };

  const handleResizeEnd = () => {
    setIsDraggingHandle(false);
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isDraggingHandle]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSegmentSelect = (segment) => {
    setSelectedSegment(segment);
    if (segment) {
      setTempSegmentValues({
        positionX: segment.positionX || 50,
        positionY: segment.positionY || 50,
        scale: segment.scale || 1,
      });
    } else {
      setTempSegmentValues({});
    }
  };

  const updateSegmentProperty = (property, value) => {
    setTempSegmentValues(prev => ({
      ...prev,
      [property]: value,
    }));

    const targetLayers = selectedSegment.layer < 0 ? audioLayers : videoLayers;
    const layerIndex = selectedSegment.layer < 0 ? Math.abs(selectedSegment.layer) - 1 : selectedSegment.layerIndex;
    const newLayers = targetLayers.map((layer, idx) =>
      idx === layerIndex
        ? layer.map(item =>
            item.id === selectedSegment.id
              ? { ...item, [property]: value }
              : item
          )
        : layer
    );

    if (selectedSegment.layer < 0) {
      setAudioLayers(newLayers);
    } else {
      setVideoLayers(newLayers);
    }

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      saveSegmentChanges();
    }, 500);
  };

  const saveSegmentChanges = async () => {
    if (!selectedSegment || !sessionId || !projectId) return;
    try {
      const token = localStorage.getItem('token');
      if (selectedSegment.type === 'audio') {
        await axios.put(
          `${API_BASE_URL}/projects/${projectId}/update-audio`,
          {
            audioSegmentId: selectedSegment.id,
            positionX: tempSegmentValues.positionX,
            positionY: tempSegmentValues.positionY,
          },
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(`Updated audio segment ${selectedSegment.id}`);
      } else if (selectedSegment.type === 'video') {
        const requestBody = {
          segmentId: selectedSegment.id,
          positionX: tempSegmentValues.positionX,
          positionY: tempSegmentValues.positionY,
          scale: tempSegmentValues.scale,
        };
        await axios.put(
          `${API_BASE_URL}/projects/${projectId}/update-segment`,
          requestBody,
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(`Updated video segment ${selectedSegment.id}`);
      } else if (selectedSegment.type === 'text') {
        const updatedTextSettings = {
          ...selectedSegment,
          positionX: tempSegmentValues.positionX,
          positionY: tempSegmentValues.positionY,
        };
        await axios.put(
          `${API_BASE_URL}/projects/${projectId}/update-text`,
          {
            segmentId: selectedSegment.id,
            text: updatedTextSettings.text,
            fontFamily: updatedTextSettings.fontFamily,
            fontSize: updatedTextSettings.fontSize,
            fontColor: updatedTextSettings.fontColor,
            backgroundColor: updatedTextSettings.backgroundColor,
            positionX: updatedTextSettings.positionX,
            positionY: updatedTextSettings.positionY,
            timelineStartTime: updatedTextSettings.startTime,
            timelineEndTime: updatedTextSettings.startTime + updatedTextSettings.duration,
            layer: updatedTextSettings.layer,
          },
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(`Updated text segment ${selectedSegment.id}`);
      }
    } catch (error) {
      console.error('Error saving segment changes:', error);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('imageFileName', file.name);
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedProject = response.data;
      if (updatedProject) {
        await fetchPhotos(); // We'll define this next
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
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
        let imageFiles;
        try {
          imageFiles = typeof project.imagesJson === 'string'
            ? JSON.parse(project.imagesJson)
            : project.imagesJson;
        } catch (e) {
          console.error('Error parsing image_json:', e);
          imageFiles = [];
        }
        if (Array.isArray(imageFiles)) {
          const updatedPhotos = await Promise.all(imageFiles.map(async (image) => {
            const fullFileName = image.imagePath.split('/').pop();
            const originalFileName = fullFileName.replace(`${projectId}_`, '').replace(/^\d+_/, '');
            const thumbnail = await new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(fullFileName)}`;
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
              fileName: originalFileName,
              displayName: originalFileName.split('/').pop(),
              filePath: `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(fullFileName)}`,
              thumbnail,
            };
          }));
          setPhotos(updatedPhotos);
          console.log('Fetched photos:', updatedPhotos);
        } else {
          setPhotos([]);
          console.log('image_json is not an array:', imageFiles);
        }
      } else {
        setPhotos([]);
        console.log('No image_json field found in project');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    }
  };

  const handlePhotoClick = async (photo, isDragEvent = false) => {
    if (uploading) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/projects/${projectId}`,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      let timelineState = response.data.timelineState
        ? typeof response.data.timelineState === 'string'
          ? JSON.parse(response.data.timelineState)
          : response.data.timelineState
        : { segments: [], textSegments: [] };

      let endTime = 0;
      const layer0Items = [
        ...(timelineState.segments || []).filter(seg => seg.layer === 0),
        ...(timelineState.textSegments || []).filter(seg => seg.layer === 0),
      ];
      if (layer0Items.length > 0) {
        layer0Items.forEach(item => {
          const segmentEndTime = item.timelineStartTime + (item.timelineEndTime - item.timelineStartTime);
          if (segmentEndTime > endTime) endTime = segmentEndTime;
        });
      }
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/add-project-image-to-timeline`,
        {
          imageFileName: photo.fileName,
          layer: 0,
          timelineStartTime: endTime,
          timelineEndTime: endTime + 5,
        },
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedResponse = await axios.get(
        `${API_BASE_URL}/projects/${projectId}`,
        {
          params: { sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedTimelineState = typeof updatedResponse.data.timelineState === 'string'
        ? JSON.parse(updatedResponse.data.timelineState)
        : updatedResponse.data.timelineState;
      const newImageSegment = updatedTimelineState.segments.find(
        seg => seg.imagePath && seg.timelineStartTime === endTime && seg.layer === 0
      );
      if (newImageSegment) {
        const filename = newImageSegment.imagePath.split('/').pop();
        const thumbnail = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(filename)}`;
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
        setVideoLayers(prevLayers => {
          const newLayers = [...prevLayers];
          newLayers[0].push({
            id: newImageSegment.id,
            type: 'image',
            fileName: photo.fileName,
            filePath: `${API_BASE_URL}/projects/${projectId}/images/${encodeURIComponent(filename)}`,
            thumbnail,
            startTime: newImageSegment.timelineStartTime,
            duration: newImageSegment.timelineEndTime - newImageSegment.timelineStartTime,
            layer: 0,
            positionX: newImageSegment.positionX || 50,
            positionY: newImageSegment.positionY || 50,
            scale: newImageSegment.scale || 1,
          });
          return newLayers;
        });
      }
    } catch (error) {
      console.error('Error adding photo to timeline:', error);
    }
  };

  return (
    <div className="project-editor">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 onClick={() => setExpandedSection(null)} style={{ cursor: 'pointer' }}>
          Media Library
        </h2>
        <div className="media-section">
          <button className="section-button" onClick={() => toggleSection('videos')}>
            Videos
          </button>
          {expandedSection === 'videos' && (
            <div className="section-content">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                id="upload-video"
                className="hidden-input"
              />
              <label htmlFor="upload-video" className="upload-button">
                {uploading ? 'Uploading...' : 'Upload Video'}
              </label>
              {videos.length === 0 ? (
                <div className="empty-state">Pour it in, I am waiting!</div>
              ) : (
                <div className="video-list">
                  {videos.map((video) => (
                    <div
                      key={video.id || video.filePath || video.filename}
                      className={`video-item ${
                        selectedVideo && (selectedVideo.id === video.id || selectedVideo.filePath === video.filePath) ? 'selected' : ''
                      }`}
                      draggable={true}
                      onDragStart={(e) => handleMediaDragStart(e, video, 'media')}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling
                        handleVideoClick(video); // Only trigger on explicit click, not after drag
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation(); // Prevent click event after drag ends
                      }}
                    >
                      {video.thumbnail ? (
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
                        <div
                          className="video-thumbnail-placeholder"
                          style={{ width: '120px', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}
                        ></div>
                      )}
                      {video.title || (video.displayPath ? video.displayPath.split('/').pop().replace(/^\d+_/, '') : 'Untitled Video')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="media-section">
          <button className="section-button" onClick={() => toggleSection('photos')}>
            Photos
          </button>
          {expandedSection === 'photos' && (
            <div className="section-content">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                id="upload-photo"
                className="hidden-input"
              />
              <label htmlFor="upload-photo" className="upload-button">
                {uploading ? 'Uploading...' : 'Upload Photo'}
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
                      onClick={() => handlePhotoClick(photo)} // Optional
                    >
                      <img
                        src={photo.filePath}
                        alt={photo.displayName}
                        className="photo-thumbnail"
                      />
                      <div className="photo-title">{photo.displayName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Audio Section */}
        <div className="media-section">
          <button className="section-button" onClick={() => toggleSection('audios')}>
            Audio
          </button>
          {expandedSection === 'audios' && (
            <div className="section-content">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                id="upload-audio"
                className="hidden-input"
              />
              <label htmlFor="upload-audio" className="upload-button">
                {uploading ? 'Uploading...' : 'Upload Audio'}
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
                    >
                      <img
                        src={audio.waveformImage || '/images/audio.jpeg'}
                        alt="Audio Waveform"
                        className="audio-waveform"
                      />
                      <div className="audio-title">{audio.displayName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-content">
        <div className="preview-and-tools">
          <div className="preview-panel" style={{ height: `${previewHeight}%` }}>
            <VideoPreview
              layers={[...videoLayers, ...audioLayers]}
              currentTime={currentTime}
              isPlaying={isPlaying}
              canvasDimensions={canvasDimensions}
              onTimeUpdate={setCurrentTime}
              totalDuration={totalDuration}
              setIsPlaying={setIsPlaying}
            />
          </div>

          <div className="tools-panel">
            <div className="tools-buttons">
              <button
                className={`tool-button ${isTransformOpen ? 'active' : ''}`}
                onClick={toggleTransformPanel}
              >
                Transform
              </button>
              <button className="tool-button">
                Filters
              </button>
            </div>

            {selectedSegment && isTransformOpen && (
              <div className="transform-panel">
                <h3>Transform</h3>
                <div className="control-group">
                  <label>Position X (%)</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempSegmentValues.positionX || 50}
                      onChange={(e) => updateSegmentProperty('positionX', parseInt(e.target.value))}
                    />
                    <span>{tempSegmentValues.positionX || 50}%</span>
                  </div>
                </div>
                <div className="control-group">
                  <label>Position Y (%)</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempSegmentValues.positionY || 50}
                      onChange={(e) => updateSegmentProperty('positionY', parseInt(e.target.value))}
                    />
                    <span>{tempSegmentValues.positionY || 50}%</span>
                  </div>
                </div>
                {selectedSegment.type === 'video' && (
                  <div className="control-group">
                    <label>Scale</label>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={tempSegmentValues.scale || 1}
                        onChange={(e) => updateSegmentProperty('scale', parseFloat(e.target.value))}
                      />
                      <span>{(tempSegmentValues.scale || 1).toFixed(1)}x</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={`resize-handle ${isDraggingHandle ? 'dragging' : ''}`}
          style={{ top: `${previewHeight}%` }}
          onMouseDown={handleResizeStart}
        ></div>

        <div className="controls-panel">
          <button className="control-button" onClick={handleSaveProject}>Save Project</button>
          <button className="control-button" onClick={handleExportProject}>Export Video</button>
          <button
            className="control-button"
            onClick={() => setIsPlaying(prev => !prev)}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>

        <div className="timeline-wrapper" style={{ height: `calc(100% - ${previewHeight}% - 60px)`, minHeight: '200px' }}>
          {sessionId ? (
            <TimelineComponent
              videos={videos}
              audios={audios}
              sessionId={sessionId}
              projectId={projectId}
              totalDuration={totalDuration}
              setTotalDuration={setTotalDuration}
              onVideoSelect={(time, video) => {
                setCurrentTime(time);
              }}
              canvasDimensions={canvasDimensions}
              addVideoToTimeline={addVideoToTimeline}
              onTimeUpdate={handleTimeUpdate}
              onSegmentSelect={handleSegmentSelect}
              videoLayers={videoLayers}
              audioLayers={audioLayers}
              setVideoLayers={setVideoLayers}
              setAudioLayers={setAudioLayers}
            />
          ) : (
            <div className="loading-message">Loading timeline...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;
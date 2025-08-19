import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tilt } from 'react-tilt';
import '../CSS/Dashboard.css';
import { FaTrash, FaSignOutAlt, FaBars } from 'react-icons/fa';
import { API_BASE_URL, CDN_URL } from '../Config';
import Navbar from '../components/Navbar';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, projectName }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="confirmation-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="modal-title">Confirm Deletion</h3>
        <p className="modal-message">
          Are you sure you want to delete the project <strong>{projectName}</strong>? This action cannot be undone.
        </p>
        <div className="modal-buttons">
          <button className="modal-button cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-button delete-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [fps, setFps] = useState(25);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    picture: null,
    googleAuth: false,
    role: '', // Add role field
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // console.log('Dashboard mounted, location state:', location.state);
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoading(true);
        // Initialize profile from localStorage
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          setUserProfile({
            email: profile.email || '',
            firstName: profile.name ? profile.name.split(' ')[0] : '',
            lastName: profile.name ? profile.name.split(' ').slice(1).join(' ') : '',
            picture: profile.picture || null,
            googleAuth: profile.googleAuth || false,
            role: profile.role || 'BASIC',
          });
        }
        await fetchUserProfile();
        await fetchProjects();
        setIsDataLoaded(true);
        setIsLoading(false);
      } else {
        // For logged-out users, set default state without fetching
        setUserProfile({
          email: '',
          firstName: '',
          lastName: '',
          picture: null,
          googleAuth: false,
          role: '',
        });
        setProjects([]);
        setIsDataLoaded(true);
        setIsLoading(false);
      }
    };
    loadData();

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const logScrollInfo = () => {
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      // console.log(`Document height: ${documentHeight}px, Viewport height: ${viewportHeight}px`);
      // console.log(`Scrollable area: ${documentHeight - viewportHeight}px`);
    };

    logScrollInfo();
    const timer = setTimeout(logScrollInfo, 1000);

    window.addEventListener('resize', logScrollInfo);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', logScrollInfo);
    };
  }, [projects, isDataLoaded]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      // console.log('Fetching user profile with token:', token);
      if (!token) {
        // console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log('User profile response:', response.data);

      const fullName = response.data.name || '';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const profile = {
        email: response.data.email || '',
        firstName: firstName,
        lastName: lastName,
        picture: response.data.picture || null,
        googleAuth: response.data.googleAuth || false,
        role: response.data.role || 'BASIC', // Include role, default to BASIC if missing
      };
      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify({
        email: profile.email,
        name: fullName,
        picture: profile.picture,
        googleAuth: profile.googleAuth,
        role: profile.role, // Store role in localStorage
      }));
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // console.log('Error details:', {
      //   status: error.response?.status,
      //   data: error.response?.data,
      // });
      if (error.response?.status === 401) {
        // console.log('401 Unauthorized, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        navigate('/login', { state: { error: 'Session expired. Please log in again.' } });
      } else {
        setUserProfile({
          email: '',
          firstName: '',
          lastName: '',
          picture: null,
          googleAuth: false,
          role: '', // Reset role on error
        });
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      // console.log('Fetching projects with token:', token);
      if (!token) {
        console.error('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log('Projects response:', response.data);
      const projectList = response.data || [];

      const projectsWithThumbnails = await Promise.all(
        projectList.map(async (project) => {
          const projectDetails = await axios.get(`${API_BASE_URL}/projects/${project.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const timelineState = projectDetails.data.timelineState
            ? typeof projectDetails.data.timelineState === 'string'
              ? JSON.parse(projectDetails.data.timelineState)
              : projectDetails.data.timelineState
            : { segments: [], imageSegments: [] };

          const allSegments = [
            ...(timelineState.segments || []),
            ...(timelineState.imageSegments || []),
          ].sort((a, b) => a.timelineStartTime - b.timelineStartTime);

          let thumbnail = null;
          if (allSegments.length > 0) {
            const firstSegment = allSegments[0];
            if (firstSegment.sourceVideoPath) {
              thumbnail = await generateVideoThumbnail(project.id, firstSegment.sourceVideoPath);
            } else if (firstSegment.imagePath) {
              thumbnail = await generateImageThumbnail(project.id, firstSegment.imagePath);
            }
          }

          return { ...project, thumbnail };
        })
      );

      setProjects(projectsWithThumbnails);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // console.log('Error details:', {
      //   status: error.response?.status,
      //   data: error.response?.data,
      // });
      if (error.response?.status === 401) {
        // console.log('401 Unauthorized, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        navigate('/login', { state: { error: 'Session expired. Please log in again.' } });
      }
    }
  };

  const generateVideoThumbnail = async (projectId, videoPath) => {
    const fullVideoPath = `${CDN_URL}/videos/projects/${projectId}/${encodeURIComponent(videoPath.split('/').pop())}`;
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
        const maxWidth = 600;
        const maxHeight = 400;
        const pixelRatio = window.devicePixelRatio || 1;
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

        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        ctx.scale(pixelRatio, pixelRatio);
        ctx.drawImage(video, 0, 0, width, height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.95);
        resolve(thumbnail);
      };

      video.onerror = () => {
        console.error(`Failed to load video for thumbnail: ${fullVideoPath}`);
        resolve(null);
      };
    });
  };

  const generateImageThumbnail = async (projectId, imagePath) => {
    const filename = imagePath.split('/').pop();
    const fullImagePath = `${CDN_URL}/image/projects/${projectId}/${encodeURIComponent(filename)}`;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fullImagePath;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 600;
        const maxHeight = 400;
        const pixelRatio = window.devicePixelRatio || 1;
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

        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        ctx.scale(pixelRatio, pixelRatio);
        ctx.drawImage(img, 0, 0, width, height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.95);
        resolve(thumbnail);
      };
      img.onerror = () => {
        console.error(`Failed to load image for thumbnail: ${fullImagePath}`);
        resolve(null);
      };
    });
  };

  const createNewProject = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: 'dashboard', projectData: { name: newProjectName, width, height, fps } } });
      return;
    }

    if (!newProjectName) {
      setErrorMessage('Please enter a project name.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (fps <= 0 || fps > 120) {
      setErrorMessage('FPS must be between 1 and 120.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    // Restriction for Basic users
    if (userProfile.role === 'BASIC') {
      if (fps > 60) {
        setErrorMessage('Basic users cannot create projects with more than 60 FPS. Upgrade to Creator or Studio for higher FPS.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
      if (projects.length >= 15) {
        setErrorMessage('Basic users can only create up to 15 projects. Upgrade to Creator or Studio for unlimited projects.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/projects`,
        {
          name: newProjectName,
          width: width,
          height: height,
          fps: fps,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects([...projects, { ...response.data, thumbnail: null }]);
      setNewProjectName('');
      setWidth(1920);
      setHeight(1080);
      setFps(25);
      setIsDropdownOpen(false);
      navigate(`/projecteditor/${response.data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.response?.status === 401) {
        // console.log('401 Unauthorized, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        navigate('/login', { state: { error: 'Session expired. Please log in again.' } });
      } else if (error.response?.status === 400) {
        setErrorMessage('Invalid project parameters: ' + error.response.data);
        setTimeout(() => setErrorMessage(''), 5000);
      } else {
        setErrorMessage('Failed to create project');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    }
  };

  const deleteProject = async (projectId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: 'dashboard', projectId } });
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setProjectToDelete(project);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      await axios.delete(`${API_BASE_URL}/projects/${projectToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProjects(projects.filter((project) => project.id !== projectToDelete.id));
      setShowModal(false);
      setProjectToDelete(null);
      setSuccessMessage('Project deleted successfully');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error deleting project:', error);
      setShowModal(false);
      setProjectToDelete(null);
      if (error.response?.status === 401) {
        // console.log('401 Unauthorized, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        navigate('/login', { state: { error: 'Session expired. Please log in again.' } });
      } else if (error.response?.status === 403) {
        alert('Unauthorized to delete this project');
      } else if (error.response?.status === 404) {
        alert('Project not found');
      } else {
        alert('Failed to delete project');
      }
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setProjectToDelete(null);
  };

  const loadProject = async (projectId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: 'dashboard', projectId } });
      return;
    }

    try {
      await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate(`/projecteditor/${projectId}`);
    } catch (error) {
      console.error('Error accessing project:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        navigate('/login', { state: { error: 'Session expired. Please log in again.' } });
      } else if (error.response?.status === 403 || error.response?.status === 404) {
        navigate('/dashboard', {
          state: { error: 'This Project does not belong to you.' },
        });
      } else {
        navigate('/dashboard', {
          state: { error: 'Failed to access project.' },
        });
      }
    }
  };

  useEffect(() => {
    if (location.state?.error) {
      const timer = setTimeout(() => {
        navigate('/dashboard', { state: {}, replace: true }); // Clear error after 5 seconds
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state?.error, navigate]);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
  
    // Reset state to reflect logged-out status
    setUserProfile({
      email: '',
      firstName: '',
      lastName: '',
      picture: null,
      googleAuth: false,
      role: '',
    });
    setProjects([]);
    setIsProfileDropdownOpen(false);
    setIsDataLoaded(true);
    setIsLoading(false);
  
    // Navigate to dashboard to reflect the logged-out state
    navigate('/dashboard', { replace: true });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const toggleNavMenu = () => {
    setIsNavMenuOpen(!isNavMenuOpen);
  };

  const handlePresetSelect = (presetWidth, presetHeight, presetFps = 25) => {
    setWidth(presetWidth);
    setHeight(presetHeight);
    setFps(presetFps);
  };

  const handleImageError = (e) => {
    console.error('Failed to load profile image');
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const scrollToSection = (sectionId) => {
    // console.log(`Attempting to scroll to section: ${sectionId}`);

    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (!section) {
        console.error(`Section with ID ${sectionId} not found.`);
        return;
      }

      const navBar = document.querySelector('.nav-bar');
      const navHeight = navBar ? navBar.offsetHeight : 80;

      const offsetPosition = section.offsetTop - navHeight - 20;

      // console.log(`Scrolling to ${sectionId} at position: ${offsetPosition}px`);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setIsNavMenuOpen(false);
    }, 150);
  };

  useEffect(() => {
    const sections = ['dashboard-section', 'about-us-section', 'contact-us-section'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (!element) {
        console.error(`WARNING: Section with ID "${id}" not found in DOM`);
      } else {
        // console.log(`Found section: ${id} at position ${element.offsetTop}px`);
      }
    });
  }, [isDataLoaded]);

  return (
    <div className="dashboard">
      <div className="circuit-overlay"></div>
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      )}
      <Navbar
        isScrolled={isScrolled}
        userProfile={userProfile}
        isLoggedIn={isDataLoaded && userProfile.email}
        handleLogout={handleLogout}
        scrollToSection={scrollToSection}
        pageType="dashboard"
      />

      <div className="ripple-effect">
        <div className="ripple-ring"></div>
      </div>
      <div className="particle circle" style={{ width: '10px', height: '10px', top: '20%', left: '30%' }}></div>
      <div className="particle square" style={{ width: '8px', height: '8px', top: '40%', left: '70%' }}></div>
      <div className="particle circle" style={{ width: '12px', height: '12px', top: '60%', left: '15%' }}></div>

      <AnimatePresence>
        <ConfirmationModal
          isOpen={showModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          projectName={projectToDelete?.name || ''}
        />
      </AnimatePresence>

      <section className="projects-section" id="dashboard-section">
        <div className="projects-section-header">
          <h2>My Projects</h2>
          <div className="header-container">
            <div className="create-dropdown">
              <button className="create-button" onClick={toggleDropdown}>
                <span className="plus-icon">+</span> Create
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-title">Create New Project</div>
                  <div className="dropdown-form">
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="dropdown-input"
                    />
                    <div className="dimension-inputs">
                      <input
                        type="number"
                        placeholder="Width"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                        className="dropdown-input dimension-input"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={height}
                        onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                        className="dropdown-input dimension-input"
                      />
                      <input
                        type="number"
                        placeholder="FPS"
                        value={fps}
                        onChange={(e) => setFps(parseInt(e.target.value, 10))}
                        className="dropdown-input dimension-input"
                      />
                    </div>
                  </div>
                  <div className="dropdown-presets">
                    <div className="dropdown-subtitle">Presets</div>
                    <div className="dropdown-item" onClick={() => handlePresetSelect(1920, 1080, 30)}>
                      YouTube (1920x1080, 30 FPS)
                    </div>
                    <div className="dropdown-item" onClick={() => handlePresetSelect(1080, 1920, 60)}>
                      YouTube Shorts (1080x1920, 60 FPS)
                    </div>
                    <div className="dropdown-item" onClick={() => handlePresetSelect(1080, 1920, 60)}>
                      Instagram Reels (1080x1920, 60 FPS)
                    </div>
                    <div className="dropdown-item" onClick={() => handlePresetSelect(1080, 1920, 60)}>
                      TikTok (1080x1920, 60 FPS)
                    </div>
                    <div className="dropdown-subtitle">FPS Options</div>
                    <div className="dropdown-item" onClick={() => setFps(24)}>
                      24 FPS (Cinematic)
                    </div>
                    <div className="dropdown-item" onClick={() => setFps(25)}>
                      25 FPS (Standard)
                    </div>
                    <div className="dropdown-item" onClick={() => setFps(30)}>
                      30 FPS (Common)
                    </div>
                    <div className="dropdown-item" onClick={() => setFps(60)}>
                      60 FPS (Smooth)
                    </div>
                  </div>
                  <button className="dropdown-create-button" onClick={createNewProject}>
                    Create
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <AnimatePresence>
          {successMessage && (
            <motion.p
              className="success-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {successMessage}
            </motion.p>
          )}
          {errorMessage && (
            <motion.p
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {errorMessage}
            </motion.p>
          )}
          {location.state?.error && (
            <motion.p
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {location.state.error}
            </motion.p>
          )}
        </AnimatePresence>
        {userProfile.email ? (
          <div className="project-grid">
            {projects.length === 0 ? (
              <p className="no-projects">No projects yet. Create one to get started!</p>
            ) : (
              projects.map((project) => (
                <Tilt key={project.id} options={{ max: 25, scale: 1.05, speed: 400 }}>
                  <motion.div
                    className="project-card"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ y: -10 }}
                  >
                    <div className="thumbnail-container" onClick={() => loadProject(project.id)}>
                      {project.thumbnail ? (
                        <motion.img
                          src={project.thumbnail}
                          alt={`${project.name} thumbnail`}
                          className="project-thumbnail"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <div className="thumbnail-placeholder">No Preview Available</div>
                      )}
                      <motion.div
                        className="delete-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        title="Delete Project"
                        whileHover={{ scale: 1.2 }}
                      >
                        <FaTrash />
                      </motion.div>
                    </div>
                    <h3 className="project-title">{project.name}</h3>
                  </motion.div>
                </Tilt>
              ))
            )}
          </div>
        ) : (
          <p className="not-logged-in">You are not logged-in!</p>
        )}
      </section>

      <section className="about-us-section" id="about-us-section">
        <div className="section-header">
          <h2>
            <span className="letter">A</span>
            <span className="letter">b</span>
            <span className="letter">o</span>
            <span className="letter">u</span>
            <span className="letter">t</span>
            <span className="letter space"> </span>
            <span className="letter">S</span>
            <span className="letter">c</span>
            <span className="letter">e</span>
            <span className="letter">n</span>
            <span className="letter">i</span>
            <span className="letter">t</span>
            <span className="letter">h</span>
          </h2>
          <div className="logo-element"></div>
        </div>
        <motion.div
          className="about-us-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="about-us-card">
            <h3 className="about-us-subtitle">Our Mission</h3>
            <p>
              At Scenith, we empower creators to reach the zenith of visual storytelling. Our platform, born from the vision of two college friends in India, combines intuitive design with professional-grade tools to make your creative process seamless and impactful.
            </p>
          </div>
          <div className="about-us-card">
            <h3 className="about-us-subtitle">Our Journey</h3>
            <p>
              Since February 2025, we've poured our passion into crafting Scenith—a video editor designed by creators, for creators. Every feature, from precise audio manipulation to dynamic keyframing, is built to elevate your storytelling to new heights.
            </p>
          </div>
          <div className="about-us-card">
            <h3 className="about-us-subtitle">Why Scenith?</h3>
            <p>
              We understand the demands of digital content creation. Scenith offers a comprehensive toolkit—frame-perfect editing, versatile transitions, and customizable elements—to ensure your stories captivate and inspire without compromise.
            </p>
          </div>
        </motion.div>
      </section>

      <section className="contact-us-section" id="contact-us-section">
        <div className="section-header">
          <h2>
            <span className="letter">C</span>
            <span className="letter">o</span>
            <span className="letter">n</span>
            <span className="letter">t</span>
            <span className="letter">a</span>
            <span className="letter">c</span>
            <span className="letter">t</span>
            <span className="letter space"> </span>
            <span className="letter">U</span>
            <span className="letter">s</span>
          </h2>
          <div className="logo-element"></div>
        </div>
        {/* Changed from motion.div to regular div to prevent re-render on scroll */}
        <div
          className="contact-us-content"
          // Removed Framer Motion props to avoid re-triggering animation
        >
          <p className="contact-us-intro">
            We're here to support your creative journey. Reach out with questions, feedback, or just to say hello!
          </p>
          <div className="contact-us-info">
            <div className="contact-us-card">
              <h3 className="contact-us-subtitle">Get in Touch</h3>
              <p>Email: scenith.spprt@gmail.com</p>
              <p>Follow us on social media for updates and tips!</p>
              <div className="social-links">
                <a href="https://x.com/scenith_1902/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <img src="/images/X_logo.png" alt="X" className="social-icon" />
                </a>
                <a href="https://www.instagram.com/scenith.labs/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <img src="/images/Instagram_logo.png" alt="Instagram" className="social-icon" />
                </a>
                <a href="https://linkedin.com/company/scenith/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <img src="/images/LinkedIn_logo.png" alt="LinkedIn" className="social-icon" />
                </a>
                <a href="https://www.youtube.com/@Scenith-f4n" target="_blank" rel="noopener noreferrer" className="social-link">
                  <img src="/images/Youtube_logo.png" alt="YouTube" className="social-icon" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
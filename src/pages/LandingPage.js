import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaCut, FaMusic, FaFont, FaFilm, FaRobot, FaMicrophone, FaClosedCaptioning, FaExchangeAlt, FaEraser, FaTachometerAlt, FaPaintBrush, FaCompressArrowsAlt } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../Config';
import '../CSS/LandingPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const toolsShowcase = [
  { 
    id: 'ai-voice', 
    title: 'AI Voice Generation', 
    icon: FaMicrophone,
    description: 'Transform text into natural-sounding speech',
    link: 'https://scenith.in/tools/ai-voice-generation',
    color: '#FF6B6B',
    badge: 'Popular'
  },
  { 
    id: 'ai-subtitle', 
    title: 'AI Subtitle Generation', 
    icon: FaClosedCaptioning,
    description: 'Auto-generate accurate subtitles instantly',
    link: 'https://scenith.in/tools/add-subtitles-to-videos',
    color: '#4ECDC4',
    badge: 'New'
  },
  { 
    id: 'media-conversion', 
    title: 'Media Conversion', 
    icon: FaExchangeAlt,
    description: 'Convert between any media format',
    link: 'https://scenith.in/tools/media-conversion-tool',
    color: '#45B7D1',
    badge: null
  },
  { 
    id: 'media-compression', 
    title: 'Media Compression', 
    icon: FaCompressArrowsAlt,
    description: 'Reduce file size without losing quality',
    link: 'https://scenith.in/tools/compress-media',
    color: '#96CEB4',
    badge: null
  },
  { 
    id: 'bg-remover', 
    title: 'Background Remover', 
    icon: FaEraser,
    description: 'Remove image backgrounds in seconds',
    link: 'https://scenith.in/tools/background-removal',
    color: '#FFEAA7',
    badge: 'Popular'
  },
  { 
    id: 'speed-modifier', 
    title: 'Video Speed Modifier', 
    icon: FaTachometerAlt,
    description: 'Speed up or slow down your videos',
    link: 'https://scenith.in/tools/video-speed-modifier',
    color: '#DFE6E9',
    badge: null
  },
  { 
    id: 'image-editing', 
    title: 'Image Editing', 
    icon: FaPaintBrush,
    description: 'A Friendly Image Editor for all your Social Requirements.',
    link: 'https://scenith.in/tools/image-editing',
    color: '#A29BFE',
    badge: null
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    picture: null,
    googleAuth: false,
    role: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const fullName = response.data.name || '';
          const nameParts = fullName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

          setUserProfile({
            email: response.data.email || '',
            firstName: firstName,
            lastName: lastName,
            picture: response.data.picture || null,
            googleAuth: response.data.googleAuth || false,
            role: response.data.role || 'BASIC',
          });
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userProfile');
            setIsLoggedIn(false);
          }
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const scrollToSection = (sectionId) => {
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (!section) return;

      const navBar = document.querySelector('.nav-bar');
      const navHeight = navBar ? navBar.offsetHeight : 80;

      window.scrollTo({
        top: section.offsetTop - navHeight - 20,
        behavior: 'smooth',
      });
      setIsNavMenuOpen(false);
    }, 150);
  };

  // YouTube tutorial video IDs
  const youtubeTutorials = [
    { id: 'Yw549sO7RgE', title: 'Scenith Tutorial: Getting Started' },
    { id: 'XNFJjzScSHU', title: 'Scenith Tutorial: Adding Transitions' },
    { id: 'qoQSktfHvZ8', title: 'Scenith Tutorial: AI Subtitles' },
  ];

  return (
    <div className="landing-page">
      <div className="particle-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <Navbar
        isScrolled={isScrolled}
        userProfile={userProfile}
        isLoggedIn={isLoggedIn}
        handleLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userProfile');
          setUserProfile({
            email: '',
            firstName: '',
            lastName: '',
            picture: null,
            googleAuth: false,
            role: '',
          });
          setIsLoggedIn(false);
          navigate('/');
        }}
        scrollToSection={scrollToSection}
        pageType="landing"
      />

      <section className="hero-section" id="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>
            Create Stunning Videos with <span className="highlight">Scenith</span>
          </h1>
          <p>
            Unleash your creativity with our powerful, AI-driven video editing platform. From AI voice generation to subtitle creation, Scenith provides <span className="stats-highlight">6+ professional tools</span> that save you hours of work. Join <span className="stats-highlight">10,000+ creators</span> who trust Scenith.
          </p>
          <div className="hero-cta">
            <button
              className="cta-button primary"
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/signup')}
            >
              Start Editing Now
            </button>
            <button
              className="cta-button secondary"
              onClick={() => scrollToSection('tutorials-section')}
            >
              Watch Tutorials <FaPlay className="play-icon" />
            </button>
          </div>
        </motion.div>
      </section>

      <section className="tools-showcase-section" id="tools-section">
        <div className="section-header">
          <h2>Powerful Tools at Your Fingertips</h2>
          <p className="section-subtitle">Everything you need to create professional content, all in one place</p>
        </div>
        <motion.div
          className="tools-showcase-grid"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {toolsShowcase.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <motion.div
                key={tool.id}
                className="tool-showcase-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => window.location.href = tool.link}
                style={{ '--tool-color': tool.color }}
              >
                {tool.badge && (
                  <div className={`tool-badge ${tool.badge === 'Coming Soon' ? 'coming-soon' : ''}`}>
                    {tool.badge}
                  </div>
                )}
                <div className="tool-icon-wrapper">
                  <IconComponent className="tool-showcase-icon" />
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <button className="tool-try-button">
                  Try Now <span className="arrow">→</span>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
        <div className="tools-cta-wrapper">
          <p className="tools-cta-text">Can't decide? Start with our most popular tool</p>
          <button 
            className="tools-main-cta"
            onClick={() => window.location.href = 'https:scenith.in/tools/ai-voice-generation'}
          >
            Try AI Voice Generator
          </button>
        </div>
      </section>
        
      <section className="social-proof-section">
        <motion.div
          className="social-proof-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="stat-item">
            <div className="stat-number">10,000+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">500K+</div>
            <div className="stat-label">Videos Created</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">6+</div>
            <div className="stat-label">AI-Powered Tools</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">4.9/5</div>
            <div className="stat-label">User Rating</div>
          </div>
        </motion.div>
      </section>

      <section className="tutorials-section" id="tutorials-section">
        <div className="section-header">
          <h2>Learn with Scenith Tutorials</h2>
        </div>
        <motion.div
          className="tutorials-grid"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {youtubeTutorials.map((tutorial) => (
            <div className="tutorial-card" key={tutorial.id}>
              <iframe
                src={`https://www.youtube.com/embed/${tutorial.id}`}
                title={tutorial.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <h3>{tutorial.title}</h3>
            </div>
          ))}
        </motion.div>
        <a
          href="https://www.youtube.com/@Scenith-f4n"
          target="_blank"
          rel="noopener noreferrer"
          className="tutorials-cta"
        >
          View More on YouTube
        </a>
      </section>
      <section className="blog-preview-section" id="blog-section">
        <div className="section-header">
          <h2>Latest from Our Blog</h2>
        </div>
        <motion.div
          className="blog-preview-grid"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="blog-preview-card">
            <div className="blog-preview-content">
              <h3>How to Add Subtitles to Video</h3>
              <p>Master the art of subtitle creation with our comprehensive guide. Learn techniques that make your content accessible and engaging.</p>
              <button 
                className="blog-preview-cta"
                onClick={() => {
                  window.location.href = '/blogs/how-to-add-subtitles-to-video';
                }}
              >
                Read More
              </button>
            </div>
          </div>
          <div className="blog-preview-card">
            <div className="blog-preview-content">
              <h3>How to reach 4000 hours of Watch Time on YouTube</h3>
              <p>Discover the way to reach the mark of 4000 hours of Watch Time on YouTube and start your monetization journey.</p>
              <button 
                className="blog-preview-cta"
                onClick={() => {
                  window.location.href = '/blogs/how-to-reach-4000-hours-watch-time';
                  window.scrollTo(0, 0);
                }}
              >
                Read More
              </button>
            </div>
          </div>
        </motion.div>
        <button
          className="view-all-blogs-cta"
          onClick={() => {
            window.location.href = '/blogs';
            window.scrollTo(0, 0);
          }}
        >
          View All Blog Posts
        </button>
      </section>      

      <section className="motivation-section" id="motivation-section">
        <div className="section-header">
          <h2>Why Choose Scenith?</h2>
        </div>
        <motion.div
          className="motivation-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p>
            Scenith is more than just a video editor—it's a complete content creation platform designed to empower creators like you. Whether you're crafting content for YouTube, Instagram, TikTok, or personal projects, Scenith provides professional-grade AI tools in an intuitive interface. Our mission is to make content creation accessible, efficient, and fun, so you can focus on telling stories that captivate and inspire.
          </p>
          <div className="motivation-features-quick">
            <div className="quick-feature">✓ No watermarks</div>
            <div className="quick-feature">✓ Fast processing</div>
            <div className="quick-feature">✓ Free tier available</div>
          </div>
          <button
            className="motivation-cta"
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/signup')}
          >
            Start Creating for Free
          </button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
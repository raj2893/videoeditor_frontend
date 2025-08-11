import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaCut, FaMusic, FaFont, FaFilm, FaRobot, FaBars, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../Config';
import '../CSS/LandingPage.css';

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

  const toggleNavMenu = () => {
    setIsNavMenuOpen(!isNavMenuOpen);
  };

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
      <nav className={`nav-bar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-content">
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
          <button className="hamburger-menu" onClick={toggleNavMenu}>
            <FaBars />
          </button>
          <div className={`nav-links ${isNavMenuOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollToSection('hero-section')}
            >
              Home
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollToSection('features-section')}
            >
              Features
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollToSection('tutorials-section')}
            >
              Tutorials
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollToSection('footer-section')}
            >
              Contact Us
            </button>
          </div>
          <div className="header-container">
            {!isLoading && !isLoggedIn && (
              <button className="login-button" onClick={() => navigate('/login')}>
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

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
            Unleash your creativity with our powerful, user-friendly video editing platform. From AI subtitles to dynamic transitions, Scenith has everything you need to tell your story.
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

      <section className="features-section" id="features-section">
        <div className="section-header">
          <h2>Powerful Features for Every Creator</h2>
        </div>
        <motion.div
          className="features-grid"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="feature-card">
            <FaCut className="feature-icon" />
            <h3>Cut, Trim & Merge</h3>
            <p>Precisely edit your videos with intuitive tools to cut, trim, and merge clips seamlessly.</p>
          </div>
          <div className="feature-card">
            <FaFilm className="feature-icon" />
            <h3>Dynamic Transitions</h3>
            <p>Add professional transitions to enhance the flow and impact of your videos.</p>
          </div>
          <div className="feature-card">
            <FaFont className="feature-icon" />
            <h3>Customizable Text</h3>
            <p>Enhance your videos with stylish text, customizable fonts, colors, and borders.</p>
          </div>
          <div className="feature-card">
            <FaMusic className="feature-icon" />
            <h3>Add Music & Images</h3>
            <p>Incorporate music and images into your timeline for a richer storytelling experience.</p>
          </div>
          <div className="feature-card">
            <FaRobot className="feature-icon" />
            <h3>AI Subtitles</h3>
            <p>Generate accurate, customizable subtitles automatically with our AI-powered tool.</p>
          </div>
          <div className="feature-card">
            <FaFilm className="feature-icon" />
            <h3>Apply Filters</h3>
            <p>Enhance your videos with a variety of filters to achieve the perfect look.</p>
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
            Scenith is more than just a video editor—it's a platform designed to empower creators like you. Whether you're crafting content for YouTube, Instagram, TikTok, or personal projects, Scenith provides professional-grade tools in an intuitive interface. Our mission is to make video editing accessible, efficient, and fun, so you can focus on telling stories that captivate and inspire. Join thousands of creators who trust Scenith to bring their visions to life.
          </p>
          <button
            className="motivation-cta"
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/signup')}
          >
            Start Your Creative Journey
          </button>
        </motion.div>
      </section>

      <footer className="footer" id="footer-section">
        <motion.div
          className="footer-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="footer-subtitle">Get in Touch</h3>
          <p>
            <FaEnvelope className="footer-icon" />{' '}
            <a href="mailto:scenith.spprt@gmail.com">scenith.spprt@gmail.com</a>
          </p>
          <div className="social-links">
            <a href="https://x.com/scenith_1902/" target="_blank" rel="noopener noreferrer" className="social-link">
              <img src="/images/X_logo.png" alt="X" className="social-icon" />
            </a>
            <a
              href="https://www.instagram.com/scenith.labs/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src="/images/Instagram_logo.png" alt="Instagram" className="social-icon" />
            </a>
            <a
              href="https://linkedin.com/company/scenith/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src="/images/LinkedIn_logo.png" alt="LinkedIn" className="social-icon" />
            </a>
            <a
              href="https://www.youtube.com/@Scenith-f4n"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src="/images/Youtube_logo.png" alt="YouTube" className="social-icon" />
            </a>
          </div>
          <p className="footer-note">© 2025 Scenith. All rights reserved.</p>
        </motion.div>
      </footer>
    </div>
  );
};

export default LandingPage;
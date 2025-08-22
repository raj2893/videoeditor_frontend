import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaCut, FaMusic, FaFont, FaFilm, FaRobot } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../Config';
import '../CSS/LandingPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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
                  window.location.href = '/blogs/how-to-reach-4000-hours-of-watch-time';
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

      <Footer />
    </div>
  );
};

export default LandingPage;
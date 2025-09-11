// Footer.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import '../CSS/Footer.css';

const Footer = () => {
  const navigate = useNavigate();

  // Navigation links for the footer
  const navigationLinks = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Background Removal', href: 'https:scenith.in/background-removal' }
  ];

  // Resource links (specific blog posts and tutorials)
  const resourceLinks = [
    {
      label: 'Blogs',
      href: 'https://scenith.in/blogs'
    },
    { 
      label: 'How to Create a Video Editing Project in Scenith', 
      href: 'https://scenith.in/blogs/how-to-create-video-editing-project' 
    }, 
    { 
      label: 'How to Upload and Organize Media in Scenith', 
      href: 'https://scenith.in/blogs/how-to-upload-media-for-editing' 
    },
    { 
      label: 'How to use LAYERS in Video Editing', 
      href: 'https://scenith.in/blogs/how-to-use-layers-in-video-editing' 
    },    
    { 
      label: 'How to Add Subtitles', 
      href: 'https://scenith.in/blogs/how-to-add-subtitles-to-video' 
    },
    {
      label: 'Remove Background from Images for FREE!',
      href: 'https://scenith.in/blogs/ai-background-remover'
    },
    {
      label: 'Generate 45+ AI Voices for FREE!',
      href: 'https://scenith.in/blogs/how-to-generate-ai-voices'
    },    
    { 
      label: 'How to reach 4000 Hours of Watch Time on YouTube', 
      href: 'https://scenith.in/blogs/how-to-reach-4000-hours-watch-time' 
    },
    { 
      label: '3 Video Editing Hacks to create Viral Content', 
      href: 'https://scenith.in/blogs/3-video-editing-hacks' 
    },    
    { label: 'Tutorials', path: '/', sectionId: 'tutorials-section' },
  ];

  // Support links
  const supportLinks = [
    { label: 'Contact Us', path: '/', sectionId: 'footer-section' },
    { label: 'Support Email', href: 'mailto:scenith.spprt@gmail.com' },
  ];

  // Company links
  const companyLinks = [
    { label: 'About Us', path: '/' }, // Placeholder for future About page
  ];

  // Handle navigation for internal links with paths or section IDs
  const handleNavigation = (path, sectionId) => {
    if (path) {
      navigate(path);
      if (!sectionId) {
        window.scrollTo(0, 0); // Scroll to top for new pages
      }
    }
    if (sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        const navBar = document.querySelector('.nav-bar');
        const navHeight = navBar ? navBar.offsetHeight : 80;
        window.scrollTo({
          top: section.offsetTop - navHeight - 20,
          behavior: 'smooth',
        });
      }
    }
  };

  // Handle external navigation for blog links
  const handleExternalNavigation = (href) => {
    window.location.href = href; // Redirect to external URL
  };

  return (
    <footer className="footer" id="footer-section">
      <motion.div
        className="footer-content"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="footer-grid">
          {/* Company Info */}
          <div className="footer-column company-info">
            <h3 className="footer-subtitle">Scenith</h3>
            <p className="company-description">
              Scenith is your go-to platform for powerful, intuitive video editing. Create stunning videos with AI-powered tools, dynamic transitions, and more. Join creators worldwide in bringing your stories to life.
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
          </div>

          {/* Navigation Links */}
          <div className="footer-column">
            <h3 className="footer-subtitle">Navigation</h3>
            <ul className="footer-links">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <button
                    className="footer-link"
                    onClick={() => handleNavigation(link.path, link.sectionId)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-column">
            <h3 className="footer-subtitle">Resources</h3>
            <ul className="footer-links">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <button
                      className="footer-link"
                      onClick={() => handleExternalNavigation(link.href)}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <button
                      className="footer-link"
                      onClick={() => handleNavigation(link.path, link.sectionId)}
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-column">
            <h3 className="footer-subtitle">Support</h3>
            <ul className="footer-links">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <a href={link.href} className="footer-link">
                      {link.label}
                    </a>
                  ) : (
                    <button
                      className="footer-link"
                      onClick={() => handleNavigation(link.path, link.sectionId)}
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="footer-column">
            <h3 className="footer-subtitle">Company</h3>
            <ul className="footer-links">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <button
                    className="footer-link"
                    onClick={() => handleNavigation(link.path, link.sectionId)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="footer-column newsletter">
            <h3 className="footer-subtitle">Stay Updated</h3>
            <p>Subscribe to our newsletter for tips, updates, and exclusive offers.</p>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-button">
                <FaPaperPlane /> Subscribe
              </button>
            </form>
          </div>
        </div>

        <p className="footer-note">
          © 2025 Scenith. All rights reserved. |{' '}
          <a href="mailto:scenith.spprt@gmail.com" className="footer-link">
            <FaEnvelope className="footer-icon" /> scenith.spprt@gmail.com
          </a>
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;
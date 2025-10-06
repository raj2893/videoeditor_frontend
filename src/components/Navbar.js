// Navbar.js
import React, { useState } from 'react';
import { href, useNavigate } from 'react-router-dom';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';
import '../CSS/Navbar.css';

const Navbar = ({ isScrolled, userProfile, isLoggedIn, handleLogout, scrollToSection, pageType }) => {
  const navigate = useNavigate();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  const toggleNavMenu = () => {
    setIsNavMenuOpen(!isNavMenuOpen);
  };

  const toggleToolsDropdown = () => {
    setIsToolsDropdownOpen(!isToolsDropdownOpen);
  };  

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleImageError = (e) => {
    console.error('Failed to load profile image');
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const navLinks = {
    landing: [
      { 
        label: 'Tools', 
        isDropdown: true,
        dropdownItems: [
          { label: 'AI Voices', href: 'https://scenith.in/tools/ai-voice-generation' },
          { label: 'AI Subtitle Generator', href: 'https://scenith.in/tools/video-speed-modifier' },
          { label: 'Background Remover', href: 'https://scenith.in/tools/background-removal' },
          { label: 'Video Speed Modifier', href: 'https://scenith.in/tools/video-speed-modifier' },
          { label: 'Video Color Grading', href: 'https://scenith.in/tools/apply-filters-to-videos' },
          { label: 'Media Compression', href: 'https://scenith.in/tools/compress-media' }
        ]
      },
      { label: 'Blogs', sectionId: 'blog-section' },
      { label: 'Contact Us', sectionId: 'footer-section' },
      { label: 'Dashboard', path: '/dashboard' },
    ],
    dashboard: [
      { label: 'My Projects', sectionId: 'dashboard-section' },
      { 
        label: 'Tools', 
        isDropdown: true,
        dropdownItems: [
          { label: 'AI Voices', href: 'https://scenith.in/tools/ai-voice-generation' },
          { label: 'AI Subtitle Generator', href: 'https://scenith.in/tools/add-subtitles-to-videos' },
          { label: 'Background Remover', href: 'https://scenith.in/tools/background-removal' },
          { label: 'Video Speed Modifier', href: 'https://scenith.in/tools/video-speed-modifier' },
          { label: 'Video Color Grading', href: 'https://scenith.in/tools/apply-filters-to-videos' },
          { label: 'Media Compression', href: 'https://scenith.in/tools/compress-media' }
        ]
      },
      { label: 'Blogs', href: 'https://scenith.in/blogs' },
      { label: 'Contact Us', sectionId: 'footer-section' },
    ],
  };

  const links = navLinks[pageType] || navLinks.landing;

  return (
    <nav className={`nav-bar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-content">
        <div className="branding-container" onClick={() => navigate('/')}>
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
          {links.map((link) => (
            <div key={link.label} className="nav-item">
              {link.isDropdown ? (
                <>
                  <button
                    type="button"
                    className="nav-link dropdown-trigger"
                    onMouseEnter={() => setIsToolsDropdownOpen(true)}
                    onMouseLeave={() => setIsToolsDropdownOpen(false)}
                    onClick={toggleToolsDropdown}
                  >
                    {link.label}
                  </button>
                  {isToolsDropdownOpen && (
                    <div 
                      className="tools-dropdown"
                      onMouseEnter={() => setIsToolsDropdownOpen(true)}
                      onMouseLeave={() => setIsToolsDropdownOpen(false)}
                    >
                      {link.dropdownItems.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className="tools-dropdown-item"
                          onClick={() => {
                            if (item.href) {
                              window.location.href = item.href;
                            } else if (item.path) {
                              navigate(item.path);
                            } else if (scrollToSection && item.sectionId) {
                              scrollToSection(item.sectionId);
                            }
                            setIsToolsDropdownOpen(false);
                            setIsNavMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="nav-link"
                  onClick={() => {
                    if (link.href) {
                      window.location.href = link.href;
                      setIsNavMenuOpen(false);
                    } else if (link.path) {
                      navigate(link.path);
                      setIsNavMenuOpen(false);
                    } else if (scrollToSection && link.sectionId) {
                      scrollToSection(link.sectionId);
                      setIsNavMenuOpen(false);
                    }
                  }}
                >
                  {link.label}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="header-container profile-section">
          {isLoggedIn && userProfile.email ? (
            <>
              <div className="profile-icon" onClick={toggleProfileDropdown}>
                {userProfile.picture ? (
                  <>
                    <img
                      src={userProfile.picture}
                      alt="Profile"
                      className="profile-picture"
                      onError={handleImageError}
                      crossOrigin="anonymous"
                    />
                    <div className="default-profile-icon" style={{ display: 'none' }}>
                      {userProfile.firstName && userProfile.firstName.length > 0
                        ? userProfile.firstName.charAt(0).toUpperCase()
                        : 'U'}
                    </div>
                  </>
                ) : (
                  <div className="default-profile-icon">
                    {userProfile.firstName && userProfile.firstName.length > 0
                      ? userProfile.firstName.charAt(0).toUpperCase()
                      : 'U'}
                  </div>
                )}
              </div>
              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <div className="profile-avatar">
                      {userProfile.picture ? (
                        <>
                          <img
                            src={userProfile.picture}
                            alt="Profile"
                            className="dropdown-profile-picture"
                            onError={handleImageError}
                            crossOrigin="anonymous"
                          />
                          <div className="dropdown-default-avatar" style={{ display: 'none' }}>
                            {userProfile.firstName && userProfile.firstName.length > 0
                              ? userProfile.firstName.charAt(0).toUpperCase()
                              : 'U'}
                          </div>
                        </>
                      ) : (
                        <div className="dropdown-default-avatar">
                          {userProfile.firstName && userProfile.firstName.length > 0
                            ? userProfile.firstName.charAt(0).toUpperCase()
                            : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="profile-info">
                      <div className="profile-name">
                        {(userProfile.firstName || userProfile.lastName)
                          ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
                          : 'Unknown User'}
                      </div>
                      <div className="profile-email">{userProfile.email}</div>
                      {userProfile.googleAuth && <div className="profile-google-badge">Google</div>}
                    </div>
                  </div>
                  <div className="profile-divider"></div>
                  <div className="profile-dropdown-item logout-item" onClick={handleLogout}>
                    <FaSignOutAlt className="dropdown-icon" /> Logout
                  </div>
                </div>
              )}
            </>
          ) : (
            <button className="login-button" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
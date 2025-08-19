// Navbar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ isScrolled, userProfile, isLoggedIn, handleLogout, scrollToSection, pageType }) => {
  const navigate = useNavigate();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const toggleNavMenu = () => {
    setIsNavMenuOpen(!isNavMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleImageError = (e) => {
    console.error('Failed to load profile image');
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  // Define nav links for LandingPage and Dashboard
  const navLinks = {
    landing: [
      { label: 'Home', sectionId: 'hero-section' },
      { label: 'Background Remover', path: '/background-removal' },
      { label: 'Features', sectionId: 'features-section' },
      { label: 'Tutorials', sectionId: 'tutorials-section' },
      { label: 'Blogs', sectionId: 'blog-section' },
      { label: 'Contact Us', sectionId: 'footer-section' },
      { label: 'Dashboard', path: '/dashboard' },
    ],
    dashboard: [
      { label: 'My Projects', sectionId: 'dashboard-section' },
      { label: 'Background Remover', path: '/background-removal' },
      { label: 'Blogs', path: '/blogs' },
      { label: 'About Us', sectionId: 'about-us-section' },
      { label: 'Contact Us', sectionId: 'contact-us-section' },
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
            <button
              key={link.label}
              type="button"
              className="nav-link"
              onClick={() => {
                if (link.path) {
                  navigate(link.path);
                  setIsNavMenuOpen(false);
                } else if (scrollToSection) {
                  scrollToSection(link.sectionId);
                }
              }}
            >
              {link.label}
            </button>
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
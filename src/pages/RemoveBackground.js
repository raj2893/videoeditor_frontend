import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import BackgroundRemoval from '../components/BackgroundRemoval';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../Config';
import '../CSS/RemoveBackground.css';

const RemoveBackground = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
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

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication status
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
            navigate('/login');
          }
        }
      } else {
        setIsLoggedIn(false);
        navigate('/login'); // Redirect to login if no token
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, [navigate]);

  // Handle smooth scrolling for section links
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
    }, 150);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="remove-background-page">
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
        pageType="background-removal"
      />
      <BackgroundRemoval />
      <Footer />
    </div>
  );
};

export default RemoveBackground;
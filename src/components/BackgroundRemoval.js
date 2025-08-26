import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaUpload, FaSpinner, FaDownload, FaTimes } from 'react-icons/fa';
import { API_BASE_URL, CDN_URL } from '../Config';
import '../CSS/BackgroundRemoval.css';

const BackgroundRemoval = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedImage, setProcessedImage] = useState(null); // Store full StandaloneImage object
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [imageId, setImageId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      axios
        .get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUserId(res.data.id);
        })
        .catch(() => {
          navigate('/login');
        });
    }
  }, [navigate]);

  // Debug status changes
  useEffect(() => {
    console.log('Current status:', status);
  }, [status]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log('File selected:', file); // Debug file selection
    if (file && ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedImage(null);
      setStatus('idle');
      setErrorMessage('');
    } else {
      setErrorMessage('Please select a valid image file (PNG, JPEG, or JPG).');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select an image first.');
      return;
    }

    setStatus('uploading');
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/standalone-images/remove-background`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Upload response:', response.data); // Debug response
      setImageId(response.data.id);
      setStatus('processing');

      // Poll for status
      const pollStatus = async () => {
        try {
          const token = localStorage.getItem('token');
          const pollResponse = await axios.get(
            `${API_BASE_URL}/api/standalone-images/user-images`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const image = pollResponse.data.find((img) => img.id === imageId);
          console.log('Poll response:', image);
          if (image) {
            if (image.status === 'SUCCESS') {
              setPreviewUrl(image.originalPresignedUrl); // Use pre-signed URL for preview
              setProcessedImage({
                ...image,
                downloadUrl: image.processedPresignedUrl, // Use pre-signed URL for download
              });
              setStatus('success');
            } else if (image.status === 'FAILED') {
              setStatus('error');
              setErrorMessage(image.errorMessage || 'Background removal failed.');
            } else {
              setTimeout(pollStatus, 2000);
            }
          } else {
            setStatus('error');
            setErrorMessage('Image not found in polling response.');
          }
        } catch (error) {
          console.error('Polling error:', error);
          setStatus('error');
          setErrorMessage(
            'Error checking processing status: ' +
              (error.response?.data?.message || error.message)
          );
        }
      };
      setTimeout(pollStatus, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setErrorMessage(
        'Failed to upload image: ' + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDownload = async () => {
    if (!processedImage || !processedImage.processedPresignedUrl) {
      setErrorMessage('No processed image available for download.');
      setStatus('error');
      return;
    }

    try {
      const response = await fetch(processedImage.processedPresignedUrl, {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = processedImage.processedFileName || 'background-removed-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
  
      console.log('Image downloaded successfully:', processedImage.processedFileName);
    } catch (error) {
      console.error('Error downloading image:', error);
      setErrorMessage('Failed to download image. Please try again.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedImage(null);
    setStatus('idle');
    setErrorMessage('');
    setImageId(null);
  };

  return (
    <div className="background-removal-page">
      <div className="particle-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <motion.section
        className="background-removal-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1>Remove Background from Your Image</h1>
        <p>Upload an image and remove its background with a single click. Perfect for creating clean, professional visuals.</p>
        <div className="upload-container">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="file-input"
            id="image-upload"
            disabled={status === 'uploading' || status === 'processing'}
          />
          <label htmlFor="image-upload" className="upload-button">
            <FaUpload className="upload-icon" />
            {selectedFile ? 'Change Image' : 'Select Image'}
          </label>

          <button
            className="process-button"
            onClick={handleRemoveBackground}
            disabled={status === 'uploading' || status === 'processing' || !selectedFile}
          >
            Remove Background
          </button>
          {status === 'uploading' && (
            <div className="status-message">
              <FaSpinner className="spinner" />
              Uploading image...
            </div>
          )}
          {status === 'processing' && (
            <div className="status-message">
              <FaSpinner className="spinner" />
              Processing image...
            </div>
          )}
          {status === 'error' && <div className="error-message">{errorMessage}</div>}
        </div>
        {(previewUrl || processedImage) && (
          <div className="image-preview-container">
            {previewUrl && (
              <div className="image-card">
                <h3>Original Image</h3>
                <img src={previewUrl} alt="Original" className="preview-image" />
              </div>
            )}
            {processedImage && (
              <div className="image-card">
                <h3>Background Removed</h3>
                <img
                  src={processedImage.processedPresignedUrl || processedImage.processedCdnUrl}
                  alt="Processed"
                  className="preview-image"
                />
                <button className="download-button" onClick={handleDownload}>
                  <FaDownload className="download-icon" />
                  Download
                </button>
              </div>
            )}
            {(previewUrl || processedImage) && (
              <button className="reset-button" onClick={handleReset}>
                <FaTimes className="reset-icon" />
                Reset
              </button>
            )}
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default BackgroundRemoval;
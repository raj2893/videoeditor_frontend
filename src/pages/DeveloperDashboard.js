// src/pages/DeveloperDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CSS/DeveloperDashboard.css';

const API_BASE_URL = 'https://videoeditor-app.onrender.com';

const DeveloperDashboard = () => {
  const [elements, setElements] = useState([]);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing elements
  useEffect(() => {
    fetchElements();
  }, []);

  const fetchElements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/developer/elements`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setElements(response.data);
    } catch (err) {
      console.error('Error fetching elements:', err);
      setError('Failed to load elements.');
    }
  };

  const handleElementUpload = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (title) formData.append('title', title);
    if (type) formData.append('type', type);
    if (category) formData.append('category', category);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/developer/elements/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setElements([...elements, ...response.data]);
      setFiles([]);
      setTitle('');
      setType('');
      setCategory('');
      alert('Elements uploaded successfully!');
    } catch (err) {
      console.error('Error uploading elements:', err);
      setError(err.response?.data?.message || 'Failed to upload elements.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  return (
    <div className="developer-dashboard">
      <h2>Developer Dashboard</h2>
      <div className="upload-section">
        <h3>Upload Global Elements</h3>
        <form onSubmit={handleElementUpload}>
          <div className="form-group">
            <label htmlFor="files">Select Files (PNG, JPEG, GIF, WEBP)</label>
            <input
              type="file"
              id="files"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleFileChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="title">Title (Optional)</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter element title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="type">Type (Optional)</label>
            <input
              type="text"
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g., sticker"
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category (Optional)</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., General"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="upload-button" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Elements'}
          </button>
        </form>
      </div>
      <div className="elements-section">
        <h3>Global Elements</h3>
        {elements.length === 0 ? (
          <p>No elements uploaded yet.</p>
        ) : (
          <div className="elements-grid">
            {elements.map((element) => (
              <div key={element.id} className="element-card">
                <img src={`${API_BASE_URL}${element.filePath}`} alt={element.title} />
                <p>{element.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperDashboard;
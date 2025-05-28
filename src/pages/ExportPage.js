import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../CSS/ExportPage.css';
import { API_BASE_URL } from '../Config';

const ExportPage = () => {
  const { projectId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const sessionId = state?.sessionId;
  const [exportStatus, setExportStatus] = useState('ready'); // 'ready', 'exporting', 'success', 'error'
  const [downloadLink, setDownloadLink] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const exportLock = useRef(null); // Prevent concurrent exports
  const requestIdRef = useRef(crypto.randomUUID()); // Unique ID for each export attempt

  // Log component mount/unmount
  useEffect(() => {
    console.log('ExportPage mounted', { projectId, sessionId, requestId: requestIdRef.current, timestamp: Date.now() });
    return () => {
      console.log('ExportPage unmounted', { projectId, sessionId, requestId: requestIdRef.current, timestamp: Date.now() });
    };
  }, [projectId, sessionId]);

  const startExport = async () => {
    if (exportLock.current) {
      console.log('Export already in progress, skipping', { requestId: requestIdRef.current, timestamp: Date.now() });
      return;
    }

    if (!projectId || !sessionId) {
      console.error('Missing projectId or sessionId', { projectId, sessionId });
      setExportStatus('error');
      setErrorMessage('Missing project ID or session ID');
      return;
    }

    setExportStatus('exporting');
    const requestId = requestIdRef.current;
    console.log('startExport called', { projectId, requestId, timestamp: Date.now() });

    exportLock.current = (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing');
        }

        console.log('Calling export API', { projectId, requestId, timestamp: Date.now() });
        const exportResponse = await axios.post(
          `${API_BASE_URL}/projects/${projectId}/export`,
          { requestId }, // Include requestId in body for backend tracking
          {
            params: { sessionId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log('Export API response:', exportResponse.data, { requestId, timestamp: Date.now() });
        const exportedFileName = exportResponse.data;

        const pollExportLinks = async () => {
          for (let attempt = 0; attempt < 30; attempt++) {
            try {
              const linksResponse = await axios.get(`${API_BASE_URL}/export-links`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              const exportLinks = linksResponse.data;
              const matchingLink = exportLinks.find(
                (link) => link.fileName === exportedFileName
              );

              if (matchingLink && matchingLink.downloadLink) {
                console.log('Download link found:', matchingLink.downloadLink, { requestId, timestamp: Date.now() });
                setDownloadLink(matchingLink.downloadLink);
                setExportStatus('success');
                return;
              }
            } catch (error) {
              console.error('Error polling export links (attempt', attempt, '):', error);
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          console.error('Export timed out after 30 attempts', { requestId, timestamp: Date.now() });
          setExportStatus('error');
          setErrorMessage('Export timed out. Please try again.');
        };

        await pollExportLinks();
      } catch (error) {
        console.error('Export error:', error.response?.data || error.message, { requestId, timestamp: Date.now() });
        setExportStatus('error');
        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            'Failed to export project. Please try again.'
        );
      }
    })().finally(() => {
      console.log('Export lock released', { requestId, timestamp: Date.now() });
      exportLock.current = null;
    });
  };

  const handleDownload = () => {
    if (downloadLink) {
      console.log('Initiating download for link:', downloadLink, { requestId: requestIdRef.current, timestamp: Date.now() });
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleBack = () => {
    console.log('Navigating back to editor for project', projectId, { requestId: requestIdRef.current, timestamp: Date.now() });
    navigate(`/projecteditor/${projectId}`);
  };

  return (
    <div className="export-page">
      <div className="export-container">
        {exportStatus === 'ready' && (
          <>
            <h2>Ready to Export</h2>
            <p>Click below to start exporting your video.</p>
            <button
              className="export-button"
              onClick={startExport}
              disabled={exportLock.current}
            >
              Start Export
            </button>
            <button className="back-button" onClick={handleBack}>
              Back to Editor
            </button>
          </>
        )}
        {exportStatus === 'exporting' && (
          <>
            <div className="loading-spinner"></div>
            <h2>Exporting Your Video</h2>
            <p>Please wait while we process your project...</p>
          </>
        )}
        {exportStatus === 'success' && (
          <>
            <h2>Export Complete!</h2>
            <p>Your video is ready to download.</p>
            <button
              className="download-button"
              onClick={handleDownload}
              title="Download Video"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="download-icon"
              >
                <path
                  d="M12 2L12 14M12 14L8 10M12 14L16 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download Video
            </button>
            <button className="back-button" onClick={handleBack}>
              Back to Editor
            </button>
          </>
        )}
        {exportStatus === 'error' && (
          <>
            <h2>Export Failed</h2>
            <p>{errorMessage}</p>
            <button className="export-button" onClick={startExport}>
              Retry Export
            </button>
            <button className="back-button" onClick={handleBack}>
              Back to Editor
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportPage;
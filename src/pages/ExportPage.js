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
    const [exportStatus, setExportStatus] = useState('ready');
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [taskId, setTaskId] = useState(null);
    const exportLock = useRef(null);
    const pollingRef = useRef(null);
    const requestIdRef = useRef(crypto.randomUUID());

    useEffect(() => {
        console.log('ExportPage mounted', { projectId, sessionId, requestId: requestIdRef.current, timestamp: Date.now() });
        return () => {
            console.log('ExportPage unmounted', { projectId, sessionId, requestId: requestIdRef.current, timestamp: Date.now() });
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                console.log('Polling stopped on unmount', { requestId: requestIdRef.current });
            }
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
                const exportResponse = await axios.get(
                    `${API_BASE_URL}/projects/${projectId}/export`,
                    {
                        params: { sessionId, requestId },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                console.log('Export API response:', exportResponse.data, { requestId, timestamp: Date.now() });
                const { taskId, fileName, downloadUrl, message } = exportResponse.data;

                if (!taskId) {
                    throw new Error('Task ID not provided in export response');
                }

                console.log('Export task queued:', { taskId, fileName, downloadUrl, message, requestId, timestamp: Date.now() });
                setTaskId(taskId);
                setDownloadUrl(downloadUrl);
                setExportStatus('queued');

                // Start polling task status
                pollTaskStatus(taskId, token, requestId);
            } catch (error) {
                console.error('Export error:', error.response?.data || error.message, { requestId, timestamp: Date.now() });
                const errorMsg = error.response?.data?.message ||
                                 error.response?.data ||
                                 error.message ||
                                 'Failed to queue export task. Please try again.';
                setExportStatus('error');
                setErrorMessage(errorMsg);
            } finally {
                console.log('Export lock released', { requestId, timestamp: Date.now() });
                exportLock.current = null;
            }
        })();
    };

    const pollTaskStatus = (taskId, token, requestId) => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }

        pollingRef.current = setInterval(async () => {
            try {
                console.log('Polling task status', { taskId, requestId, timestamp: Date.now() });
                const statusResponse = await axios.get(
                    `${API_BASE_URL}/projects/task/${taskId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                console.log('Task status response:', statusResponse.data, { requestId, timestamp: Date.now() });
                const { status, downloadUrl: updatedDownloadUrl, errorMessage } = statusResponse.data;

                if (status === 'QUEUED') {
                    setExportStatus('queued');
                } else if (status === 'PROCESSING') {
                    setExportStatus('exporting');
                } else if (status === 'COMPLETED') {
                    setExportStatus('success');
                    setDownloadUrl(updatedDownloadUrl || downloadUrl);
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    console.log('Polling stopped: Task completed', { taskId, requestId, timestamp: Date.now() });
                } else if (status === 'FAILED') {
                    setExportStatus('error');
                    setErrorMessage(errorMessage || 'Export task failed. Please try again.');
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    console.log('Polling stopped: Task failed', { taskId, requestId, timestamp: Date.now() });
                }
            } catch (error) {
                console.error('Task status polling error:', error.response?.data || error.message, { requestId, timestamp: Date.now() });
                setExportStatus('error');
                setErrorMessage('Failed to check task status. Please try again.');
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        }, 5000); // Poll every 5 seconds
    };

    const handleDownload = () => {
        if (downloadUrl) {
            console.log('Initiating download for URL:', downloadUrl, { requestId: requestIdRef.current, timestamp: Date.now() });
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleBack = () => {
        console.log('Navigating back to editor for project', projectId, { requestId: requestIdRef.current, timestamp: Date.now() });
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            console.log('Polling stopped on navigation', { requestId: requestIdRef.current });
        }
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
                            disabled={!!exportLock.current}
                        >
                            Start Export
                        </button>
                        <button className="back-button" onClick={handleBack}>
                            Back to Editor
                        </button>
                    </>
                )}
                {exportStatus === 'queued' && (
                    <>
                        <div className="loading-spinner"></div>
                        <h2>Export Task Queued</h2>
                        <p>Your export task is in the queue. Please wait...</p>
                        <button className="back-button" onClick={handleBack}>
                            Back to Editor
                        </button>
                    </>
                )}
                {exportStatus === 'exporting' && (
                    <>
                        <div className="loading-spinner"></div>
                        <h2>Exporting Your Video</h2>
                        <p>Your video is being processed. This may take a few minutes...</p>
                        <button className="back-button" onClick={handleBack}>
                            Back to Editor
                        </button>
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
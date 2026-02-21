import React, { useState, useRef, useEffect } from 'react';
import './CameraCapture.css';

/**
 * 📸 Camera Capture Component - Redesigned for Better Mobile UX
 * 
 * Features:
 * - Large, visible capture button
 * - Clear 3-step flow: Camera → Capture → Preview → Submit
 * - Mobile-first responsive design
 * - Retake functionality
 * - Better visual hierarchy
 * - No external dependencies
 */
const CameraCapture = ({ onCapture, onClose, requesterName = 'Agent' }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // Start with back camera
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions.');
      setCameraActive(false);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const sendPhoto = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="camera-capture-wrapper">
      {/* Header Banner */}
      <div className="camera-header-banner">
        <div className="camera-header-content">
          <div className="camera-icon-badge">📸</div>
          <div className="camera-header-text">
            <h3 className="camera-title">Camera Capture</h3>
            <p className="camera-subtitle">{requesterName} requested a photo</p>
          </div>
        </div>
        <button className="camera-close-button" onClick={handleClose}>
          <span>✕</span>
        </button>
      </div>

      {/* Camera View Area */}
      <div className="camera-view-container">
        {error ? (
          <div className="camera-error-state">
            <div className="error-icon-large">📷</div>
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={startCamera}>
              🔄 Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="camera-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading camera...</p>
          </div>
        ) : capturedImage ? (
          // Preview Mode
          <div className="camera-preview-mode">
            <div className="preview-image-wrapper">
              <img src={capturedImage} alt="Captured" className="preview-image" />
              <div className="preview-badge">Preview</div>
            </div>
          </div>
        ) : (
          // Live Camera Mode
          <div className="camera-live-mode">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video-feed"
            />
            <div className="camera-overlay">
              <div className="camera-frame"></div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="camera-action-section">
        {capturedImage ? (
          // Preview Mode Actions
          <div className="preview-actions">
            <button className="action-button retake-button" onClick={retakePhoto}>
              <span className="button-icon">🔄</span>
              <span className="button-text">Retake</span>
            </button>
            <button className="action-button submit-button" onClick={sendPhoto}>
              <span className="button-icon">✓</span>
              <span className="button-text">Submit Photo</span>
            </button>
          </div>
        ) : (
          // Camera Mode Actions
          <div className="camera-actions">
            <button 
              className="flip-camera-button" 
              onClick={toggleCamera}
              disabled={!cameraActive}
            >
              <span className="flip-icon">🔄</span>
              <span className="flip-text">Flip</span>
            </button>
            
            <button 
              className="capture-button-main" 
              onClick={capturePhoto}
              disabled={!cameraActive}
            >
              <div className="capture-button-inner">
                <div className="capture-ring"></div>
                <div className="capture-center"></div>
              </div>
            </button>

            <div className="placeholder-space"></div>
          </div>
        )}
      </div>

      {/* Instruction Text */}
      {!capturedImage && !error && (
        <div className="camera-instructions">
          <p>📸 Position and tap the button to capture</p>
        </div>
      )}
      
      {capturedImage && (
        <div className="camera-instructions success">
          <p>✓ Photo captured! Review and submit or retake</p>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;

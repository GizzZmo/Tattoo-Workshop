import { useState, useRef } from 'react'

function ImageCapture({ onImageCapture, onCancel }) {
  const [mode, setMode] = useState(null); // 'webcam', 'upload', or null
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode('webcam');
    } catch (error) {
      alert('Failed to access webcam. Please check permissions.');
      console.error('Webcam error:', error);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
        handleImageFile(file);
      }, 'image/jpeg', 0.9);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setMode(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageCapture(e.target.result);
      stopWebcam();
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    stopWebcam();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: '#2a2a2a', 
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>📷 Capture or Upload Image</h3>
      
      {!mode && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn-primary" 
            onClick={startWebcam}
          >
            📸 Use Webcam
          </button>
          <button 
            type="button"
            className="btn-primary" 
            onClick={() => setMode('upload')}
          >
            📁 Upload File / Scanner
          </button>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}

      {mode === 'webcam' && (
        <div>
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              borderRadius: '4px',
              marginBottom: '1rem',
              display: 'block'
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button"
              className="btn-success" 
              onClick={capturePhoto}
            >
              📸 Capture Photo
            </button>
            <button 
              type="button"
              className="btn-secondary" 
              onClick={stopWebcam}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileSelect}
            style={{ 
              display: 'block',
              marginBottom: '1rem',
              padding: '0.5rem',
              width: '100%'
            }}
          />
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => setMode(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageCapture

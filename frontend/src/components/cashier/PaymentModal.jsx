import React, { useState, useRef, useEffect } from 'react';
import './PaymentModal.css';

const formatPeso = (num) =>
  Number(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

// Compress captured photo so it saves fast in SQLite and localStorage
const compressCanvasOrImage = (source, width, height) => {
  const canvas = document.createElement('canvas');
  const maxDim = 650;
  let targetW = width;
  let targetH = height;

  if (targetW > targetH && targetW > maxDim) {
    targetH = Math.round((targetH * maxDim) / targetW);
    targetW = maxDim;
  } else if (targetH > maxDim) {
    targetW = Math.round((targetW * maxDim) / targetH);
    targetH = maxDim;
  }

  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/jpeg', 0.82);
};

export default function PaymentModal({ subtotal = 0, onClose, onComplete }) {
  const [method, setMethod] = useState('Cash');
  const [cashGiven, setCashGiven] = useState('');
  const [gcashRef, setGcashRef] = useState('');
  const [gcashImage, setGcashImage] = useState(null);

  // Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  const numericCash = parseFloat(cashGiven) || 0;
  const change = numericCash - subtotal;

  // Stop webcam/phone camera stream when modal closes or method switches
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  const handleSwitchMethod = (newMethod) => {
    stopCameraStream();
    setMethod(newMethod);
  };

  // Start Live Camera (or fallback to native phone camera on HTTP hotspot)
  const handleStartCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback for mobile browsers over HTTP hotspot
      nativeCameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      // If permission denied or blocked on HTTP mobile, open native phone camera
      nativeCameraInputRef.current?.click();
    }
  };

  // Capture frame from Live Video Stream
  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    const dataUrl = compressCanvasOrImage(video, w, h);
    setGcashImage(dataUrl);
    stopCameraStream();
  };

  // Capture from Native Mobile Camera / File Input Fallback
  const handleNativeFileCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const dataUrl = compressCanvasOrImage(img, img.width, img.height);
        setGcashImage(dataUrl);
        stopCameraStream();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (method === 'Cash' && numericCash < subtotal) {
      return alert('Cash tendered is less than the total amount due.');
    }
    if (method === 'GCash' && !gcashRef.trim() && !gcashImage) {
      return alert('Please enter the GCash Reference No. or capture a photo of the payment.');
    }

    stopCameraStream();
    onComplete({
      paymentMethod: method,
      cashGiven: method === 'Cash' ? numericCash : subtotal,
      change: method === 'Cash' ? change : 0,
      gcashRef:
        method === 'GCash'
          ? gcashRef.trim() || (gcashImage ? 'Photo Attached' : null)
          : null,
      gcashImage: method === 'GCash' ? gcashImage : null
    });
  };

  return (
    <div className="payment-modal-backdrop" onClick={onClose}>
      <div className="payment-modal-card" onClick={e => e.stopPropagation()}>
        {/* Hidden Native Camera Input for Mobile Phones */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeFileCapture}
          style={{ display: 'none' }}
        />

        <div className="payment-modal-header">
          <h3>Confirm Payment</h3>
          <button type="button" className="close-x-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="total-due-banner">
          <span>Total Amount Due</span>
          <h2>₱{formatPeso(subtotal)}</h2>
        </div>

        {/* Cash vs GCash Selector */}
        <div className="payment-method-selector">
          <button
            type="button"
            className={`method-card ${method === 'Cash' ? 'active-cash' : ''}`}
            onClick={() => handleSwitchMethod('Cash')}
          >
            <div>
              <strong>Cash</strong>
              <p>Physical bills</p>
            </div>
          </button>

          <button
            type="button"
            className={`method-card ${method === 'GCash' ? 'active-gcash' : ''}`}
            onClick={() => handleSwitchMethod('GCash')}
          >
            <div>
              <strong>GCash</strong>
              <p>Ref No. or Photo</p>
            </div>
          </button>
        </div>

        {method === 'Cash' ? (
          <div className="cash-payment-section">
            <div className="input-group">
              <label>Cash Tendered (₱)</label>
              <input
                type="number"
                step="any"
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="styled-input-lg"
              />
            </div>

            <div className="quick-cash-row">
              <button type="button" onClick={() => setCashGiven(String(subtotal))}>
                Exact
              </button>
              <button type="button" onClick={() => setCashGiven('100')}>
                ₱100
              </button>
              <button type="button" onClick={() => setCashGiven('200')}>
                ₱200
              </button>
              <button type="button" onClick={() => setCashGiven('500')}>
                ₱500
              </button>
              <button type="button" onClick={() => setCashGiven('1000')}>
                ₱1000
              </button>
            </div>

            <div className={`change-box ${change >= 0 ? 'valid' : 'invalid'}`}>
              <span>Change Due</span>
              <h3>₱{change >= 0 ? formatPeso(change) : '0.00'}</h3>
            </div>
          </div>
        ) : (
          <div className="gcash-payment-section">
            {/* Reference Number Input + Camera Trigger Row */}
            <div className="input-group">
              <label>GCash Reference No. or Capture Proof</label>
              <div className="gcash-input-cam-row">
                <input
                  type="text"
                  value={gcashRef}
                  onChange={e => setGcashRef(e.target.value)}
                  placeholder="Type Ref No. (optional if photo taken)"
                  className="styled-input-lg gcash-ref-input"
                />
                <button
                  type="button"
                  className={`cam-trigger-btn ${cameraActive || gcashImage ? 'active' : ''}`}
                  onClick={cameraActive ? stopCameraStream : handleStartCamera}
                  title="Capture GCash payment with camera"
                >
                  📷 {cameraActive ? 'Close' : 'Cam'}
                </button>
              </div>
            </div>

            {/* Live Camera Viewfinder */}
            {cameraActive && (
              <div className="gcash-camera-box">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="gcash-video-preview"
                />
                <div className="camera-controls-bar">
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    onClick={() => nativeCameraInputRef.current?.click()}
                  >
                    Use Phone Cam
                  </button>
                  <button
                    type="button"
                    className="capture-shutter-btn"
                    onClick={handleCaptureFrame}
                  >
                    ● Capture Payment
                  </button>
                </div>
              </div>
            )}

            {/* Captured GCash Receipt Photo Preview */}
            {!cameraActive && gcashImage && (
              <div className="gcash-captured-preview">
                <div className="captured-header">
                  <span>✓ GCash Payment Photo Attached</span>
                  <div className="captured-actions">
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={handleStartCamera}
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      className="btn-danger-sm"
                      onClick={() => setGcashImage(null)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <img src={gcashImage} alt="GCash Payment Proof" />
              </div>
            )}

            {cameraError && <p className="cam-error-text">{cameraError}</p>}
          </div>
        )}

        <div className="payment-modal-actions">
          <button type="button" onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="btn-confirm">
            Complete Payment
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef } from 'react';
import './ImageUploader.css';

export default function ImageUploader({ images = [], onChange, maxImages = 6 }) {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlBox, setShowUrlBox] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Compress and convert image file to Base64 data URL
  const processFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('File is not an image'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Could not load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    if (images.length + fileList.length > maxImages) {
      alert(`You can upload a maximum of ${maxImages} photos per listing.`);
    }

    const availableSlots = maxImages - images.length;
    const filesToProcess = fileList.slice(0, availableSlots);

    try {
      setUploading(true);
      const processed = await Promise.all(filesToProcess.map(processFile));
      onChange([...images, ...processed]);
    } catch (err) {
      console.error('Failed to process photos:', err);
      alert('One or more photos could not be processed. Please try another photo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const urls = urlInput.split(',').map((u) => u.trim()).filter(Boolean);
    if (images.length + urls.length > maxImages) {
      alert(`You can add a maximum of ${maxImages} photos.`);
    }
    const availableSlots = maxImages - images.length;
    const toAdd = urls.slice(0, availableSlots);
    onChange([...images, ...toAdd]);
    setUrlInput('');
    setShowUrlBox(false);
  };

  const handleRemove = (idxToRemove) => {
    const updated = images.filter((_, idx) => idx !== idxToRemove);
    onChange(updated);
  };

  return (
    <div className="image-uploader-container">
      <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Item Photos ({images.length}/{maxImages})</span>
        <button
          type="button"
          className="btn-link-sm"
          onClick={() => setShowUrlBox(!showUrlBox)}
        >
          {showUrlBox ? '✕ Hide Web Link' : '+ Add via Web Link'}
        </button>
      </label>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Dropzone */}
      <div
        className={`image-dropzone ${dragOver ? 'drag-over' : ''} ${images.length >= maxImages ? 'disabled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (images.length < maxImages && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <div className="dropzone-icon">📷</div>
        <div className="dropzone-text">
          <strong>Click to upload photos from device</strong>
          <span>or drag and drop them here</span>
        </div>
        <small className="dropzone-hint">
          Supports JPG, PNG, WEBP · Auto-compressed · Up to {maxImages} photos
        </small>
        {uploading && <div className="uploading-overlay">Optimizing photos…</div>}
      </div>

      {/* Optional URL input box */}
      {showUrlBox && (
        <div className="url-input-strip">
          <input
            className="input"
            placeholder="Paste image web URL (e.g. https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button type="button" className="btn btn-secondary" onClick={handleAddUrl}>
            Add Link
          </button>
        </div>
      )}

      {/* Thumbnail Gallery */}
      {images.length > 0 && (
        <div className="thumbnails-grid">
          {images.map((img, idx) => (
            <div key={idx} className="thumbnail-card">
              <img src={img} alt={`Item photo ${idx + 1}`} />
              {idx === 0 && <span className="cover-tag">Cover</span>}
              <button
                type="button"
                className="remove-photo-btn"
                title="Remove photo"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

export default function ImageGallery({ images = [], propertyName = '' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const safeImages = Array.isArray(images)
    ? images.filter(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('photo-1545324418-cc1a3fa10c00'))
    : [];

  if (safeImages.length === 0) {
    return (
      <div className="gallery-showcase-empty" style={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: 500
      }}>
        <span>No photos uploaded for this property</span>
      </div>
    );
  }

  const currentImage = safeImages[activeIndex] || safeImages[0];

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="gallery-showcase">
      {/* Main Large Image */}
      <div className="gallery-main-img">
        <img 
          src={currentImage} 
          alt={`${propertyName} - View ${activeIndex + 1}`} 
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />

        {/* Gallery Navigation Arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-nav-btn"
              style={{ left: '1rem' }}
              onClick={handlePrev}
              title="Previous Photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="gallery-nav-btn"
              style={{ right: '1rem' }}
              onClick={handleNext}
              title="Next Photo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Fullscreen Expand Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.8rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.78rem',
            fontWeight: 500,
            cursor: 'pointer',
            backdropFilter: 'blur(6px)'
          }}
        >
          <Maximize2 size={14} />
          <span>Expand Gallery ({activeIndex + 1}/{safeImages.length})</span>
        </button>
      </div>

      {/* Thumbnails Filmstrip */}
      {safeImages.length > 1 && (
        <div className="gallery-thumbnails">
          {safeImages.map((img, idx) => (
            <div
              key={idx}
              className={`gallery-thumb-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
            >
              <img 
                src={img} 
                alt={`${propertyName} thumb ${idx + 1}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="modal-backdrop" 
          onClick={() => setIsLightboxOpen(false)}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999, 
            background: 'rgba(5, 8, 16, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div 
            style={{ position: 'relative', maxWidth: '1100px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '-3rem',
                right: '0',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Lightbox Image */}
            <div style={{ position: 'relative', width: '100%', maxHeight: '80vh', display: 'flex', justifyContent: 'center' }}>
              <img
                src={currentImage}
                alt={propertyName}
                style={{ maxHeight: '80vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }}
              />

              {safeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-nav-btn"
                    style={{ left: '1rem' }}
                    onClick={handlePrev}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    className="gallery-nav-btn"
                    style={{ right: '1rem' }}
                    onClick={handleNext}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            <div style={{ color: '#fff', marginTop: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
              {propertyName} — Image {activeIndex + 1} of {safeImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

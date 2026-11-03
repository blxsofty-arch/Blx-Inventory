import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Plus, 
  Trash2, 
  Star, 
  Image as ImageIcon, 
  CheckCircle2, 
  Building2, 
  Sparkles, 
  Info, 
  Layers, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import { optimizeImageFile, MAX_IMAGES_PER_PROPERTY } from '../services/imageOptimizer';
import { api } from '../api/client';

const COMMON_AMENITIES_PRESETS = [
  'Clubhouse',
  'Infinity Swimming Pool',
  'Modern Gymnasium',
  '24/7 Security & CCTV',
  '100% DG Power Backup',
  'Children Play Area',
  'Landscaped Gardens',
  'EV Charging Station',
  'Badminton Court',
  'Tennis Court',
  'Jogging & Cycling Track',
  'Yoga & Meditation Deck'
];

export default function AddProperty({ onBack, onSave, initialData }) {
  const isEditing = Boolean(initialData?.id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    property_type: 'Apartment',
    configuration: '3 BHK',
    price: '',
    price_numeric: '',
    area: '',
    area_numeric: '',
    developer: 'BLX Curated Partner',
    status: 'Available',
    original_url: '',
    description: '',
    amenities: [],
    images: []
  });

  const [customAmenity, setCustomAmenity] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        location: initialData.location || '',
        property_type: initialData.property_type || 'Apartment',
        configuration: initialData.configuration || '3 BHK',
        price: initialData.price || '',
        price_numeric: initialData.price_numeric || '',
        area: initialData.area || '',
        area_numeric: initialData.area_numeric || '',
        developer: initialData.developer || 'BLX Curated Partner',
        status: initialData.status || 'Available',
        original_url: initialData.original_url || '',
        description: initialData.description || '',
        amenities: Array.isArray(initialData.amenities) ? initialData.amenities : [],
        images: Array.isArray(initialData.images) && initialData.images.length > 0
          ? initialData.images
          : []
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Amenities Handling
  const handleAddAmenity = (nameToAdd) => {
    const val = (nameToAdd || customAmenity).trim();
    if (!val) return;
    if (!formData.amenities.includes(val)) {
      setFormData((prev) => ({ ...prev, amenities: [...prev.amenities, val] }));
    }
    setCustomAmenity('');
  };

  const handleRemoveAmenity = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== indexToRemove)
    }));
  };

  const [isOptimizingImages, setIsOptimizingImages] = useState(false);

  // Direct File Upload Handling with Automatic Resize & Compression
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const validImageFiles = fileList.filter((f) => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      setErrorMessage('Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    setErrorMessage('');

    // Check maximum 5 images per property
    const currentCount = formData.images.length;
    const remainingSlots = Math.max(0, MAX_IMAGES_PER_PROPERTY - currentCount);

    if (remainingSlots <= 0) {
      setErrorMessage(`Maximum of ${MAX_IMAGES_PER_PROPERTY} photos reached. Please remove a photo to upload a new one.`);
      return;
    }

    let filesToProcess = validImageFiles;
    if (validImageFiles.length > remainingSlots) {
      filesToProcess = validImageFiles.slice(0, remainingSlots);
      setErrorMessage(`Only ${remainingSlots} photo(s) added (maximum of ${MAX_IMAGES_PER_PROPERTY} photos per property).`);
    }

    try {
      setIsOptimizingImages(true);
      // Step 1: Optimize/resize the image client-side to reduce bandwidth
      const optimizationPromises = filesToProcess.map((file) => optimizeImageFile(file));
      const optimizedResults = await Promise.all(optimizationPromises);

      // Step 2: Upload each optimized image to Supabase Storage via backend API
      const uploadedUrls = [];
      for (let i = 0; i < optimizedResults.length; i++) {
        const result = optimizedResults[i];
        const originalFile = filesToProcess[i];
        const ext = (originalFile.name || 'photo').split('.').pop() || 'jpg';
        const fileName = `prop_${Date.now()}_${i}.${ext}`;
        try {
          const uploaded = await api.uploadAsset(result.dataUrl, fileName, 'property-images');
          uploadedUrls.push(uploaded.url);
        } catch (uploadErr) {
          // If storage upload fails, fall back to keeping the optimized data URL
          console.warn('Could not upload to Supabase Storage, using optimized data URL as fallback');
          uploadedUrls.push(result.dataUrl);
        }
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (err) {
      console.error('Error processing photos:', err);
      setErrorMessage('Failed to process one or more photos. Please try again.');
    } finally {
      setIsOptimizingImages(false);
    }
  };

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleAddUrlImage = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (formData.images.length >= MAX_IMAGES_PER_PROPERTY) {
      setErrorMessage(`Maximum of ${MAX_IMAGES_PER_PROPERTY} photos reached. Remove a photo to add a new one.`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, trimmed]
    }));
    setUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove)
    }));
  };

  const handleSetCover = (indexToCover) => {
    if (indexToCover === 0) return;
    setFormData((prev) => {
      const selected = prev.images[indexToCover];
      const others = prev.images.filter((_, i) => i !== indexToCover);
      return {
        ...prev,
        images: [selected, ...others]
      };
    });
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please enter the Property Name.');
      return;
    }

    if (!formData.location.trim()) {
      setErrorMessage('Please enter the Property Location.');
      return;
    }

    // Only use images explicitly uploaded by the user
    // Any remaining base64 data URLs are uploaded to Supabase Storage before saving
    let finalImages = Array.isArray(formData.images) ? [...formData.images] : [];

    // Auto-upload any remaining base64 images that weren't already uploaded
    const base64Indices = finalImages
      .map((img, i) => (img && img.startsWith('data:image/') ? i : -1))
      .filter((i) => i !== -1);

    if (base64Indices.length > 0) {
      try {
        setIsSubmitting(true);
        for (const idx of base64Indices) {
          try {
            const uploaded = await api.uploadAsset(finalImages[idx], `prop_submit_${Date.now()}_${idx}.jpg`, 'property-images');
            finalImages[idx] = uploaded.url;
          } catch {
            // Leave as data URL if upload fails — backend will handle it
          }
        }
      } catch (err) {
        // Non-fatal: proceed with submit
      }
    }

    try {
      setIsSubmitting(true);
      await onSave({ ...formData, images: finalImages }, initialData?.id);
      setSuccessMessage(isEditing ? 'Property successfully updated!' : 'New property successfully added to inventory!');
      setTimeout(() => {
        onBack();
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save property. Please check your data.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-property-page">
      {/* 1. Header Bar with Breadcrumb Navigation */}
      <div className="add-property-header">
        <div className="add-property-title-area">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onBack}
            style={{ marginBottom: '1rem', padding: '0.45rem 0.95rem' }}
          >
            <ArrowLeft size={16} />
            <span>Cancel / Back to Properties</span>
          </button>
          <h2>{isEditing ? `Edit: ${initialData?.name}` : 'Add New Property'}</h2>
          <p>
            {isEditing 
              ? 'Update verified specifications, pricing, amenities, and imagery for this property.' 
              : 'Enter verified property information below to list it in the active sales inventory.'}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onBack}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem' }}
          >
            {isSubmitting ? (
              <span>Saving Property...</span>
            ) : (
              <>
                <Check size={16} />
                <span>{isEditing ? 'Save Changes' : 'Save Property'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger-color)',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          background: 'var(--status-avail-bg)',
          border: '1px solid var(--status-avail-border)',
          color: 'var(--status-avail-color)',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ===================================================================
            SECTION 1: Basic Information
            =================================================================== */}
        <div className="form-section-card">
          <div className="form-section-header">
            <Building2 size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3>Basic Information</h3>
              <p>Project identification, location corridor, and developer background</p>
            </div>
          </div>

          <div className="form-grid-2" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">
                <span>Property / Project Name</span>
                <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Codename DIAMOND"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <span className="form-label-hint">Official commercial or residential project name</span>
            </div>

            <div className="form-group">
              <label className="form-label">Developer / Builder</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Embassy Group, Brigade Group, Puravankara"
                value={formData.developer}
                onChange={(e) => handleChange('developer', e.target.value)}
              />
              <span className="form-label-hint">Recognized builder name for client trust</span>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                <span>Location (Address &amp; Corridor)</span>
                <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vajrahalli, Kanakapura Road, Bengaluru"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                required
              />
              <span className="form-label-hint">Include landmark, road, and Bangalore sub-market</span>
            </div>

            <div className="form-group">
              <label className="form-label">Property Source Reference URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app/..."
                value={formData.original_url}
                onChange={(e) => handleChange('original_url', e.target.value)}
              />
              <span className="form-label-hint">Optional reference URL</span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECTION 2: Property Details & Specifications
            =================================================================== */}
        <div className="form-section-card">
          <div className="form-section-header">
            <Layers size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3>Property Details &amp; Specifications</h3>
              <p>Configuration, pricing format, sizing, and inventory availability status</p>
            </div>
          </div>

          <div className="form-grid-3" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select
                className="form-select"
                value={formData.property_type}
                onChange={(e) => handleChange('property_type', e.target.value)}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Plot">Plot</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Configuration / BHK</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2 BHK & 3 BHK, 3 & 4 BHK, Commercial Suite"
                value={formData.configuration}
                onChange={(e) => handleChange('configuration', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Availability / Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="Available">Available (Ready for booking)</option>
                <option value="On-Hold">On-Hold (Under client negotiation)</option>
                <option value="Sold">Sold (Fully allocated)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Display Price</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Starting From ₹2.90 Cr or ₹20,000/Sq.Ft"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
              />
              <span className="form-label-hint">Price formatted exactly as buyers should see it</span>
            </div>

            <div className="form-group">
              <label className="form-label">Super Built-up Area</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1,850 - 2,350 sq.ft"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
              />
              <span className="form-label-hint">Area in square feet or acreage</span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECTION 3: Description & Highlights
            =================================================================== */}
        <div className="form-section-card">
          <div className="form-section-header">
            <Info size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3>Description &amp; Project Highlights</h3>
              <p>Comprehensive overview, architecture details, and sales talking points</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Property Description</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Describe the development's architectural concept, key corridor advantages, views, clubhouse lifestyle, and investment rationale..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
        </div>

        {/* ===================================================================
            SECTION 4: Amenities & Lifestyle Features
            =================================================================== */}
        <div className="form-section-card">
          <div className="form-section-header">
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3>Amenities &amp; Lifestyle Features</h3>
              <p>Quickly select common features or type custom amenities</p>
            </div>
          </div>

          {/* Quick 1-Click Preset Suggestions */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
              1-Click Common Presets:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {COMMON_AMENITIES_PRESETS.map((preset) => {
                const isSelected = formData.amenities.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setFormData((prev) => ({
                          ...prev,
                          amenities: prev.amenities.filter((a) => a !== preset)
                        }));
                      } else {
                        handleAddAmenity(preset);
                      }
                    }}
                    style={{
                      background: isSelected ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                      border: `1px solid ${isSelected ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.35rem 0.8rem',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {isSelected ? <Check size={13} /> : <Plus size={13} />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amenity Input */}
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Type a custom amenity (e.g. 'Private Theater', 'Cricket Net')..."
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAmenity();
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleAddAmenity()}
            >
              <Plus size={16} />
              <span>Add Amenity</span>
            </button>
          </div>

          {/* Active Amenities Badges */}
          {formData.amenities.length > 0 && (
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                Selected Amenities ({formData.amenities.length}):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {formData.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(idx)}
                      style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      title="Remove"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            SECTION 5: Direct Property Photo Upload
            =================================================================== */}
        <div className="form-section-card">
          <div className="form-section-header">
            <ImageIcon size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3>Property Images</h3>
              <p>Upload property photos directly from your computer with instant preview</p>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept="image/*"
            style={{ display: 'none' }}
          />

          {/* Drag & Drop Upload Zone */}
          <div
            className={`image-upload-dropzone ${isDragOver ? 'drag-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="dropzone-icon-box">
              <Upload size={24} />
            </div>
            <div className="dropzone-title">
              {isOptimizingImages ? 'Optimizing & compressing photos...' : 'Click to upload photos, or drag & drop here'}
            </div>
            <div className="dropzone-sub">
              Upload exterior, interior, floorplans, or clubhouse images (JPG, PNG, WEBP) • Auto-compressed • Up to 5 photos
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: '1rem', padding: '0.45rem 1rem' }}
              disabled={isOptimizingImages || formData.images.length >= MAX_IMAGES_PER_PROPERTY}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload size={15} />
              <span>{isOptimizingImages ? 'Optimizing...' : 'Select Photos from Computer'}</span>
            </button>
          </div>

          {/* Optional URL Toggle */}
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              style={{ 
                fontSize: '0.8rem', 
                color: 'var(--primary)', 
                fontWeight: 500, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer' 
              }}
            >
              {showUrlInput ? '− Hide Image URL input' : '+ Or paste an image URL instead'}
            </button>

            {showUrlInput && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/property-image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddUrlImage}
                  disabled={formData.images.length >= MAX_IMAGES_PER_PROPERTY}
                >
                  Add URL
                </button>
              </div>
            )}
          </div>

          {/* Uploaded Images Preview Grid */}
          {formData.images.length > 0 && (
            <div style={{ marginTop: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Selected Photos ({formData.images.length} / {MAX_IMAGES_PER_PROPERTY} max)
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  First photo is the main Cover Image
                </span>
              </div>

              <div className="uploaded-images-grid">
                {formData.images.map((imgSrc, idx) => (
                  <div key={idx} className="uploaded-image-card">
                    <img 
                      src={imgSrc} 
                      alt={`Property Photo ${idx + 1}`} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />

                    {/* Cover Badge on First Photo */}
                    {idx === 0 && (
                      <div className="cover-badge">
                        Cover Image
                      </div>
                    )}

                    {/* Hover Action Overlay */}
                    <div className="image-action-overlay">
                      {idx !== 0 && (
                        <button
                          type="button"
                          className="image-overlay-btn"
                          onClick={() => handleSetCover(idx)}
                          title="Make this the main cover image"
                        >
                          Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        className="image-overlay-btn danger"
                        onClick={() => handleRemoveImage(idx)}
                        title="Delete photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            Bottom Prominent Action Bar
            =================================================================== */}
        <div className="form-action-bar">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onBack}
            disabled={isSubmitting}
            style={{ padding: '0.7rem 1.4rem', fontSize: '0.95rem' }}
          >
            Cancel / Back to Properties
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ padding: '0.7rem 1.75rem', fontSize: '0.95rem' }}
          >
            {isSubmitting ? (
              <span>Saving Property...</span>
            ) : (
              <>
                <Check size={18} />
                <span>{isEditing ? 'Save Changes' : 'Save Property'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

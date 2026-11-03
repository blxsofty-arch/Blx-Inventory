import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Image as ImageIcon, Sparkles } from 'lucide-react';

const COMMON_AMENITIES = [
  'Clubhouse',
  'Infinity Pool',
  'Modern Gymnasium',
  '24/7 Security',
  'Power Backup',
  'Tennis Court',
  'Jogging Track',
  'Children Play Area',
  'Badminton Court',
  'Landscaped Gardens',
  'EV Charging Station',
  'Covered Parking'
];

export default function PropertyModal({ isOpen, onClose, onSave, initialData }) {
  const isEditing = !!initialData?.id;

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

  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        images: Array.isArray(initialData.images) ? initialData.images : []
      });
    } else {
      setFormData({
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
        amenities: ['Clubhouse', 'Swimming Pool', '24/7 Security'],
        images: []
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAmenity = (amenity) => {
    const trimmed = (amenity || newAmenityInput).trim();
    if (!trimmed) return;
    if (!formData.amenities.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, trimmed]
      }));
    }
    setNewAmenityInput('');
  };

  const handleRemoveAmenity = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleAddImage = () => {
    const trimmed = newImageUrlInput.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, trimmed]
    }));
    setNewImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      setError('Property name and location are required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave(formData, initialData?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save property record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              {isEditing ? 'Edit Property Record' : 'Add New Property to Inventory'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {isEditing ? `Updating internal records for ${initialData?.name}` : 'Enter verified property information for sales inventory'}
            </p>
          </div>
          <button className="btn btn-secondary btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            {/* Row 1: Name & Developer */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Property Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Codename DIAMOND"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Developer / Builder</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Embassy Group, Brigade Group"
                  value={formData.developer}
                  onChange={(e) => handleChange('developer', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Location & Original URL */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Location (Area, City) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vajrahalli, Kanakapura Road, Bengaluru"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Original BLX Property Source URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.theblxrealty.com/properties/..."
                  value={formData.original_url}
                  onChange={(e) => handleChange('original_url', e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Property Type, Configuration, Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select
                  className="form-select"
                  value={formData.property_type}
                  onChange={(e) => handleChange('property_type', e.target.value)}
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Plot">Plot</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Configuration</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 3 & 3.5 BHK"
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
                  <option value="Available">Available</option>
                  <option value="On-Hold">On-Hold</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            {/* Row 4: Price & Area */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Display Price</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ₹2.25 Cr - ₹2.85 Cr"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Super Built-up Area</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1,950 - 2,250 sq.ft"
                  value={formData.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Property Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Detailed property highlights, architectural notes, and sales pitch..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            {/* Amenities Section */}
            <div className="form-group">
              <label className="form-label">Amenities & Features</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add custom amenity..."
                  value={newAmenityInput}
                  onChange={(e) => setNewAmenityInput(e.target.value)}
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
                  <span>Add</span>
                </button>
              </div>

              {/* Quick suggestions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', alignSelf: 'center', marginRight: '0.25rem' }}>
                  Presets:
                </span>
                {COMMON_AMENITIES.slice(0, 6).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleAddAmenity(item)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      color: '#94a3b8',
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    + {item}
                  </button>
                ))}
              </div>

              {/* Added Amenities Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {formData.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--primary-subtle)',
                      border: '1px solid var(--primary-border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {item}
                    <X
                      size={13}
                      style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                      onClick={() => handleRemoveAmenity(idx)}
                    />
                  </span>
                ))}
              </div>
            </div>

            {/* Images Section */}
            <div className="form-group">
              <label className="form-label">Property Gallery Image URLs</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="Paste image URL (https://...)"
                  value={newImageUrlInput}
                  onChange={(e) => setNewImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddImage}
                >
                  <Plus size={16} />
                  <span>Add Image</span>
                </button>
              </div>

              {/* Image Previews */}
              <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', padding: '0.35rem 0' }}>
                {formData.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '80px',
                      height: '60px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid #334155'
                    }}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        color: '#f87171',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Property')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

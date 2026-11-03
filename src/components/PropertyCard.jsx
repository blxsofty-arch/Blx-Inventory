import React, { useState } from 'react';
import { 
  MapPin, 
  Maximize2, 
  BedDouble, 
  Building2, 
  ArrowRight, 
  ChevronDown, 
  Camera, 
  Edit3, 
  Trash2, 
  Share2,
  FileDown
} from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { useAuth } from '../context/AuthContext';

export default function PropertyCard({ 
  property, 
  onSelect, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onShareWhatsApp,
  isSharing = false,
  onGenerateBrochure,
  isGenerating = false
}) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const validImages = Array.isArray(property.images)
    ? property.images.filter(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('photo-1545324418-cc1a3fa10c00'))
    : [];

  const hasUploadedImages = validImages.length > 0;
  const mainImage = hasUploadedImages ? validImages[0] : null;
  const photoCount = validImages.length;

  const statusKey = (property.status || 'Available').toLowerCase().replace(' ', '-');

  const handleStatusSelect = (e, newStatus) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(property.id, newStatus);
    }
    setStatusMenuOpen(false);
  };

  const renderStatusDropdown = () => (
    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`badge-status ${statusKey}`}
        onClick={() => isAdmin && setStatusMenuOpen(!statusMenuOpen)}
        style={{ cursor: isAdmin ? 'pointer' : 'default' }}
        title={isAdmin ? 'Click to change status' : property.status}
      >
        <span>{property.status}</span>
        {isAdmin && <ChevronDown size={12} />}
      </button>

      {statusMenuOpen && isAdmin && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '6px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 20,
          overflow: 'hidden',
          minWidth: '130px'
        }}>
          {['Available', 'On-Hold', 'Sold'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={(e) => handleStatusSelect(e, st)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem',
                textAlign: 'left',
                background: property.status === st ? 'var(--primary-subtle)' : 'transparent',
                color: property.status === st ? 'var(--primary)' : 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'block'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="property-card" onClick={() => onSelect(property.id)}>
      {/* 1. Banner Image Area: ONLY showcase banner image if user explicitly uploaded photos */}
      {hasUploadedImages ? (
        <div className="property-image-container">
          <img 
            src={mainImage} 
            alt={property.name} 
            className="property-image"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />

          {/* Overlay Badges */}
          <div className="property-overlay-top">
            <span className="badge-type">
              {property.property_type || 'Residential'}
            </span>
            {renderStatusDropdown()}
          </div>

          {/* Photo Count Indicator */}
          {photoCount > 1 && (
            <div className="photo-count-pill">
              <Camera size={12} />
              <span>{photoCount} Photos</span>
            </div>
          )}
        </div>
      ) : (
        /* Leave banner blank with zero self-uploaded or auto-generated images */
        <div className="property-image-container property-image-blank">
          <div className="property-overlay-top">
            <span className="badge-type">
              {property.property_type || 'Residential'}
            </span>
            {renderStatusDropdown()}
          </div>
        </div>
      )}

      {/* 2. Card Content Body */}
      <div className="property-card-body">
        {/* Developer / Project Partner */}
        <div className="property-developer">
          {property.developer || 'BLX Curated'}
        </div>

        {/* Project Name */}
        <h3 className="property-title" title={property.name}>
          {property.name}
        </h3>

        {/* Location */}
        <div className="property-location">
          <MapPin size={15} />
          <span>{property.location}</span>
        </div>

        {/* 3. Essential Key Specs Row */}
        <div className="property-specs">
          <div className="spec-item" title="Configuration">
            <BedDouble size={16} />
            <span>{property.configuration}</span>
          </div>

          <div className="spec-item" title="Super Built-up Area">
            <Maximize2 size={15} />
            <span>{property.area}</span>
          </div>

          <div className="spec-item" title="Property Type">
            <Building2 size={15} />
            <span>{property.property_type}</span>
          </div>
        </div>

        {/* 4. Footer: Price & Primary Action */}
        <div className="property-card-footer">
          <div className="price-container">
            <span className="price-label">Pricing</span>
            <div className="property-price">{property.price}</div>
          </div>

          <button 
            type="button" 
            className="view-details-btn"
            onClick={() => onSelect(property.id)}
          >
            <span>View Details</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 5. Utility Bar (Brochure, WhatsApp Share & Staff Actions) */}
        <div className="property-staff-bar" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            onClick={(e) => {
              e.stopPropagation();
              onGenerateBrochure && onGenerateBrochure(property);
            }}
            disabled={isGenerating}
            title="Generate and download official PDF brochure"
          >
            <FileDown size={13} />
            <span>{isGenerating ? 'Generating...' : 'Brochure'}</span>
          </button>

          <button
            type="button"
            className="btn btn-whatsapp"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            onClick={() => onShareWhatsApp && onShareWhatsApp(property)}
            disabled={isSharing}
            title="Generate brochure & share on WhatsApp"
          >
            <WhatsAppIcon size={13} />
            <span>{isSharing ? 'Generating...' : 'WhatsApp'}</span>
          </button>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-icon-only"
                title="Edit Property"
                onClick={() => onEdit && onEdit(property)}
                style={{ padding: '0.35rem' }}
              >
                <Edit3 size={14} />
              </button>
              <button
                type="button"
                className="btn btn-danger btn-icon-only"
                title="Delete Property"
                onClick={() => onDelete && onDelete(property.id, property.name)}
                style={{ padding: '0.35rem' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

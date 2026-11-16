import React, { useState } from 'react';
import { MapPin, Edit3, Trash2, ArrowRight, ChevronDown, FileDown, Mail } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { useAuth } from '../context/AuthContext';

export default function PropertyRow({ 
  property, 
  onSelect, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onShareWhatsApp,
  isSharing = false,
  onGenerateBrochure,
  isGenerating = false,
  onShareEmail,
  isEmailSharing = false,
}) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const validImages = Array.isArray(property.images)
    ? property.images.filter(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('photo-1545324418-cc1a3fa10c00'))
    : [];

  const hasUploadedImages = validImages.length > 0;
  const mainImage = hasUploadedImages ? validImages[0] : null;
  const statusKey = (property.status || 'Available').toLowerCase().replace(' ', '-');

  const handleStatusSelect = (e, newStatus) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(property.id, newStatus);
    }
    setStatusMenuOpen(false);
  };

  return (
    <div className="property-row" onClick={() => onSelect(property.id)}>
      {/* Thumbnail: ONLY show photo if user explicitly uploaded an image */}
      <div className="row-thumb">
        {hasUploadedImages ? (
          <img 
            src={mainImage} 
            alt={property.name}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }} />
        )}
      </div>

      {/* Property Name & Developer */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {property.developer || 'BLX Curated'}
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {property.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {property.property_type}
        </div>
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: 0 }}>
        <MapPin size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {property.location}
        </span>
      </div>

      {/* Configuration & Area */}
      <div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {property.configuration}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {property.area}
        </div>
      </div>

      {/* Price */}
      <div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
          {property.price}
        </div>
      </div>

      {/* Status Badge with Quick Toggle (Admin Only) */}
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`badge-status ${statusKey}`}
          onClick={() => isAdmin && setStatusMenuOpen(!statusMenuOpen)}
          style={{ cursor: isAdmin ? 'pointer' : 'default' }}
          title={isAdmin ? 'Click to change status' : property.status}
        >
          <span>{property.status}</span>
          {isAdmin && <ChevronDown size={11} />}
        </button>

        {statusMenuOpen && isAdmin && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 20,
            overflow: 'hidden',
            minWidth: '120px'
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

      {/* Row Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn btn-secondary btn-icon-only"
          title="Download PDF Brochure"
          onClick={() => onGenerateBrochure && onGenerateBrochure(property)}
          disabled={isGenerating}
        >
          <FileDown size={14} />
        </button>

        <button
          type="button"
          className="btn btn-whatsapp btn-icon-only"
          title="Share WhatsApp Brochure"
          onClick={() => onShareWhatsApp && onShareWhatsApp(property)}
          disabled={isSharing}
        >
          <WhatsAppIcon size={15} />
        </button>

        <button
          type="button"
          className="btn btn-email btn-icon-only"
          title="Share via Email"
          onClick={() => onShareEmail && onShareEmail(property)}
          disabled={isEmailSharing}
        >
          <Mail size={15} />
        </button>

        <button 
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          onClick={() => onSelect(property.id)}
        >
          <span>Details</span>
          <ArrowRight size={13} />
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-icon-only"
              title="Edit Property"
              onClick={() => onEdit && onEdit(property)}
            >
              <Edit3 size={14} />
            </button>
            <button
              type="button"
              className="btn btn-danger btn-icon-only"
              title="Delete Property"
              onClick={() => onDelete && onDelete(property.id, property.name)}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

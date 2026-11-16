import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import ImageGallery from '../components/ImageGallery';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  BedDouble, 
  Maximize2, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  ChevronDown,
  ShieldCheck,
  Briefcase,
  Layers,
  Sparkles,
  PhoneCall,
  Calendar,
  FileDown,
  Mail
} from 'lucide-react';

export default function PropertyDetails({ 
  propertyId, 
  onBack, 
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
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperty = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.getProperty(propertyId);
      setProperty(data);
    } catch (err) {
      console.error('Error fetching property details:', err);
      setError('Failed to load property details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const handleStatusSelect = async (newStatus) => {
    try {
      await onStatusChange(property.id, newStatus);
      setProperty((prev) => ({ ...prev, status: newStatus }));
      setStatusMenuOpen(false);
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (window.confirm(`Move "${property.name}" to Archived Properties? You can restore it anytime from the Archived section.`)) {
      try {
        setIsDeleting(true);
        await onDelete(property.id, property.name, true);
      } catch (err) {
        alert('Failed to move property to archive');
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Loading property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
          {error || 'Property not found'}
        </h3>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Properties</span>
        </button>
      </div>
    );
  }

  const statusKey = (property.status || 'Available').toLowerCase().replace(' ', '-');

  return (
    <div>
      {/* Top Breadcrumb & Action Navigation */}
      <div className="details-breadcrumb-bar">
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Properties</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Badge with Quick Dropdown for Staff (Admin Only) */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`badge-status ${statusKey}`}
              onClick={() => isAdmin && setStatusMenuOpen(!statusMenuOpen)}
              style={{ 
                cursor: isAdmin ? 'pointer' : 'default',
                padding: '0.45rem 1rem', 
                fontSize: '0.82rem' 
              }}
            >
              <span>Status: {property.status}</span>
              {isAdmin && <ChevronDown size={14} />}
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
                zIndex: 30,
                overflow: 'hidden',
                minWidth: '150px'
              }}>
                {['Available', 'On-Hold', 'Sold'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusSelect(st)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      textAlign: 'left',
                      background: property.status === st ? 'var(--primary-subtle)' : 'transparent',
                      color: property.status === st ? 'var(--primary)' : 'var(--text-primary)',
                      fontSize: '0.85rem',
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

          {/* Generate / Download PDF Brochure */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onGenerateBrochure && onGenerateBrochure(property)}
            disabled={isGenerating}
            title="Generate and Download official BLX Realty PDF brochure"
          >
            <FileDown size={15} />
            <span>{isGenerating ? 'Generating Brochure...' : 'Download Brochure'}</span>
          </button>

          {/* WhatsApp Brochure Share */}
          <button
            type="button"
            className="btn btn-whatsapp"
            onClick={() => onShareWhatsApp(property)}
            disabled={isSharing}
            title="Generate PDF brochure & Share on WhatsApp"
          >
            <WhatsAppIcon size={16} />
            <span>{isSharing ? 'Generating Brochure...' : 'Share Brochure'}</span>
          </button>

          {/* Email Brochure Share */}
          <button
            type="button"
            className="btn btn-email"
            onClick={() => onShareEmail && onShareEmail(property)}
            disabled={isEmailSharing}
            title="Share property brochure via Email"
          >
            <Mail size={16} />
            <span>{isEmailSharing ? 'Preparing...' : 'Email Brochure'}</span>
          </button>

          {/* Staff Edit & Delete - Admin Only */}
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => onEdit(property)}>
                <Edit3 size={15} />
                <span>Edit</span>
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={isDeleting}>
                <Trash2 size={15} />
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Details Header */}
      <div className="details-header">
        <div className="details-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span className="badge-type">{property.property_type}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              by {property.developer || 'BLX Curated Partner'}
            </span>
          </div>

          <h2>{property.name}</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.4rem' }}>
            <MapPin size={17} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span>{property.location}</span>
          </div>
        </div>

        {/* Price Box */}
        <div className="details-price-badge-box">
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            Pricing
          </div>
          <div className="price-val">
            {property.price}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Super Built-up Area: <strong>{property.area}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Gallery & Information on Left, Action Panel on Right */}
      <div className="details-grid">
        {/* Left Column */}
        <div>
          {/* 1. Large Image Showcase Gallery */}
          <div style={{ marginBottom: '2rem' }}>
            <ImageGallery images={property.images} propertyName={property.name} />
          </div>

          {/* 2. Key Specifications Grid */}
          <div className="content-section-card">
            <h3>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              <span>Key Specifications</span>
            </h3>
            <div className="specs-grid">
              <div className="spec-box">
                <div className="spec-box-label">Configuration</div>
                <div className="spec-box-value">{property.configuration}</div>
              </div>
              <div className="spec-box">
                <div className="spec-box-label">Super Built-up Area</div>
                <div className="spec-box-value">{property.area}</div>
              </div>
              <div className="spec-box">
                <div className="spec-box-label">Property Type</div>
                <div className="spec-box-value">{property.property_type}</div>
              </div>
              <div className="spec-box">
                <div className="spec-box-label">Developer / Partner</div>
                <div className="spec-box-value">{property.developer || 'BLX Curated'}</div>
              </div>
              <div className="spec-box">
                <div className="spec-box-label">Availability Status</div>
                <div className="spec-box-value" style={{ color: statusKey === 'available' ? 'var(--status-avail-color)' : 'var(--text-primary)' }}>
                  {property.status}
                </div>
              </div>
              <div className="spec-box">
                <div className="spec-box-label">Legal Verification</div>
                <div className="spec-box-value" style={{ color: 'var(--status-avail-color)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={16} />
                  <span>100% Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Description & Project Overview */}
          <div className="content-section-card">
            <h3>
              <Building2 size={18} style={{ color: 'var(--primary)' }} />
              <span>Project Overview &amp; Description</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {property.description}
            </p>
          </div>

          {/* 4. Amenities & Features */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="content-section-card">
              <h3>
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                <span>Amenities &amp; Lifestyle Features</span>
              </h3>
              <div className="amenities-grid">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="amenity-chip">
                    <CheckCircle2 size={16} />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Location & Corridor Highlights */}
          <div className="content-section-card">
            <h3>
              <MapPin size={18} style={{ color: 'var(--primary)' }} />
              <span>Location &amp; Connectivity</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
              {property.location}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div className="spec-box">
                <div className="spec-box-label">Corridor</div>
                <div className="spec-box-value" style={{ fontSize: '0.95rem' }}>Bengaluru Prime Growth Corridor</div>
              </div>
              <div className="spec-box">
                <div className="spec-box-label">Transit Access</div>
                <div className="spec-box-value" style={{ fontSize: '0.95rem' }}>Metro &amp; Arterial Expressway Links</div>
              </div>
              <div className="spec-box">
                <div className="spec-box-label">Title Status</div>
                <div className="spec-box-value" style={{ fontSize: '0.95rem' }}>Clear Title &amp; RERA Approved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Consultation Panel */}
        <div>
          {/* Action & Sharing Card */}
          <div className="content-section-card" style={{ position: 'sticky', top: '5rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>
              <Briefcase size={17} style={{ color: 'var(--primary)' }} />
              <span>Property Consultation</span>
            </h3>

            <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Quoting Price
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {property.price}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Configuration: <strong>{property.configuration}</strong> ({property.area})
              </div>
            </div>

            {/* Brochure Generation Workflow */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>
                Brochure Workflow
              </div>
              {/* Step 1: Generate & Download PDF Brochure */}
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}
                onClick={() => onGenerateBrochure && onGenerateBrochure(property)}
                disabled={isGenerating}
                title="Generate and Download official BLX Realty PDF brochure"
              >
                <FileDown size={17} />
                <span>{isGenerating ? 'Generating Brochure PDF...' : 'Generate & Download Brochure'}</span>
              </button>
            </div>

            {/* Dedicated Email Brochure Section */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem',
              marginBottom: '0.85rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                <Mail size={16} style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Email Brochure
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', lineHeight: '1.45' }}>
                Open the dedicated email composer to review prefilled details, attach the generated PDF brochure, and send via Gmail.
              </p>
              <button
                type="button"
                className="btn btn-email"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.88rem', fontWeight: 600 }}
                onClick={() => onShareEmail && onShareEmail(property)}
                disabled={isEmailSharing}
                title="Open Email Composer for this property"
              >
                <Mail size={16} />
                <span>{isEmailSharing ? 'Opening Composer...' : 'Email Brochure'}</span>
              </button>
            </div>

            {/* Direct WhatsApp Share Button */}
            <button
              type="button"
              className="btn btn-whatsapp"
              style={{ width: '100%', padding: '0.7rem 1rem', fontSize: '0.88rem', marginBottom: '1.25rem' }}
              onClick={() => onShareWhatsApp(property)}
              disabled={isSharing}
            >
              <WhatsAppIcon size={17} />
              <span>{isSharing ? 'Sharing Brochure...' : 'Share PDF on WhatsApp'}</span>
            </button>

            {/* Sales Advisor Consultation Guide */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <PhoneCall size={13} style={{ color: 'var(--primary)' }} />
                <span>Advisory Talking Points</span>
              </div>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                <li>Confirm client preferred move-in / possession timeline.</li>
                <li>Highlight project developer reputation ({property.developer || 'BLX Partner'}).</li>
                <li>Mention 100% legal verification and clean title assurance.</li>
                <li>Share brochure instantly to buyer's WhatsApp number.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

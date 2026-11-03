import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Search, 
  X, 
  MapPin, 
  Building2, 
  BedDouble, 
  Maximize2, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

/**
 * Multi-field search matcher across:
 * - Property name
 * - Location
 * - Developer
 * - Configuration
 * - Property type
 * - Price
 */
function matchesArchivedProperty(property, query) {
  if (!query || !query.trim()) return true;

  const normalizedQuery = query.trim().toLowerCase().replace(/(\d+)\s*(bhk|bed|cr|lakh)/gi, '$1 $2');
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const rawFields = [
    property.name,
    property.location,
    property.developer,
    property.configuration,
    property.property_type,
    property.price,
    property.area,
    property.description
  ].filter(Boolean).join(' ').toLowerCase();

  const compressedFields = rawFields.replace(/[^a-z0-9]/g, '');

  return tokens.every((token) => {
    const cleanToken = token.replace(/[^a-z0-9]/g, '');
    if (!cleanToken) return true;
    return rawFields.includes(token) || compressedFields.includes(cleanToken);
  });
}

function formatArchivedDate(dateStr) {
  if (!dateStr) return 'Recently Archived';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently Archived';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return 'Recently Archived';
  }
}

export default function Archived({ onRestoreProperty, onNavigateToInventory }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [archivedProperties, setArchivedProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionToast, setActionToast] = useState(null);

  // Permanent Delete Modal State
  const [confirmModalProperty, setConfirmModalProperty] = useState(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const fetchArchived = async (search = '') => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.getArchivedProperties(search);
      setArchivedProperties(data.properties || []);
    } catch (err) {
      console.error('Failed to load archived properties:', err);
      setError('Failed to load archived properties from the database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchArchived();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        marginTop: '1rem'
      }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger-color)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Administrative Access Required
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: '1.6' }}>
          The Archived Properties section is restricted to Administrators. Employees possess read-only permissions to search and share active properties.
        </p>
        {onNavigateToInventory && (
          <button className="btn btn-primary" onClick={() => onNavigateToInventory()}>
            <span>Return to Active Properties</span>
          </button>
        )}
      </div>
    );
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArchived(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchArchived('');
  };

  // Restore Property Action
  const handleRestore = async (property) => {
    try {
      setRestoringId(property.id);
      await api.restoreProperty(property.id);

      // Remove from local archived state
      setArchivedProperties((prev) => prev.filter((p) => p.id !== property.id));

      if (onRestoreProperty) {
        onRestoreProperty(property.id);
      }

      setActionToast({
        type: 'success',
        message: `"${property.name}" restored back to active Properties inventory.`,
      });
    } catch (err) {
      console.error('Failed to restore property:', err);
      setActionToast({
        type: 'error',
        message: err.message || 'Failed to restore property. Please try again.',
      });
    } finally {
      setRestoringId(null);
    }
  };

  // Permanent Delete Action
  const handleConfirmPermanentDelete = async () => {
    if (!confirmModalProperty) return;

    try {
      setIsDeletingPermanently(true);
      await api.deletePermanently(confirmModalProperty.id);

      // Remove from local list
      setArchivedProperties((prev) => prev.filter((p) => p.id !== confirmModalProperty.id));

      setActionToast({
        type: 'success',
        message: `"${confirmModalProperty.name}" has been permanently deleted from the system.`,
      });
      setConfirmModalProperty(null);
    } catch (err) {
      console.error('Failed to permanently delete property:', err);
      setActionToast({
        type: 'error',
        message: err.message || 'Failed to permanently delete property.',
      });
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  // Filter archived properties with instant client search
  const filteredProperties = archivedProperties.filter((prop) =>
    matchesArchivedProperty(prop, searchTerm)
  );

  return (
    <div>
      {/* Toast Notification */}
      {actionToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          background: actionToast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${actionToast.type === 'error' ? 'var(--danger-border)' : 'rgba(22, 163, 74, 0.3)'}`,
          color: actionToast.type === 'error' ? 'var(--danger-color)' : '#15803d',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.88rem',
          fontWeight: 500,
          maxWidth: '450px'
        }}>
          {actionToast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span style={{ flex: 1 }}>{actionToast.message}</span>
          <button
            onClick={() => setActionToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h2 style={{
              fontSize: '1.85rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700
            }}>
              Archived Properties
            </h2>
            <span style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-full)'
            }}>
              {archivedProperties.length} {archivedProperties.length === 1 ? 'archived' : 'archived'}
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Properties removed from active sales inventory. Safely restore them to the portal or permanently delete them.
          </p>
        </div>

        {onNavigateToInventory && (
          <button
            className="btn btn-secondary"
            onClick={() => onNavigateToInventory()}
            style={{ fontSize: '0.85rem' }}
          >
            <span>View Active Inventory</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Search Bar across Name, Location, Developer, Configuration, Property Type, Price */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '0.55rem 0.85rem',
            flex: 1
          }}>
            <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search archived properties by name, location, developer, BHK, property type, price..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.9rem',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}
          >
            <span>Search Archive</span>
          </button>
        </form>

        {searchTerm && (
          <div style={{
            marginTop: '0.75rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Showing results matching <strong>"{searchTerm}"</strong> ({filteredProperties.length} found)</span>
            <button
              onClick={handleClearSearch}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger-color)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid View */}
      {isLoading ? (
        <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 500 }}>Loading archived properties...</p>
        </div>
      ) : archivedProperties.length === 0 ? (
        <div style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          marginTop: '1rem'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <Archive size={26} />
          </div>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>
            No Archived Properties
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
            Properties removed from the active inventory will be safely stored here. You can restore them back to the active portal or permanently delete them at any time.
          </p>
          {onNavigateToInventory && (
            <button className="btn btn-primary" onClick={() => onNavigateToInventory()}>
              <Building2 size={15} />
              <span>Go to Active Properties</span>
            </button>
          )}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)'
        }}>
          <Search size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontWeight: 700 }}>
            No Matching Archived Properties
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            No archived properties match your search for "{searchTerm}".
          </p>
          <button className="btn btn-secondary" onClick={handleClearSearch}>
            Reset Archive Search
          </button>
        </div>
      ) : (
        <div className="properties-grid">
          {filteredProperties.map((property) => {
            const validImages = Array.isArray(property.images)
              ? property.images.filter(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('photo-1545324418-cc1a3fa10c00'))
              : [];
            const hasUploadedImages = validImages.length > 0;
            const mainImage = hasUploadedImages ? validImages[0] : null;
            const archivedDateStr = formatArchivedDate(property.archived_at || property.updated_at);
            const isRestoring = restoringId === property.id;

            return (
              <div key={property.id} className="property-card" style={{ opacity: isRestoring ? 0.6 : 1 }}>
                {/* 1. Property Image Area */}
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

                      {/* Status Badge: Archived */}
                      <span className="badge-status archived">
                        Archived
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="property-image-container property-image-blank">
                    <div className="property-overlay-top">
                      <span className="badge-type">
                        {property.property_type || 'Residential'}
                      </span>
                      <span className="badge-status archived">
                        Archived
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Card Content Body */}
                <div className="property-card-body">
                  {/* Developer */}
                  <div className="property-developer">
                    {property.developer || 'BLX Curated'}
                  </div>

                  {/* Property Name */}
                  <h3 className="property-title" title={property.name}>
                    {property.name}
                  </h3>

                  {/* Location */}
                  <div className="property-location">
                    <MapPin size={15} />
                    <span>{property.location}</span>
                  </div>

                  {/* Key Specs Row */}
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

                  {/* Pricing & Archived Date Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 0',
                    borderTop: '1px solid var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginTop: '0.85rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <span className="price-label">Price</span>
                      <div className="property-price" style={{ fontSize: '1.15rem' }}>
                        {property.price}
                      </div>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'var(--bg-subtle)',
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500
                    }} title={`Archived: ${archivedDateStr}`}>
                      <Calendar size={13} />
                      <span>{archivedDateStr}</span>
                    </div>
                  </div>

                  {/* 3. Actions Row: Restore Property & Delete Permanently */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    {/* Action 1: Restore Property */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleRestore(property)}
                      disabled={isRestoring}
                      style={{
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.82rem',
                        color: 'var(--primary)',
                        borderColor: 'var(--primary-border)',
                        background: 'var(--primary-subtle)',
                        fontWeight: 600,
                        gap: '0.4rem'
                      }}
                      title="Move back to active properties inventory"
                    >
                      <RotateCcw size={14} />
                      <span>{isRestoring ? 'Restoring...' : 'Restore Property'}</span>
                    </button>

                    {/* Action 2: Delete Permanently */}
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setConfirmModalProperty(property)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        gap: '0.4rem'
                      }}
                      title="Permanently remove from the system"
                    >
                      <Trash2 size={14} />
                      <span>Delete Permanently</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Permanent Deletion */}
      {confirmModalProperty && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
          onClick={() => !isDeletingPermanently && setConfirmModalProperty(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Warning Icon */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--danger-bg)',
                color: 'var(--danger-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem'
                }}>
                  Permanently delete this property?
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5'
                }}>
                  This property will be permanently removed and cannot be recovered.
                </p>
              </div>
            </div>

            {/* Property Summary Highlight */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.75rem'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {confirmModalProperty.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {confirmModalProperty.location}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                {confirmModalProperty.configuration} • {confirmModalProperty.price}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModalProperty(null)}
                disabled={isDeletingPermanently}
                style={{ padding: '0.55rem 1.15rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmPermanentDelete}
                disabled={isDeletingPermanently}
                style={{ padding: '0.55rem 1.15rem', gap: '0.45rem' }}
              >
                <Trash2 size={15} />
                <span>{isDeletingPermanently ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

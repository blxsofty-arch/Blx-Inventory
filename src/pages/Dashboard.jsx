import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import PropertyCard from '../components/PropertyCard';
import { Search, ArrowRight, Building2, Sparkles, Plus, TrendingUp, Compass, X } from 'lucide-react';

/**
 * Multi-field case-insensitive search matcher for property objects.
 * Matches across:
 * - Property name & Project name
 * - Developer / Builder
 * - Location, Area & City
 * - Property type
 * - BHK / Configuration
 * - Price
 * - Availability / Status
 * - Relevant property description & amenities
 *
 * Supports non-exact matching, space-insensitivity (e.g. "3 bhk" <-> "3bhk"),
 * and extra spaces / minor formatting differences.
 */
function matchesProperty(property, query) {
  if (!query || !query.trim()) return true;

  // Normalize units like 3bhk -> 3 bhk
  const normalizedQuery = query.trim().toLowerCase().replace(/(\d+)\s*(bhk|bed|cr|lakh)/gi, '$1 $2');
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const amenitiesStr = Array.isArray(property.amenities)
    ? property.amenities.join(' ')
    : (property.amenities || '');

  // Consolidated searchable raw string
  const rawFields = [
    property.name,
    property.developer,
    property.location,
    property.property_type,
    property.configuration,
    property.price,
    property.area,
    property.status,
    property.description,
    amenitiesStr
  ].filter(Boolean).join(' ').toLowerCase();

  // Compressed alphanumeric string for whitespace/punctuation tolerance
  const compressedFields = rawFields.replace(/[^a-z0-9]/g, '');

  return tokens.every((token) => {
    const cleanToken = token.replace(/[^a-z0-9]/g, '');
    if (!cleanToken) return true;

    // Direct substring check in raw text
    if (rawFields.includes(token)) return true;

    // Substring check in compressed alphanumeric string
    if (compressedFields.includes(cleanToken)) return true;

    return false;
  });
}

export default function Dashboard({ 
  onNavigateToInventory, 
  onSelectProperty, 
  onOpenAddProperty, 
  onEditProperty, 
  onDeleteProperty, 
  onStatusChange,
  onShareWhatsApp,
  sharingPropertyId,
  onGenerateBrochure,
  generatingPropertyId,
  onShareEmail,
  emailSharingPropertyId,
}) {
  const [stats, setStats] = useState({ total: 0, available: 0, sold: 0, onHold: 0, typesBreakdown: [] });
  const [allProperties, setAllProperties] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const searchResultsRef = useRef(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch stats and all actual property inventory from the portal
      const [statsData, propsData] = await Promise.all([
        api.getStats(),
        api.getProperties()
      ]);
      setStats(statsData);
      const properties = propsData.properties || [];
      setAllProperties(properties);
      setRecentProperties(properties.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResultsRef.current) {
      searchResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleStatCardClick = (statusFilter) => {
    onNavigateToInventory({ status: statusFilter });
  };

  const handlePillClick = (corridor) => {
    setSearchTerm((prev) => (prev.toLowerCase() === corridor.toLowerCase() ? '' : corridor));
  };

  // Filter properties in real time
  const isSearching = Boolean(searchTerm.trim());
  const searchResults = isSearching
    ? allProperties.filter((p) => matchesProperty(p, searchTerm))
    : [];

  return (
    <div>
      {/* 1. Hero & Fast Search Section */}
      <section className="hero-search-section">
        <div className="hero-headline">
          <div className="hero-pill-badge">
            <Compass size={13} />
            <span>Property Inventory Portal</span>
          </div>
          <h2>Explore Premium Bengaluru Developments</h2>
          <p>
            Real-time availability, accurate pricing, and comprehensive project specifications across Bangalore's leading residential and commercial corridors.
          </p>
        </div>

        {/* Clean Minimal Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '780px' }}>
          <div className="search-bar-container">
            <Search size={19} style={{ color: 'var(--text-muted)', marginLeft: '0.2rem', flexShrink: 0 }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by project name, developer, corridor (e.g. 'Embassy', 'Whitefield', '3 BHK')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.25rem',
                  borderRadius: '50%',
                  transition: 'color var(--transition-fast)'
                }}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.15rem' }}>
              <span>Search</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>

        {/* Quick Corridor Jump Pills */}
        <div className="quick-pills">
          <span className="quick-pill-label">Prime Corridors:</span>
          {[
            { label: 'Whitefield', value: 'Whitefield' },
            { label: 'North Bengaluru Airport', value: 'North Bengaluru' },
            { label: 'Kanakapura Road', value: 'Kanakapura' },
            { label: 'Yeswanthpur', value: 'Yeswanthpur' },
            { label: 'Electronic City', value: 'Electronic City' },
            { label: 'HSR Layout', value: 'HSR Layout' }
          ].map((pill) => {
            const isActive = searchTerm.toLowerCase().includes(pill.value.toLowerCase());
            return (
              <button
                key={pill.value}
                type="button"
                className={`pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => handlePillClick(pill.value)}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Dynamic Search Results Section - directly below the search section */}
      {isSearching && (
        <section ref={searchResultsRef} style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Search Results
              </h3>
              <span style={{
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px'
              }}>
                {searchResults.length} {searchResults.length === 1 ? 'property' : 'properties'} found
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSearchTerm('')}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
            >
              Clear Search
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="properties-grid">
              {searchResults.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onSelect={onSelectProperty}
                  onEdit={onEditProperty}
                  onDelete={onDeleteProperty}
                  onStatusChange={onStatusChange}
                  onShareWhatsApp={onShareWhatsApp}
                  isSharing={sharingPropertyId === property.id}
                  onGenerateBrochure={onGenerateBrochure}
                  isGenerating={generatingPropertyId === property.id}
                  onShareEmail={onShareEmail}
                  isEmailSharing={emailSharingPropertyId === property.id}
                />
              ))}
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <Search size={26} />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No properties found
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                We couldn't find any developments matching <strong>"{searchTerm}"</strong>. Please check your spelling or try another search term (such as a developer name, location, or BHK configuration).
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSearchTerm('')}
                style={{ padding: '0.55rem 1.35rem' }}
              >
                Clear Search &amp; View All
              </button>
            </div>
          )}
        </section>
      )}

      {/* 2. KPI Statistics Grid */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div className="stats-grid">
          <StatCard
            type="total"
            label="Total Properties"
            count={stats.total || 0}
            footnote="Verified active developments"
            onClick={() => onNavigateToInventory({ status: 'All' })}
          />
          <StatCard
            type="available"
            label="Available"
            count={stats.available || 0}
            footnote="Ready for client booking"
            onClick={() => handleStatCardClick('Available')}
          />
          <StatCard
            type="onhold"
            label="Under Offer / On-Hold"
            count={stats.onHold || 0}
            footnote="Active client negotiations"
            onClick={() => handleStatCardClick('On-Hold')}
          />
          <StatCard
            type="sold"
            label="Sold Out"
            count={stats.sold || 0}
            footnote="Completed allocations"
            onClick={() => handleStatCardClick('Sold')}
          />
        </div>
      </section>

      {/* 3. Featured Developments Showcase */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Featured Developments
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Hand-picked residential &amp; commercial opportunities from top developer partners
            </p>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => onNavigateToInventory()}
          >
            <span>View All Properties ({stats.total || allProperties.length || 13})</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading properties...
          </div>
        ) : (
          <div className="properties-grid">
            {recentProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onSelect={onSelectProperty}
                onEdit={onEditProperty}
                onDelete={onDeleteProperty}
                onStatusChange={onStatusChange}
                onShareWhatsApp={onShareWhatsApp}
                isSharing={sharingPropertyId === property.id}
                onGenerateBrochure={onGenerateBrochure}
                isGenerating={generatingPropertyId === property.id}
                onShareEmail={onShareEmail}
                isEmailSharing={emailSharingPropertyId === property.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

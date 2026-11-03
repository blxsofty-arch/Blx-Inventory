import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import FilterBar from '../components/FilterBar';
import PropertyCard from '../components/PropertyCard';
import PropertyRow from '../components/PropertyRow';
import { useAuth } from '../context/AuthContext';
import { Plus, Building2, AlertCircle } from 'lucide-react';

export default function Inventory({
  initialFilters = {},
  onSelectProperty,
  onOpenAddProperty,
  onEditProperty,
  onDeleteProperty,
  onStatusChange,
  onShareWhatsApp,
  sharingPropertyId,
  onGenerateBrochure,
  generatingPropertyId,
}) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ locations: [], types: [], configurations: [], statuses: [] });
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    location: initialFilters.location || 'All',
    property_type: initialFilters.property_type || 'All',
    configuration: initialFilters.configuration || 'All',
    status: initialFilters.status || 'All',
    sort: 'newest',
  });
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.getProperties(filters);
      setProperties(data.properties);
      setFilterOptions(data.filters);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load property inventory from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      location: 'All',
      property_type: 'All',
      configuration: 'All',
      status: 'All',
      sort: 'newest',
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            Property Inventory
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Browse verified Bangalore residential and commercial properties with live availability and pricing
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={onOpenAddProperty}>
            <Plus size={16} />
            <span>Add Property</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalResults={properties.length}
      />

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

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 500 }}>Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          marginTop: '1rem'
        }}>
          <Building2 size={44} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>
            No Matching Properties Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
            No properties match your current search and filter criteria. Try adjusting your filters or search keywords.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              Reset Filters
            </button>
            {isAdmin && (
              <button className="btn btn-primary" onClick={onOpenAddProperty}>
                <Plus size={16} />
                <span>Add Property</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="properties-grid">
          {properties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onSelect={onSelectProperty}
              onEdit={onEditProperty}
              onDelete={onDeleteProperty}
              onStatusChange={onStatusChange}
              onShareWhatsApp={onShareWhatsApp}
              isSharing={sharingPropertyId === prop.id}
              onGenerateBrochure={onGenerateBrochure}
              isGenerating={generatingPropertyId === prop.id}
            />
          ))}
        </div>
      ) : (
        <div className="properties-list">
          {properties.map((prop) => (
            <PropertyRow
              key={prop.id}
              property={prop}
              onSelect={onSelectProperty}
              onEdit={onEditProperty}
              onDelete={onDeleteProperty}
              onStatusChange={onStatusChange}
              onShareWhatsApp={onShareWhatsApp}
              isSharing={sharingPropertyId === prop.id}
              onGenerateBrochure={onGenerateBrochure}
              isGenerating={generatingPropertyId === prop.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

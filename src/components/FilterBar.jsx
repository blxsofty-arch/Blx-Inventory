import React from 'react';
import { Search, LayoutGrid, List, RotateCcw, X } from 'lucide-react';

export default function FilterBar({
  filters,
  filterOptions = {},
  onFilterChange,
  onResetFilters,
  viewMode,
  setViewMode,
  totalResults
}) {
  const hasActiveFilters = 
    Boolean(filters.search) || 
    (filters.location && filters.location !== 'All') || 
    (filters.property_type && filters.property_type !== 'All') || 
    (filters.configuration && filters.configuration !== 'All') || 
    (filters.status && filters.status !== 'All') ||
    (filters.sort && filters.sort !== 'newest');

  return (
    <div className="filter-bar">
      {/* Top Search & Controls Row */}
      <div className="filter-row" style={{ justifyContent: 'space-between' }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '520px' }}>
          <div className="search-bar-container" style={{ width: '100%' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search properties by name, location, developer..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
            {filters.search && (
              <button 
                type="button" 
                onClick={() => onFilterChange('search', '')}
                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Results Count & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{totalResults}</strong> {totalResults === 1 ? 'property' : 'properties'}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onResetFilters}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          <div className="view-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Selects Row */}
      <div className="filter-row">
        {/* Location Filter */}
        <div className="filter-group">
          <label className="filter-label">Corridor / Location</label>
          <select
            className="filter-select"
            value={filters.location || 'All'}
            onChange={(e) => onFilterChange('location', e.target.value)}
          >
            <option value="All">All Locations</option>
            <option value="Yeswanthpur">Yeswanthpur</option>
            <option value="North Bengaluru">North Bengaluru</option>
            <option value="Kanakapura">Kanakapura Road</option>
            <option value="Whitefield">Whitefield</option>
            <option value="Electronic City">Electronic City</option>
            <option value="HSR Layout">HSR Layout</option>
            <option value="Mysore Road">Mysore Road</option>
            <option value="Bannerghatta">Bannerghatta Road</option>
            <option value="Hennur">Hennur</option>
          </select>
        </div>

        {/* Property Type Filter */}
        <div className="filter-group">
          <label className="filter-label">Property Type</label>
          <select
            className="filter-select"
            value={filters.property_type || 'All'}
            onChange={(e) => onFilterChange('property_type', e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>

        {/* Configuration Filter */}
        <div className="filter-group">
          <label className="filter-label">Configuration</label>
          <select
            className="filter-select"
            value={filters.configuration || 'All'}
            onChange={(e) => onFilterChange('configuration', e.target.value)}
          >
            <option value="All">All Configurations</option>
            <option value="1 BHK">1 BHK</option>
            <option value="2 BHK">2 BHK</option>
            <option value="2.5 BHK">2.5 BHK</option>
            <option value="3 BHK">3 BHK</option>
            <option value="4 BHK">4 BHK</option>
            <option value="Commercial">Commercial Space</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            className="filter-select"
            value={filters.status || 'All'}
            onChange={(e) => onFilterChange('status', e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On-Hold">On-Hold</option>
            <option value="Sold">Sold</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="filter-group">
          <label className="filter-label">Sort Order</label>
          <select
            className="filter-select"
            value={filters.sort || 'newest'}
            onChange={(e) => onFilterChange('sort', e.target.value)}
          >
            <option value="newest">Featured &amp; Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="area_asc">Area: Small to Large</option>
            <option value="area_desc">Area: Large to Small</option>
          </select>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, Archive, Users, Plus, LogOut, LogIn, Shield, User } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, onOpenAddProperty, onOpenLogin }) {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand with official BLX Realty logo */}
        <div className="brand-wrapper" onClick={() => setCurrentTab('dashboard')}>
          <div className="brand-logo-box">
            <img 
              src="/blx-logo.png" 
              alt="BLX Realty" 
              className="brand-logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="brand-text">
            <h1>BLX REALTY</h1>
            <span className="brand-tag">Property Inventory &amp; Sales</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button
            className={`nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-btn ${currentTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setCurrentTab('inventory')}
          >
            <Building2 size={16} />
            <span>Properties</span>
          </button>

          {/* Admin-Only Navigation Tabs */}
          {isAdmin && (
            <>
              <button
                className={`nav-btn ${currentTab === 'archived' ? 'active' : ''}`}
                onClick={() => setCurrentTab('archived')}
              >
                <Archive size={16} />
                <span>Archived</span>
              </button>
              <button
                className={`nav-btn ${currentTab === 'employees' ? 'active' : ''}`}
                onClick={() => setCurrentTab('employees')}
              >
                <Users size={16} />
                <span>Employees</span>
              </button>
            </>
          )}
        </nav>

        {/* Actions & Profile */}
        <div className="nav-actions">
          {/* Primary Add Property CTA - Admin Only */}
          {isAdmin && (
            <button className="btn btn-primary" onClick={onOpenAddProperty}>
              <Plus size={16} />
              <span>Add Property</span>
            </button>
          )}

          {/* Profile or Staff Login */}
          {isAuthenticated && user ? (
            <div className="user-profile-chip">
              <div 
                className="user-avatar"
                style={{ 
                  background: isAdmin ? 'var(--primary)' : '#475569'
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-meta">
                <div className="user-name">{user.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1px' }}>
                  <span className={`badge-role ${isAdmin ? 'admin' : 'employee'}`}>
                    {isAdmin ? 'Admin' : 'Employee'}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-icon-only" 
                onClick={logout} 
                title="Log out"
                style={{ marginLeft: '0.35rem', padding: '0.35rem' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-secondary"
              onClick={onOpenLogin}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
            >
              <LogIn size={15} />
              <span>Staff Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './api/client';
import { sharePropertyOnWhatsApp, sharePropertyViaEmail } from './services/shareService';
import EmailShareModal from './components/EmailShareModal';
import { generatePropertyPdf } from './services/pdfGenerator';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import PropertyDetails from './pages/PropertyDetails';
import AddProperty from './pages/AddProperty';
import Archived from './pages/Archived';
import Employees from './pages/Employees';
import ShareToast from './components/ShareToast';
import Login from './pages/Login';

function AppContent() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Navigation states: 'dashboard', 'inventory', 'details', 'add-property'
  const [currentTab, setCurrentTab] = useState('inventory');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [inventoryFilters, setInventoryFilters] = useState({});


  // Editing Property State
  const [editingProperty, setEditingProperty] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // WhatsApp Share State & Toast
  const [sharingPropertyId, setSharingPropertyId] = useState(null);
  const [generatingPropertyId, setGeneratingPropertyId] = useState(null);
  const [shareToast, setShareToast] = useState(null);

  // Email Share State
  const [emailShareProperty, setEmailShareProperty] = useState(null);
  const [emailSharingPropertyId, setEmailSharingPropertyId] = useState(null);

  // Redirect non-admin if currently on an admin-restricted tab (placed unconditionally at top)
  React.useEffect(() => {
    if (isAuthenticated && !isAdmin && (currentTab === 'archived' || currentTab === 'employees' || currentTab === 'add-property')) {
      setCurrentTab('inventory');
    }
  }, [isAuthenticated, isAdmin, currentTab]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-heading)',
        fontSize: '1.1rem',
        fontWeight: 500
      }}>
        Loading BLX Realty Property Portal...
      </div>
    );
  }

  // Authentication is strictly required for the Portal.
  // There is no public registration. Only users created or approved by the administrator can log in.
  if (!isAuthenticated) {
    return <Login />;
  }

  // Navigation Handlers
  const handleNavigateToInventory = (filters = {}) => {
    setInventoryFilters(filters);
    setCurrentTab('inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProperty = (id) => {
    setSelectedPropertyId(id);
    setCurrentTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToInventory = () => {
    setCurrentTab('inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated Add / Edit Property Handlers (Admin Only)
  const handleOpenAddProperty = () => {
    if (!isAdmin) return;
    setEditingProperty(null);
    setCurrentTab('add-property');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditProperty = (property) => {
    if (!isAdmin) return;
    setEditingProperty(property);
    setCurrentTab('add-property');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProperty = async (formData, propertyId) => {
    if (!isAdmin) return;
    if (propertyId) {
      await api.updateProperty(propertyId, formData);
    } else {
      await api.createProperty(formData);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  // Soft delete: Move to Archive (Admin Only)
  const handleDeleteProperty = async (id, name, alreadyConfirmed = false) => {
    if (!isAdmin) return;
    if (!alreadyConfirmed && name) {
      if (!window.confirm(`Move "${name}" to Archived Properties? You can restore it anytime from the Archived section.`)) {
        return;
      }
    }
    await api.archiveProperty(id);
    setRefreshTrigger(prev => prev + 1);
    if (currentTab === 'details') {
      setCurrentTab('inventory');
    }
  };

  const handleRestoreProperty = () => {
    if (!isAdmin) return;
    setRefreshTrigger(prev => prev + 1);
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!isAdmin) return;
    await api.updateStatus(id, newStatus);
    setRefreshTrigger(prev => prev + 1);
  };

  // Dedicated Brochure Generation & Download Handler (Employee & Admin)
  const handleGenerateBrochure = async (property) => {
    if (generatingPropertyId) return;
    try {
      setGeneratingPropertyId(property.id);
      const filename = await generatePropertyPdf(property);
      setShareToast({
        type: 'success',
        message: `Brochure "${filename}" generated and downloaded successfully.`,
      });
    } catch (err) {
      console.error('Failed to generate PDF brochure:', err);
      setShareToast({
        type: 'error',
        message: err.message || 'Failed to generate PDF brochure. Please try again.',
      });
    } finally {
      setGeneratingPropertyId(null);
    }
  };

  // WhatsApp Share Workflow Handler
  const handleShareWhatsApp = async (property) => {
    if (sharingPropertyId) return;
    try {
      setSharingPropertyId(property.id);
      const { filename } = await sharePropertyOnWhatsApp(property);
      setShareToast({
        type: 'success',
        message: `Brochure "${filename}" downloaded. WhatsApp opened with property greeting message.`,
      });
    } catch (err) {
      console.error('Failed to share property on WhatsApp:', err);
      setShareToast({
        type: 'error',
        message: err.message || 'Failed to generate PDF brochure. Please try again.',
      });
    } finally {
      setSharingPropertyId(null);
    }
  };

  // Email Share Workflow Handlers
  const handleOpenEmailShare = (property) => {
    if (emailSharingPropertyId) return;
    setEmailShareProperty(property);
  };

  const handleSendEmail = async (property, emailData) => {
    try {
      setEmailSharingPropertyId(property.id);
      const emailOptions = typeof emailData === 'string'
        ? { recipientEmail: emailData }
        : emailData;

      await sharePropertyViaEmail(property, emailOptions);
      setEmailShareProperty(null);
      setShareToast({
        type: 'success',
        message: `Gmail opened with prefilled brochure message for ${property.name}.`,
      });
    } catch (err) {
      console.error('Failed to send email:', err);
      setShareToast({
        type: 'error',
        message: err.message || 'Failed to prepare email. Please try again.',
      });
    } finally {
      setEmailSharingPropertyId(null);
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'inventory') setInventoryFilters({});
        }}
        onOpenAddProperty={handleOpenAddProperty}
      />

      <main className="main-content">
        {(() => {
          if (currentTab === 'dashboard') {
            return (
              <Dashboard
                key={refreshTrigger}
                onNavigateToInventory={handleNavigateToInventory}
                onSelectProperty={handleSelectProperty}
                onOpenAddProperty={handleOpenAddProperty}
                onEditProperty={handleOpenEditProperty}
                onDeleteProperty={handleDeleteProperty}
                onStatusChange={handleStatusChange}
                onShareWhatsApp={handleShareWhatsApp}
                sharingPropertyId={sharingPropertyId}
                onGenerateBrochure={handleGenerateBrochure}
                generatingPropertyId={generatingPropertyId}
                onShareEmail={handleOpenEmailShare}
                emailSharingPropertyId={emailSharingPropertyId}
              />
            );
          }

          if (currentTab === 'details' && selectedPropertyId) {
            return (
              <PropertyDetails
                key={`${refreshTrigger}-${selectedPropertyId}`}
                propertyId={selectedPropertyId}
                onBack={handleBackToInventory}
                onEdit={handleOpenEditProperty}
                onDelete={handleDeleteProperty}
                onStatusChange={handleStatusChange}
                onShareWhatsApp={handleShareWhatsApp}
                isSharing={sharingPropertyId === selectedPropertyId}
                onGenerateBrochure={handleGenerateBrochure}
                isGenerating={generatingPropertyId === selectedPropertyId}
                onShareEmail={handleOpenEmailShare}
                isEmailSharing={emailSharingPropertyId === selectedPropertyId}
              />
            );
          }

          if (isAdmin && currentTab === 'archived') {
            return (
              <Archived
                key={refreshTrigger}
                onRestoreProperty={handleRestoreProperty}
                onNavigateToInventory={handleNavigateToInventory}
              />
            );
          }

          if (isAdmin && currentTab === 'employees') {
            return (
              <Employees
                key={refreshTrigger}
              />
            );
          }

          if (isAdmin && currentTab === 'add-property') {
            return (
              <AddProperty
                key={`${refreshTrigger}-${editingProperty?.id || 'new'}`}
                onBack={handleBackToInventory}
                onSave={handleSaveProperty}
                initialData={editingProperty}
              />
            );
          }

          // Guaranteed default fallback: Inventory (Active Properties)
          // Guarantees an empty/blank page cannot be rendered on any navigation or unauthorized attempt
          return (
            <Inventory
              key={`${refreshTrigger}-${JSON.stringify(inventoryFilters)}`}
              initialFilters={inventoryFilters}
              onSelectProperty={handleSelectProperty}
              onOpenAddProperty={handleOpenAddProperty}
              onEditProperty={handleOpenEditProperty}
              onDeleteProperty={handleDeleteProperty}
              onStatusChange={handleStatusChange}
              onShareWhatsApp={handleShareWhatsApp}
              sharingPropertyId={sharingPropertyId}
              onGenerateBrochure={handleGenerateBrochure}
              generatingPropertyId={generatingPropertyId}
              onShareEmail={handleOpenEmailShare}
              emailSharingPropertyId={emailSharingPropertyId}
            />
          );
        })()}
      </main>

      {/* WhatsApp Share Toast Notification */}
      <ShareToast
        toast={shareToast}
        onDismiss={() => setShareToast(null)}
      />

      {/* Email Share Modal / Composer */}
      {emailShareProperty && (
        <EmailShareModal
          property={emailShareProperty}
          onSend={handleSendEmail}
          onClose={() => setEmailShareProperty(null)}
          isSending={!!emailSharingPropertyId}
          onGenerateBrochure={handleGenerateBrochure}
          isGenerating={generatingPropertyId === emailShareProperty.id}
        />
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Portal Error Boundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-app)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-heading)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#dc2626' }}>
            Portal Encountered an Unexpected Error
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'An error occurred during page rendering.'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Portal
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

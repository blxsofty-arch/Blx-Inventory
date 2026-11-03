import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, Paperclip } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

export default function ShareToast({ toast, onDismiss }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.75rem',
      right: '1.75rem',
      zIndex: 150,
      maxWidth: '440px',
      width: 'calc(100% - 2.5rem)',
      background: isError ? '#1f1315' : '#0f1f18',
      border: `1px solid ${isError ? '#ef4444' : '#25D366'}`,
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.85rem',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        color: isError ? '#ef4444' : '#25D366',
        marginTop: '2px',
        flexShrink: 0
      }}>
        {isError ? <AlertTriangle size={20} /> : <WhatsAppIcon size={22} color="#25D366" />}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.88rem',
          fontWeight: 600,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.25rem'
        }}>
          {isError ? 'PDF Sharing Failed' : 'Brochure Downloaded & WhatsApp Ready'}
        </div>

        <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45 }}>
          {toast.message}
        </p>

        {!isError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.5rem',
            padding: '0.35rem 0.6rem',
            background: 'rgba(37, 211, 102, 0.1)',
            border: '1px dashed rgba(37, 211, 102, 0.3)',
            borderRadius: '6px',
            fontSize: '0.72rem',
            color: '#86efac'
          }}>
            <Paperclip size={13} />
            <span>Reminder: Attach the downloaded PDF in your WhatsApp chat window.</span>
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '0.2rem',
          borderRadius: '4px'
        }}
        title="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Send,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  FileText,
  FileDown,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Trash2,
  Info
} from 'lucide-react';
import { buildEmailSubject, buildEmailMessage } from '../services/shareService';

/**
 * EmailShareModal - Dedicated Email Composer for PDF Brochure Sharing
 * 
 * Includes:
 * - Recipient Email address with validation
 * - Auto-generated and editable Subject
 * - Professional prefilled and editable Message
 * - Clear manual PDF brochure attachment section with instructions
 * - One-click Download PDF Brochure helper
 * - Send via Gmail integration & mailto client support
 */
export default function EmailShareModal({
  property,
  onSend,
  onClose,
  isSending = false,
  onGenerateBrochure,
  isGenerating = false,
}) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [clientType, setClientType] = useState('gmail'); // 'gmail' | 'mailto'

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize prefilled subject and message when property changes
  useEffect(() => {
    if (property) {
      setSubject(buildEmailSubject(property));
      setMessage(buildEmailMessage(property, recipientName));
    }
  }, [property]);

  // Update salutation when recipient name changes (only if message hasn't been heavily customized)
  const handleRecipientNameChange = (e) => {
    const newName = e.target.value;
    setRecipientName(newName);
    // If the message currently starts with "Dear ...," update just the first line
    setMessage((prev) => {
      const salutation = newName.trim() ? `Dear ${newName.trim()},` : 'Dear Sir/Madam,';
      if (/^Dear\s+[^,]+,/.test(prev)) {
        return prev.replace(/^Dear\s+[^,]+,/, salutation);
      }
      return prev;
    });
  };

  // Reset message to standard BLX Realty template
  const handleResetMessage = () => {
    if (property) {
      setSubject(buildEmailSubject(property));
      setMessage(buildEmailMessage(property, recipientName));
    }
  };

  // Auto-focus input when modal opens
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Handle manual file selection
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setAttachedFile(file);
        setError('');
      } else {
        setError('Please select a valid PDF file for the brochure.');
      }
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setAttachedFile(file);
        setError('');
      } else {
        setError('Please select a valid PDF file for the brochure.');
      }
    }
  };

  // Copy email text to clipboard
  const handleCopyMessage = async () => {
    try {
      const fullText = `To: ${recipientEmail}\nSubject: ${subject}\n\n${message}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!recipientEmail.trim()) {
      setError("Please enter the recipient's email address.");
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    if (!validateEmail(recipientEmail)) {
      setError('Please enter a valid email address (e.g. client@example.com).');
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    if (!subject.trim()) {
      setError('Please provide an email subject line.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter your email message body.');
      return;
    }

    onSend(property, {
      recipientEmail: recipientEmail.trim(),
      recipientName: recipientName.trim(),
      subject: subject.trim(),
      message: message.trim(),
      attachedFile,
      client: clientType,
    });
  };

  if (!property) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease',
        overflowY: 'auto',
      }}
    >
      {/* Modal panel */}
      <div
        style={{
          background: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: 'var(--radius-xl, 12px)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.2rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle, #f8fafc)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(37, 99, 235, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}>
              <Mail size={20} />
            </div>
            <div>
              <h2 style={{
                fontWeight: 700,
                fontSize: '1.15rem',
                color: 'var(--text-primary, #0f172a)',
                margin: 0,
                fontFamily: 'var(--font-heading, inherit)',
              }}>
                Email Property Brochure
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '0.15rem' }}>
                Compose and review your email message before sending via Gmail
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={onClose}
            title="Close"
            style={{ padding: '0.4rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '1.35rem 1.5rem', overflowY: 'auto', flex: '1' }}>
          
          {/* Property Reference Card */}
          <div style={{
            background: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ minWidth: '220px', flex: 1 }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Selected Property
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.98rem', marginTop: '0.1rem' }}>
                {property.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {property.location}{property.configuration ? ` · ${property.configuration}` : ''}{property.price ? ` · ${property.price}` : ''}
              </div>
            </div>

            {/* Quick Brochure Generator Button */}
            {onGenerateBrochure && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onGenerateBrochure(property)}
                disabled={isGenerating}
                title="Download verified PDF brochure to your device"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              >
                <FileDown size={14} />
                <span>{isGenerating ? 'Generating PDF...' : 'Download Brochure PDF'}</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            
            {/* Recipient Details Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem',
                }}>
                  Recipient Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  ref={inputRef}
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => { setRecipientEmail(e.target.value); setError(''); }}
                  placeholder="client@example.com"
                  disabled={isSending}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: `1px solid ${error && !recipientEmail ? '#ef4444' : 'var(--border-default, #cbd5e1)'}`,
                    background: 'var(--bg-input, #ffffff)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem',
                }}>
                  Recipient Name <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={handleRecipientNameChange}
                  placeholder="e.g. Rajesh Kumar"
                  disabled={isSending}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    background: 'var(--bg-input, #ffffff)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Subject Field */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}>
                Subject <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setError(''); }}
                placeholder={`Property Brochure – ${property.name}`}
                disabled={isSending}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-default, #cbd5e1)',
                  background: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Message Body Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}>
                  Email Message Body <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetMessage}
                  title="Reset to default template"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary, #2563eb)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: 0,
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Reset to Template</span>
                </button>
              </div>

              <textarea
                rows={9}
                value={message}
                onChange={(e) => { setMessage(e.target.value); setError(''); }}
                disabled={isSending}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-default, #cbd5e1)',
                  background: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Manual PDF Attachment Section */}
            <div style={{
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px dashed var(--border-medium, #cbd5e1)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Paperclip size={15} style={{ color: 'var(--primary, #2563eb)' }} />
                  <span>PDF Brochure Attachment</span>
                </div>
                {attachedFile && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#059669',
                    background: '#d1fae5',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                  }}>
                    <CheckCircle2 size={12} />
                    Ready to attach in Gmail
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {attachedFile ? (
                /* Attached file preview pill */
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-surface, #ffffff)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '0.6rem 0.85rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                    <FileText size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {attachedFile.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(attachedFile.size)} · PDF Brochure Attached
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon-only"
                      style={{ padding: '0.25rem 0.4rem', color: '#ef4444' }}
                      onClick={() => setAttachedFile(null)}
                      title="Remove attachment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state / drop target */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: isDragging ? '2px dashed var(--primary, #2563eb)' : '1px dashed var(--border-medium, #cbd5e1)',
                    background: isDragging ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-surface, #ffffff)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    padding: '0.9rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileText size={22} style={{ color: 'var(--text-muted)', margin: '0 auto 0.35rem' }} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Click or drag the generated PDF brochure here to attach
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Attach your downloaded official BLX Realty brochure (PDF format)
                  </div>
                </div>
              )}

              {/* Clear instructions */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem',
                marginTop: '0.65rem',
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.45',
              }}>
                <Info size={14} style={{ color: 'var(--primary, #2563eb)', flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                  <strong>Attachment Guide:</strong> When you click <em>Send via Gmail</em>, Gmail opens with recipient, subject, and message prefilled. Use Gmail's attachment icon to attach this downloaded brochure PDF before clicking send.
                </span>
              </div>
            </div>

            {/* Email Client Choice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.8rem',
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Send through:</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setClientType('gmail')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: clientType === 'gmail' ? '1px solid #2563eb' : '1px solid var(--border-subtle)',
                    background: clientType === 'gmail' ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    color: clientType === 'gmail' ? '#2563eb' : 'var(--text-secondary)',
                    fontWeight: clientType === 'gmail' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  Gmail (Web)
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('mailto')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: clientType === 'mailto' ? '1px solid #2563eb' : '1px solid var(--border-subtle)',
                    background: clientType === 'mailto' ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    color: clientType === 'mailto' ? '#2563eb' : 'var(--text-secondary)',
                    fontWeight: clientType === 'mailto' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  Default Mail App (mailto)
                </button>
              </div>
            </div>

            {/* Inline Error Message */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#ef4444',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                background: '#fee2e2',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm, 6px)',
              }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
              flexWrap: 'wrap',
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              paddingTop: '1rem',
            }}>
              {/* Copy Message helper button */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyMessage}
                title="Copy entire email to clipboard"
                style={{ fontSize: '0.82rem' }}
              >
                {copied ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Message'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.6rem', flex: 1, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-email"
                  disabled={isSending || !recipientEmail.trim()}
                  style={{
                    padding: '0.6rem 1.25rem',
                    fontWeight: 600,
                  }}
                >
                  {isSending ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Preparing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{clientType === 'gmail' ? 'Send via Gmail' : 'Send Email'}</span>
                      <ExternalLink size={13} style={{ opacity: 0.7 }} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

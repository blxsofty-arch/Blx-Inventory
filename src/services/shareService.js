import { generatePropertyPdf } from './pdfGenerator.js';

/**
 * Builds a formatted email subject line for a property share.
 * @param {Object} property
 * @returns {string}
 */
export function buildEmailSubject(property) {
  return `Property Brochure – ${property.name}`;
}

/**
 * Builds the pre-filled professional email body for a property share.
 * Uses the recipient name placeholder if not yet known.
 * @param {Object} property
 * @param {string} [recipientName] - Optional recipient first name
 * @returns {string}
 */
export function buildEmailMessage(property, recipientName = '') {
  const salutation = recipientName && recipientName.trim()
    ? `Dear ${recipientName.trim()},`
    : 'Dear Sir/Madam,';

  const locationLine = property.location
    ? `, located in ${property.location}`
    : '';

  const lines = [
    salutation,
    '',
    'Greetings from BLX Realty!',
    '',
    `Please find attached the property brochure for ${property.name}${locationLine}.`,
    '',
    'The brochure contains the property details, amenities, specifications and other relevant information for your reference.',
    '',
    'Please feel free to reach out to us if you require any additional information or would like to schedule a site visit.',
    '',
    'Best regards,',
    'BLX Realty Team',
  ];

  return lines.join('\n');
}

/**
 * Handles the complete Email Share workflow:
 * 1. Uses prefilled / user-edited subject and message
 * 2. Launches the configured Gmail integration (or mailto) with To, Subject, and prefilled Message
 * 
 * @param {Object} property - Property record from database
 * @param {string|Object} emailOrOptions - Recipient email string OR composer options object
 * @param {Object} [legacyOptions]
 * @returns {Promise<{ success: boolean, recipientEmail: string, subject: string }>}
 */
export async function sharePropertyViaEmail(property, emailOrOptions, legacyOptions = {}) {
  if (!property) {
    throw new Error('No property data available for sharing');
  }

  let recipientEmail = '';
  let subject = '';
  let body = '';
  let client = 'gmail';

  if (typeof emailOrOptions === 'string') {
    recipientEmail = emailOrOptions;
    subject = legacyOptions.subject || buildEmailSubject(property);
    body = legacyOptions.message || buildEmailMessage(property);
    client = legacyOptions.client || 'gmail';
  } else if (emailOrOptions && typeof emailOrOptions === 'object') {
    recipientEmail = emailOrOptions.recipientEmail || '';
    subject = emailOrOptions.subject || buildEmailSubject(property);
    body = emailOrOptions.message || buildEmailMessage(property);
    client = emailOrOptions.client || 'gmail';
  }

  if (!recipientEmail || !recipientEmail.trim()) {
    throw new Error('Recipient email address is required');
  }

  const encodedTo = encodeURIComponent(recipientEmail.trim());
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
  const mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;

  if (client === 'mailto') {
    window.location.href = mailtoUrl;
  } else {
    // Open Gmail web compose in a new tab
    const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    // Fallback if popup blocker intercepted new window
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = mailtoUrl;
    }
  }

  return { success: true, recipientEmail: recipientEmail.trim(), subject };
}

/**
 * Constructs the prefilled WhatsApp customer message according to BLX Realty specifications
 * @param {Object} property 
 * @returns {string}
 */
export function buildWhatsAppMessage(property) {
  const parts = [
    'Hello! Greetings from BLX Realty.\n',
    `Please find the property details for ${property.name} in ${property.location}.\n`,
  ];

  if (property.price && property.price.trim() !== '') {
    parts.push(`Price: ${property.price}`);
  }

  if (property.configuration && property.configuration.trim() !== '') {
    parts.push(`Configuration: ${property.configuration}`);
  }

  if (property.original_url && property.original_url.trim() !== '') {
    parts.push(`Property URL: ${property.original_url}`);
  }

  parts.push('\nI\'ve attached the property brochure for your reference.\n');
  parts.push('Please feel free to contact us for further information.\n');
  parts.push('Regards,\nBLX Realty');

  return parts.join('\n');
}

/**
 * Handles the complete WhatsApp Share workflow:
 * 1. Generates and downloads the branded PDF brochure for the selected property
 * 2. Opens WhatsApp with the pre-filled customer message
 * 3. Returns download info for user guidance
 * 
 * @param {Object} property - Property record from database
 * @returns {Promise<{ filename: string }>}
 */
export async function sharePropertyOnWhatsApp(property) {
  if (!property) {
    throw new Error('No property data available for sharing');
  }

  // 1. Generate & download the PDF brochure
  const filename = await generatePropertyPdf(property);

  // 2. Build the pre-filled WhatsApp message
  const message = buildWhatsAppMessage(property);

  // 3. Open WhatsApp Web or Mobile WhatsApp
  // Using https://api.whatsapp.com/send?text=... works on both desktop browser and mobile devices
  const encodedText = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  // Small delay to allow browser download to start before tab switch
  setTimeout(() => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }, 400);

  return { filename };
}

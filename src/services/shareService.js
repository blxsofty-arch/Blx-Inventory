import { generatePropertyPdf } from './pdfGenerator.js';

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

import { jsPDF } from 'jspdf';
import { BLX_LOGO_BASE64 } from '../assets/logoBase64.js';

// Global cache for loaded font binary data
let fontBinaryCache = null;

/**
 * Loads authentic Lato TrueType fonts (Regular & Bold) with full Indian Rupee (₹) symbol support.
 */
async function loadFonts() {
  if (fontBinaryCache) return fontBinaryCache;
  try {
    let regBuf, boldBuf;

    if (typeof window === 'undefined') {
      const fsMod = 'fs';
      const pathMod = 'path';
      const fs = await import(/* @vite-ignore */ fsMod);
      const path = await import(/* @vite-ignore */ pathMod);
      
      const latoRegPath = path.resolve('public/fonts/Lato-Regular.ttf');
      const latoBoldPath = path.resolve('public/fonts/Lato-Bold.ttf');
      
      if (fs.existsSync(latoRegPath) && fs.existsSync(latoBoldPath)) {
        regBuf = fs.readFileSync(latoRegPath);
        boldBuf = fs.readFileSync(latoBoldPath);
      } else {
        const arialPath = path.resolve('public/fonts/Arial.ttf');
        const arialBoldPath = path.resolve('public/fonts/Arial-Bold.ttf');
        regBuf = fs.readFileSync(arialPath);
        boldBuf = fs.readFileSync(arialBoldPath);
      }
    } else {
      let regRes = await fetch('/fonts/Lato-Regular.ttf');
      let boldRes = await fetch('/fonts/Lato-Bold.ttf');
      
      if (!regRes.ok || !boldRes.ok) {
        regRes = await fetch('/fonts/Arial.ttf');
        boldRes = await fetch('/fonts/Arial-Bold.ttf');
      }

      if (!regRes.ok || !boldRes.ok) {
        throw new Error(`Font fetch HTTP status: ${regRes.status}, ${boldRes.status}`);
      }

      [regBuf, boldBuf] = await Promise.all([
        regRes.arrayBuffer(),
        boldRes.arrayBuffer(),
      ]);
    }

    const toBinary = (buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      return binary;
    };

    fontBinaryCache = {
      regular: toBinary(regBuf),
      bold: toBinary(boldBuf),
    };
    return fontBinaryCache;
  } catch (err) {
    console.warn('Could not load TrueType fonts, falling back to standard fonts', err);
    return null;
  }
}

/**
 * Loads an image from URL or path, preserves natural proportions without stretching or distortion.
 */
async function loadImage(url, targetW = 800, targetH = 600) {
  if (!url) return null;

  if (url.startsWith('data:')) {
    return { dataUrl: url, width: targetW, height: targetH, aspect: targetW / targetH };
  }
  
  if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
    try {
      if (url.startsWith('/')) {
        const fsMod = 'fs';
        const pathMod = 'path';
        const fs = await import(/* @vite-ignore */ fsMod);
        const path = await import(/* @vite-ignore */ pathMod);
        const localPath = path.resolve('public' + url);
        if (fs.existsSync(localPath)) {
          const buf = fs.readFileSync(localPath);
          const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'png';
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          return { dataUrl: `data:${mime};base64,` + buf.toString('base64'), width: targetW, height: targetH, aspect: targetW / targetH };
        }
      } else if (url.startsWith('http')) {
        const res = await fetch(url);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const buf = Buffer.from(arrayBuffer);
          const base64 = buf.toString('base64');
          const mime = res.headers.get('content-type') || 'image/jpeg';
          return { dataUrl: `data:${mime};base64,${base64}`, width: targetW, height: targetH, aspect: targetW / targetH };
        }
      }
    } catch (e) {
      console.warn('Node image load error:', url, e);
      return null;
    }
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const nw = img.naturalWidth || img.width || 800;
        const nh = img.naturalHeight || img.height || 600;
        const aspect = nw / nh;
        const targetAspect = targetW / targetH;

        let sx, sy, sw, sh;
        if (aspect > targetAspect) {
          sh = nh;
          sw = Math.round(nh * targetAspect);
          sx = Math.round((nw - sw) / 2);
          sy = 0;
        } else {
          sw = nw;
          sh = Math.round(nw / targetAspect);
          sx = 0;
          sy = Math.round((nh - sh) / 2);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve({ dataUrl, width: targetW, height: targetH, aspect: targetAspect });
      } catch (err) {
        console.warn('Canvas processing error, using raw URL if possible:', err);
        resolve({ dataUrl: url, width: targetW, height: targetH, aspect: targetW / targetH });
      }
    };
    img.onerror = () => resolve(null);
    setTimeout(() => resolve(null), 5000);
    img.src = url;
  });
}

/**
 * Checks whether Property Type is exactly "Plot"
 * Only Property Type === "Plot" uses the separate 3-page Plot PDF template.
 */
export function isPlotProperty(property) {
  if (!property) return false;
  const pType = (property.property_type || '').trim().toLowerCase();
  return pType === 'plot';
}

/**
 * Extracts clean growth corridor name from address
 */
function extractCorridor(location) {
  if (!location) return 'BENGALURU';
  const locUpper = location.toUpperCase();
  if (locUpper.includes('DEVANAHALLI') || locUpper.includes('SATHANUR') || locUpper.includes('YELAHANKA') || locUpper.includes('AIRPORT') || locUpper.includes('HEBBAL')) {
    return 'NORTH BENGALURU';
  }
  if (locUpper.includes('WHITEFIELD') || locUpper.includes('SARJAPUR') || locUpper.includes('VARTHUR') || locUpper.includes('MARATHAHALLI')) {
    return 'EAST BENGALURU';
  }
  if (locUpper.includes('ELECTRONIC CITY') || locUpper.includes('HSR') || locUpper.includes('KORAMANGALA') || locUpper.includes('BANNERGHATTA')) {
    return 'SOUTH BENGALURU';
  }
  if (locUpper.includes('YESHWANTHPUR') || locUpper.includes('RAJAJINAGAR') || locUpper.includes('MALLESHWARAM')) {
    return 'WEST BENGALURU';
  }
  const parts = location.split(',');
  return (parts[parts.length > 2 ? parts.length - 2 : 0] || 'BENGALURU').trim().toUpperCase();
}

/**
 * Extracts clean price figure without duplicated prefixes
 */
function extractCleanPrice(priceStr) {
  if (!priceStr) return '₹1.00 Cr';
  let clean = priceStr.trim();
  clean = clean.replace(/^starting\s+from\s*:?\s*/i, '');
  clean = clean.replace(/^from\s*:?\s*/i, '');
  clean = clean.trim();
  if (!clean.startsWith('₹') && !clean.toLowerCase().startsWith('rs')) {
    clean = '₹' + clean;
  }
  return clean;
}

/**
 * Formats rate per sq.ft from price or calculates from price_numeric & area_numeric (for Plot)
 */
function formatPricePerSqFt(property) {
  if (property.price && (property.price.includes('/sq.ft') || property.price.includes('/Sq.Ft') || property.price.includes('/sqft'))) {
    return property.price;
  }
  if (property.price_numeric && property.area_numeric && property.area_numeric > 0) {
    const rate = Math.round(property.price_numeric / property.area_numeric);
    return `₹${rate.toLocaleString('en-IN')} / sq.ft`;
  }
  return 'Competitive Market Rate';
}

/**
 * Formats plot dimensions string based on actual area
 */
function getPlotDimensions(property) {
  if (property.dimensions) return property.dimensions;
  const area = (property.area || property.configuration || '').toLowerCase();
  if (area.includes('1200') || area.includes('1,200')) return '30 ft × 40 ft (1,200 sq.ft)';
  if (area.includes('1500') || area.includes('1,500')) return '30 ft × 50 ft (1,500 sq.ft)';
  if (area.includes('2400') || area.includes('2,400')) return '40 ft × 60 ft (2,400 sq.ft)';
  return '30×40, 30×50 & 40×60 ft variants';
}

/**
 * Draws the master architectural background grid lines and off-white background
 * Background: RGB(241, 241, 243)
 * Grid lines: RGB(201, 205, 211), width = 0.55 pt
 */
function drawPageBackground(doc) {
  doc.setFillColor(241, 241, 243);
  doc.rect(0, 0, 595.28, 841.89, 'F');

  doc.setDrawColor(201, 205, 211);
  doc.setLineWidth(0.55);

  const verticalLines = [26.0, 328.0, 421.0, 570.0];
  verticalLines.forEach((x) => {
    doc.line(x, 0, x, 841.89);
  });

  const horizontalLines = [46.89, 111.89, 621.89, 721.89, 771.89];
  horizontalLines.forEach((y) => {
    doc.line(0, y, 595.28, y);
  });
}

/**
 * Draws official BLX header with logo and Bengaluru-London Exchange title
 */
function drawPageHeader(doc, logoImg, fontFam) {
  // Directly embed authentic BLX Realty transparent logo into PDF content
  try {
    doc.addImage(BLX_LOGO_BASE64, 'PNG', 52.0, 4.0, 78.0, 53.0, 'BLX_LOGO', 'FAST');
  } catch (err) {
    if (logoImg?.dataUrl) {
      doc.addImage(logoImg.dataUrl, 'PNG', 52.0, 4.0, 78.0, 53.0, 'BLX_LOGO', 'FAST');
    } else {
      doc.setFont(fontFam, 'bold');
      doc.setFontSize(18);
      doc.setTextColor(6, 28, 67);
      doc.text('blx REALTY', 52.0, 35.0);
    }
  }

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 28, 67);
  doc.text('THE BENGALURU-LONDON EXCHANGE', 570.0, 27.9, { align: 'right' });

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(6, 28, 67);
  doc.text('PROPERTY PRESENTATION', 570.0, 40.4, { align: 'right' });

  doc.setDrawColor(183, 146, 67);
  doc.setLineWidth(2.2);
  doc.line(421.0, 63.89, 574.0, 63.89);
}

/**
 * Draws the master footer with contact line and two-digit page numbering
 */
function drawPageFooter(doc, pageNum, fontFam) {
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(98, 109, 127);
  doc.text('BLX REALTY · www.theblxrealty.com · +91 8197773166', 52.0, 803.1);

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(9.0);
  doc.setTextColor(23, 36, 58);
  const pageStr = String(pageNum).padStart(2, '0');
  doc.text(pageStr, 570.0, 801.6, { align: 'right' });
}

/**
 * Draws vertical gold accent bar
 */
function drawGoldBar(doc, x, y1, y2, width = 3.0) {
  doc.setDrawColor(183, 146, 67);
  doc.setLineWidth(width);
  doc.line(x, y1, x, y2);
}

/**
 * Draws the standardized 4-paragraph legal disclaimer section
 */
function drawDisclaimerSection(doc, x, y, width, height, fontFam, isWhiteCard = true) {
  if (isWhiteCard) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 4, 4, 'F');
    doc.setDrawColor(201, 205, 211);
    doc.setLineWidth(0.55);
    doc.roundedRect(x, y, width, height, 4, 4, 'D');
  }

  const textX = x + 18.0;
  let textY = y + 42.0;
  const contentWidth = width - 36.0;

  const paragraphs = [
    'The property PDF and all information contained within it are confidential and intended solely for the recipient for property evaluation and discussion purposes. The document should not be forwarded, copied, reproduced, published, uploaded, or circulated to any third party without prior authorization from BLX Realty. Please treat the information and materials contained in this document as confidential.',
    'The images, photographs, illustrations, renders, floor plans, and other visual materials included in the PDF are provided for showcase and representation purposes only. They are intended to provide a general understanding of the property, project, amenities, and overall development. The actual property, interiors, finishes, landscaping, views, amenities, specifications, and surrounding environment may vary from the visuals presented.',
    'Property prices mentioned in the PDF are indicative and subject to change. The final property price will depend on the latest availability, configuration, unit selection, applicable offers, charges, taxes, and other terms prevailing at the time of purchase. The final price must be confirmed and mutually finalized with the concerned developer/seller before proceeding with any transaction or commitment.',
    'Property availability, specifications, amenities, timelines, and other project-related information may also change without prior notice. Recipients are advised to verify the latest information with BLX Realty and/or the concerned developer before making any decision. This document should therefore be treated as a preliminary property reference and not as a final commercial offer or contractual document.',
  ];

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(51, 65, 85);

  paragraphs.forEach((pText) => {
    const lines = doc.splitTextToSize(pText, contentWidth);
    doc.text(lines, textX, textY, { lineHeightFactor: 1.5 });
    textY += lines.length * 14.0 + 15.0;
  });
}

/**
 * -----------------------------------------------------------------------------
 * EXISTING 5-PAGE RESIDENTIAL MASTER BROCHURE TEMPLATE
 * 
 * IMPORTANT: THIS IS THE APPROVED 5-PAGE PDF TEMPLATE.
 * REMAINS EXACTLY AS CURRENTLY APPROVED AND UNTOUCHED FOR ALL NON-PLOT PROPERTIES.
 * -----------------------------------------------------------------------------
 */
function renderResidentialBrochure(doc, property, images, logoImg, fontFam) {
  const [heroImg, livingImg, galleryImg1, galleryImg2] = images;
  const developer = (property.developer || 'BLX Curated Partner').toUpperCase();
  const corridor = extractCorridor(property.location);
  const cleanPrice = extractCleanPrice(property.price);

  // ===========================================================================
  // PAGE 1: COVER & PRIMARY HERO PRESENTATION
  // ===========================================================================
  drawPageBackground(doc);
  drawPageHeader(doc, logoImg, fontFam);

  // Category / Location Breadcrumb
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 36, 58);
  doc.text(`${developer} / ${corridor}`, 52.0, 93.0);

  // Main Property Name - auto-size font so long titles remain on a single line without colliding with the right column
  doc.setFont(fontFam, 'bold');
  const availableTitleWidth = 345.0;
  let titleFontSize = 24.0;
  doc.setFontSize(titleFontSize);
  let titleWidth = doc.getTextWidth(property.name);

  while (titleWidth > availableTitleWidth && titleFontSize > 18.0) {
    titleFontSize -= 0.5;
    doc.setFontSize(titleFontSize);
    titleWidth = doc.getTextWidth(property.name);
  }

  if (titleWidth <= availableTitleWidth) {
    doc.setFontSize(titleFontSize);
    doc.text(property.name, 52.0, 121.8);
  } else {
    doc.setFontSize(18.0);
    const titleLines = doc.splitTextToSize(property.name, availableTitleWidth);
    doc.text(titleLines.slice(0, 2), 52.0, 116.0, { lineHeightFactor: 1.15 });
  }

  // Full Location Address
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(10.0);
  doc.setTextColor(98, 109, 127);
  const locLines = doc.splitTextToSize(property.location || 'Bengaluru, Karnataka', 320);
  doc.text(locLines.slice(0, 2), 52.0, 151.8);

  // Right Side - PRICE Block (neatly aligned in right column)
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 36, 58);
  doc.text('PRICE', 430.0, 125.5);

  doc.setFontSize(15.0);
  doc.text('STARTING FROM', 430.0, 139.8);

  doc.setFontSize(20.0);
  doc.text(cleanPrice, 568.0, 160.8, { align: 'right' });
  drawGoldBar(doc, 574.0, 143.89, 181.89, 2.5);

  // Page 1 Main Property Photograph [25.0, 266.89, 570.0, 574.89] (w: 545, h: 308 - reduced to approx 2/3 / 67.7% size)
  if (heroImg?.dataUrl) {
    doc.addImage(heroImg.dataUrl, 'JPEG', 25.0, 266.89, 545.0, 308.0, undefined, 'FAST');
  } else {
    // Intelligent architectural fallback without fake images
    doc.setFillColor(255, 255, 255);
    doc.rect(25.0, 266.89, 545.0, 308.0, 'F');
    doc.setDrawColor(201, 205, 211);
    doc.setLineWidth(0.55);
    doc.rect(25.0, 266.89, 545.0, 308.0, 'D');

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(18);
    doc.setTextColor(23, 36, 58);
    doc.text(property.name, 297.5, 400.0, { align: 'center' });
    doc.setFont(fontFam, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(98, 109, 127);
    doc.text(`Official Curated Property Presentation · ${corridor}`, 297.5, 425.0, { align: 'center' });
  }

  // Floating White Highlight Badge on Bottom-Left of Image
  // Anchored to bottom of hero photo (y = 574.89) with proper wrapping and padding
  const panelX = 26.0;
  const panelW = 260.0;
  const panelH = 86.0;
  const panelY = 574.89 - panelH;
  const padX = 14.0;
  const textX = panelX + padX;
  const maxTextW = panelW - (padX * 2);

  doc.setFillColor(255, 255, 255);
  doc.rect(panelX, panelY, panelW, panelH, 'F');
  doc.setDrawColor(201, 205, 211);
  doc.setLineWidth(0.55);
  doc.rect(panelX, panelY, panelW, panelH, 'D');

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(23, 36, 58);
  const headerText = `SMART HOMES · ${corridor}`;
  const headerLines = doc.splitTextToSize(headerText, maxTextW);
  doc.text(headerLines.slice(0, 2), textX, panelY + 16.0, { lineHeightFactor: 1.15 });

  const afterHeaderY = panelY + (headerLines.length > 1 ? 34.0 : 25.0);

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(23, 36, 58);
  const parsedAmenities = Array.isArray(property.amenities)
    ? property.amenities
    : (typeof property.amenities === 'string' ? (() => { try { return JSON.parse(property.amenities); } catch { return [property.amenities]; } })() : []);
  const primaryAmenity = parsedAmenities?.[0] || 'Efficient space utilization';
  const amenLines = doc.splitTextToSize(primaryAmenity, maxTextW);
  doc.text(amenLines[0] || primaryAmenity, textX, afterHeaderY + 11.0);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(98, 109, 127);
  const subFeatureText = 'Natural ventilation · KIA airport corridor';
  const subLines = doc.splitTextToSize(subFeatureText, maxTextW);
  doc.text(subLines[0] || subFeatureText, textX, afterHeaderY + 26.0);

  // ===========================================================================
  // TWO-COLUMN SECTION BELOW HERO IMAGE:
  // Left: Description paragraph ("Thoughtfully designed...")
  // Right: CONFIGURATION block with orange/gold vertical accent theme line
  // ===========================================================================
  const belowImageY = 650.0;

  // 1. Bottom-Left: Description Paragraph
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(23, 36, 58);
  const p1Intro = `Thoughtfully designed ${property.configuration || 'smart'} homes crafted by ${property.developer || 'BLX Curated Partner'} on prime transit corridor in ${corridor}.`;
  const p1IntroLines = doc.splitTextToSize(p1Intro, 330);
  doc.text(p1IntroLines.slice(0, 3), 52.0, belowImageY, { lineHeightFactor: 1.4 });

  // 2. Bottom-Right: CONFIGURATION Section (horizontally aligned with description)
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 36, 58);
  doc.text('CONFIGURATION', 430.0, belowImageY);

  doc.setFontSize(14.0);
  doc.text(property.configuration || '1 BHK & 2 BHK', 568.0, belowImageY + 18.0, { align: 'right' });

  // Orange/gold vertical accent theme line beside configuration content
  drawGoldBar(doc, 574.0, belowImageY + 2.5, belowImageY + 40.5, 2.5);

  // Footer Contact & Number
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(98, 109, 127);
  doc.text('discoverblr@theblxrealty.com · +91 8197773166', 52.0, 783.9);

  drawPageFooter(doc, 1, fontFam);

  // ===========================================================================
  // PAGE 2: LIFESTYLE, ABOUT THE PROPERTY & KEY SPECIFICATIONS
  // ===========================================================================
  doc.addPage();
  drawPageBackground(doc);
  drawPageHeader(doc, logoImg, fontFam);

  // Left Headline with Vertical Gold Bar
  drawGoldBar(doc, 28.0, 156.89, 196.89, 3.0);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(25.0);
  doc.setTextColor(23, 36, 58);
  doc.text('DISCOVER AN', 52.0, 111.8);
  doc.text('EXTRAORDINARY', 52.0, 141.8);
  doc.text('LIFESTYLE:', 52.0, 171.8);
  doc.setFontSize(21.0);
  doc.text('SMART HOMES', 52.0, 203.0);

  // Subhead
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(11.0);
  doc.setTextColor(23, 36, 58);
  doc.text(`Thoughtfully designed ${property.configuration || 'smart homes'}`, 52.0, 268.0);

  // ABOUT THE PROPERTY Section with small vertical gold accent
  drawGoldBar(doc, 42.0, 286.89, 310.89, 2.5);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(15.0);
  doc.setTextColor(23, 36, 58);
  doc.text('ABOUT THE PROPERTY', 52.0, 294.8);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(98, 109, 127);
  const descText = property.description ||
    `Thoughtfully designed ${property.configuration || 'smart homes'} crafted by ${property.developer || 'TVS Emerald'} on prime corridor in ${property.location || 'Bengaluru'}. Engineered for efficient space utilization, superior natural ventilation, and immediate connectivity.`;
  const descParagraph = doc.splitTextToSize(descText, 255);
  doc.text(descParagraph.slice(0, 8), 52.0, 320.8, { lineHeightFactor: 1.45 });

  // Key Specifications
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 36, 58);
  doc.text('SUPER BUILT-UP AREA', 52.0, 445.4);
  doc.setFontSize(18.0);
  doc.text(property.area || '650 - 1,120 sq.ft', 52.0, 462.4);

  doc.setFontSize(8.0);
  doc.text('PROPERTY TYPE', 52.0, 515.5);
  doc.setFontSize(18.0);
  doc.text(property.property_type || 'Residential', 52.0, 532.4);

  doc.setFontSize(8.0);
  doc.text('LOCATION', 52.0, 585.5);
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 36, 58);
  const locSplit = (property.location || 'Bengaluru, Karnataka').split(',');
  const locLine1 = locSplit.slice(0, 2).join(',').trim();
  const locLine2 = locSplit.slice(2).join(',').trim() || 'Bengaluru, Karnataka';
  doc.text(locLine1, 52.0, 604.2);
  doc.text(locLine2, 52.0, 621.6);

  // Right Side - Large Showcase Photo [328.0, 131.89, 570.0, 621.89] (w: 242, h: 490)
  if (livingImg?.dataUrl) {
    doc.addImage(livingImg.dataUrl, 'JPEG', 328.0, 131.89, 242.0, 490.0, undefined, 'FAST');
  } else {
    doc.setFillColor(255, 255, 255);
    doc.rect(328.0, 131.89, 242.0, 490.0, 'F');
    doc.setDrawColor(201, 205, 211);
    doc.setLineWidth(0.55);
    doc.rect(328.0, 131.89, 242.0, 490.0, 'D');

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(14.0);
    doc.setTextColor(23, 36, 58);
    doc.text('MASTER ARCHITECTURE', 449.0, 360.0, { align: 'center' });
    doc.setFont(fontFam, 'normal');
    doc.setFontSize(9.0);
    doc.setTextColor(98, 109, 127);
    doc.text('Curated Specifications', 449.0, 380.0, { align: 'center' });
  }

  drawPageFooter(doc, 2, fontFam);

  // ===========================================================================
  // PAGE 3: AMENITIES, DUAL GALLERY & INQUIRY CONSULTATION
  // ===========================================================================
  doc.addPage();
  drawPageBackground(doc);
  drawPageHeader(doc, logoImg, fontFam);

  // Top Headline with Gold Bar
  drawGoldBar(doc, 574.0, 114.89, 158.89, 3.0);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(24.0);
  doc.setTextColor(23, 36, 58);
  doc.text('DESIGNED FOR', 570.0, 114.0, { align: 'right' });
  doc.text('EVERYDAY LIVING.', 570.0, 142.0, { align: 'right' });

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(10.0);
  doc.setTextColor(98, 109, 127);
  const amenSubTitle = doc.splitTextToSize(`Amenities and spaces at ${property.name}`, 210);
  doc.text(amenSubTitle, 570.0, 168.0, { align: 'right' });

  // Amenities Two-Column Grid
  const amenitiesList = Array.isArray(property.amenities) && property.amenities.length > 0
    ? property.amenities
    : [
        'Designer Landscaped Gardens',
        'Children Play Park',
        'Modern Clubhouse',
        'Jogging Track',
        'Swimming Pool',
        'Multi-Purpose Sports Court',
        'Fitness Center'
      ];

  const col1 = amenitiesList.slice(0, 4);
  const col2 = amenitiesList.slice(4, 8);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 36, 58);

  col1.forEach((item, idx) => {
    doc.text(`• ${item}`, 52.0, 219.2 + idx * 30.0);
  });

  col2.forEach((item, idx) => {
    doc.text(`• ${item}`, 328.0, 219.2 + idx * 30.0);
  });

  // Dual Photo Gallery [x: 26 to 290] & [x: 302 to 570], y: 386.89 to 586.89
  if (galleryImg1?.dataUrl || galleryImg2?.dataUrl) {
    if (galleryImg1?.dataUrl) {
      doc.addImage(galleryImg1.dataUrl, 'JPEG', 26.0, 386.89, 260.0, 200.0, undefined, 'FAST');
    }
    if (galleryImg2?.dataUrl) {
      doc.addImage(galleryImg2.dataUrl, 'JPEG', 302.0, 386.89, 268.0, 200.0, undefined, 'FAST');
    }
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(9.0);
    doc.setTextColor(23, 36, 58);
    doc.text('PROPERTY GALLERY', 52.0, 610.0);
  } else {
    // Intelligent lifestyle features panel when gallery images are absent
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(26.0, 386.89, 544.0, 200.0, 4, 4, 'F');
    doc.setDrawColor(201, 205, 211);
    doc.setLineWidth(0.55);
    doc.roundedRect(26.0, 386.89, 544.0, 200.0, 4, 4, 'D');

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(12.0);
    doc.setTextColor(23, 36, 58);
    doc.text('COMMUNITY & LIFESTYLE FEATURES', 52.0, 420.0);

    doc.setFont(fontFam, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(98, 109, 127);
    const features = [
      '• Master planned community with secured perimeter and access control',
      '• Dedicated clubhouse facilities, fitness studio, and landscaped open zones',
      '• Eco-friendly rainwater harvesting, solar illumination in common zones, and STP',
      '• Strategic arterial road access and swift connectivity to commercial work hubs',
      '• Comprehensive legal due diligence with RERA registered documentation'
    ];
    features.forEach((feat, idx) => {
      doc.text(feat, 52.0, 452.0 + idx * 24.0);
    });
  }

  // Bottom Consultation Card [26.0, 640.0, 570.0, 755.0]
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(26.0, 638.0, 544.0, 115.0, 4, 4, 'F');
  doc.setDrawColor(201, 205, 211);
  doc.setLineWidth(0.55);
  doc.roundedRect(26.0, 638.0, 544.0, 115.0, 4, 4, 'D');

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(12.0);
  doc.setTextColor(23, 36, 58);
  doc.text(`Interested in ${property.name}?`, 52.0, 667.2);
  doc.text('+91 8197773166', 545.0, 667.2, { align: 'right' });

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(98, 109, 127);
  doc.text('Contact BLX Realty for availability, pricing and a personal consultation.', 52.0, 691.8);

  doc.setFontSize(8.5);
  doc.text('discoverblr@theblxrealty.com', 52.0, 723.0);
  doc.text('www.theblxrealty.com', 545.0, 723.0, { align: 'right' });

  drawPageFooter(doc, 3, fontFam);

  // ===========================================================================
  // PAGE 4: COMMERCIAL OVERVIEW, LOCATION, KEY HIGHLIGHTS & OFFICE
  // ===========================================================================
  doc.addPage();
  drawPageBackground(doc);
  drawPageHeader(doc, logoImg, fontFam);

  // Top-Left Commercial Header
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(9.0);
  doc.setTextColor(23, 36, 58);
  doc.text((property.name || 'PROPERTY').toUpperCase(), 52.0, 134.6);

  doc.setFontSize(23.0);
  doc.text('Real Estate', 52.0, 168.4);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(12.0);
  doc.text(`Smart homes on ${corridor}`, 52.0, 207.2);

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(28.0);
  doc.text(cleanPrice, 52.0, 249.3);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(98, 109, 127);
  doc.text(`Starting from · ${property.configuration || '1 & 2 BHK'} · ${property.property_type || 'Residential'}`, 52.0, 285.1);

  // Top-Right Showcase Image [328.0, 63.89, 570.0, 420.0]
  if (heroImg?.dataUrl) {
    doc.addImage(heroImg.dataUrl, 'JPEG', 328.0, 63.89, 242.0, 356.0, undefined, 'FAST');
  } else {
    // Elegant corridor infrastructure panel when images are absent
    doc.setFillColor(255, 255, 255);
    doc.rect(328.0, 63.89, 242.0, 356.0, 'F');
    doc.setDrawColor(201, 205, 211);
    doc.setLineWidth(0.55);
    doc.rect(328.0, 63.89, 242.0, 356.0, 'D');

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(12.0);
    doc.setTextColor(23, 36, 58);
    doc.text('CORRIDOR ADVANTAGES', 348.0, 105.0);

    doc.setFont(fontFam, 'normal');
    doc.setFontSize(9.0);
    doc.setTextColor(98, 109, 127);
    const corridorPoints = [
      `• Prime high-growth corridor in ${corridor}`,
      '• Fast expressway access to Bangalore International Airport (KIA)',
      '• Proximity to leading Tech Parks, SEZs & corporate hubs',
      '• Well-established social infrastructure (schools, healthcare, retail)',
      '• Significant capital appreciation potential over investment horizon'
    ];
    corridorPoints.forEach((pt, idx) => {
      const wrappedPt = doc.splitTextToSize(pt, 205);
      doc.text(wrappedPt, 348.0, 135.0 + idx * 40.0);
    });
  }

  // Middle-Left: PROJECT LOCATION
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 36, 58);
  doc.text('PROJECT LOCATION', 52.0, 445.4);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(10.0);
  doc.setTextColor(23, 36, 58);
  doc.text(locLine1, 52.0, 465.8);
  doc.text(locLine2, 52.0, 483.8);

  // Middle-Right: KEY HIGHLIGHTS
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 36, 58);
  doc.text('KEY HIGHLIGHTS', 328.0, 445.4);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(9.0);
  doc.text('• Efficient space utilization', 328.0, 466.6);
  doc.text('• Superior natural ventilation', 328.0, 488.6);
  doc.text(`• Immediate ${corridor} corridor connectivity`, 328.0, 510.6);

  // Bottom BLX Office & Inquiry Card [26.0, 610.0, 570.0, 745.0]
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(26.0, 608.0, 544.0, 137.0, 4, 4, 'F');
  doc.setDrawColor(201, 205, 211);
  doc.setLineWidth(0.55);
  doc.roundedRect(26.0, 608.0, 544.0, 137.0, 4, 4, 'D');

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(11.0);
  doc.setTextColor(6, 28, 67);
  doc.text('THE BLX REALTY', 52.0, 638.0);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(98, 109, 127);
  doc.text('#0301D, 3rd Floor, Brigade Twin Towers, Ward No. 38,', 52.0, 660.0);
  doc.text('No. 11/1-4, Pipeline Road HMT, Yeshwanthpur,', 52.0, 674.0);
  doc.text('Bengaluru, Karnataka 560022, India', 52.0, 688.0);

  doc.text('discoverblr@theblxrealty.com', 52.0, 718.0);
  doc.text('www.theblxrealty.com', 545.0, 718.0, { align: 'right' });

  drawPageFooter(doc, 4, fontFam);

  // ===========================================================================
  // PAGE 5: OFFICIAL BLX LEGAL DISCLAIMER
  // ===========================================================================
  doc.addPage();
  drawPageBackground(doc);
  drawPageHeader(doc, logoImg, fontFam);

  // Top Heading with Vertical Gold Bar
  drawGoldBar(doc, 28.0, 120.0, 168.0, 3.0);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(28.0);
  doc.setTextColor(23, 36, 58);
  doc.text('DISCLAIMER', 52.0, 134.3);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(98, 109, 127);
  doc.text('Important information regarding the use of this property presentation.', 52.0, 164.2);

  // Standard Legal Disclaimer Card [42.0, 205.0, 553.0, 690.0] (w: 511, h: 485)
  drawDisclaimerSection(doc, 42.0, 205.0, 511.0, 485.0, fontFam, true);

  drawPageFooter(doc, 5, fontFam);
}

/**
 * -----------------------------------------------------------------------------
 * DEDICATED 3-PAGE PLOT / LAND PRESENTATION TEMPLATE
 * 
 * STRICT RULES FOR PROPERTY TYPE = "PLOT":
 * - EXACTLY 3 PAGES TOTAL.
 * - ZERO automatic image generation, sourcing, stock, Unsplash, or placeholders.
 * - Only if the user explicitly uploaded an image through the portal may it be used.
 * - Otherwise: COMPLETELY IMAGE-FREE (no image, banner, or hero image).
 * - PAGE 1: Property information, name, type, configuration, size/area, price, location, about.
 * - PAGE 2: Plot details, figures/dimensions/measurements, location, connectivity, amenities.
 * - PAGE 3: Existing BLX Realty disclaimer page/content.
 * - Retains the identical BLX design system (background grid, typography, colors, branding).
 * -----------------------------------------------------------------------------
 */
function renderPlotBrochure(doc, property, userPlotImg, logoImg, fontFam) {
  const developer = (property.developer || 'BLX Curated Land Partner').toUpperCase();
  const corridor = extractCorridor(property.location);
  const cleanPrice = extractCleanPrice(property.price);
  const pricePerSqFt = formatPricePerSqFt(property);
  const plotDimensions = getPlotDimensions(property);

  // ===========================================================================
  // PAGE 1: PLOT OVERVIEW, COMMERCIALS & ABOUT THE PROPERTY
  // ===========================================================================
  drawPageBackground(doc);
  drawPageHeader(doc, logoImg, fontFam);

  // Category / Location Breadcrumb
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 36, 58);
  doc.text(`${developer} / ${corridor} · PLOT`, 52.0, 93.0);

  // Plot Property Name - auto-size font so long titles remain on a single line without colliding with the right column
  doc.setFont(fontFam, 'bold');
  const availablePlotTitleWidth = 345.0;
  let plotTitleFontSize = 24.0;
  doc.setFontSize(plotTitleFontSize);
  let plotTitleWidth = doc.getTextWidth(property.name);

  while (plotTitleWidth > availablePlotTitleWidth && plotTitleFontSize > 18.0) {
    plotTitleFontSize -= 0.5;
    doc.setFontSize(plotTitleFontSize);
    plotTitleWidth = doc.getTextWidth(property.name);
  }

  if (plotTitleWidth <= availablePlotTitleWidth) {
    doc.setFontSize(plotTitleFontSize);
    doc.text(property.name, 52.0, 121.8);
  } else {
    doc.setFontSize(18.0);
    const plotTitleLines = doc.splitTextToSize(property.name, availablePlotTitleWidth);
    doc.text(plotTitleLines.slice(0, 2), 52.0, 116.0, { lineHeightFactor: 1.15 });
  }

  // Location
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(10.0);
  doc.setTextColor(98, 109, 127);
  const locLines = doc.splitTextToSize(property.location || 'Bengaluru, Karnataka', 320);
  doc.text(locLines.slice(0, 2), 52.0, 151.8);

  // Plot Sub-intro
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(23, 36, 58);
  const plotIntro = `Approved residential villa plots crafted by ${property.developer || 'BLX Curated Land Partner'} with clear marketable titles in ${corridor}.`;
  const introLines = doc.splitTextToSize(plotIntro, 320);
  doc.text(introLines.slice(0, 3), 52.0, 208.4, { lineHeightFactor: 1.4 });

  // Right Side - PRICE Block (neatly aligned in right column)
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 36, 58);
  doc.text('PRICE', 430.0, 125.5);

  doc.setFontSize(15.0);
  doc.text('STARTING FROM', 430.0, 139.8);

  doc.setFontSize(20.0);
  doc.text(cleanPrice, 568.0, 160.8, { align: 'right' });
  drawGoldBar(doc, 574.0, 143.89, 181.89, 2.5);

  // Right Side - PLOT CONFIGURATION Block
  doc.setFontSize(8.0);
  doc.text('PLOT CONFIGURATION', 430.0, 225.4);

  doc.setFontSize(14.0);
  doc.text(property.configuration || property.area || 'Villa Plots', 568.0, 242.6, { align: 'right' });
  drawGoldBar(doc, 574.0, 228.89, 266.89, 2.5);

  // PAGE 1 MAIN BODY:
  // If an image was explicitly uploaded by the user, render it;
  // Otherwise: NO IMAGE AT ALL (Zero placeholders, zero fallback).
  if (userPlotImg?.dataUrl) {
    doc.addImage(userPlotImg.dataUrl, 'JPEG', 25.0, 266.89, 545.0, 230.0, undefined, 'FAST');

    // ABOUT THE PROPERTY Section below image
    drawGoldBar(doc, 42.0, 516.0, 540.0, 2.5);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(14.0);
    doc.setTextColor(23, 36, 58);
    doc.text('ABOUT THE PROPERTY', 52.0, 528.0);

    doc.setFont(fontFam, 'normal');
    doc.setFontSize(9.0);
    doc.setTextColor(98, 109, 127);
    const descText = property.description ||
      `Premium residential villa plots crafted by ${property.developer || 'BLX Curated Land Partner'} in ${property.location || 'Bengaluru'}. Master-planned gated community featuring wide asphalted roads, underground utility conduits, continuous water connections, and landscaped parks.`;
    const descLines = doc.splitTextToSize(descText, 518);
    doc.text(descLines.slice(0, 5), 52.0, 552.0, { lineHeightFactor: 1.4 });

    // Summary specifications pill bar
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(26.0, 645.0, 544.0, 100.0, 4, 4, 'F');
    doc.setDrawColor(201, 205, 211);
    doc.setLineWidth(0.55);
    doc.roundedRect(26.0, 645.0, 544.0, 100.0, 4, 4, 'D');

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('PROPERTY TYPE', 52.0, 672.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(11.0);
    doc.setTextColor(23, 36, 58);
    doc.text('Plot', 52.0, 688.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('PLOT SIZES / AREA', 180.0, 672.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(11.0);
    doc.setTextColor(23, 36, 58);
    doc.text(property.area || '1,200 - 2,400 sq.ft', 180.0, 688.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('RATE / SQ.FT', 340.0, 672.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(11.0);
    doc.setTextColor(23, 36, 58);
    doc.text(pricePerSqFt, 340.0, 688.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('CURRENT STATUS', 460.0, 672.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(11.0);
    doc.setTextColor(23, 36, 58);
    doc.text(property.status || 'Available', 460.0, 688.0);

    doc.setFont(fontFam, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(98, 109, 127);
    doc.text(`Development Corridor: ${corridor} · Clear Marketable Freehold Title Assured`, 52.0, 725.0);
  } else {
    // Zero image uploaded: Spread plot information cleanly without any image area
    // ABOUT THE PROPERTY Section
    drawGoldBar(doc, 42.0, 276.0, 300.0, 2.5);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(15.0);
    doc.setTextColor(23, 36, 58);
    doc.text('ABOUT THE PROPERTY', 52.0, 290.0);

    doc.setFont(fontFam, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(98, 109, 127);
    const plotNarrative = property.description ||
      `Approved residential villa plots crafted by ${property.developer || 'BLX Curated Land Partner'} in ${property.location || 'Bengaluru'}. Master-planned gated layout designed for bespoke private residences, featuring wide asphalted internal avenues, dedicated underground utility lines, treated water supply, and landscaped park areas.`;
    const narrativeLines = doc.splitTextToSize(plotNarrative, 518);
    doc.text(narrativeLines.slice(0, 6), 52.0, 318.0, { lineHeightFactor: 1.48 });

    // PLOT SPECIFICATIONS & COMMERCIAL DETAILS CARD
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(26.0, 440.0, 544.0, 300.0, 4, 4, 'F');
    doc.setDrawColor(201, 205, 211);
    doc.setLineWidth(0.55);
    doc.roundedRect(26.0, 440.0, 544.0, 300.0, 4, 4, 'D');

    drawGoldBar(doc, 42.0, 458.0, 478.0, 2.5);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(12.0);
    doc.setTextColor(23, 36, 58);
    doc.text('PLOT SPECIFICATIONS & DETAILS', 52.0, 472.0);

    // Column 1
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('PROPERTY TYPE', 52.0, 508.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(12.0);
    doc.setTextColor(23, 36, 58);
    doc.text('Plot', 52.0, 524.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('PLOT SIZES / EXTENT', 52.0, 558.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(12.0);
    doc.setTextColor(23, 36, 58);
    doc.text(property.area || '1,200 - 2,400 sq.ft', 52.0, 574.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('CONFIGURATION', 52.0, 608.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(11.0);
    doc.setTextColor(23, 36, 58);
    doc.text(property.configuration || 'Residential Villa Plots', 52.0, 624.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('DEVELOPER / PROMOTER', 52.0, 658.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(11.0);
    doc.setTextColor(23, 36, 58);
    doc.text(property.developer || 'BLX Curated Land Partner', 52.0, 674.0);

    // Column 2
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('INDICATIVE PRICE', 328.0, 508.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(12.0);
    doc.setTextColor(23, 36, 58);
    doc.text(cleanPrice, 328.0, 524.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('RATE / SQ.FT', 328.0, 558.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(12.0);
    doc.setTextColor(23, 36, 58);
    doc.text(pricePerSqFt, 328.0, 574.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('CURRENT AVAILABILITY', 328.0, 608.0);
    doc.setFont(fontFam, 'bold');
    doc.setFontSize(11.0);
    doc.setTextColor(23, 36, 58);
    doc.text(property.status || 'Available', 328.0, 624.0);

    doc.setFont(fontFam, 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(98, 109, 127);
    doc.text('LOCATION / CORRIDOR', 328.0, 658.0);
    doc.setFont(fontFam, 'normal');
    doc.setFontSize(10.0);
    doc.setTextColor(23, 36, 58);
    doc.text(`${corridor} Growth Corridor`, 328.0, 674.0);

    doc.setFont(fontFam, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(98, 109, 127);
    doc.text('Clear marketable freehold title with statutory planning approvals.', 52.0, 715.0);
  }

  // Footer Contact & Number
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(98, 109, 127);
  doc.text('discoverblr@theblxrealty.com · +91 8197773166', 52.0, 783.9);

  drawPageFooter(doc, 1, fontFam);

  // ===========================================================================
  // PAGE 2: CONFIGURATION, FIGURES, DIMENSIONS, LOCATION & CONNECTIVITY
  // ===========================================================================
  doc.addPage();
  drawPageBackground(doc);
  drawPageHeader(doc, logoImg, fontFam);

  // Left Headline with Vertical Gold Bar
  drawGoldBar(doc, 28.0, 156.89, 196.89, 3.0);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(25.0);
  doc.setTextColor(23, 36, 58);
  doc.text('PLANNED FOR', 52.0, 111.8);
  doc.text('EXTRAORDINARY', 52.0, 141.8);
  doc.text('LIVING:', 52.0, 171.8);
  doc.setFontSize(21.0);
  doc.text('VILLA PLOTS', 52.0, 203.0);

  // Subhead
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(11.0);
  doc.setTextColor(23, 36, 58);
  doc.text('Plot Dimensions, Infrastructure & Strategic Connectivity', 52.0, 268.0);

  // DIMENSIONS & MEASUREMENTS Section
  drawGoldBar(doc, 42.0, 286.89, 310.89, 2.5);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(14.0);
  doc.setTextColor(23, 36, 58);
  doc.text('DIMENSIONS & MEASUREMENTS', 52.0, 294.8);

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(98, 109, 127);
  doc.text('TYPICAL PLOT DIMENSIONS', 52.0, 324.0);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(15.0);
  doc.setTextColor(23, 36, 58);
  doc.text(plotDimensions, 52.0, 342.0);

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(98, 109, 127);
  doc.text('TOTAL PLOT AREA RANGE', 52.0, 372.0);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(14.0);
  doc.setTextColor(23, 36, 58);
  doc.text(property.area || property.configuration || '1,200 - 2,400 sq.ft', 52.0, 390.0);

  // LOCATION & TRANSIT Section
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(98, 109, 127);
  doc.text('PROJECT LOCATION', 52.0, 428.0);
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 36, 58);
  const plotLocSplit = (property.location || 'Bengaluru, Karnataka').split(',');
  const plotLoc1 = plotLocSplit.slice(0, 2).join(',').trim();
  const plotLoc2 = plotLocSplit.slice(2).join(',').trim() || 'Bengaluru, Karnataka';
  doc.text(plotLoc1, 52.0, 444.0);
  doc.text(plotLoc2, 52.0, 459.0);

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(98, 109, 127);
  doc.text('STRATEGIC TRANSIT ACCESS', 52.0, 492.0);
  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(23, 36, 58);
  doc.text(`• Direct arterial highway connectivity in ${corridor}`, 52.0, 508.0);
  doc.text('• Rapid transit access to Kempegowda International Airport (KIA)', 52.0, 524.0);
  doc.text('• Proximity to leading Tech Parks, Aerospace Park & SEZs', 52.0, 540.0);
  doc.text('• Established schools, healthcare facilities & retail within 15-20 mins', 52.0, 556.0);
  doc.text('• High-growth investment corridor with strong capital appreciation', 52.0, 572.0);

  // Right Side Panel 1: COMMUNITY & LAYOUT AMENITIES
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(328.0, 110.0, 242.0, 260.0, 4, 4, 'F');
  doc.setDrawColor(201, 205, 211);
  doc.setLineWidth(0.55);
  doc.roundedRect(328.0, 110.0, 242.0, 260.0, 4, 4, 'D');

  drawGoldBar(doc, 342.0, 124.0, 144.0, 2.5);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(11.0);
  doc.setTextColor(23, 36, 58);
  doc.text('COMMUNITY AMENITIES', 352.0, 137.0);

  const plotAmenities = Array.isArray(property.amenities) && property.amenities.length > 0
    ? property.amenities
    : [
        'Landscaped Gardens & Parks',
        'Children Play Arena',
        'Tree-Lined Avenues & Footpaths',
        'Jogging & Cycling Track',
        'Multi-Purpose Sports Court',
        '24/7 Gated Security & CCTV',
        'Sewage Treatment Plant (STP)',
        'Rainwater Harvesting System'
      ];

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(98, 109, 127);
  plotAmenities.slice(0, 7).forEach((item, idx) => {
    doc.text(`• ${item}`, 348.0, 166.0 + idx * 26.0);
  });

  // Right Side Panel 2: STATUTORY APPROVALS & CIVIC STANDARDS
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(328.0, 385.0, 242.0, 215.0, 4, 4, 'F');
  doc.setDrawColor(201, 205, 211);
  doc.setLineWidth(0.55);
  doc.roundedRect(328.0, 385.0, 242.0, 215.0, 4, 4, 'D');

  drawGoldBar(doc, 342.0, 399.0, 419.0, 2.5);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(11.0);
  doc.setTextColor(23, 36, 58);
  doc.text('STATUTORY APPROVALS', 352.0, 412.0);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(98, 109, 127);
  const plotApprovals = [
    '• BDA / BIAAPA / DTCP Sanctioned Layout',
    '• RERA Approved & Registered Project',
    '• 100% Clear Marketable Freehold Title',
    '• DC Converted for Residential Use',
    '• Individual E-Khata / A-Khata Ready',
    '• 30 & 40 ft Asphalted Internal Roads',
    '• Underground Power Cabling & Drainage'
  ];
  plotApprovals.forEach((item, idx) => {
    doc.text(item, 348.0, 438.0 + idx * 22.0);
  });

  // Bottom Consultation Card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(26.0, 625.0, 544.0, 130.0, 4, 4, 'F');
  doc.setDrawColor(201, 205, 211);
  doc.setLineWidth(0.55);
  doc.roundedRect(26.0, 625.0, 544.0, 130.0, 4, 4, 'D');

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(12.0);
  doc.setTextColor(23, 36, 58);
  doc.text(`Interested in ${property.name}?`, 52.0, 654.0);
  doc.text('+91 8197773166', 545.0, 654.0, { align: 'right' });

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(98, 109, 127);
  doc.text('Contact BLX Realty for site visits, boundary surveys, pricing, and personal consultation.', 52.0, 676.0);

  doc.setFont(fontFam, 'bold');
  doc.setFontSize(10.0);
  doc.setTextColor(6, 28, 67);
  doc.text('THE BLX REALTY', 52.0, 700.0);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(98, 109, 127);
  doc.text('#0301D, 3rd Floor, Brigade Twin Towers, Ward No. 38, Pipeline Road HMT, Yeshwanthpur, Bengaluru 560022', 52.0, 715.0);
  doc.text('discoverblr@theblxrealty.com', 52.0, 735.0);
  doc.text('www.theblxrealty.com', 545.0, 735.0, { align: 'right' });

  drawPageFooter(doc, 2, fontFam);

  // ===========================================================================
  // PAGE 3: OFFICIAL BLX LEGAL DISCLAIMER
  // ===========================================================================
  doc.addPage();
  drawPageBackground(doc);
  drawPageHeader(doc, logoImg, fontFam);

  // Top Heading with Vertical Gold Bar
  drawGoldBar(doc, 28.0, 120.0, 168.0, 3.0);
  doc.setFont(fontFam, 'bold');
  doc.setFontSize(28.0);
  doc.setTextColor(23, 36, 58);
  doc.text('DISCLAIMER', 52.0, 134.3);

  doc.setFont(fontFam, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(98, 109, 127);
  doc.text('Important information regarding the use of this property presentation.', 52.0, 164.2);

  // Standard Legal Disclaimer Card [42.0, 205.0, 553.0, 690.0] (w: 511, h: 485)
  // EXACTLY matching the existing 5-page PDF disclaimer treatment
  drawDisclaimerSection(doc, 42.0, 205.0, 511.0, 485.0, fontFam, true);

  drawPageFooter(doc, 3, fontFam);
}

/**
 * Generates the official BLX Realty Property Presentation PDF
 * 
 * CONDITIONAL LOGIC:
 * IF Property Type === "Plot"
 *     -> Use the dedicated 3-page Plot PDF template (zero automatic images, rich plot info, disclaimer on page 3)
 * ELSE
 *     -> Use the existing 5-page PDF template EXACTLY as it currently exists (100% UNCHANGED)
 *
 * @param {Object} property - Property database record
 * @param {Object} options - Generation options (returnDoc, save)
 * @returns {Promise<string|{filename: string, doc: jsPDF, isPlot: boolean, pageCount: number}>}
 */
export async function generatePropertyPdf(property, options = {}) {
  if (!property) throw new Error('No property data available');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [595.28, 841.89],
  });

  const isPlot = isPlotProperty(property);

  // ===========================================================================
  // CONDITIONAL 1: PROPERTY TYPE === "PLOT" (DEDICATED 3-PAGE TEMPLATE)
  // ===========================================================================
  if (isPlot) {
    const imageUrls = (Array.isArray(property.images) ? property.images : [])
      .filter(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('photo-1545324418-cc1a3fa10c00'));
    // Only load an image if explicitly uploaded and selected by the user through the portal.
    // Zero automatic sourcing, zero fallback.
    const [fonts, userPlotImg, logoImg] = await Promise.all([
      loadFonts(),
      imageUrls[0] ? loadImage(imageUrls[0], 1090, 600) : null,
      loadImage('/blx-logo.png', 500, 380),
    ]);

    let fontFam = 'helvetica';
    if (fonts) {
      doc.addFileToVFS('Lato-Regular.ttf', fonts.regular);
      doc.addFont('Lato-Regular.ttf', 'Lato', 'normal');
      doc.addFileToVFS('Lato-Bold.ttf', fonts.bold);
      doc.addFont('Lato-Bold.ttf', 'Lato', 'bold');
      fontFam = 'Lato';
    }

    renderPlotBrochure(doc, property, userPlotImg, logoImg, fontFam);

    const cleanName = property.name
      ? property.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/__+/g, '_')
      : 'Property';
    const filename = `BLX_Realty_Plot_${cleanName}.pdf`;

    if (typeof window !== 'undefined' && doc.save && options.save !== false) {
      doc.save(filename);
    }

    if (options.returnDoc) {
      return { filename, doc, isPlot: true, pageCount: 3 };
    }

    return filename;
  }

  // ===========================================================================
  // CONDITIONAL 2: ANY OTHER PROPERTY TYPE (EXISTING 5-PAGE PDF - 100% UNCHANGED)
  // ===========================================================================
  const imageUrls = (Array.isArray(property.images) ? property.images : [])
    .filter(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('photo-1545324418-cc1a3fa10c00'));
  const [fonts, heroImg, secImg1, secImg2, bannerImg, logoImg] = await Promise.all([
    loadFonts(),
    imageUrls[0] ? loadImage(imageUrls[0], 1090, 616) : null,
    imageUrls[1] ? loadImage(imageUrls[1], 484, 890) : null,
    imageUrls[2] ? loadImage(imageUrls[2], 520, 350) : null,
    imageUrls[3] ? loadImage(imageUrls[3], 520, 350) : (imageUrls[0] ? loadImage(imageUrls[0], 520, 350) : null),
    loadImage('/blx-logo.png', 500, 380),
  ]);

  let fontFam = 'helvetica';
  if (fonts) {
    doc.addFileToVFS('Lato-Regular.ttf', fonts.regular);
    doc.addFont('Lato-Regular.ttf', 'Lato', 'normal');
    doc.addFileToVFS('Lato-Bold.ttf', fonts.bold);
    doc.addFont('Lato-Bold.ttf', 'Lato', 'bold');
    fontFam = 'Lato';
  }

  renderResidentialBrochure(doc, property, [heroImg, secImg1, secImg2, bannerImg], logoImg, fontFam);

  const cleanName = property.name
    ? property.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/__+/g, '_')
    : 'Property';
  const filename = `BLX_Realty_${cleanName}.pdf`;

  if (typeof window !== 'undefined' && doc.save && options.save !== false) {
    doc.save(filename);
  }

  if (options.returnDoc) {
    return { filename, doc, isPlot: false, pageCount: 5 };
  }

  return filename;
}

import path from 'path';
import express from 'express';
import { supabase } from './supabase.js';
import { requireAuth } from './auth.js';

const router = express.Router();

const BUCKETS = {
  IMAGES: 'property-images',
  DOCUMENTS: 'property-documents',
  INTERNAL: 'internal-records',
};

// Strict MIME type allowlist for property assets
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

// Maximum file size: 10MB per uploaded asset
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/storage/upload
 * Uploads an image or document directly to Supabase Storage.
 * Enforces MIME type allowlisting, path traversal protection, and role-based bucket access.
 */
router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { dataUrl, fileName, bucket = BUCKETS.IMAGES, folder = 'properties' } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: 'dataUrl or file data is required' });
    }

    // Role-based bucket check: Only Admin can upload directly to internal-records
    if (bucket === BUCKETS.INTERNAL && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden: Uploading to internal-records requires administrative privileges.',
      });
    }

    // Parse data URL format: data:[<mediatype>][;base64],<data>
    let mimeType = 'image/jpeg';
    let base64Data = dataUrl;

    const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1].toLowerCase();
      base64Data = matches[2];
    }

    // MIME Type Validation against allowlist
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({
        error: `File type "${mimeType}" is not permitted. Allowed formats: JPEG, PNG, WebP, GIF, PDF.`,
      });
    }

    // Convert base64 string to Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // File size validation
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        error: `File size exceeds the 10 MB limit (${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
      });
    }

    // Sanitize folder path against path traversal attacks (alphanumeric, hyphens, underscores only)
    const safeFolder = String(folder || 'properties').replace(/[^a-zA-Z0-9_-]/g, '') || 'properties';

    // Generate safe, sanitized filename without path traversal
    const extension = mimeType === 'application/pdf' ? 'pdf' : (mimeType.split('/')[1] || 'jpg');
    const safeExt = extension.replace(/[^a-zA-Z0-9]/g, '');
    const rawFileName = fileName ? path.basename(String(fileName)) : `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${safeExt}`;
    const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const filePath = `${safeFolder}/${cleanFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error.message);
      return res.status(500).json({ error: 'Failed to upload asset to Supabase Storage: ' + error.message });
    }

    // Generate URL based on whether bucket is public or private
    let finalUrl = '';
    if (bucket === BUCKETS.INTERNAL) {
      // Private bucket: create a signed URL (expires in 1 hour)
      const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);
      finalUrl = signedData?.signedUrl || '';
    } else {
      // Public bucket: generate public URL
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      finalUrl = publicData.publicUrl;
    }

    return res.status(201).json({
      success: true,
      url: finalUrl,
      path: filePath,
      bucket,
      mimeType,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Unexpected error in storage upload:', error.message);
    return res.status(500).json({ error: 'Internal server error while uploading asset' });
  }
});

/**
 * GET /api/storage/buckets
 * Lists configured buckets and their visibility (Requires Authentication)
 */
router.get('/buckets', requireAuth, async (req, res) => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    res.json({
      buckets: (buckets || []).map((b) => ({
        id: b.id,
        name: b.name,
        public: b.public,
        fileSizeLimit: b.file_size_limit,
      })),
    });
  } catch (err) {
    console.error('Error fetching buckets:', err.message);
    res.status(500).json({ error: 'Failed to list storage buckets' });
  }
});

/**
 * POST /api/storage/signed-url
 * Creates a temporary signed URL for private bucket objects.
 * Restricts internal-records bucket access strictly to ADMIN users.
 */
router.post('/signed-url', requireAuth, async (req, res) => {
  try {
    const { bucket = BUCKETS.INTERNAL, path: objectPath, expiresIn = 3600 } = req.body;
    if (!objectPath) {
      return res.status(400).json({ error: 'Storage object path is required' });
    }

    // Role-based protection: internal-records signed URLs require ADMIN role
    if (bucket === BUCKETS.INTERNAL && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden: Generating signed URLs for internal-records requires administrative privileges.',
      });
    }

    // Sanitize path against traversal
    const safeObjectPath = String(objectPath).replace(/\.\.[\/\\]/g, '');

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(safeObjectPath, Number(expiresIn) || 3600);

    if (error) throw error;
    res.json({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error('Error generating signed URL:', err.message);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

export default router;

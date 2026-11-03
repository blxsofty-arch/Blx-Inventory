import express from 'express';
import { supabase } from './supabase.js';
import { requireAuth } from './auth.js';

const router = express.Router();

const BUCKETS = {
  IMAGES: 'property-images',
  DOCUMENTS: 'property-documents',
  INTERNAL: 'internal-records',
};

/**
 * POST /api/storage/upload
 * Uploads an image or document directly to Supabase Storage.
 * Accepts JSON payload:
 * {
 *   dataUrl: 'data:image/jpeg;base64,...', // Or raw base64 string
 *   fileName: 'elevation.jpg',            // Optional custom filename
 *   bucket: 'property-images',             // Default: 'property-images' (PUBLIC)
 *   folder: 'properties'                   // Default: 'properties'
 * }
 */
router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { dataUrl, fileName, bucket = BUCKETS.IMAGES, folder = 'properties' } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: 'dataUrl or file data is required' });
    }

    // Parse data URL format: data:[<mediatype>][;base64],<data>
    let mimeType = 'image/jpeg';
    let base64Data = dataUrl;

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    // Convert base64 string to Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique sanitized filename
    const extension = mimeType.split('/')[1] || 'jpg';
    const cleanFileName = fileName
      ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      : `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

    const filePath = `${folder}/${cleanFileName}`;

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
    console.error('Unexpected error in storage upload:', error);
    return res.status(500).json({ error: 'Internal server error while uploading asset' });
  }
});

/**
 * GET /api/storage/buckets
 * Lists configured buckets and their visibility
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
    console.error('Error fetching buckets:', err);
    res.status(500).json({ error: 'Failed to list storage buckets' });
  }
});

/**
 * POST /api/storage/signed-url
 * Creates a temporary signed URL for private bucket objects
 */
router.post('/signed-url', requireAuth, async (req, res) => {
  try {
    const { bucket = BUCKETS.INTERNAL, path, expiresIn = 3600 } = req.body;
    if (!path) {
      return res.status(400).json({ error: 'Storage object path is required' });
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, Number(expiresIn) || 3600);

    if (error) throw error;
    res.json({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error('Error generating signed URL:', err);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

export default router;


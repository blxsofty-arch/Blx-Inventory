import express from 'express';
import { supabase } from './supabase.js';
import { requireAdmin, requireAuth } from './auth.js';

const router = express.Router();

// Helper to format property row from Supabase
export function formatProperty(row) {
  if (!row) return null;
  return {
    ...row,
    amenities: Array.isArray(row.amenities)
      ? row.amenities
      : (typeof row.amenities === 'string'
        ? (() => { try { return JSON.parse(row.amenities); } catch { return []; } })()
        : []),
    images: Array.isArray(row.images)
      ? row.images
      : (typeof row.images === 'string'
        ? (() => { try { return JSON.parse(row.images); } catch { return []; } })()
        : []),
    is_archived: row.is_archived === 1 || row.is_archived === true ? 1 : 0,
  };
}

// Automatically processes images and uploads any Base64 strings to Supabase Storage
async function processAndUploadImages(imagesArray) {
  if (!Array.isArray(imagesArray)) return [];
  const processed = [];

  for (let i = 0; i < imagesArray.length; i++) {
    const item = imagesArray[i];
    if (typeof item === 'string' && item.startsWith('data:image/')) {
      try {
        const matches = item.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.split('/')[1] || 'jpg';
          const filePath = `properties/prop_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from('property-images')
            .upload(filePath, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadErr) {
            const { data: publicData } = supabase.storage
              .from('property-images')
              .getPublicUrl(filePath);
            processed.push(publicData.publicUrl);
            continue;
          } else {
            console.warn('Storage upload error, preserving original data:', uploadErr.message);
          }
        }
      } catch (err) {
        console.warn('Could not upload base64 to Supabase Storage:', err.message);
      }
    }
    processed.push(item);
  }

  return processed;
}

// GET /api/properties/stats (Requires Authentication)
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [
      { count: totalCount, error: err1 },
      { count: availableCount, error: err2 },
      { count: soldCount, error: err3 },
      { count: onHoldCount, error: err4 },
      { count: archivedCount, error: err5 },
      { data: activeTypes, error: err6 },
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }).or('is_archived.is.null,is_archived.eq.0'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'Available').or('is_archived.is.null,is_archived.eq.0'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'Sold').or('is_archived.is.null,is_archived.eq.0'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'On-Hold').or('is_archived.is.null,is_archived.eq.0'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_archived', 1),
      supabase.from('properties').select('property_type').or('is_archived.is.null,is_archived.eq.0'),
    ]);

    if (err1) throw err1;

    const typeCounts = {};
    (activeTypes || []).forEach((r) => {
      if (r.property_type) {
        typeCounts[r.property_type] = (typeCounts[r.property_type] || 0) + 1;
      }
    });

    const typesBreakdown = Object.entries(typeCounts).map(([property_type, count]) => ({
      property_type,
      count,
    }));

    res.json({
      total: totalCount || 0,
      available: availableCount || 0,
      sold: soldCount || 0,
      onHold: onHoldCount || 0,
      archived: archivedCount || 0,
      typesBreakdown,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats from Supabase:', error);
    res.status(500).json({ error: 'Failed to retrieve stats from database' });
  }
});

// GET /api/properties (Requires Authentication)
// Filters: search, location, property_type, configuration, status, sort
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, location, property_type, configuration, status, sort } = req.query;

    let dbQuery = supabase.from('properties').select('*').or('is_archived.is.null,is_archived.eq.0');

    if (location && location !== 'All') {
      dbQuery = dbQuery.ilike('location', `%${location}%`);
    }

    if (property_type && property_type !== 'All') {
      dbQuery = dbQuery.eq('property_type', property_type);
    }

    if (configuration && configuration !== 'All') {
      dbQuery = dbQuery.ilike('configuration', `%${configuration}%`);
    }

    if (status && status !== 'All') {
      dbQuery = dbQuery.eq('status', status);
    }

    // Apply sorting
    if (sort === 'price_asc') {
      dbQuery = dbQuery.order('price_numeric', { ascending: true });
    } else if (sort === 'price_desc') {
      dbQuery = dbQuery.order('price_numeric', { ascending: false });
    } else if (sort === 'area_asc') {
      dbQuery = dbQuery.order('area_numeric', { ascending: true });
    } else if (sort === 'area_desc') {
      dbQuery = dbQuery.order('area_numeric', { ascending: false });
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    const { data: rows, error } = await dbQuery;
    if (error) throw error;

    let properties = (rows || []).map(formatProperty);

    // Multi-token intelligent search matching across all property fields
    if (search && search.trim()) {
      const normalizedSearch = search.trim().toLowerCase().replace(/(\d+)\s*(bhk|bed|cr|lakh)/gi, '$1 $2');
      const tokens = normalizedSearch.split(/\s+/).filter(Boolean);

      properties = properties.filter((p) => {
        const amenitiesStr = Array.isArray(p.amenities) ? p.amenities.join(' ') : String(p.amenities || '');
        const targetText = [
          p.name,
          p.location,
          p.developer,
          p.configuration,
          p.property_type,
          p.price,
          p.area,
          p.description,
          amenitiesStr,
        ].join(' ').toLowerCase();

        const compactTarget = targetText.replace(/\s+/g, '');

        return tokens.every((token) => {
          const cleanToken = token.replace(/[^a-zA-Z0-9]/g, '');
          return targetText.includes(token) || (cleanToken && compactTarget.includes(cleanToken));
        });
      });
    }

    // Extract dynamic dropdown filter options from active inventory in Supabase
    const { data: filterRows } = await supabase
      .from('properties')
      .select('location, property_type, configuration')
      .or('is_archived.is.null,is_archived.eq.0');

    const allLocations = [...new Set((filterRows || []).map((r) => r.location).filter(Boolean))].sort();
    const allTypes = [...new Set((filterRows || []).map((r) => r.property_type).filter(Boolean))].sort();
    const allConfigs = [...new Set((filterRows || []).map((r) => r.configuration).filter(Boolean))].sort();

    res.json({
      properties,
      filters: {
        locations: allLocations,
        types: allTypes,
        configurations: allConfigs,
        statuses: ['Available', 'Sold', 'On-Hold'],
      },
    });
  } catch (error) {
    console.error('Error fetching properties from Supabase:', error);
    res.status(500).json({ error: 'Failed to retrieve properties from database' });
  }
});

// GET /api/properties/archived (Fetch all archived properties with search - Admin Only)
router.get('/archived', requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;

    let dbQuery = supabase
      .from('properties')
      .select('*')
      .eq('is_archived', 1)
      .order('archived_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    const { data: rows, error } = await dbQuery;
    if (error) throw error;

    let properties = (rows || []).map(formatProperty);

    if (search && search.trim()) {
      const normalizedSearch = search.trim().toLowerCase().replace(/(\d+)\s*(bhk|bed|cr|lakh)/gi, '$1 $2');
      const tokens = normalizedSearch.split(/\s+/).filter(Boolean);

      properties = properties.filter((p) => {
        const amenitiesStr = Array.isArray(p.amenities) ? p.amenities.join(' ') : String(p.amenities || '');
        const targetText = [
          p.name,
          p.location,
          p.developer,
          p.configuration,
          p.property_type,
          p.price,
          p.area,
          p.description,
          amenitiesStr,
        ].join(' ').toLowerCase();

        return tokens.every((token) => targetText.includes(token));
      });
    }

    res.json({
      properties,
      total: properties.length,
    });
  } catch (error) {
    console.error('Error fetching archived properties from Supabase:', error);
    res.status(500).json({ error: 'Failed to retrieve archived properties from database' });
  }
});

// GET /api/properties/:id (Requires Authentication)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(formatProperty(data));
  } catch (error) {
    console.error('Error fetching property details from Supabase:', error);
    res.status(500).json({ error: 'Failed to retrieve property details' });
  }
});

// POST /api/properties (Add Property - Admin Only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      location,
      property_type,
      configuration,
      price,
      price_numeric,
      area,
      area_numeric,
      description,
      amenities,
      images,
      developer,
      status,
      original_url,
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Property name and location are required' });
    }

    const id = `prop-blx-${Date.now().toString(36)}`;
    const parsedAmenities = Array.isArray(amenities) ? amenities : (amenities ? JSON.parse(amenities) : []);
    const rawImages = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);
    const parsedImages = await processAndUploadImages(rawImages);
    const now = new Date().toISOString();

    const insertPayload = {
      id,
      name: name.trim(),
      location: location.trim(),
      property_type: property_type || 'Apartment',
      configuration: configuration || '3 BHK',
      price: price || 'Contact for Price',
      price_numeric: Number(price_numeric) || 0,
      area: area || 'N/A',
      area_numeric: Number(area_numeric) || 0,
      description: description || '',
      amenities: parsedAmenities,
      images: parsedImages,
      developer: developer || 'BLX Curated Partner',
      status: status || 'Available',
      original_url: original_url || '',
      is_archived: 0,
      archived_at: null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('properties')
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(formatProperty(data));
  } catch (error) {
    console.error('Error adding property to Supabase:', error);
    res.status(500).json({ error: 'Failed to add property: ' + error.message });
  }
});

// PUT /api/properties/:id (Edit Property - Admin Only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const {
      name,
      location,
      property_type,
      configuration,
      price,
      price_numeric,
      area,
      area_numeric,
      description,
      amenities,
      images,
      developer,
      status,
      original_url,
    } = req.body;

    const parsedAmenities = amenities !== undefined
      ? (Array.isArray(amenities) ? amenities : JSON.parse(amenities || '[]'))
      : existing.amenities;

    let parsedImages = existing.images;
    if (images !== undefined) {
      const rawImages = Array.isArray(images) ? images : JSON.parse(images || '[]');
      parsedImages = await processAndUploadImages(rawImages);
    }

    const updatePayload = {
      name: name !== undefined ? name : existing.name,
      location: location !== undefined ? location : existing.location,
      property_type: property_type !== undefined ? property_type : existing.property_type,
      configuration: configuration !== undefined ? configuration : existing.configuration,
      price: price !== undefined ? price : existing.price,
      price_numeric: price_numeric !== undefined ? Number(price_numeric) : existing.price_numeric,
      area: area !== undefined ? area : existing.area,
      area_numeric: area_numeric !== undefined ? Number(area_numeric) : existing.area_numeric,
      description: description !== undefined ? description : existing.description,
      amenities: parsedAmenities,
      images: parsedImages,
      developer: developer !== undefined ? developer : existing.developer,
      status: status !== undefined ? status : existing.status,
      original_url: original_url !== undefined ? original_url : existing.original_url,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: updateErr } = await supabase
      .from('properties')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json(formatProperty(updated));
  } catch (error) {
    console.error('Error updating property in Supabase:', error);
    res.status(500).json({ error: 'Failed to update property: ' + error.message });
  }
});

// PATCH /api/properties/:id/status (Quick Status Change - Admin Only)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Available', 'Sold', 'On-Hold'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'Available', 'Sold', or 'On-Hold'" });
    }

    const { data: updated, error } = await supabase
      .from('properties')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(formatProperty(updated));
  } catch (error) {
    console.error('Error updating property status in Supabase:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/properties/:id (Move to Archive - Soft Delete - Admin Only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: updated, error } = await supabase
      .from('properties')
      .update({
        is_archived: 1,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ message: 'Property moved to archive', property: formatProperty(updated) });
  } catch (error) {
    console.error('Error archiving property in Supabase:', error);
    res.status(500).json({ error: 'Failed to archive property' });
  }
});

// POST /api/properties/:id/archive (Explicit Archive endpoint - Admin Only)
router.post('/:id/archive', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: updated, error } = await supabase
      .from('properties')
      .update({
        is_archived: 1,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ message: 'Property moved to archive', property: formatProperty(updated) });
  } catch (error) {
    console.error('Error archiving property in Supabase:', error);
    res.status(500).json({ error: 'Failed to archive property' });
  }
});

// POST /api/properties/:id/restore (Restore Archived Property - Admin Only)
router.post('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: updated, error } = await supabase
      .from('properties')
      .update({
        is_archived: 0,
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ message: 'Property restored successfully', property: formatProperty(updated) });
  } catch (error) {
    console.error('Error restoring property in Supabase:', error);
    res.status(500).json({ error: 'Failed to restore property' });
  }
});

// DELETE /api/properties/:id/permanent (Permanent Deletion - Admin Only)
router.delete('/:id/permanent', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Property permanently deleted', id });
  } catch (error) {
    console.error('Error permanently deleting property from Supabase:', error);
    res.status(500).json({ error: 'Failed to permanently delete property' });
  }
});

export default router;

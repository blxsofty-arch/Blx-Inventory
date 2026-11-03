-- ==============================================================================
-- BLX REALTY INVENTORY - COMPLETE SUPABASE DATABASE SETUP SCRIPT (CLEAN / FAST VERSION)
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Project
-- 3. Click on "SQL Editor" in the left sidebar
-- 4. Click "New Query", paste this entire script, and click "RUN"
--
-- This script:
--  - Creates all 4 required tables: properties, staff_users, staff_sessions, password_resets
--  - Configures optimal indexes for high-speed search and filtering
--  - Sets up Row Level Security (RLS) policies allowing full operational access
--  - Seeds all staff user accounts
--  - Seeds all 14 live property inventory records (clean CDN URLs, no heavy base64 strings)
--  - Uses idempotent upserts (ON CONFLICT DO UPDATE) so it can be re-run safely
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 2. TABLE DEFINITIONS
-- ------------------------------------------------------------------------------

-- 2.1 Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    property_type TEXT NOT NULL,
    configuration TEXT NOT NULL,
    price TEXT NOT NULL,
    price_numeric DOUBLE PRECISION DEFAULT 0,
    area TEXT NOT NULL,
    area_numeric DOUBLE PRECISION DEFAULT 0,
    description TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    developer TEXT,
    status TEXT NOT NULL DEFAULT 'Available',
    original_url TEXT,
    is_archived INTEGER DEFAULT 0,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Staff Users Table
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'EMPLOYEE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Staff Persistent Sessions Table
CREATE TABLE IF NOT EXISTS public.staff_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.staff_users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Password Resets Table
CREATE TABLE IF NOT EXISTS public.password_resets (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_is_archived ON public.properties (is_archived);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price_numeric ON public.properties (price_numeric);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users (email);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token ON public.staff_sessions (token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email_token ON public.password_resets (email, token);

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted access for service_role and operational anon access
DROP POLICY IF EXISTS "Public full access to properties" ON public.properties;
CREATE POLICY "Public full access to properties" ON public.properties
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to staff_users" ON public.staff_users;
CREATE POLICY "Public full access to staff_users" ON public.staff_users
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to staff_sessions" ON public.staff_sessions;
CREATE POLICY "Public full access to staff_sessions" ON public.staff_sessions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to password_resets" ON public.password_resets;
CREATE POLICY "Public full access to password_resets" ON public.password_resets
    FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges
GRANT ALL ON TABLE public.properties TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.staff_users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.staff_sessions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.password_resets TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. SEED DATA - STAFF USERS
-- ------------------------------------------------------------------------------
INSERT INTO public.staff_users (id, email, password, name, role, created_at)
VALUES (
  'usr_1',
  'sales@theblxrealty.com',
  '[REDACTED]',
  'Siddhart Sahoo',
  'EMPLOYEE',
  '2026-10-01 09:47:21'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

INSERT INTO public.staff_users (id, email, password, name, role, created_at)
VALUES (
  'usr_2',
  'admin@theblxrealty.com',
  '[REDACTED]',
  'Nishchith Umesh',
  'ADMIN',
  '2026-10-01 09:47:21'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

INSERT INTO public.staff_users (id, email, password, name, role, created_at)
VALUES (
  'usr_mv4uxk5b_bdm3',
  'newagent@theblxrealty.com',
  '[REDACTED]',
  'New Agent',
  'EMPLOYEE',
  '2026-10-12 06:14:41'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- ------------------------------------------------------------------------------
-- 6. SEED DATA - PROPERTIES INVENTORY
-- ------------------------------------------------------------------------------
INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-1',
  'Brigade Twin Towers',
  'No. 11/1-4, Pipeline Rd, HMT, Ward No. 38, Yeswanthpur, Bengaluru, Karnataka 560022',
  'Commercial',
  'Commercial Space',
  'Starting From ₹20,000/Sq.Ft',
  20000,
  '2,500 - 15,000 sq.ft',
  5000,
  'Grade-A premium commercial office spaces and corporate suites located in the prestigious Brigade Twin Towers in Yeshwanthpur. Excellent connectivity to Outer Ring Road, Peenya industrial hub, and Kempegowda International Airport. Ideal for IT/ITES firms, corporate regional offices, and institutional investors.',
  '["Grade-A LEED Gold Certified","High-Speed Passenger & Service Elevators","Multi-Tier 24/7 Security & Access Control","Executive Cafeteria & Food Court","Multi-Level Covered Car Parking","100% DG Power Backup","High-Speed Fiber Optic Backbone","State-of-the-Art Conference Center"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1782458669801-in556gedhhg.webp","https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Brigade Group',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-05 05:45:27'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-2',
  'Embassy Springs Luxury Residences',
  'Embassy Near Stonehill International School, North Bengaluru',
  'Residential',
  '2 BHK & 3 BHK',
  'Starting From ₹1.92 Cr',
  19200000,
  '1,325 - 1,980 sq.ft',
  1650,
  'Located near Stonehill International School along the high-growth Bengaluru Airport Corridor, Embassy Springs is part of a 200+ acre master-planned integrated township. Surrounded by mature trees, serene waterbodies, and world-class sports facilities, Embassy Springs offers balanced biophilic luxury living.',
  '["200+ Acre Master Township","Bespoke Club & Wellness Spa","Natural Lake & Waterfront Promenade","Cycling & Jogging Trail","Heated Swimming Pool","Tennis Courts","Children Play Arena","24/7 Multi-Tier Security"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1789644248800-ff3445b1-bf78-4c04-91e5-306d9e556681.webp","https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Embassy Group',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-14 04:59:11'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-3',
  'Codename DIAMOND',
  'Kanakapura Main Rd, Vajarahalli, Talaghattapura, Bengaluru, Karnataka 560109',
  'Residential',
  '3 BHK',
  'Starting From ₹2.90 Cr',
  29000000,
  '1,850 - 2,350 sq.ft',
  2100,
  'An ultra-luxury residential landmark set across 3.6 acres in Vajrahalli on Kanakapura Main Road. Rising across two 39-storey high-rise towers with only 260 bespoke residences, featuring over 80% open landscaped area and an expansive 30,000 sq.ft private clubhouse with 50+ lifestyle amenities.',
  '["30,000 sq.ft Luxury Clubhouse","Infinity Swimming Pool with Deck","Badminton & Squash Courts","Rooftop Yoga & Meditation Terrace","Teen Plaza & Interactive Fountains","24/7 Security & CCTV","EV Charging Station"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1789108515420-fc69c09e-b458-4c11-8e51-ce2eda05ec9b.webp","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'BLX Curated Partner',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-12 05:15:27'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-4',
  'TVS Emerald Altura',
  'SH 104, Srinivasa Nagar, Sathanur, Bengaluru, Karnataka 562149',
  'Residential',
  '1 BHK & 2 BHK',
  'Starting From ₹1.40 Cr',
  14000000,
  '650 - 1,120 sq.ft',
  920,
  'Thoughtfully designed 1 & 2 BHK smart homes crafted by TVS Emerald on SH 104 in Sathanur, North Bengaluru. Engineered for efficient space utilization, superior natural ventilation, and immediate connectivity to KIA airport corridor.',
  '["Designer Landscaped Gardens","Modern Clubhouse","Swimming Pool","Fitness Center","Children Play Park","Jogging Track","Multi-Purpose Sports Court"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1788958970581-fe4146ec-dc0e-475b-b32c-cecb8989321c.webp","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'TVS Emerald',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-12 05:15:32'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-5',
  'CodeName Hennur',
  'Hennur Main Rd, Byreshwara Layout, Hennur Bande, Richards Town, Bengaluru, Karnataka 560043',
  'Residential',
  '3 & 4 BHK',
  'Starting From ₹3.00 Cr',
  30000000,
  '2,100 - 3,150 sq.ft',
  2600,
  'High-end 3 & 4 BHK palatial residences located directly on Hennur Main Road with seamless links to Manyata Tech Park and Richards Town. Featuring private elevators, expansive terraces, and curated finishes.',
  '["Grand Double-Height Foyer","Heated Indoor Swimming Pool","Full-Service Gymnasium","Steam & Sauna","Banquet & Party Lawn","Private Screening Room","Concierge Desk"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1788950132368-335150bf-6487-492f-af02-b5b76acb49cc.png","https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'BLX Curated Partner',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-05 05:45:27'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-6',
  'Provident Capella',
  'Soukya Road, Whitefield, Bangalore',
  'Residential',
  '1, 2 & 2.5 BHK',
  'Starting From ₹99.90 Lakhs',
  9990000,
  '750 - 1,180 sq.ft',
  950,
  'Bangalore''s pioneering child-centric residential project located on Soukya Road in Whitefield. Built around the holistic development of children with dedicated cultural, athletic, and educational amenities.',
  '["Boomerang Child-Centric Clubhouse","STEM Play Lab","Herb Garden","Swimming Pool & Splash Pad","Open Air Theatre","Basketball Court","24/7 Gated Security"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785416019245-8zpu9wgcm8h.webp","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Provident Housing',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-07 07:44:12'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-7',
  'Provident Botanico',
  'Soukya Road, Whitefield, Bangalore',
  'Residential',
  '2 & 3 BHK',
  'Starting From ₹1.25 Cr',
  12500000,
  '986 - 1,480 sq.ft',
  1230,
  'Sprawling over 17 verdant acres on Soukya Road, Whitefield, Provident Botanico features 70% open green space with over 1,000 indigenous trees. Ideal for modern families prioritizing health and nature without sacrificing tech corridor proximity.',
  '["Botanical Garden & Tree Walk","25,000 sq.ft Clubhouse","Zen Meditation Courtyard","Lap Pool & Jacuzzi","Badminton Court","Pet Park","Sustainable Rainwater Harvesting"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785396235309-mcgtr30ro3d.webp","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Provident Housing',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-05 05:45:27'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-8',
  'Purva Silver Sky',
  'Electronic City Phase 2, Hosur Road, Bangalore',
  'Residential',
  '3, 3.5 & 4 BHK',
  'Starting From ₹2.30 Cr',
  23000000,
  '1,720 - 2,580 sq.ft',
  2150,
  'An architectural statement in Electronic City Phase 2, offering skyline views, blu-tech home automation, expansive sundecks, and rapid transit to Hosur Road elevated expressway.',
  '["Sky Lounge on 28th Floor","Infinity Horizon Pool","Squash & Table Tennis","Spa & Steam Suites","Automated Home Integration","EV Fast Charging","Multi-Tier Security"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785393630485-tdv9egcrogd.webp","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Puravankara',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-05 05:45:27'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-9',
  'Purva Meraki',
  'HSR Layout, Haralur Road, Bangalore',
  'Residential',
  '3 & 4 BHK',
  'Starting From ₹3.90 Cr',
  39000000,
  '2,450 - 3,600 sq.ft',
  3025,
  'Limited-edition luxury residences in prime HSR Layout. Offering private foyer entries, ultra-modern layouts, Italian marble flooring, and unparalleled access to Koramangala and Bellandur tech parks.',
  '["Exclusive Low-Density Community","Rooftop Infinity Pool","Aerobics & Yoga Studio","Business Lounge & Meeting Suites","Private Lift Lobbies","Landscaped Sky Terraces"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785354417364-oetljbyh6s.webp","https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Puravankara',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-05 08:05:32'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-10',
  'Provident Sunworth City',
  'Near NICE Road Junction, Off Mysore Road, Bengaluru, Karnataka – 560060',
  'Residential',
  '2 & 3 BHK',
  'Starting From ₹73.49 Lakhs',
  7349000,
  '883 - 1,082 sq.ft',
  980,
  'One of Bengaluru''s largest self-contained townships off Mysore Road near NICE Road Junction. Features seamless metro connectivity, 50+ amenities, and lush landscaped surroundings.',
  '["59-Acre Township with 75% Green Spaces","20,000 sq.ft Clubhouse","Multiple Swimming Pools","Cricket Practice Net","Butterfly Garden","Commercial Retail Plaza","Metro Connectivity"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785156484748-p968ughpbqr.webp","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Provident Housing',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-05 05:45:27'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-11',
  'Purva Northern Lights',
  'KIADB Aerospace Park, Bagalur, Bengaluru North, Karnataka – 562149',
  'Residential',
  '2, 3 & 4 BHK',
  'Starting From ₹1.40 Cr',
  14000000,
  '1,180 - 2,240 sq.ft',
  1710,
  'Strategically positioned at KIADB Aerospace Park in Bagalur, North Bengaluru. Right in the epicenter of the emerging tech and hardware manufacturing aerospace hub, moments away from Kempegowda International Airport.',
  '["Aurora Themed Grand Club","Reflexology Trail","Semi-Olympic Pool","Indoor Sports Arena","Work-from-Home Cubicles","EV Charging Stations","24/7 Security"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785569996609-xar09wfr5sk.webp","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Puravankara',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-05 05:45:27'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-12',
  'Godrej Vanantara',
  'Dinnepalya Road, Off Bannerghatta Road, South Bangalore, Karnataka 560083',
  'Residential',
  '2 & 3 BHK',
  'Starting From ₹1.58 Cr',
  15800000,
  '1,200 - 1,840 sq.ft',
  1520,
  'A forest-themed sanctuary on Bannerghatta Road offering over 80% open nature, 700+ preserved trees, biophilic architecture, and direct connectivity to NICE Road and electronic city transit corridors.',
  '["Dense Forest Canopy & Nature Trails","Treehouse & Canopy Walkway","Organic Farming Zone","Forest View Infinity Pool","Meditation Pavilion","Clubhouse & Wellness Center"]'::jsonb,
  '["https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1779880031596-cx8dj4aluov.webp","https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'Godrej Properties',
  'Available',
  'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app',
  0,
  NULL,
  '2026-10-05 05:45:27',
  '2026-10-05 08:05:54'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-blx-mv6hsqxw',
  'code harry ',
  'nagenahalli, devasandra ',
  'Plot',
  '',
  '₹1.8 Cr Onwards ',
  0,
  '2000 sq.ft',
  0,
  'Bangalore''s pioneering child-centric residential project located on Soukya Road in Whitefield. Built around the holistic development
of children with dedicated cultural, athletic, and educational amenities.',
  '[]'::jsonb,
  '[]'::jsonb,
  'BLX Curated Partner',
  'Available',
  '',
  0,
  NULL,
  '2026-10-13 09:42:34',
  '2026-10-13 10:17:01'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.properties (
  id, name, location, property_type, configuration, price, price_numeric,
  area, area_numeric, description, amenities, images, developer,
  status, original_url, is_archived, archived_at, created_at, updated_at
) VALUES (
  'prop-blx-mv7nkoxt',
  'Premium Commercial Spaces In DNR Altitude',
  '2GGW+9GJ, Yeshwanthpur Industrial Area, Phase 1, Yeshwanthpur, Bengaluru, Karnataka 560022',
  'Commercial',
  'Commercial Space',
  'Starting from ₹16,500/Sq.Ft',
  0,
  '40000',
  0,
  'DNR Altitude is a premium Grade-A commercial development in Yeshwanthpur, Bengaluru, offering modern workspaces, retail and lifestyle amenities with excellent connectivity and visibility.',
  '[]'::jsonb,
  '["https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'DNR Altitude',
  'Available',
  '',
  0,
  NULL,
  '2026-10-14 05:12:02',
  '2026-10-14 06:33:04'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  property_type = EXCLUDED.property_type,
  configuration = EXCLUDED.configuration,
  price = EXCLUDED.price,
  price_numeric = EXCLUDED.price_numeric,
  area = EXCLUDED.area,
  area_numeric = EXCLUDED.area_numeric,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  developer = EXCLUDED.developer,
  status = EXCLUDED.status,
  original_url = EXCLUDED.original_url,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = EXCLUDED.updated_at;


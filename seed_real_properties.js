import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'server/properties.db');

const db = new sqlite3.Database(dbPath);

const realProperties = [
  {
    id: 'prop-1',
    name: 'Brigade Twin Towers',
    location: 'No. 11/1-4, Pipeline Rd, HMT, Ward No. 38, Yeswanthpur, Bengaluru, Karnataka 560022',
    property_type: 'Commercial',
    configuration: 'Commercial Space',
    price: 'Starting From ₹20,000/Sq.Ft',
    price_numeric: 20000,
    area: '2,500 - 15,000 sq.ft',
    area_numeric: 5000,
    description: 'Grade-A premium commercial office spaces and corporate suites located in the prestigious Brigade Twin Towers in Yeshwanthpur. Excellent connectivity to Outer Ring Road, Peenya industrial hub, and Kempegowda International Airport. Ideal for IT/ITES firms, corporate regional offices, and institutional investors.',
    amenities: JSON.stringify([
      'Grade-A LEED Gold Certified',
      'High-Speed Passenger & Service Elevators',
      'Multi-Tier 24/7 Security & Access Control',
      'Executive Cafeteria & Food Court',
      'Multi-Level Covered Car Parking',
      '100% DG Power Backup',
      'High-Speed Fiber Optic Backbone',
      'State-of-the-Art Conference Center'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1782458669801-in556gedhhg.webp',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Brigade Group',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-2',
    name: 'Embassy Springs Luxury Residences',
    location: 'Embassy Near Stonehill International School, North Bengaluru',
    property_type: 'Residential',
    configuration: '2 BHK & 3 BHK',
    price: 'Starting From ₹1.92 Cr',
    price_numeric: 19200000,
    area: '1,325 - 1,980 sq.ft',
    area_numeric: 1650,
    description: 'Located near Stonehill International School along the high-growth Bengaluru Airport Corridor, Embassy Springs is part of a 200+ acre master-planned integrated township. Surrounded by mature trees, serene waterbodies, and world-class sports facilities, Embassy Springs offers balanced biophilic luxury living.',
    amenities: JSON.stringify([
      '200+ Acre Master Township',
      'Bespoke Club & Wellness Spa',
      'Natural Lake & Waterfront Promenade',
      'Cycling & Jogging Trail',
      'Heated Swimming Pool',
      'Tennis Courts',
      'Children Play Arena',
      '24/7 Multi-Tier Security'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1789644248800-ff3445b1-bf78-4c04-91e5-306d9e556681.webp',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Embassy Group',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-3',
    name: 'Codename DIAMOND',
    location: 'Kanakapura Main Rd, Vajarahalli, Talaghattapura, Bengaluru, Karnataka 560109',
    property_type: 'Residential',
    configuration: '3 BHK',
    price: 'Starting From ₹2.90 Cr',
    price_numeric: 29000000,
    area: '1,850 - 2,350 sq.ft',
    area_numeric: 2100,
    description: 'An ultra-luxury residential landmark set across 3.6 acres in Vajrahalli on Kanakapura Main Road. Rising across two 39-storey high-rise towers with only 260 bespoke residences, featuring over 80% open landscaped area and an expansive 30,000 sq.ft private clubhouse with 50+ lifestyle amenities.',
    amenities: JSON.stringify([
      '30,000 sq.ft Luxury Clubhouse',
      'Infinity Swimming Pool with Deck',
      'Badminton & Squash Courts',
      'Rooftop Yoga & Meditation Terrace',
      'Teen Plaza & Interactive Fountains',
      '24/7 Security & CCTV',
      'EV Charging Station'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1789108515420-fc69c09e-b458-4c11-8e51-ce2eda05ec9b.webp',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'BLX Curated Partner',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-4',
    name: 'TVS Emerald Altura',
    location: 'SH 104, Srinivasa Nagar, Sathanur, Bengaluru, Karnataka 562149',
    property_type: 'Residential',
    configuration: '1 BHK & 2 BHK',
    price: 'Starting From ₹1.40 Cr',
    price_numeric: 14000000,
    area: '650 - 1,120 sq.ft',
    area_numeric: 920,
    description: 'Thoughtfully designed 1 & 2 BHK smart homes crafted by TVS Emerald on SH 104 in Sathanur, North Bengaluru. Engineered for efficient space utilization, superior natural ventilation, and immediate connectivity to KIA airport corridor.',
    amenities: JSON.stringify([
      'Designer Landscaped Gardens',
      'Modern Clubhouse',
      'Swimming Pool',
      'Fitness Center',
      'Children Play Park',
      'Jogging Track',
      'Multi-Purpose Sports Court'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1788958970581-fe4146ec-dc0e-475b-b32c-cecb8989321c.webp',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'TVS Emerald',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-5',
    name: 'CodeName Hennur',
    location: 'Hennur Main Rd, Byreshwara Layout, Hennur Bande, Richards Town, Bengaluru, Karnataka 560043',
    property_type: 'Residential',
    configuration: '3 & 4 BHK',
    price: 'Starting From ₹3.00 Cr',
    price_numeric: 30000000,
    area: '2,100 - 3,150 sq.ft',
    area_numeric: 2600,
    description: 'High-end 3 & 4 BHK palatial residences located directly on Hennur Main Road with seamless links to Manyata Tech Park and Richards Town. Featuring private elevators, expansive terraces, and curated finishes.',
    amenities: JSON.stringify([
      'Grand Double-Height Foyer',
      'Heated Indoor Swimming Pool',
      'Full-Service Gymnasium',
      'Steam & Sauna',
      'Banquet & Party Lawn',
      'Private Screening Room',
      'Concierge Desk'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1788950132368-335150bf-6487-492f-af02-b5b76acb49cc.png',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'BLX Curated Partner',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-6',
    name: 'Provident Capella',
    location: 'Soukya Road, Whitefield, Bangalore',
    property_type: 'Residential',
    configuration: '1, 2 & 2.5 BHK',
    price: 'Starting From ₹99.90 Lakhs',
    price_numeric: 9990000,
    area: '750 - 1,180 sq.ft',
    area_numeric: 950,
    description: 'Bangalore\'s pioneering child-centric residential project located on Soukya Road in Whitefield. Built around the holistic development of children with dedicated cultural, athletic, and educational amenities.',
    amenities: JSON.stringify([
      'Boomerang Child-Centric Clubhouse',
      'STEM Play Lab',
      'Herb Garden',
      'Swimming Pool & Splash Pad',
      'Open Air Theatre',
      'Basketball Court',
      '24/7 Gated Security'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785416019245-8zpu9wgcm8h.webp',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Provident Housing',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-7',
    name: 'Provident Botanico',
    location: 'Soukya Road, Whitefield, Bangalore',
    property_type: 'Residential',
    configuration: '2 & 3 BHK',
    price: 'Starting From ₹1.25 Cr',
    price_numeric: 12500000,
    area: '986 - 1,480 sq.ft',
    area_numeric: 1230,
    description: 'Sprawling over 17 verdant acres on Soukya Road, Whitefield, Provident Botanico features 70% open green space with over 1,000 indigenous trees. Ideal for modern families prioritizing health and nature without sacrificing tech corridor proximity.',
    amenities: JSON.stringify([
      'Botanical Garden & Tree Walk',
      '25,000 sq.ft Clubhouse',
      'Zen Meditation Courtyard',
      'Lap Pool & Jacuzzi',
      'Badminton Court',
      'Pet Park',
      'Sustainable Rainwater Harvesting'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785396235309-mcgtr30ro3d.webp',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Provident Housing',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-8',
    name: 'Purva Silver Sky',
    location: 'Electronic City Phase 2, Hosur Road, Bangalore',
    property_type: 'Residential',
    configuration: '3, 3.5 & 4 BHK',
    price: 'Starting From ₹2.30 Cr',
    price_numeric: 23000000,
    area: '1,720 - 2,580 sq.ft',
    area_numeric: 2150,
    description: 'An architectural statement in Electronic City Phase 2, offering skyline views, blu-tech home automation, expansive sundecks, and rapid transit to Hosur Road elevated expressway.',
    amenities: JSON.stringify([
      'Sky Lounge on 28th Floor',
      'Infinity Horizon Pool',
      'Squash & Table Tennis',
      'Spa & Steam Suites',
      'Automated Home Integration',
      'EV Fast Charging',
      'Multi-Tier Security'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785393630485-tdv9egcrogd.webp',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Puravankara',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-9',
    name: 'Purva Meraki',
    location: 'HSR Layout, Haralur Road, Bangalore',
    property_type: 'Residential',
    configuration: '3 & 4 BHK',
    price: 'Starting From ₹3.90 Cr',
    price_numeric: 39000000,
    area: '2,450 - 3,600 sq.ft',
    area_numeric: 3025,
    description: 'Limited-edition luxury residences in prime HSR Layout. Offering private foyer entries, ultra-modern layouts, Italian marble flooring, and unparalleled access to Koramangala and Bellandur tech parks.',
    amenities: JSON.stringify([
      'Exclusive Low-Density Community',
      'Rooftop Infinity Pool',
      'Aerobics & Yoga Studio',
      'Business Lounge & Meeting Suites',
      'Private Lift Lobbies',
      'Landscaped Sky Terraces'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785354417364-oetljbyh6s.webp',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Puravankara',
    status: 'On-Hold',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-10',
    name: 'Provident Sunworth City',
    location: 'Near NICE Road Junction, Off Mysore Road, Bengaluru, Karnataka – 560060',
    property_type: 'Residential',
    configuration: '2 & 3 BHK',
    price: 'Starting From ₹73.49 Lakhs',
    price_numeric: 7349000,
    area: '883 - 1,082 sq.ft',
    area_numeric: 980,
    description: 'One of Bengaluru\'s largest self-contained townships off Mysore Road near NICE Road Junction. Features seamless metro connectivity, 50+ amenities, and lush landscaped surroundings.',
    amenities: JSON.stringify([
      '59-Acre Township with 75% Green Spaces',
      '20,000 sq.ft Clubhouse',
      'Multiple Swimming Pools',
      'Cricket Practice Net',
      'Butterfly Garden',
      'Commercial Retail Plaza',
      'Metro Connectivity'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785156484748-p968ughpbqr.webp',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Provident Housing',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-11',
    name: 'Purva Northern Lights',
    location: 'KIADB Aerospace Park, Bagalur, Bengaluru North, Karnataka – 562149',
    property_type: 'Residential',
    configuration: '2, 3 & 4 BHK',
    price: 'Starting From ₹1.40 Cr',
    price_numeric: 14000000,
    area: '1,180 - 2,240 sq.ft',
    area_numeric: 1710,
    description: 'Strategically positioned at KIADB Aerospace Park in Bagalur, North Bengaluru. Right in the epicenter of the emerging tech and hardware manufacturing aerospace hub, moments away from Kempegowda International Airport.',
    amenities: JSON.stringify([
      'Aurora Themed Grand Club',
      'Reflexology Trail',
      'Semi-Olympic Pool',
      'Indoor Sports Arena',
      'Work-from-Home Cubicles',
      'EV Charging Stations',
      '24/7 Security'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1785569996609-xar09wfr5sk.webp',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Puravankara',
    status: 'Available',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  },
  {
    id: 'prop-12',
    name: 'Godrej Vanantara',
    location: 'Dinnepalya Road, Off Bannerghatta Road, South Bangalore, Karnataka 560083',
    property_type: 'Residential',
    configuration: '2 & 3 BHK',
    price: 'Starting From ₹1.58 Cr',
    price_numeric: 15800000,
    area: '1,200 - 1,840 sq.ft',
    area_numeric: 1520,
    description: 'A forest-themed sanctuary on Bannerghatta Road offering over 80% open nature, 700+ preserved trees, biophilic architecture, and direct connectivity to NICE Road and electronic city transit corridors.',
    amenities: JSON.stringify([
      'Dense Forest Canopy & Nature Trails',
      'Treehouse & Canopy Walkway',
      'Organic Farming Zone',
      'Forest View Infinity Pool',
      'Meditation Pavilion',
      'Clubhouse & Wellness Center'
    ]),
    images: JSON.stringify([
      'https://gjpujedmzdthonncnwsg.supabase.co/storage/v1/object/public/images/properties/1779880031596-cx8dj4aluov.webp',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
    ]),
    developer: 'Godrej Properties',
    status: 'Sold',
    original_url: 'https://your-dream-home-finder-ozwtztwnp-shresthabalindra777-3828.vercel.app'
  }
];

db.serialize(() => {
  db.run('DELETE FROM properties', (err) => {
    if (err) return console.error('Error clearing properties:', err);
    console.log('Cleared existing properties.');

    const stmt = db.prepare(`
      INSERT INTO properties (
        id, name, location, property_type, configuration, price, price_numeric,
        area, area_numeric, description, amenities, images, developer, status, original_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    realProperties.forEach((p) => {
      stmt.run(
        p.id,
        p.name,
        p.location,
        p.property_type,
        p.configuration,
        p.price,
        p.price_numeric,
        p.area,
        p.area_numeric,
        p.description,
        p.amenities,
        p.images,
        p.developer,
        p.status,
        p.original_url
      );
    });

    stmt.finalize(() => {
      console.log(`Successfully seeded all ${realProperties.length} real properties from reference site.`);
      db.all('SELECT id, name, property_type, price, status FROM properties', (err, rows) => {
        if (err) console.error(err);
        else console.log('Current rows in properties table:', rows);
        db.close();
      });
    });
  });
});

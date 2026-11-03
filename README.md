# BLX Realty - Internal Property Inventory & Sales Application (MVP v1.0)

A modular, high-performance internal sales portal and property inventory application built for **BLX Realty (The Bengaluru-London Exchange)** sales advisors and inventory managers.

---

## 🏛️ Application Architecture & Separation of Concerns

The project follows a clean separation of concerns designed for easy expansion in future phases:

```text
blx-realty-inventory/
├── server/                    # Backend API & Database Layer
│   ├── db.js                 # SQLite connection, schema migrations, and real BLX Realty seed data
│   ├── auth.js               # Staff authentication router & session management
│   ├── properties.js         # Property CRUD, filtering, status changer & dashboard statistics
│   └── index.js              # Express application entrypoint
├── src/                      # Frontend Client (React + Vite)
│   ├── api/
│   │   └── client.js         # Modular API service client
│   ├── context/
│   │   └── AuthContext.jsx   # Staff authentication provider & persistent session state
│   ├── components/
│   │   ├── Navbar.jsx        # Executive brand header, navigation tabs, user chip & quick add
│   │   ├── StatCard.jsx      # Interactive KPI stat cards (Total, Available, Sold, On-Hold)
│   │   ├── FilterBar.jsx     # Search, location, property type, config, status & sort bar
│   │   ├── PropertyCard.jsx  # Rich Grid view card with quick 1-click status dropdown
│   │   ├── PropertyRow.jsx   # Compact List view row for high-density phone consultation
│   │   ├── PropertyModal.jsx # Add & Edit property modal with validated fields & presets
│   │   └── ImageGallery.jsx  # Multi-image showcase with thumbnail slider & fullscreen lightbox
│   ├── pages/
│   │   ├── Login.jsx         # Secure internal staff login with demo account autofill
│   │   ├── Dashboard.jsx     # Portfolio KPI dashboard with quick corridor search & recent preview
│   │   ├── Inventory.jsx     # Complete inventory grid/list with multi-criteria filtering
│   │   └── PropertyDetails.jsx # Complete internal specs, gallery, amenities & management actions
│   ├── styles/
│   │   └── index.css         # Tailored design system (Midnight Navy, Champagne Gold, Glassmorphism)
│   ├── App.jsx               # Application root & client-side router
│   └── main.jsx              # DOM entrypoint
├── properties.db             # SQLite database storing individual property and staff records
└── package.json
```

---

## 🚀 Features Built (v1.0 Foundation Only)

1. **Staff Login**:
   - Secure staff authentication screen.
   - Pre-configured demo staff profiles with 1-click autofill:
     - **Sales Advisor**: `sales@theblxrealty.com` / `[REDACTED]`
     - **Inventory Manager**: `admin@theblxrealty.com` / `[REDACTED]`
2. **Sales Dashboard**:
   - Live KPI cards: **Total Properties**, **Available Properties**, **Sold Properties**, **On-Hold Properties**.
   - Clean search bar with quick corridor jump pills (*Kanakapura Road, North Bengaluru, Whitefield, Yeswanthpur*).
   - Click any KPI card to instantly jump to the filtered inventory view.
3. **Property Inventory**:
   - Dual view modes: **Grid View** (luxury cards) & **List View** (compact tabular layout ideal for salespeople on the phone).
   - Live search across property title, location, developer, and configuration.
   - 4-way filter controls: **Location**, **Property Type**, **Configuration**, and **Status**.
   - Sorting options: Price (Low to High / High to Low), Area (Small to Large / Large to Small), and Recently Added.
4. **Property Details**:
   - Dedicated internal property view.
   - Complete field representation: *Property Name, Location, Property Type, Configuration, Price, Area, Developer, Status, Description, Amenities, and Original BLX URL*.
   - Interactive multi-image gallery with thumbnail switcher and fullscreen zoom lightbox.
   - 1-click availability status changer right on the details page.
5. **Basic Property Management (CRUD)**:
   - **Add Property**: Modal with input validation, common amenity presets, and image URL manager.
   - **Edit Property**: Pre-filled modal to modify any property field.
   - **Delete Property**: Safe deletion with user confirmation prompt.
   - **Change Status**: Direct 1-click status dropdown updates across cards, rows, and details.
6. **Direct WhatsApp Share & Branded PDF Generation**:
   - **Direct WhatsApp Share Button**: Visible on every property card (and table rows/details page).
   - **Official Company Logo**: Features the official BLX Realty logo embedded in both the PDF presentation and the portal navigation/login interface.
   - **Branded Customer Brochure PDF**: Automatically extracts database fields (title, location, developer, price, configuration, area, description, amenities, and actual gallery images) and generates a downloadable PDF named `BLX_Realty_PropertyName.pdf`.
   - **Pre-filled WhatsApp Client Message**: Opens WhatsApp automatically with pre-formatted message:
     ```text
     Hello! Greetings from BLX Realty.

     Please find the property details for [Property Name] in [Location].

     Price: [Price]
     Configuration: [Configuration]

     I've attached the property brochure for your reference.

     Please feel free to contact us for further information.

     Regards,
     BLX Realty
     ```
   - **Agent Reminder**: Clearly reminds agents to select the client's chat and attach the downloaded brochure PDF (no misleading claims of automated local file injection into WhatsApp).
   - **Duplicate Click Prevention**: Visual loading spinner and disabled state while PDF is generating.

---

## 💾 Database Schema

The database is built on **SQLite** (`properties.db`) with modular SQL queries:

```sql
CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  property_type TEXT NOT NULL,
  configuration TEXT NOT NULL,
  price TEXT NOT NULL,
  price_numeric REAL,
  area TEXT NOT NULL,
  area_numeric REAL,
  description TEXT,
  amenities TEXT,       -- JSON array of amenities
  images TEXT,          -- JSON array of image URLs
  developer TEXT,
  status TEXT NOT NULL DEFAULT 'Available', -- 'Available', 'Sold', 'On-Hold'
  original_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Pre-seeded with real properties referenced from BLX Realty's portfolio including:
- **Codename DIAMOND** (Kanakapura Road, Vajrahalli) - 3 & 3.5 BHK
- **Embassy Springs** (North Bengaluru Airport Corridor) - 2, 2.5 & 3 BHK
- **Brigade Twin Towers Executive Suites** (Yeswanthpur) - Commercial Suite
- **Sobha Windsor Victorian Residences** (Whitefield) - 3 & 4 BHK
- **Prestige City Park Residences** (Sarjapur Road) - 2 & 3 BHK
- **Godrej Athena Neoclassical Residences** (Indiranagar / HAL) - Penthouse
- **Total Environment In That Quiet Earth** (Hennur Road) - Villa
- **Godrej Splendour** (Whitefield) - 2 BHK

---

## 🛠️ How to Run Locally

### Start Server (Single Port API + UI):
```bash
npm run start
```
Access the application at: **`http://localhost:5001`**

### Development Mode with Live Hot Reload (Vite + API):
```bash
npm run dev
```
Runs the Express backend on port `5001` and Vite client on port `5173` with reverse proxy.

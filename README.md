# MediKey — Digital Medical ID & Healthcare Management System

MediKey is a secure, cloud-enabled Digital Medical ID and Healthcare Management application designed to store personal health records, organize prescriptions and emergency contacts, and provide instant, consented access to first responders via cryptographically signed QR codes.

Built with a modular ES architecture and integrated with Supabase (PostgreSQL, Auth, and Encrypted Private Storage).

---

## Architecture & Project Structure

The project strictly adheres to separation of concerns without monolithic scripts or framework overhead:

```
medikey/
├── index.html                   # Accessible, semantic main application document
├── css/
│   └── style.css                # Healthcare UI design system, mobile-responsive layout
├── js/                          # Native ES modules (orchestrated by script.js)
│   ├── script.js                # Main application orchestrator & lifecycle manager
│   ├── supabase-client.js       # Official Supabase client configuration & connection
│   ├── auth.js                  # Supabase Auth: registration, login, recovery, sessions
│   ├── profile.js               # User profile management & critical alert badges
│   ├── records.js               # Medical records CRUD (prescriptions, notes, kit, appointments)
│   ├── storage.js               # Private document vault (PDFs/images, signed 5-min URLs)
│   ├── qr.js                    # Local canvas QR generator, camera scanner & emergency pass
│   ├── emergency.js             # ICE contacts, 🚨 112 SOS dialler & GPS hospital locator
│   └── utils.js                 # DOM utilities, modal system, HTML sanitizer, i18n
├── assets/
│   ├── icons/                   # PWA application icons (192px, 512px, SVG)
│   └── vendor/                  # Locally bundled, offline-ready libraries
│       ├── supabase.min.js      # Official Supabase JS SDK v2
│       ├── qrcode.min.js        # Offline HTML5 Canvas QR engine (zero data leak)
│       └── html5-qrcode.min.js  # Mobile & desktop camera QR scanner
├── supabase/
│   └── migrations/              # Version-controlled SQL database migrations
│       ├── 20261125000001_initial_medikey_schema.sql
│       └── 20261125000002_grant_public_permissions.sql
├── manifest.json                # Progressive Web App (PWA) manifest
├── sw.js                        # Service worker (static asset caching, zero sensitive data cache)
├── vercel.json                  # Production static hosting configuration & security headers
├── test_backend_e2e.js          # Multi-tenant RLS isolation & backend verification suite
├── test_modules.js              # Frontend module syntax & asset validation runner
└── .gitignore                   # Comprehensive exclusion of secrets, logs, and artifacts
```

---

## Supabase Backend & Database Architecture

MediKey connects to Supabase via the official Supabase JavaScript SDK using Row Level Security (RLS) to enforce strict multi-tenant isolation.

### 1. Database Tables (10 Core Tables)
- **`profiles`**: Patient demographics, Health ID (`MK-XXXXXX`), blood group, allergies, chronic conditions.
- **`medical_history`**: Past surgeries, family medical history, primary physician details.
- **`emergency_contacts`**: In Case of Emergency (ICE) contacts with priority flags.
- **`medical_documents`**: Metadata for uploaded diagnostic reports, lab results, and certificates.
- **`prescriptions`**: Active and archived medications, dosages, prescribing doctors, and frequency.
- **`health_notes`**: Patient observations, vitals logs, and clinical notes.
- **`appointments`**: Scheduled clinic visits, doctor appointments, and checkup reminders.
- **`medical_kit`**: First-aid and personal medicine inventory with expiration tracking.
- **`emergency_shares`**: 40-character cryptographic tokens and patient consent preferences.
- **`user_settings`**: Multilingual preference (`en`, `hi`, `mr`), theme, and notification toggles.

### 2. Private Storage Buckets
- **`medikey-avatars`**: Profile photos (private, restricted to owner).
- **`medikey-documents`**: PDF lab reports and diagnostic scans (private, signed URLs expire in 5 minutes).

### 3. Automated Triggers & RPC
- **Automated Provisioning (`on_auth_user_created`)**: Automatically assigns a unique `health_id`, base `profiles` row, `user_settings`, and `medical_history` placeholder on user registration.
- **Consent-Guarded Emergency RPC (`get_emergency_share`)**: Allows emergency first responders to scan a patient's QR code and retrieve critical life-saving data (blood type, severe allergies, primary ICE contact) while strictly withholding unconsented fields.

---

## Security & Privacy Model

1. **Row Level Security (RLS)**: Enabled across all 10 tables and storage objects. Users can only select, insert, update, or delete their own records.
2. **Offline Local QR Generation**: QR codes are rendered purely client-side on HTML5 Canvas using a locally bundled library. Medical data is never transmitted to third-party QR generation APIs.
3. **Data Minimization & Revocation**: Patients choose which fields appear on their emergency QR pass. Tokens can be revoked instantly at any time from the dashboard.
4. **Service Worker Privacy Shield**: `sw.js` caches static UI assets (HTML, CSS, vendor scripts) and explicitly skips caching API responses, authentication tokens, and private document URLs.
5. **Security Headers**: `vercel.json` applies strict `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.

---

## Verification & Testing

To run the automated verification suites:

```bash
# 1. Validate frontend module syntax and PWA assets
node test_modules.js

# 2. Run multi-tenant backend isolation and storage test suite
node test_backend_e2e.js
```

---

## Static Deployment

MediKey is designed for instant static hosting on GitHub Pages and Vercel.

### Deploying to Vercel
1. Import the repository in [Vercel](https://vercel.com).
2. Framework Preset: **Other**.
3. Output Directory: `./` (root).
4. Click **Deploy**.

### Deploying to GitHub Pages
1. Navigate to **Repository Settings > Pages**.
2. Source: **Deploy from a branch**.
3. Branch: **main**, Folder: **/ (root)**.
4. Save.

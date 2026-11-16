# Al-Kitab (الكتاب) — Quran & Dhikr Spiritual Journal

A full-stack, offline-first progressive web application (PWA) designed to track daily Quran recitation, dhikr, custom spiritual goals, and tasbih counters. Built with clean architecture, enterprise security practices, and mindful Islamic aesthetics.

---

## Architecture Overview

Al-Kitab is structured as a decoupled full-stack monorepo:

```
Al-Kitab/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection & URI sanitization
│   │   ├── constants/      # 114 Surahs metadata (names, ayah counts)
│   │   ├── controllers/    # Request dispatchers & response formatting
│   │   ├── middlewares/    # Auth, Cookie Parser, Validation, Error Handler
│   │   ├── models/         # Mongoose schemas (User, Recitation, Goal, Counter, RefreshToken)
│   │   ├── repositories/   # Data access layer (isolated DB queries)
│   │   ├── routes/         # Express router definitions
│   │   ├── services/       # Core business logic & validations
│   │   ├── tests/          # Native Node 22 test suite (auth, recitations, stats, validators)
│   │   └── utils/          # JWT tokens & cryptographic helpers
│   ├── .env.example        # Sanitized template for environment configuration
│   └── package.json
│
├── frontend/
│   ├── public/             # Icons, manifest assets, offline background patterns
│   ├── src/
│   │   ├── components/     # Reusable UI widgets & Protected Route guards
│   │   ├── constants/      # Surahs transliterations and counts
│   │   ├── contexts/       # Auth, Theme, Language state providers
│   │   ├── hooks/          # Offline sync engine (`useSync.ts`)
│   │   ├── layouts/        # App navigation & responsive shell
│   │   ├── locales/        # English, Urdu, and Roman Urdu translations
│   │   ├── pages/          # Dashboard, History, Counters, Calendar, Settings, Admin
│   │   └── services/       # Typed Axios API client & offline storage queues
│   ├── .env.example
│   ├── vite.config.ts      # Vite PWA with Workbox offline precaching
│   └── package.json
│
└── .gitignore              # Strict ignore rules for secrets, DB files, and build outputs
```

---

## Key Features & Highlights

1. **Recitation Tracking**:
   - Track entire surahs (automatically computed ayah count) or custom ayah ranges (e.g. Ayat-ul-Kursi).
   - Support for custom spiritual dhikr recitations without surah constraints (e.g., "Astaghfirullah 100x", "Durood").
   - Bounds validation: prevents invalid spans (`fromAyah > toAyah` or exceeding Surah totals).

2. **Smart Statistics & Streaks**:
   - Active streak tracking (today/yesterday threshold).
   - Daily, weekly, and monthly goal completion percentages.
   - 7-day recitations trend and top-recited surahs distribution.

3. **Tasbih & Dhikr Counters**:
   - Digital tasbih with daily targets and special Friday targets (e.g., Surah Al-Kahf / Salawat).
   - Log history per counter with notes and timestamps.

4. **Security & Session Hardening**:
   - **Dual Auth Strategy**: Short-lived JWT access token (15m) paired with rotating refresh tokens (7d/30d).
   - **HTTP-Only Cookies**: Refresh tokens are transmitted via `httpOnly`, `sameSite: 'lax'`, and `secure` cookies with automatic rotation on each refresh.
   - **Cascade Cleanup**: Account deletion completely purges recitations, counters, goals, and refresh tokens across all collections.
   - **Log Protection**: MongoDB credentials and stack traces are masked and sanitized in logs.

5. **PWA & Offline Safety**:
   - Fully installable standalone web application.
   - **Workbox Safe Cache**: Private authenticated `/api/*` endpoints are strictly excluded from service worker runtime caching to prevent cross-user data leakage.
   - **Client Sync Queue**: Local modifications when offline are queued safely in localStorage/IndexedDB and synced automatically via `useSync` upon reconnection.

6. **Internationalization & Themes**:
   - Multilingual support: English, Urdu (اردو), and Roman Urdu.
   - Notion-inspired warm light & OLED deep dark themes.

---

## Getting Started

### Prerequisites
- **Node.js**: v20+ (v22+ recommended)
- **MongoDB**: Local MongoDB instance (port 27017) or MongoDB Atlas connection

### 1. Environment Configuration

#### Backend:
Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your settings:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/al_kitab
ACCESS_TOKEN_SECRET=your_super_secret_access_key_min_32_chars
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key_min_32_chars
CLIENT_URL=http://localhost:5173
```

#### Frontend:
If running on a custom port or remote backend:
```bash
cp frontend/.env.example frontend/.env
```
Default `VITE_API_URL` defaults to `http://localhost:5000/api`.

---

### 2. Installation & Running

#### Backend:
```bash
cd backend
npm install
npm run dev     # Starts server with tsx hot-reload on port 5000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev     # Starts Vite dev server on http://localhost:5173
```

---

## Testing & Quality Validation

### Backend Tests:
Runs the native Node.js test runner covering Auth security, token generation, cookie parsing, Recitation bounds, streak calculation, and Zod validator schemas:
```bash
cd backend
npm test
```

### Backend Build (TypeScript Check):
```bash
cd backend
npm run build
```

### Frontend Linting:
```bash
cd frontend
npm run lint
```

### Frontend Build:
```bash
cd frontend
npm run build
```

---

## Deployment Guidelines

1. **Environment Variables**:
   - Ensure `NODE_ENV=production` is set on the server.
   - Set strong, random 64-character secrets for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.
   - Update `CLIENT_URL` to your production frontend domain (e.g. `https://alkitab.app`).
2. **Reverse Proxy (Nginx / Caddy)**:
   - Configure SSL/TLS termination to enable `secure: true` cookies.
   - Route `/api/*` to the Node.js backend port (`5000`).
   - Serve frontend static build (`frontend/dist`) with caching headers for static assets and `Cache-Control: no-cache` for `sw.js` and `index.html`.
3. **PWA Standalone**:
   - Manifest metadata and service worker will automatically register in compliant modern browsers.


# Usupovo Life Hall — Project Context

## Project Overview

**Usupovo Life Hall** is a comprehensive ticket booking and verification system for a concert hall located in Domodedovo, Russia. The project consists of a web application with PWA support, an admin panel for event management, and a ticket verification system for staff.

### Core Features

- **Public Website**: Event showcase, interactive seat selection, online booking with promo codes and discount categories
- **Admin Panel**: Event management, seat configuration, booking management, visitor analytics, backup/restore functionality
- **Ticket Verification**: Mobile-optimized verifier with QR code scanning support
- **PWA Support**: Offline capabilities, push notifications, installable on mobile devices
- **Payment Integration**: Test integration with Tinkoff payment system

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js 20.x + Vercel Serverless Functions |
| **Database** | Vercel Postgres (Neon) |
| **Frontend** | Vanilla JavaScript (ES6+) |
| **Styling** | CSS3 (responsive, adaptive) |
| **PWA** | Service Worker |
| **QR Codes** | html5-qrcode library |
| **Charts** | Chart.js 4.4.0 |
| **Hosting** | Vercel |

## Project Structure

```
usupovo-life-hall/
├── public/                     # Static frontend files
│   ├── index.html              # Main public page (events, booking)
│   ├── admin.html              # Admin panel
│   ├── verify.html             # Ticket verifier page
│   ├── script.js               # Main client logic (2482 lines)
│   ├── admin.js                # Admin panel logic (2714 lines)
│   ├── verify.js               # Verifier logic (825 lines)
│   ├── analytics.js            # Visitor analytics (201 lines)
│   ├── style.css               # Responsive styles
│   ├── toast.js                # Toast notifications
│   ├── manifest.json           # PWA manifest (verify page)
│   ├── admin-manifest.json     # Admin PWA manifest
│   ├── sw.js                   # Service worker
│   ├── images/                 # Images, logos, event photos
│   └── lib/                    # Third-party libraries (html5-qrcode)
├── api/                        # Vercel Serverless Functions
│   ├── db.js                   # Database configuration (@vercel/postgres)
│   └── index.js                # Unified API router (all endpoints)
├── server/                     # Legacy server structure (for reference)
│   └── api/                    # Old API files (not used in production)
├── schema.sql                  # PostgreSQL database schema
├── vercel.json                 # Vercel configuration
├── server.js                   # Legacy Express server (for local dev)
├── dev-server.js               # Local development server with PostgreSQL
├── promocodes.js               # Legacy promo code controller (SQLite)
├── init-db.js                  # Database initialization script
├── seed-db.js                  # Database seeding script
├── package.json                # Dependencies & scripts
├── README.md                   # Full documentation (Russian)
├── VERCEL_DEPLOYMENT.md        # Vercel deployment guide
├── .env.example                # Environment variables template
└── QWEN.md                     # This file
```

## Building and Running

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Vercel account (for deployment)
- Vercel Postgres database

### Installation

```bash
npm install
```

### Local Development

1. **Create `.env.local` file**

```bash
cp .env.example .env.local
```

2. **Add database connection string**

```env
POSTGRES_URL=postgres://user:password@host.us-east-2.aws.neon.tech/dbname?sslmode=require
```

3. **Run the server**

```bash
# Production
npm start

# Development
npm run dev
```

The server starts on `http://localhost:3000`

### Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or push to Git repository connected to Vercel.

### Key URLs

| URL | Description |
|-----|-------------|
| `/` | Main public page |
| `/admin.html` | Admin panel |
| `/verify.html` | Ticket verifier |

## Database Schema

The application uses PostgreSQL (Neon) with the following tables:

| Table | Description |
|-------|-------------|
| `events` | Concert events (name, date, description, image) |
| `seats` | Venue seats (event_id, label, price, category, status) |
| `tickets` | Booked tickets (customer info, seats, payment) |
| `pending_bookings` | Pending payments (temp storage) |
| `promocodes` | Promo codes (code, discount, usage limits) |
| `discount_categories` | Discount categories (students, pensioners, etc.) |
| `visitor_sessions` | Analytics (IP, device, browser, duration) |
| `settings` | App settings (ticket type, backup info) |

## API Endpoints

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events |
| GET | `/api/events/:id` | Get event details |
| GET | `/api/seats/event/:eventId` | Get seat map |
| POST | `/api/book` | Create booking |
| GET | `/api/ticket/:ticketId` | Get ticket info |
| POST | `/api/ticket/:ticketId/use` | Mark ticket as used |
| GET | `/api/discount-categories` | List discount categories |
| POST | `/api/create-payment` | Create payment |
| POST | `/api/confirm-payment` | Confirm payment |
| POST | `/api/promo/validate` | Validate promo code |
| POST | `/api/analytics/session-start` | Track session start |
| POST | `/api/analytics/session-update` | Update session |
| POST | `/api/analytics/session-end` | Track session end |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/events` | List events with sales data |
| POST | `/api/admin/events/:id/seats/bulk` | Bulk create seats |
| GET | `/api/admin/seats/event/:id` | Get event seats |
| PUT | `/api/admin/seats/:id` | Update seat |
| GET | `/api/admin/bookings` | List all bookings |
| DELETE | `/api/admin/bookings/:id` | Delete booking (frees seats) |
| GET | `/api/admin/promocodes` | List promo codes |
| POST | `/api/admin/promocodes` | Create promo code |
| PUT | `/api/admin/promocodes/:id` | Update promo code |
| DELETE | `/api/admin/promocodes/:id` | Delete promo code |
| GET | `/api/admin/discount-categories` | List discount categories |
| POST | `/api/admin/discount-categories` | Create category |
| GET | `/api/admin/visitor-stats/chart?days=30` | Chart data |
| GET | `/api/admin/export` | Export all data (JSON) |
| POST | `/api/admin/import` | Import data from JSON |
| GET | `/api/admin/last-backup-info` | Last backup info |
| GET | `/api/admin/ticket-type` | Get ticket type |
| POST | `/api/admin/ticket-type` | Update ticket type |

## Key Configuration

### Default Admin Password
`Жопа` (stored client-side in `admin.html` — **security risk**)

### Database Connection
- **Vercel**: `POSTGRES_URL` environment variable (auto-set by Vercel)
- **Local**: `.env.local` file with `POSTGRES_URL`

### Default Discount Categories
- Стандартный (0%)
- Инвалид I группы (50%)
- Инвалид II группы (40%)
- Инвалид III группы (30%)
- Пенсионер (25%)
- Ветеран труда (35%)
- Студент (20%)

## Development Conventions

### Code Style
- **Backend**: CommonJS modules for db.js, ES modules for API routes
- **Frontend**: Vanilla ES6+, direct DOM manipulation
- **Naming**: Russian for user-facing strings, English for code identifiers
- **API Routes**: Named exports with `handler` function and `config` object

### Vercel Serverless Conventions

- Each API endpoint is a separate file in `server/api/`
- Use `export default async function handler(req, res)`
- Set `export const config` for body parser settings
- Use `@vercel/postgres` `sql` tagged template for queries
- Handle HTTP methods with `req.method` checks

### Security Considerations
- ⚠️ Admin password is client-side (needs server-side auth)
- ⚠️ No rate limiting on API endpoints
- ⚠️ No HTTPS enforcement (handled by Vercel)
- ✅ Backup/restore functionality available in admin panel

### Known Limitations
- Payment integration is test-only (requires webhook for production)
- No user authentication for customers
- No email/SMS notifications
- Single venue support only
- Serverless timeout: 10 seconds (Hobby plan)

## Common Tasks

### Add a New Event
1. Use admin panel UI, or
2. POST to `/api/admin/events` with `{ name, date, description, image_url }`

### Create Seats for Event
```javascript
POST /api/admin/events/:id/seats/bulk
{
  "rows": 10,
  "seatsPerRow": 10,
  "basePrice": 1500,
  "vipRows": [0, 1]
}
```

### Backup Database
1. Open admin panel → "Резервное копирование"
2. Click "Экспортировать данные"
3. JSON file downloads automatically

### Restore from Backup
1. Open admin panel → "Резервное копирование"
2. Upload JSON file or provide URL
3. Confirm import (⚠️ overwrites all data)

### Initialize Database
```bash
psql $POSTGRES_URL -f schema.sql
```

## Troubleshooting

### Database Connection Issues
- Check `POSTGRES_URL` environment variable
- Verify database is created in Vercel/Neon dashboard
- Run `schema.sql` to create tables

### Serverless Timeout
- Optimize database queries
- Add indexes on frequently queried columns
- Consider upgrading to Pro plan (60 sec timeout)

### Module Not Found: @vercel/postgres
```bash
npm install @vercel/postgres
git add package.json
git commit && git push
```

### Cold Start Delay
- First request after deployment may be slow (~1-2 sec)
- Subsequent requests are fast

## File References

| File | Purpose |
|------|---------|
| `server/api/db.js` | Database configuration and initialization |
| `server/api/events.js` | Events list endpoint |
| `server/api/book.js` | Booking creation endpoint |
| `server/api/admin/bookings.js` | Admin bookings endpoint |
| `public/script.js` | Public page logic (events, booking, seat selection) |
| `public/admin.js` | Admin panel logic (events, seats, bookings, analytics) |
| `public/verify.js` | Ticket verification with QR scanner |
| `public/analytics.js` | Visitor tracking and analytics |
| `public/style.css` | All styles (responsive, adaptive) |
| `schema.sql` | PostgreSQL schema |
| `vercel.json` | Vercel configuration |
| `VERCEL_DEPLOYMENT.md` | Deployment guide |

## Version Info

- **Current Version**: 2.0.0 (Vercel Migration)
- **Previous Version**: 1.2.0 (Render/SQLite)
- **Last Update**: March 2026
- **License**: MIT
- **Author**: REX Corporation

## Migration History

### v2.0.0 — Vercel Migration (March 2026)
- ✅ Migrated from SQLite to PostgreSQL (Neon)
- ✅ Converted to Vercel Serverless Functions
- ✅ Created separate API endpoint files
- ✅ Added deployment documentation
- ✅ Updated dependencies (@vercel/postgres)

### v1.2.0 (January 2025)
- Added booking deletion with seat release
- Added backup import via URL
- Code optimization

### v1.1.0 (January 2025)
- Added backup/restore functionality
- Visitor analytics

### v1.0.0
- Initial release

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
| **Backend** | Node.js 20.x + Express |
| **Database** | SQLite3 |
| **Frontend** | Vanilla JavaScript (ES6+) |
| **Styling** | CSS3 (responsive, adaptive) |
| **PWA** | Service Worker |
| **QR Codes** | html5-qrcode library |
| **Charts** | Chart.js 4.4.0 |

## Project Structure

```
usupovo-life-hall/
├── public/                     # Static frontend files
│   ├── index.html              # Main public page (events, booking)
│   ├── admin.html              # Admin panel
│   ├── verify.html             # Ticket verifier page
│   ├── script.js               # Main client logic
│   ├── admin.js                # Admin panel logic
│   ├── verify.js               # Verifier logic
│   ├── analytics.js            # Visitor analytics
│   ├── style.css               # Responsive styles
│   ├── toast.js                # Toast notifications
│   ├── manifest.json           # PWA manifest
│   ├── admin-manifest.json     # Admin PWA manifest
│   ├── sw.js                   # Service worker
│   ├── images/                 # Images, logos, event photos
│   └── lib/                    # Third-party libraries
├── server/
│   ├── routes/                 # API route handlers (empty)
│   └── usupovo-hall.db         # SQLite database
├── server.js                   # Main Express server + API
├── promocodes.js               # Promo code controller
├── package.json                # Dependencies & scripts
├── README.md                   # Full documentation (Russian)
├── .gitignore                  # Git ignore rules
└── QWEN.md                     # This file
```

## Building and Running

### Prerequisites
- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
npm install
```

### Running the Server

```bash
# Production
npm start

# Development (same command, no hot reload configured)
npm run dev
```

The server starts on `http://localhost:3000`

### Key URLs

| URL | Description |
|-----|-------------|
| `/` | Main public page |
| `/admin.html` | Admin panel |
| `/verify.html` | Ticket verifier |

## Database Schema

The application uses SQLite3 with the following tables:

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

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/events` | List events with sales data |
| POST | `/api/admin/events` | Create event |
| PUT | `/api/admin/events/:id` | Update event |
| DELETE | `/api/admin/events/:id` | Delete event |
| GET | `/api/admin/seats/event/:id` | Get event seats |
| POST | `/api/admin/events/:id/seats/bulk` | Bulk create seats |
| PUT | `/api/admin/seats/:id` | Update seat |
| DELETE | `/api/admin/seats/:id` | Delete seat |
| GET | `/api/admin/bookings` | List all bookings |
| DELETE | `/api/admin/bookings/:id` | Delete booking (frees seats) |
| GET | `/api/admin/promocodes` | List promo codes |
| POST | `/api/admin/promocodes` | Create promo code |
| PUT | `/api/admin/promocodes/:id` | Update promo code |
| DELETE | `/api/admin/promocodes/:id` | Delete promo code |
| GET | `/api/admin/discount-categories` | List discount categories |
| POST | `/api/admin/discount-categories` | Create category |
| PUT | `/api/admin/discount-categories/:id` | Update category |
| DELETE | `/api/admin/discount-categories/:id` | Delete category |
| GET | `/api/admin/visitor-stats` | Visitor session data |
| GET | `/api/admin/visitor-stats/aggregated` | Aggregated analytics |
| GET | `/api/admin/visitor-stats/chart?days=30` | Chart data |
| GET | `/api/admin/export` | Export all data (JSON) |
| POST | `/api/admin/import` | Import data from JSON/URL |
| GET | `/api/admin/last-backup-info` | Last backup info |

## Key Configuration

### Default Admin Password
`Жопа` (stored client-side in `admin.html` — **security risk**)

### Database Location
- Local: `./usupovo-hall.db`
- Production: `process.env.DATABASE_URL`

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
- **Backend**: CommonJS modules, callback-based SQLite queries
- **Frontend**: Vanilla ES6+, direct DOM manipulation
- **Naming**: Russian for user-facing strings, English for code identifiers

### Security Considerations
- ⚠️ Admin password is client-side (needs server-side auth)
- ⚠️ No rate limiting on API endpoints
- ⚠️ No HTTPS enforcement
- ⚠️ All APIs open on localhost
- ✅ Backup/restore functionality available in admin panel

### Known Limitations
- Payment integration is test-only (requires webhook for production)
- No user authentication for customers
- No email/SMS notifications
- Single venue support only

## Common Tasks

### Add a New Event
1. Use admin panel UI, or
2. POST to `/api/admin/events` with `{ name, date, description, image_url }`

### Create Seats for Event
```javascript
POST /api/admin/events/:id/seats/bulk
{
  "rows": ["A", "B", "C"],
  "seatsPerRow": 10,
  "vipRows": ["A"],
  "vipPrice": 2500,
  "standardPrice": 1500
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

## Troubleshooting

### Database Issues
- Database file: `usupovo-hall.db` in project root or `server/` folder
- Tables auto-created on server start
- Migrations run automatically for schema updates

### Payment Issues
- Test mode only — manual confirmation required in admin panel
- For production: implement Tinkoff webhook handler

### PWA Issues
- Service worker: `sw.js`
- Manifests: `manifest.json` (public), `admin-manifest.json` (admin)
- Clear cache if updates don't appear

## File References

| File | Purpose |
|------|---------|
| `server.js` | Main server (1728 lines) — Express setup, DB init, all API routes |
| `promocodes.js` | Promo code CRUD operations |
| `public/script.js` | Public page logic (events, booking, seat selection) |
| `public/admin.js` | Admin panel logic (events, seats, bookings, analytics) |
| `public/verify.js` | Ticket verification with QR scanner |
| `public/analytics.js` | Visitor tracking and analytics |
| `public/style.css` | All styles (responsive, adaptive) |

## Version Info

- **Current Version**: 1.2.0
- **Last Update**: January 2025
- **License**: MIT
- **Author**: REX Corporation

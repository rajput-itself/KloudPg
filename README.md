# KloudPG - PG Accommodation Booking Platform

A modern web application for finding and booking PG (Paying Guest) accommodations. Built with React 19, Vite, and Node.js backend with SQLite database.
## Developed by
Aaditya Ray Rajput
Aishwarya Ghadage
Aditya Gaikwad
Rohan Kale
## Features

- **User Authentication**: Register, login, password reset with email verification
- **PG Discovery**: Browse and filter accommodations by location, price, amenities
- **Booking Management**: Book rooms, track bookings, manage reservations
- **Owner Dashboard**: Manage properties, bookings, complaints, and user reviews
- **Admin Panel**: Monitor all users, properties, bookings, and complaints
- **Payment Integration**: Process bookings and payments
- **Real-time Notifications**: Get updates on bookings and messages
- **Reviews & Ratings**: Rate and review PG accommodations
- **Chat System**: Direct messaging between users and owners
- **Image Management**: Upload and manage accommodation photos

## Tech Stack

- **Frontend**: React 19, Vite 6, React Router
- **Backend**: Node.js with Express (adapted from Next.js API routes)
- **Database**: SQLite
- **Authentication**: JWT with password hashing
- **API Adapter**: Custom middleware to mount Next.js route handlers in Vite

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

The app will start at `http://localhost:5173` with the API server running in parallel.

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Project Structure

```
src/
├── app/                      # Main app routes and layouts
│   ├── api/                  # API route handlers (mounted in Vite)
│   │   ├── auth/            # Authentication endpoints
│   │   ├── admin/           # Admin management endpoints
│   │   ├── pgs/             # Accommodation listings
│   │   ├── bookings/        # Booking operations
│   │   └── ...              # Other API routes
│   ├── dashboard/           # User dashboard
│   ├── login/               # Authentication pages
│   ├── pgs/                 # Accommodation browsing
│   └── ...                  # Other app pages
├── components/              # Reusable React components
├── lib/                     # Utilities, database, seeding
└── shims/                   # Next.js compatibility shims
```

## API Routes

The project uses Next.js-style API routes adapted to work with Vite:

- **Authentication**: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`
- **PGs**: `/api/pgs`, `/api/pgs/[id]`, `/api/pgs/owner`
- **Bookings**: `/api/bookings`, `/api/bookings/[id]`
- **Admin**: `/api/admin/users`, `/api/admin/bookings`, `/api/admin/pgs`
- **Payments**: `/api/payments`, `/api/payments/[id]`
- **Messages & Chat**: `/api/messages`, `/api/notifications`

For full API documentation, see the route handlers in `src/app/api/`.

## Testing

### Desktop Testing
- Use Chrome DevTools responsive mode (`F12` → 📱 icon)
- Test at various breakpoints (mobile, tablet, desktop)

### Mobile Device Testing
- **Same WiFi**: Run `ipconfig getifaddr en0` to get local IP, then visit `http://<LOCAL_IP>:5173` on your phone
- **Chrome DevTools**: Start dev server and use device emulation
- **Real Device**: Connect iPhone to Mac for Safari inspector, or use Chrome Android debugging

## Database

The app uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `pgs` - PG accommodations
- `bookings` - Room bookings
- `payments` - Payment records
- `reviews` - User reviews
- `messages` - Chat messages
- `complaints` - User complaints

To seed initial data:
```bash
curl http://localhost:3001/api/seed
```

## Environment Variables

Create a `.env.local` file (if needed):
```
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Known Notes

- API routes are housed in `src/app/api/**/route.js` but are NOT Next.js routes—they're adapted to work with Vite via a middleware adapter
- The `src/shims/` directory provides compatibility shims for Next.js APIs (`next/link`, `next/navigation`, etc.)
- The app is production-ready but currently uses SQLite (consider upgrading to PostgreSQL for production deployments)

## License

MIT

# KloudPG - PG Accommodation Booking Platform

A modern web application for finding and booking PG (Paying Guest) accommodations. Built with React 19, Vite, and Node.js backend with MongoDB database.

## Developed by
Aaditya Ray Rajput
Aishwarya Ghadage
Aditya Gaikwad
Rohan Kale

## Features

- **User Authentication**: Register with email OTP verification, login, password reset
- **Email Verification**: OTP-based email verification during registration using Gmail SMTP
- **PG Discovery**: Browse and filter accommodations by location, price, amenities
- **Booking Management**: Book rooms, track bookings, manage reservations
- **Owner Dashboard**: Manage properties, bookings, complaints, and user reviews
- **Admin Panel**: Monitor all users, properties, bookings, complaints, and send direct messages to PG owners
- **Admin Messaging**: Direct chat between admin and PG owners
- **Payment Integration**: Process bookings and payments
- **Real-time Notifications**: Get updates on bookings and messages
- **Reviews & Ratings**: Rate and review PG accommodations
- **Chat System**: Direct messaging between users and owners
- **Image Management**: Upload and manage accommodation photos

## Tech Stack

- **Frontend**: React 19.2.4, Vite 6.4, React Router DOM 7.6
- **Backend**: Node.js API routes (Vite-mounted)
- **Database**: MongoDB 7.2
- **Authentication**: JWT with bcrypt password hashing
- **Email**: Nodemailer with SMTP support (Gmail, SendGrid, etc.)
- **API Documentation**: Route handlers in `src/app/api/`

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- MongoDB 5+ (local or Atlas connection)

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/kloudpg
MONGODB_DB=kloudpg

# JWT
JWT_SECRET=your-secret-key-here

# Email (Gmail example with App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=KloudPG

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
```

#### Setting up Gmail SMTP
1. Enable 2-Step Verification on your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer" (or your device)
4. Copy the generated 16-character password
5. Use it as `SMTP_PASS` in `.env`

### Running Locally

```bash
npm run dev
```

The app will start at `http://localhost:5173` with API routes available at `/api/*`.

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Project Structure

```
src/
├── app/                          # Next.js-style routes
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # Authentication (register, login, logout, forgot-password)
│   │   ├── admin/                # Admin panel APIs (users, bookings, pgs, complaints, reports, stats)
│   │   ├── pgs/                  # PG listings and management
│   │   ├── bookings/             # Booking operations
│   │   ├── payments/             # Payment processing
│   │   ├── messages/             # Chat and messaging
│   │   ├── notifications/        # Notification management
│   │   ├── reviews/              # User reviews
│   │   ├── profile/              # User profile management
│   │   ├── cities/               # City data
│   │   ├── upload/               # Image upload
│   │   ├── seed/                 # Database seeding
│   │   └── saved-pgs/            # Saved accommodations
│   ├── admin/                    # Admin dashboard pages
│   │   ├── dashboard/
│   │   ├── pgs/
│   │   ├── bookings/
│   │   ├── complaints/
│   │   ├── reports/
│   │   ├── stats/
│   │   └── users/
│   ├── chat/                     # Direct messaging pages
│   ├── dashboard/                # User dashboard
│   ├── login/                    # Login page
│   ├── register/                 # Registration with OTP
│   ├── pgs/                      # PG listing and details
│   ├── profile/                  # User profile
│   ├── payment/                  # Payment pages
│   ├── owner/                    # Owner dashboard
│   ├── notifications/            # Notifications page
│   └── page.jsx                  # Home page
├── components/                   # Reusable React components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── AuthProvider.jsx
│   ├── BookingModal.jsx
│   ├── PGCard.jsx
│   ├── SearchBar.jsx
│   └── FilterSidebar.jsx
├── lib/                          # Utility functions and database
│   ├── db.js                     # MongoDB connection and collections
│   ├── auth.js                   # JWT and authentication utilities
│   ├── email.js                  # Email sending with Nodemailer
│   ├── cities.js                 # City data
│   ├── seed.js                   # Database seeding
│   └── migrate-images.mjs        # Image migration utility
├── pages/                        # Additional page components
│   ├── ProfilePage.jsx
│   └── SupportPages.jsx
├── shims/                        # Next.js compatibility shims for Vite
│   ├── next-link.js
│   ├── next-navigation.js
│   └── next-server.js
├── App.jsx                       # Main React component with routing
└── main.jsx                      # Application entry point
```

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user

### PGs (Accommodations)
- `GET /api/pgs` - List all PGs with filters and pagination
- `GET /api/pgs/[id]` - Get PG details
- `POST /api/pgs` - Create new PG listing
- `PATCH /api/pgs/[id]` - Update PG listing
- `DELETE /api/pgs/[id]` - Delete PG listing
- `GET /api/pgs/owner` - Get PGs owned by current user
- `GET /api/cities` - Get list of available cities

### Bookings
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/[id]` - Update booking status
- `DELETE /api/bookings/[id]` - Cancel booking

### Payments
- `GET /api/payments` - Get user's payment history
- `POST /api/payments` - Process payment
- `GET /api/payments/[id]` - Get payment details

### Messages & Chat
- `GET /api/messages` - Get conversation threads
- `POST /api/messages` - Send a message
- `GET /api/notifications` - Get user notifications

### Reviews
- `GET /api/reviews` - Get reviews for a PG
- `POST /api/reviews` - Create review for a PG

### User Profile
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update user profile
- `POST /api/profile/password` - Change password

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/bookings` - List all bookings
- `GET /api/admin/pgs` - List all PGs
- `GET /api/admin/complaints` - List complaints
- `GET /api/admin/reports` - Get analytics reports
- `GET /api/admin/stats` - Get dashboard statistics

### Saved PGs
- `GET /api/saved-pgs` - Get user's saved accommodations
- `POST /api/saved-pgs` - Save a PG
- `DELETE /api/saved-pgs/[id]` - Remove saved PG

### Complaints
- `GET /api/complaints` - Get user's complaints
- `POST /api/complaints` - File a new complaint
- `PATCH /api/complaints/[id]` - Update complaint

### Upload
- `POST /api/upload` - Upload images for PG listings

## Testing

### Desktop Testing
- Use Chrome DevTools responsive mode (`F12` → 📱 icon)
- Test at various breakpoints (mobile, tablet, desktop)

### Mobile Device Testing
- **Same WiFi**: Run `ipconfig getifaddr en0` to get local IP, then visit `http://<LOCAL_IP>:5173` on your phone
- **Chrome DevTools**: Start dev server and use device emulation
- **Real Device**: Connect iPhone to Mac for Safari inspector, or use Chrome Android debugging

## Key Features Implementation

### Email OTP Verification
- Users receive a 6-digit OTP when registering
- OTP is valid for 15 minutes
- Email is sent via SMTP (configurable for Gmail, SendGrid, etc.)
- Fallback to console logging if SMTP is not configured
- See `src/app/api/auth/register/otp/route.js` and `src/lib/email.js`

### Admin Direct Messaging
- Admins can send direct messages to PG owners from the admin PG management page
- Uses the same messaging infrastructure as user-to-owner chat
- Button available on each PG row in admin panel: `Chat Owner`
- See `src/app/admin/pgs/page.jsx` and `src/app/api/messages/route.js`

### Role-Based Access Control
- **Student**: Browse PGs, make bookings, send messages, leave reviews
- **Owner**: Manage properties, view bookings, chat with students
- **Admin**: Manage all users, properties, bookings, and complaints

## Database Schema

MongoDB collections include:
- `users` - User accounts and profiles
- `pgs` - Property listings
- `pg_rooms` - Room types and details
- `pg_images` - Property images
- `bookings` - Booking records
- `payments` - Payment history
- `reviews` - User reviews
- `messages` - Direct messages
- `notifications` - User notifications
- `complaints` - User complaints
- `saved_pgs` - Saved accommodations
- `email_otps` - OTP records for email verification (15-min TTL)

## Troubleshooting

### OTP Not Received
1. Check if SMTP is configured in `.env`
2. Check email spam/junk folder
3. Check server console for logged OTP if SMTP is not configured
4. Verify `EMAIL_FROM` is correct

### MongoDB Connection Issues
- Ensure MongoDB is running (`mongod`)
- Check `MONGODB_URI` in `.env`
- Verify connection string format

### Port Already in Use
- Vite default port: 5173
- Change with `npm run dev -- --port 3000`

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

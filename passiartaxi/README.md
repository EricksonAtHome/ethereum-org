# Passiar — Full Stack Ride Booking App

Passiar is built on the [QuickRide](https://github.com/asif-khan-2k19/QuickRide) MERN stack, integrated and rebranded for this project. It uses **PostgreSQL (Neon)** for data storage.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express, Socket.IO |
| Database | **PostgreSQL (Neon)** |
| Maps | Google Maps API (optional dev fallback) |
| Auth | JWT, bcrypt |

## Project Structure

```
passiartaxi/
├── Backend/     # Node.js + Express API + Socket.IO
├── Frontend/    # React + Vite web app
└── docker-compose.yml
```

## Quick Start

### 1. Configure Backend

```bash
cd Backend
cp .env.example .env
```

Set your Neon PostgreSQL connection string in `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
JWT_SECRET=your-secret-key
```

### 2. Backend

```bash
npm install
npm run dev
```

Backend runs at **http://localhost:3000** — tables are created automatically on first start.

### 3. Frontend

```bash
cd ../Frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### Docker Compose

```bash
export DATABASE_URL="your-neon-connection-string"
docker compose up --build
```

## Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (required) |
| `JWT_SECRET` | Secret for JWT tokens |
| `GOOGLE_MAPS_API` | Optional — dev fallbacks work without it |
| `MAIL_USER` / `MAIL_PASS` | Optional Gmail SMTP |

### Frontend `.env`

```env
VITE_SERVER_URL=http://localhost:3000
VITE_ENVIRONMENT=development
VITE_RIDE_TIMEOUT=90000
```

## Database Schema

Auto-created on startup:

- `users` — rider accounts
- `captains` — driver accounts with GPS location
- `rides` — bookings with status, fare, OTP, chat messages (JSONB)
- `blacklist_tokens` — logout token blacklist
- `backend_logs` / `frontend_logs` — optional logging

## Features

- User & Captain registration/login with JWT
- Pickup/destination with autocomplete
- Ride types: Car, Bike, Auto
- Real-time ride status via Socket.IO
- Live location tracking & in-app chat
- Fare estimation based on distance/time

## Credits

Based on [QuickRide by Mohammad Asif Khan](https://github.com/asif-khan-2k19/QuickRide) (MIT License).

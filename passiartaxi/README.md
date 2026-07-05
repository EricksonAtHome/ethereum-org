# Passiar — Full Stack Ride Booking App

Passiar is built on the [QuickRide](https://github.com/asif-khan-2k19/QuickRide) MERN stack, integrated and rebranded for this project. It includes user/captain authentication, ride booking, real-time GPS tracking, fare calculation, and in-app chat.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB |
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

### 1. Start MongoDB

```bash
mongod --dbpath /data/db
```

Or use Docker Compose (see below).

### 2. Backend

```bash
cd Backend
cp .env.example .env   # edit as needed
npm install
npm run dev
```

Backend runs at **http://localhost:3000**

### 3. Frontend

```bash
cd Frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### 4. Docker Compose (all services)

```bash
docker compose up --build
```

## Environment Variables

### Backend `.env`

```env
PORT=3000
SERVER_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173
ENVIRONMENT=development
MONGODB_DEV_URL=mongodb://127.0.0.1:27017/passiartaxi
JWT_SECRET=your-secret-key
GOOGLE_MAPS_API=          # optional — dev fallbacks work without it
MAIL_USER=                # optional — email skipped if empty
MAIL_PASS=
```

### Frontend `.env`

```env
VITE_SERVER_URL=http://localhost:3000
VITE_ENVIRONMENT=development
VITE_RIDE_TIMEOUT=90000
```

## Features

- User & Captain registration/login with JWT
- Pickup/destination with autocomplete
- Ride types: Car, Bike, Auto
- Real-time ride status via Socket.IO
- Live location tracking & in-app chat
- Fare estimation based on distance/time
- Ride history & profile management

## Fixes Applied

- Captain registration default location (required by schema)
- Login 404 early return bug (user & captain)
- MongoDB 2dsphere index auto-creation
- Dev map fallbacks when Google Maps API key is missing
- Email service gracefully skips when SMTP not configured
- Rebranded from QuickRide to **Passiar**

## Credits

Based on [QuickRide by Mohammad Asif Khan](https://github.com/asif-khan-2k19/QuickRide) (MIT License).

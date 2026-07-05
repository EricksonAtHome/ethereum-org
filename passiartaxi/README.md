# Passiar — Ride-Sharing Taxi App

Passiar is an Uber-style ride-sharing application built with a polyglot microservices architecture:

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Mobile** | Flutter | Destination selection, ride booking, trip tracking UI |
| **Rides API** | C# (.NET 8) | Ride booking, driver matching, state machine |
| **Tracking** | Go | Real-time GPS tracking via WebSocket |
| **Intelligence** | Python (Flask) | Location suggestions, dynamic pricing, ETA |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Flutter App    │────▶│  C# Rides API    │────▶│  Go Tracking        │
│  (Passiar)      │     │  :8080           │     │  :8081 (WebSocket)  │
└────────┬────────┘     └────────┬─────────┘     └─────────────────────┘
         │                     │
         │                     ▼
         │            ┌──────────────────┐
         └───────────▶│ Python Intel.    │
                      │ :8082            │
                      └──────────────────┘
```

## Ride State Machine

`Searching` → `Matched` → `EnRouteToPickup` → `InTrip` → `Completed`

## Quick Start

### Run all backend services with Docker

```bash
cd passiartaxi
docker compose up --build
```

### Run services individually

**Python Intelligence (port 8082):**
```bash
cd services/intelligence
pip install -r requirements.txt
python main.py
```

**Go Tracking (port 8081):**
```bash
cd services/tracking
go mod tidy
go run .
```

**C# Rides API (port 8080):**
```bash
cd services/rides
dotnet run
```

**Flutter Mobile App:**
```bash
cd mobile
flutter pub get
flutter run
```

## API Endpoints

### Rides Service (C#) — `:8080`
- `GET /api/health` — Health check
- `GET /api/rides/options` — Available ride types
- `POST /api/rides` — Book a ride
- `GET /api/rides/{id}` — Get ride status

### Tracking Service (Go) — `:8081`
- `GET /api/tracking/{rideId}` — Current trip location
- `GET /api/tracking/{rideId}/ws` — WebSocket live updates
- `POST /api/tracking/{rideId}/simulate` — Start tracking simulation

### Intelligence Service (Python) — `:8082`
- `GET /api/suggestions?q=` — Location suggestions
- `POST /api/pricing` — Dynamic fare calculation
- `POST /api/eta` — Estimated time of arrival

## Mobile Screens

1. **Destination** — Pickup/destination input with map and suggestions
2. **Ride Selection** — Economy, Royal, Taxi options + Cash/Credit payment
3. **Trip Tracking** — Live driver map, driver info, Message/Call actions

## Configuration

Flutter API URLs can be overridden at build time:

```bash
flutter run \
  --dart-define=RIDES_URL=http://10.0.2.2:8080 \
  --dart-define=TRACKING_URL=http://10.0.2.2:8081 \
  --dart-define=INTELLIGENCE_URL=http://10.0.2.2:8082
```

Use `10.0.2.2` for Android emulator to reach host localhost.

## License

MIT

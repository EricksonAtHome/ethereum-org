"""Passiar Intelligence Service — suggestions, pricing, and ETA."""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import List

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

SUGGESTIONS = [
    {
        "id": "sug-1",
        "name": "43 Hang Bai",
        "address": "43 Hang Bai, Hoan Kiem, Ha Noi, Viet Nam",
        "lat": 21.0267,
        "lng": 105.8521,
        "icon": "recent",
    },
    {
        "id": "sug-2",
        "name": "Noi Bai Airport",
        "address": "Phu Cuong, Soc Son, Ha Noi, Viet Nam",
        "lat": 21.2212,
        "lng": 105.8072,
        "icon": "airport",
    },
    {
        "id": "sug-3",
        "name": "West Lake",
        "address": "Tay Ho, Ha Noi, Viet Nam",
        "lat": 21.0558,
        "lng": 105.8342,
        "icon": "landmark",
    },
]

RIDE_MULTIPLIERS = {
    "economy": 1.0,
    "royal": 3.25,
    "taxi_4seat": 9.75,
}

PAYMENT_FEES = {
    "cash": 0.0,
    "credit_card": 45.0,
}


@dataclass
class Location:
    lat: float
    lng: float


def haversine_km(a: Location, b: Location) -> float:
    r = 6371.0
    dlat = math.radians(b.lat - a.lat)
    dlng = math.radians(b.lng - a.lng)
    lat1 = math.radians(a.lat)
    lat2 = math.radians(b.lat)
    h = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(h))


def base_fare(distance_km: float) -> float:
    return round(2.5 + distance_km * 1.2, 2)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "passiar-intelligence"})


@app.get("/api/suggestions")
def suggestions():
    query = request.args.get("q", "").lower()
    results = SUGGESTIONS
    if query:
        results = [
            s
            for s in SUGGESTIONS
            if query in s["name"].lower() or query in s["address"].lower()
        ]
    return jsonify({"suggestions": results})


@app.post("/api/pricing")
def pricing():
    data = request.get_json(force=True)
    pickup = Location(**data["pickup"])
    destination = Location(**data["destination"])
    ride_type = data.get("rideType", "economy")
    payment = data.get("paymentMethod", "cash")

    distance = haversine_km(pickup, destination)
    base = base_fare(distance)
    multiplier = RIDE_MULTIPLIERS.get(ride_type, 1.0)
    ride_price = round(base * multiplier, 2)
    payment_fee = PAYMENT_FEES.get(payment, 0.0)
    total = round(ride_price + payment_fee, 2)

    return jsonify(
        {
            "distanceKm": round(distance, 2),
            "baseFare": base,
            "rideType": ride_type,
            "ridePrice": ride_price,
            "paymentMethod": payment,
            "paymentFee": payment_fee,
            "total": total,
            "currency": "USD",
        }
    )


@app.post("/api/eta")
def eta():
    data = request.get_json(force=True)
    pickup = Location(**data["pickup"])
    destination = Location(**data["destination"])
    ride_type = data.get("rideType", "economy")

    distance = haversine_km(pickup, destination)
    speed_kmh = {"economy": 28, "royal": 32, "taxi_4seat": 25}.get(ride_type, 28)
    minutes = max(3, int((distance / speed_kmh) * 60))

    return jsonify(
        {
            "etaMinutes": minutes,
            "distanceKm": round(distance, 2),
            "route": {
                "pickup": asdict(pickup),
                "destination": asdict(destination),
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8082, debug=True)

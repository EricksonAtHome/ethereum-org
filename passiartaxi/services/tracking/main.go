package main

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type DriverInfo struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Vehicle      string   `json:"vehicle"`
	LicensePlate string   `json:"licensePlate"`
	Rating       float64  `json:"rating"`
	Location     Location `json:"location"`
	Heading      float64  `json:"heading"`
}

type TripTrack struct {
	RideID      string   `json:"rideId"`
	Status      string   `json:"status"`
	Driver      DriverInfo `json:"driver"`
	Pickup      Location `json:"pickup"`
	Destination Location `json:"destination"`
	Traveled    []Location `json:"traveled"`
	Remaining   []Location `json:"remaining"`
	ETA         int      `json:"etaMinutes"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var (
	trips   = make(map[string]*TripTrack)
	tripsMu sync.RWMutex
)

func main() {
	seedDemoTrip()

	r := mux.NewRouter()
	r.Use(corsMiddleware)

	r.HandleFunc("/health", healthHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/tracking/{rideId}", getTrackingHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/tracking/{rideId}/ws", wsTrackingHandler)
	r.HandleFunc("/api/tracking/{rideId}/simulate", simulateHandler).Methods("POST", "OPTIONS")

	log.Println("Passiar Tracking Service listening on :8081")
	log.Fatal(http.ListenAndServe(":8081", r))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "passiar-tracking"})
}

func getTrackingHandler(w http.ResponseWriter, r *http.Request) {
	rideID := mux.Vars(r)["rideId"]
	tripsMu.RLock()
	trip, ok := trips[rideID]
	tripsMu.RUnlock()

	if !ok {
		http.Error(w, "trip not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trip)
}

func wsTrackingHandler(w http.ResponseWriter, r *http.Request) {
	rideID := mux.Vars(r)["rideId"]
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		tripsMu.Lock()
		trip, ok := trips[rideID]
		if ok {
			advanceDriver(trip)
		}
		tripsMu.Unlock()

		tripsMu.RLock()
		trip, ok = trips[rideID]
		tripsMu.RUnlock()
		if !ok {
			break
		}

		if err := conn.WriteJSON(trip); err != nil {
			break
		}
	}
}

func simulateHandler(w http.ResponseWriter, r *http.Request) {
	rideID := mux.Vars(r)["rideId"]

	var req struct {
		Pickup      Location `json:"pickup"`
		Destination Location `json:"destination"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	trip := newTrip(rideID, req.Pickup, req.Destination)
	tripsMu.Lock()
	trips[rideID] = trip
	tripsMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trip)
}

func seedDemoTrip() {
	pickup := Location{Lat: 21.0285, Lng: 105.8542}
	dest := Location{Lat: 21.0245, Lng: 105.8412}
	trips["demo-ride-001"] = newTrip("demo-ride-001", pickup, dest)
}

func newTrip(rideID string, pickup, dest Location) *TripTrack {
	mid := Location{
		Lat: (pickup.Lat + dest.Lat) / 2,
		Lng: (pickup.Lng + dest.Lng) / 2,
	}

	return &TripTrack{
		RideID: rideID,
		Status: "EnRouteToPickup",
		Driver: DriverInfo{
			ID:           "driver-linh",
			Name:         "Linh Nguyen",
			Vehicle:      "Lamborghini • Aventador",
			LicensePlate: "DV-557HA",
			Rating:       5.0,
			Location:     mid,
			Heading:      45,
		},
		Pickup:      pickup,
		Destination: dest,
		Traveled:    []Location{pickup},
		Remaining:   []Location{mid, dest},
		ETA:         4,
	}
}

func advanceDriver(trip *TripTrack) {
	if len(trip.Remaining) == 0 {
		trip.Status = "Completed"
		trip.ETA = 0
		return
	}

	next := trip.Remaining[0]
	curr := trip.Driver.Location

	dlat := next.Lat - curr.Lat
	dlng := next.Lng - curr.Lng
	dist := math.Sqrt(dlat*dlat + dlng*dlng)

	if dist < 0.0003 {
		trip.Traveled = append(trip.Traveled, next)
		trip.Remaining = trip.Remaining[1:]
		trip.Driver.Location = next
		if len(trip.Remaining) == 0 {
			trip.Status = "Completed"
			trip.ETA = 0
		} else if trip.Status == "EnRouteToPickup" && len(trip.Traveled) > 1 {
			trip.Status = "InTrip"
		}
		return
	}

	step := 0.00015
	trip.Driver.Location = Location{
		Lat: curr.Lat + dlat/dist*step,
		Lng: curr.Lng + dlng/dist*step,
	}
	trip.Driver.Heading = math.Atan2(dlng, dlat) * 180 / math.Pi
	if trip.ETA > 0 {
		trip.ETA--
	}
}

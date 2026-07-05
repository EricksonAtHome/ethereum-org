namespace Passiar.Rides.Models;

public record Location(double Lat, double Lng);

public enum RideStatus
{
    Searching,
    Matched,
    EnRouteToPickup,
    InTrip,
    Completed,
    Cancelled
}

public record RideOption(
    string Id,
    string Name,
    string Description,
    decimal BasePrice,
    string VehicleType,
    int Capacity
);

public record CreateRideRequest(
    Location Pickup,
    Location Destination,
    string PickupAddress,
    string DestinationAddress,
    string RideType,
    string PaymentMethod
);

public record DriverInfo(
    string Id,
    string Name,
    string Vehicle,
    string LicensePlate,
    double Rating
);

public record Ride(
    string Id,
    RideStatus Status,
    Location Pickup,
    Location Destination,
    string PickupAddress,
    string DestinationAddress,
    string RideType,
    string PaymentMethod,
    decimal Price,
    DriverInfo? Driver,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record BookRideResponse(Ride Ride, string TrackingUrl);

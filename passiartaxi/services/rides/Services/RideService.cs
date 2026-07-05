using Passiar.Rides.Models;

namespace Passiar.Rides.Services;

public class RideService
{
    private readonly Dictionary<string, Ride> _rides = new();
    private readonly HttpClient _intelligenceClient;
    private readonly HttpClient _trackingClient;
    private readonly ILogger<RideService> _logger;

    private static readonly RideOption[] Options =
    [
        new("economy", "Economy service", "Affordable everyday rides", 4.00m, "sedan", 4),
        new("royal", "Royal service", "Premium comfort experience", 13.00m, "suv", 4),
        new("taxi_4seat", "Taxi 4-seat", "Standard taxi service", 39.00m, "taxi", 4),
    ];

    public RideService(IHttpClientFactory httpClientFactory, ILogger<RideService> logger)
    {
        _intelligenceClient = httpClientFactory.CreateClient("Intelligence");
        _trackingClient = httpClientFactory.CreateClient("Tracking");
        _logger = logger;
    }

    public IReadOnlyList<RideOption> GetRideOptions() => Options;

    public Ride? GetRide(string id) =>
        _rides.TryGetValue(id, out var ride) ? ride : null;

    public async Task<Ride> CreateRideAsync(CreateRideRequest request, CancellationToken ct = default)
    {
        var price = await CalculatePriceAsync(request, ct);
        var rideId = $"ride-{Guid.NewGuid():N}"[..12];

        var ride = new Ride(
            rideId,
            RideStatus.Searching,
            request.Pickup,
            request.Destination,
            request.PickupAddress,
            request.DestinationAddress,
            request.RideType,
            request.PaymentMethod,
            price,
            null,
            DateTime.UtcNow,
            null
        );

        _rides[rideId] = ride;

        _ = Task.Run(async () =>
        {
            await Task.Delay(1500, ct);
            await TransitionToMatchedAsync(rideId, ct);
        }, ct);

        return ride;
    }

    private async Task<decimal> CalculatePriceAsync(CreateRideRequest request, CancellationToken ct)
    {
        try
        {
            var payload = new
            {
                pickup = new { lat = request.Pickup.Lat, lng = request.Pickup.Lng },
                destination = new { lat = request.Destination.Lat, lng = request.Destination.Lng },
                rideType = request.RideType,
                paymentMethod = request.PaymentMethod,
            };

            var response = await _intelligenceClient.PostAsJsonAsync("/api/pricing", payload, ct);
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<PricingResponse>(ct);
                if (result != null)
                    return (decimal)result.Total;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Pricing service unavailable, using fallback");
        }

        var option = Options.FirstOrDefault(o => o.Id == request.RideType);
        var basePrice = option?.BasePrice ?? 4.00m;
        var paymentFee = request.PaymentMethod == "credit_card" ? 45.00m : 0m;
        return basePrice + paymentFee;
    }

    private async Task TransitionToMatchedAsync(string rideId, CancellationToken ct)
    {
        if (!_rides.TryGetValue(rideId, out var ride))
            return;

        var driver = new DriverInfo(
            "driver-linh",
            "Linh Nguyen",
            "Lamborghini • Aventador",
            "DV-557HA",
            5.0
        );

        var updated = ride with
        {
            Status = RideStatus.Matched,
            Driver = driver,
            UpdatedAt = DateTime.UtcNow,
        };
        _rides[rideId] = updated;

        await StartTrackingSimulationAsync(rideId, ct);

        await Task.Delay(2000, ct);
        if (_rides.TryGetValue(rideId, out ride))
        {
            _rides[rideId] = ride with
            {
                Status = RideStatus.EnRouteToPickup,
                UpdatedAt = DateTime.UtcNow,
            };
        }
    }

    private async Task StartTrackingSimulationAsync(string rideId, CancellationToken ct)
    {
        try
        {
            if (!_rides.TryGetValue(rideId, out var ride))
                return;

            var payload = new
            {
                pickup = new { lat = ride.Pickup.Lat, lng = ride.Pickup.Lng },
                destination = new { lat = ride.Destination.Lat, lng = ride.Destination.Lng },
            };

            await _trackingClient.PostAsJsonAsync(
                $"/api/tracking/{rideId}/simulate",
                payload,
                ct
            );
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Tracking service unavailable");
        }
    }

    private record PricingResponse(double Total);
}

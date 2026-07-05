using Microsoft.AspNetCore.Mvc;
using Passiar.Rides.Models;
using Passiar.Rides.Services;

namespace Passiar.Rides.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RidesController : ControllerBase
{
    private readonly RideService _rideService;

    public RidesController(RideService rideService)
    {
        _rideService = rideService;
    }

    [HttpGet("options")]
    public IActionResult GetOptions()
    {
        return Ok(new { options = _rideService.GetRideOptions() });
    }

    [HttpGet("{id}")]
    public IActionResult GetRide(string id)
    {
        var ride = _rideService.GetRide(id);
        if (ride == null)
            return NotFound(new { error = "Ride not found" });

        return Ok(ride);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRide([FromBody] CreateRideRequest request)
    {
        var ride = await _rideService.CreateRideAsync(request);
        return Created($"/api/rides/{ride.Id}", new BookRideResponse(
            ride,
            $"ws://localhost:8081/api/tracking/{ride.Id}/ws"
        ));
    }
}

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() =>
        Ok(new { status = "ok", service = "passiar-rides" });
}

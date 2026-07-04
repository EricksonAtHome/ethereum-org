using System.Text.Json;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();
app.UseCors();

var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=localhost;Port=5432;Database=erikbank;Username=erikbank;Password=erikbank";

app.MapGet("/api/health", () => Results.Ok(new
{
    service = "enterprise",
    language = "csharp",
    status = "ok"
}));

app.MapPost("/api/compliance/validate", async (ComplianceRequest request) =>
{
    var status = ValidateCompliance(request);
    await WriteAuditAsync(connectionString, request.PaymentRef, "compliance.validate", new
    {
        request.PayeeName,
        request.AmountCents,
        request.Currency,
        request.Method,
        status
    });

    return Results.Ok(new { status, paymentRef = request.PaymentRef });
});

app.MapGet("/api/audit/{paymentRef}", async (string paymentRef) =>
{
    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
        """
        SELECT service_name, event_type, payload, created_at
        FROM audit_events
        WHERE payment_ref = @ref
        ORDER BY created_at ASC
        """, conn);
    cmd.Parameters.AddWithValue("ref", paymentRef);

    var events = new List<object>();
    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        events.Add(new
        {
            serviceName = reader.GetString(0),
            eventType = reader.GetString(1),
            payload = reader.IsDBNull(2) ? null : reader.GetFieldValue<object>(2),
            createdAt = reader.GetDateTime(3)
        });
    }

    return Results.Ok(new { paymentRef, events });
});

app.Run();

static string ValidateCompliance(ComplianceRequest request)
{
    if (request.AmountCents > 10_000_000)
    {
        return "review";
    }

    if (string.IsNullOrWhiteSpace(request.PayeeName))
    {
        return "rejected";
    }

    return "approved";
}

static async Task WriteAuditAsync(string connectionString, string paymentRef, string eventType, object payload)
{
    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
        """
        INSERT INTO audit_events (payment_ref, service_name, event_type, payload)
        VALUES (@ref, 'enterprise', @eventType, @payload::jsonb)
        """, conn);
    cmd.Parameters.AddWithValue("ref", paymentRef);
    cmd.Parameters.AddWithValue("eventType", eventType);
    cmd.Parameters.AddWithValue("payload", JsonSerializer.Serialize(payload));
    await cmd.ExecuteNonQueryAsync();
}

record ComplianceRequest(
    string PaymentRef,
    string PayeeName,
    long AmountCents,
    string Currency,
    string Method
);

using Passiar.Rides.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddHttpClient("Intelligence", client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["Services:Intelligence"] ?? "http://localhost:8082"
    );
});

builder.Services.AddHttpClient("Tracking", client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["Services:Tracking"] ?? "http://localhost:8081"
    );
});

builder.Services.AddSingleton<RideService>();

var app = builder.Build();

app.UseCors();
app.MapControllers();

app.Run();

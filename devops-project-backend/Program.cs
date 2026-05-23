using BilliardsBooking.API.Data;
using BilliardsBooking.API.Middleware;
using BilliardsBooking.API.Models;
using BilliardsBooking.API.DTOs;
using BilliardsBooking.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(allowIntegerValues: false));
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.Configure<MailSettings>(
    builder.Configuration.GetSection("MailSettings"));

builder.Services.Configure<PayPalSettings>(
    builder.Configuration.GetSection("PayPal"));

// DI Services
builder.Services.AddScoped<BilliardsBooking.API.Services.IAuthService, BilliardsBooking.API.Services.AuthService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IBookingService, BilliardsBooking.API.Services.BookingService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IReservationService, BilliardsBooking.API.Services.ReservationService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.ITableSessionService, BilliardsBooking.API.Services.TableSessionService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IInvoiceService, BilliardsBooking.API.Services.InvoiceService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IAuditService, BilliardsBooking.API.Services.AuditService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.ITableService, BilliardsBooking.API.Services.TableService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.ICoachService, BilliardsBooking.API.Services.CoachService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IFnBService, BilliardsBooking.API.Services.FnBService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IMembershipService, BilliardsBooking.API.Services.MembershipService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IPaymentService, BilliardsBooking.API.Services.PaymentService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IEmailService, BilliardsBooking.API.Services.EmailService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.IEmailTemplateService, BilliardsBooking.API.Services.EmailTemplateService>();
builder.Services.AddScoped<BilliardsBooking.API.Services.INotificationEmailService, BilliardsBooking.API.Services.NotificationEmailService>();
builder.Services.AddHttpClient<IPayPalService, PayPalService>();

// Background Services
builder.Services.AddHostedService<BilliardsBooking.API.Services.NoShowWorker>();

// Configure CORS
var allowedOrigins = builder.Configuration.GetValue<string>("Cors:AllowedOrigins") ?? "http://localhost:5173,http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins(allowedOrigins.Split(','))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure Entity Framework Core with SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "default_secret_key_for_dev_only";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth", context =>
    {
        var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.AddPolicy("payment", context =>
    {
        var partitionKey = context.User?.Identity?.Name
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHttpsRedirection();
}

app.UseCors("ReactApp");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<RequestResponseLoggingMiddleware>();
app.MapControllers();
app.MapHub<BilliardsBooking.API.Hubs.TableStatusHub>("/hubs/tablestatus");

// Seed Database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await SeedData.InitializeAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred seeding the DB.");
    }
}

app.Run();

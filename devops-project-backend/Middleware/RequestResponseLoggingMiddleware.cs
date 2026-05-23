using System.Diagnostics;
using System.Security.Claims;

namespace BilliardsBooking.API.Middleware
{
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

        public RequestResponseLoggingMiddleware(
            RequestDelegate next,
            ILogger<RequestResponseLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                await _next(context);
                stopwatch.Stop();

                var statusCode = context.Response.StatusCode;
                var logLevel = statusCode >= StatusCodes.Status500InternalServerError
                    ? LogLevel.Error
                    : statusCode >= StatusCodes.Status400BadRequest
                        ? LogLevel.Warning
                        : LogLevel.Information;

                _logger.Log(
                    logLevel,
                    "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMilliseconds} ms. TraceId={TraceId} UserId={UserId} RemoteIp={RemoteIp}",
                    context.Request.Method,
                    context.Request.Path.Value,
                    statusCode,
                    stopwatch.ElapsedMilliseconds,
                    context.TraceIdentifier,
                    GetUserId(context),
                    context.Connection.RemoteIpAddress?.ToString());
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                _logger.LogError(
                    ex,
                    "HTTP {Method} {Path} failed after {ElapsedMilliseconds} ms. TraceId={TraceId} UserId={UserId} RemoteIp={RemoteIp}",
                    context.Request.Method,
                    context.Request.Path.Value,
                    stopwatch.ElapsedMilliseconds,
                    context.TraceIdentifier,
                    GetUserId(context),
                    context.Connection.RemoteIpAddress?.ToString());

                throw;
            }
        }

        private static string? GetUserId(HttpContext context)
        {
            return context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.User.FindFirstValue("sub");
        }
    }
}

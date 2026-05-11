using BilliardsBooking.API.DTOs;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace BilliardsBooking.API.Services
{
    public interface IPayPalService
    {
        Task<PayPalCreateOrderResult?> CreateOrderAsync(decimal amount, string currency = "USD");
        Task<PayPalCaptureOrderResult?> CaptureOrderAsync(string orderId);
    }

    public class PayPalService : IPayPalService
    {
        private readonly HttpClient _httpClient;
        private readonly PayPalSettings _settings;

        public PayPalService(HttpClient httpClient, IOptions<PayPalSettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public async Task<PayPalCreateOrderResult?> CreateOrderAsync(decimal amount, string currency = "USD")
        {
            var accessToken = await GetAccessTokenAsync();
            if (string.IsNullOrWhiteSpace(accessToken))
                return null;

            var requestBody = new
            {
                intent = "CAPTURE",
                purchase_units = new[]
                {
                    new
                    {
                        amount = new
                        {
                            currency_code = currency,
                            value = amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)
                        }
                    }
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, $"{_settings.BaseUrl}/v2/checkout/orders");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.Add("Prefer", "return=representation");
            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var id = doc.RootElement.GetProperty("id").GetString();
            string? approvalUrl = null;

            if (doc.RootElement.TryGetProperty("links", out var linksElement))
            {
                foreach (var link in linksElement.EnumerateArray())
                {
                    var rel = link.GetProperty("rel").GetString();
                    if (string.Equals(rel, "approve", StringComparison.OrdinalIgnoreCase))
                    {
                        approvalUrl = link.GetProperty("href").GetString();
                        break;
                    }
                }
            }

            return new PayPalCreateOrderResult
            {
                OrderId = id ?? string.Empty,
                ApprovalUrl = approvalUrl
            };
        }

        public async Task<PayPalCaptureOrderResult?> CaptureOrderAsync(string orderId)
        {
            var accessToken = await GetAccessTokenAsync();
            if (string.IsNullOrWhiteSpace(accessToken))
                return null;

            var request = new HttpRequestMessage(HttpMethod.Post, $"{_settings.BaseUrl}/v2/checkout/orders/{orderId}/capture");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent("{}", Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var status = doc.RootElement.TryGetProperty("status", out var statusElement)
                ? statusElement.GetString()
                : null;

            string? captureId = null;

            if (doc.RootElement.TryGetProperty("purchase_units", out var purchaseUnits) &&
                purchaseUnits.ValueKind == JsonValueKind.Array)
            {
                foreach (var pu in purchaseUnits.EnumerateArray())
                {
                    if (pu.TryGetProperty("payments", out var payments) &&
                        payments.TryGetProperty("captures", out var captures) &&
                        captures.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var capture in captures.EnumerateArray())
                        {
                            if (capture.TryGetProperty("id", out var idElement))
                            {
                                captureId = idElement.GetString();
                                break;
                            }
                        }
                    }
                }
            }

            return new PayPalCaptureOrderResult
            {
                OrderId = orderId,
                Status = status ?? string.Empty,
                CaptureId = captureId
            };
        }

        private async Task<string?> GetAccessTokenAsync()
        {
            var authToken = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{_settings.ClientId}:{_settings.ClientSecret}"));

            var request = new HttpRequestMessage(HttpMethod.Post, $"{_settings.BaseUrl}/v1/oauth2/token");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authToken);
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials"
            });

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            return doc.RootElement.GetProperty("access_token").GetString();
        }
    }
    public class PayPalCreateOrderResult
    {
        public string OrderId { get; set; } = string.Empty;
        public string? ApprovalUrl { get; set; }
    }

    public class PayPalCaptureOrderResult
    {
        public string OrderId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? CaptureId { get; set; }
    }
}

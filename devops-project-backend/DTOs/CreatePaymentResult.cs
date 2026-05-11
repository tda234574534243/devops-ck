namespace BilliardsBooking.API.DTOs
{
    public class CreatePaymentResult
    {
        public PaymentResponse Payment { get; set; } = default!;
        public string? ApprovalUrl { get; set; }
        public string? PayPalOrderId { get; set; }
        public bool RequiresRedirect => !string.IsNullOrEmpty(ApprovalUrl);
    }

    public class CapturePayPalPaymentRequest
    {
        public string PayPalOrderId { get; set; } = string.Empty;
    }

    public class PayPalSettings
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
    }
}

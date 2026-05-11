using System.Threading.Tasks;
using BilliardsBooking.API.Enums;
using System.Security.Claims;
using BilliardsBooking.API.DTOs;
using BilliardsBooking.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BilliardsBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IAuditService _auditService;

        private string? GetIpAddress() => HttpContext?.Connection?.RemoteIpAddress?.ToString();

        public PaymentsController(IPaymentService paymentService, IAuditService auditService)
        {
            _paymentService = paymentService;
            _auditService = auditService;
        }

        [HttpPost("create")]
        [EnableRateLimiting("payment")]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
        {
            var actorId = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _paymentService.CreatePaymentAsync(request);
            if (result == null)
            {
                await _auditService.LogAsync(
                    AuditAction.PaymentFailed,
                    "Payment",
                    request.BookingId,
                    actorUserId: actorId,
                    newValue: new { request.BookingId, request.PaymentMethod },
                    notes: $"CreatePaymentFailed;IP={GetIpAddress()}");

                return BadRequest(new { Message = "Could not create payment. Booking might be invalid or already paid." });
            }

            // Audit: payment created/recorded
            await _auditService.LogAsync(
                AuditAction.PaymentRecorded,
                "Payment",
                result.Payment.Id,
                actorUserId: actorId,
                newValue: result.Payment,
                notes: $"Method={request.PaymentMethod};IP={GetIpAddress()}");

            return Ok(result);
        }

        [HttpPost("paypal/capture")]
        [EnableRateLimiting("payment")]
        public async Task<IActionResult> CapturePayPalPayment([FromBody] CapturePayPalPaymentRequest request)
        {
            var actor = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _paymentService.CapturePayPalPaymentAsync(request);
            if (result == null)
            {
                await _auditService.LogAsync(
                    AuditAction.PaymentFailed,
                    "Payment",
                    request.PayPalOrderId,
                    actorUserId: actor,
                    newValue: new { request.PayPalOrderId },
                    notes: $"PayPalCaptureFailed;IP={GetIpAddress()}");

                return BadRequest(new { Message = "Could not capture PayPal payment." });
            }

            // Audit: PayPal payment captured
            await _auditService.LogAsync(
                AuditAction.PaymentCaptured,
                "Payment",
                result.Id,
                actorUserId: actor,
                newValue: result,
                notes: $"PayPal capture;IP={GetIpAddress()}");

            return Ok(result);
        }
    }
}

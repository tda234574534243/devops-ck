using BilliardsBooking.API.Data;
using BilliardsBooking.API.DTOs;
using BilliardsBooking.API.Enums;
using BilliardsBooking.API.Services.StateMachines;
using Microsoft.EntityFrameworkCore;

namespace BilliardsBooking.API.Services
{
    public interface IPaymentService
    {
        Task<CreatePaymentResult?> CreatePaymentAsync(CreatePaymentRequest request);
        Task<PaymentResponse?> CapturePayPalPaymentAsync(CapturePayPalPaymentRequest request);
    }

    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _context;
        private readonly IPayPalService _payPalService;

        public PaymentService(AppDbContext context, IPayPalService payPalService)
        {
            _context = context;
            _payPalService = payPalService;
        }

        public async Task<CreatePaymentResult?> CreatePaymentAsync(CreatePaymentRequest request)
        {
            if (!Guid.TryParse(request.BookingId, out var legacyId))
                return null;

            if (!Enum.TryParse<PaymentMethod>(request.PaymentMethod, true, out var method))
                method = PaymentMethod.Cash;

            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(r => r.Id == legacyId);

            if (reservation != null)
            {
                var existingDeposit = await _context.Payments
                    .Where(p => p.ReservationId == legacyId && p.Type == PaymentType.Deposit)
                    .OrderByDescending(p => p.CompletedAt ?? p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (existingDeposit != null)
                {
                    return new CreatePaymentResult
                    {
                        Payment = Map(existingDeposit),
                        ApprovalUrl = existingDeposit.Status == PaymentStatus.Pending ? existingDeposit.Notes : null,
                        PayPalOrderId = existingDeposit.ExternalOrderId
                    };
                }

                if (method == PaymentMethod.PayPal)
                {
                    var paypalOrder = await _payPalService.CreateOrderAsync(reservation.DepositAmount, "USD");
                    if (paypalOrder == null)
                        return null;

                    var pendingPayment = new Models.Payment
                    {
                        Id = Guid.NewGuid(),
                        UserId = reservation.UserId,
                        ReservationId = reservation.Id,
                        Type = PaymentType.Deposit,
                        Method = PaymentMethod.PayPal,
                        Status = PaymentStatus.Pending,
                        Amount = reservation.DepositAmount,
                        CreatedAt = DateTime.UtcNow,
                        ExternalOrderId = paypalOrder.OrderId,
                        Notes = paypalOrder.ApprovalUrl
                    };

                    _context.Payments.Add(pendingPayment);
                    await _context.SaveChangesAsync();

                    return new CreatePaymentResult
                    {
                        Payment = Map(pendingPayment),
                        ApprovalUrl = paypalOrder.ApprovalUrl,
                        PayPalOrderId = paypalOrder.OrderId
                    };
                }

                var payment = new Models.Payment
                {
                    Id = Guid.NewGuid(),
                    UserId = reservation.UserId,
                    ReservationId = reservation.Id,
                    Type = PaymentType.Deposit,
                    Method = method,
                    Status = PaymentStatus.Completed,
                    Amount = reservation.DepositAmount,
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow,
                    Notes = "Reservation deposit"
                };

                _context.Payments.Add(payment);

                if (reservation.Status == ReservationStatus.Pending)
                {
                    ReservationStateMachine.Transition(reservation, ReservationStatus.Confirmed);
                }

                await _context.SaveChangesAsync();

                return new CreatePaymentResult
                {
                    Payment = Map(payment)
                };
            }

            var session = await _context.TableSessions
                .Include(s => s.Invoice)
                    .ThenInclude(i => i!.Payments)
                .FirstOrDefaultAsync(s => s.Id == legacyId || s.ReservationId == legacyId);

            if (session?.Invoice == null)
                return null;

            var latestPayment = session.Invoice.Payments
                .OrderByDescending(p => p.CompletedAt ?? p.CreatedAt)
                .FirstOrDefault();

            if (latestPayment != null)
            {
                return new CreatePaymentResult
                {
                    Payment = Map(latestPayment),
                    ApprovalUrl = latestPayment.Status == PaymentStatus.Pending ? latestPayment.Notes : null,
                    PayPalOrderId = latestPayment.ExternalOrderId
                };
            }

            var amount = session.Type == SessionType.WalkIn
                ? session.Invoice.GrandTotal
                : session.Invoice.BalanceDue;

            var paymentType = session.Type == SessionType.WalkIn
                ? PaymentType.FullPayment
                : PaymentType.FinalSettlement;

            if (method == PaymentMethod.PayPal)
            {
                var paypalOrder = await _payPalService.CreateOrderAsync(amount, "USD");
                if (paypalOrder == null)
                    return null;

                var pendingSettlement = new Models.Payment
                {
                    Id = Guid.NewGuid(),
                    UserId = session.UserId,
                    InvoiceId = session.Invoice.Id,
                    Type = paymentType,
                    Method = PaymentMethod.PayPal,
                    Status = PaymentStatus.Pending,
                    Amount = amount,
                    CreatedAt = DateTime.UtcNow,
                    ExternalOrderId = paypalOrder.OrderId,
                    Notes = paypalOrder.ApprovalUrl
                };

                _context.Payments.Add(pendingSettlement);
                await _context.SaveChangesAsync();

                return new CreatePaymentResult
                {
                    Payment = Map(pendingSettlement),
                    ApprovalUrl = paypalOrder.ApprovalUrl,
                    PayPalOrderId = paypalOrder.OrderId
                };
            }

            var settlement = new Models.Payment
            {
                Id = Guid.NewGuid(),
                UserId = session.UserId,
                InvoiceId = session.Invoice.Id,
                Type = paymentType,
                Method = method,
                Status = PaymentStatus.Completed,
                Amount = amount,
                CreatedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                Notes = "Settlement payment"
            };

            _context.Payments.Add(settlement);
            session.Invoice.PaymentCompletedAt = settlement.CompletedAt;

            await _context.SaveChangesAsync();

            return new CreatePaymentResult
            {
                Payment = Map(settlement)
            };
        }

        public async Task<PaymentResponse?> CapturePayPalPaymentAsync(CapturePayPalPaymentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PayPalOrderId))
                return null;

            var payment = await _context.Payments
                .Include(p => p.Reservation)
                .Include(p => p.Invoice)
                .FirstOrDefaultAsync(p =>
                    p.ExternalOrderId == request.PayPalOrderId &&
                    p.Method == PaymentMethod.PayPal);

            if (payment == null)
                return null;

            if (payment.Status == PaymentStatus.Completed)
                return Map(payment);

            var captureResult = await _payPalService.CaptureOrderAsync(request.PayPalOrderId);
            if (captureResult == null)
                return null;

            if (!string.Equals(captureResult.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return null;

            payment.Status = PaymentStatus.Completed;
            payment.CompletedAt = DateTime.UtcNow;
            payment.TransactionId = captureResult.CaptureId;
            payment.Notes = "PayPal payment captured";

            if (payment.ReservationId.HasValue)
            {
                var reservation = await _context.Reservations
                    .FirstOrDefaultAsync(r => r.Id == payment.ReservationId.Value);

                if (reservation != null && reservation.Status == ReservationStatus.Pending)
                {
                    ReservationStateMachine.Transition(reservation, ReservationStatus.Confirmed);
                }
            }

            if (payment.InvoiceId.HasValue)
            {
                var invoice = await _context.Invoices
                    .FirstOrDefaultAsync(i => i.Id == payment.InvoiceId.Value);

                if (invoice != null)
                {
                    invoice.PaymentCompletedAt = payment.CompletedAt;
                }
            }

            await _context.SaveChangesAsync();
            return Map(payment);
        }

        private PaymentResponse Map(Models.Payment payment)
        {
            return new PaymentResponse
            {
                Id = payment.Id.ToString(),
                BookingId = payment.ReservationId?.ToString() ?? payment.InvoiceId?.ToString() ?? string.Empty,
                ReservationId = payment.ReservationId?.ToString() ?? string.Empty,
                InvoiceId = payment.InvoiceId?.ToString() ?? string.Empty,
                Type = payment.Type.ToString(),
                Amount = payment.Amount,
                Method = payment.Method.ToString(),
                Status = payment.Status.ToString(),
                TransactionId = payment.TransactionId,
                Notes = payment.Notes,
                CreatedAt = payment.CreatedAt,
                CompletedAt = payment.CompletedAt
            };
        }
    }
}

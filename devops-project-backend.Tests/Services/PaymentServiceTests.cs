using BilliardsBooking.API.Models;
using BilliardsBooking.API.Services;
using BilliardsBooking.API.Enums;
using BilliardsBooking.API.DTOs;
using BilliardsBooking.API.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace BilliardsBooking.API.Tests.Services;

public sealed class PaymentServiceTests
{
    private sealed class FakePayPalService : IPayPalService
    {
        public Task<PayPalCreateOrderResult?> CreateOrderAsync(decimal amount, string currency = "USD")
        {
            return Task.FromResult<PayPalCreateOrderResult?>(new PayPalCreateOrderResult { OrderId = "ORDER123", ApprovalUrl = "https://approve" });
        }

        public Task<PayPalCaptureOrderResult?> CaptureOrderAsync(string orderId)
        {
            return Task.FromResult<PayPalCaptureOrderResult?>(new PayPalCaptureOrderResult { Status = "COMPLETED", CaptureId = "CAP-123", OrderId = orderId });
        }
    }

    [Fact]
    public async Task CreatePaymentAsync_ReturnsExistingDeposit_WhenDepositExists()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            DepositAmount = 20m,
            Status = ReservationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var existing = new Payment
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            Type = PaymentType.Deposit,
            Method = PaymentMethod.PayPal,
            Status = PaymentStatus.Pending,
            Amount = reservation.DepositAmount,
            Notes = "https://approve",
            ExternalOrderId = "ORDER123",
            CreatedAt = DateTime.UtcNow
        };

        context.Reservations.Add(reservation);
        context.Payments.Add(existing);
        await context.SaveChangesAsync();

        var service = new PaymentService(context, new FakePayPalService());

        var req = new CreatePaymentRequest { BookingId = reservation.Id.ToString(), PaymentMethod = "PayPal" };
        var result = await service.CreatePaymentAsync(req);

        Assert.NotNull(result);
        Assert.Equal(existing.Id.ToString(), result!.Payment.Id);
        Assert.Equal(existing.Notes, result.ApprovalUrl);
        Assert.Equal(existing.ExternalOrderId, result.PayPalOrderId);
    }

    [Fact]
    public async Task CapturePayPalPaymentAsync_CompletesPendingPayPalPayment()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            ReservationId = Guid.NewGuid(),
            Method = PaymentMethod.PayPal,
            Type = PaymentType.Deposit,
            Status = PaymentStatus.Pending,
            ExternalOrderId = "ORDER123",
            CreatedAt = DateTime.UtcNow
        };

        context.Payments.Add(payment);
        await context.SaveChangesAsync();

        var service = new PaymentService(context, new FakePayPalService());

        var res = await service.CapturePayPalPaymentAsync(new CapturePayPalPaymentRequest { PayPalOrderId = "ORDER123" });

        Assert.NotNull(res);
        Assert.Equal(PaymentStatus.Completed.ToString(), res!.Status);
        Assert.Equal("CAP-123", res.TransactionId);
    }
}

using BilliardsBooking.API.Models;
using BilliardsBooking.API.Services;
using BilliardsBooking.API.Enums;
using BilliardsBooking.API.Tests.Support;

namespace BilliardsBooking.API.Tests.Services;

public sealed class InvoiceServiceTests
{
    [Fact]
    public async Task BuildInvoiceAsync_AppliesDeposit_RecordsAuditAndCreatesPayment()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var table = new BilliardTable { Id = 10, TableNumber = "A1", HourlyRate = 20m };
        context.Tables.Add(table);

        var userId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DepositAmount = 15m,
            Status = ReservationStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };

        var deposit = new Payment
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            Type = PaymentType.Deposit,
            Method = PaymentMethod.Cash,
            Status = PaymentStatus.Completed,
            Amount = reservation.DepositAmount,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };

        reservation.Payments.Add(deposit);
        context.Reservations.Add(reservation);

        var session = new TableSession
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            Reservation = reservation,
            TableId = table.Id,
            Table = table,
            UserId = userId,
            StartedAt = DateTime.UtcNow.AddHours(-2),
            EndedAt = DateTime.UtcNow,
            Type = SessionType.Online,
            CreatedAt = DateTime.UtcNow
        };

        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var audit = new FakeAuditService();
        var service = new InvoiceService(context, audit);

        var invoice = await service.BuildInvoiceAsync(session.Id, PaymentMethod.Cash, actorUserId: "tester");

        Assert.NotNull(invoice);
        Assert.Equal(session.Id, invoice!.TableSessionId);
        Assert.True(invoice.Payments.Any());
        Assert.Equal(deposit.Amount, invoice.DepositApplied);
        Assert.Single(audit.Calls);
        Assert.Equal(AuditAction.PaymentRecorded, audit.Calls[0].Action);
    }
}

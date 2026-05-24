using BilliardsBooking.API.Models;
using BilliardsBooking.API.Services;
using BilliardsBooking.API.Enums;
using BilliardsBooking.API.DTOs;
using BilliardsBooking.API.Tests.Support;

namespace BilliardsBooking.API.Tests.Services;

public sealed class BookingServiceTests
{
    private sealed class FakeReservationService : IReservationService
    {
        public Task<(bool Success, string Message, Guid? ReservationId)> CreateReservationAsync(Guid userId, CreateBookingRequest request, PaymentMethod? Method, string? actorUserId = null) =>
            Task.FromResult<(bool, string, Guid?)>((true, "ok", (Guid?)Guid.NewGuid()));

        public Task<ReservationListResponse> GetReservationsForUserAsync(Guid userId, int page, int pageSize, string? status = null) =>
            Task.FromResult(new ReservationListResponse());

        public Task<ReservationResponse?> GetReservationResponseAsync(Guid reservationId, Guid? userId = null) => Task.FromResult<ReservationResponse?>(null);
        public Task<Reservation?> GetReservationAsync(Guid reservationId) => Task.FromResult<Reservation?>(null);
        public Task<(bool Success, string Message)> CancelReservationAsync(Guid reservationId, Guid userId, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<(bool Success, string Message)> RescheduleReservationAsync(Guid reservationId, Guid userId, RescheduleRequest request, string? actorUserId = null) => Task.FromResult((false, string.Empty));
        public Task<CategoryAvailabilityResponse> GetCategoryAvailabilityAsync(TableType tableType, DateTime date) => Task.FromResult(new CategoryAvailabilityResponse());
        public Task<List<PendingCheckinResponse>> GetPendingCheckinsAsync(DateTime date) => Task.FromResult(new List<PendingCheckinResponse>());
        public Task<int> GetWalkInBufferAsync(TableType tableType, DateTime dateTime) => Task.FromResult(0);
        public Task<(bool Success, string Message)> MarkNoShowAsync(Guid reservationId, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<(bool Success, string Message)> CreateRefundAsync(Guid reservationId, decimal amount, string reason, string? actorUserId = null) => Task.FromResult((true, string.Empty));
    }

    private sealed class FakeTableSessionService : ITableSessionService
    {
        private readonly TableSession? _sessionToReturn;

        public FakeTableSessionService(TableSession? sessionToReturn = null)
        {
            _sessionToReturn = sessionToReturn;
        }

        public Task<TableSession?> GetSessionAsync(Guid sessionId) => Task.FromResult<TableSession?>(_sessionToReturn);
        public Task<TableSession?> ResolveLegacySessionAsync(Guid legacyId) => Task.FromResult(_sessionToReturn);
        public Task<(bool Success, string Message)> CheckInAsync(Guid reservationId, int tableId, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<(bool Success, string Message, Guid? SessionId)> StartWalkInAsync(int tableId, string guestName, string? actorUserId = null) => Task.FromResult<(bool, string, Guid?)>((true, string.Empty, (Guid?)Guid.NewGuid()));
        public Task<(bool Success, string Message, CheckoutSummary? Summary)> CheckoutAsync(Guid sessionId, string paymentMethod, string? actorUserId = null) => Task.FromResult((true, string.Empty, (CheckoutSummary?)null));
        public Task<(bool Success, string Message)> LinkCoachEarlyAsync(Guid sessionId, Guid coachingSessionId, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<RunningTotalResponse?> GetRunningTotalAsync(Guid sessionId) => Task.FromResult<RunningTotalResponse?>(null);
        public Task<(bool Success, string Message)> AddFnBOrderAsync(Guid sessionId, List<FnBOrderRequest> items, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<List<LinkableCoachSessionResponse>> GetLinkableCoachSessionsAsync(Guid sessionId) => Task.FromResult(new List<LinkableCoachSessionResponse>());
        public Task<List<UpcomingWarningResponse>> GetUpcomingWarningsAsync() => Task.FromResult(new List<UpcomingWarningResponse>());
        public Task<(bool Success, string Message)> TransferTableAsync(Guid sessionId, int newTableId, string reason, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<(bool Success, string Message)> ExtendSessionAsync(Guid sessionId, int additionalMinutes, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<CheckoutSummary?> GetInterimBillAsync(Guid sessionId) => Task.FromResult<CheckoutSummary?>(null);
        public Task<(bool Success, string Message)> SetTableMaintenanceAsync(int tableId, string? actorUserId = null) => Task.FromResult((true, string.Empty));
    }

    [Fact]
    public async Task GetBookingByIdAsync_ReturnsReservationBooking_WhenReservationExists()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var table = new BilliardTable { Id = 1, TableNumber = "T1", HourlyRate = 10m };
        context.Tables.Add(table);

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            BookingDate = DateTime.UtcNow.Date,
            StartTime = TimeSpan.FromHours(10),
            EndTime = TimeSpan.FromHours(11),
            Status = ReservationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var session = new TableSession
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            TableId = table.Id,
            Table = table,
            StartedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        reservation.TableSession = session;
        context.Reservations.Add(reservation);
        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var result = await service.GetBookingByIdAsync(reservation.Id);

        Assert.NotNull(result);
        Assert.Equal(reservation.Id.ToString(), result!.Id);
        Assert.Equal(BookingType.Online.ToString(), result.BookingType);
    }

    [Fact]
    public async Task GetBookingByIdAsync_ReturnsWalkInBooking_WhenNoReservationButSessionExists()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var table = new BilliardTable { Id = 2, TableNumber = "T2", HourlyRate = 12m };
        context.Tables.Add(table);

        var session = new TableSession
        {
            Id = Guid.NewGuid(),
            UserId = null,
            TableId = table.Id,
            Table = table,
            Type = SessionType.WalkIn,
            StartedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var fakeTableService = new FakeTableSessionService(session);
        var service = new BookingService(context, new FakeReservationService(), fakeTableService);

        var result = await service.GetBookingByIdAsync(session.Id);

        Assert.NotNull(result);
        Assert.Equal(session.Id.ToString(), result!.Id);
        Assert.Equal(BookingType.WalkIn.ToString(), result.BookingType);
    }
}

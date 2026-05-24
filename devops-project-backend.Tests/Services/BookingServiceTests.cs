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
        private readonly List<LinkableCoachSessionResponse>? _linkableCoachSessions;

        public FakeTableSessionService(TableSession? sessionToReturn = null, List<LinkableCoachSessionResponse>? linkableCoachSessions = null)
        {
            _sessionToReturn = sessionToReturn;
            _linkableCoachSessions = linkableCoachSessions;
        }

        public Task<TableSession?> GetSessionAsync(Guid sessionId) => Task.FromResult<TableSession?>(_sessionToReturn);
        public Task<TableSession?> ResolveLegacySessionAsync(Guid legacyId) => Task.FromResult(_sessionToReturn);
        public Task<(bool Success, string Message)> CheckInAsync(Guid reservationId, int tableId, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<(bool Success, string Message, Guid? SessionId)> StartWalkInAsync(int tableId, string guestName, string? actorUserId = null) => Task.FromResult<(bool, string, Guid?)>((true, string.Empty, (Guid?)Guid.NewGuid()));
        public Task<(bool Success, string Message, CheckoutSummary? Summary)> CheckoutAsync(Guid sessionId, string paymentMethod, string? actorUserId = null) => Task.FromResult((true, string.Empty, (CheckoutSummary?)null));
        public Task<(bool Success, string Message)> LinkCoachEarlyAsync(Guid sessionId, Guid coachingSessionId, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<RunningTotalResponse?> GetRunningTotalAsync(Guid sessionId) => Task.FromResult<RunningTotalResponse?>(null);
        public Task<(bool Success, string Message)> AddFnBOrderAsync(Guid sessionId, List<FnBOrderRequest> items, string? actorUserId = null) => Task.FromResult((true, string.Empty));
        public Task<List<LinkableCoachSessionResponse>> GetLinkableCoachSessionsAsync(Guid sessionId) => Task.FromResult(_linkableCoachSessions ?? new List<LinkableCoachSessionResponse>());
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

    [Fact]
    public async Task GetBookingByIdAsync_ReturnsNull_WhenNoReservationOrSessionExists()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var result = await service.GetBookingByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetBookingByIdAsync_ReturnsInProgressStatus_WhenReservationCheckedIn()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            BookingDate = DateTime.UtcNow.Date,
            StartTime = TimeSpan.FromHours(10),
            EndTime = TimeSpan.FromHours(11),
            Status = ReservationStatus.CheckedIn,
            CreatedAt = DateTime.UtcNow
        };

        context.Reservations.Add(reservation);
        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var result = await service.GetBookingByIdAsync(reservation.Id);

        Assert.NotNull(result);
        Assert.Equal(BookingStatus.InProgress.ToString(), result!.Status);
    }

    [Fact]
    public async Task GetBookingByIdAsync_ReturnsGuestName_ForWalkInBooking()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var table = new BilliardTable { Id = 5, TableNumber = "G1", HourlyRate = 8m };
        context.Tables.Add(table);

        var session = new TableSession
        {
            Id = Guid.NewGuid(),
            GuestName = "WalkIn Guest",
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
        Assert.Equal("WalkIn Guest", result!.GuestName);
    }

    [Fact]
    public async Task GetBookingByIdAsync_ReturnsTableName_WhenAssigned()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var table = new BilliardTable { Id = 6, TableNumber = "TAB6", HourlyRate = 9m };
        context.Tables.Add(table);

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            BookingDate = DateTime.UtcNow.Date,
            StartTime = TimeSpan.FromHours(9),
            EndTime = TimeSpan.FromHours(10),
            Status = ReservationStatus.Confirmed,
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
        Assert.Equal("TAB6", result!.TableName);
    }

    [Fact]
    public async Task GetBookingByIdAsync_ReturnsPayment_WhenReservationHasPayment()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            BookingDate = DateTime.UtcNow.Date,
            StartTime = TimeSpan.FromHours(12),
            EndTime = TimeSpan.FromHours(13),
            Status = ReservationStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            Type = PaymentType.Deposit,
            Method = PaymentMethod.Cash,
            Status = PaymentStatus.Completed,
            Amount = 30m,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };

        reservation.Payments.Add(payment);
        context.Reservations.Add(reservation);
        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var result = await service.GetBookingByIdAsync(reservation.Id);

        Assert.NotNull(result);
        Assert.NotNull(result!.Payment);
        Assert.Equal(payment.Id.ToString(), result.Payment!.Id);
    }

    [Fact]
    public async Task GetBookingByIdAsync_ReturnsFnBOrders_WhenPresent()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var table = new BilliardTable { Id = 7, TableNumber = "F1", HourlyRate = 11m };
        context.Tables.Add(table);

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            BookingDate = DateTime.UtcNow.Date,
            StartTime = TimeSpan.FromHours(14),
            EndTime = TimeSpan.FromHours(15),
            Status = ReservationStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };

        var session = new TableSession
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            Reservation = reservation,
            TableId = table.Id,
            Table = table,
            StartedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        var order = new FnBOrder
        {
            Id = Guid.NewGuid(),
            TableSessionId = session.Id,
            TotalAmount = 45m
        };

        session.FnBOrders.Add(order);
        reservation.TableSession = session;
        context.Reservations.Add(reservation);
        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var result = await service.GetBookingByIdAsync(reservation.Id);

        Assert.NotNull(result);
        Assert.NotEmpty(result!.FnBOrders);
    }

    [Fact]
    public async Task GetBookingsForUserAsync_ReturnsCorrectCount()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var userId = Guid.NewGuid();
        for (int i = 0; i < 3; i++)
        {
            context.Reservations.Add(new Reservation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BookingDate = DateTime.UtcNow.Date.AddDays(-i),
                StartTime = TimeSpan.FromHours(10 + i),
                EndTime = TimeSpan.FromHours(11 + i),
                Status = ReservationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var list = await service.GetBookingsForUserAsync(userId, 1, 10);

        Assert.Equal(3, list.TotalItems);
        Assert.Equal(3, list.Items.Count);
    }

    [Fact]
    public async Task GetBookingsForUserAsync_FiltersByStatus_Pending()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var userId = Guid.NewGuid();
        context.Reservations.Add(new Reservation { Id = Guid.NewGuid(), UserId = userId, BookingDate = DateTime.UtcNow.Date, StartTime = TimeSpan.Zero, EndTime = TimeSpan.FromHours(1), Status = ReservationStatus.Pending, CreatedAt = DateTime.UtcNow });
        context.Reservations.Add(new Reservation { Id = Guid.NewGuid(), UserId = userId, BookingDate = DateTime.UtcNow.Date.AddDays(-1), StartTime = TimeSpan.Zero, EndTime = TimeSpan.FromHours(1), Status = ReservationStatus.Completed, CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var list = await service.GetBookingsForUserAsync(userId, 1, 10, "Pending");

        Assert.Single(list.Items);
        Assert.All(list.Items, i => Assert.Equal(BookingStatus.Pending.ToString(), i.Status));
    }

    [Fact]
    public async Task GetBookingsForUserAsync_FiltersByStatus_Completed()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var userId = Guid.NewGuid();
        context.Reservations.Add(new Reservation { Id = Guid.NewGuid(), UserId = userId, BookingDate = DateTime.UtcNow.Date, StartTime = TimeSpan.Zero, EndTime = TimeSpan.FromHours(1), Status = ReservationStatus.Completed, CreatedAt = DateTime.UtcNow });
        context.Reservations.Add(new Reservation { Id = Guid.NewGuid(), UserId = userId, BookingDate = DateTime.UtcNow.Date.AddDays(-1), StartTime = TimeSpan.Zero, EndTime = TimeSpan.FromHours(1), Status = ReservationStatus.Pending, CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var list = await service.GetBookingsForUserAsync(userId, 1, 10, "Completed");

        Assert.Single(list.Items);
        Assert.All(list.Items, i => Assert.Equal(BookingStatus.Completed.ToString(), i.Status));
    }

    [Fact]
    public async Task GetBookingsForUserAsync_Pagination_Works()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var userId = Guid.NewGuid();
        for (int i = 0; i < 5; i++)
        {
            context.Reservations.Add(new Reservation { Id = Guid.NewGuid(), UserId = userId, BookingDate = DateTime.UtcNow.Date.AddDays(i), StartTime = TimeSpan.FromHours(i), EndTime = TimeSpan.FromHours(i + 1), Status = ReservationStatus.Pending, CreatedAt = DateTime.UtcNow });
        }

        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var page2 = await service.GetBookingsForUserAsync(userId, 2, 2);

        Assert.Equal(5, page2.TotalItems);
        Assert.Equal(2, page2.Items.Count);
    }

    [Fact]
    public async Task GetBookingsForUserAsync_SortsByBookingDate_Descending()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var userId = Guid.NewGuid();
        context.Reservations.Add(new Reservation { Id = Guid.NewGuid(), UserId = userId, BookingDate = DateTime.UtcNow.Date.AddDays(-1), StartTime = TimeSpan.Zero, EndTime = TimeSpan.FromHours(1), Status = ReservationStatus.Pending, CreatedAt = DateTime.UtcNow });
        context.Reservations.Add(new Reservation { Id = Guid.NewGuid(), UserId = userId, BookingDate = DateTime.UtcNow.Date, StartTime = TimeSpan.Zero, EndTime = TimeSpan.FromHours(1), Status = ReservationStatus.Pending, CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var list = await service.GetBookingsForUserAsync(userId, 1, 10);

        Assert.True(list.Items[0].StartTime >= list.Items[1].StartTime);
    }

    [Fact]
    public async Task CheckOutAsync_ReturnsFail_WhenSessionNotFound()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var res = await service.CheckOutAsync(Guid.NewGuid(), "Cash");

        Assert.False(res.Success);
    }

    [Fact]
    public async Task CheckOutAsync_ReturnsSuccess_WhenCheckoutSucceeds()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var session = new TableSession { Id = Guid.NewGuid(), StartedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var fakeTableService = new FakeTableSessionService(session);
        var service = new BookingService(context, new FakeReservationService(), fakeTableService);

        var res = await service.CheckOutAsync(session.Id, "Cash");

        Assert.True(res.Success);
    }

    [Fact]
    public async Task LinkCoachSessionAsync_ReturnsFail_WhenSessionNull()
    {
        var context = TestDbContextFactory.CreateDbContext();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var res = await service.LinkCoachSessionAsync(Guid.NewGuid(), Guid.NewGuid());

        Assert.False(res.Success);
    }

    [Fact]
    public async Task LinkCoachSessionAsync_ReturnsSuccess_WhenSessionExists()
    {
        var context = TestDbContextFactory.CreateDbContext();
        var session = new TableSession { Id = Guid.NewGuid(), StartedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var fakeTableService = new FakeTableSessionService(session);
        var service = new BookingService(context, new FakeReservationService(), fakeTableService);

        var res = await service.LinkCoachSessionAsync(session.Id, Guid.NewGuid());

        Assert.True(res.Success);
    }

    [Fact]
    public async Task GetLinkableCoachSessionsAsync_ReturnsEmpty_WhenSessionNull()
    {
        var context = TestDbContextFactory.CreateDbContext();
        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());

        var list = await service.GetLinkableCoachSessionsAsync(Guid.NewGuid());

        Assert.Empty(list);
    }

    [Fact]
    public async Task GetLinkableCoachSessionsAsync_ReturnsList_WhenSessionExists()
    {
        var context = TestDbContextFactory.CreateDbContext();
        var session = new TableSession { Id = Guid.NewGuid(), StartedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var linkable = new List<LinkableCoachSessionResponse> { new LinkableCoachSessionResponse { Id = Guid.NewGuid(), CoachName = "Coach A", CoachId = Guid.NewGuid(), SessionDate = DateTime.UtcNow.Date, StartTime = "10:00", EndTime = "11:00", Cost = 10m } };
        var fakeTableService = new FakeTableSessionService(session, linkable);
        var service = new BookingService(context, new FakeReservationService(), fakeTableService);

        var list = await service.GetLinkableCoachSessionsAsync(session.Id);

        Assert.NotEmpty(list);
    }

    [Fact]
    public async Task StartWalkInAsync_ReturnsBookingId_AndSuccessTrue()
    {
        var context = TestDbContextFactory.CreateDbContext();
        var fakeTableService = new FakeTableSessionService();
        var service = new BookingService(context, new FakeReservationService(), fakeTableService);

        var res = await service.StartWalkInAsync(1, "Guest");

        Assert.True(res.Success);
        Assert.NotNull(res.BookingId);
    }

    [Fact]
    public async Task MapBookingLogic_BookingType_IsOnline_ForReservation()
    {
        var context = TestDbContextFactory.CreateDbContext();
        var reservation = new Reservation { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), BookingDate = DateTime.UtcNow.Date, StartTime = TimeSpan.Zero, EndTime = TimeSpan.FromHours(1), Status = ReservationStatus.Pending, CreatedAt = DateTime.UtcNow };
        context.Reservations.Add(reservation);
        await context.SaveChangesAsync();

        var service = new BookingService(context, new FakeReservationService(), new FakeTableSessionService());
        var res = await service.GetBookingByIdAsync(reservation.Id);

        Assert.NotNull(res);
        Assert.Equal(BookingType.Online.ToString(), res!.BookingType);
    }

    [Fact]
    public async Task MapBookingLogic_BookingType_IsWalkIn_ForSession()
    {
        var context = TestDbContextFactory.CreateDbContext();
        var session = new TableSession { Id = Guid.NewGuid(), Type = SessionType.WalkIn, StartedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var fakeTableService = new FakeTableSessionService(session);
        var service = new BookingService(context, new FakeReservationService(), fakeTableService);

        var res = await service.GetBookingByIdAsync(session.Id);

        Assert.NotNull(res);
        Assert.Equal(BookingType.WalkIn.ToString(), res!.BookingType);
    }
}

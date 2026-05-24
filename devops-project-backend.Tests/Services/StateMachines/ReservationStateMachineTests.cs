using BilliardsBooking.API.Enums;
using BilliardsBooking.API.Models;
using BilliardsBooking.API.Services.StateMachines;

namespace BilliardsBooking.API.Tests.Services.StateMachines;

public sealed class ReservationStateMachineTests
{
    [Theory]
    [InlineData(ReservationStatus.Pending, ReservationStatus.Confirmed, true)]
    [InlineData(ReservationStatus.Pending, ReservationStatus.Cancelled, true)]
    [InlineData(ReservationStatus.Confirmed, ReservationStatus.CheckedIn, true)]
    [InlineData(ReservationStatus.Confirmed, ReservationStatus.Cancelled, true)]
    [InlineData(ReservationStatus.Confirmed, ReservationStatus.NoShow, true)]
    [InlineData(ReservationStatus.CheckedIn, ReservationStatus.Completed, true)]
    [InlineData(ReservationStatus.Pending, ReservationStatus.Completed, false)]
    [InlineData(ReservationStatus.Cancelled, ReservationStatus.Confirmed, false)]
    [InlineData(ReservationStatus.Completed, ReservationStatus.Cancelled, false)]
    public void CanTransition_ShouldReturnExpectedResult(
        ReservationStatus from,
        ReservationStatus to,
        bool expected)
    {
        var result = ReservationStateMachine.CanTransition(from, to);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Transition_ToConfirmed_ShouldChangeStatusAndSetConfirmedAt()
    {
        var reservation = new Reservation { Status = ReservationStatus.Pending };

        ReservationStateMachine.Transition(reservation, ReservationStatus.Confirmed);

        Assert.Equal(ReservationStatus.Confirmed, reservation.Status);
        Assert.NotNull(reservation.ConfirmedAt);
        Assert.Null(reservation.CancelledAt);
    }

    [Fact]
    public void Transition_ToCancelled_ShouldChangeStatusAndSetCancelledAt()
    {
        var reservation = new Reservation { Status = ReservationStatus.Confirmed };

        ReservationStateMachine.Transition(reservation, ReservationStatus.Cancelled);

        Assert.Equal(ReservationStatus.Cancelled, reservation.Status);
        Assert.NotNull(reservation.CancelledAt);
    }

    [Fact]
    public void Transition_WhenInvalid_ShouldThrowAndKeepCurrentStatus()
    {
        var reservation = new Reservation { Status = ReservationStatus.Cancelled };

        var exception = Assert.Throws<InvalidOperationException>(() =>
            ReservationStateMachine.Transition(reservation, ReservationStatus.Confirmed));

        Assert.Equal(ReservationStatus.Cancelled, reservation.Status);
        Assert.Contains("Cannot transition reservation", exception.Message);
    }
}
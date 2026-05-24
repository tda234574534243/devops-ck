using BilliardsBooking.API.Enums;
using BilliardsBooking.API.Models;
using BilliardsBooking.API.Services.StateMachines;

namespace BilliardsBooking.API.Tests.Services.StateMachines;

public sealed class TableSessionStateMachineTests
{
    [Fact]
    public void CanTransition_FromActiveToCompleted_ShouldReturnTrue()
    {
        var result = TableSessionStateMachine.CanTransition(
            TableSessionStatus.Active,
            TableSessionStatus.Completed);

        Assert.True(result);
    }

    [Fact]
    public void CanTransition_FromCompletedToActive_ShouldReturnFalse()
    {
        var result = TableSessionStateMachine.CanTransition(
            TableSessionStatus.Completed,
            TableSessionStatus.Active);

        Assert.False(result);
    }

    [Fact]
    public void Transition_FromActiveToCompleted_ShouldUpdateStatus()
    {
        var session = new TableSession { Status = TableSessionStatus.Active };

        TableSessionStateMachine.Transition(session, TableSessionStatus.Completed);

        Assert.Equal(TableSessionStatus.Completed, session.Status);
    }

    [Fact]
    public void Transition_WhenInvalid_ShouldThrowAndKeepCurrentStatus()
    {
        var session = new TableSession { Status = TableSessionStatus.Completed };

        var exception = Assert.Throws<InvalidOperationException>(() =>
            TableSessionStateMachine.Transition(session, TableSessionStatus.Active));

        Assert.Equal(TableSessionStatus.Completed, session.Status);
        Assert.Contains("Cannot transition table session", exception.Message);
    }
}
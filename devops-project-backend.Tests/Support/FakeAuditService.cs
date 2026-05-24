using BilliardsBooking.API.Enums;
using BilliardsBooking.API.Services;

namespace BilliardsBooking.API.Tests.Support;

internal sealed class FakeAuditService : IAuditService
{
    public List<AuditLogCall> Calls { get; } = new();

    public Task LogAsync(
        AuditAction action,
        string entityType,
        string entityId,
        string? actorUserId = null,
        object? previousValue = null,
        object? newValue = null,
        string? notes = null)
    {
        Calls.Add(new AuditLogCall(
            action,
            entityType,
            entityId,
            actorUserId,
            previousValue,
            newValue,
            notes));

        return Task.CompletedTask;
    }
}

internal sealed record AuditLogCall(
    AuditAction Action,
    string EntityType,
    string EntityId,
    string? ActorUserId,
    object? PreviousValue,
    object? NewValue,
    string? Notes);
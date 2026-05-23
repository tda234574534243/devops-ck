using System.Text.Json;
using BilliardsBooking.API.Data;
using BilliardsBooking.API.Enums;
using BilliardsBooking.API.Models;

namespace BilliardsBooking.API.Services
{
    public interface IAuditService
    {
        Task LogAsync(
            AuditAction action,
            string entityType,
            string entityId,
            string? actorUserId = null,
            object? previousValue = null,
            object? newValue = null,
            string? notes = null);
    }

    public class AuditService : IAuditService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AuditService> _logger;

        public AuditService(AppDbContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogAsync(
            AuditAction action,
            string entityType,
            string entityId,
            string? actorUserId = null,
            object? previousValue = null,
            object? newValue = null,
            string? notes = null)
        {
            User? actor = null;
            if (!string.IsNullOrWhiteSpace(actorUserId) && Guid.TryParse(actorUserId, out var actorId))
            {
                actor = await _context.Users.FindAsync(actorId);
            }

            _context.AuditLogs.Add(new AuditLog
            {
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                ActorUserId = actorUserId,
                ActorName = actor?.FullName,
                ActorRole = actor?.Role.ToString(),
                PreviousValue = previousValue == null ? null : JsonSerializer.Serialize(previousValue),
                NewValue = newValue == null ? null : JsonSerializer.Serialize(newValue),
                Notes = notes
            });

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Audit logging must not break primary flows.
                _logger.LogError(
                    ex,
                    "Failed to persist audit log for action {Action} on {EntityType} {EntityId}.",
                    action,
                    entityType,
                    entityId);
            }
        }
    }
}

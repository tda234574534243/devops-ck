using System;
using BilliardsBooking.API.Enums;

namespace BilliardsBooking.API.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public Role Role { get; set; } = Role.Customer;
        public string? AvatarUrl { get; set; }
        public bool IsActive { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<ExternalAuthLink> ExternalAuthLinks { get; set; } = new List<ExternalAuthLink>();
    }
}

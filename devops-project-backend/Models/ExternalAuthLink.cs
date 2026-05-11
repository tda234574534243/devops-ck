namespace BilliardsBooking.API.Models
{
    public class ExternalAuthLink
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string ProviderUserId { get; set; } = string.Empty;
        public string ProviderEmail { get; set; } = string.Empty;
        public DateTime LinkedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}

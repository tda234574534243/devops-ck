namespace BilliardsBooking.API.Models
{
    public class OtpCode
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime ExpirationTime { get; set; } = DateTime.UtcNow.AddMinutes(5);
    }
}
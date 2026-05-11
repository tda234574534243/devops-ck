namespace BilliardsBooking.API.Services
{
    public interface IEmailTemplateService
    {
        Task<string> GetVerifyOTPEmailBodyAsync(string otp);
        Task<string> GetBookingConfirmationEmailBodyAsync(string customerName, string tableName, DateTime bookingTime);
        Task<string> GetPasswordResetEmailBodyAsync(string otp);
    }

    public class EmailTemplateService : IEmailTemplateService
    {
        public async Task<string> GetVerifyOTPEmailBodyAsync(string otp)
        {
            var templatePath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "templates",
                "VerifyOTP.html");

            var templateContent = await File.ReadAllTextAsync(templatePath);

            return templateContent.Replace("{{OTP}}", otp);
        }

        public async Task<string> GetBookingConfirmationEmailBodyAsync(string customerName, string tableName, DateTime bookingTime)
        {
            var templatePath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "templates",
                "BookingConfirmation.html");

            var templateContent = await File.ReadAllTextAsync(templatePath);

            return templateContent
                .Replace("{{CustomerName}}", customerName)
                .Replace("{{TableName}}", tableName)
                .Replace("{{BookingTime}}", bookingTime.ToString("dd/MM/yyyy HH:mm"));
        }

        public async Task<string> GetPasswordResetEmailBodyAsync(string otp)
        {
            var templatePath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "templates",
                "ForgetPassword.html");

            var templateContent = await File.ReadAllTextAsync(templatePath);

            return templateContent.Replace("{{OTP}}", otp);
        }
    }
}
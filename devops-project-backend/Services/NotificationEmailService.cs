namespace BilliardsBooking.API.Services
{
public interface INotificationEmailService
{
    Task SendVerifyOtpAsync(
        string toEmail,
        string otp);

    Task SendForgotPasswordOtpAsync(
        string toEmail,
        string otp);

    Task SendBookingConfirmationAsync(
        string toEmail,
        string customerName,
        string tableName,
        DateTime bookingTime);
}

public class NotificationEmailService 
    : INotificationEmailService
{
    private readonly IEmailService _emailService;
    private readonly IEmailTemplateService _templateService;

    public NotificationEmailService(
        IEmailService emailService,
        IEmailTemplateService templateService)
    {
        _emailService = emailService;
        _templateService = templateService;
    }

    public async Task SendVerifyOtpAsync(
        string toEmail,
        string otp)
    {
        var subject = "Xác minh tài khoản";

        var body = await 
            _templateService.GetVerifyOTPEmailBodyAsync(otp);

        await _emailService.SendEmailAsync(
            toEmail,
            subject,
            body);
    }

    public async Task SendForgotPasswordOtpAsync(
        string toEmail,
        string otp)
    {
        var subject = "Đặt lại mật khẩu";

        var body = await 
            _templateService.GetPasswordResetEmailBodyAsync(otp);

        await _emailService.SendEmailAsync(
            toEmail,
            subject,
            body);
    }

    public async Task SendBookingConfirmationAsync(
        string toEmail,
        string customerName,
        string tableName,
        DateTime bookingTime)
    {
        var subject = "Xác nhận đặt bàn";

        var body = await 
            _templateService.GetBookingConfirmationEmailBodyAsync(
                customerName,
                tableName,
                bookingTime);

        await _emailService.SendEmailAsync(
            toEmail,
            subject,
            body);
    }
}

}

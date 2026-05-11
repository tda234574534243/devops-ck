using BilliardsBooking.API.Data;
using BilliardsBooking.API.DTOs;
using BilliardsBooking.API.Enums;
using BilliardsBooking.API.Models;
using BilliardsBooking.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Google.Apis.Auth;

namespace BilliardsBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const int RefreshTokenExpiryDays = 30;
        private const string GoogleProvider = "google";
        private readonly bool _requireOtpVerification;
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;
        private readonly INotificationEmailService _notificationEmailService;
        private readonly IAuditService _auditService;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IAuthService authService, INotificationEmailService notificationEmailService, IAuditService auditService, IConfiguration configuration)
        {
            _context = context;
            _authService = authService;
            _notificationEmailService = notificationEmailService;
            _auditService = auditService;
            _configuration = configuration;
            _requireOtpVerification = _configuration.GetValue<bool>("Auth:RequireOtpVerification", true);
        }

        private string? GetIpAddress() => HttpContext?.Connection?.RemoteIpAddress?.ToString();

        private async Task<AuthResponse> BuildAuthResponseAsync(User user)
        {
            var token = _authService.GenerateJwtToken(user);
            var refreshTokenValue = _authService.GenerateRefreshToken();
            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = _authService.HashRefreshToken(refreshTokenValue),
                ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays),
                CreatedAt = DateTime.UtcNow,
                CreatedByIp = GetIpAddress()
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return new AuthResponse
            {
                Id = user.Id.ToString(),
                Token = token,
                RefreshToken = refreshTokenValue,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString()
            };
        }

        private async Task<RefreshToken?> GetRefreshTokenAsync(string refreshTokenValue)
        {
            var tokenHash = _authService.HashRefreshToken(refreshTokenValue);
            return await _context.RefreshTokens
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);
        }

        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { Message = "Email already in use" });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = _authService.HashPassword(request.Password),
                Role = Role.Customer
            };

            await _context.Users.AddAsync(user);
            if (!_requireOtpVerification)
            {
                user.IsActive = true;
                await _context.SaveChangesAsync();
            }
            else
            {
                var otp = _authService.GenerateOTP();
                await _context.OtpCodes.AddAsync(new OtpCode
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Code = otp,
                    IsUsed = false,
                    ExpirationTime = DateTime.UtcNow.AddMinutes(3)
                });
                await _context.SaveChangesAsync();

                try
                {
                    await _notificationEmailService.SendVerifyOtpAsync(user.Email, otp);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Send mail error: " + ex.Message);
                    return StatusCode(500, new { Message = "Failed to send OTP email" });
                }
            }

            // Audit: user registered
            await _auditService.LogAsync(
                AuditAction.UserRegistered,
                "User",
                user.Id.ToString(),
                actorUserId: user.Id.ToString(),
                newValue: new { user.Email, user.FullName, Role = user.Role },
                notes: $"IP={GetIpAddress()}");

            // Note: OTP email already sent when required above.

            var token = _authService.GenerateJwtToken(user);
            return Ok(new AuthResponse { Id = user.Id.ToString(), Token = token, RefreshToken = string.Empty, Email = user.Email, FullName = user.FullName, Role = user.Role.ToString() });
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !_authService.VerifyPassword(request.Password, user.PasswordHash))
            {
                // Audit: failed login attempt
                await _auditService.LogAsync(AuditAction.UserLoginFailed, "Auth", request.Email, notes: $"IP={GetIpAddress()}");
                return Unauthorized(new { Message = "Invalid email or password" });
            }

            if (!user.IsActive && _requireOtpVerification)
            {
                var otp = _authService.GenerateOTP();
                await _context.OtpCodes.AddAsync(new OtpCode
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Code = otp,
                    IsUsed = false,
                    ExpirationTime = DateTime.UtcNow.AddMinutes(3)
                });
                await _context.SaveChangesAsync();
                try
                {
                    await _notificationEmailService.SendVerifyOtpAsync(user.Email, otp);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Send mail error: " + ex.Message);
                    return StatusCode(500, new { Message = "Failed to send OTP email" });
                }

                return StatusCode(403, new { Message = "User account is inactive" });
            }

            var response = await BuildAuthResponseAsync(user);

            // Audit: successful login
            await _auditService.LogAsync(AuditAction.UserLoginSuccess, "User", user.Id.ToString(), actorUserId: user.Id.ToString(), notes: $"IP={GetIpAddress()}");

            return Ok(response);
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return NotFound(new { Message = "User not found" });

            var lastOtp = await _context.OtpCodes
                .Where(o => o.UserId == user.Id)
                .OrderByDescending(o => o.ExpirationTime)
                .FirstOrDefaultAsync();

            if (lastOtp != null && lastOtp.IsUsed == false &&
                lastOtp.ExpirationTime > DateTime.UtcNow.AddMinutes(2))
            {
                return BadRequest(new
                {
                    Message = "Vui lòng chờ 1 phút trước khi gửi lại OTP"
                });
            }

            var otp = _authService.GenerateOTP();
            await _context.OtpCodes.AddAsync(new OtpCode
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Code = otp,
                IsUsed = false,
                ExpirationTime = DateTime.UtcNow.AddMinutes(3)
            });
            await _context.SaveChangesAsync();

            try
            {
                await _notificationEmailService.SendVerifyOtpAsync(user.Email, otp);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Send mail error: " + ex.Message);
                return StatusCode(500, new { Message = "Failed to send OTP email" });
            }

            return Ok(new { Message = "OTP sent successfully" });
        }

        [HttpPost("active")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return NotFound(new { Message = "User not found" });

            var otpRecord = await _context.OtpCodes
                .Where(o => o.UserId == user.Id && o.Code == request.Otp && !o.IsUsed && o.ExpirationTime > DateTime.UtcNow)
                .FirstOrDefaultAsync();

            if (otpRecord == null) return BadRequest(new { Message = "Invalid or expired OTP" });

            otpRecord.IsUsed = true;
            user.IsActive = true;
            await _context.SaveChangesAsync();

            // Audit: user activated (verified OTP)
            await _auditService.LogAsync(AuditAction.UserActivated, "User", user.Id.ToString(), actorUserId: user.Id.ToString());

            var response = await BuildAuthResponseAsync(user);
            return Ok(response);
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var token = await GetRefreshTokenAsync(request.RefreshToken);
            if (token == null || !token.IsActive)
            {
                return Unauthorized(new { Message = "Invalid or expired refresh token." });
            }

            var user = await _context.Users.FindAsync(token.UserId);
            if (user == null)
            {
                return Unauthorized(new { Message = "Invalid refresh token." });
            }

            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedByIp = GetIpAddress();

            var newRefreshTokenValue = _authService.GenerateRefreshToken();
            var newRefreshTokenHash = _authService.HashRefreshToken(newRefreshTokenValue);

            token.ReplacedByTokenHash = newRefreshTokenHash;

            var newRefreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = newRefreshTokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays),
                CreatedAt = DateTime.UtcNow,
                CreatedByIp = GetIpAddress()
            };

            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            // Audit: refresh token rotated
            await _auditService.LogAsync(AuditAction.RefreshTokenRotated, "RefreshToken", newRefreshToken.Id.ToString(), actorUserId: user.Id.ToString());

            var newJwt = _authService.GenerateJwtToken(user);
            return Ok(new AuthResponse
            {
                Id = user.Id.ToString(),
                Token = newJwt,
                RefreshToken = newRefreshTokenValue,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString()
            });
        }

        [HttpPost("revoke-token")]
        public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenRequest request)
        {
            var token = await GetRefreshTokenAsync(request.RefreshToken);
            if (token == null)
            {
                return NotFound(new { Message = "Refresh token not found." });
            }

            if (!token.IsRevoked)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = GetIpAddress();
                await _context.SaveChangesAsync();

                // Audit: token revoked
                await _auditService.LogAsync(AuditAction.TokenRevoked, "RefreshToken", token.Id.ToString(), actorUserId: token.UserId.ToString());
            }

            return Ok(new { Message = "Refresh token revoked." });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userId, out var parsedUserId))
            {
                return Unauthorized(new { Message = "Invalid user." });
            }

            var now = DateTime.UtcNow;
            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == parsedUserId && !rt.IsRevoked && rt.ExpiresAt > now)
                .ToListAsync();

            foreach (var rt in refreshTokens)
            {
                rt.IsRevoked = true;
                rt.RevokedAt = DateTime.UtcNow;
                rt.RevokedByIp = GetIpAddress();
            }

            await _context.SaveChangesAsync();
            // Audit: user logout
            await _auditService.LogAsync(AuditAction.UserLogout, "User", userId, actorUserId: userId, notes: $"RevokedTokens={refreshTokens.Count}");

            return Ok(new { Message = "Logged out successfully." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return NotFound(new { Message = "User not found" });

            var otpRecord = await _context.OtpCodes
                .Where(o => o.UserId == user.Id && o.Code == request.Otp && !o.IsUsed && o.ExpirationTime > DateTime.UtcNow)
                .FirstOrDefaultAsync();

            if (otpRecord == null) return BadRequest(new { Message = "Invalid or expired OTP" });

            otpRecord.IsUsed = true;
            user.PasswordHash = _authService.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            // Audit: password reset
            await _auditService.LogAsync(AuditAction.PasswordReset, "User", user.Id.ToString(), actorUserId: user.Id.ToString());

            return Ok(new { Message = "Password reset successfully" });
        }

        [HttpPost("external/google")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ExternalGoogle([FromBody] ExternalLoginRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { Message = "Request body is required" });
            }

            var clientId = _configuration["Google:ClientId"];
            var clientSecret = _configuration["Google:ClientSecret"];
            if (string.IsNullOrEmpty(clientId))
            {
                return StatusCode(500, new { Message = "Google client id not configured on server" });
            }

            var idToken = request.IdToken?.Trim();
            var authorizationCode = request.AuthorizationCode?.Trim();

            if (string.IsNullOrEmpty(idToken) && string.IsNullOrEmpty(authorizationCode))
            {
                return BadRequest(new { Message = "Provide either idToken or authorizationCode" });
            }

            if (string.IsNullOrEmpty(idToken))
            {
                if (string.IsNullOrEmpty(request.RedirectUri))
                {
                    return BadRequest(new { Message = "redirectUri is required when using authorizationCode" });
                }

                if (string.IsNullOrEmpty(clientSecret))
                {
                    return StatusCode(500, new { Message = "Google client secret not configured on server" });
                }
            }

            try
            {
                if (string.IsNullOrEmpty(idToken))
                {
                    using var http = new System.Net.Http.HttpClient();
                    var tokenForm = new List<KeyValuePair<string, string>>
                    {
                        new("code", authorizationCode!),
                        new("client_id", clientId),
                        new("client_secret", clientSecret!),
                        new("redirect_uri", request.RedirectUri),
                        new("grant_type", "authorization_code")
                    };

                    if (!string.IsNullOrWhiteSpace(request.CodeVerifier))
                    {
                        tokenForm.Add(new("code_verifier", request.CodeVerifier));
                    }

                    var tokenResponse = await http.PostAsync(
                        "https://oauth2.googleapis.com/token",
                        new System.Net.Http.FormUrlEncodedContent(tokenForm));

                    if (!tokenResponse.IsSuccessStatusCode)
                    {
                        var tokenError = await tokenResponse.Content.ReadAsStringAsync();
                        await _auditService.LogAsync(
                            AuditAction.UserLoginFailed,
                            "Auth",
                            "Google",
                            notes: $"GoogleCodeExchangeFailed;IP={GetIpAddress()};Status={(int)tokenResponse.StatusCode};Detail={tokenError}");

                        return Unauthorized(new { Message = "Google authorization code exchange failed", Detail = tokenError });
                    }

                    var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
                    using var tokenDoc = System.Text.Json.JsonDocument.Parse(tokenJson);
                    if (!tokenDoc.RootElement.TryGetProperty("id_token", out var idTokenElement))
                    {
                        await _auditService.LogAsync(
                            AuditAction.UserLoginFailed,
                            "Auth",
                            "Google",
                            notes: $"GoogleCodeExchangeNoIdToken;IP={GetIpAddress()}");

                        return Unauthorized(new { Message = "Google token endpoint did not return id_token" });
                    }

                    idToken = idTokenElement.GetString();
                    if (string.IsNullOrWhiteSpace(idToken))
                    {
                        await _auditService.LogAsync(
                            AuditAction.UserLoginFailed,
                            "Auth",
                            "Google",
                            notes: $"GoogleCodeExchangeEmptyIdToken;IP={GetIpAddress()}");

                        return Unauthorized(new { Message = "Invalid id_token from Google" });
                    }
                }

                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new[] { clientId }
                };

                GoogleJsonWebSignature.Payload payload;
                try
                {
                    payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
                }
                catch (System.Exception tokenEx)
                {
                    await _auditService.LogAsync(
                        AuditAction.UserLoginFailed,
                        "Auth",
                        "Google",
                        notes: $"GoogleInvalidToken;IP={GetIpAddress()};Detail={tokenEx.Message}");

                    return Unauthorized(new { Message = "Invalid Google token", Detail = tokenEx.Message });
                }

                var email = payload.Email;
                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { Message = "Google token did not provide email" });
                }

                var providerUserId = payload.Subject?.Trim();
                if (string.IsNullOrWhiteSpace(providerUserId))
                {
                    await _auditService.LogAsync(
                        AuditAction.UserLoginFailed,
                        "Auth",
                        "Google",
                        notes: $"GoogleMissingSub;IP={GetIpAddress()}");

                    return Unauthorized(new { Message = "Google token missing subject (sub) claim" });
                }

                if (!payload.EmailVerified)
                {
                    await _auditService.LogAsync(
                        AuditAction.UserLoginFailed,
                        "Auth",
                        email,
                        notes: $"GoogleEmailNotVerified;IP={GetIpAddress()}");

                    return Unauthorized(new { Message = "Google account email is not verified" });
                }

                var now = DateTime.UtcNow;
                var linkedByProvider = false;
                var linkedExistingEmail = false;
                var isNew = false;

                var normalizedEmail = email.Trim();

                var existingProviderLink = await _context.ExternalAuthLinks
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(x => x.Provider == GoogleProvider && x.ProviderUserId == providerUserId);

                User? user;
                if (existingProviderLink != null)
                {
                    user = existingProviderLink.User;
                    existingProviderLink.LastUsedAt = now;
                    linkedByProvider = true;
                }
                else
                {
                    user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
                    if (user == null)
                    {
                        isNew = true;
                        user = new Models.User
                        {
                            Id = Guid.NewGuid(),
                            Email = normalizedEmail,
                            FullName = payload.Name ?? string.Empty,
                            IsActive = true,
                            Role = Enums.Role.Customer,
                            PasswordHash = _authService.HashPassword(Guid.NewGuid().ToString("N") + "!Gg9")
                        };

                        await _context.Users.AddAsync(user);
                    }
                    else
                    {
                        linkedExistingEmail = true;

                        var existingUserGoogleLink = await _context.ExternalAuthLinks
                            .FirstOrDefaultAsync(x => x.UserId == user.Id && x.Provider == GoogleProvider);

                        if (existingUserGoogleLink != null && !string.Equals(existingUserGoogleLink.ProviderUserId, providerUserId, StringComparison.Ordinal))
                        {
                            await _auditService.LogAsync(
                                AuditAction.UserLoginFailed,
                                "Auth",
                                user.Id.ToString(),
                                actorUserId: user.Id.ToString(),
                                notes: $"GoogleLinkConflict;IP={GetIpAddress()}");

                            return Conflict(new { Message = "Account already linked to a different Google account." });
                        }

                        if (existingUserGoogleLink != null)
                        {
                            existingUserGoogleLink.LastUsedAt = now;
                            linkedByProvider = true;
                        }
                    }

                    if (!linkedByProvider)
                    {
                        await _context.ExternalAuthLinks.AddAsync(new ExternalAuthLink
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            Provider = GoogleProvider,
                            ProviderUserId = providerUserId,
                            ProviderEmail = normalizedEmail,
                            LinkedAt = now,
                            LastUsedAt = now,
                        });
                    }
                }

                user.IsActive = true;
                if (string.IsNullOrWhiteSpace(user.FullName) && !string.IsNullOrWhiteSpace(payload.Name))
                {
                    user.FullName = payload.Name;
                }

                if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(payload.Picture))
                {
                    user.AvatarUrl = payload.Picture;
                }

                await _context.SaveChangesAsync();

                if (isNew)
                {
                    await _auditService.LogAsync(
                        AuditAction.UserRegistered,
                        "User",
                        user.Id.ToString(),
                        actorUserId: user.Id.ToString(),
                        newValue: new { user.Email, user.FullName, Role = user.Role },
                        notes: "GoogleExternalLogin");
                }

                if (linkedExistingEmail)
                {
                    await _auditService.LogAsync(
                        AuditAction.ExternalAccountLinked,
                        "User",
                        user.Id.ToString(),
                        actorUserId: user.Id.ToString(),
                        notes: "GoogleExternalLogin - linked-existing-email");
                }

                var authResponse = await BuildAuthResponseAsync(user);

                var loginMode = isNew
                    ? "created"
                    : linkedExistingEmail
                        ? "linked-existing-email"
                        : "linked-provider";

                await _auditService.LogAsync(
                    AuditAction.UserLoginSuccess,
                    "User",
                    user.Id.ToString(),
                    actorUserId: user.Id.ToString(),
                    notes: $"GoogleExternalLogin - {loginMode}");

                return Ok(authResponse);
            }
            catch (System.Exception ex)
            {
                Console.WriteLine("ExternalGoogle error: " + ex.Message);
                return StatusCode(500, new { Message = "Google login failed" });
            }
        }
    }
}

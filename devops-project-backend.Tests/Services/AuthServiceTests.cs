using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BilliardsBooking.API.Enums;
using BilliardsBooking.API.Models;
using BilliardsBooking.API.Services;
using Microsoft.Extensions.Configuration;

namespace BilliardsBooking.API.Tests.Services;

public sealed class AuthServiceTests
{
    private static AuthService CreateService()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "unit-test-secret-key-with-at-least-32-bytes",
                ["JwtSettings:Issuer"] = "BilliardsBooking.Tests",
                ["JwtSettings:Audience"] = "BilliardsBooking.Client.Tests",
                ["JwtSettings:ExpiryMinutes"] = "60"
            })
            .Build();

        return new AuthService(configuration);
    }

    [Fact]
    public void HashPassword_AndVerifyPassword_ShouldValidateOriginalPasswordOnly()
    {
        var service = CreateService();

        var hash = service.HashPassword("P@ssw0rd123");

        Assert.NotEqual("P@ssw0rd123", hash);
        Assert.True(service.VerifyPassword("P@ssw0rd123", hash));
        Assert.False(service.VerifyPassword("wrong-password", hash));
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnUniqueBase64Tokens()
    {
        var service = CreateService();

        var firstToken = service.GenerateRefreshToken();
        var secondToken = service.GenerateRefreshToken();

        Assert.False(string.IsNullOrWhiteSpace(firstToken));
        Assert.False(string.IsNullOrWhiteSpace(secondToken));
        Assert.NotEqual(firstToken, secondToken);

        var decodedBytes = Convert.FromBase64String(firstToken);
        Assert.Equal(64, decodedBytes.Length);
    }

    [Fact]
    public void HashRefreshToken_ShouldBeDeterministicAndShouldNotExposeRawToken()
    {
        var service = CreateService();
        const string refreshToken = "refresh-token-value";

        var firstHash = service.HashRefreshToken(refreshToken);
        var secondHash = service.HashRefreshToken(refreshToken);

        Assert.Equal(firstHash, secondHash);
        Assert.NotEqual(refreshToken, firstHash);
        Assert.Equal(32, Convert.FromBase64String(firstHash).Length);
    }

    [Fact]
    public void GenerateOTP_ShouldReturnSixDigitNumericCode()
    {
        var service = CreateService();

        var otp = service.GenerateOTP();

        Assert.Equal(6, otp.Length);
        Assert.True(otp.All(char.IsDigit));
    }

    [Fact]
    public void GenerateJwtToken_ShouldIncludeUserIdentityClaims()
    {
        var service = CreateService();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "customer@test.local",
            FullName = "Test Customer",
            Role = Role.Customer
        };

        var tokenValue = service.GenerateJwtToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(tokenValue);

        Assert.Equal("BilliardsBooking.Tests", jwt.Issuer);
        Assert.Contains("BilliardsBooking.Client.Tests", jwt.Audiences);
        Assert.Contains(jwt.Claims, claim =>
            (claim.Type == ClaimTypes.NameIdentifier || claim.Type == "nameid") &&
            claim.Value == user.Id.ToString());
        Assert.Contains(jwt.Claims, claim => claim.Type == JwtRegisteredClaimNames.Email && claim.Value == user.Email);
        Assert.Contains(jwt.Claims, claim =>
            (claim.Type == ClaimTypes.Role || claim.Type == "role") &&
            claim.Value == Role.Customer.ToString());
        Assert.Contains(jwt.Claims, claim => claim.Type == "name" && claim.Value == user.FullName);
        Assert.True(jwt.ValidTo > DateTime.UtcNow);
    }
}
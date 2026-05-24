using BilliardsBooking.API.Data;
using Microsoft.EntityFrameworkCore;

namespace BilliardsBooking.API.Tests.Support;

internal static class TestDbContextFactory
{
    public static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureDeleted();
        context.Database.EnsureCreated();

        return context;
    }
}
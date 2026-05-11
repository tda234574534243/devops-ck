using BilliardsBooking.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BilliardsBooking.API.Data.Configurations
{
    public class ExternalAuthLinkConfiguration : IEntityTypeConfiguration<ExternalAuthLink>
    {
        public void Configure(EntityTypeBuilder<ExternalAuthLink> builder)
        {
            builder.Property(x => x.Provider)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(x => x.ProviderUserId)
                .HasMaxLength(256)
                .IsRequired();

            builder.Property(x => x.ProviderEmail)
                .HasMaxLength(320)
                .IsRequired();

            builder.HasIndex(x => new { x.Provider, x.ProviderUserId })
                .IsUnique();

            builder.HasIndex(x => new { x.UserId, x.Provider })
                .IsUnique();

            builder.HasOne(x => x.User)
                .WithMany(u => u.ExternalAuthLinks)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

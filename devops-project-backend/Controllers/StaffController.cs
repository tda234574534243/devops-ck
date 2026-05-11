using System.Security.Claims;
using BilliardsBooking.API.Data;
using BilliardsBooking.API.DTOs;
using BilliardsBooking.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BilliardsBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Staff")]
    public class StaffController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StaffController(AppDbContext context)
        {
            _context = context;
        }

        private async Task<Guid?> GetCoachIdAsync()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                return null;

            var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
            return coach?.Id;
        }

        // TimeSpan uses lowercase hh for zero-padded 24-hour time-of-day values.
        private static string FormatTime(TimeSpan time) => time.ToString(@"hh\:mm");

        [HttpGet("schedule")]
        public async Task<IActionResult> GetSchedule([FromQuery] string? dateStr)
        {
            var coachId = await GetCoachIdAsync();
            if (coachId == null) return Unauthorized();

            var targetDate = string.IsNullOrEmpty(dateStr) ? DateTime.Today : DateTime.Parse(dateStr).Date;

            // Get availabilities applicable to the target date
            var dayOfWeek = targetDate.DayOfWeek;
            
            var schedule = await _context.CoachAvailabilities
                .Where(ca => ca.CoachId == coachId && 
                            (ca.SpecificDate == null || ca.SpecificDate.Value.Date == targetDate) &&
                            ca.DayOfWeek == dayOfWeek)
                .Select(ca => new 
                { 
                    ca.Id,
                    ca.DayOfWeek,
                    StartTime = FormatTime(ca.StartTime),
                    EndTime = FormatTime(ca.EndTime),
                    ca.IsBlocked,
                    SpecificDate = ca.SpecificDate.HasValue ? ca.SpecificDate.Value.ToString("yyyy-MM-dd") : null
                })
                .ToListAsync();

            return Ok(schedule);
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessions()
        {
            var coachId = await GetCoachIdAsync();
            if (coachId == null) return Unauthorized();

            var sessions = await _context.CoachingSessions
                .Include(s => s.StudentUser)
                .Where(s => s.CoachId == coachId && s.SessionDate >= DateTime.Today)
                .OrderBy(s => s.SessionDate).ThenBy(s => s.StartTime)
                .Select(s => new 
                {
                    s.Id,
                    SessionDate = s.SessionDate.ToString("yyyy-MM-dd"),
                    StartTime = FormatTime(s.StartTime),
                    EndTime = FormatTime(s.EndTime),
                    StudentName = s.StudentUser != null ? s.StudentUser.FullName : "Unknown",
                    s.IsGroupSession,
                    s.MaxParticipants,
                    s.IsCompleted
                })
                .ToListAsync();

            return Ok(sessions);
        }

        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailability() 
        {
            var coachId = await GetCoachIdAsync();
            if (coachId == null) return Unauthorized();

            var availabilities = await _context.CoachAvailabilities
                .Where(ca => ca.CoachId == coachId)
                .OrderBy(ca => ca.DayOfWeek)
                .ThenBy(ca => ca.StartTime)
                .Select(ca => new 
                {
                    ca.Id,
                    DayOfWeek = (int)ca.DayOfWeek,
                    StartTime = FormatTime(ca.StartTime),
                    EndTime = FormatTime(ca.EndTime),
                    ca.IsBlocked,
                    SpecificDate = ca.SpecificDate.HasValue ? ca.SpecificDate.Value.ToString("yyyy-MM-dd") : null
                })
                .ToListAsync();

            return Ok(availabilities);
        }

        [HttpPost("availability")]
        public async Task<IActionResult> CreateAvailability([FromBody] UpsertCoachAvailabilityRequest request)
        {
            var coachId = await GetCoachIdAsync();
            if (coachId == null) return Unauthorized();

            var validationError = await ValidateAvailabilityRequestAsync(coachId.Value, request);
            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            var availability = new CoachAvailability
            {
                CoachId = coachId.Value,
                DayOfWeek = (DayOfWeek)request.DayOfWeek,
                StartTime = TimeSpan.Parse(request.StartTime),
                EndTime = TimeSpan.Parse(request.EndTime),
                IsBlocked = request.IsBlocked,
                SpecificDate = request.SpecificDate?.Date
            };

            _context.CoachAvailabilities.Add(availability);
            await _context.SaveChangesAsync();

            return Ok(new CoachAvailabilityResponse
            {
                Id = availability.Id,
                DayOfWeek = (int)availability.DayOfWeek,
                StartTime = FormatTime(availability.StartTime),
                EndTime = FormatTime(availability.EndTime),
                IsBlocked = availability.IsBlocked,
                SpecificDate = availability.SpecificDate?.ToString("yyyy-MM-dd")
            });
        }

        [HttpPut("availability/{id:int}")]
        public async Task<IActionResult> UpdateAvailability(int id, [FromBody] UpsertCoachAvailabilityRequest request)
        {
            var coachId = await GetCoachIdAsync();
            if (coachId == null) return Unauthorized();

            var availability = await _context.CoachAvailabilities
                .FirstOrDefaultAsync(ca => ca.Id == id && ca.CoachId == coachId.Value);

            if (availability == null)
            {
                return NotFound(new { message = "Không tìm thấy khung giờ để cập nhật." });
            }

            var validationError = await ValidateAvailabilityRequestAsync(coachId.Value, request, id);
            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            availability.DayOfWeek = (DayOfWeek)request.DayOfWeek;
            availability.StartTime = TimeSpan.Parse(request.StartTime);
            availability.EndTime = TimeSpan.Parse(request.EndTime);
            availability.IsBlocked = request.IsBlocked;
            availability.SpecificDate = request.SpecificDate?.Date;

            await _context.SaveChangesAsync();

            return Ok(new CoachAvailabilityResponse
            {
                Id = availability.Id,
                DayOfWeek = (int)availability.DayOfWeek,
                StartTime = FormatTime(availability.StartTime),
                EndTime = FormatTime(availability.EndTime),
                IsBlocked = availability.IsBlocked,
                SpecificDate = availability.SpecificDate?.ToString("yyyy-MM-dd")
            });
        }

        [HttpDelete("availability/{id:int}")]
        public async Task<IActionResult> DeleteAvailability(int id, [FromQuery] bool confirmed = false)
        {
            var coachId = await GetCoachIdAsync();
            if (coachId == null) return Unauthorized();

            var availability = await _context.CoachAvailabilities
                .FirstOrDefaultAsync(ca => ca.Id == id && ca.CoachId == coachId.Value);

            if (availability == null)
            {
                return NotFound(new { message = "Không tìm thấy khung giờ để xóa." });
            }

            if (!confirmed)
            {
                var today = DateTime.UtcNow.Date;
                var upcomingSessions = await _context.CoachingSessions
                    .Where(session =>
                        session.CoachId == coachId.Value &&
                        !session.IsCompleted &&
                        session.SessionDate >= today &&
                        session.StartTime < availability.EndTime &&
                        session.EndTime > availability.StartTime)
                    .Select(session => new { session.SessionDate })
                    .ToListAsync();

                var hasUpcomingSessions = availability.SpecificDate.HasValue
                    ? upcomingSessions.Any(session => session.SessionDate.Date == availability.SpecificDate.Value.Date)
                    : upcomingSessions.Any(session => session.SessionDate.DayOfWeek == availability.DayOfWeek);

                if (hasUpcomingSessions)
                {
                    return Conflict(new
                    {
                        message = "Khung giờ này có lịch đặt chưa hoàn thành. Xác nhận xóa?",
                        requiresConfirmation = true
                    });
                }

                return Conflict(new
                {
                    message = "Bạn có chắc chắn muốn xóa khung giờ làm việc này không?",
                    requiresConfirmation = true
                });
            }

            _context.CoachAvailabilities.Remove(availability);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa khung giờ." });
        }

        [HttpPut("sessions/{id}/complete")]
        public async Task<IActionResult> CompleteSession(Guid id, [FromBody] BilliardsBooking.API.DTOs.CompleteSessionRequest request)
        {
            var coachId = await GetCoachIdAsync();
            if (coachId == null) return Unauthorized();

            var session = await _context.CoachingSessions.FindAsync(id);
            if (session == null) return NotFound();

            if (session.CoachId != coachId) return Forbid();

            session.IsCompleted = true;
            session.CoachNotes = request.Notes;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Session marked as complete." });
        }

        private async Task<string?> ValidateAvailabilityRequestAsync(Guid coachId, UpsertCoachAvailabilityRequest request, int? existingId = null)
        {
            if (request.DayOfWeek < 0 || request.DayOfWeek > 6)
            {
                return "Ngày trong tuần không hợp lệ.";
            }

            if (!TimeSpan.TryParse(request.StartTime, out var startTime) || !TimeSpan.TryParse(request.EndTime, out var endTime))
            {
                return "Khung giờ không hợp lệ. Hãy dùng định dạng HH:mm.";
            }

            if (startTime >= endTime)
            {
                return "Giờ kết thúc phải sau giờ bắt đầu.";
            }

            var storeOpen = new TimeSpan(8, 0, 0);
            var storeClose = new TimeSpan(23, 30, 0);

            if (startTime < storeOpen || endTime > storeClose)
            {
                return "Thời gian làm việc phải trong thời gian hoạt động của cửa hàng (08:00 - 23:30).";
            }

            var sameScopeEntries = await _context.CoachAvailabilities
                .Where(ca => ca.CoachId == coachId && ca.Id != existingId)
                .Where(ca =>
                    (request.SpecificDate.HasValue && ca.SpecificDate.HasValue && ca.SpecificDate.Value.Date == request.SpecificDate.Value.Date) ||
                    (!request.SpecificDate.HasValue && !ca.SpecificDate.HasValue && ca.DayOfWeek == (DayOfWeek)request.DayOfWeek))
                .ToListAsync();

            var overlapsSameType = sameScopeEntries.Any(ca =>
                ca.IsBlocked == request.IsBlocked &&
                startTime < ca.EndTime &&
                endTime > ca.StartTime);

            if (overlapsSameType)
            {
                return request.IsBlocked
                    ? "Khung giờ bận bị trùng với một khoảng bận khác."
                    : "Khung giờ rảnh bị trùng với một khoảng rảnh khác.";
            }

            return null;
        }
    }
}

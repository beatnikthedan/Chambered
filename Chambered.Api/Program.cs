using Chambered.Api.Authentication;
using Chambered.Api.BackgroundServices;
using Chambered.Core.Services;
using Chambered.Data;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Services.BackupServices;
using Chambered.Infrastructure.Services.EmailServices;
using Chambered.Infrastructure.Services.NotificationServices;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure EF Core & SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=../chambered.db";

builder.Services.AddDbContext<ChamberedDbContext>(options =>
    options.UseSqlite(connectionString, b => b.MigrationsAssembly("Chambered.Api")));

// 2. Configure Identity
builder.Services.AddIdentity<ChamberedUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.User.RequireUniqueEmail = false;
})
.AddEntityFrameworkStores<ChamberedDbContext>()
.AddDefaultTokenProviders();

// 3. Configure Mixed Authentication (Cookie + API Key)
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "ChamberedAuth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.ExpireTimeSpan = TimeSpan.FromDays(30);
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "MixedScheme";
    options.DefaultChallengeScheme = "MixedScheme";
})
.AddScheme<ApiKeyAuthOptions, ApiKeyAuthHandler>("ApiKeyScheme", null)
.AddPolicyScheme("MixedScheme", "MixedScheme", options =>
{
    options.ForwardDefaultSelector = context =>
    {
        // Route API Key auth header or fallback to standard Identity Cookie Auth
        if (context.Request.Headers.ContainsKey("Authorization"))
        {
            return "ApiKeyScheme";
        }
        return IdentityConstants.ApplicationScheme;
    };
});

// 4. Configure CORS for frontend dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 5. Configure Controllers with camelCase and cycles ignored
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.AllowOutOfOrderMetadataProperties = true;
    });

// Learn more about configuring OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();







builder.Services.Configure<AppriseConfiguration>(builder.Configuration.GetSection(nameof(AppriseConfiguration)));
builder.Services.AddScoped<IAppriseService, AppriseService>();

builder.Services.Configure<EmailConfiguration>(builder.Configuration.GetSection(nameof(EmailConfiguration)));
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

builder.Services.Configure<BackupConfiguration>(builder.Configuration.GetSection(nameof(BackupConfiguration)));
builder.Services.AddScoped<IBackupService, SqliteBackupService>();

builder.Services.AddHttpClient();

builder.Services.AddHostedService<BackupSchedulerWorker>();









// 6. Build application
var app = builder.Build();

// 7. Configure HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");

// Seed and initialize database asynchronously
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await Chambered.Api.Data.DbInitializer.InitializeAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred seeding the database.");
    }
}

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Serve frontend SPA from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapFallbackToFile("index.html");










//// Temporary developer test endpoint
//app.MapPost("/api/test/send-email", async (IEmailService emailService, string toEmail) =>
//{
//    var message = new MailMessage
//    {
//        Subject = "Chambered System - Test Email",
//        Body = "<h1>Success!</h1><p>Your SMTP email configuration is working correctly.</p>",
//        IsBodyHtml = true
//    };

//    message.To.Add(toEmail);

//    bool sent = await emailService.SendEmailAsync(message);

//    return sent
//        ? Results.Ok(new { success = true, message = $"Test email sent to {toEmail}" })
//        : Results.Problem($"Failed to send email to {toEmail}. Check application logs for details.");
//})
//.WithTags("Testing");











app.Run();

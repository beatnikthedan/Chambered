using Asp.Versioning;
using Chambered.Api.BackgroundServices;
using Chambered.Api.Swagger;
using Chambered.Core.Services;
using Chambered.Data;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Services.BackupServices;
using Chambered.Infrastructure.Services.EmailServices;
using Chambered.Infrastructure.Services.NotificationServices;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
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
    options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
    options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
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

// 5. Configure Controllers with camelCase, cycles ignored, and OData options
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ModelStateDebugLoggerFilter>();
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
})
    .AddOData(options =>
    {
        options.Select().Filter().OrderBy().Expand().Count().SetMaxTop(100);
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.AllowOutOfOrderMetadataProperties = true;
    });

builder.Services.AddHttpLogging(l =>
{
    l.LoggingFields = HttpLoggingFields.All;
    //l.RequestHeaders.Add("My-Request-Header");
    //l.ResponseHeaders.Add("My-Response-Header");
    //l.MediaTypeOptions.AddText("application/json");
    l.RequestBodyLogLimit = 4096;
    l.ResponseBodyLogLimit = 4096;
});

// Configure API Versioning + OData Routing integration
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
})
.AddOData(options =>
{
    options.AddRouteComponents("api/v{version:apiVersion}");
})
.AddODataApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// Configure Versioned Swagger Documents generator
builder.Services.AddTransient<IConfigureOptions<SwaggerGenOptions>, ConfigureSwaggerOptions>();
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<ODataSwaggerFilter>();
    c.DocumentFilter<ODataSwaggerFilter>();

    c.CustomOperationIds(apiDesc =>
    {
        var controller = apiDesc.ActionDescriptor.RouteValues["controller"];
        var action = apiDesc.ActionDescriptor.RouteValues["action"];
        var method = apiDesc.HttpMethod;

        var relativePath = apiDesc.RelativePath ?? "";
        if (relativePath.Contains("{key}"))
        {
            return $"{controller}_{action}ByKey_{method}";
        }
        if (relativePath.Contains("$count"))
        {
            return $"{controller}_{action}Count_{method}";
        }

        return $"{controller}_{action}_{method}";
    });
});







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
    app.UseSwaggerUI(options =>
    {
        var provider = app.Services.GetRequiredService<Asp.Versioning.ApiExplorer.IApiVersionDescriptionProvider>();
        foreach (var description in provider.ApiVersionDescriptions)
        {
            options.SwaggerEndpoint($"/swagger/{description.GroupName}/swagger.json", description.GroupName.ToUpperInvariant());
        }
    });
}

app.UseCors("CorsPolicy");

app.UseHttpLogging();

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

// Custom API Request & ModelState Debug Logger Middleware
app.Use(async (context, next) =>
{
    if (context.Request.Path.Value != null && context.Request.Path.Value.Contains("/api/v1/"))
    {
        context.Request.EnableBuffering();
        var requestBody = "";
        using (var reader = new StreamReader(context.Request.Body, System.Text.Encoding.UTF8, leaveOpen: true))
        {
            requestBody = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0; // Rewind the stream so downstream binders can read it
        }

        Console.WriteLine($"\n[ODATA REQUEST] {context.Request.Method} {context.Request.Path}{context.Request.QueryString}");
        Console.WriteLine($"[Payload]: {requestBody}");
    }

    await next();

    if (context.Response.StatusCode >= 400 && context.Request.Path.Value != null && context.Request.Path.Value.Contains("/api/v1/"))
    {
        Console.WriteLine($"[ODATA RESPONSE ERROR] Status Code: {context.Response.StatusCode}");
    }
});

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


public class ModelStateDebugLoggerFilter : Microsoft.AspNetCore.Mvc.Filters.IActionFilter
{
    public void OnActionExecuting(Microsoft.AspNetCore.Mvc.Filters.ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            Console.WriteLine("\n========================================================");
            Console.WriteLine("[MODELSTATE ERROR DETECTED] OData Model Binding Failed!");
            Console.WriteLine("========================================================");
            foreach (var state in context.ModelState)
            {
                foreach (var error in state.Value.Errors)
                {
                    Console.WriteLine($"Field: {state.Key}");
                    Console.WriteLine($"Error: {error.ErrorMessage}");
                    if (error.Exception != null)
                    {
                        Console.WriteLine($"Exception Message: {error.Exception.Message}");
                        if (error.Exception.InnerException != null)
                        {
                            Console.WriteLine($"Inner Exception: {error.Exception.InnerException.Message}");
                        }
                    }
                }
            }
            Console.WriteLine("========================================================\n");
        }
    }

    public void OnActionExecuted(Microsoft.AspNetCore.Mvc.Filters.ActionExecutedContext context) { }
}



public class ODataSwaggerFilter : IOperationFilter, IDocumentFilter
{
    // Fixes parameter binding from "query" to "path"
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var keyParam = operation.Parameters?.FirstOrDefault(p => p.Name == "key");
        if (keyParam != null)
        {
            keyParam.In = ParameterLocation.Path;
            keyParam.Required = true;
        }
    }

    // Removes unusable parenthesis OData routes like /Products({key}) and namespace-prefixed duplicate routes containing "/Default."
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var pathsToRemove = swaggerDoc.Paths.Keys
            .Where(k => k.Contains("({key})") || k.Contains("/Default."))
            .ToList();

        foreach (var path in pathsToRemove)
        {
            swaggerDoc.Paths.Remove(path);
        }
    }
}


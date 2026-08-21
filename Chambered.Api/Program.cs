using Asp.Versioning;
using Chambered.Api.BackgroundServices;
using Chambered.Api.Swagger;
using Chambered.Core.Services;
using Chambered.Data;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Extensions;
using Chambered.Core.Services.Identity;
using Chambered.Infrastructure.Services.Identity;

using Chambered.Infrastructure.Services.BackupServices;
using Chambered.Infrastructure.Services.EmailServices;
using Chambered.Infrastructure.Services.NotificationServices;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text;
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

// 3. Configure Authentication (JWT Bearer, ApiKey Handler, and Federated OIDC)
builder.Services.AddChamberedAuthentication(builder.Configuration, builder.Environment);

// Register dynamic claim-based authorization providers (PermissionPolicyProvider, PermissionAuthorizationHandler)
builder.Services.AddChamberedAuthorization();


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

builder.Services.ConfigureApplicationCookie(options =>
{
    options.ExpireTimeSpan = TimeSpan.FromDays(7); // Set your desired expiration window
    options.SlidingExpiration = true;              // Reset window when user is active
    options.Cookie.HttpOnly = true;                 // Protects completely against XSS token theft
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Requires HTTPS
    options.Cookie.SameSite = SameSiteMode.Strict;  // Protects against CSRF
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
    c.CustomOperationIds((controller, verb, action) => $"{verb}{controller}{action}");
    c.AddApiKeyAuthorization();
});







builder.Services.Configure<AppriseConfiguration>(builder.Configuration.GetSection(nameof(AppriseConfiguration)));
builder.Services.AddScoped<IAppriseService, AppriseService>();

builder.Services.Configure<IdentityConfiguration>(builder.Configuration.GetSection("Identity"));
builder.Services.AddScoped<IApiKeyService, ApiKeyService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IFederatedAuthService, FederatedAuthService>();
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<IRoleService, RoleService>();

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

await app.ApplyMigrations<ChamberedDbContext>(async services =>
{
    // 1. Bootstraps default admin user if environment variables are set (Docker)
    await services.SeedAdminUser();

    // 2. Seeds standard roles & granular permission claims dynamically based on core mapping configuration
    await services.SeedIdentityData();
});

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



public static class SwaggerGenOptionsExtensions
{
    public static SwaggerGenOptions CustomOperationIds(this SwaggerGenOptions swaggerGenOptions, Func<string, string, string, string> operationIdFormat)
    {
        Func<string, string, string, string> operationIdFormat2 = operationIdFormat;
        string controller = string.Empty;
        string verb = string.Empty;
        string action = string.Empty;
        swaggerGenOptions.CustomOperationIds(delegate (ApiDescription a)
        {
            StringBuilder stringBuilder = new StringBuilder();
            controller = a.ActionDescriptor.RouteValues["controller"];
            action = a.ActionDescriptor.RouteValues["action"];
            foreach (string item in new List<string> { "Get", "Put", "Post", "Patch", "Delete", "Upsert" })
            {
                if (action.Contains(item))
                {
                    verb = item;
                    action = action.Replace(item, "");
                }
            }

            stringBuilder.Append(operationIdFormat2(controller, verb, action));
            if (a.RelativePath.Contains("$count"))
            {
                stringBuilder.Append("Count");
            }

            // Get standard path parameters (works for standard controllers like ATSPM)
            var pathParams = a.ParameterDescriptions.Where((ApiParameterDescription w) => w.Source == BindingSource.Path).ToList();

            // FALLBACK FOR ODATA KEY ROUTING:
            // If standard routing did not expose path parameters, but the OData route contains '{key}' or '({key})'
            if (pathParams.Count == 0 && (a.RelativePath.Contains("{key}") || a.RelativePath.Contains("({key})")))
            {
                stringBuilder.Append("FromKey");
            }
            else
            {
                // Your standard ATSPM parameter mapping
                foreach (ApiParameterDescription item2 in pathParams)
                {
                    if (!stringBuilder.ToString().Contains("From"))
                    {
                        stringBuilder.Append("From");
                    }
                    else
                    {
                        stringBuilder.Append("And");
                    }

                    stringBuilder.Append(item2.Name.Capitalize());
                }
            }

            return stringBuilder.ToString();
        });
        return swaggerGenOptions;
    }

    public static SwaggerGenOptions AddApiKeyAuthorization(this SwaggerGenOptions swaggerGenOptions)
    {
        OpenApiSecurityScheme openApiSecurityScheme = new OpenApiSecurityScheme
        {
            Name = "X-API-KEY",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Description = "Put your API Key on textbox below!",
            Reference = new OpenApiReference
            {
                Id = "ApiKey",
                Type = ReferenceType.SecurityScheme
            }
        };
        swaggerGenOptions.AddSecurityDefinition(openApiSecurityScheme.Reference.Id, openApiSecurityScheme);
        swaggerGenOptions.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            openApiSecurityScheme,
            Array.Empty<string>()
        } });
        return swaggerGenOptions;
    }

    public static string Capitalize(this string input)
    {
        if (input != null)
        {
            if (input == "")
            {
                throw new ArgumentException("input cannot be empty", "input");
            }

            return $"{input[0].ToString().ToUpper()}{input.AsSpan(1)}";
        }

        throw new ArgumentNullException("input");
    }
}






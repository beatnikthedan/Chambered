using Chambered.Data;
using Chambered.Infrastructure.Configuration;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Chambered.Infrastructure.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static HostBuilderContext ConfigureIdentity(this HostBuilderContext host, IServiceCollection services)
        {
            services.AddIdentity<ChamberedUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = false;
            }).AddEntityFrameworkStores<ChamberedDbContext>().AddDefaultTokenProviders();

            services.PostConfigure<IdentityOptions>(options =>
            {
                var policy = host.Configuration
                    .GetSection(nameof(PasswordPolicyConfiguration))
                    .Get<PasswordPolicyConfiguration>() ?? new PasswordPolicyConfiguration();

                options.Password.RequiredLength = policy.RequiredLength;
                options.Password.RequireNonAlphanumeric = policy.RequireNonAlphanumeric;
                options.Password.RequireLowercase = policy.RequireLowercase;
                options.Password.RequireUppercase = policy.RequireUppercase;
                options.Password.RequireDigit = policy.RequireDigit;
            });

            return host;
        }
    }
}

/*
 * FZ Auth — C# Client Example
 *
 * Works with .NET 6+ / .NET Framework 4.7.2+
 * Add this class to your project and call FZAuth.Initialize(), FZAuth.Login(), etc.
 *
 * Usage:
 *   1. Create an app in the FZ Auth panel and copy app_id + secret
 *   2. Generate a license key in the panel
 *   3. Set the constants below
 */

using System;
using System.Collections.Generic;
using System.Management;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public static class FZAuth
{
    // ── Replace these with your real values from the panel ──────────
    private const string BASE       = "http://localhost:3001";
    private const string APP_ID     = "YOUR_APP_ID_HERE";
    private const string APP_SECRET = "YOUR_APP_SECRET_HERE";
    private const string VERSION    = "1.0";
    // ────────────────────────────────────────────────────────────────

    private static readonly HttpClient _http = new HttpClient();

    public static string Token { get; private set; }
    public static string Username { get; private set; }
    public static string Expiry { get; private set; }
    public static string HWID => GetHWID();

    private static async Task<JsonElement> Api(string endpoint, Dictionary<string, object> extra = null)
    {
        var body = new Dictionary<string, object>
        {
            ["app_id"] = APP_ID,
            ["secret"] = APP_SECRET
        };

        if (extra != null)
            foreach (var kv in extra)
                body[kv.Key] = kv.Value;

        var json = JsonSerializer.Serialize(body);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var res = await _http.PostAsync($"{BASE}/api/v1/{endpoint}", content);
        var raw = await res.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<JsonElement>(raw);
    }

    private static string GetHWID()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
            foreach (var obj in searcher.Get())
                return obj["ProcessorId"]?.ToString() ?? Environment.MachineName;
        }
        catch { }
        return Environment.MachineName + "-" + Environment.UserName;
    }

    public static async Task<bool> Initialize()
    {
        var data = await Api("init", new() { ["version"] = VERSION });
        if (!data.GetProperty("success").GetBoolean())
        {
            Console.WriteLine($"Init failed: {data.GetProperty("message")}");
            return false;
        }
        Console.WriteLine($"App: {data.GetProperty("app_name")} v{data.GetProperty("version")}");
        return true;
    }

    public static async Task<bool> Login(string username, string password)
    {
        var data = await Api("login", new()
        {
            ["username"] = username,
            ["password"] = password,
            ["hwid"] = HWID
        });

        if (!data.GetProperty("success").GetBoolean())
        {
            Console.WriteLine($"Login failed: {data.GetProperty("message")}");
            return false;
        }

        Token = data.GetProperty("token").GetString();
        Username = data.GetProperty("username").GetString();
        Expiry = data.GetProperty("expiry").GetString();
        return true;
    }

    public static async Task<bool> Register(string username, string password, string licenseKey)
    {
        var data = await Api("register", new()
        {
            ["username"] = username,
            ["password"] = password,
            ["license_key"] = licenseKey,
            ["hwid"] = HWID
        });

        if (!data.GetProperty("success").GetBoolean())
        {
            Console.WriteLine($"Register failed: {data.GetProperty("message")}");
            return false;
        }

        Token = data.GetProperty("token").GetString();
        Username = data.GetProperty("username").GetString();
        Expiry = data.GetProperty("expiry").GetString();
        return true;
    }

    public static async Task<bool> LicenseAuth(string licenseKey)
    {
        var data = await Api("license", new()
        {
            ["license_key"] = licenseKey,
            ["hwid"] = HWID
        });

        if (!data.GetProperty("success").GetBoolean())
        {
            Console.WriteLine($"License auth failed: {data.GetProperty("message")}");
            return false;
        }

        Token = data.GetProperty("token").GetString();
        Expiry = data.GetProperty("expiry").GetString();
        return true;
    }

    public static async Task<bool> CheckSession()
    {
        if (string.IsNullOrEmpty(Token)) return false;

        var data = await Api("check", new() { ["token"] = Token });
        return data.GetProperty("success").GetBoolean();
    }

    public static async Task<string> GetVariable(string key)
    {
        var data = await Api("var", new() { ["key"] = key });
        if (!data.GetProperty("success").GetBoolean()) return null;
        return data.GetProperty("variable").GetProperty("value").GetString();
    }

    public static async Task<Dictionary<string, string>> GetAllVariables()
    {
        var data = await Api("var");
        var result = new Dictionary<string, string>();
        if (!data.GetProperty("success").GetBoolean()) return result;
        foreach (var prop in data.GetProperty("variables").EnumerateObject())
            result[prop.Name] = prop.Value.GetString();
        return result;
    }
}

// ── Example usage ──────────────────────────────────────────────────
// class Program
// {
//     static async Task Main()
//     {
//         if (!await FZAuth.Initialize()) return;
//
//         // Login with username/password
//         if (!await FZAuth.Login("myuser", "mypass")) return;
//         Console.WriteLine($"Welcome {FZAuth.Username}! Expires: {FZAuth.Expiry}");
//
//         // OR register with license key
//         // if (!await FZAuth.Register("newuser", "pass123", "XXXX-XXXX-XXXX")) return;
//
//         // OR license-only auth
//         // if (!await FZAuth.LicenseAuth("XXXX-XXXX-XXXX")) return;
//
//         // Check session
//         bool valid = await FZAuth.CheckSession();
//         Console.WriteLine($"Session valid: {valid}");
//
//         // Fetch variables
//         var version = await FZAuth.GetVariable("update_url");
//         Console.WriteLine($"Update URL: {version}");
//     }
// }

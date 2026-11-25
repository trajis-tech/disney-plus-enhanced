using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;

namespace DisneyPlusDesktop;

internal static class AppVersion
{
    /// <summary>The version from DisneyPlusDesktop.csproj, e.g. 1.0.1.</summary>
    public static readonly Version Current = typeof(AppVersion).Assembly.GetName().Version ?? new Version(1, 0, 0);

    public static string Display => Format(Current);

    public static string Format(Version v) => $"{v.Major}.{v.Minor}.{Math.Max(v.Build, 0)}";
}

/// <summary>A newer release on GitHub. The installer fields are null when the release has no installer.</summary>
internal sealed record UpdateInfo(Version Version, string PageUrl, string? InstallerUrl, string? InstallerSha256, long InstallerSize)
{
    public string Display => AppVersion.Format(Version);
}

/// <summary>
/// Updates from this project's GitHub releases. Installed copies download the new installer, check its SHA-256
/// against GitHub's digest, and run it silently in the same install mode; the installer restarts the app.
/// Portable copies only point to the release page.
/// </summary>
internal static class Updater
{
    public const string Repository = "trajis-tech/disney-plus-enhanced";
    public const string ProjectPage = "https://github.com/" + Repository;
    private const string LatestReleaseApi = "https://api.github.com/repos/" + Repository + "/releases/latest";

    private static readonly HttpClient Http = CreateClient();

    /// <summary>
    /// Test hook: DPD_UPDATE_TEST=&lt;version&gt; makes the app behave as that version (checked 5 s after start),
    /// so the whole update can be tried end to end against the published releases.
    /// </summary>
    public static string? TestVersion =>
        Environment.GetEnvironmentVariable("DPD_UPDATE_TEST") is { Length: > 0 } v && Version.TryParse(v, out _) ? v : null;

    public static Version Running => TestVersion is { } t ? Version.Parse(t) : AppVersion.Current;

    /// <summary>Installed by the setup program (its uninstaller sits next to the exe), so it can update itself.</summary>
    public static bool IsInstalled => File.Exists(Path.Combine(AppContext.BaseDirectory, "unins000.exe"));

    private static HttpClient CreateClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromMinutes(10) };
        client.DefaultRequestHeaders.UserAgent.ParseAdd($"DisneyPlusDesktop/{AppVersion.Display}");
        return client;
    }

    /// <summary>The latest release if it is newer than this copy, otherwise null.</summary>
    public static async Task<UpdateInfo?> CheckAsync(CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, LatestReleaseApi);
        request.Headers.Accept.ParseAdd("application/vnd.github+json");
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(30));
        using var response = await Http.SendAsync(request, timeout.Token);
        response.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(timeout.Token));
        var root = doc.RootElement;

        var tag = root.GetProperty("tag_name").GetString() ?? "";
        if (!Version.TryParse(tag.TrimStart('v', 'V'), out var latest) || Normalize(latest) <= Normalize(Running))
            return null;

        string? url = null, sha256 = null;
        long size = 0;
        foreach (var asset in root.GetProperty("assets").EnumerateArray())
        {
            var name = asset.GetProperty("name").GetString() ?? "";
            if (!name.StartsWith("DisneyPlus-Setup", StringComparison.OrdinalIgnoreCase) ||
                !name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                continue;
            url = asset.GetProperty("browser_download_url").GetString();
            size = asset.TryGetProperty("size", out var s) && s.ValueKind == JsonValueKind.Number ? s.GetInt64() : 0;
            if (asset.TryGetProperty("digest", out var d) && d.GetString() is { } digest &&
                digest.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase))
                sha256 = digest["sha256:".Length..].ToLowerInvariant();
            break;
        }
        var page = root.TryGetProperty("html_url", out var html) ? html.GetString() : null;
        return new UpdateInfo(latest, page ?? ProjectPage + "/releases/latest", url, sha256, size);
    }

    private static Version Normalize(Version v) => new(v.Major, v.Minor, Math.Max(v.Build, 0));

    /// <summary>Downloads the installer to %TEMP% and checks it; throws when it doesn't match the release.</summary>
    public static async Task<string> DownloadInstallerAsync(UpdateInfo update, IProgress<double>? progress, CancellationToken ct)
    {
        if (update.InstallerUrl is null)
            throw new InvalidOperationException("The release has no installer.");
        var dir = Path.Combine(Path.GetTempPath(), "DisneyPlusDesktop-update");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, $"DisneyPlus-Setup-{update.Display}.exe");

        using var response = await Http.GetAsync(update.InstallerUrl, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();
        long total = response.Content.Headers.ContentLength ?? update.InstallerSize;
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        long written = 0;
        await using (var input = await response.Content.ReadAsStreamAsync(ct))
        await using (var output = File.Create(path))
        {
            var buffer = new byte[81920];
            int read;
            while ((read = await input.ReadAsync(buffer, ct)) > 0)
            {
                await output.WriteAsync(buffer.AsMemory(0, read), ct);
                hash.AppendData(buffer, 0, read);
                written += read;
                if (total > 0)
                    progress?.Report((double)written / total);
            }
        }

        var actual = Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant();
        bool valid = update.InstallerSha256 is { } expected
            ? actual == expected
            : update.InstallerSize <= 0 || written == update.InstallerSize;
        if (!valid)
        {
            File.Delete(path);
            throw new InvalidDataException("The downloaded installer doesn't match the release (SHA-256).");
        }
        return path;
    }

    /// <summary>
    /// Runs the installer silently in the current install mode. It waits for this process to exit (/waitpid, so
    /// the app's files are free), installs, and restarts the app (/relaunch). Its log goes next to the download.
    /// </summary>
    public static void StartInstaller(string installer)
    {
        var log = Path.Combine(Path.GetDirectoryName(installer)!, "setup.log");
        Process.Start(new ProcessStartInfo(installer)
        {
            // Shell execute lets an all-users install ask for elevation.
            UseShellExecute = true,
            Arguments = $"/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /CLOSEAPPLICATIONS {(IsAllUsersInstall() ? "/ALLUSERS" : "/CURRENTUSER")} " +
                        $"/waitpid={Environment.ProcessId} /relaunch=1 /LOG=\"{log}\"",
        });
    }

    /// <summary>
    /// Installed for all users (under Program Files)? Anything else is a per-user install, which never needs
    /// elevation. Paths are compared with short names expanded ("C:\Users\JONATH~1" vs "C:\Users\Jonathan Chen").
    /// </summary>
    public static bool IsAllUsersInstall()
    {
        var dir = Native.LongPath(AppContext.BaseDirectory).TrimEnd('\\') + "\\";
        foreach (var folder in new[] { Environment.SpecialFolder.ProgramFiles, Environment.SpecialFolder.ProgramFilesX86 })
        {
            var root = Environment.GetFolderPath(folder);
            if (root.Length > 0 && dir.StartsWith(Native.LongPath(root).TrimEnd('\\') + "\\", StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }
}

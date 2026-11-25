using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace DisneyPlusDesktop;

internal static class AppPaths
{
    /// <summary>Data folder; DPD_DATA_DIR overrides it (portable use / testing).</summary>
    public static readonly string Root =
        Environment.GetEnvironmentVariable("DPD_DATA_DIR") is { Length: > 0 } custom
            ? Path.GetFullPath(custom)
            : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "DisneyPlusDesktop");

    /// <summary>WebView2 profile (cookies / login).</summary>
    public static string UserData => Path.Combine(Root, "WebView2");

    public static string SettingsFile => Path.Combine(Root, "settings.json");
}

internal sealed class AppSettings
{
    /// <summary>Restore bounds as [x, y, width, height].</summary>
    public int[]? Bounds { get; set; }
    public bool Maximized { get; set; }
    public bool HintShown { get; set; }

    /// <summary>Check GitHub for a newer version automatically (title-bar menu).</summary>
    public bool AutoUpdate { get; set; } = true;

    /// <summary>Subtitle / widescreen settings, owned and validated by player.js.</summary>
    public JsonObject? Player { get; set; }

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public static AppSettings Load()
    {
        try
        {
            if (File.Exists(AppPaths.SettingsFile))
                return JsonSerializer.Deserialize<AppSettings>(File.ReadAllText(AppPaths.SettingsFile)) ?? new();
        }
        catch (Exception ex) when (ex is IOException or JsonException or UnauthorizedAccessException)
        {
            // Corrupt or locked settings: fall back to defaults.
        }
        return new();
    }

    public void Save()
    {
        try
        {
            Directory.CreateDirectory(AppPaths.Root);
            File.WriteAllText(AppPaths.SettingsFile, JsonSerializer.Serialize(this, JsonOptions));
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            // Not fatal: settings just won't be remembered.
        }
    }
}

internal static class EmbeddedFiles
{
    public static string ReadText(string logicalName)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(logicalName)
            ?? throw new FileNotFoundException("Missing embedded resource", logicalName);
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}

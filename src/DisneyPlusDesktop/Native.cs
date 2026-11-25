using System.Runtime.InteropServices;

namespace DisneyPlusDesktop;

internal static partial class Native
{
    public const int WM_SYSCOMMAND = 0x0112;
    public const uint MF_STRING = 0x0000;
    public const uint MF_SEPARATOR = 0x0800;
    public const uint MF_BYCOMMAND = 0x0000;
    public const uint MF_CHECKED = 0x0008;
    public const uint MF_UNCHECKED = 0x0000;

    private const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20;

    [LibraryImport("dwmapi.dll")]
    private static partial int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);

    [LibraryImport("user32.dll")]
    public static partial IntPtr GetSystemMenu(IntPtr hWnd, [MarshalAs(UnmanagedType.Bool)] bool revert);

    [LibraryImport("user32.dll", EntryPoint = "AppendMenuW", StringMarshalling = StringMarshalling.Utf16)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static partial bool AppendMenu(IntPtr hMenu, uint flags, nuint idNewItem, string? newItem);

    [LibraryImport("user32.dll")]
    public static partial uint CheckMenuItem(IntPtr hMenu, uint idCheckItem, uint check);

    public static void UseDarkTitleBar(IntPtr hwnd)
    {
        int on = 1;
        _ = DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, ref on, sizeof(int));
    }

    [LibraryImport("kernel32.dll", EntryPoint = "GetLongPathNameW", StringMarshalling = StringMarshalling.Utf16)]
    private static unsafe partial uint GetLongPathName(string shortPath, char* longPath, uint length);

    /// <summary>The path with 8.3 short names (e.g. "JONATH~1") expanded, so paths compare reliably.</summary>
    public static unsafe string LongPath(string path)
    {
        const int capacity = 32768;
        var buffer = new char[capacity];
        fixed (char* p = buffer)
        {
            uint length = GetLongPathName(path, p, capacity);
            return length > 0 && length < capacity ? new string(buffer, 0, (int)length) : path;
        }
    }
}

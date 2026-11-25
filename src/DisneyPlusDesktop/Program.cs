using System.Diagnostics;
using Microsoft.Web.WebView2.Core;

namespace DisneyPlusDesktop;

internal static class Program
{
    private const string WebView2DownloadUrl = "https://go.microsoft.com/fwlink/p/?LinkId=2124703";

    [STAThread]
    private static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        try
        {
            CoreWebView2Environment.GetAvailableBrowserVersionString();
        }
        catch (WebView2RuntimeNotFoundException)
        {
            var answer = MessageBox.Show(Strings.NoWebView2, "Disney+", MessageBoxButtons.YesNo, MessageBoxIcon.Warning,
                MessageBoxDefaultButton.Button1, Strings.BoxOptions);
            if (answer == DialogResult.Yes)
                Process.Start(new ProcessStartInfo(WebView2DownloadUrl) { UseShellExecute = true });
            return;
        }

        // Allow "DisneyPlus.exe https://www.disneyplus.com/..." to open a specific page.
        string? startUrl = args.FirstOrDefault(a =>
            Uri.TryCreate(a, UriKind.Absolute, out var u) && u.Scheme == Uri.UriSchemeHttps && MainForm.IsDisneyHost(u));

        Application.Run(new MainForm(startUrl));
    }
}

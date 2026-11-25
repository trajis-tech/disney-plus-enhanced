using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace DisneyPlusDesktop;

internal sealed class MainForm : Form
{
    private const string HomeUrl = "https://www.disneyplus.com/";
    private const string AppTitle = "Disney+";
    private const string SettingsToken = "__DPD_SETTINGS__";
    private const string VersionToken = "__DPD_VERSION__";
    private const int MaxSettingsJsonLength = 4096;

    // System menu command ids (low 4 bits must be zero).
    private const int SysSettings = 0x1000;
    private const int SysWide = 0x1010;
    private const int SysFullscreen = 0x1020;
    private const int SysReload = 0x1030;
    private const int SysHome = 0x1040;
    private const int SysHelp = 0x1050;
    private const int SysCheckUpdates = 0x1060;
    private const int SysAutoUpdate = 0x1070;
    private const int SysAbout = 0x1080;

    // Automatic update checks: shortly after start, then once a day.
    private static readonly TimeSpan FirstUpdateCheck = TimeSpan.FromSeconds(20);
    private static readonly TimeSpan UpdateCheckInterval = TimeSpan.FromHours(24);

    private static readonly string[] HiddenContextMenuItems =
        ["saveAs", "print", "createQrCode", "share", "webCapture", "openLinkInNewWindow"];

    private readonly WebView2 _web;
    private readonly AppSettings _settings;
    private readonly string _startUrl;
    private readonly string _pageScriptTemplate;
    private readonly System.Windows.Forms.Timer _saveTimer = new() { Interval = 400 };

    private CoreWebView2Environment? _env;
    private string? _pageScriptId;
    private bool _wide;
    private bool _userFullscreen;
    private bool _isFullscreen;
    private Rectangle _restoreBounds;
    private FormWindowState _restoreState;
    private IntPtr _systemMenu;
    private string? _lastCommand;
    private long _lastCommandTicks;
    private readonly System.Windows.Forms.Timer _updateTimer = new() { Interval = (int)UpdateCheckInterval.TotalMilliseconds };
    private bool _updateBusy;
    private UpdateInfo? _pendingUpdate;

    public MainForm(string? startUrl)
    {
        _settings = AppSettings.Load();
        _startUrl = startUrl ?? HomeUrl;
        _pageScriptTemplate = EmbeddedFiles.ReadText("player.js");
        _wide = _settings.Player?["wide"]?.GetValueKind() == JsonValueKind.True;
        _saveTimer.Tick += async (_, _) => await PersistPlayerSettingsAsync();

        Text = AppTitle;
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        BackColor = Color.Black;
        MinimumSize = new Size(640, 400);
        KeyPreview = true;
        ApplySavedBounds();

        _web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.Black };
        Controls.Add(_web);

        Shown += async (_, _) => await InitializeAsync();
    }

    public static bool IsDisneyHost(Uri uri)
    {
        if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp)
            return false;
        var host = uri.Host;
        return host == "disneyplus.com" || host.EndsWith(".disneyplus.com", StringComparison.OrdinalIgnoreCase);
    }

    private static void OpenExternal(Uri uri)
    {
        if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeMailto)
            return;
        try
        {
            Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
        }
        catch (System.ComponentModel.Win32Exception)
        {
            // No default browser registered.
        }
    }

    // ------------------------------------------------------------------ startup

    private async Task InitializeAsync()
    {
        try
        {
            _env = await CoreWebView2Environment.CreateAsync(null, AppPaths.UserData);
            await _web.EnsureCoreWebView2Async(_env);
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, Strings.StartFailed + "\n" + ex.Message, AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error,
                MessageBoxDefaultButton.Button1, Strings.BoxOptions);
            Close();
            return;
        }

        var core = _web.CoreWebView2;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.IsPasswordAutosaveEnabled = true;
        core.Settings.IsGeneralAutofillEnabled = true;

        // The title bar always reads "Disney+" (set in the constructor), not the changing page title.
        core.ContainsFullScreenElementChanged += (_, _) => UpdateFullscreen();
        core.NewWindowRequested += OnNewWindowRequested;
        core.WebMessageReceived += OnWebMessageReceived;
        core.ContextMenuRequested += OnContextMenuRequested;
        core.ProcessFailed += OnProcessFailed;
        core.NavigationCompleted += OnNavigationCompleted;

        core.SourceChanged += (_, _) => ShowPendingUpdate();

        _pageScriptId = await core.AddScriptToExecuteOnDocumentCreatedAsync(BuildPageScript());
        core.Navigate(_startUrl);

        _updateTimer.Tick += async (_, _) => await CheckForUpdatesAsync(manual: false);
        _updateTimer.Start();
        await Task.Delay(Updater.TestVersion is null ? FirstUpdateCheck : TimeSpan.FromSeconds(5));
        await CheckForUpdatesAsync(manual: false);
    }

    /// <summary>player.js with the saved settings and the app version baked in (re-registered whenever they change).</summary>
    private string BuildPageScript() =>
        _pageScriptTemplate
            .Replace(SettingsToken, _settings.Player?.ToJsonString() ?? "null")
            .Replace(VersionToken, JsonSerializer.Serialize(AppVersion.Display));

    private async Task PersistPlayerSettingsAsync()
    {
        _saveTimer.Stop();
        _settings.Save();

        var core = _web.CoreWebView2;
        if (core is null)
            return;
        // New documents (reloads, new tabs of the SPA) start with the latest settings.
        if (_pageScriptId is not null)
            core.RemoveScriptToExecuteOnDocumentCreated(_pageScriptId);
        _pageScriptId = await core.AddScriptToExecuteOnDocumentCreatedAsync(BuildPageScript());
    }

    private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        var core = _web.CoreWebView2;
        if (core.Source == "about:blank")
        {
            core.Navigate(_startUrl);
            return;
        }
        if (!e.IsSuccess || _settings.HintShown ||
            !Uri.TryCreate(core.Source, UriKind.Absolute, out var source) || !IsDisneyHost(source))
            return;
        _settings.HintShown = true;
        _settings.Save();
        RunPageApi("showHelp(9000)");
    }

    // ------------------------------------------------------------------ commands

    private void RunCommand(string? command)
    {
        // The same key can reach us from both the page script and WinForms key handling.
        long now = Environment.TickCount64;
        if (command == _lastCommand && now - _lastCommandTicks < 300)
            return;
        _lastCommand = command;
        _lastCommandTicks = now;

        switch (command)
        {
            case "settings": RunPageApi("toggleSettings()"); break;
            case "wide": RunPageApi("toggleWide()"); break;
            case "fullscreen": ToggleFullscreen(); break;
            case "help": RunPageApi("showHelp()"); break;
            case "reload": _web.CoreWebView2?.Reload(); break;
            case "home": _web.CoreWebView2?.Navigate(HomeUrl); break;
            case "checkUpdates": _ = CheckForUpdatesAsync(manual: true); break;
            case "autoUpdate":
                _settings.AutoUpdate = !_settings.AutoUpdate;
                _settings.Save();
                UpdateSystemMenuChecks();
                break;
            case "about": ShowAbout(); break;
        }
    }

    // ------------------------------------------------------------------ version and updates

    private void ShowAbout()
    {
        var project = new TaskDialogButton(Strings.ProjectPage);
        var page = new TaskDialogPage
        {
            Caption = Strings.MenuAbout,
            Heading = "Disney+ Desktop",
            Text = Strings.VersionLine(AppVersion.Display) + "\n\n" + Strings.AboutDescription,
            Icon = Icon is null ? TaskDialogIcon.Information : new TaskDialogIcon(Icon),
            Buttons = { project, TaskDialogButton.OK },
            AllowCancel = true, // Esc / the close button work
            RightToLeftLayout = Strings.RightToLeft,
        };
        if (TaskDialog.ShowDialog(this, page) == project)
            OpenExternal(new Uri(Updater.ProjectPage));
    }

    private void ShowMessage(string text, TaskDialogIcon icon) =>
        TaskDialog.ShowDialog(this, new TaskDialogPage
        {
            Caption = "Disney+ Desktop",
            Text = text,
            Icon = icon,
            Buttons = { TaskDialogButton.OK },
            AllowCancel = true, // Esc / the close button work
            RightToLeftLayout = Strings.RightToLeft,
        });

    private bool IsInPlayer() =>
        Uri.TryCreate(_web.CoreWebView2?.Source, UriKind.Absolute, out var uri) &&
        (uri.AbsolutePath.Contains("/play/", StringComparison.OrdinalIgnoreCase) ||
         uri.AbsolutePath.Contains("/video/", StringComparison.OrdinalIgnoreCase));

    /// <summary>Checks GitHub for a newer release. Automatic checks never interrupt a video: they wait until the player is left.</summary>
    private async Task CheckForUpdatesAsync(bool manual)
    {
        if (_updateBusy || (!manual && !_settings.AutoUpdate && Updater.TestVersion is null))
            return;
        _updateBusy = true;
        try
        {
            UpdateInfo? update;
            try
            {
                update = await Updater.CheckAsync(CancellationToken.None);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException
                                           or KeyNotFoundException or InvalidOperationException)
            {
                if (manual)
                    ShowMessage(Strings.CheckFailed, TaskDialogIcon.Warning);
                return;
            }

            if (update is null)
            {
                if (manual)
                    ShowMessage(Strings.UpToDate(AppVersion.Format(Updater.Running)), TaskDialogIcon.Information);
                return;
            }
            if (!manual && IsInPlayer())
            {
                _pendingUpdate = update;
                return;
            }
            OfferUpdate(update);
        }
        finally
        {
            _updateBusy = false;
        }
    }

    private void ShowPendingUpdate()
    {
        if (_pendingUpdate is not { } update || IsInPlayer() || _updateBusy)
            return;
        _pendingUpdate = null;
        BeginInvoke(() => OfferUpdate(update));
    }

    /// <summary>Asks to update; installed copies then download, check and install the update and restart.</summary>
    private void OfferUpdate(UpdateInfo update)
    {
        var current = AppVersion.Format(Updater.Running);
        if (!Updater.IsInstalled || update.InstallerUrl is null)
        {
            var open = new TaskDialogButton(Strings.DownloadPage);
            var portable = new TaskDialogPage
            {
                Caption = "Disney+ Desktop",
                Heading = Strings.UpdateTitle(update.Display),
                Text = Strings.UpdatePortable(current),
                Icon = TaskDialogIcon.Information,
                Buttons = { open, new TaskDialogButton(Strings.Later) },
                DefaultButton = open,
                AllowCancel = true, // Esc / the close button work
            RightToLeftLayout = Strings.RightToLeft,
            };
            if (TaskDialog.ShowDialog(this, portable) == open)
                OpenExternal(new Uri(update.PageUrl));
            return;
        }

        string? installer = null;
        Exception? error = null;
        bool cancelled = false;
        using var cts = new CancellationTokenSource();
        var bar = new TaskDialogProgressBar { Minimum = 0, Maximum = 100 };
        var cancel = TaskDialogButton.Cancel;
        cancel.Click += (_, _) => { cancelled = true; cts.Cancel(); };
        var downloading = new TaskDialogPage
        {
            Caption = "Disney+ Desktop",
            Heading = Strings.Downloading,
            Text = Strings.UpdateTitle(update.Display),
            ProgressBar = bar,
            Buttons = { cancel },
            AllowCancel = true, // Esc / the close button work
            RightToLeftLayout = Strings.RightToLeft,
        };
        downloading.Created += async (_, _) =>
        {
            try
            {
                installer = await Updater.DownloadInstallerAsync(update,
                    new Progress<double>(p => bar.Value = (int)Math.Clamp(p * 100, 0, 100)), cts.Token);
            }
            catch (Exception ex)
            {
                error = ex;
            }
            downloading.BoundDialog?.Close();
        };

        var updateNow = new TaskDialogButton(Strings.UpdateNow) { AllowCloseDialog = false };
        var prompt = new TaskDialogPage
        {
            Caption = "Disney+ Desktop",
            Heading = Strings.UpdateTitle(update.Display),
            Text = Strings.UpdateInstalled(current),
            Icon = TaskDialogIcon.Information,
            Buttons = { updateNow, new TaskDialogButton(Strings.Later) },
            DefaultButton = updateNow,
            AllowCancel = true, // Esc / the close button work
            RightToLeftLayout = Strings.RightToLeft,
        };
        updateNow.Click += (_, _) => prompt.Navigate(downloading);

        TaskDialog.ShowDialog(this, prompt);
        if (installer is null)
            cts.Cancel(); // closed before the download finished: stop it
        if (cancelled || installer is null)
        {
            if (!cancelled && error is not null and not OperationCanceledException)
                ShowMessage($"{Strings.UpdateFailed}\n{error.Message}", TaskDialogIcon.Error);
            return;
        }

        try
        {
            Updater.StartInstaller(installer);
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or InvalidOperationException)
        {
            // E.g. the elevation prompt for an all-users install was declined.
            ShowMessage($"{Strings.UpdateFailed}\n{ex.Message}", TaskDialogIcon.Error);
            return;
        }
        Close();
    }

    private void RunPageApi(string call) =>
        _ = _web.CoreWebView2?.ExecuteScriptAsync($"window.__dpd && window.__dpd.{call}");

    private void ToggleFullscreen()
    {
        var core = _web.CoreWebView2;
        if (core is not null && core.ContainsFullScreenElement)
        {
            // Leave the player's own fullscreen; ContainsFullScreenElementChanged restores the window.
            _userFullscreen = false;
            _ = core.ExecuteScriptAsync("document.exitFullscreen && document.exitFullscreen()");
            return;
        }
        _userFullscreen = !_userFullscreen;
        UpdateFullscreen();
    }

    private void UpdateFullscreen()
    {
        bool want = _userFullscreen || (_web.CoreWebView2?.ContainsFullScreenElement ?? false);
        if (want == _isFullscreen)
            return;
        _isFullscreen = want;

        SuspendLayout();
        if (want)
        {
            _restoreState = WindowState;
            _restoreBounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
            if (WindowState != FormWindowState.Normal)
                WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.None;
            Bounds = Screen.FromControl(this).Bounds;
        }
        else
        {
            FormBorderStyle = FormBorderStyle.Sizable;
            Bounds = _restoreBounds;
            WindowState = _restoreState == FormWindowState.Minimized ? FormWindowState.Normal : _restoreState;
        }
        ResumeLayout();
        UpdateSystemMenuChecks();
    }

    // ------------------------------------------------------------------ WebView2 events

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        if (!Uri.TryCreate(e.Source, UriKind.Absolute, out var source) || !IsDisneyHost(source))
            return;
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                return;

            if (root.TryGetProperty("cmd", out var cmd) && cmd.ValueKind == JsonValueKind.String)
            {
                RunCommand(cmd.GetString());
            }
            else if (root.TryGetProperty("settings", out var player) && player.ValueKind == JsonValueKind.Object)
            {
                var json = player.GetRawText();
                if (json.Length <= MaxSettingsJsonLength && JsonNode.Parse(json) is JsonObject obj)
                {
                    _settings.Player = obj;
                    _saveTimer.Stop();
                    _saveTimer.Start();
                }
            }
            else if (root.TryGetProperty("state", out var state) && state.ValueKind == JsonValueKind.Object &&
                     state.TryGetProperty("wide", out var wide))
            {
                _wide = wide.ValueKind == JsonValueKind.True;
                UpdateSystemMenuChecks();
            }
        }
        catch (JsonException)
        {
            // Ignore malformed messages.
        }
    }

    private void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;
        if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri))
            return;
        if (IsDisneyHost(uri))
            _web.CoreWebView2.Navigate(uri.AbsoluteUri);
        else
            OpenExternal(uri);
    }

    private void OnContextMenuRequested(object? sender, CoreWebView2ContextMenuRequestedEventArgs e)
    {
        if (_env is null)
            return;

        var items = e.MenuItems;
        for (int i = items.Count - 1; i >= 0; i--)
        {
            if (HiddenContextMenuItems.Contains(items[i].Name))
                items.RemoveAt(i);
        }

        var custom = new List<CoreWebView2ContextMenuItem>
        {
            MenuItem($"{Strings.MenuStyle}  (Ctrl+Shift+S)", CoreWebView2ContextMenuItemKind.Command, false, "settings"),
            MenuItem($"{Strings.MenuWide}  (Ctrl+Shift+W)", CoreWebView2ContextMenuItemKind.CheckBox, _wide, "wide"),
            MenuItem($"{(_isFullscreen ? Strings.MenuExitFullscreen : Strings.MenuFullscreen)}  (F11)", CoreWebView2ContextMenuItemKind.Command, false, "fullscreen"),
            _env.CreateContextMenuItem("", null, CoreWebView2ContextMenuItemKind.Separator),
        };
        for (int i = custom.Count - 1; i >= 0; i--)
            items.Insert(0, custom[i]);
    }

    private CoreWebView2ContextMenuItem MenuItem(string label, CoreWebView2ContextMenuItemKind kind, bool isChecked, string command)
    {
        var item = _env!.CreateContextMenuItem(label, null, kind);
        if (kind == CoreWebView2ContextMenuItemKind.CheckBox)
            item.IsChecked = isChecked;
        item.CustomItemSelected += (_, _) => BeginInvoke(() => RunCommand(command));
        return item;
    }

    private void OnProcessFailed(object? sender, CoreWebView2ProcessFailedEventArgs e)
    {
        switch (e.ProcessFailedKind)
        {
            case CoreWebView2ProcessFailedKind.BrowserProcessExited:
                MessageBox.Show(this, Strings.Crashed, AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error,
                    MessageBoxDefaultButton.Button1, Strings.BoxOptions);
                Close();
                break;
            case CoreWebView2ProcessFailedKind.RenderProcessExited:
                _web.CoreWebView2?.Reload();
                break;
        }
    }

    // ------------------------------------------------------------------ window chrome

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        Native.UseDarkTitleBar(Handle);

        _systemMenu = Native.GetSystemMenu(Handle, false);
        if (_systemMenu == IntPtr.Zero)
            return;
        Native.AppendMenu(_systemMenu, Native.MF_SEPARATOR, 0, null);
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysSettings, $"{Strings.MenuStyle}\tCtrl+Shift+S");
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysWide, $"{Strings.MenuWide}\tCtrl+Shift+W");
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysFullscreen, $"{Strings.MenuFullscreen}\tF11");
        Native.AppendMenu(_systemMenu, Native.MF_SEPARATOR, 0, null);
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysReload, $"{Strings.MenuReload}\tF5");
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysHome, Strings.MenuHome);
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysHelp, $"{Strings.MenuHelp}\tF1");
        Native.AppendMenu(_systemMenu, Native.MF_SEPARATOR, 0, null);
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysCheckUpdates, Strings.MenuCheckUpdates);
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysAutoUpdate, Strings.MenuAutoUpdate);
        Native.AppendMenu(_systemMenu, Native.MF_STRING, SysAbout, Strings.MenuAbout);
        UpdateSystemMenuChecks();
    }

    private void UpdateSystemMenuChecks()
    {
        if (_systemMenu == IntPtr.Zero)
            return;
        Native.CheckMenuItem(_systemMenu, SysWide, Native.MF_BYCOMMAND | (_wide ? Native.MF_CHECKED : Native.MF_UNCHECKED));
        Native.CheckMenuItem(_systemMenu, SysFullscreen, Native.MF_BYCOMMAND | (_isFullscreen ? Native.MF_CHECKED : Native.MF_UNCHECKED));
        Native.CheckMenuItem(_systemMenu, SysAutoUpdate, Native.MF_BYCOMMAND | (_settings.AutoUpdate ? Native.MF_CHECKED : Native.MF_UNCHECKED));
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == Native.WM_SYSCOMMAND)
        {
            string? command = (int)(m.WParam.ToInt64() & 0xFFF0) switch
            {
                SysSettings => "settings",
                SysWide => "wide",
                SysFullscreen => "fullscreen",
                SysReload => "reload",
                SysHome => "home",
                SysHelp => "help",
                SysCheckUpdates => "checkUpdates",
                SysAutoUpdate => "autoUpdate",
                SysAbout => "about",
                _ => null,
            };
            if (command is not null)
            {
                RunCommand(command);
                return;
            }
        }
        base.WndProc(ref m);
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        string? command = keyData switch
        {
            Keys.F11 => "fullscreen",
            Keys.F1 => "help",
            Keys.Control | Keys.Shift | Keys.W => "wide",
            Keys.Control | Keys.Shift | Keys.S => "settings",
            _ => null,
        };
        if (command is null)
            return base.ProcessCmdKey(ref msg, keyData);
        RunCommand(command);
        return true;
    }

    // ------------------------------------------------------------------ window position

    private void ApplySavedBounds()
    {
        StartPosition = FormStartPosition.Manual;
        var saved = _settings.Bounds is { Length: 4 } b ? new Rectangle(b[0], b[1], b[2], b[3]) : Rectangle.Empty;
        bool visible = saved.Width >= 640 && saved.Height >= 400 &&
                       Screen.AllScreens.Any(s => s.WorkingArea.IntersectsWith(saved));
        if (visible)
        {
            Bounds = saved;
        }
        else
        {
            var area = Screen.PrimaryScreen?.WorkingArea ?? new Rectangle(0, 0, 1600, 900);
            var size = new Size(Math.Min(LogicalToDeviceUnits(1280), area.Width - 80),
                Math.Min(LogicalToDeviceUnits(760), area.Height - 80));
            Bounds = new Rectangle(area.Left + (area.Width - size.Width) / 2, area.Top + (area.Height - size.Height) / 2,
                size.Width, size.Height);
        }
        if (_settings.Maximized)
            WindowState = FormWindowState.Maximized;
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        _saveTimer.Stop();
        _updateTimer.Stop();
        var bounds = _isFullscreen ? _restoreBounds : WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
        var state = _isFullscreen ? _restoreState : WindowState;
        _settings.Bounds = [bounds.X, bounds.Y, bounds.Width, bounds.Height];
        _settings.Maximized = state == FormWindowState.Maximized;
        _settings.Save();
        base.OnFormClosing(e);
    }
}

English | [繁體中文](README.zh-TW.md)

**Download the latest version:** [Installer (DisneyPlus-Setup.exe)](https://github.com/trajis-tech/disney-plus-enhanced/releases/latest/download/DisneyPlus-Setup.exe) · [Portable (DisneyPlus.exe)](https://github.com/trajis-tech/disney-plus-enhanced/releases/latest/download/DisneyPlus.exe) · [All releases](https://github.com/trajis-tech/disney-plus-enhanced/releases)

# Disney+ Desktop

A Windows desktop app that wraps the Disney+ website (disneyplus.com) and adds:

- Netflix-style subtitle styling
- Playback speed
- Widescreen fill for 21:9 monitors
- 1080p and 4K HDR playback where the PC supports it

Everything lives inside the player's own **Settings** menu. No browser extensions are needed.

> **Availability has only been verified with a Taiwan Disney+ account.** Disney+ runs different services, plans and content in different countries. Playback, high quality and the quality labels may behave differently with accounts from other regions.

This app is not made by or affiliated with Disney. It plays your own Disney+ subscription through the official website. Disney+ and the Disney+ logo are trademarks of Disney.

## Getting started

1. Download `DisneyPlus-Setup.exe` from [Releases](https://github.com/trajis-tech/disney-plus-enhanced/releases) and run it (or build it yourself, see [Building](#building)). The wizard follows the Windows display language.
   - The files aren't code-signed, so Windows SmartScreen may warn the first time: choose **More info → Run anyway**.
   - By default the app installs for the current user (`%LOCALAPPDATA%\Programs\Disney+ Desktop`, no admin rights needed); the first dialog can switch to all users.
   - It adds a **Disney+** shortcut to the Start menu and, optionally, the desktop.
   - It's listed as **Disney+ Desktop** in Windows Settings → Apps for uninstalling.
2. Sign in to Disney+ the first time. The app remembers your sign-in.
3. While a video plays, open **Settings (⚙)** at the bottom right of the player. It contains:

| Item | What it does |
| --- | --- |
| Subtitles | Disney+'s own subtitle language list |
| Audio Options | Disney+'s own audio language list |
| Subtitle Styling | Disney+'s page, filled with this app's options (see below) |
| Widescreen fill | Click to turn on or off |
| High quality | Click to cycle 1080p → 4K HDR → Off |

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+S` | Open Settings → Subtitle Styling (press again to close) |
| `Ctrl+Shift+W` | Toggle widescreen fill |
| `F11` | Full screen |
| `F5` | Reload |
| `F1` | Help: shortcuts, plus a quality hint when one applies |

The same commands are in the title-bar menu (right-click the title bar or press `Alt+Space`). The title bar always reads "Disney+", whatever page is open.

`DisneyPlus.exe` (also on the Releases page, or `dist\DisneyPlus.exe` when you build it) is the same app as a single portable exe: it runs without installing and uses the same sign-in data.

## Version and updates

The title-bar menu (right-click the title bar or press `Alt+Space`) has three items:

| Item | What it does |
| --- | --- |
| About Disney+ Desktop | Shows the version and a link to this project |
| Check for updates… | Checks now |
| Check for updates automatically | On by default; click to turn off or on |

The `F1` help and `__dpd.qualityInfo()` also show the version.

- **Automatic checks:** 20 seconds after the app starts, then every 24 hours. While a video is playing, the app waits until you leave the player before asking.
- **Installed copies:** choose **Update now**. The app then:
  1. Downloads the new installer.
  2. Checks its SHA-256 against the digest GitHub publishes for the release.
  3. Installs it silently, in the same mode as before.
  4. Starts again.

  A current-user install needs no admin rights. An all-users install asks for admin permission (UAC).
- **Portable copy:** the app offers to open the download page instead.
- **Source:** updates come only from this repository's releases.
- **Updating from 1.0.0:** version 1.0.0 has no updater, so install 1.0.1 manually once. Later versions update themselves.

## Subtitle styling

The page keeps the look and components of Disney+'s own Subtitle Styling page; only the options are replaced. Changes apply to the subtitles on screen immediately, show in the preview, and are saved automatically.

| Section | Option | Choices (**bold** = default) |
| --- | --- | --- |
| Text | Size | XS / S / **M** / L / XL: evenly spaced (3.0 %, 3.75 %, 4.5 %, 5.25 %, 6.0 % of the window height), scaling with the window |
| Text | Font | **Sans-serif** / Sans-serif light / Handwriting / Serif / Noto Sans / Noto Serif |
| Text | Color | **White** / Light yellow / Yellow / Light blue / Light green / Black |
| Text | Effect | **Soft shadow** / Drop shadow / Outline / None |
| Background | Opacity | **None** / Semi-transparent / Opaque |
| Position | Height | **Low** / Middle / High |

- **Defaults:** like Netflix. White sans-serif text, soft shadow, no background, close to the bottom of the picture.
- **Position:** subtitles sit at the bottom of Disney+'s subtitle area. They drop close to the bottom edge while the controls are hidden, and move up out of the way when the controls appear. Subtitles that Disney+ deliberately places at the top (for example, translations of on-screen text) stay at the top: close to the top edge while the controls are hidden, and below the top controls when they appear.
- **Noto Sans / Noto Serif:** these fonts cover every script. The app only uses copies already installed on the PC and never downloads fonts; without them, the system fonts are used.
- **Contrast:** shadows, outlines and the background always contrast with the text color. Light text gets black effects; black text gets white ones.
- **One set of settings:** Disney+'s own subtitle style settings are fully replaced, so two sets never conflict.

## High quality (1080p / 4K HDR)

**High quality** in the Settings menu cycles **1080p (default) → 4K HDR → Off**. The menu shows the status and the resolution actually playing, for example "4K HDR · 2160p" or "1080p · no HDCP · 480p".

| Level | How | Requirements |
| --- | --- | --- |
| 1080p | Uses the Edge PlayReady profile built into Disney+'s own player (H.264) | Graphics with hardware DRM (PlayReady SL3000); HDCP 1.4 on the display connection |
| 4K HDR | As 1080p, plus HEVC/HDR10, and asks Disney+ for its HEVC HDR10 stream | The above plus HDCP 2.2 and HEVC 10-bit decoding. A Disney+ plan that includes 4K, and a title that has a 4K version. Windows HDR turned on to see real HDR |
| Off | Disney+'s default playback (Widevine, up to 720p) | — |

- **Checked automatically.** The app checks the requirements at startup and stays at default playback when they are not met. Remote desktop, for example, has no HDCP.
- **Steps down automatically.** If the hardware DRM output fails, a licence or its keys are refused, the picture doesn't advance within 40 seconds, or licences keep being renewed, the app drops one level (4K HDR → 1080p → default) and says so. The same tab doesn't retry.
- **No reload when 1080p fails.** Disney+'s player switches to software DRM by itself and continues at 720p from the same position. The app follows that step down. Asking for 1080p again would get the licence refused and end in Disney+ error 83.
- **Hardware DRM only.** Disney+ licenses software PlayReady for 720p at most, so 1080p and above always need hardware DRM.
- **Failures are remembered.** A hardware DRM output failure repeats every time, so the app remembers it for that graphics adapter for 7 days and plays at default quality without retrying on every launch. After fixing the cause (for example a driver update), click **High quality** in the menu once to retry immediately.
- **No DRM circumvention.** The app doesn't decrypt anything or fake HDCP or licences. Disney+'s licence servers and the PC's DRM decide what plays.
- **Screenshots** of hardware-DRM playback come out black.

Example from the Taiwan account used for testing: with the monitor on Intel UHD Graphics 770 (HDR monitor, HDCP 2.2), *Avengers: Infinity War* played at 3840×2160 in HEVC HDR10.

### Built-in hints

When the PC can't reach the chosen quality, the app shows the reason and what helps. The hint appears in the middle of the window once per launch when a video starts, closes by itself, and is also included in the `F1` help.

| Situation | Hint |
| --- | --- |
| The graphics card fails Disney+'s output protection (`0x8004CD22`) | Known NVIDIA RTX 50-series driver issue. If the CPU has integrated graphics, connect the monitor to the motherboard's video output. After a driver update, choose High quality again |
| No hardware PlayReady | The graphics don't support hardware DRM, so the maximum is 720p |
| No HDCP | Remote desktop, capture cards, splitters and some docks cause this: connect the monitor directly |
| 4K HDR without HDCP 2.2 | Use a monitor, cable and port that support HDCP 2.2 (1080p is used meanwhile) |
| 4K HDR without HEVC 10-bit decoding | Update the graphics driver or install "HEVC Video Extensions" from the Microsoft Store |
| 4K HDR on a display without HDR | Turn on Windows HDR: Settings → System → Display → Use HDR |

### Hardware DRM output failure (`0x8004CD22`) and NVIDIA RTX 50

`0x8004CD22` is `DRM_E_TEE_OUTPUT_PROTECTION_REQUIREMENTS_NOT_MET`: the display output can't meet the protection the licence requires. The cause is on the graphics-driver side, and the app can't work around it.

- **NVIDIA RTX 50 series:** a known driver issue. Hardware PlayReady licences that carry an analog-output restriction fail on every NVIDIA output, and Disney+'s 1080p licences carry that restriction. The same licences play on Intel integrated graphics. NVIDIA tracks the issue internally; there is no fixed driver yet.
- **Workaround:** if the CPU has integrated graphics, connect the monitor to the motherboard's video output. Verified: an RTX 5070 Ti PC moved to Intel UHD Graphics 770 played 1080p and 4K HDR. Games can still run on the NVIDIA card: in Settings → System → Display → Graphics, set them to "High performance".
- **Otherwise, try:** updating the graphics driver, unplugging other monitors and turning off virtual displays, and connecting the monitor directly (no dock, KVM or capture card).

### Quality labels

The Disney+ website labels every title "HD" at most under its title, whatever the title offers. The app labels titles by what this PC can really play:

| Situation | Label (under the title and in the Details tab) |
| --- | --- |
| High quality set to 4K HDR, and this PC can play it (requirements met, no step-down) | "4K Ultra HD" for titles with a 4K version, plus "HDR10" on an HDR display |
| Anything else | "HD" |

- **Removed labels:** Dolby Vision, 3D, Dolby Atmos, DTS:X and 5.1 never reach the website player (4K plays as HDR10; audio is stereo AAC), so those labels are removed.
- **When labels update:** after changing High quality or a step-down, reopen the page to update its labels.

### Diagnostics

While a video plays, press `F12`, open the Console and run:

```js
copy(JSON.stringify(__dpd.qualityInfo(), null, 1))
```

The result is copied to the clipboard. It includes:

- The app version (`appVersion`)
- Hardware PlayReady and HDCP status
- The level in use and whether the player capped quality itself (`playerCappedQuality`)
- Why each level failed (`failures`) and any remembered hardware failure (`hardwareDrmBlocked`)
- The current hint (`tip`) and UI language (`language`)
- The resolution playing
- The graphics adapter, screen resolution, HDR display and HEVC support

## Playback speed

The speed button (gauge icon) sits to the left of Settings (⚙) at the bottom right of the player. Its look and steps follow Netflix.

- The button opens a Playback speed panel with five steps: 0.5x / 0.75x / 1x (Normal) / 1.25x / 1.5x.
- Choose with the mouse or the arrow keys.
- Pitch is preserved and subtitles stay in sync.
- The speed stays for the whole player session, including the next episode, and resets to 1x when you leave the player.
- Only one panel is open at a time: opening the speed panel closes Disney+'s Settings menu.

## Languages

The app's text follows the Disney+ UI language. It supports every UI language that disneyplus.com offers:

| Group | Languages |
| --- | --- |
| East Asian | Chinese (Traditional, including Hong Kong; Simplified), Japanese, Korean |
| Western European | English, Spanish (Spain, Latin America), French, German, Italian, Portuguese (Brazil, Portugal), Dutch |
| Nordic | Swedish, Danish, Norwegian, Finnish |
| Central and Eastern European | Polish, Czech, Slovak, Hungarian, Romanian, Croatian, Greek, Turkish |
| Southeast Asian | Thai, Indonesian, Malay |
| Right-to-left | Arabic, Hebrew |

- **Not included:** languages only offered by Disney+ Hotstar don't apply, because this app only works with disneyplus.com.
- **Disney+'s own names:** names of Disney+ controls (for example "Settings" and "Subtitle Styling") use Disney+'s official wording from its public UI dictionary, including regional variants such as Latin American Spanish. Hints therefore match what the player shows.
- **Right-to-left:** in Arabic and Hebrew, the hints and the speed panel run right to left, and the arrow keys follow the reading direction.
- **Fonts:** subtitle fonts prefer the UI language's own fonts, for example Yu Gothic / Yu Mincho for Japanese and Leelawadee UI for Thai.
- **Window text:** the title-bar menu, context menu and error dialogs follow the Windows display language instead, with the same set of languages.

> Translations other than Traditional Chinese were written for this app and have not been reviewed by native speakers.

## Widescreen fill

The zoom is calculated from the window's shape, so a 2.39:1 film fills a 21:9 monitor without side bars. The top and bottom are cropped slightly.

- No zoom on 16:9 monitors.
- Never zooms past a 2.39:1 crop.
- Only the playing video is zoomed, never the trailers on browse pages.
- Re-applied automatically when the episode changes.

## Requirements

- Windows 10/11 x64.
- Microsoft Edge WebView2 Runtime. It's built into Windows 11; the app offers the download page when it's missing.
- .NET is bundled in the exe; nothing else to install.

## Data location

`%LOCALAPPDATA%\DisneyPlusDesktop\`

- `WebView2\`: sign-in data and cookies.
- `settings.json`: window position, subtitle style, widescreen fill and quality settings.

Uninstalling keeps this folder, so reinstalling doesn't need a new sign-in. To sign out or reset, close the app and delete the folder. Set the environment variable `DPD_DATA_DIR` to use another folder (for example, a portable setup).

## Building

```powershell
.\build.ps1
```

- Needs the .NET 10 SDK. Outputs the portable `dist\DisneyPlus.exe`.
- With Inno Setup 6 installed (`winget install JRSoftware.InnoSetup`), also outputs the installer `dist\DisneyPlus-Setup.exe`.
- The version comes from `<Version>` in `DisneyPlusDesktop.csproj`. Raise it for every release: the updater only offers a release with a higher version.
- Publish the release with the tag `v<version>` and both files attached under these exact names. The "latest" download links and the updater rely on them.

| File | Contents |
| --- | --- |
| `src\DisneyPlusDesktop\player.js` | Injected into the Disney+ page: subtitle styling, Settings menu integration, widescreen fill, playback speed, high quality, quality labels, hints, translations |
| `src\DisneyPlusDesktop\MainForm.cs` | Window, WebView2, full screen, menus, shortcuts, saving settings |
| `src\DisneyPlusDesktop\Strings.cs` | Window text in every supported language |
| `src\DisneyPlusDesktop\Updater.cs` | Version, update check against GitHub releases, download and SHA-256 check, silent install |
| `src\DisneyPlusDesktop\app.ico` | App icon with rounded corners, made from the Disney+ Windows app icon in disneyplus.com's web app manifest |
| `installer\DisneyPlus.iss` | Inno Setup script; `installer\Languages\` holds the Inno Setup translations it doesn't ship with (Chinese, Greek, Romanian, Croatian, Indonesian, Malay) |

### Implementation notes

- **Subtitles:** styles apply to Disney+'s own subtitle elements: `span.hive-subtitle-renderer-cue` under `.hive-subtitle-renderer-cue-positioning-box`, inside the shadow root of `<timed-text-override-region>`.
- **Settings menu:** reuses Disney+'s `<settings-modal>` dialog.
  - The original form on the Subtitle Styling page (`<caption-settings-view>`) is hidden. A form built from Disney+'s own components replaces it: `caption-preview`, `captions-font-size`, `styled-radio-buttons`, `picker-dots` and `snap-slider`.
  - The main menu (`<main-settings-view>`) gets the Widescreen fill and High quality items.
- **Controls:** Disney+ removes the whole control bar when idle. `Ctrl+Shift+S` first simulates a mouse move to bring it back, then opens Settings.
- **Playback speed button:** Disney+'s player covers itself with a transparent click-to-pause layer (`<pointer-actions>`) that only lets clicks through where its controls are registered.
  - The speed button registers the same way Disney+'s own buttons do: `ui-ptr-exclude-register` sent to the nearest `data-ui-ptr-scope` element.
  - While the pointer is over the speed panel, the app passes that activity on to the player, so the controls and the panel don't hide mid-use.
- **High quality:** the app wraps the Disney+ playback SDK's `createPlaybackSession`.
  - It passes the SDK's own configuration overrides (PlayReady recommendation flow, playlist filtering and resolution).
  - It declares the formats this PC actually decodes.
  - For 4K HDR, it requests the HEVC HDR10 playback scenario.
  - It stops shaping requests as soon as the SDK caps quality itself.
- **Quality labels:** the app rewrites the `audioVisual.flags` lists in Disney+'s explore API responses before the page reads them.

## License

This project's code is released under the [MIT License](LICENSE). The license doesn't cover:

- The Disney+ name and logo (including `app.ico`), which are trademarks of Disney.
- The Inno Setup translations in `installer\Languages\`, which remain under the Inno Setup license and belong to their translators.

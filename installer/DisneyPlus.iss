; Disney+ Desktop installer (Inno Setup 6.7+).
; Built by ..\build.ps1 after publishing dist\DisneyPlus.exe; output: dist\DisneyPlus-Setup-<version>.exe
;
; Installs for the current user by default (no admin rights; %LOCALAPPDATA%\Programs), or for all users when
; chosen in the first dialog. Sign-in data and settings live in %LOCALAPPDATA%\DisneyPlusDesktop and are kept
; on uninstall, like a browser profile.

#define AppExe "DisneyPlus.exe"
#define AppSource "..\dist\" + AppExe
; Version from the exe (set in DisneyPlusDesktop.csproj), as major.minor.patch.
#define VerMajor
#define VerMinor
#define VerPatch
#define VerBuild
#expr GetVersionComponents(AppSource, VerMajor, VerMinor, VerPatch, VerBuild)
#define AppVersion Str(VerMajor) + "." + Str(VerMinor) + "." + Str(VerPatch)

[Setup]
AppId={{8F2C4E61-3B7A-4D5E-9C1F-2A6B8D0E4F73}
AppName=Disney+ Desktop
AppVersion={#AppVersion}
AppVerName=Disney+ Desktop {#AppVersion}
DefaultDirName={autopf}\Disney+ Desktop
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
OutputDir=..\dist
; A fixed name, so ".../releases/latest/download/DisneyPlus-Setup.exe" always gets the newest version.
OutputBaseFilename=DisneyPlus-Setup
SetupIconFile=..\src\DisneyPlusDesktop\app.ico
UninstallDisplayIcon={app}\{#AppExe}
UninstallDisplayName=Disney+ Desktop
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
RestartApplications=no
ShowLanguageDialog=auto
LanguageDetectionMethod=uilanguage
VersionInfoVersion={#AppVersion}
VersionInfoProductName=Disney+ Desktop
VersionInfoDescription=Disney+ Desktop Setup

; The languages disneyplus.com offers (same set as the app).
[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "zhHant"; MessagesFile: "Languages\ChineseTraditional.isl"
Name: "zhHans"; MessagesFile: "Languages\ChineseSimplified.isl"
Name: "ja"; MessagesFile: "compiler:Languages\Japanese.isl"
Name: "ko"; MessagesFile: "compiler:Languages\Korean.isl"
Name: "es"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "fr"; MessagesFile: "compiler:Languages\French.isl"
Name: "de"; MessagesFile: "compiler:Languages\German.isl"
Name: "it"; MessagesFile: "compiler:Languages\Italian.isl"
Name: "ptBR"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "ptPT"; MessagesFile: "compiler:Languages\Portuguese.isl"
Name: "nl"; MessagesFile: "compiler:Languages\Dutch.isl"
Name: "pl"; MessagesFile: "compiler:Languages\Polish.isl"
Name: "tr"; MessagesFile: "compiler:Languages\Turkish.isl"
Name: "sv"; MessagesFile: "compiler:Languages\Swedish.isl"
Name: "da"; MessagesFile: "compiler:Languages\Danish.isl"
Name: "no"; MessagesFile: "compiler:Languages\Norwegian.isl"
Name: "fi"; MessagesFile: "compiler:Languages\Finnish.isl"
Name: "cs"; MessagesFile: "compiler:Languages\Czech.isl"
Name: "sk"; MessagesFile: "compiler:Languages\Slovak.isl"
Name: "hu"; MessagesFile: "compiler:Languages\Hungarian.isl"
Name: "ro"; MessagesFile: "Languages\Romanian.isl"
Name: "hr"; MessagesFile: "Languages\Croatian.isl"
Name: "el"; MessagesFile: "Languages\Greek.isl"
Name: "th"; MessagesFile: "compiler:Languages\Thai.isl"
Name: "id"; MessagesFile: "Languages\Indonesian.isl"
Name: "ms"; MessagesFile: "Languages\Malaysian.isl"
Name: "ar"; MessagesFile: "compiler:Languages\Arabic.isl"
Name: "he"; MessagesFile: "compiler:Languages\Hebrew.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#AppSource}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Disney+"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\Disney+"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "{cm:LaunchProgram,Disney+}"; Flags: nowait postinstall skipifsilent
; Automatic update: the app runs this installer silently with /relaunch=1 and exits; start it again afterwards.
Filename: "{app}\{#AppExe}"; Flags: nowait runasoriginaluser; Check: RelaunchAfterUpdate

[Code]
const
  SYNCHRONIZE = $00100000;

function OpenProcess(dwDesiredAccess: Cardinal; bInheritHandle: BOOL; dwProcessId: Cardinal): THandle;
  external 'OpenProcess@kernel32.dll stdcall';
function WaitForSingleObject(hHandle: THandle; dwMilliseconds: Cardinal): Cardinal;
  external 'WaitForSingleObject@kernel32.dll stdcall';
function CloseHandle(hObject: THandle): BOOL;
  external 'CloseHandle@kernel32.dll stdcall';

// Automatic update: the app passes its process id (/waitpid) and exits; wait up to 30 s for it to close,
// so its files are free before they're replaced.
function InitializeSetup: Boolean;
var
  Pid: Integer;
  Handle: THandle;
begin
  Pid := StrToIntDef(ExpandConstant('{param:waitpid|0}'), 0);
  if Pid > 0 then
  begin
    Handle := OpenProcess(SYNCHRONIZE, False, Pid);
    if Handle <> 0 then
    begin
      WaitForSingleObject(Handle, 30000);
      CloseHandle(Handle);
    end;
  end;
  Result := True;
end;

function RelaunchAfterUpdate: Boolean;
begin
  Result := ExpandConstant('{param:relaunch|0}') = '1';
end;

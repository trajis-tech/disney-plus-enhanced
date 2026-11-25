using System.Globalization;

namespace DisneyPlusDesktop;

/// <summary>
/// Text for the window's own UI (title-bar menu, context menu, error dialogs), following the Windows
/// display language. Text inside the Disney+ page follows the Disney+ language instead (see player.js).
/// The languages are the ones disneyplus.com offers; "style" uses Disney+'s own name for subtitle styling.
/// </summary>
internal static class Strings
{
    private static readonly Dictionary<string, Dictionary<string, string>> Table = new()
    {
        ["en"] = new()
        {
            ["style"] = "Subtitle Styling…", ["wide"] = "Widescreen fill", ["fullscreen"] = "Full screen",
            ["exitFullscreen"] = "Exit full screen", ["reload"] = "Reload", ["home"] = "Disney+ home", ["help"] = "Help",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime was not found, so Disney+ cannot play.\n\nOpen the download page?",
            ["startFailed"] = "Could not start WebView2:", ["crashed"] = "The browser component stopped unexpectedly. Please restart the app.",
        },
        ["zh-Hant"] = new()
        {
            ["style"] = "字幕樣式…", ["wide"] = "寬螢幕填滿", ["fullscreen"] = "全螢幕",
            ["exitFullscreen"] = "離開全螢幕", ["reload"] = "重新整理", ["home"] = "回到 Disney+ 首頁", ["help"] = "說明",
            ["noWebView2"] = "找不到 Microsoft Edge WebView2 Runtime，無法播放 Disney+。\n\n要開啟下載頁面嗎？",
            ["startFailed"] = "無法啟動 WebView2：", ["crashed"] = "瀏覽器元件意外結束，請重新開啟程式。",
        },
        ["zh-Hans"] = new()
        {
            ["style"] = "字幕样式…", ["wide"] = "宽屏填充", ["fullscreen"] = "全屏",
            ["exitFullscreen"] = "退出全屏", ["reload"] = "刷新", ["home"] = "返回 Disney+ 首页", ["help"] = "说明",
            ["noWebView2"] = "找不到 Microsoft Edge WebView2 Runtime，无法播放 Disney+。\n\n要打开下载页面吗？",
            ["startFailed"] = "无法启动 WebView2：", ["crashed"] = "浏览器组件意外退出，请重新打开程序。",
        },
        ["ja"] = new()
        {
            ["style"] = "字幕のスタイル…", ["wide"] = "ワイド表示", ["fullscreen"] = "全画面",
            ["exitFullscreen"] = "全画面を終了", ["reload"] = "再読み込み", ["home"] = "Disney+ ホーム", ["help"] = "ヘルプ",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime が見つからないため、Disney+ を再生できません。\n\nダウンロードページを開きますか？",
            ["startFailed"] = "WebView2 を起動できませんでした：", ["crashed"] = "ブラウザー コンポーネントが予期せず終了しました。アプリを再起動してください。",
        },
        ["ko"] = new()
        {
            ["style"] = "자막 스타일…", ["wide"] = "와이드 화면 채우기", ["fullscreen"] = "전체 화면",
            ["exitFullscreen"] = "전체 화면 종료", ["reload"] = "새로 고침", ["home"] = "Disney+ 홈", ["help"] = "도움말",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime을 찾을 수 없어 Disney+를 재생할 수 없습니다.\n\n다운로드 페이지를 열까요?",
            ["startFailed"] = "WebView2를 시작할 수 없습니다:", ["crashed"] = "브라우저 구성 요소가 예기치 않게 종료되었습니다. 앱을 다시 시작하세요.",
        },
        ["es"] = new()
        {
            ["style"] = "Estilo de los subtítulos…", ["wide"] = "Pantalla ancha", ["fullscreen"] = "Pantalla completa",
            ["exitFullscreen"] = "Salir de pantalla completa", ["reload"] = "Recargar", ["home"] = "Inicio de Disney+", ["help"] = "Ayuda",
            ["noWebView2"] = "No se encontró Microsoft Edge WebView2 Runtime, por lo que Disney+ no puede reproducirse.\n\n¿Abrir la página de descarga?",
            ["startFailed"] = "No se pudo iniciar WebView2:", ["crashed"] = "El componente del navegador se cerró inesperadamente. Reinicia la aplicación.",
        },
        ["fr"] = new()
        {
            ["style"] = "Style des sous-titres…", ["wide"] = "Remplissage grand écran", ["fullscreen"] = "Plein écran",
            ["exitFullscreen"] = "Quitter le plein écran", ["reload"] = "Actualiser", ["home"] = "Accueil Disney+", ["help"] = "Aide",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime est introuvable ; Disney+ ne peut pas être lu.\n\nOuvrir la page de téléchargement ?",
            ["startFailed"] = "Impossible de démarrer WebView2 :", ["crashed"] = "Le composant navigateur s’est arrêté de façon inattendue. Redémarrez l’application.",
        },
        ["de"] = new()
        {
            ["style"] = "Untertitel-Stil…", ["wide"] = "Breitbild füllen", ["fullscreen"] = "Vollbild",
            ["exitFullscreen"] = "Vollbild beenden", ["reload"] = "Neu laden", ["home"] = "Disney+ Startseite", ["help"] = "Hilfe",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime wurde nicht gefunden, daher kann Disney+ nicht abgespielt werden.\n\nDownloadseite öffnen?",
            ["startFailed"] = "WebView2 konnte nicht gestartet werden:", ["crashed"] = "Die Browserkomponente wurde unerwartet beendet. Bitte starte die App neu.",
        },
        ["it"] = new()
        {
            ["style"] = "Stile sottotitoli…", ["wide"] = "Riempimento widescreen", ["fullscreen"] = "Schermo intero",
            ["exitFullscreen"] = "Esci da schermo intero", ["reload"] = "Ricarica", ["home"] = "Home di Disney+", ["help"] = "Guida",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime non è stato trovato, quindi Disney+ non può essere riprodotto.\n\nAprire la pagina di download?",
            ["startFailed"] = "Impossibile avviare WebView2:", ["crashed"] = "Il componente del browser si è chiuso in modo imprevisto. Riavvia l’app.",
        },
        ["pt-BR"] = new()
        {
            ["style"] = "Estilo das legendas…", ["wide"] = "Preenchimento widescreen", ["fullscreen"] = "Tela cheia",
            ["exitFullscreen"] = "Sair da tela cheia", ["reload"] = "Recarregar", ["home"] = "Início do Disney+", ["help"] = "Ajuda",
            ["noWebView2"] = "O Microsoft Edge WebView2 Runtime não foi encontrado, então o Disney+ não pode ser reproduzido.\n\nAbrir a página de download?",
            ["startFailed"] = "Não foi possível iniciar o WebView2:", ["crashed"] = "O componente do navegador parou inesperadamente. Reinicie o aplicativo.",
        },
        ["pt-PT"] = new()
        {
            ["style"] = "Estilo das legendas…", ["wide"] = "Preenchimento de ecrã panorâmico", ["fullscreen"] = "Ecrã inteiro",
            ["exitFullscreen"] = "Sair do ecrã inteiro", ["reload"] = "Recarregar", ["home"] = "Início do Disney+", ["help"] = "Ajuda",
            ["noWebView2"] = "O Microsoft Edge WebView2 Runtime não foi encontrado, por isso o Disney+ não pode ser reproduzido.\n\nAbrir a página de transferência?",
            ["startFailed"] = "Não foi possível iniciar o WebView2:", ["crashed"] = "O componente do browser parou inesperadamente. Reinicie a aplicação.",
        },
        ["nl"] = new()
        {
            ["style"] = "Styling ondertiteling…", ["wide"] = "Breedbeeld vullen", ["fullscreen"] = "Volledig scherm",
            ["exitFullscreen"] = "Volledig scherm afsluiten", ["reload"] = "Opnieuw laden", ["home"] = "Disney+ startpagina", ["help"] = "Help",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime is niet gevonden, dus Disney+ kan niet afspelen.\n\nDownloadpagina openen?",
            ["startFailed"] = "WebView2 kan niet worden gestart:", ["crashed"] = "Het browseronderdeel is onverwacht gestopt. Start de app opnieuw.",
        },
        ["pl"] = new()
        {
            ["style"] = "Styl napisów…", ["wide"] = "Wypełnienie panoramiczne", ["fullscreen"] = "Pełny ekran",
            ["exitFullscreen"] = "Zakończ pełny ekran", ["reload"] = "Odśwież", ["home"] = "Strona główna Disney+", ["help"] = "Pomoc",
            ["noWebView2"] = "Nie znaleziono środowiska Microsoft Edge WebView2 Runtime, więc Disney+ nie może odtwarzać.\n\nOtworzyć stronę pobierania?",
            ["startFailed"] = "Nie można uruchomić WebView2:", ["crashed"] = "Składnik przeglądarki nieoczekiwanie przestał działać. Uruchom aplikację ponownie.",
        },
        ["tr"] = new()
        {
            ["style"] = "Alt Yazı Stili…", ["wide"] = "Geniş ekranı doldur", ["fullscreen"] = "Tam ekran",
            ["exitFullscreen"] = "Tam ekrandan çık", ["reload"] = "Yenile", ["home"] = "Disney+ ana sayfa", ["help"] = "Yardım",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime bulunamadı, bu yüzden Disney+ oynatılamıyor.\n\nİndirme sayfası açılsın mı?",
            ["startFailed"] = "WebView2 başlatılamadı:", ["crashed"] = "Tarayıcı bileşeni beklenmedik şekilde durdu. Lütfen uygulamayı yeniden başlatın.",
        },
        ["sv"] = new()
        {
            ["style"] = "Undertexternas utseende…", ["wide"] = "Fyll bredbild", ["fullscreen"] = "Helskärm",
            ["exitFullscreen"] = "Avsluta helskärm", ["reload"] = "Läs in igen", ["home"] = "Disney+ startsida", ["help"] = "Hjälp",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime hittades inte, så Disney+ kan inte spelas upp.\n\nÖppna nedladdningssidan?",
            ["startFailed"] = "Det gick inte att starta WebView2:", ["crashed"] = "Webbläsarkomponenten avslutades oväntat. Starta om appen.",
        },
        ["da"] = new()
        {
            ["style"] = "Underteksters udseende…", ["wide"] = "Udfyld bredformat", ["fullscreen"] = "Fuld skærm",
            ["exitFullscreen"] = "Afslut fuld skærm", ["reload"] = "Genindlæs", ["home"] = "Disney+ startside", ["help"] = "Hjælp",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime blev ikke fundet, så Disney+ kan ikke afspilles.\n\nÅbn downloadsiden?",
            ["startFailed"] = "WebView2 kunne ikke startes:", ["crashed"] = "Browserkomponenten stoppede uventet. Genstart appen.",
        },
        ["no"] = new()
        {
            ["style"] = "Styling av undertekster…", ["wide"] = "Fyll bredformat", ["fullscreen"] = "Fullskjerm",
            ["exitFullscreen"] = "Avslutt fullskjerm", ["reload"] = "Last inn på nytt", ["home"] = "Disney+ startside", ["help"] = "Hjelp",
            ["noWebView2"] = "Fant ikke Microsoft Edge WebView2 Runtime, så Disney+ kan ikke spilles av.\n\nÅpne nedlastingssiden?",
            ["startFailed"] = "Kunne ikke starte WebView2:", ["crashed"] = "Nettleserkomponenten stoppet uventet. Start appen på nytt.",
        },
        ["fi"] = new()
        {
            ["style"] = "Tekstityksen tyyli…", ["wide"] = "Laajakuvan täyttö", ["fullscreen"] = "Koko näyttö",
            ["exitFullscreen"] = "Poistu koko näytöstä", ["reload"] = "Lataa uudelleen", ["home"] = "Disney+ etusivu", ["help"] = "Ohje",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtimea ei löytynyt, joten Disney+ ei voi toistaa.\n\nAvataanko lataussivu?",
            ["startFailed"] = "WebView2:n käynnistys epäonnistui:", ["crashed"] = "Selainkomponentti pysähtyi odottamatta. Käynnistä sovellus uudelleen.",
        },
        ["cs"] = new()
        {
            ["style"] = "Styl titulků…", ["wide"] = "Vyplnit širokoúhlý obraz", ["fullscreen"] = "Celá obrazovka",
            ["exitFullscreen"] = "Ukončit celou obrazovku", ["reload"] = "Načíst znovu", ["home"] = "Domovská stránka Disney+", ["help"] = "Nápověda",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime nebyl nalezen, takže Disney+ nelze přehrát.\n\nOtevřít stránku pro stažení?",
            ["startFailed"] = "WebView2 se nepodařilo spustit:", ["crashed"] = "Komponenta prohlížeče neočekávaně skončila. Restartujte aplikaci.",
        },
        ["sk"] = new()
        {
            ["style"] = "Štýl titulkov…", ["wide"] = "Vyplniť širokouhlý obraz", ["fullscreen"] = "Celá obrazovka",
            ["exitFullscreen"] = "Ukončiť celú obrazovku", ["reload"] = "Znova načítať", ["home"] = "Domovská stránka Disney+", ["help"] = "Pomocník",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime sa nenašiel, preto Disney+ nemožno prehrať.\n\nOtvoriť stránku na stiahnutie?",
            ["startFailed"] = "WebView2 sa nepodarilo spustiť:", ["crashed"] = "Súčasť prehliadača neočakávane skončila. Reštartujte aplikáciu.",
        },
        ["hu"] = new()
        {
            ["style"] = "Felirat stílusa…", ["wide"] = "Szélesvásznú kitöltés", ["fullscreen"] = "Teljes képernyő",
            ["exitFullscreen"] = "Kilépés a teljes képernyőből", ["reload"] = "Újratöltés", ["home"] = "Disney+ kezdőlap", ["help"] = "Súgó",
            ["noWebView2"] = "A Microsoft Edge WebView2 Runtime nem található, ezért a Disney+ nem játszható le.\n\nMegnyitja a letöltési oldalt?",
            ["startFailed"] = "A WebView2 nem indítható el:", ["crashed"] = "A böngészőösszetevő váratlanul leállt. Indítsa újra az alkalmazást.",
        },
        ["ro"] = new()
        {
            ["style"] = "Stilul subtitrării…", ["wide"] = "Umplere ecran lat", ["fullscreen"] = "Ecran complet",
            ["exitFullscreen"] = "Ieșire din ecran complet", ["reload"] = "Reîncarcă", ["home"] = "Pagina principală Disney+", ["help"] = "Ajutor",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime nu a fost găsit, așa că Disney+ nu poate reda.\n\nDeschizi pagina de descărcare?",
            ["startFailed"] = "WebView2 nu a putut porni:", ["crashed"] = "Componenta browserului s-a oprit neașteptat. Repornește aplicația.",
        },
        ["hr"] = new()
        {
            ["style"] = "Stil titlova…", ["wide"] = "Ispuna širokog zaslona", ["fullscreen"] = "Cijeli zaslon",
            ["exitFullscreen"] = "Izađi iz cijelog zaslona", ["reload"] = "Ponovno učitaj", ["home"] = "Početna stranica Disney+", ["help"] = "Pomoć",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime nije pronađen pa Disney+ ne može reproducirati.\n\nOtvoriti stranicu za preuzimanje?",
            ["startFailed"] = "Pokretanje WebView2 nije uspjelo:", ["crashed"] = "Komponenta preglednika neočekivano se zaustavila. Ponovno pokrenite aplikaciju.",
        },
        ["el"] = new()
        {
            ["style"] = "Στιλ υποτίτλων…", ["wide"] = "Γέμισμα ευρείας οθόνης", ["fullscreen"] = "Πλήρης οθόνη",
            ["exitFullscreen"] = "Έξοδος από πλήρη οθόνη", ["reload"] = "Επαναφόρτωση", ["home"] = "Αρχική Disney+", ["help"] = "Βοήθεια",
            ["noWebView2"] = "Το Microsoft Edge WebView2 Runtime δεν βρέθηκε, οπότε το Disney+ δεν μπορεί να αναπαραχθεί.\n\nΆνοιγμα της σελίδας λήψης;",
            ["startFailed"] = "Δεν ήταν δυνατή η εκκίνηση του WebView2:", ["crashed"] = "Το στοιχείο του προγράμματος περιήγησης σταμάτησε απροσδόκητα. Επανεκκινήστε την εφαρμογή.",
        },
        ["th"] = new()
        {
            ["style"] = "การปรับแต่งคำบรรยาย…", ["wide"] = "เติมเต็มจอกว้าง", ["fullscreen"] = "เต็มจอ",
            ["exitFullscreen"] = "ออกจากโหมดเต็มจอ", ["reload"] = "โหลดใหม่", ["home"] = "หน้าแรก Disney+", ["help"] = "วิธีใช้",
            ["noWebView2"] = "ไม่พบ Microsoft Edge WebView2 Runtime จึงเล่น Disney+ ไม่ได้\n\nเปิดหน้าดาวน์โหลดหรือไม่",
            ["startFailed"] = "เริ่ม WebView2 ไม่ได้:", ["crashed"] = "คอมโพเนนต์เบราว์เซอร์หยุดทำงานโดยไม่คาดคิด โปรดเปิดแอปใหม่",
        },
        ["id"] = new()
        {
            ["style"] = "Tampilan Takarir…", ["wide"] = "Isi layar lebar", ["fullscreen"] = "Layar penuh",
            ["exitFullscreen"] = "Keluar dari layar penuh", ["reload"] = "Muat ulang", ["home"] = "Beranda Disney+", ["help"] = "Bantuan",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime tidak ditemukan, jadi Disney+ tidak dapat diputar.\n\nBuka halaman unduhan?",
            ["startFailed"] = "Tidak dapat memulai WebView2:", ["crashed"] = "Komponen browser berhenti secara tiba-tiba. Mulai ulang aplikasi.",
        },
        ["ms"] = new()
        {
            ["style"] = "Penggayaan Sari Kata…", ["wide"] = "Isi skrin lebar", ["fullscreen"] = "Skrin penuh",
            ["exitFullscreen"] = "Keluar daripada skrin penuh", ["reload"] = "Muat semula", ["home"] = "Laman utama Disney+", ["help"] = "Bantuan",
            ["noWebView2"] = "Microsoft Edge WebView2 Runtime tidak ditemui, jadi Disney+ tidak dapat dimainkan.\n\nBuka halaman muat turun?",
            ["startFailed"] = "Tidak dapat memulakan WebView2:", ["crashed"] = "Komponen pelayar berhenti secara tiba-tiba. Sila mulakan semula aplikasi.",
        },
        ["ar"] = new()
        {
            ["style"] = "نمط الترجمة…", ["wide"] = "ملء الشاشة العريضة", ["fullscreen"] = "ملء الشاشة",
            ["exitFullscreen"] = "الخروج من ملء الشاشة", ["reload"] = "إعادة التحميل", ["home"] = "الصفحة الرئيسية لـ Disney+", ["help"] = "المساعدة",
            ["noWebView2"] = "لم يتم العثور على Microsoft Edge WebView2 Runtime، لذا لا يمكن تشغيل Disney+.\n\nهل تريد فتح صفحة التنزيل؟",
            ["startFailed"] = "تعذّر بدء WebView2:", ["crashed"] = "توقف مكوّن المتصفح بشكل غير متوقع. يُرجى إعادة تشغيل التطبيق.",
        },
        ["he"] = new()
        {
            ["style"] = "תצוגת הכתוביות…", ["wide"] = "מילוי מסך רחב", ["fullscreen"] = "מסך מלא",
            ["exitFullscreen"] = "יציאה ממסך מלא", ["reload"] = "טעינה מחדש", ["home"] = "דף הבית של Disney+", ["help"] = "עזרה",
            ["noWebView2"] = "‏Microsoft Edge WebView2 Runtime לא נמצא, לכן אי אפשר להפעיל את Disney+.\n\nלפתוח את דף ההורדה?",
            ["startFailed"] = "לא ניתן להפעיל את WebView2:", ["crashed"] = "רכיב הדפדפן הפסיק לפעול באופן בלתי צפוי. הפעילו מחדש את האפליקציה.",
        },
    };

    // Version and update text, in the order of UpdateKeys ({0} = a version number).
    private static readonly string[] UpdateKeys =
    [
        "menuCheckUpdates", "menuAutoUpdate", "menuAbout", "aboutDesc", "version", "projectPage", "updateTitle",
        "updateInstalled", "updatePortable", "updateNow", "later", "downloadPage", "downloading", "upToDate",
        "checkFailed", "updateFailed",
    ];

    private static readonly Dictionary<string, string[]> UpdateTable = new()
    {
        ["en"] = ["Check for updates…", "Check for updates automatically", "About Disney+ Desktop",
            "Unofficial Windows app for the Disney+ website, with subtitle styling, playback speed, widescreen fill and high quality.",
            "Version {0}", "Project page", "Disney+ Desktop {0} is available",
            "You have version {0}. Update now? The app restarts when the update is done.",
            "You have version {0}. This is the portable version: download the new version from the download page.",
            "Update now", "Later", "Open download page", "Downloading the update…", "You have the latest version ({0}).",
            "Couldn't check for updates. Check the internet connection and try again.", "The update couldn't be installed:"],
        ["zh-Hant"] = ["檢查更新…", "自動檢查更新", "關於 Disney+ Desktop",
            "Disney+ 網站的非官方 Windows 應用程式，提供字幕樣式、播放速度、寬螢幕填滿和高畫質。",
            "版本 {0}", "專案網頁", "Disney+ Desktop {0} 已推出",
            "目前版本是 {0}。要立即更新嗎？更新完成後程式會自動重新開啟。",
            "目前版本是 {0}。這是可攜版，請到下載頁面下載新版本。",
            "立即更新", "稍後", "開啟下載頁面", "正在下載更新…", "已是最新版本（{0}）。",
            "無法檢查更新，請確認網路連線後再試一次。", "無法安裝更新："],
        ["zh-Hans"] = ["检查更新…", "自动检查更新", "关于 Disney+ Desktop",
            "Disney+ 网站的非官方 Windows 应用程序，提供字幕样式、播放速度、宽屏填充和高画质。",
            "版本 {0}", "项目主页", "Disney+ Desktop {0} 已推出",
            "当前版本是 {0}。要立即更新吗？更新完成后程序会自动重新打开。",
            "当前版本是 {0}。这是便携版，请到下载页面下载新版本。",
            "立即更新", "稍后", "打开下载页面", "正在下载更新…", "已是最新版本（{0}）。",
            "无法检查更新，请确认网络连接后再试一次。", "无法安装更新："],
        ["ja"] = ["更新を確認…", "更新を自動的に確認", "Disney+ Desktop について",
            "Disney+ ウェブサイト用の非公式 Windows アプリ。字幕スタイル、再生速度、ワイド表示、高画質に対応しています。",
            "バージョン {0}", "プロジェクト ページ", "Disney+ Desktop {0} が公開されました",
            "現在のバージョンは {0} です。今すぐ更新しますか？更新後にアプリが再起動します。",
            "現在のバージョンは {0} です。これはポータブル版のため、ダウンロード ページから新しいバージョンを入手してください。",
            "今すぐ更新", "後で", "ダウンロード ページを開く", "更新をダウンロードしています…", "最新バージョン ({0}) を使用しています。",
            "更新を確認できませんでした。インターネット接続を確認して、もう一度お試しください。", "更新をインストールできませんでした："],
        ["ko"] = ["업데이트 확인…", "업데이트 자동 확인", "Disney+ Desktop 정보",
            "Disney+ 웹사이트용 비공식 Windows 앱으로, 자막 스타일, 재생 속도, 와이드 화면 채우기, 고화질을 제공합니다.",
            "버전 {0}", "프로젝트 페이지", "Disney+ Desktop {0} 출시",
            "현재 버전은 {0}입니다. 지금 업데이트할까요? 업데이트가 끝나면 앱이 다시 시작됩니다.",
            "현재 버전은 {0}입니다. 포터블 버전이므로 다운로드 페이지에서 새 버전을 받으세요.",
            "지금 업데이트", "나중에", "다운로드 페이지 열기", "업데이트를 다운로드하는 중…", "최신 버전({0})을 사용하고 있습니다.",
            "업데이트를 확인할 수 없습니다. 인터넷 연결을 확인하고 다시 시도하세요.", "업데이트를 설치할 수 없습니다:"],
        ["es"] = ["Buscar actualizaciones…", "Buscar actualizaciones automáticamente", "Acerca de Disney+ Desktop",
            "Aplicación no oficial de Windows para el sitio web de Disney+, con estilo de subtítulos, velocidad de reproducción, pantalla ancha y alta calidad.",
            "Versión {0}", "Página del proyecto", "Disney+ Desktop {0} está disponible",
            "Tienes la versión {0}. ¿Actualizar ahora? La aplicación se reinicia al terminar la actualización.",
            "Tienes la versión {0}. Esta es la versión portátil: descarga la nueva versión desde la página de descargas.",
            "Actualizar ahora", "Más tarde", "Abrir la página de descargas", "Descargando la actualización…", "Tienes la versión más reciente ({0}).",
            "No se pudieron buscar actualizaciones. Comprueba la conexión a internet e inténtalo de nuevo.", "No se pudo instalar la actualización:"],
        ["fr"] = ["Rechercher des mises à jour…", "Rechercher automatiquement les mises à jour", "À propos de Disney+ Desktop",
            "Application Windows non officielle pour le site Disney+, avec style des sous-titres, vitesse de lecture, remplissage grand écran et haute qualité.",
            "Version {0}", "Page du projet", "Disney+ Desktop {0} est disponible",
            "Vous avez la version {0}. Mettre à jour maintenant ? L’application redémarre à la fin de la mise à jour.",
            "Vous avez la version {0}. Il s’agit de la version portable : téléchargez la nouvelle version depuis la page de téléchargement.",
            "Mettre à jour", "Plus tard", "Ouvrir la page de téléchargement", "Téléchargement de la mise à jour…", "Vous avez la dernière version ({0}).",
            "Impossible de rechercher des mises à jour. Vérifiez la connexion Internet et réessayez.", "Impossible d’installer la mise à jour :"],
        ["de"] = ["Nach Updates suchen…", "Automatisch nach Updates suchen", "Über Disney+ Desktop",
            "Inoffizielle Windows-App für die Disney+-Website mit Untertitelstil, Wiedergabegeschwindigkeit, Breitbildfüllung und hoher Qualität.",
            "Version {0}", "Projektseite", "Disney+ Desktop {0} ist verfügbar",
            "Du hast Version {0}. Jetzt aktualisieren? Die App startet nach dem Update neu.",
            "Du hast Version {0}. Das ist die portable Version: Lade die neue Version von der Downloadseite herunter.",
            "Jetzt aktualisieren", "Später", "Downloadseite öffnen", "Update wird heruntergeladen…", "Du hast die neueste Version ({0}).",
            "Es konnte nicht nach Updates gesucht werden. Prüfe die Internetverbindung und versuche es erneut.", "Das Update konnte nicht installiert werden:"],
        ["it"] = ["Controlla aggiornamenti…", "Controlla automaticamente gli aggiornamenti", "Informazioni su Disney+ Desktop",
            "App Windows non ufficiale per il sito Disney+, con stile sottotitoli, velocità di riproduzione, riempimento widescreen e alta qualità.",
            "Versione {0}", "Pagina del progetto", "Disney+ Desktop {0} è disponibile",
            "Hai la versione {0}. Aggiornare ora? L’app si riavvia al termine dell’aggiornamento.",
            "Hai la versione {0}. Questa è la versione portatile: scarica la nuova versione dalla pagina di download.",
            "Aggiorna ora", "Più tardi", "Apri la pagina di download", "Download dell’aggiornamento in corso…", "Hai la versione più recente ({0}).",
            "Impossibile controllare gli aggiornamenti. Controlla la connessione a Internet e riprova.", "Impossibile installare l’aggiornamento:"],
        ["pt-BR"] = ["Verificar atualizações…", "Verificar atualizações automaticamente", "Sobre o Disney+ Desktop",
            "App não oficial para Windows do site Disney+, com estilo das legendas, velocidade de reprodução, preenchimento widescreen e alta qualidade.",
            "Versão {0}", "Página do projeto", "Disney+ Desktop {0} está disponível",
            "Você tem a versão {0}. Atualizar agora? O app reinicia quando a atualização terminar.",
            "Você tem a versão {0}. Esta é a versão portátil: baixe a nova versão na página de download.",
            "Atualizar agora", "Mais tarde", "Abrir página de download", "Baixando a atualização…", "Você tem a versão mais recente ({0}).",
            "Não foi possível verificar atualizações. Verifique a conexão com a internet e tente de novo.", "Não foi possível instalar a atualização:"],
        ["pt-PT"] = ["Procurar atualizações…", "Procurar atualizações automaticamente", "Acerca do Disney+ Desktop",
            "Aplicação não oficial para Windows do site Disney+, com estilo das legendas, velocidade de reprodução, ecrã panorâmico e alta qualidade.",
            "Versão {0}", "Página do projeto", "O Disney+ Desktop {0} está disponível",
            "Tem a versão {0}. Atualizar agora? A aplicação reinicia quando a atualização terminar.",
            "Tem a versão {0}. Esta é a versão portátil: transfira a nova versão a partir da página de transferências.",
            "Atualizar agora", "Mais tarde", "Abrir página de transferências", "A transferir a atualização…", "Tem a versão mais recente ({0}).",
            "Não foi possível procurar atualizações. Verifique a ligação à Internet e tente novamente.", "Não foi possível instalar a atualização:"],
        ["nl"] = ["Controleren op updates…", "Automatisch controleren op updates", "Over Disney+ Desktop",
            "Onofficiële Windows-app voor de Disney+-website, met ondertitelopmaak, afspeelsnelheid, breedbeeld vullen en hoge kwaliteit.",
            "Versie {0}", "Projectpagina", "Disney+ Desktop {0} is beschikbaar",
            "Je hebt versie {0}. Nu bijwerken? De app start opnieuw als de update klaar is.",
            "Je hebt versie {0}. Dit is de draagbare versie: download de nieuwe versie van de downloadpagina.",
            "Nu bijwerken", "Later", "Downloadpagina openen", "Update downloaden…", "Je hebt de nieuwste versie ({0}).",
            "Kan niet controleren op updates. Controleer de internetverbinding en probeer het opnieuw.", "De update kan niet worden geïnstalleerd:"],
        ["pl"] = ["Sprawdź aktualizacje…", "Automatycznie sprawdzaj aktualizacje", "Disney+ Desktop — informacje",
            "Nieoficjalna aplikacja Windows dla witryny Disney+ ze stylem napisów, szybkością odtwarzania, wypełnieniem panoramicznym i wysoką jakością.",
            "Wersja {0}", "Strona projektu", "Dostępna jest wersja Disney+ Desktop {0}",
            "Masz wersję {0}. Zaktualizować teraz? Po aktualizacji aplikacja uruchomi się ponownie.",
            "Masz wersję {0}. To wersja przenośna: pobierz nową wersję ze strony pobierania.",
            "Aktualizuj teraz", "Później", "Otwórz stronę pobierania", "Pobieranie aktualizacji…", "Masz najnowszą wersję ({0}).",
            "Nie można sprawdzić aktualizacji. Sprawdź połączenie z internetem i spróbuj ponownie.", "Nie można zainstalować aktualizacji:"],
        ["tr"] = ["Güncellemeleri denetle…", "Güncellemeleri otomatik denetle", "Disney+ Desktop hakkında",
            "Disney+ web sitesi için resmî olmayan Windows uygulaması; alt yazı stili, oynatma hızı, geniş ekran doldurma ve yüksek kalite sunar.",
            "Sürüm {0}", "Proje sayfası", "Disney+ Desktop {0} kullanıma sunuldu",
            "Sürüm {0} kullanıyorsunuz. Şimdi güncellensin mi? Güncelleme bitince uygulama yeniden başlar.",
            "Sürüm {0} kullanıyorsunuz. Bu taşınabilir sürüm: yeni sürümü indirme sayfasından indirin.",
            "Şimdi güncelle", "Daha sonra", "İndirme sayfasını aç", "Güncelleme indiriliyor…", "En son sürümü ({0}) kullanıyorsunuz.",
            "Güncellemeler denetlenemedi. İnternet bağlantısını kontrol edip yeniden deneyin.", "Güncelleme yüklenemedi:"],
        ["sv"] = ["Sök efter uppdateringar…", "Sök efter uppdateringar automatiskt", "Om Disney+ Desktop",
            "Inofficiell Windows-app för Disney+-webbplatsen, med undertextstil, uppspelningshastighet, bredbildsfyllning och hög kvalitet.",
            "Version {0}", "Projektsida", "Disney+ Desktop {0} finns",
            "Du har version {0}. Uppdatera nu? Appen startar om när uppdateringen är klar.",
            "Du har version {0}. Det här är den portabla versionen: ladda ned den nya versionen från nedladdningssidan.",
            "Uppdatera nu", "Senare", "Öppna nedladdningssidan", "Laddar ned uppdateringen…", "Du har den senaste versionen ({0}).",
            "Det gick inte att söka efter uppdateringar. Kontrollera internetanslutningen och försök igen.", "Uppdateringen kunde inte installeras:"],
        ["da"] = ["Søg efter opdateringer…", "Søg automatisk efter opdateringer", "Om Disney+ Desktop",
            "Uofficiel Windows-app til Disney+-webstedet med undertekststil, afspilningshastighed, bredformatudfyldning og høj kvalitet.",
            "Version {0}", "Projektside", "Disney+ Desktop {0} er tilgængelig",
            "Du har version {0}. Vil du opdatere nu? Appen genstarter, når opdateringen er færdig.",
            "Du har version {0}. Dette er den bærbare version: hent den nye version fra downloadsiden.",
            "Opdater nu", "Senere", "Åbn downloadsiden", "Henter opdateringen…", "Du har den nyeste version ({0}).",
            "Der kunne ikke søges efter opdateringer. Kontrollér internetforbindelsen, og prøv igen.", "Opdateringen kunne ikke installeres:"],
        ["no"] = ["Se etter oppdateringer…", "Se etter oppdateringer automatisk", "Om Disney+ Desktop",
            "Uoffisiell Windows-app for Disney+-nettstedet, med undertekststil, avspillingshastighet, bredformatfylling og høy kvalitet.",
            "Versjon {0}", "Prosjektside", "Disney+ Desktop {0} er tilgjengelig",
            "Du har versjon {0}. Vil du oppdatere nå? Appen starter på nytt når oppdateringen er ferdig.",
            "Du har versjon {0}. Dette er den bærbare versjonen: last ned den nye versjonen fra nedlastingssiden.",
            "Oppdater nå", "Senere", "Åpne nedlastingssiden", "Laster ned oppdateringen…", "Du har den nyeste versjonen ({0}).",
            "Kunne ikke se etter oppdateringer. Kontroller internettforbindelsen og prøv igjen.", "Oppdateringen kunne ikke installeres:"],
        ["fi"] = ["Tarkista päivitykset…", "Tarkista päivitykset automaattisesti", "Tietoja: Disney+ Desktop",
            "Epävirallinen Windows-sovellus Disney+-sivustolle: tekstitystyyli, toistonopeus, laajakuvan täyttö ja korkea laatu.",
            "Versio {0}", "Projektisivu", "Disney+ Desktop {0} on saatavilla",
            "Käytössäsi on versio {0}. Päivitetäänkö nyt? Sovellus käynnistyy uudelleen, kun päivitys on valmis.",
            "Käytössäsi on versio {0}. Tämä on kannettava versio: lataa uusi versio lataussivulta.",
            "Päivitä nyt", "Myöhemmin", "Avaa lataussivu", "Ladataan päivitystä…", "Käytössäsi on uusin versio ({0}).",
            "Päivityksiä ei voitu tarkistaa. Tarkista internetyhteys ja yritä uudelleen.", "Päivitystä ei voitu asentaa:"],
        ["cs"] = ["Vyhledat aktualizace…", "Automaticky vyhledávat aktualizace", "O aplikaci Disney+ Desktop",
            "Neoficiální aplikace pro Windows pro web Disney+ se stylem titulků, rychlostí přehrávání, vyplněním širokoúhlého obrazu a vysokou kvalitou.",
            "Verze {0}", "Stránka projektu", "Je k dispozici Disney+ Desktop {0}",
            "Máte verzi {0}. Aktualizovat teď? Po dokončení aktualizace se aplikace restartuje.",
            "Máte verzi {0}. Toto je přenosná verze: stáhněte novou verzi ze stránky ke stažení.",
            "Aktualizovat teď", "Později", "Otevřít stránku ke stažení", "Stahuje se aktualizace…", "Máte nejnovější verzi ({0}).",
            "Aktualizace se nepodařilo vyhledat. Zkontrolujte připojení k internetu a zkuste to znovu.", "Aktualizaci se nepodařilo nainstalovat:"],
        ["sk"] = ["Vyhľadať aktualizácie…", "Automaticky vyhľadávať aktualizácie", "O aplikácii Disney+ Desktop",
            "Neoficiálna aplikácia pre Windows pre web Disney+ so štýlom titulkov, rýchlosťou prehrávania, vyplnením širokouhlého obrazu a vysokou kvalitou.",
            "Verzia {0}", "Stránka projektu", "Je k dispozícii Disney+ Desktop {0}",
            "Máte verziu {0}. Aktualizovať teraz? Po dokončení aktualizácie sa aplikácia reštartuje.",
            "Máte verziu {0}. Toto je prenosná verzia: stiahnite novú verziu zo stránky na stiahnutie.",
            "Aktualizovať teraz", "Neskôr", "Otvoriť stránku na stiahnutie", "Sťahuje sa aktualizácia…", "Máte najnovšiu verziu ({0}).",
            "Aktualizácie sa nepodarilo vyhľadať. Skontrolujte pripojenie na internet a skúste to znova.", "Aktualizáciu sa nepodarilo nainštalovať:"],
        ["hu"] = ["Frissítések keresése…", "Frissítések automatikus keresése", "A Disney+ Desktop névjegye",
            "Nem hivatalos Windows-alkalmazás a Disney+ webhelyhez: feliratstílus, lejátszási sebesség, szélesvásznú kitöltés és magas minőség.",
            "Verzió: {0}", "Projektoldal", "Elérhető a Disney+ Desktop {0}",
            "A jelenlegi verzió: {0}. Frissíti most? Az alkalmazás a frissítés után újraindul.",
            "A jelenlegi verzió: {0}. Ez a hordozható verzió: töltse le az új verziót a letöltési oldalról.",
            "Frissítés most", "Később", "Letöltési oldal megnyitása", "A frissítés letöltése…", "A legújabb verziót használja ({0}).",
            "Nem sikerült frissítéseket keresni. Ellenőrizze az internetkapcsolatot, és próbálja újra.", "A frissítést nem sikerült telepíteni:"],
        ["ro"] = ["Caută actualizări…", "Caută automat actualizări", "Despre Disney+ Desktop",
            "Aplicație Windows neoficială pentru site-ul Disney+, cu stil de subtitrare, viteză de redare, umplere ecran lat și calitate înaltă.",
            "Versiunea {0}", "Pagina proiectului", "Disney+ Desktop {0} este disponibil",
            "Ai versiunea {0}. Actualizezi acum? Aplicația repornește după actualizare.",
            "Ai versiunea {0}. Aceasta este versiunea portabilă: descarcă noua versiune de pe pagina de descărcare.",
            "Actualizează acum", "Mai târziu", "Deschide pagina de descărcare", "Se descarcă actualizarea…", "Ai cea mai recentă versiune ({0}).",
            "Nu s-au putut căuta actualizări. Verifică conexiunea la internet și încearcă din nou.", "Actualizarea nu a putut fi instalată:"],
        ["hr"] = ["Provjeri ažuriranja…", "Automatski provjeravaj ažuriranja", "O aplikaciji Disney+ Desktop",
            "Neslužbena aplikacija za Windows za web-mjesto Disney+ sa stilom titlova, brzinom reprodukcije, ispunom širokog zaslona i visokom kvalitetom.",
            "Verzija {0}", "Stranica projekta", "Dostupna je verzija Disney+ Desktop {0}",
            "Imate verziju {0}. Ažurirati sada? Aplikacija se ponovno pokreće kad ažuriranje završi.",
            "Imate verziju {0}. Ovo je prijenosna verzija: preuzmite novu verziju sa stranice za preuzimanje.",
            "Ažuriraj sada", "Kasnije", "Otvori stranicu za preuzimanje", "Preuzimanje ažuriranja…", "Imate najnoviju verziju ({0}).",
            "Provjera ažuriranja nije uspjela. Provjerite internetsku vezu i pokušajte ponovno.", "Ažuriranje nije moguće instalirati:"],
        ["el"] = ["Έλεγχος για ενημερώσεις…", "Αυτόματος έλεγχος για ενημερώσεις", "Σχετικά με το Disney+ Desktop",
            "Ανεπίσημη εφαρμογή Windows για τον ιστότοπο Disney+, με στιλ υποτίτλων, ταχύτητα αναπαραγωγής, γέμισμα ευρείας οθόνης και υψηλή ποιότητα.",
            "Έκδοση {0}", "Σελίδα έργου", "Το Disney+ Desktop {0} είναι διαθέσιμο",
            "Έχετε την έκδοση {0}. Ενημέρωση τώρα; Η εφαρμογή επανεκκινείται μόλις ολοκληρωθεί η ενημέρωση.",
            "Έχετε την έκδοση {0}. Αυτή είναι η φορητή έκδοση: κατεβάστε τη νέα έκδοση από τη σελίδα λήψης.",
            "Ενημέρωση τώρα", "Αργότερα", "Άνοιγμα σελίδας λήψης", "Λήψη της ενημέρωσης…", "Έχετε την πιο πρόσφατη έκδοση ({0}).",
            "Δεν ήταν δυνατός ο έλεγχος για ενημερώσεις. Ελέγξτε τη σύνδεση στο Internet και δοκιμάστε ξανά.", "Δεν ήταν δυνατή η εγκατάσταση της ενημέρωσης:"],
        ["th"] = ["ตรวจหาการอัปเดต…", "ตรวจหาการอัปเดตโดยอัตโนมัติ", "เกี่ยวกับ Disney+ Desktop",
            "แอป Windows ที่ไม่เป็นทางการสำหรับเว็บไซต์ Disney+ พร้อมการปรับแต่งคำบรรยาย ความเร็วในการเล่น การเติมเต็มจอกว้าง และคุณภาพสูง",
            "เวอร์ชัน {0}", "หน้าโปรเจกต์", "Disney+ Desktop {0} พร้อมให้ใช้งานแล้ว",
            "คุณใช้เวอร์ชัน {0} อยู่ ต้องการอัปเดตตอนนี้ไหม แอปจะเริ่มใหม่เมื่ออัปเดตเสร็จ",
            "คุณใช้เวอร์ชัน {0} อยู่ นี่คือเวอร์ชันพกพา โปรดดาวน์โหลดเวอร์ชันใหม่จากหน้าดาวน์โหลด",
            "อัปเดตตอนนี้", "ภายหลัง", "เปิดหน้าดาวน์โหลด", "กำลังดาวน์โหลดการอัปเดต…", "คุณใช้เวอร์ชันล่าสุดแล้ว ({0})",
            "ตรวจหาการอัปเดตไม่ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง", "ติดตั้งการอัปเดตไม่ได้:"],
        ["id"] = ["Periksa pembaruan…", "Periksa pembaruan secara otomatis", "Tentang Disney+ Desktop",
            "Aplikasi Windows tidak resmi untuk situs web Disney+, dengan tampilan takarir, kecepatan putar, isi layar lebar, dan kualitas tinggi.",
            "Versi {0}", "Halaman proyek", "Disney+ Desktop {0} tersedia",
            "Anda menggunakan versi {0}. Perbarui sekarang? Aplikasi akan dimulai ulang setelah pembaruan selesai.",
            "Anda menggunakan versi {0}. Ini versi portabel: unduh versi baru dari halaman unduhan.",
            "Perbarui sekarang", "Nanti", "Buka halaman unduhan", "Mengunduh pembaruan…", "Anda menggunakan versi terbaru ({0}).",
            "Tidak dapat memeriksa pembaruan. Periksa koneksi internet lalu coba lagi.", "Pembaruan tidak dapat diinstal:"],
        ["ms"] = ["Semak kemas kini…", "Semak kemas kini secara automatik", "Perihal Disney+ Desktop",
            "Aplikasi Windows tidak rasmi untuk laman web Disney+, dengan penggayaan sari kata, kelajuan main balik, isi skrin lebar dan kualiti tinggi.",
            "Versi {0}", "Halaman projek", "Disney+ Desktop {0} kini tersedia",
            "Anda menggunakan versi {0}. Kemas kini sekarang? Aplikasi akan dimulakan semula selepas kemas kini selesai.",
            "Anda menggunakan versi {0}. Ini versi mudah alih: muat turun versi baharu dari halaman muat turun.",
            "Kemas kini sekarang", "Kemudian", "Buka halaman muat turun", "Memuat turun kemas kini…", "Anda menggunakan versi terkini ({0}).",
            "Tidak dapat menyemak kemas kini. Semak sambungan internet dan cuba lagi.", "Kemas kini tidak dapat dipasang:"],
        ["ar"] = ["التحقق من وجود تحديثات…", "التحقق من التحديثات تلقائياً", "حول Disney+ Desktop",
            "تطبيق Windows غير رسمي لموقع Disney+، يوفّر نمط الترجمة وسرعة التشغيل وملء الشاشة العريضة والجودة العالية.",
            "الإصدار {0}", "صفحة المشروع", "الإصدار {0} من Disney+ Desktop متاح",
            "لديك الإصدار {0}. هل تريد التحديث الآن؟ يُعاد تشغيل التطبيق بعد انتهاء التحديث.",
            "لديك الإصدار {0}. هذا هو الإصدار المحمول: نزّل الإصدار الجديد من صفحة التنزيل.",
            "التحديث الآن", "لاحقاً", "فتح صفحة التنزيل", "جارٍ تنزيل التحديث…", "لديك أحدث إصدار ({0}).",
            "تعذّر التحقق من وجود تحديثات. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.", "تعذّر تثبيت التحديث:"],
        ["he"] = ["בדיקת עדכונים…", "בדיקת עדכונים אוטומטית", "אודות Disney+ Desktop",
            "אפליקציית Windows לא רשמית לאתר Disney+, עם תצוגת כתוביות, מהירות הפעלה, מילוי מסך רחב ואיכות גבוהה.",
            "גרסה {0}", "דף הפרויקט", "Disney+ Desktop {0} זמינה",
            "הגרסה שלך היא {0}. לעדכן עכשיו? האפליקציה תופעל מחדש בסיום העדכון.",
            "הגרסה שלך היא {0}. זו הגרסה הניידת: הורידו את הגרסה החדשה מדף ההורדה.",
            "עדכון עכשיו", "מאוחר יותר", "פתיחת דף ההורדה", "מוריד את העדכון…", "יש לך את הגרסה העדכנית ביותר ({0}).",
            "לא ניתן לבדוק אם יש עדכונים. בדקו את החיבור לאינטרנט ונסו שוב.", "לא ניתן להתקין את העדכון:"],
    };

    private static readonly CultureInfo Culture = CultureInfo.CurrentUICulture;
    private static readonly string CurrentKey = PickKey(Culture);
    private static readonly Dictionary<string, string> Current = Table.TryGetValue(CurrentKey, out var t) ? t : Table["en"];

    /// <summary>Message box layout for right-to-left Windows languages (Arabic, Hebrew).</summary>
    public static MessageBoxOptions BoxOptions => Culture.TextInfo.IsRightToLeft
        ? MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign
        : 0;

    private static string PickKey(CultureInfo culture)
    {
        var name = culture.Name.ToLowerInvariant();
        var two = culture.TwoLetterISOLanguageName;
        return two switch
        {
            "zh" => name.Contains("hant") || name.EndsWith("-tw") || name.EndsWith("-hk") || name.EndsWith("-mo") ? "zh-Hant" : "zh-Hans",
            "pt" => name == "pt-pt" ? "pt-PT" : "pt-BR",
            "nb" or "nn" => "no",
            _ => two,
        };
    }

    private static string Get(string key)
    {
        if (Current.TryGetValue(key, out var value))
            return value;
        int i = Array.IndexOf(UpdateKeys, key);
        if (i >= 0)
            return (UpdateTable.TryGetValue(CurrentKey, out var row) ? row : UpdateTable["en"])[i];
        return Table["en"][key];
    }

    /// <summary>Task dialogs read right to left in Arabic and Hebrew Windows.</summary>
    public static bool RightToLeft => Culture.TextInfo.IsRightToLeft;

    public static string MenuStyle => Get("style");
    public static string MenuWide => Get("wide");
    public static string MenuFullscreen => Get("fullscreen");
    public static string MenuExitFullscreen => Get("exitFullscreen");
    public static string MenuReload => Get("reload");
    public static string MenuHome => Get("home");
    public static string MenuHelp => Get("help");
    public static string NoWebView2 => Get("noWebView2");
    public static string StartFailed => Get("startFailed");
    public static string Crashed => Get("crashed");
    public static string MenuCheckUpdates => Get("menuCheckUpdates");
    public static string MenuAutoUpdate => Get("menuAutoUpdate");
    public static string MenuAbout => Get("menuAbout");
    public static string AboutDescription => Get("aboutDesc");
    public static string VersionLine(string version) => string.Format(Get("version"), version);
    public static string ProjectPage => Get("projectPage");
    public static string UpdateTitle(string version) => string.Format(Get("updateTitle"), version);
    public static string UpdateInstalled(string current) => string.Format(Get("updateInstalled"), current);
    public static string UpdatePortable(string current) => string.Format(Get("updatePortable"), current);
    public static string UpdateNow => Get("updateNow");
    public static string Later => Get("later");
    public static string DownloadPage => Get("downloadPage");
    public static string Downloading => Get("downloading");
    public static string UpToDate(string current) => string.Format(Get("upToDate"), current);
    public static string CheckFailed => Get("checkFailed");
    public static string UpdateFailed => Get("updateFailed");
}

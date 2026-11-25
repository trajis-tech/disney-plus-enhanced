// Disney+ Desktop — features injected into the Disney+ page (main world, top frame only).
//
//  • Netflix-style subtitle appearance, applied to Disney+'s own subtitle renderer:
//      <timed-text-override-region> #shadow > … > .hive-subtitle-renderer-cue-positioning-box
//        > .hive-subtitle-renderer-cue-window > span.hive-subtitle-renderer-cue > span.hive-subtitle-renderer-line
//  • One settings menu: Disney+'s own player settings dialog is kept (subtitle / audio language stay native),
//    its caption-style page is rebuilt with Disney+'s own components and our options, and a
//    "widescreen fill" item is added:
//      <main-app-controls-overlay> #shadow > … <settings-modal-control> #shadow > <settings-modal> #shadow
//        > dialog.settingsModal-dialog > <main-settings-view> | <caption-settings-view> | …
//  • Playback speed (Netflix-style): a speed button next to the settings button opens a 5-step speed picker.
//  • Widescreen fill: scales the playing <video> so a 2.39:1 film fills a 21:9 window.
//  • Toasts and app hotkeys. All text follows the Disney+ UI language (English fallback).
//
// The host app persists the settings and injects the saved values in place of the token below.
(() => {
    'use strict'
    if (window.top !== window || window.__dpd) return

    const SAVED = __DPD_SETTINGS__
    const APP_VERSION = __DPD_VERSION__

    // ------------------------------------------------------------------ language
    //
    // Every UI language disneyplus.com offers. Names of Disney+'s own controls (settingsName, styleName) are
    // Disney+'s official wording from its public UI dictionary, so hints match what the player shows.
    // {settings} {style} {wide} {speed} {quality} in any text are filled in with those names (see t()).

    const LATIN_SIZES = { 'size.0': 'XS', 'size.1': 'S', 'size.2': 'M', 'size.3': 'L', 'size.4': 'XL' }

    const I18N = {
        en: {
            ...LATIN_SIZES,
            'font.sans': 'Sans-serif', 'font.light': 'Sans-serif light', 'font.kai': 'Handwriting', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'White', 'color.cream': 'Light yellow', 'color.yellow': 'Yellow', 'color.blue': 'Light blue', 'color.green': 'Light green', 'color.black': 'Black',
            'edge.soft': 'Soft shadow', 'edge.drop': 'Drop shadow', 'edge.outline': 'Outline', 'edge.none': 'None',
            'background.none': 'None', 'background.dim': 'Semi-transparent', 'background.solid': 'Opaque',
            'position.0': 'Low', 'position.1': 'Middle', 'position.2': 'High',
            text: 'Text', background: 'Background', position: 'Position', reset: 'Reset', bgOpacity: 'Background opacity',
            wide: 'Widescreen fill', on: 'On', off: 'Off',
            quality: 'High quality', hqNoHdcp: 'no HDCP', hqNoPlayReady: 'no PlayReady', hqDowngraded: 'fell back', hqReload: 'Applying the quality setting…',
            hqFellBackUhd: 'This PC can’t play 4K HDR, so 1080p is used.', hqFellBackFhd: 'This PC can’t play high quality, so Disney+’s default quality is used.',
            wideOn: 'Widescreen fill: on ({scale}×)', wideOnLater: 'Widescreen fill: on (applies when a video plays)',
            wideOnNoZoom: 'Widescreen fill: on (no zoom needed for this window)', wideOff: 'Widescreen fill: off',
            settingsName: 'Settings', styleName: 'Subtitle Styling',
            openHint: 'While a video is playing, open {settings} (⚙) at the bottom right of the player → {style}.',
            speed: 'Playback speed', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) at the bottom right of the player\n{speed}: the button next to it\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Full screen    F5  Reload    F1  Help',
            tipNoPlayReady: 'Disney+ goes above its default quality (up to 720p) only with hardware DRM (PlayReady SL3000), which this PC’s graphics don’t support.',
            tipNoHdcp: 'The display connection doesn’t report HDCP, so Disney+ plays at its default quality (up to 720p). Remote desktop, capture cards, splitters and some docks cause this: connect the monitor directly to the PC.',
            tipNoHdcp22: '4K HDR needs HDCP 2.2 on the display connection, so 1080p is used. Use a monitor, cable and port that support HDCP 2.2.',
            tipNoHevc: '4K HDR needs hardware HEVC 10-bit decoding, which this PC doesn’t report, so 1080p is used. Update the graphics driver or install “HEVC Video Extensions” from the Microsoft Store.',
            tipHdrOff: 'To see 4K in HDR, turn on HDR in Windows: Settings → System → Display → Use HDR.',
            tipOutput: 'The graphics card failed Disney+’s output protection, so 720p is used. This is a known NVIDIA RTX 50-series driver issue. If your CPU has integrated graphics, connect the monitor to the motherboard’s video output. After a driver update, choose “{quality}” again to retry.',
        },
        'zh-Hant': {
            'size.0': '超小', 'size.1': '小', 'size.2': '中', 'size.3': '大', 'size.4': '超大',
            'font.sans': '黑體', 'font.light': '細黑體', 'font.kai': '楷體', 'font.ming': '明體', 'font.notoSans': '思源黑體', 'font.notoSerif': '思源宋體',
            'color.white': '白色', 'color.cream': '淺黃', 'color.yellow': '金黃', 'color.blue': '淺藍', 'color.green': '淺綠', 'color.black': '黑色',
            'edge.soft': '柔和陰影', 'edge.drop': '投影', 'edge.outline': '描邊', 'edge.none': '無',
            'background.none': '無', 'background.dim': '半透明', 'background.solid': '不透明',
            'position.0': '低', 'position.1': '中', 'position.2': '高',
            text: '文字', background: '背景', position: '位置', reset: '重置', bgOpacity: '背景不透明度',
            wide: '寬螢幕填滿', on: '開啟', off: '關閉',
            quality: '高畫質', hqNoHdcp: '無 HDCP', hqNoPlayReady: '無 PlayReady', hqDowngraded: '已降級', hqReload: '正在套用畫質設定…',
            hqFellBackUhd: '這台電腦無法播放 4K HDR，已改用 1080p。', hqFellBackFhd: '這台電腦無法播放高畫質，已改用 Disney+ 預設畫質。',
            wideOn: '寬螢幕填滿：開啟（放大 {scale}×）', wideOnLater: '寬螢幕填滿：開啟（播放影片時自動套用）',
            wideOnNoZoom: '寬螢幕填滿：開啟（目前視窗比例不需放大）', wideOff: '寬螢幕填滿：關閉',
            settingsName: '設定', styleName: '字幕樣式',
            openHint: '播放影片時，按播放器右下角的「{settings}（⚙）→ {style}」即可調整字幕。',
            speed: '播放速度', normal: '（正常）',
            help: 'Disney+ Desktop\n{style}、{wide}、{quality}：播放器右下角「{settings}」\n{speed}：「{settings}」旁的按鈕\n' +
                'Ctrl+Shift+S　{style}\nCtrl+Shift+W　{wide}\nF11　全螢幕　　F5　重新整理　　F1　說明',
            tipNoPlayReady: 'Disney+ 要有硬體 DRM（PlayReady SL3000）才會提供高於預設的畫質（預設最高 720p），但這台電腦的顯示卡不支援。',
            tipNoHdcp: '畫面輸出沒有 HDCP，Disney+ 只會以預設畫質（最高 720p）播放。遠端桌面、擷取卡、切換器和部分擴充座都會造成這個情況，請把螢幕直接接到電腦。',
            tipNoHdcp22: '4K HDR 需要畫面輸出支援 HDCP 2.2，目前改用 1080p。請使用支援 HDCP 2.2 的螢幕、線材和輸出埠。',
            tipNoHevc: '4K HDR 需要硬體 HEVC 10-bit 解碼，這台電腦沒有回報支援，目前改用 1080p。請更新顯示卡驅動程式，或從 Microsoft Store 安裝「HEVC 視訊延伸模組」。',
            tipHdrOff: '要看到 4K 的 HDR 效果，請在 Windows 開啟 HDR：設定 → 系統 → 顯示器 → 使用 HDR。',
            tipOutput: '顯示卡沒有通過 Disney+ 的輸出保護，目前以 720p 播放。這是 NVIDIA RTX 50 系列驅動程式的已知問題。如果 CPU 有內建顯示晶片，請把螢幕改接到主機板的影像輸出。更新驅動程式後，再點一次「{quality}」即可重試。',
        },
        'zh-Hans': {
            'size.0': '超小', 'size.1': '小', 'size.2': '中', 'size.3': '大', 'size.4': '超大',
            'font.sans': '黑体', 'font.light': '细黑体', 'font.kai': '楷体', 'font.ming': '宋体', 'font.notoSans': '思源黑体', 'font.notoSerif': '思源宋体',
            'color.white': '白色', 'color.cream': '浅黄', 'color.yellow': '金黄', 'color.blue': '浅蓝', 'color.green': '浅绿', 'color.black': '黑色',
            'edge.soft': '柔和阴影', 'edge.drop': '投影', 'edge.outline': '描边', 'edge.none': '无',
            'background.none': '无', 'background.dim': '半透明', 'background.solid': '不透明',
            'position.0': '低', 'position.1': '中', 'position.2': '高',
            text: '文字', background: '背景', position: '位置', reset: '重置', bgOpacity: '背景不透明度',
            wide: '宽屏填充', on: '开启', off: '关闭',
            quality: '高画质', hqNoHdcp: '无 HDCP', hqNoPlayReady: '无 PlayReady', hqDowngraded: '已降级', hqReload: '正在应用画质设置…',
            hqFellBackUhd: '这台电脑无法播放 4K HDR，已改用 1080p。', hqFellBackFhd: '这台电脑无法播放高画质，已改用 Disney+ 默认画质。',
            wideOn: '宽屏填充：开启（放大 {scale}×）', wideOnLater: '宽屏填充：开启（播放视频时自动应用）',
            wideOnNoZoom: '宽屏填充：开启（当前窗口比例无需放大）', wideOff: '宽屏填充：关闭',
            settingsName: '设置', styleName: '字幕样式',
            openHint: '播放视频时，点击播放器右下角的“{settings}（⚙）→ {style}”即可调整字幕。',
            speed: '播放速度', normal: '（正常）',
            help: 'Disney+ Desktop\n{style}、{wide}、{quality}：播放器右下角“{settings}”\n{speed}：“{settings}”旁的按钮\n' +
                'Ctrl+Shift+S　{style}\nCtrl+Shift+W　{wide}\nF11　全屏　　F5　刷新　　F1　说明',
            tipNoPlayReady: 'Disney+ 需要硬件 DRM（PlayReady SL3000）才会提供高于默认的画质（默认最高 720p），但这台电脑的显卡不支持。',
            tipNoHdcp: '画面输出没有 HDCP，Disney+ 只会以默认画质（最高 720p）播放。远程桌面、采集卡、切换器和部分扩展坞都会导致这种情况，请把显示器直接连接到电脑。',
            tipNoHdcp22: '4K HDR 需要画面输出支持 HDCP 2.2，目前改用 1080p。请使用支持 HDCP 2.2 的显示器、线材和接口。',
            tipNoHevc: '4K HDR 需要硬件 HEVC 10-bit 解码，这台电脑没有报告支持，目前改用 1080p。请更新显卡驱动程序，或从 Microsoft Store 安装“HEVC 视频扩展”。',
            tipHdrOff: '要看到 4K 的 HDR 效果，请在 Windows 中开启 HDR：设置 → 系统 → 屏幕 → 使用 HDR。',
            tipOutput: '显卡没有通过 Disney+ 的输出保护，目前以 720p 播放。这是 NVIDIA RTX 50 系列驱动程序的已知问题。如果 CPU 有集成显卡，请把显示器改接到主板的视频输出。更新驱动程序后，再点一次“{quality}”即可重试。',
        },
        ja: {
            'size.0': '極小', 'size.1': '小', 'size.2': '中', 'size.3': '大', 'size.4': '特大',
            'font.sans': 'ゴシック', 'font.light': '細ゴシック', 'font.kai': '楷書', 'font.ming': '明朝', 'font.notoSans': '源ノ角ゴシック', 'font.notoSerif': '源ノ明朝',
            'color.white': '白', 'color.cream': '薄い黄色', 'color.yellow': '黄色', 'color.blue': '水色', 'color.green': '薄い緑', 'color.black': '黒',
            'edge.soft': 'ソフトシャドウ', 'edge.drop': 'ドロップシャドウ', 'edge.outline': '縁取り', 'edge.none': 'なし',
            'background.none': 'なし', 'background.dim': '半透明', 'background.solid': '不透明',
            'position.0': '低', 'position.1': '中', 'position.2': '高',
            text: '文字', background: '背景', position: '位置', reset: 'リセット', bgOpacity: '背景の不透明度',
            wide: 'ワイド表示', on: 'オン', off: 'オフ',
            quality: '高画質', hqNoHdcp: 'HDCP なし', hqNoPlayReady: 'PlayReady なし', hqDowngraded: 'ダウングレード', hqReload: '画質設定を適用しています…',
            hqFellBackUhd: 'この PC では 4K HDR を再生できないため、1080p に切り替えました。', hqFellBackFhd: 'この PC では高画質を再生できないため、Disney+ の標準の画質に切り替えました。',
            wideOn: 'ワイド表示：オン（{scale}× に拡大）', wideOnLater: 'ワイド表示：オン（再生時に適用）',
            wideOnNoZoom: 'ワイド表示：オン（このウィンドウでは拡大不要）', wideOff: 'ワイド表示：オフ',
            settingsName: '設定', styleName: '字幕のスタイル',
            openHint: '再生中にプレーヤー右下の「{settings}（⚙）→ {style}」から調整できます。',
            speed: '再生速度', normal: '（標準）',
            help: 'Disney+ Desktop\n{style}・{wide}・{quality}：プレーヤー右下の「{settings}」\n{speed}：その横のボタン\n' +
                'Ctrl+Shift+S　{style}\nCtrl+Shift+W　{wide}\nF11　全画面　　F5　再読み込み　　F1　ヘルプ',
            tipNoPlayReady: 'Disney+ で標準（最大 720p）より高い画質を再生するにはハードウェア DRM（PlayReady SL3000）が必要ですが、この PC のグラフィックスは対応していません。',
            tipNoHdcp: '画面出力で HDCP が確認できないため、Disney+ は標準の画質（最大 720p）で再生されます。リモート デスクトップ、キャプチャー カード、分配器、一部のドッキング ステーションが原因になります。モニターを PC に直接接続してください。',
            tipNoHdcp22: '4K HDR には画面出力の HDCP 2.2 が必要なため、1080p で再生しています。HDCP 2.2 対応のモニター、ケーブル、端子を使用してください。',
            tipNoHevc: '4K HDR にはハードウェアによる HEVC 10 ビットのデコードが必要ですが、この PC は対応を報告していないため、1080p で再生しています。グラフィックス ドライバーを更新するか、Microsoft Store から「HEVC ビデオ拡張機能」をインストールしてください。',
            tipHdrOff: '4K を HDR で見るには、Windows の HDR をオンにしてください：設定 → システム → ディスプレイ → HDR を使用する。',
            tipOutput: 'グラフィックス カードが Disney+ の出力保護を通過できなかったため、720p で再生しています。NVIDIA RTX 50 シリーズのドライバーの既知の問題です。CPU に内蔵グラフィックスがある場合は、モニターをマザーボードの映像出力に接続してください。ドライバーの更新後、「{quality}」をもう一度選ぶと再試行します。',
        },
        ko: {
            ...LATIN_SIZES,
            'font.sans': '고딕', 'font.light': '가는 고딕', 'font.kai': '손글씨', 'font.ming': '명조', 'font.notoSans': '본고딕', 'font.notoSerif': '본명조',
            'color.white': '흰색', 'color.cream': '연노랑', 'color.yellow': '노랑', 'color.blue': '하늘색', 'color.green': '연두색', 'color.black': '검정',
            'edge.soft': '부드러운 그림자', 'edge.drop': '그림자', 'edge.outline': '윤곽선', 'edge.none': '없음',
            'background.none': '없음', 'background.dim': '반투명', 'background.solid': '불투명',
            'position.0': '낮게', 'position.1': '중간', 'position.2': '높게',
            text: '텍스트', background: '배경', position: '위치', reset: '초기화', bgOpacity: '배경 불투명도',
            wide: '와이드 화면 채우기', on: '켜짐', off: '꺼짐',
            quality: '고화질', hqNoHdcp: 'HDCP 없음', hqNoPlayReady: 'PlayReady 없음', hqDowngraded: '낮춤', hqReload: '화질 설정을 적용하는 중…',
            hqFellBackUhd: '이 PC에서는 4K HDR을 재생할 수 없어 1080p로 전환했습니다.', hqFellBackFhd: '이 PC에서는 고화질을 재생할 수 없어 Disney+ 기본 화질로 전환했습니다.',
            wideOn: '와이드 화면 채우기: 켜짐 ({scale}×)', wideOnLater: '와이드 화면 채우기: 켜짐 (재생 시 적용)',
            wideOnNoZoom: '와이드 화면 채우기: 켜짐 (현재 창은 확대 불필요)', wideOff: '와이드 화면 채우기: 꺼짐',
            settingsName: '설정', styleName: '자막 스타일',
            openHint: '재생 중 플레이어 오른쪽 아래의 {settings}(⚙) → {style}에서 조정하세요.',
            speed: '재생 속도', normal: '(보통)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: 플레이어 오른쪽 아래 {settings}(⚙)\n{speed}: 그 옆의 버튼\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  전체 화면    F5  새로 고침    F1  도움말',
            tipNoPlayReady: 'Disney+는 하드웨어 DRM(PlayReady SL3000)이 있어야 기본 화질(최대 720p)보다 높은 화질을 제공하는데, 이 PC의 그래픽은 이를 지원하지 않습니다.',
            tipNoHdcp: '디스플레이 연결에서 HDCP가 확인되지 않아 Disney+가 기본 화질(최대 720p)로 재생됩니다. 원격 데스크톱, 캡처 카드, 분배기, 일부 도킹 스테이션이 원인이 되니 모니터를 PC에 직접 연결하세요.',
            tipNoHdcp22: '4K HDR에는 디스플레이 연결의 HDCP 2.2가 필요해 1080p로 재생합니다. HDCP 2.2를 지원하는 모니터, 케이블, 포트를 사용하세요.',
            tipNoHevc: '4K HDR에는 하드웨어 HEVC 10비트 디코딩이 필요한데 이 PC에서 지원이 확인되지 않아 1080p로 재생합니다. 그래픽 드라이버를 업데이트하거나 Microsoft Store에서 "HEVC 비디오 확장"을 설치하세요.',
            tipHdrOff: '4K를 HDR로 보려면 Windows에서 HDR을 켜세요: 설정 → 시스템 → 디스플레이 → HDR 사용.',
            tipOutput: '그래픽 카드가 Disney+의 출력 보호를 통과하지 못해 720p로 재생합니다. NVIDIA RTX 50 시리즈 드라이버의 알려진 문제입니다. CPU에 내장 그래픽이 있다면 모니터를 메인보드의 영상 출력에 연결하세요. 드라이버를 업데이트한 뒤 "{quality}"를 다시 선택하면 재시도합니다.',
        },
        es: {
            ...LATIN_SIZES,
            'font.sans': 'Sans serif', 'font.light': 'Sans serif fina', 'font.kai': 'Manuscrita', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Blanco', 'color.cream': 'Amarillo claro', 'color.yellow': 'Amarillo', 'color.blue': 'Azul claro', 'color.green': 'Verde claro', 'color.black': 'Negro',
            'edge.soft': 'Sombra suave', 'edge.drop': 'Sombra paralela', 'edge.outline': 'Contorno', 'edge.none': 'Ninguno',
            'background.none': 'Ninguno', 'background.dim': 'Semitransparente', 'background.solid': 'Opaco',
            'position.0': 'Bajo', 'position.1': 'Medio', 'position.2': 'Alto',
            text: 'Texto', background: 'Fondo', position: 'Posición', reset: 'Restablecer', bgOpacity: 'Opacidad del fondo',
            wide: 'Pantalla ancha', on: 'Activado', off: 'Desactivado',
            quality: 'Alta calidad', hqNoHdcp: 'sin HDCP', hqNoPlayReady: 'sin PlayReady', hqDowngraded: 'reducida', hqReload: 'Aplicando la calidad…',
            hqFellBackUhd: 'Este PC no puede reproducir 4K HDR; se usa 1080p.', hqFellBackFhd: 'Este PC no puede reproducir alta calidad; se usa la calidad predeterminada de Disney+.',
            wideOn: 'Pantalla ancha: activada ({scale}×)', wideOnLater: 'Pantalla ancha: activada (se aplica al reproducir)',
            wideOnNoZoom: 'Pantalla ancha: activada (esta ventana no necesita zoom)', wideOff: 'Pantalla ancha: desactivada',
            settingsName: 'Configuración', styleName: 'Estilo de los subtítulos',
            openHint: 'Durante la reproducción, abre {settings} (⚙) abajo a la derecha del reproductor → {style}.',
            speed: 'Velocidad de reproducción', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) abajo a la derecha del reproductor\n{speed}: el botón de al lado\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Pantalla completa    F5  Recargar    F1  Ayuda',
            tipNoPlayReady: 'Disney+ solo supera su calidad predeterminada (hasta 720p) con DRM por hardware (PlayReady SL3000), y la gráfica de este PC no lo admite.',
            tipNoHdcp: 'La conexión de la pantalla no informa HDCP, así que Disney+ se reproduce en su calidad predeterminada (hasta 720p). Lo causan el escritorio remoto, las capturadoras, los divisores y algunos docks: conecta el monitor directamente al PC.',
            tipNoHdcp22: '4K HDR requiere HDCP 2.2 en la conexión de la pantalla, así que se usa 1080p. Usa un monitor, un cable y un puerto compatibles con HDCP 2.2.',
            tipNoHevc: '4K HDR requiere decodificación HEVC de 10 bits por hardware y este PC no la indica, así que se usa 1080p. Actualiza el controlador gráfico o instala «Extensiones de vídeo HEVC» desde Microsoft Store.',
            tipHdrOff: 'Para ver 4K en HDR, activa HDR en Windows: Configuración → Sistema → Pantalla → Usar HDR.',
            tipOutput: 'La tarjeta gráfica no superó la protección de salida de Disney+, así que se reproduce a 720p. Es un problema conocido de los controladores de NVIDIA RTX serie 50. Si tu CPU tiene gráficos integrados, conecta el monitor a la salida de vídeo de la placa base. Tras actualizar el controlador, elige «{quality}» de nuevo para reintentarlo.',
        },
        fr: {
            ...LATIN_SIZES,
            'font.sans': 'Sans empattement', 'font.light': 'Sans empattement fin', 'font.kai': 'Manuscrite', 'font.ming': 'Avec empattement', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Blanc', 'color.cream': 'Jaune clair', 'color.yellow': 'Jaune', 'color.blue': 'Bleu clair', 'color.green': 'Vert clair', 'color.black': 'Noir',
            'edge.soft': 'Ombre douce', 'edge.drop': 'Ombre portée', 'edge.outline': 'Contour', 'edge.none': 'Aucun',
            'background.none': 'Aucun', 'background.dim': 'Semi-transparent', 'background.solid': 'Opaque',
            'position.0': 'Bas', 'position.1': 'Moyen', 'position.2': 'Haut',
            text: 'Texte', background: 'Arrière-plan', position: 'Position', reset: 'Réinitialiser', bgOpacity: 'Opacité de l’arrière-plan',
            wide: 'Remplissage grand écran', on: 'Activé', off: 'Désactivé',
            quality: 'Haute qualité', hqNoHdcp: 'pas de HDCP', hqNoPlayReady: 'pas de PlayReady', hqDowngraded: 'réduite', hqReload: 'Application de la qualité…',
            hqFellBackUhd: 'Ce PC ne peut pas lire la 4K HDR ; la 1080p est utilisée.', hqFellBackFhd: 'Ce PC ne peut pas lire la haute qualité ; la qualité par défaut de Disney+ est utilisée.',
            wideOn: 'Remplissage grand écran : activé ({scale}×)', wideOnLater: 'Remplissage grand écran : activé (appliqué à la lecture)',
            wideOnNoZoom: 'Remplissage grand écran : activé (aucun zoom nécessaire)', wideOff: 'Remplissage grand écran : désactivé',
            settingsName: 'Paramètres', styleName: 'Style des sous-titres',
            openHint: 'Pendant la lecture, ouvrez {settings} (⚙) en bas à droite du lecteur → {style}.',
            speed: 'Vitesse de lecture', normal: '(Normale)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality} : {settings} (⚙) en bas à droite du lecteur\n{speed} : le bouton à côté\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Plein écran    F5  Actualiser    F1  Aide',
            tipNoPlayReady: 'Disney+ ne dépasse sa qualité par défaut (jusqu’à 720p) qu’avec un DRM matériel (PlayReady SL3000), que la carte graphique de ce PC ne prend pas en charge.',
            tipNoHdcp: 'La connexion de l’écran ne signale pas de HDCP : Disney+ est lu dans sa qualité par défaut (jusqu’à 720p). Le bureau à distance, les cartes d’acquisition, les répartiteurs et certaines stations d’accueil en sont la cause : branchez l’écran directement sur le PC.',
            tipNoHdcp22: 'La 4K HDR exige le HDCP 2.2 sur la connexion de l’écran ; la 1080p est utilisée. Utilisez un écran, un câble et un port compatibles HDCP 2.2.',
            tipNoHevc: 'La 4K HDR exige un décodage HEVC 10 bits matériel que ce PC ne signale pas ; la 1080p est utilisée. Mettez à jour le pilote graphique ou installez « Extensions vidéo HEVC » depuis le Microsoft Store.',
            tipHdrOff: 'Pour voir la 4K en HDR, activez le HDR dans Windows : Paramètres → Système → Écran → Utiliser HDR.',
            tipOutput: 'La carte graphique n’a pas passé la protection de sortie de Disney+ : la lecture se fait en 720p. C’est un problème connu des pilotes NVIDIA RTX série 50. Si votre processeur a une puce graphique intégrée, branchez l’écran sur la sortie vidéo de la carte mère. Après une mise à jour du pilote, choisissez de nouveau « {quality} » pour réessayer.',
        },
        de: {
            ...LATIN_SIZES,
            'font.sans': 'Serifenlos', 'font.light': 'Serifenlos dünn', 'font.kai': 'Handschrift', 'font.ming': 'Serifen', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Weiß', 'color.cream': 'Hellgelb', 'color.yellow': 'Gelb', 'color.blue': 'Hellblau', 'color.green': 'Hellgrün', 'color.black': 'Schwarz',
            'edge.soft': 'Weicher Schatten', 'edge.drop': 'Schlagschatten', 'edge.outline': 'Kontur', 'edge.none': 'Keiner',
            'background.none': 'Kein', 'background.dim': 'Halbtransparent', 'background.solid': 'Deckend',
            'position.0': 'Tief', 'position.1': 'Mittel', 'position.2': 'Hoch',
            text: 'Text', background: 'Hintergrund', position: 'Position', reset: 'Zurücksetzen', bgOpacity: 'Hintergrund-Deckkraft',
            wide: 'Breitbild füllen', on: 'Ein', off: 'Aus',
            quality: 'Hohe Qualität', hqNoHdcp: 'kein HDCP', hqNoPlayReady: 'kein PlayReady', hqDowngraded: 'herabgestuft', hqReload: 'Qualität wird angewendet…',
            hqFellBackUhd: 'Dieser PC kann kein 4K HDR abspielen; es wird 1080p verwendet.', hqFellBackFhd: 'Dieser PC kann keine hohe Qualität abspielen; es wird die Standardqualität von Disney+ verwendet.',
            wideOn: 'Breitbild füllen: ein ({scale}×)', wideOnLater: 'Breitbild füllen: ein (gilt bei Wiedergabe)',
            wideOnNoZoom: 'Breitbild füllen: ein (für dieses Fenster nicht nötig)', wideOff: 'Breitbild füllen: aus',
            settingsName: 'Einstellungen', styleName: 'Untertitel-Stil',
            openHint: 'Während der Wiedergabe unten rechts im Player {settings} (⚙) → {style} öffnen.',
            speed: 'Wiedergabegeschwindigkeit', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) unten rechts im Player\n{speed}: die Taste daneben\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Vollbild    F5  Neu laden    F1  Hilfe',
            tipNoPlayReady: 'Disney+ liefert mehr als die Standardqualität (bis 720p) nur mit Hardware-DRM (PlayReady SL3000), das die Grafik dieses PCs nicht unterstützt.',
            tipNoHdcp: 'Die Bildschirmverbindung meldet kein HDCP, daher spielt Disney+ in Standardqualität (bis 720p). Ursache sind Remotedesktop, Capture-Karten, Splitter und manche Docks: Schließe den Monitor direkt an den PC an.',
            tipNoHdcp22: '4K HDR braucht HDCP 2.2 auf der Bildschirmverbindung, daher wird 1080p verwendet. Verwende Monitor, Kabel und Anschluss mit HDCP 2.2.',
            tipNoHevc: '4K HDR braucht HEVC-10-Bit-Hardwaredecodierung, die dieser PC nicht meldet, daher wird 1080p verwendet. Aktualisiere den Grafiktreiber oder installiere „HEVC-Videoerweiterungen“ aus dem Microsoft Store.',
            tipHdrOff: 'Um 4K in HDR zu sehen, aktiviere HDR in Windows: Einstellungen → System → Bildschirm → HDR verwenden.',
            tipOutput: 'Die Grafikkarte hat den Ausgabeschutz von Disney+ nicht bestanden, daher wird 720p abgespielt. Das ist ein bekanntes Problem der Treiber für NVIDIA RTX 50. Hat dein Prozessor eine integrierte Grafik, schließe den Monitor an den Videoausgang des Mainboards an. Wähle nach einem Treiberupdate erneut „{quality}“, um es noch einmal zu versuchen.',
        },
        it: {
            ...LATIN_SIZES,
            'font.sans': 'Senza grazie', 'font.light': 'Senza grazie sottile', 'font.kai': 'Corsivo', 'font.ming': 'Con grazie', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Bianco', 'color.cream': 'Giallo chiaro', 'color.yellow': 'Giallo', 'color.blue': 'Azzurro', 'color.green': 'Verde chiaro', 'color.black': 'Nero',
            'edge.soft': 'Ombra morbida', 'edge.drop': 'Ombra proiettata', 'edge.outline': 'Contorno', 'edge.none': 'Nessuno',
            'background.none': 'Nessuno', 'background.dim': 'Semitrasparente', 'background.solid': 'Opaco',
            'position.0': 'Basso', 'position.1': 'Medio', 'position.2': 'Alto',
            text: 'Testo', background: 'Sfondo', position: 'Posizione', reset: 'Reimposta', bgOpacity: 'Opacità dello sfondo',
            wide: 'Riempimento widescreen', on: 'Attivo', off: 'Disattivato',
            quality: 'Alta qualità', hqNoHdcp: 'senza HDCP', hqNoPlayReady: 'senza PlayReady', hqDowngraded: 'ridotta', hqReload: 'Applicazione della qualità…',
            hqFellBackUhd: 'Questo PC non può riprodurre il 4K HDR: viene usato il 1080p.', hqFellBackFhd: 'Questo PC non può riprodurre l’alta qualità: viene usata la qualità predefinita di Disney+.',
            wideOn: 'Riempimento widescreen: attivo ({scale}×)', wideOnLater: 'Riempimento widescreen: attivo (si applica durante la riproduzione)',
            wideOnNoZoom: 'Riempimento widescreen: attivo (questa finestra non richiede zoom)', wideOff: 'Riempimento widescreen: disattivato',
            settingsName: 'Impostazioni', styleName: 'Stile sottotitoli',
            openHint: 'Durante la riproduzione, apri {settings} (⚙) in basso a destra nel player → {style}.',
            speed: 'Velocità di riproduzione', normal: '(Normale)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) in basso a destra nel player\n{speed}: il pulsante accanto\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Schermo intero    F5  Ricarica    F1  Guida',
            tipNoPlayReady: 'Disney+ supera la qualità predefinita (fino a 720p) solo con il DRM hardware (PlayReady SL3000), che la grafica di questo PC non supporta.',
            tipNoHdcp: 'La connessione dello schermo non segnala l’HDCP, quindi Disney+ viene riprodotto nella qualità predefinita (fino a 720p). La causa sono desktop remoto, schede di acquisizione, splitter e alcune docking station: collega il monitor direttamente al PC.',
            tipNoHdcp22: 'Il 4K HDR richiede l’HDCP 2.2 sulla connessione dello schermo, quindi viene usato il 1080p. Usa monitor, cavo e porta compatibili con HDCP 2.2.',
            tipNoHevc: 'Il 4K HDR richiede la decodifica hardware HEVC a 10 bit, che questo PC non segnala, quindi viene usato il 1080p. Aggiorna il driver grafico o installa “Estensioni video HEVC” dal Microsoft Store.',
            tipHdrOff: 'Per vedere il 4K in HDR, attiva l’HDR in Windows: Impostazioni → Sistema → Schermo → Usa HDR.',
            tipOutput: 'La scheda grafica non ha superato la protezione dell’uscita di Disney+, quindi la riproduzione è a 720p. È un problema noto dei driver NVIDIA RTX serie 50. Se il processore ha la grafica integrata, collega il monitor all’uscita video della scheda madre. Dopo un aggiornamento del driver, scegli di nuovo “{quality}” per riprovare.',
        },
        'pt-BR': {
            ...LATIN_SIZES,
            'font.sans': 'Sem serifa', 'font.light': 'Sem serifa fina', 'font.kai': 'Manuscrita', 'font.ming': 'Com serifa', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Branco', 'color.cream': 'Amarelo-claro', 'color.yellow': 'Amarelo', 'color.blue': 'Azul-claro', 'color.green': 'Verde-claro', 'color.black': 'Preto',
            'edge.soft': 'Sombra suave', 'edge.drop': 'Sombra projetada', 'edge.outline': 'Contorno', 'edge.none': 'Nenhum',
            'background.none': 'Nenhum', 'background.dim': 'Semitransparente', 'background.solid': 'Opaco',
            'position.0': 'Baixo', 'position.1': 'Médio', 'position.2': 'Alto',
            text: 'Texto', background: 'Fundo', position: 'Posição', reset: 'Redefinir', bgOpacity: 'Opacidade do fundo',
            wide: 'Preenchimento widescreen', on: 'Ativado', off: 'Desativado',
            quality: 'Alta qualidade', hqNoHdcp: 'sem HDCP', hqNoPlayReady: 'sem PlayReady', hqDowngraded: 'reduzida', hqReload: 'Aplicando a qualidade…',
            hqFellBackUhd: 'Este PC não consegue reproduzir 4K HDR; será usado 1080p.', hqFellBackFhd: 'Este PC não consegue reproduzir alta qualidade; será usada a qualidade padrão do Disney+.',
            wideOn: 'Preenchimento widescreen: ativado ({scale}×)', wideOnLater: 'Preenchimento widescreen: ativado (aplicado ao reproduzir)',
            wideOnNoZoom: 'Preenchimento widescreen: ativado (esta janela não precisa de zoom)', wideOff: 'Preenchimento widescreen: desativado',
            settingsName: 'Configurações', styleName: 'Estilo das legendas',
            openHint: 'Durante a reprodução, abra {settings} (⚙) no canto inferior direito do player → {style}.',
            speed: 'Velocidade de reprodução', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) no canto inferior direito do player\n{speed}: o botão ao lado\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Tela cheia    F5  Recarregar    F1  Ajuda',
            tipNoPlayReady: 'O Disney+ só passa da qualidade padrão (até 720p) com DRM por hardware (PlayReady SL3000), que a placa de vídeo deste PC não oferece.',
            tipNoHdcp: 'A conexão da tela não informa HDCP, então o Disney+ reproduz na qualidade padrão (até 720p). Isso acontece com área de trabalho remota, placas de captura, divisores e algumas docks: conecte o monitor diretamente ao PC.',
            tipNoHdcp22: '4K HDR exige HDCP 2.2 na conexão da tela, então é usado 1080p. Use monitor, cabo e porta compatíveis com HDCP 2.2.',
            tipNoHevc: '4K HDR exige decodificação HEVC de 10 bits por hardware, que este PC não informa, então é usado 1080p. Atualize o driver de vídeo ou instale "Extensões de Vídeo HEVC" na Microsoft Store.',
            tipHdrOff: 'Para ver 4K em HDR, ative o HDR no Windows: Configurações → Sistema → Tela → Usar HDR.',
            tipOutput: 'A placa de vídeo não passou na proteção de saída do Disney+, então a reprodução é em 720p. É um problema conhecido dos drivers da NVIDIA RTX série 50. Se o processador tiver vídeo integrado, conecte o monitor à saída de vídeo da placa-mãe. Depois de atualizar o driver, escolha "{quality}" de novo para tentar outra vez.',
        },
        'pt-PT': {
            ...LATIN_SIZES,
            'font.sans': 'Sem serifa', 'font.light': 'Sem serifa fina', 'font.kai': 'Manuscrita', 'font.ming': 'Com serifa', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Branco', 'color.cream': 'Amarelo-claro', 'color.yellow': 'Amarelo', 'color.blue': 'Azul-claro', 'color.green': 'Verde-claro', 'color.black': 'Preto',
            'edge.soft': 'Sombra suave', 'edge.drop': 'Sombra projetada', 'edge.outline': 'Contorno', 'edge.none': 'Nenhum',
            'background.none': 'Nenhum', 'background.dim': 'Semitransparente', 'background.solid': 'Opaco',
            'position.0': 'Baixo', 'position.1': 'Médio', 'position.2': 'Alto',
            text: 'Texto', background: 'Fundo', position: 'Posição', reset: 'Repor', bgOpacity: 'Opacidade do fundo',
            wide: 'Preenchimento de ecrã panorâmico', on: 'Ativado', off: 'Desativado',
            quality: 'Alta qualidade', hqNoHdcp: 'sem HDCP', hqNoPlayReady: 'sem PlayReady', hqDowngraded: 'reduzida', hqReload: 'A aplicar a qualidade…',
            hqFellBackUhd: 'Este PC não consegue reproduzir 4K HDR; é utilizado 1080p.', hqFellBackFhd: 'Este PC não consegue reproduzir alta qualidade; é utilizada a qualidade predefinida do Disney+.',
            wideOn: 'Preenchimento de ecrã panorâmico: ativado ({scale}×)', wideOnLater: 'Preenchimento de ecrã panorâmico: ativado (aplicado na reprodução)',
            wideOnNoZoom: 'Preenchimento de ecrã panorâmico: ativado (esta janela não precisa de zoom)', wideOff: 'Preenchimento de ecrã panorâmico: desativado',
            settingsName: 'Definições', styleName: 'Estilo das legendas',
            openHint: 'Durante a reprodução, abra {settings} (⚙) no canto inferior direito do leitor → {style}.',
            speed: 'Velocidade de reprodução', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) no canto inferior direito do leitor\n{speed}: o botão ao lado\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Ecrã inteiro    F5  Recarregar    F1  Ajuda',
            tipNoPlayReady: 'O Disney+ só ultrapassa a qualidade predefinida (até 720p) com DRM por hardware (PlayReady SL3000), que a placa gráfica deste PC não suporta.',
            tipNoHdcp: 'A ligação do ecrã não indica HDCP, por isso o Disney+ é reproduzido na qualidade predefinida (até 720p). Isto acontece com o ambiente de trabalho remoto, placas de captura, divisores e algumas docks: ligue o monitor diretamente ao PC.',
            tipNoHdcp22: 'O 4K HDR exige HDCP 2.2 na ligação do ecrã, por isso é utilizado 1080p. Utilize um monitor, um cabo e uma porta compatíveis com HDCP 2.2.',
            tipNoHevc: 'O 4K HDR exige descodificação HEVC de 10 bits por hardware, que este PC não indica, por isso é utilizado 1080p. Atualize o controlador gráfico ou instale "Extensões de Vídeo HEVC" a partir da Microsoft Store.',
            tipHdrOff: 'Para ver 4K em HDR, ative o HDR no Windows: Definições → Sistema → Ecrã → Utilizar HDR.',
            tipOutput: 'A placa gráfica não passou na proteção de saída do Disney+, por isso a reprodução é em 720p. É um problema conhecido dos controladores NVIDIA RTX da série 50. Se o processador tiver gráficos integrados, ligue o monitor à saída de vídeo da motherboard. Depois de atualizar o controlador, escolha "{quality}" novamente para tentar de novo.',
        },
        nl: {
            ...LATIN_SIZES,
            'font.sans': 'Schreefloos', 'font.light': 'Schreefloos dun', 'font.kai': 'Handschrift', 'font.ming': 'Schreef', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Wit', 'color.cream': 'Lichtgeel', 'color.yellow': 'Geel', 'color.blue': 'Lichtblauw', 'color.green': 'Lichtgroen', 'color.black': 'Zwart',
            'edge.soft': 'Zachte schaduw', 'edge.drop': 'Slagschaduw', 'edge.outline': 'Omlijning', 'edge.none': 'Geen',
            'background.none': 'Geen', 'background.dim': 'Halfdoorzichtig', 'background.solid': 'Dekkend',
            'position.0': 'Laag', 'position.1': 'Midden', 'position.2': 'Hoog',
            text: 'Tekst', background: 'Achtergrond', position: 'Positie', reset: 'Resetten', bgOpacity: 'Dekking achtergrond',
            wide: 'Breedbeeld vullen', on: 'Aan', off: 'Uit',
            quality: 'Hoge kwaliteit', hqNoHdcp: 'geen HDCP', hqNoPlayReady: 'geen PlayReady', hqDowngraded: 'verlaagd', hqReload: 'Kwaliteitsinstelling toepassen…',
            hqFellBackUhd: 'Deze pc kan geen 4K HDR afspelen; 1080p wordt gebruikt.', hqFellBackFhd: 'Deze pc kan geen hoge kwaliteit afspelen; de standaardkwaliteit van Disney+ wordt gebruikt.',
            wideOn: 'Breedbeeld vullen: aan ({scale}×)', wideOnLater: 'Breedbeeld vullen: aan (wordt toegepast bij afspelen)',
            wideOnNoZoom: 'Breedbeeld vullen: aan (dit venster hoeft niet te zoomen)', wideOff: 'Breedbeeld vullen: uit',
            settingsName: 'Instellingen', styleName: 'Styling ondertiteling',
            openHint: 'Open tijdens het afspelen {settings} (⚙) rechtsonder in de speler → {style}.',
            speed: 'Afspeelsnelheid', normal: '(Normaal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) rechtsonder in de speler\n{speed}: de knop ernaast\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Volledig scherm    F5  Opnieuw laden    F1  Help',
            tipNoPlayReady: 'Disney+ gaat alleen boven de standaardkwaliteit (tot 720p) met hardware-DRM (PlayReady SL3000), en de grafische kaart van deze pc ondersteunt dat niet.',
            tipNoHdcp: 'De beeldschermverbinding meldt geen HDCP, dus Disney+ speelt af in de standaardkwaliteit (tot 720p). Dit komt door extern bureaublad, capturekaarten, splitters en sommige docks: sluit de monitor rechtstreeks op de pc aan.',
            tipNoHdcp22: '4K HDR vereist HDCP 2.2 op de beeldschermverbinding, dus 1080p wordt gebruikt. Gebruik een monitor, kabel en poort met HDCP 2.2.',
            tipNoHevc: '4K HDR vereist hardwarematige HEVC-decodering in 10 bit, die deze pc niet meldt, dus 1080p wordt gebruikt. Werk het grafische stuurprogramma bij of installeer "HEVC-video-uitbreidingen" uit de Microsoft Store.',
            tipHdrOff: 'Zet HDR aan in Windows om 4K in HDR te zien: Instellingen → Systeem → Beeldscherm → HDR gebruiken.',
            tipOutput: 'De grafische kaart kwam niet door de uitvoerbeveiliging van Disney+, dus er wordt in 720p afgespeeld. Dit is een bekend probleem met stuurprogramma’s voor de NVIDIA RTX 50-serie. Heeft je processor geïntegreerde graphics, sluit de monitor dan aan op de video-uitgang van het moederbord. Kies na een stuurprogramma-update opnieuw "{quality}" om het nog eens te proberen.',
        },
        pl: {
            ...LATIN_SIZES,
            'font.sans': 'Bezszeryfowa', 'font.light': 'Bezszeryfowa cienka', 'font.kai': 'Odręczna', 'font.ming': 'Szeryfowa', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Biały', 'color.cream': 'Jasnożółty', 'color.yellow': 'Żółty', 'color.blue': 'Jasnoniebieski', 'color.green': 'Jasnozielony', 'color.black': 'Czarny',
            'edge.soft': 'Miękki cień', 'edge.drop': 'Cień rzucany', 'edge.outline': 'Obrys', 'edge.none': 'Brak',
            'background.none': 'Brak', 'background.dim': 'Półprzezroczyste', 'background.solid': 'Nieprzezroczyste',
            'position.0': 'Nisko', 'position.1': 'Środek', 'position.2': 'Wysoko',
            text: 'Tekst', background: 'Tło', position: 'Położenie', reset: 'Resetuj', bgOpacity: 'Krycie tła',
            wide: 'Wypełnienie panoramiczne', on: 'Wł.', off: 'Wył.',
            quality: 'Wysoka jakość', hqNoHdcp: 'brak HDCP', hqNoPlayReady: 'brak PlayReady', hqDowngraded: 'obniżona', hqReload: 'Stosowanie ustawienia jakości…',
            hqFellBackUhd: 'Ten komputer nie może odtwarzać 4K HDR; używana jest rozdzielczość 1080p.', hqFellBackFhd: 'Ten komputer nie może odtwarzać wysokiej jakości; używana jest domyślna jakość Disney+.',
            wideOn: 'Wypełnienie panoramiczne: wł. ({scale}×)', wideOnLater: 'Wypełnienie panoramiczne: wł. (zostanie zastosowane podczas odtwarzania)',
            wideOnNoZoom: 'Wypełnienie panoramiczne: wł. (to okno nie wymaga powiększenia)', wideOff: 'Wypełnienie panoramiczne: wył.',
            settingsName: 'Ustawienia', styleName: 'Styl napisów',
            openHint: 'Podczas odtwarzania otwórz {settings} (⚙) w prawym dolnym rogu odtwarzacza → {style}.',
            speed: 'Szybkość odtwarzania', normal: '(Normalna)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) w prawym dolnym rogu odtwarzacza\n{speed}: przycisk obok\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Pełny ekran    F5  Odśwież    F1  Pomoc',
            tipNoPlayReady: 'Disney+ przekracza domyślną jakość (do 720p) tylko ze sprzętowym DRM (PlayReady SL3000), którego karta graficzna tego komputera nie obsługuje.',
            tipNoHdcp: 'Połączenie z ekranem nie zgłasza HDCP, więc Disney+ odtwarza w domyślnej jakości (do 720p). Powodują to pulpit zdalny, karty przechwytujące, rozgałęźniki i niektóre stacje dokujące: podłącz monitor bezpośrednio do komputera.',
            tipNoHdcp22: '4K HDR wymaga HDCP 2.2 na połączeniu z ekranem, więc używana jest rozdzielczość 1080p. Użyj monitora, kabla i portu obsługujących HDCP 2.2.',
            tipNoHevc: '4K HDR wymaga sprzętowego dekodowania HEVC 10-bit, którego ten komputer nie zgłasza, więc używana jest rozdzielczość 1080p. Zaktualizuj sterownik grafiki lub zainstaluj „Rozszerzenia wideo HEVC” ze sklepu Microsoft Store.',
            tipHdrOff: 'Aby oglądać 4K w HDR, włącz HDR w systemie Windows: Ustawienia → System → Ekran → Użyj HDR.',
            tipOutput: 'Karta graficzna nie przeszła ochrony wyjścia Disney+, więc odtwarzanie odbywa się w 720p. To znany problem sterowników NVIDIA RTX serii 50. Jeśli procesor ma zintegrowaną grafikę, podłącz monitor do wyjścia wideo płyty głównej. Po aktualizacji sterownika wybierz ponownie „{quality}”, aby spróbować jeszcze raz.',
        },
        tr: {
            ...LATIN_SIZES,
            'font.sans': 'Sans serif', 'font.light': 'İnce sans serif', 'font.kai': 'El yazısı', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Beyaz', 'color.cream': 'Açık sarı', 'color.yellow': 'Sarı', 'color.blue': 'Açık mavi', 'color.green': 'Açık yeşil', 'color.black': 'Siyah',
            'edge.soft': 'Yumuşak gölge', 'edge.drop': 'Alt gölge', 'edge.outline': 'Kontur', 'edge.none': 'Yok',
            'background.none': 'Yok', 'background.dim': 'Yarı saydam', 'background.solid': 'Opak',
            'position.0': 'Alt', 'position.1': 'Orta', 'position.2': 'Üst',
            text: 'Metin', background: 'Arka plan', position: 'Konum', reset: 'Sıfırla', bgOpacity: 'Arka plan opaklığı',
            wide: 'Geniş ekranı doldur', on: 'Açık', off: 'Kapalı',
            quality: 'Yüksek kalite', hqNoHdcp: 'HDCP yok', hqNoPlayReady: 'PlayReady yok', hqDowngraded: 'düşürüldü', hqReload: 'Kalite ayarı uygulanıyor…',
            hqFellBackUhd: 'Bu bilgisayar 4K HDR oynatamıyor; 1080p kullanılıyor.', hqFellBackFhd: 'Bu bilgisayar yüksek kaliteyi oynatamıyor; Disney+’ın varsayılan kalitesi kullanılıyor.',
            wideOn: 'Geniş ekranı doldur: açık ({scale}×)', wideOnLater: 'Geniş ekranı doldur: açık (oynatırken uygulanır)',
            wideOnNoZoom: 'Geniş ekranı doldur: açık (bu pencere için yakınlaştırma gerekmiyor)', wideOff: 'Geniş ekranı doldur: kapalı',
            settingsName: 'Ayarlar', styleName: 'Alt Yazı Stili',
            openHint: 'Oynatma sırasında oynatıcının sağ altındaki {settings} (⚙) → {style} bölümünü açın.',
            speed: 'Oynatma hızı', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: oynatıcının sağ altındaki {settings} (⚙)\n{speed}: yanındaki düğme\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Tam ekran    F5  Yenile    F1  Yardım',
            tipNoPlayReady: 'Disney+ varsayılan kalitenin (720p’ye kadar) üstüne yalnızca donanım DRM’siyle (PlayReady SL3000) çıkar; bu bilgisayarın grafik birimi bunu desteklemiyor.',
            tipNoHdcp: 'Ekran bağlantısı HDCP bildirmiyor, bu yüzden Disney+ varsayılan kalitede (720p’ye kadar) oynatılıyor. Uzak masaüstü, yakalama kartları, çoklayıcılar ve bazı yerleştirme istasyonları buna yol açar: monitörü doğrudan bilgisayara bağlayın.',
            tipNoHdcp22: '4K HDR için ekran bağlantısında HDCP 2.2 gerekir, bu yüzden 1080p kullanılıyor. HDCP 2.2 destekli monitör, kablo ve bağlantı noktası kullanın.',
            tipNoHevc: '4K HDR için donanımla HEVC 10 bit kod çözme gerekir ve bu bilgisayar bunu bildirmiyor, bu yüzden 1080p kullanılıyor. Grafik sürücüsünü güncelleyin veya Microsoft Store’dan "HEVC Video Uzantıları"nı yükleyin.',
            tipHdrOff: '4K’yı HDR olarak görmek için Windows’ta HDR’yi açın: Ayarlar → Sistem → Ekran → HDR kullan.',
            tipOutput: 'Ekran kartı Disney+’ın çıkış korumasını geçemedi, bu yüzden 720p oynatılıyor. Bu, NVIDIA RTX 50 serisi sürücülerinin bilinen bir sorunudur. İşlemcinizde dahili grafik varsa monitörü anakartın görüntü çıkışına bağlayın. Sürücüyü güncelledikten sonra yeniden denemek için "{quality}" seçeneğini tekrar seçin.',
        },
        sv: {
            ...LATIN_SIZES,
            'font.sans': 'Sans serif', 'font.light': 'Tunn sans serif', 'font.kai': 'Handskrift', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Vit', 'color.cream': 'Ljusgul', 'color.yellow': 'Gul', 'color.blue': 'Ljusblå', 'color.green': 'Ljusgrön', 'color.black': 'Svart',
            'edge.soft': 'Mjuk skugga', 'edge.drop': 'Slagskugga', 'edge.outline': 'Kontur', 'edge.none': 'Ingen',
            'background.none': 'Ingen', 'background.dim': 'Halvgenomskinlig', 'background.solid': 'Täckande',
            'position.0': 'Låg', 'position.1': 'Mitten', 'position.2': 'Hög',
            text: 'Text', background: 'Bakgrund', position: 'Position', reset: 'Återställ', bgOpacity: 'Bakgrundens opacitet',
            wide: 'Fyll bredbild', on: 'På', off: 'Av',
            quality: 'Hög kvalitet', hqNoHdcp: 'ingen HDCP', hqNoPlayReady: 'ingen PlayReady', hqDowngraded: 'sänkt', hqReload: 'Tillämpar kvalitetsinställningen…',
            hqFellBackUhd: 'Den här datorn kan inte spela upp 4K HDR, så 1080p används.', hqFellBackFhd: 'Den här datorn kan inte spela upp hög kvalitet, så Disney+ standardkvalitet används.',
            wideOn: 'Fyll bredbild: på ({scale}×)', wideOnLater: 'Fyll bredbild: på (tillämpas vid uppspelning)',
            wideOnNoZoom: 'Fyll bredbild: på (det här fönstret behöver ingen zoom)', wideOff: 'Fyll bredbild: av',
            settingsName: 'Inställningar', styleName: 'Undertexternas utseende',
            openHint: 'Öppna {settings} (⚙) längst ned till höger i spelaren under uppspelning → {style}.',
            speed: 'Uppspelningshastighet', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) längst ned till höger i spelaren\n{speed}: knappen bredvid\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Helskärm    F5  Läs in igen    F1  Hjälp',
            tipNoPlayReady: 'Disney+ ger högre än standardkvalitet (upp till 720p) bara med hårdvaru-DRM (PlayReady SL3000), som grafiken i den här datorn inte har stöd för.',
            tipNoHdcp: 'Skärmanslutningen rapporterar ingen HDCP, så Disney+ spelas upp i standardkvalitet (upp till 720p). Fjärrskrivbord, inspelningskort, splitters och vissa dockor orsakar detta: anslut skärmen direkt till datorn.',
            tipNoHdcp22: '4K HDR kräver HDCP 2.2 på skärmanslutningen, så 1080p används. Använd skärm, kabel och port med stöd för HDCP 2.2.',
            tipNoHevc: '4K HDR kräver hårdvaruavkodning av HEVC i 10 bitar, vilket den här datorn inte rapporterar, så 1080p används. Uppdatera grafikdrivrutinen eller installera ”HEVC-videotillägg” från Microsoft Store.',
            tipHdrOff: 'Slå på HDR i Windows för att se 4K i HDR: Inställningar → System → Bildskärm → Använd HDR.',
            tipOutput: 'Grafikkortet klarade inte Disney+ utgångsskydd, så 720p spelas upp. Det är ett känt problem med drivrutiner för NVIDIA RTX 50-serien. Om processorn har integrerad grafik ansluter du skärmen till moderkortets videoutgång. Välj ”{quality}” igen efter en drivrutinsuppdatering för att försöka på nytt.',
        },
        da: {
            ...LATIN_SIZES,
            'font.sans': 'Sans serif', 'font.light': 'Tynd sans serif', 'font.kai': 'Håndskrift', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Hvid', 'color.cream': 'Lysegul', 'color.yellow': 'Gul', 'color.blue': 'Lyseblå', 'color.green': 'Lysegrøn', 'color.black': 'Sort',
            'edge.soft': 'Blød skygge', 'edge.drop': 'Slagskygge', 'edge.outline': 'Kontur', 'edge.none': 'Ingen',
            'background.none': 'Ingen', 'background.dim': 'Halvgennemsigtig', 'background.solid': 'Uigennemsigtig',
            'position.0': 'Lav', 'position.1': 'Midt', 'position.2': 'Høj',
            text: 'Tekst', background: 'Baggrund', position: 'Placering', reset: 'Nulstil', bgOpacity: 'Baggrundens uigennemsigtighed',
            wide: 'Udfyld bredformat', on: 'Til', off: 'Fra',
            quality: 'Høj kvalitet', hqNoHdcp: 'ingen HDCP', hqNoPlayReady: 'ingen PlayReady', hqDowngraded: 'sænket', hqReload: 'Anvender kvalitetsindstillingen…',
            hqFellBackUhd: 'Denne pc kan ikke afspille 4K HDR, så 1080p bruges.', hqFellBackFhd: 'Denne pc kan ikke afspille høj kvalitet, så Disney+’ standardkvalitet bruges.',
            wideOn: 'Udfyld bredformat: til ({scale}×)', wideOnLater: 'Udfyld bredformat: til (anvendes ved afspilning)',
            wideOnNoZoom: 'Udfyld bredformat: til (dette vindue skal ikke zoomes)', wideOff: 'Udfyld bredformat: fra',
            settingsName: 'Indstillinger', styleName: 'Underteksters udseende',
            openHint: 'Åbn {settings} (⚙) nederst til højre i afspilleren under afspilning → {style}.',
            speed: 'Afspilningshastighed', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) nederst til højre i afspilleren\n{speed}: knappen ved siden af\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Fuld skærm    F5  Genindlæs    F1  Hjælp',
            tipNoPlayReady: 'Disney+ giver kun mere end standardkvaliteten (op til 720p) med hardware-DRM (PlayReady SL3000), som grafikken i denne pc ikke understøtter.',
            tipNoHdcp: 'Skærmforbindelsen rapporterer ikke HDCP, så Disney+ afspilles i standardkvalitet (op til 720p). Fjernskrivebord, capturekort, splittere og nogle docks er årsagen: tilslut skærmen direkte til pc’en.',
            tipNoHdcp22: '4K HDR kræver HDCP 2.2 på skærmforbindelsen, så 1080p bruges. Brug en skærm, et kabel og en port, der understøtter HDCP 2.2.',
            tipNoHevc: '4K HDR kræver hardwareafkodning af HEVC i 10 bit, som denne pc ikke rapporterer, så 1080p bruges. Opdater grafikdriveren, eller installer "HEVC-videoudvidelser" fra Microsoft Store.',
            tipHdrOff: 'Slå HDR til i Windows for at se 4K i HDR: Indstillinger → System → Skærm → Brug HDR.',
            tipOutput: 'Grafikkortet bestod ikke Disney+’ outputbeskyttelse, så der afspilles i 720p. Det er et kendt problem med drivere til NVIDIA RTX 50-serien. Hvis processoren har integreret grafik, så tilslut skærmen til bundkortets videoudgang. Vælg "{quality}" igen efter en driveropdatering for at prøve igen.',
        },
        no: {
            ...LATIN_SIZES,
            'font.sans': 'Sans serif', 'font.light': 'Tynn sans serif', 'font.kai': 'Håndskrift', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Hvit', 'color.cream': 'Lysegul', 'color.yellow': 'Gul', 'color.blue': 'Lyseblå', 'color.green': 'Lysegrønn', 'color.black': 'Svart',
            'edge.soft': 'Myk skygge', 'edge.drop': 'Slagskygge', 'edge.outline': 'Kontur', 'edge.none': 'Ingen',
            'background.none': 'Ingen', 'background.dim': 'Halvgjennomsiktig', 'background.solid': 'Ugjennomsiktig',
            'position.0': 'Lav', 'position.1': 'Midten', 'position.2': 'Høy',
            text: 'Tekst', background: 'Bakgrunn', position: 'Plassering', reset: 'Tilbakestill', bgOpacity: 'Bakgrunnens dekkevne',
            wide: 'Fyll bredformat', on: 'På', off: 'Av',
            quality: 'Høy kvalitet', hqNoHdcp: 'ingen HDCP', hqNoPlayReady: 'ingen PlayReady', hqDowngraded: 'senket', hqReload: 'Bruker kvalitetsinnstillingen…',
            hqFellBackUhd: 'Denne PC-en kan ikke spille av 4K HDR, så 1080p brukes.', hqFellBackFhd: 'Denne PC-en kan ikke spille av høy kvalitet, så standardkvaliteten til Disney+ brukes.',
            wideOn: 'Fyll bredformat: på ({scale}×)', wideOnLater: 'Fyll bredformat: på (brukes ved avspilling)',
            wideOnNoZoom: 'Fyll bredformat: på (dette vinduet trenger ikke zoom)', wideOff: 'Fyll bredformat: av',
            settingsName: 'Innstillinger', styleName: 'Styling av undertekster',
            openHint: 'Åpne {settings} (⚙) nederst til høyre i avspilleren under avspilling → {style}.',
            speed: 'Avspillingshastighet', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) nederst til høyre i avspilleren\n{speed}: knappen ved siden av\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Fullskjerm    F5  Last inn på nytt    F1  Hjelp',
            tipNoPlayReady: 'Disney+ gir bare høyere enn standardkvalitet (opptil 720p) med maskinvare-DRM (PlayReady SL3000), som grafikken i denne PC-en ikke støtter.',
            tipNoHdcp: 'Skjermtilkoblingen rapporterer ikke HDCP, så Disney+ spilles av i standardkvalitet (opptil 720p). Eksternt skrivebord, opptakskort, splittere og enkelte dokker forårsaker dette: koble skjermen direkte til PC-en.',
            tipNoHdcp22: '4K HDR krever HDCP 2.2 på skjermtilkoblingen, så 1080p brukes. Bruk skjerm, kabel og port som støtter HDCP 2.2.',
            tipNoHevc: '4K HDR krever maskinvaredekoding av HEVC i 10 bit, som denne PC-en ikke rapporterer, så 1080p brukes. Oppdater grafikkdriveren eller installer «HEVC-videoutvidelser» fra Microsoft Store.',
            tipHdrOff: 'Slå på HDR i Windows for å se 4K i HDR: Innstillinger → System → Skjerm → Bruk HDR.',
            tipOutput: 'Grafikkortet besto ikke utgangsbeskyttelsen til Disney+, så det spilles av i 720p. Dette er et kjent problem med drivere for NVIDIA RTX 50-serien. Hvis prosessoren har integrert grafikk, kobler du skjermen til hovedkortets videoutgang. Velg «{quality}» på nytt etter en driveroppdatering for å prøve igjen.',
        },
        fi: {
            ...LATIN_SIZES,
            'font.sans': 'Sans serif', 'font.light': 'Ohut sans serif', 'font.kai': 'Käsiala', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Valkoinen', 'color.cream': 'Vaaleankeltainen', 'color.yellow': 'Keltainen', 'color.blue': 'Vaaleansininen', 'color.green': 'Vaaleanvihreä', 'color.black': 'Musta',
            'edge.soft': 'Pehmeä varjo', 'edge.drop': 'Pudotusvarjo', 'edge.outline': 'Ääriviiva', 'edge.none': 'Ei mitään',
            'background.none': 'Ei mitään', 'background.dim': 'Läpikuultava', 'background.solid': 'Peittävä',
            'position.0': 'Alhaalla', 'position.1': 'Keskellä', 'position.2': 'Ylhäällä',
            text: 'Teksti', background: 'Tausta', position: 'Sijainti', reset: 'Palauta', bgOpacity: 'Taustan peittävyys',
            wide: 'Laajakuvan täyttö', on: 'Päällä', off: 'Pois',
            quality: 'Korkea laatu', hqNoHdcp: 'ei HDCP:tä', hqNoPlayReady: 'ei PlayReadya', hqDowngraded: 'laskettu', hqReload: 'Otetaan laatuasetus käyttöön…',
            hqFellBackUhd: 'Tämä tietokone ei pysty toistamaan 4K HDR -kuvaa, joten käytetään 1080p:tä.', hqFellBackFhd: 'Tämä tietokone ei pysty toistamaan korkeaa laatua, joten käytetään Disney+:n oletuslaatua.',
            wideOn: 'Laajakuvan täyttö: päällä ({scale}×)', wideOnLater: 'Laajakuvan täyttö: päällä (otetaan käyttöön toiston aikana)',
            wideOnNoZoom: 'Laajakuvan täyttö: päällä (tätä ikkunaa ei tarvitse zoomata)', wideOff: 'Laajakuvan täyttö: pois',
            settingsName: 'Asetukset', styleName: 'Tekstityksen tyyli',
            openHint: 'Avaa toiston aikana soittimen oikeasta alakulmasta {settings} (⚙) → {style}.',
            speed: 'Toistonopeus', normal: '(Normaali)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) soittimen oikeassa alakulmassa\n{speed}: sen vieressä oleva painike\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Koko näyttö    F5  Lataa uudelleen    F1  Ohje',
            tipNoPlayReady: 'Disney+ tarjoaa oletuslaatua (enintään 720p) parempaa kuvaa vain laitteistopohjaisella DRM:llä (PlayReady SL3000), jota tämän tietokoneen näytönohjain ei tue.',
            tipNoHdcp: 'Näyttöliitäntä ei ilmoita HDCP:tä, joten Disney+ toistetaan oletuslaadulla (enintään 720p). Syynä ovat etätyöpöytä, kaappauskortit, jakimet ja jotkin telakat: liitä näyttö suoraan tietokoneeseen.',
            tipNoHdcp22: '4K HDR vaatii näyttöliitännältä HDCP 2.2:n, joten käytetään 1080p:tä. Käytä HDCP 2.2:ta tukevaa näyttöä, kaapelia ja liitäntää.',
            tipNoHevc: '4K HDR vaatii laitteistopohjaisen 10-bittisen HEVC-dekoodauksen, jota tämä tietokone ei ilmoita, joten käytetään 1080p:tä. Päivitä näytönohjaimen ajuri tai asenna Microsoft Storesta ”HEVC-videolaajennukset”.',
            tipHdrOff: 'Jos haluat nähdä 4K:n HDR-muodossa, ota HDR käyttöön Windowsissa: Asetukset → Järjestelmä → Näyttö → Käytä HDR:ää.',
            tipOutput: 'Näytönohjain ei läpäissyt Disney+:n ulostulosuojausta, joten toisto tapahtuu 720p:nä. Tämä on NVIDIA RTX 50 -sarjan ajurien tunnettu ongelma. Jos suorittimessa on integroitu näytönohjain, liitä näyttö emolevyn videolähtöön. Valitse ajurin päivityksen jälkeen ”{quality}” uudelleen, niin yritetään uudestaan.',
        },
        cs: {
            ...LATIN_SIZES,
            'font.sans': 'Bezpatkové', 'font.light': 'Tenké bezpatkové', 'font.kai': 'Ručně psané', 'font.ming': 'Patkové', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Bílá', 'color.cream': 'Světle žlutá', 'color.yellow': 'Žlutá', 'color.blue': 'Světle modrá', 'color.green': 'Světle zelená', 'color.black': 'Černá',
            'edge.soft': 'Měkký stín', 'edge.drop': 'Vržený stín', 'edge.outline': 'Obrys', 'edge.none': 'Žádný',
            'background.none': 'Žádné', 'background.dim': 'Poloprůhledné', 'background.solid': 'Neprůhledné',
            'position.0': 'Nízko', 'position.1': 'Uprostřed', 'position.2': 'Vysoko',
            text: 'Text', background: 'Pozadí', position: 'Umístění', reset: 'Resetovat', bgOpacity: 'Neprůhlednost pozadí',
            wide: 'Vyplnit širokoúhlý obraz', on: 'Zapnuto', off: 'Vypnuto',
            quality: 'Vysoká kvalita', hqNoHdcp: 'bez HDCP', hqNoPlayReady: 'bez PlayReady', hqDowngraded: 'sníženo', hqReload: 'Používá se nastavení kvality…',
            hqFellBackUhd: 'Tento počítač nedokáže přehrát 4K HDR, proto se používá 1080p.', hqFellBackFhd: 'Tento počítač nedokáže přehrát vysokou kvalitu, proto se používá výchozí kvalita Disney+.',
            wideOn: 'Vyplnit širokoúhlý obraz: zapnuto ({scale}×)', wideOnLater: 'Vyplnit širokoúhlý obraz: zapnuto (použije se při přehrávání)',
            wideOnNoZoom: 'Vyplnit širokoúhlý obraz: zapnuto (toto okno zvětšení nepotřebuje)', wideOff: 'Vyplnit širokoúhlý obraz: vypnuto',
            settingsName: 'Nastavení', styleName: 'Styl titulků',
            openHint: 'Během přehrávání otevřete vpravo dole v přehrávači {settings} (⚙) → {style}.',
            speed: 'Rychlost přehrávání', normal: '(Normální)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) vpravo dole v přehrávači\n{speed}: tlačítko vedle\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Celá obrazovka    F5  Načíst znovu    F1  Nápověda',
            tipNoPlayReady: 'Disney+ nabízí vyšší než výchozí kvalitu (až 720p) jen s hardwarovým DRM (PlayReady SL3000), které grafika tohoto počítače nepodporuje.',
            tipNoHdcp: 'Připojení displeje nehlásí HDCP, takže Disney+ hraje ve výchozí kvalitě (až 720p). Způsobuje to vzdálená plocha, záznamové karty, rozbočovače a některé dokovací stanice: připojte monitor přímo k počítači.',
            tipNoHdcp22: '4K HDR vyžaduje HDCP 2.2 na připojení displeje, proto se používá 1080p. Použijte monitor, kabel a port s podporou HDCP 2.2.',
            tipNoHevc: '4K HDR vyžaduje hardwarové dekódování HEVC v 10 bitech, které tento počítač nehlásí, proto se používá 1080p. Aktualizujte grafický ovladač nebo nainstalujte „Rozšíření videa HEVC“ z Microsoft Storu.',
            tipHdrOff: 'Chcete-li vidět 4K v HDR, zapněte HDR ve Windows: Nastavení → Systém → Obrazovka → Použít HDR.',
            tipOutput: 'Grafická karta neprošla ochranou výstupu Disney+, proto se přehrává v 720p. Jde o známý problém ovladačů NVIDIA RTX řady 50. Pokud má procesor integrovanou grafiku, připojte monitor k video výstupu základní desky. Po aktualizaci ovladače zvolte znovu „{quality}“ a zkuste to znovu.',
        },
        sk: {
            ...LATIN_SIZES,
            'font.sans': 'Bezpätkové', 'font.light': 'Tenké bezpätkové', 'font.kai': 'Ručne písané', 'font.ming': 'Pätkové', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Biela', 'color.cream': 'Svetložltá', 'color.yellow': 'Žltá', 'color.blue': 'Svetlomodrá', 'color.green': 'Svetlozelená', 'color.black': 'Čierna',
            'edge.soft': 'Mäkký tieň', 'edge.drop': 'Vrhnutý tieň', 'edge.outline': 'Obrys', 'edge.none': 'Žiadny',
            'background.none': 'Žiadne', 'background.dim': 'Polopriehľadné', 'background.solid': 'Nepriehľadné',
            'position.0': 'Nízko', 'position.1': 'V strede', 'position.2': 'Vysoko',
            text: 'Text', background: 'Pozadie', position: 'Umiestnenie', reset: 'Obnoviť', bgOpacity: 'Nepriehľadnosť pozadia',
            wide: 'Vyplniť širokouhlý obraz', on: 'Zapnuté', off: 'Vypnuté',
            quality: 'Vysoká kvalita', hqNoHdcp: 'bez HDCP', hqNoPlayReady: 'bez PlayReady', hqDowngraded: 'znížené', hqReload: 'Používa sa nastavenie kvality…',
            hqFellBackUhd: 'Tento počítač nedokáže prehrať 4K HDR, preto sa používa 1080p.', hqFellBackFhd: 'Tento počítač nedokáže prehrať vysokú kvalitu, preto sa používa predvolená kvalita Disney+.',
            wideOn: 'Vyplniť širokouhlý obraz: zapnuté ({scale}×)', wideOnLater: 'Vyplniť širokouhlý obraz: zapnuté (použije sa pri prehrávaní)',
            wideOnNoZoom: 'Vyplniť širokouhlý obraz: zapnuté (toto okno nepotrebuje zväčšenie)', wideOff: 'Vyplniť širokouhlý obraz: vypnuté',
            settingsName: 'Nastavenia', styleName: 'Štýl titulkov',
            openHint: 'Počas prehrávania otvorte vpravo dole v prehrávači {settings} (⚙) → {style}.',
            speed: 'Rýchlosť prehrávania', normal: '(Normálna)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) vpravo dole v prehrávači\n{speed}: tlačidlo vedľa\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Celá obrazovka    F5  Znova načítať    F1  Pomocník',
            tipNoPlayReady: 'Disney+ ponúka vyššiu ako predvolenú kvalitu (do 720p) len s hardvérovým DRM (PlayReady SL3000), ktoré grafika tohto počítača nepodporuje.',
            tipNoHdcp: 'Pripojenie displeja nehlási HDCP, preto Disney+ prehráva v predvolenej kvalite (do 720p). Spôsobuje to vzdialená pracovná plocha, záznamové karty, rozbočovače a niektoré doky: pripojte monitor priamo k počítaču.',
            tipNoHdcp22: '4K HDR vyžaduje HDCP 2.2 na pripojení displeja, preto sa používa 1080p. Použite monitor, kábel a port s podporou HDCP 2.2.',
            tipNoHevc: '4K HDR vyžaduje hardvérové dekódovanie HEVC v 10 bitoch, ktoré tento počítač nehlási, preto sa používa 1080p. Aktualizujte grafický ovládač alebo nainštalujte „Rozšírenia videa HEVC“ z Microsoft Store.',
            tipHdrOff: 'Ak chcete vidieť 4K v HDR, zapnite HDR vo Windowse: Nastavenia → Systém → Obrazovka → Použiť HDR.',
            tipOutput: 'Grafická karta neprešla ochranou výstupu Disney+, preto sa prehráva v 720p. Ide o známy problém ovládačov NVIDIA RTX radu 50. Ak má procesor integrovanú grafiku, pripojte monitor k video výstupu základnej dosky. Po aktualizácii ovládača znova vyberte „{quality}“ a skúste to znova.',
        },
        hu: {
            ...LATIN_SIZES,
            'font.sans': 'Talpatlan', 'font.light': 'Vékony talpatlan', 'font.kai': 'Kézírás', 'font.ming': 'Talpas', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Fehér', 'color.cream': 'Világossárga', 'color.yellow': 'Sárga', 'color.blue': 'Világoskék', 'color.green': 'Világoszöld', 'color.black': 'Fekete',
            'edge.soft': 'Lágy árnyék', 'edge.drop': 'Vetett árnyék', 'edge.outline': 'Körvonal', 'edge.none': 'Nincs',
            'background.none': 'Nincs', 'background.dim': 'Félig átlátszó', 'background.solid': 'Átlátszatlan',
            'position.0': 'Lent', 'position.1': 'Középen', 'position.2': 'Fent',
            text: 'Szöveg', background: 'Háttér', position: 'Elhelyezés', reset: 'Visszaállítás', bgOpacity: 'Háttér átlátszatlansága',
            wide: 'Szélesvásznú kitöltés', on: 'Be', off: 'Ki',
            quality: 'Magas minőség', hqNoHdcp: 'nincs HDCP', hqNoPlayReady: 'nincs PlayReady', hqDowngraded: 'csökkentve', hqReload: 'Minőségbeállítás alkalmazása…',
            hqFellBackUhd: 'Ez a számítógép nem tud 4K HDR-t lejátszani, ezért 1080p-t használ.', hqFellBackFhd: 'Ez a számítógép nem tud magas minőséget lejátszani, ezért a Disney+ alapértelmezett minőségét használja.',
            wideOn: 'Szélesvásznú kitöltés: be ({scale}×)', wideOnLater: 'Szélesvásznú kitöltés: be (lejátszáskor érvényes)',
            wideOnNoZoom: 'Szélesvásznú kitöltés: be (ennél az ablaknál nem kell nagyítás)', wideOff: 'Szélesvásznú kitöltés: ki',
            settingsName: 'Beállítások', styleName: 'Felirat stílusa',
            openHint: 'Lejátszás közben a lejátszó jobb alsó sarkában: {settings} (⚙) → {style}.',
            speed: 'Lejátszási sebesség', normal: '(Normál)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) a lejátszó jobb alsó sarkában\n{speed}: a mellette lévő gomb\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Teljes képernyő    F5  Újratöltés    F1  Súgó',
            tipNoPlayReady: 'A Disney+ csak hardveres DRM-mel (PlayReady SL3000) ad az alapértelmezettnél (legfeljebb 720p) jobb minőséget, ezt pedig a számítógép grafikus vezérlője nem támogatja.',
            tipNoHdcp: 'A kijelzőkapcsolat nem jelez HDCP-t, ezért a Disney+ alapértelmezett minőségben (legfeljebb 720p) játszik le. Ezt a távoli asztal, a rögzítőkártyák, az elosztók és egyes dokkolók okozzák: csatlakoztassa a monitort közvetlenül a számítógéphez.',
            tipNoHdcp22: 'A 4K HDR-hez HDCP 2.2 szükséges a kijelzőkapcsolaton, ezért 1080p-t használ. Használjon HDCP 2.2-t támogató monitort, kábelt és csatlakozót.',
            tipNoHevc: 'A 4K HDR-hez hardveres 10 bites HEVC-dekódolás kell, amelyet ez a számítógép nem jelez, ezért 1080p-t használ. Frissítse a grafikus illesztőprogramot, vagy telepítse a „HEVC-videobővítmények” csomagot a Microsoft Store-ból.',
            tipHdrOff: 'Ha HDR-ben szeretné látni a 4K-t, kapcsolja be a HDR-t a Windowsban: Beállítások → Rendszer → Kijelző → HDR használata.',
            tipOutput: 'A grafikus kártya nem felelt meg a Disney+ kimenetvédelmének, ezért 720p-ben játszik le. Ez az NVIDIA RTX 50-es sorozat illesztőprogramjainak ismert hibája. Ha a processzornak van integrált grafikája, csatlakoztassa a monitort az alaplap videokimenetéhez. Az illesztőprogram frissítése után válassza újra ezt: „{quality}”.',
        },
        ro: {
            ...LATIN_SIZES,
            'font.sans': 'Fără serife', 'font.light': 'Fără serife subțire', 'font.kai': 'Scris de mână', 'font.ming': 'Cu serife', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Alb', 'color.cream': 'Galben deschis', 'color.yellow': 'Galben', 'color.blue': 'Albastru deschis', 'color.green': 'Verde deschis', 'color.black': 'Negru',
            'edge.soft': 'Umbră fină', 'edge.drop': 'Umbră proiectată', 'edge.outline': 'Contur', 'edge.none': 'Niciunul',
            'background.none': 'Niciunul', 'background.dim': 'Semitransparent', 'background.solid': 'Opac',
            'position.0': 'Jos', 'position.1': 'Mijloc', 'position.2': 'Sus',
            text: 'Text', background: 'Fundal', position: 'Poziție', reset: 'Resetează', bgOpacity: 'Opacitatea fundalului',
            wide: 'Umplere ecran lat', on: 'Pornit', off: 'Oprit',
            quality: 'Calitate înaltă', hqNoHdcp: 'fără HDCP', hqNoPlayReady: 'fără PlayReady', hqDowngraded: 'redusă', hqReload: 'Se aplică setarea de calitate…',
            hqFellBackUhd: 'Acest PC nu poate reda 4K HDR, așa că se folosește 1080p.', hqFellBackFhd: 'Acest PC nu poate reda la calitate înaltă, așa că se folosește calitatea implicită Disney+.',
            wideOn: 'Umplere ecran lat: pornit ({scale}×)', wideOnLater: 'Umplere ecran lat: pornit (se aplică la redare)',
            wideOnNoZoom: 'Umplere ecran lat: pornit (această fereastră nu necesită mărire)', wideOff: 'Umplere ecran lat: oprit',
            settingsName: 'Setări', styleName: 'Stilul subtitrării',
            openHint: 'În timpul redării, deschide {settings} (⚙) din dreapta jos a playerului → {style}.',
            speed: 'Viteză de redare', normal: '(Normală)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) în dreapta jos a playerului\n{speed}: butonul de alături\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Ecran complet    F5  Reîncarcă    F1  Ajutor',
            tipNoPlayReady: 'Disney+ oferă mai mult decât calitatea implicită (până la 720p) doar cu DRM hardware (PlayReady SL3000), pe care placa grafică a acestui PC nu îl acceptă.',
            tipNoHdcp: 'Conexiunea afișajului nu raportează HDCP, așa că Disney+ redă la calitatea implicită (până la 720p). Cauza sunt desktopul la distanță, plăcile de captură, splitterele și unele docuri: conectează monitorul direct la PC.',
            tipNoHdcp22: '4K HDR necesită HDCP 2.2 pe conexiunea afișajului, așa că se folosește 1080p. Folosește un monitor, un cablu și un port compatibile cu HDCP 2.2.',
            tipNoHevc: '4K HDR necesită decodare HEVC pe 10 biți prin hardware, pe care acest PC nu o raportează, așa că se folosește 1080p. Actualizează driverul plăcii grafice sau instalează „Extensii video HEVC” din Microsoft Store.',
            tipHdrOff: 'Pentru a vedea 4K în HDR, activează HDR în Windows: Setări → Sistem → Afișaj → Utilizați HDR.',
            tipOutput: 'Placa grafică nu a trecut de protecția ieșirii Disney+, așa că redarea este la 720p. Este o problemă cunoscută a driverelor NVIDIA RTX seria 50. Dacă procesorul are grafică integrată, conectează monitorul la ieșirea video a plăcii de bază. După o actualizare a driverului, alege din nou „{quality}” pentru a reîncerca.',
        },
        hr: {
            ...LATIN_SIZES,
            'font.sans': 'Bez serifa', 'font.light': 'Tanki bez serifa', 'font.kai': 'Rukopisni', 'font.ming': 'Serifni', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Bijela', 'color.cream': 'Svijetložuta', 'color.yellow': 'Žuta', 'color.blue': 'Svijetloplava', 'color.green': 'Svijetlozelena', 'color.black': 'Crna',
            'edge.soft': 'Meka sjena', 'edge.drop': 'Bačena sjena', 'edge.outline': 'Obrub', 'edge.none': 'Ništa',
            'background.none': 'Ništa', 'background.dim': 'Poluprozirna', 'background.solid': 'Neprozirna',
            'position.0': 'Nisko', 'position.1': 'Sredina', 'position.2': 'Visoko',
            text: 'Tekst', background: 'Pozadina', position: 'Položaj', reset: 'Ponovo postavi', bgOpacity: 'Neprozirnost pozadine',
            wide: 'Ispuna širokog zaslona', on: 'Uključeno', off: 'Isključeno',
            quality: 'Visoka kvaliteta', hqNoHdcp: 'nema HDCP-a', hqNoPlayReady: 'nema PlayReadyja', hqDowngraded: 'smanjeno', hqReload: 'Primjena postavke kvalitete…',
            hqFellBackUhd: 'Ovo računalo ne može reproducirati 4K HDR pa se koristi 1080p.', hqFellBackFhd: 'Ovo računalo ne može reproducirati visoku kvalitetu pa se koristi zadana kvaliteta Disney+.',
            wideOn: 'Ispuna širokog zaslona: uključeno ({scale}×)', wideOnLater: 'Ispuna širokog zaslona: uključeno (primjenjuje se pri reprodukciji)',
            wideOnNoZoom: 'Ispuna širokog zaslona: uključeno (ovaj prozor ne treba povećanje)', wideOff: 'Ispuna širokog zaslona: isključeno',
            settingsName: 'Postavke', styleName: 'Stil titlova',
            openHint: 'Tijekom reprodukcije otvorite {settings} (⚙) dolje desno u playeru → {style}.',
            speed: 'Brzina reprodukcije', normal: '(Normalno)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) dolje desno u playeru\n{speed}: gumb pokraj\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Cijeli zaslon    F5  Ponovno učitaj    F1  Pomoć',
            tipNoPlayReady: 'Disney+ daje kvalitetu iznad zadane (do 720p) samo uz hardverski DRM (PlayReady SL3000), a grafika ovog računala ga ne podržava.',
            tipNoHdcp: 'Veza sa zaslonom ne prijavljuje HDCP pa Disney+ reproducira u zadanoj kvaliteti (do 720p). Uzrok su udaljena radna površina, kartice za snimanje, razdjelnici i neke priključne stanice: spojite monitor izravno na računalo.',
            tipNoHdcp22: '4K HDR zahtijeva HDCP 2.2 na vezi sa zaslonom pa se koristi 1080p. Koristite monitor, kabel i priključak s podrškom za HDCP 2.2.',
            tipNoHevc: '4K HDR zahtijeva hardversko dekodiranje HEVC-a u 10 bita, koje ovo računalo ne prijavljuje, pa se koristi 1080p. Ažurirajte upravljački program grafike ili instalirajte „HEVC Video Extensions” iz trgovine Microsoft Store.',
            tipHdrOff: 'Da biste gledali 4K u HDR-u, uključite HDR u sustavu Windows: Postavke → Sustav → Zaslon → Koristi HDR.',
            tipOutput: 'Grafička kartica nije prošla zaštitu izlaza Disney+ pa se reproducira u 720p. To je poznati problem upravljačkih programa za NVIDIA RTX seriju 50. Ako procesor ima integriranu grafiku, spojite monitor na video izlaz matične ploče. Nakon ažuriranja upravljačkog programa ponovno odaberite „{quality}” da biste pokušali opet.',
        },
        el: {
            ...LATIN_SIZES,
            'font.sans': 'Sans serif', 'font.light': 'Λεπτό sans serif', 'font.kai': 'Χειρόγραφη', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Λευκό', 'color.cream': 'Ανοιχτό κίτρινο', 'color.yellow': 'Κίτρινο', 'color.blue': 'Γαλάζιο', 'color.green': 'Ανοιχτό πράσινο', 'color.black': 'Μαύρο',
            'edge.soft': 'Απαλή σκιά', 'edge.drop': 'Προβαλλόμενη σκιά', 'edge.outline': 'Περίγραμμα', 'edge.none': 'Κανένα',
            'background.none': 'Κανένα', 'background.dim': 'Ημιδιαφανές', 'background.solid': 'Αδιαφανές',
            'position.0': 'Χαμηλά', 'position.1': 'Μέση', 'position.2': 'Ψηλά',
            text: 'Κείμενο', background: 'Φόντο', position: 'Θέση', reset: 'Επαναφορά', bgOpacity: 'Αδιαφάνεια φόντου',
            wide: 'Γέμισμα ευρείας οθόνης', on: 'Ενεργό', off: 'Ανενεργό',
            quality: 'Υψηλή ποιότητα', hqNoHdcp: 'χωρίς HDCP', hqNoPlayReady: 'χωρίς PlayReady', hqDowngraded: 'μειωμένη', hqReload: 'Εφαρμογή ρύθμισης ποιότητας…',
            hqFellBackUhd: 'Αυτός ο υπολογιστής δεν μπορεί να αναπαράγει 4K HDR, οπότε χρησιμοποιείται 1080p.', hqFellBackFhd: 'Αυτός ο υπολογιστής δεν μπορεί να αναπαράγει υψηλή ποιότητα, οπότε χρησιμοποιείται η προεπιλεγμένη ποιότητα του Disney+.',
            wideOn: 'Γέμισμα ευρείας οθόνης: ενεργό ({scale}×)', wideOnLater: 'Γέμισμα ευρείας οθόνης: ενεργό (εφαρμόζεται στην αναπαραγωγή)',
            wideOnNoZoom: 'Γέμισμα ευρείας οθόνης: ενεργό (αυτό το παράθυρο δεν χρειάζεται μεγέθυνση)', wideOff: 'Γέμισμα ευρείας οθόνης: ανενεργό',
            settingsName: 'Ρυθμίσεις', styleName: 'Στιλ υποτίτλων',
            openHint: 'Κατά την αναπαραγωγή, ανοίξτε {settings} (⚙) κάτω δεξιά στο πρόγραμμα αναπαραγωγής → {style}.',
            speed: 'Ταχύτητα αναπαραγωγής', normal: '(Κανονική)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) κάτω δεξιά στο πρόγραμμα αναπαραγωγής\n{speed}: το κουμπί δίπλα\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Πλήρης οθόνη    F5  Επαναφόρτωση    F1  Βοήθεια',
            tipNoPlayReady: 'Το Disney+ δίνει ποιότητα πάνω από την προεπιλεγμένη (έως 720p) μόνο με DRM υλικού (PlayReady SL3000), το οποίο δεν υποστηρίζουν τα γραφικά αυτού του υπολογιστή.',
            tipNoHdcp: 'Η σύνδεση της οθόνης δεν αναφέρει HDCP, οπότε το Disney+ αναπαράγεται στην προεπιλεγμένη ποιότητα (έως 720p). Αυτό προκαλείται από απομακρυσμένη επιφάνεια εργασίας, κάρτες λήψης, διαχωριστές και ορισμένους σταθμούς σύνδεσης: συνδέστε την οθόνη απευθείας στον υπολογιστή.',
            tipNoHdcp22: 'Το 4K HDR απαιτεί HDCP 2.2 στη σύνδεση της οθόνης, οπότε χρησιμοποιείται 1080p. Χρησιμοποιήστε οθόνη, καλώδιο και θύρα με υποστήριξη HDCP 2.2.',
            tipNoHevc: 'Το 4K HDR απαιτεί αποκωδικοποίηση HEVC 10 bit μέσω υλικού, την οποία αυτός ο υπολογιστής δεν αναφέρει, οπότε χρησιμοποιείται 1080p. Ενημερώστε το πρόγραμμα οδήγησης γραφικών ή εγκαταστήστε τις «Επεκτάσεις βίντεο HEVC» από το Microsoft Store.',
            tipHdrOff: 'Για να δείτε 4K σε HDR, ενεργοποιήστε το HDR στα Windows: Ρυθμίσεις → Σύστημα → Οθόνη → Χρήση HDR.',
            tipOutput: 'Η κάρτα γραφικών δεν πέρασε την προστασία εξόδου του Disney+, οπότε η αναπαραγωγή γίνεται σε 720p. Είναι γνωστό πρόβλημα των προγραμμάτων οδήγησης της σειράς NVIDIA RTX 50. Αν ο επεξεργαστής έχει ενσωματωμένα γραφικά, συνδέστε την οθόνη στην έξοδο βίντεο της μητρικής κάρτας. Μετά από ενημέρωση του προγράμματος οδήγησης, επιλέξτε ξανά «{quality}» για νέα δοκιμή.',
        },
        th: {
            ...LATIN_SIZES,
            'font.sans': 'Sans-serif', 'font.light': 'Sans-serif แบบบาง', 'font.kai': 'ลายมือ', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'ขาว', 'color.cream': 'เหลืองอ่อน', 'color.yellow': 'เหลือง', 'color.blue': 'ฟ้าอ่อน', 'color.green': 'เขียวอ่อน', 'color.black': 'ดำ',
            'edge.soft': 'เงาแบบนุ่ม', 'edge.drop': 'เงาทอด', 'edge.outline': 'เส้นขอบ', 'edge.none': 'ไม่มี',
            'background.none': 'ไม่มี', 'background.dim': 'โปร่งแสง', 'background.solid': 'ทึบ',
            'position.0': 'ต่ำ', 'position.1': 'กลาง', 'position.2': 'สูง',
            text: 'ข้อความ', background: 'พื้นหลัง', position: 'ตำแหน่ง', reset: 'รีเซ็ต', bgOpacity: 'ความทึบของพื้นหลัง',
            wide: 'เติมเต็มจอกว้าง', on: 'เปิด', off: 'ปิด',
            quality: 'คุณภาพสูง', hqNoHdcp: 'ไม่มี HDCP', hqNoPlayReady: 'ไม่มี PlayReady', hqDowngraded: 'ลดคุณภาพแล้ว', hqReload: 'กำลังใช้การตั้งค่าคุณภาพ…',
            hqFellBackUhd: 'พีซีเครื่องนี้เล่น 4K HDR ไม่ได้ จึงใช้ 1080p แทน', hqFellBackFhd: 'พีซีเครื่องนี้เล่นคุณภาพสูงไม่ได้ จึงใช้คุณภาพเริ่มต้นของ Disney+ แทน',
            wideOn: 'เติมเต็มจอกว้าง: เปิด ({scale}×)', wideOnLater: 'เติมเต็มจอกว้าง: เปิด (มีผลเมื่อเล่นวิดีโอ)',
            wideOnNoZoom: 'เติมเต็มจอกว้าง: เปิด (หน้าต่างนี้ไม่ต้องขยาย)', wideOff: 'เติมเต็มจอกว้าง: ปิด',
            settingsName: 'การตั้งค่า', styleName: 'การปรับแต่งคำบรรยาย',
            openHint: 'ระหว่างเล่นวิดีโอ ให้เปิด {settings} (⚙) ที่มุมขวาล่างของเครื่องเล่น → {style}',
            speed: 'ความเร็วในการเล่น', normal: '(ปกติ)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) ที่มุมขวาล่างของเครื่องเล่น\n{speed}: ปุ่มข้าง ๆ\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  เต็มจอ    F5  โหลดใหม่    F1  วิธีใช้',
            tipNoPlayReady: 'Disney+ จะให้คุณภาพสูงกว่าค่าเริ่มต้น (สูงสุด 720p) เฉพาะเมื่อมี DRM แบบฮาร์ดแวร์ (PlayReady SL3000) ซึ่งกราฟิกของพีซีเครื่องนี้ไม่รองรับ',
            tipNoHdcp: 'การเชื่อมต่อจอภาพไม่รายงาน HDCP Disney+ จึงเล่นที่คุณภาพเริ่มต้น (สูงสุด 720p) สาเหตุมาจากรีโมตเดสก์ท็อป การ์ดจับภาพ ตัวแยกสัญญาณ และด็อกบางรุ่น โปรดต่อจอภาพเข้ากับพีซีโดยตรง',
            tipNoHdcp22: '4K HDR ต้องใช้ HDCP 2.2 ในการเชื่อมต่อจอภาพ จึงใช้ 1080p แทน โปรดใช้จอภาพ สาย และพอร์ตที่รองรับ HDCP 2.2',
            tipNoHevc: '4K HDR ต้องถอดรหัส HEVC 10 บิตด้วยฮาร์ดแวร์ ซึ่งพีซีเครื่องนี้ไม่ได้รายงานว่ารองรับ จึงใช้ 1080p แทน โปรดอัปเดตไดรเวอร์กราฟิก หรือติดตั้ง "HEVC Video Extensions" จาก Microsoft Store',
            tipHdrOff: 'หากต้องการดู 4K แบบ HDR ให้เปิด HDR ใน Windows: การตั้งค่า → ระบบ → จอแสดงผล → ใช้ HDR',
            tipOutput: 'การ์ดจอไม่ผ่านการป้องกันสัญญาณขาออกของ Disney+ จึงเล่นที่ 720p นี่เป็นปัญหาที่ทราบกันของไดรเวอร์ NVIDIA RTX ซีรีส์ 50 หาก CPU มีกราฟิกในตัว ให้ต่อจอภาพเข้ากับช่องสัญญาณภาพของเมนบอร์ด หลังอัปเดตไดรเวอร์แล้ว ให้เลือก "{quality}" อีกครั้งเพื่อลองใหม่',
        },
        id: {
            ...LATIN_SIZES,
            'font.sans': 'Sans-serif', 'font.light': 'Sans-serif tipis', 'font.kai': 'Tulisan tangan', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Putih', 'color.cream': 'Kuning muda', 'color.yellow': 'Kuning', 'color.blue': 'Biru muda', 'color.green': 'Hijau muda', 'color.black': 'Hitam',
            'edge.soft': 'Bayangan lembut', 'edge.drop': 'Bayangan jatuh', 'edge.outline': 'Garis tepi', 'edge.none': 'Tidak ada',
            'background.none': 'Tidak ada', 'background.dim': 'Semi-transparan', 'background.solid': 'Pekat',
            'position.0': 'Rendah', 'position.1': 'Tengah', 'position.2': 'Tinggi',
            text: 'Teks', background: 'Latar Belakang', position: 'Posisi', reset: 'Reset', bgOpacity: 'Opasitas latar belakang',
            wide: 'Isi layar lebar', on: 'Aktif', off: 'Nonaktif',
            quality: 'Kualitas tinggi', hqNoHdcp: 'tanpa HDCP', hqNoPlayReady: 'tanpa PlayReady', hqDowngraded: 'diturunkan', hqReload: 'Menerapkan pengaturan kualitas…',
            hqFellBackUhd: 'PC ini tidak dapat memutar 4K HDR, jadi 1080p digunakan.', hqFellBackFhd: 'PC ini tidak dapat memutar kualitas tinggi, jadi kualitas bawaan Disney+ digunakan.',
            wideOn: 'Isi layar lebar: aktif ({scale}×)', wideOnLater: 'Isi layar lebar: aktif (diterapkan saat diputar)',
            wideOnNoZoom: 'Isi layar lebar: aktif (jendela ini tidak perlu diperbesar)', wideOff: 'Isi layar lebar: nonaktif',
            settingsName: 'Pengaturan', styleName: 'Tampilan Takarir',
            openHint: 'Saat video diputar, buka {settings} (⚙) di kanan bawah pemutar → {style}.',
            speed: 'Kecepatan putar', normal: '(Normal)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) di kanan bawah pemutar\n{speed}: tombol di sebelahnya\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Layar penuh    F5  Muat ulang    F1  Bantuan',
            tipNoPlayReady: 'Disney+ hanya memberi kualitas di atas bawaan (hingga 720p) dengan DRM perangkat keras (PlayReady SL3000), yang tidak didukung grafis PC ini.',
            tipNoHdcp: 'Sambungan layar tidak melaporkan HDCP, jadi Disney+ diputar dengan kualitas bawaan (hingga 720p). Penyebabnya desktop jarak jauh, kartu penangkap, splitter, dan beberapa dok: sambungkan monitor langsung ke PC.',
            tipNoHdcp22: '4K HDR memerlukan HDCP 2.2 pada sambungan layar, jadi 1080p digunakan. Gunakan monitor, kabel, dan port yang mendukung HDCP 2.2.',
            tipNoHevc: '4K HDR memerlukan dekode HEVC 10-bit dengan perangkat keras, yang tidak dilaporkan PC ini, jadi 1080p digunakan. Perbarui driver grafis atau instal "HEVC Video Extensions" dari Microsoft Store.',
            tipHdrOff: 'Untuk melihat 4K dalam HDR, aktifkan HDR di Windows: Pengaturan → Sistem → Layar → Gunakan HDR.',
            tipOutput: 'Kartu grafis tidak lolos perlindungan output Disney+, jadi diputar dalam 720p. Ini masalah yang diketahui pada driver NVIDIA RTX seri 50. Jika CPU Anda memiliki grafis terintegrasi, sambungkan monitor ke output video motherboard. Setelah memperbarui driver, pilih "{quality}" lagi untuk mencoba ulang.',
        },
        ms: {
            ...LATIN_SIZES,
            'font.sans': 'Sans-serif', 'font.light': 'Sans-serif nipis', 'font.kai': 'Tulisan tangan', 'font.ming': 'Serif', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'Putih', 'color.cream': 'Kuning cair', 'color.yellow': 'Kuning', 'color.blue': 'Biru muda', 'color.green': 'Hijau muda', 'color.black': 'Hitam',
            'edge.soft': 'Bayang lembut', 'edge.drop': 'Bayang jatuh', 'edge.outline': 'Garis luar', 'edge.none': 'Tiada',
            'background.none': 'Tiada', 'background.dim': 'Separa lut sinar', 'background.solid': 'Legap',
            'position.0': 'Rendah', 'position.1': 'Tengah', 'position.2': 'Tinggi',
            text: 'Teks', background: 'Latar Belakang', position: 'Kedudukan', reset: 'Tetapkan Semula', bgOpacity: 'Kelegapan latar belakang',
            wide: 'Isi skrin lebar', on: 'Hidup', off: 'Mati',
            quality: 'Kualiti tinggi', hqNoHdcp: 'tiada HDCP', hqNoPlayReady: 'tiada PlayReady', hqDowngraded: 'diturunkan', hqReload: 'Menggunakan tetapan kualiti…',
            hqFellBackUhd: 'PC ini tidak dapat memainkan 4K HDR, jadi 1080p digunakan.', hqFellBackFhd: 'PC ini tidak dapat memainkan kualiti tinggi, jadi kualiti lalai Disney+ digunakan.',
            wideOn: 'Isi skrin lebar: hidup ({scale}×)', wideOnLater: 'Isi skrin lebar: hidup (digunakan semasa dimainkan)',
            wideOnNoZoom: 'Isi skrin lebar: hidup (tetingkap ini tidak perlu dizum)', wideOff: 'Isi skrin lebar: mati',
            settingsName: 'Tetapan', styleName: 'Penggayaan Sari Kata',
            openHint: 'Semasa video dimainkan, buka {settings} (⚙) di kanan bawah pemain → {style}.',
            speed: 'Kelajuan main balik', normal: '(Biasa)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) di kanan bawah pemain\n{speed}: butang di sebelahnya\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  Skrin penuh    F5  Muat semula    F1  Bantuan',
            tipNoPlayReady: 'Disney+ hanya memberikan kualiti melebihi lalai (sehingga 720p) dengan DRM perkakasan (PlayReady SL3000), yang tidak disokong oleh grafik PC ini.',
            tipNoHdcp: 'Sambungan paparan tidak melaporkan HDCP, jadi Disney+ dimainkan pada kualiti lalai (sehingga 720p). Puncanya desktop jauh, kad tangkap, pemisah dan sesetengah dok: sambungkan monitor terus ke PC.',
            tipNoHdcp22: '4K HDR memerlukan HDCP 2.2 pada sambungan paparan, jadi 1080p digunakan. Gunakan monitor, kabel dan port yang menyokong HDCP 2.2.',
            tipNoHevc: '4K HDR memerlukan penyahkodan HEVC 10-bit perkakasan, yang tidak dilaporkan oleh PC ini, jadi 1080p digunakan. Kemas kini pemacu grafik atau pasang "HEVC Video Extensions" dari Microsoft Store.',
            tipHdrOff: 'Untuk menonton 4K dalam HDR, hidupkan HDR dalam Windows: Tetapan → Sistem → Paparan → Gunakan HDR.',
            tipOutput: 'Kad grafik tidak melepasi perlindungan output Disney+, jadi main balik dalam 720p. Ini masalah yang diketahui pada pemacu NVIDIA RTX siri 50. Jika CPU anda mempunyai grafik bersepadu, sambungkan monitor ke output video papan induk. Selepas mengemas kini pemacu, pilih "{quality}" sekali lagi untuk mencuba semula.',
        },
        ar: {
            ...LATIN_SIZES,
            'font.sans': 'بدون تذييل', 'font.light': 'بدون تذييل رفيع', 'font.kai': 'خط يدوي', 'font.ming': 'بتذييل', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'أبيض', 'color.cream': 'أصفر فاتح', 'color.yellow': 'أصفر', 'color.blue': 'أزرق فاتح', 'color.green': 'أخضر فاتح', 'color.black': 'أسود',
            'edge.soft': 'ظل ناعم', 'edge.drop': 'ظل خلفي', 'edge.outline': 'حدّ خارجي', 'edge.none': 'بلا',
            'background.none': 'بلا', 'background.dim': 'شبه شفافة', 'background.solid': 'معتمة',
            'position.0': 'منخفض', 'position.1': 'متوسط', 'position.2': 'مرتفع',
            text: 'النص', background: 'الخلفية', position: 'الموضع', reset: 'إعادة تعيين', bgOpacity: 'عتامة الخلفية',
            wide: 'ملء الشاشة العريضة', on: 'تشغيل', off: 'إيقاف',
            quality: 'جودة عالية', hqNoHdcp: 'بدون HDCP', hqNoPlayReady: 'بدون PlayReady', hqDowngraded: 'تم الخفض', hqReload: 'جارٍ تطبيق إعداد الجودة…',
            hqFellBackUhd: 'لا يمكن لهذا الكمبيوتر تشغيل 4K HDR، لذا تُستخدم دقة 1080p.', hqFellBackFhd: 'لا يمكن لهذا الكمبيوتر تشغيل الجودة العالية، لذا تُستخدم الجودة الافتراضية لـ Disney+.',
            wideOn: 'ملء الشاشة العريضة: تشغيل ({scale}×)', wideOnLater: 'ملء الشاشة العريضة: تشغيل (يُطبَّق عند التشغيل)',
            wideOnNoZoom: 'ملء الشاشة العريضة: تشغيل (لا تحتاج هذه النافذة إلى تكبير)', wideOff: 'ملء الشاشة العريضة: إيقاف',
            settingsName: 'الإعدادات', styleName: 'نمط الترجمة',
            openHint: 'أثناء تشغيل الفيديو، افتح {settings} (⚙) أسفل المشغّل ← {style}.',
            speed: 'سرعة التشغيل', normal: '(عادية)',
            help: 'Disney+ Desktop\n{style}، {wide}، {quality}: {settings} (⚙) أسفل المشغّل\n{speed}: الزر المجاور له\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  ملء الشاشة    F5  إعادة التحميل    F1  المساعدة',
            tipNoPlayReady: 'لا يقدّم Disney+ جودة أعلى من الجودة الافتراضية (حتى 720p) إلا مع إدارة الحقوق الرقمية عبر العتاد (PlayReady SL3000)، ورسومات هذا الكمبيوتر لا تدعمها.',
            tipNoHdcp: 'لا يُبلغ اتصال الشاشة عن HDCP، لذا يُشغَّل Disney+ بالجودة الافتراضية (حتى 720p). يحدث هذا بسبب سطح المكتب البعيد وبطاقات الالتقاط والموزّعات وبعض محطات الإرساء: صِل الشاشة بالكمبيوتر مباشرةً.',
            tipNoHdcp22: 'تتطلب دقة 4K HDR وجود HDCP 2.2 في اتصال الشاشة، لذا تُستخدم دقة 1080p. استخدم شاشة وكابلاً ومنفذاً تدعم HDCP 2.2.',
            tipNoHevc: 'تتطلب دقة 4K HDR فك ترميز HEVC بعمق 10 بت عبر العتاد، ولا يُبلغ هذا الكمبيوتر عن دعمه، لذا تُستخدم دقة 1080p. حدّث برنامج تشغيل الرسومات أو ثبّت "HEVC Video Extensions" من Microsoft Store.',
            tipHdrOff: 'لمشاهدة 4K بتقنية HDR، فعّل HDR في Windows: الإعدادات ← النظام ← الشاشة ← استخدام HDR.',
            tipOutput: 'لم تجتز بطاقة الرسومات حماية الإخراج في Disney+، لذا يجري التشغيل بدقة 720p. هذه مشكلة معروفة في برامج تشغيل NVIDIA RTX من الفئة 50. إذا كان المعالج يحتوي على رسومات مدمجة، فصِل الشاشة بمخرج الفيديو في اللوحة الأم. بعد تحديث برنامج التشغيل، اختر "{quality}" مرة أخرى لإعادة المحاولة.',
        },
        he: {
            ...LATIN_SIZES,
            'font.sans': 'ללא תגים', 'font.light': 'ללא תגים דק', 'font.kai': 'כתב יד', 'font.ming': 'עם תגים', 'font.notoSans': 'Noto Sans', 'font.notoSerif': 'Noto Serif',
            'color.white': 'לבן', 'color.cream': 'צהוב בהיר', 'color.yellow': 'צהוב', 'color.blue': 'תכלת', 'color.green': 'ירוק בהיר', 'color.black': 'שחור',
            'edge.soft': 'צל רך', 'edge.drop': 'הטלת צללית', 'edge.outline': 'קו מתאר', 'edge.none': 'ללא',
            'background.none': 'ללא', 'background.dim': 'שקוף למחצה', 'background.solid': 'אטום',
            'position.0': 'נמוך', 'position.1': 'אמצע', 'position.2': 'גבוה',
            text: 'טקסט', background: 'רקע', position: 'מיקום', reset: 'איפוס', bgOpacity: 'אטימות הרקע',
            wide: 'מילוי מסך רחב', on: 'פעיל', off: 'כבוי',
            quality: 'איכות גבוהה', hqNoHdcp: 'ללא HDCP', hqNoPlayReady: 'ללא PlayReady', hqDowngraded: 'הונמך', hqReload: 'מחיל את הגדרת האיכות…',
            hqFellBackUhd: 'המחשב הזה לא יכול להפעיל 4K HDR, לכן נעשה שימוש ב-1080p.', hqFellBackFhd: 'המחשב הזה לא יכול להפעיל איכות גבוהה, לכן נעשה שימוש באיכות ברירת המחדל של Disney+.',
            wideOn: 'מילוי מסך רחב: פעיל ({scale}×)', wideOnLater: 'מילוי מסך רחב: פעיל (יוחל בזמן ההפעלה)',
            wideOnNoZoom: 'מילוי מסך רחב: פעיל (החלון הזה לא צריך הגדלה)', wideOff: 'מילוי מסך רחב: כבוי',
            settingsName: 'הגדרות', styleName: 'תצוגת הכתוביות',
            openHint: 'בזמן הפעלת סרטון, פתחו את {settings} (⚙) בתחתית הנגן ← {style}.',
            speed: 'מהירות הפעלה', normal: '(רגילה)',
            help: 'Disney+ Desktop\n{style}, {wide}, {quality}: {settings} (⚙) בתחתית הנגן\n{speed}: הכפתור שלידו\n' +
                'Ctrl+Shift+S  {style}\nCtrl+Shift+W  {wide}\nF11  מסך מלא    F5  טעינה מחדש    F1  עזרה',
            tipNoPlayReady: 'Disney+ מספק איכות גבוהה מברירת המחדל (עד 720p) רק עם DRM בחומרה (PlayReady SL3000), והגרפיקה של המחשב הזה לא תומכת בו.',
            tipNoHdcp: 'חיבור המסך לא מדווח על HDCP, לכן Disney+ מופעל באיכות ברירת המחדל (עד 720p). הגורמים לכך הם שולחן עבודה מרוחק, כרטיסי לכידה, מפצלים וחלק מתחנות העגינה: חברו את המסך ישירות למחשב.',
            tipNoHdcp22: '4K HDR דורש HDCP 2.2 בחיבור המסך, לכן נעשה שימוש ב-1080p. השתמשו במסך, בכבל וביציאה שתומכים ב-HDCP 2.2.',
            tipNoHevc: '4K HDR דורש פענוח HEVC של 10 ביט בחומרה, והמחשב הזה לא מדווח עליו, לכן נעשה שימוש ב-1080p. עדכנו את מנהל ההתקן של הגרפיקה או התקינו את "HEVC Video Extensions" מ-Microsoft Store.',
            tipHdrOff: 'כדי לראות 4K ב-HDR, הפעילו HDR ב-Windows: הגדרות ← מערכת ← תצוגה ← השתמש ב-HDR.',
            tipOutput: 'כרטיס המסך לא עבר את הגנת הפלט של Disney+, לכן ההפעלה היא ב-720p. זו בעיה ידועה במנהלי ההתקן של NVIDIA RTX מסדרה 50. אם במעבד יש גרפיקה משולבת, חברו את המסך ליציאת הווידאו של לוח האם. לאחר עדכון מנהל ההתקן, בחרו שוב "{quality}" כדי לנסות שוב.',
        },
    }

    // Disney+'s own names where a region words them differently from the main language.
    const REGIONAL = {
        'es-419': { settingsName: 'Ajustes', styleName: 'Estilo de subtítulos', tipHdrOff: 'Para ver 4K en HDR, activa HDR en Windows: Configuración → Sistema → Pantalla → Usar HDR.' },
        'en-gb': { styleName: 'Subtitle styling' },
        'zh-hk': { reset: '重設' },
    }

    const RTL_LANGS = new Set(['ar', 'he'])

    // Disney+ UI locale, lower case: <html lang>, else the locale in the URL (/zh-hant/…), else the system language.
    function locale() {
        const segment = location.pathname.split('/')[1] || ''
        // This script runs before <html> exists, so documentElement can still be null.
        return ((document.documentElement && document.documentElement.lang) ||
            (/^[a-z]{2}(-[a-z0-9]{2,4})?$/i.test(segment) ? segment : '') ||
            navigator.language || 'en').toLowerCase()
    }

    // Our table for the Disney+ UI language (English when we don't have it).
    function lang() {
        const raw = locale()
        if (raw.startsWith('zh')) return /hant|-tw|-hk|-mo/.test(raw) ? 'zh-Hant' : 'zh-Hans'
        if (raw.startsWith('pt')) return raw === 'pt-pt' ? 'pt-PT' : 'pt-BR'
        const code = ({ nb: 'no', nn: 'no', iw: 'he', in: 'id' })[raw.slice(0, 2)] || raw.slice(0, 2)
        return I18N[code] ? code : 'en'
    }

    const uiDir = () => (RTL_LANGS.has(lang()) ? 'rtl' : 'ltr')

    function lookup(key) {
        const raw = locale()
        const regional = REGIONAL[raw] || (raw.startsWith('es-') && raw !== 'es-es' ? REGIONAL['es-419'] : null)
        return (regional && regional[key]) ?? (I18N[lang()] || I18N.en)[key] ?? I18N.en[key] ?? key
    }

    function t(key, vars) {
        let s = lookup(key)
        const names = {
            settings: lookup('settingsName'), style: lookup('styleName'), wide: lookup('wide'),
            speed: lookup('speed'), quality: lookup('quality'), ...vars,
        }
        for (const [k, v] of Object.entries(names)) s = s.split(`{${k}}`).join(v)
        return s
    }

    // Font stacks: a Latin face first, then the UI language's own faces (Han characters look different in
    // Traditional / Simplified Chinese, Japanese and Korean fonts; Thai needs a Thai face).
    const CJK_FONTS = {
        sans: {
            'zh-Hant': ['"Microsoft JhengHei UI"', '"Microsoft JhengHei"'], 'zh-Hans': ['"Microsoft YaHei UI"', '"Microsoft YaHei"'],
            ja: ['"Yu Gothic UI"', '"Meiryo UI"', 'Meiryo'], ko: ['"Malgun Gothic"'], th: ['"Leelawadee UI"', 'Tahoma'],
        },
        serif: {
            'zh-Hant': ['PMingLiU', 'MingLiU'], 'zh-Hans': ['SimSun', 'NSimSun'],
            ja: ['"Yu Mincho"', '"MS PMincho"'], ko: ['Batang'], th: ['"Leelawadee UI"', 'Tahoma'],
            ar: ['"Times New Roman"'], he: ['"Times New Roman"'],
        },
        script: {
            'zh-Hant': ['DFKai-SB', 'BiauKai'], 'zh-Hans': ['KaiTi', 'STKaiti'], ja: ['DFKai-SB'], ko: ['Gungsuh'], th: ['"Leelawadee UI"'],
        },
    }

    function fontStack(kind, latin, generic) {
        const list = [...latin]
        for (const l of [lang(), 'zh-Hant', 'zh-Hans', 'ja', 'ko'])
            for (const f of CJK_FONTS[kind][l] || []) if (!list.includes(f)) list.push(f)
        list.push(generic)
        return list.join(', ')
    }

    const uiFont = () => fontStack('sans', ['"Segoe UI"'], 'sans-serif')

    // Noto (思源) families cover every script. They are used only if installed on this PC (no download);
    // the regional cuts follow the UI language, and the system fonts above are the fallback.
    const NOTO_REGIONS = { 'zh-Hant': ['TC', 'HK'], 'zh-Hans': ['SC'], ja: ['JP'], ko: ['KR'] }

    function notoStack(kind) {
        const list = [`"Noto ${kind}"`]
        for (const l of [lang(), 'zh-Hant', 'zh-Hans', 'ja', 'ko'])
            for (const region of NOTO_REGIONS[l] || []) {
                const f = `"Noto ${kind} ${region}"`
                if (!list.includes(f)) list.push(f)
            }
        return `${list.join(', ')}, ${kind === 'Serif' ? fontStack('serif', ['Georgia'], 'serif') : fontStack('sans', ['"Segoe UI"'], 'sans-serif')}`
    }

    // ------------------------------------------------------------------ options

    const DARK = '0,0,0'
    const LIGHT = '255,255,255'
    // Shadows and boxes take a colour that contrasts with the text: dark for light text, light for black text.
    const outline = (rgb) => [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.3], [0, 1.3], [-1.3, 0], [1.3, 0]]
        .map(([x, y]) => `${(x * 0.045).toFixed(3)}em ${(y * 0.045).toFixed(3)}em 0 rgb(${rgb})`).join(', ')

    // Text sizes are a share of the window height, so they scale with the player like Netflix's do.
    // Five evenly spaced steps (0.75vh apart).
    const OPTIONS = {
        size: [
            { value: 0, vh: 3.0 }, { value: 1, vh: 3.75 }, { value: 2, vh: 4.5 }, { value: 3, vh: 5.25 }, { value: 4, vh: 6.0 },
        ],
        // Keys kept from earlier versions so saved settings still load.
        font: [
            { value: 'sans', weight: 600, family: () => fontStack('sans', ['"Segoe UI"'], 'sans-serif') },
            { value: 'light', weight: 400, family: () => fontStack('sans', ['"Segoe UI"'], 'sans-serif') },
            { value: 'kai', weight: 400, family: () => fontStack('script', ['"Segoe Print"'], 'cursive') },
            { value: 'ming', weight: 400, family: () => fontStack('serif', ['Georgia'], 'serif') },
            { value: 'notoSans', weight: 500, family: () => notoStack('Sans') },
            { value: 'notoSerif', weight: 600, family: () => notoStack('Serif') },
        ],
        color: [
            { value: 'white', css: '#ffffff', contrast: DARK },
            { value: 'cream', css: '#fff3b0', contrast: DARK },
            { value: 'yellow', css: '#ffd54a', contrast: DARK },
            { value: 'blue', css: '#9be3ff', contrast: DARK },
            { value: 'green', css: '#b9f6a5', contrast: DARK },
            { value: 'black', css: '#000000', contrast: LIGHT },
        ],
        edge: [
            { value: 'soft', css: (c) => `0 0 .06em rgb(${c}), 0 0 .18em rgba(${c},.9), 0 0 .4em rgba(${c},.55)` },
            { value: 'drop', css: (c) => `.05em .07em .06em rgba(${c},.95), 0 0 .16em rgba(${c},.5)` },
            { value: 'outline', css: outline },
            { value: 'none', css: () => 'none' },
        ],
        background: [
            { value: 'none', alpha: 0 }, { value: 'dim', alpha: 0.5 }, { value: 'solid', alpha: 0.85 },
        ],
        // Distance of the subtitle from the bottom of Disney+'s subtitle area. That area ends just above the
        // controls while they are shown and near the screen edge once they hide, so subtitles drop down
        // (and move back up for the controls) like Netflix's.
        position: [
            { value: 0, vh: 2 }, { value: 1, vh: 6 }, { value: 2, vh: 10 },
        ],
    }
    const optionLabel = (key, o) => t(`${key}.${o.value}`)

    // Netflix-like defaults: medium white text, soft shadow, no box.
    // quality: 'fhd' (1080p) | 'uhd' (4K HDR) | 'off' (Disney+'s own choice); used only when the PC supports it.
    const DEFAULTS = Object.freeze({
        size: 2, font: 'sans', color: 'white', edge: 'soft', background: 'none', position: 0, wide: false, quality: 'fhd',
    })
    const QUALITIES = ['fhd', 'uhd', 'off']

    function sanitize(raw) {
        const s = { ...DEFAULTS }
        if (raw && typeof raw === 'object') {
            if (typeof raw.wide === 'boolean') s.wide = raw.wide
            if (QUALITIES.includes(raw.quality)) s.quality = raw.quality
            for (const key of Object.keys(OPTIONS)) {
                if (OPTIONS[key].some((o) => o.value === raw[key])) s[key] = raw[key]
            }
        }
        return s
    }

    let settings = sanitize(SAVED)
    const pick = (key) => OPTIONS[key].find((o) => o.value === settings[key]) || OPTIONS[key][0]

    const post = (message) => {
        try { window.chrome?.webview?.postMessage(message) } catch (_) { /* not hosted */ }
    }

    // ------------------------------------------------------------------ subtitles

    const CUES = ['.hive-subtitle-renderer-cue', '.dss-subtitle-renderer-cue']
    const sel = (suffix) => CUES.map((c) => c + suffix).join(', ')
    // The cue is an inline <span>, so moving it up is done on its block-level positioning box.
    const BOXES = '.hive-subtitle-renderer-cue-positioning-box, .dss-subtitle-renderer-cue-positioning-box'
    const WINDOWS = '.hive-subtitle-renderer-cue-window, .dss-subtitle-renderer-cue-window'
    const sheet = new CSSStyleSheet()
    let sheetLang = null

    // Shadow / box colour contrasting with the chosen text colour.
    const edgeCss = () => pick('edge').css(pick('color').contrast)
    const boxCss = () => {
        const alpha = pick('background').alpha
        return alpha ? `rgba(${pick('color').contrast},${alpha})` : 'transparent'
    }

    function subtitleCss() {
        const font = pick('font')
        const box = boxCss()
        const fromBottom = pick('position').vh
        const text =
            `font-size: max(12px, ${pick('size').vh}vh) !important; line-height: 1.3 !important;` +
            `color: ${pick('color').css} !important; text-shadow: ${edgeCss()} !important;` +
            '-webkit-text-stroke: 0 transparent !important; opacity: 1 !important;' +
            `font-family: ${font.family()} !important; font-weight: ${font.weight} !important;`
        const padding = box === 'transparent' ? '' :
            'padding: 0 .3em !important; border-radius: .15em; -webkit-box-decoration-break: clone; box-decoration-break: clone;'
        // Bottom subtitles (marked by markSubtitleBoxes) are anchored to the bottom of Disney+'s subtitle area;
        // subtitles Disney+ deliberately places higher up (e.g. on-screen text) keep their position.
        // Disney+'s subtitle area starts 120px below the window top even while the controls are hidden, which
        // pushes top subtitles towards the middle; like its bottom edge, let it reach 20px from the top then
        // (it still makes room for the top controls when they appear).
        return `
:host { --timed-text-override-region--inset-block-start-controls-decayed: 20px !important; }
[data-dpd-bottom] { top: auto !important; bottom: ${fromBottom}vh !important; height: auto !important; }
${WINDOWS} { background-color: transparent !important; }
${sel('')}, ${sel(' *')} { ${text} background-color: transparent !important; }
${sel(' > *')} { background-color: ${box} !important; ${padding} }
video::cue { ${text} background-color: ${box} !important; }`
    }

    function refreshSubtitleSheet() {
        sheetLang = lang()
        sheet.replaceSync(subtitleCss())
    }

    // Disney+ places each subtitle box with an inline "top" inside its subtitle area. Boxes in the lower part
    // of that area are regular bottom subtitles; mark them so our CSS can anchor them to the bottom instead.
    function markSubtitleBoxes(root) {
        for (const box of root.querySelectorAll(BOXES)) {
            const area = box.offsetParent || box.parentElement
            const top = parseFloat(box.style.top)
            const height = area ? area.clientHeight : 0
            const isBottom = !Number.isFinite(top) || !height || top > height * 0.4
            if (isBottom !== box.hasAttribute('data-dpd-bottom')) box.toggleAttribute('data-dpd-bottom', isBottom)
        }
    }

    // Mark new subtitle boxes before they are painted (no visible jump), not just on the next tick.
    const watchedSubtitleRoots = new WeakSet()

    function watchSubtitles(root) {
        if (watchedSubtitleRoots.has(root) || !root.querySelector || !root.host ||
            root.host.localName !== 'timed-text-override-region') return
        watchedSubtitleRoots.add(root)
        new MutationObserver(() => markSubtitleBoxes(root))
            .observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
        markSubtitleBoxes(root)
    }

    // Player components whose shadow trees hold the subtitles, the video, the controls and the settings dialog.
    const HOSTS = 'timed-text-override-region, disney-web-player, disney-web-player-ui, main-app-controls-overlay'

    function collectRoots() {
        const roots = [document]
        const seen = new Set()
        const visit = (root, depth) => {
            const elements = root === document ? document.querySelectorAll(HOSTS) : root.querySelectorAll('*')
            for (const el of elements) {
                const shadow = el.shadowRoot
                if (!shadow || seen.has(shadow)) continue
                seen.add(shadow)
                roots.push(shadow)
                if (depth < 6) visit(shadow, depth + 1)
            }
        }
        visit(document, 0)
        return roots
    }

    function adoptSheet(root, s) {
        try {
            const list = root.adoptedStyleSheets
            if (!list.includes(s)) root.adoptedStyleSheets = [...list, s]
        } catch (_) { /* root not ready */ }
    }

    // ------------------------------------------------------------------ widescreen fill

    const CINEMASCOPE = 2.39
    let scaledVideo = null
    let lastScale = 1
    let lastVideo = null

    function mainVideo(roots) {
        let best = null
        let bestArea = 0
        for (const root of roots) {
            for (const v of root.querySelectorAll('video')) {
                const area = v.offsetWidth * v.offsetHeight
                if (area > bestArea) { best = v; bestArea = area }
            }
        }
        return best
    }

    const inPlayer = () => /\/(play|video)\//.test(location.pathname)

    // Only the playback view, never the trailers on browse/detail pages.
    function isPlayerVideo(v) {
        return inPlayer() || (v.offsetWidth >= innerWidth * 0.9 && v.offsetHeight >= innerHeight * 0.9)
    }

    // Zoom so the picture fills the window width, but never past a 2.39:1 crop.
    function wideScale(v) {
        const aspect = v.videoWidth > 0 && v.videoHeight > 0 ? v.videoWidth / v.videoHeight : 16 / 9
        const w = v.offsetWidth
        const h = v.offsetHeight
        if (!w || !h) return 1
        const pictureWidth = Math.min(w, h * aspect)
        const s = Math.min(innerWidth / pictureWidth, CINEMASCOPE / aspect)
        return s > 1.005 ? s : 1
    }

    function applyWide(roots) {
        const v = mainVideo(roots)
        lastVideo = v && isPlayerVideo(v) ? v : null
        const target = settings.wide ? lastVideo : null
        lastScale = target ? wideScale(target) : 1
        const next = lastScale > 1 ? target : null
        if (scaledVideo && scaledVideo !== next) scaledVideo.style.removeProperty('scale')
        if (next) {
            const value = lastScale.toFixed(4)
            if (next.style.getPropertyValue('scale') !== value) next.style.setProperty('scale', value)
        }
        scaledVideo = next
    }

    // ------------------------------------------------------------------ toast

    let toastEl = null
    let toastTimer = 0
    let toastHideTimer = 0

    function toast(text, ms = 2200) {
        const root = document.body || document.documentElement
        if (!root) return
        if (!toastEl || !toastEl.isConnected) {
            toastEl = document.createElement('div')
            toastEl.setAttribute('popover', 'manual')
            toastEl.style.cssText = [
                // Centred in the window, like a dialog; it closes by itself.
                'position:fixed', 'inset:auto', 'top:50%', 'left:50%', 'transform:translate(-50%,-50%)',
                'margin:0', 'border:1px solid rgba(255,255,255,.16)', 'border-radius:10px',
                'padding:12px 20px', 'max-width:min(560px,90vw)', 'max-height:90vh', 'overflow:hidden', 'background:rgba(20,20,20,.92)',
                'color:#fff', 'font-size:15px', 'font-weight:500', 'line-height:1.6',
                'white-space:pre-wrap', 'box-shadow:0 8px 28px rgba(0,0,0,.45)',
                'opacity:0', 'transition:opacity .2s ease', 'pointer-events:none',
            ].join(';')
            root.appendChild(toastEl)
        }
        toastEl.style.fontFamily = uiFont()
        toastEl.dir = uiDir()
        toastEl.textContent = String(text)
        clearTimeout(toastTimer)
        clearTimeout(toastHideTimer)
        bringToTop(toastEl)
        requestAnimationFrame(() => { toastEl.style.opacity = '1' })
        toastTimer = setTimeout(() => {
            toastEl.style.opacity = '0'
            toastHideTimer = setTimeout(() => { try { toastEl.hidePopover() } catch (_) { } }, 250)
        }, ms)
    }

    // Shortcuts, plus why this PC gets less than the chosen quality (and what helps) when that applies.
    function showHelp(ms = 7000) {
        let tip = null
        try { tip = qualityTip() } catch (_) { }
        // The first line names the app; add its version.
        const help = t('help').replace(/^Disney\+ Desktop/, `Disney+ Desktop ${APP_VERSION}`)
        toast(tip ? `${help}\n\n${t(tip)}` : help, tip ? Math.max(ms, 14000) : ms)
    }

    // Re-opening a popover puts it on top of the top layer (above fullscreen video and modal dialogs).
    function bringToTop(el) {
        try { el.hidePopover() } catch (_) { }
        try { el.showPopover() } catch (_) { }
    }

    // ------------------------------------------------------------------ our caption-style page (Disney+'s own UI)
    //
    // Built inside Disney+'s <caption-settings-view> with Disney+'s own layout classes and components
    // (caption-preview, captions-font-size, styled-radio-buttons, picker-dots, snap-slider), so it looks
    // like the original page; only the options are ours. Disney+'s original form is hidden.

    // Style variables that Disney+'s wrapper components (font-picker / color-opacity-picker) normally provide.
    const disneyFormSheet = new CSSStyleSheet()
    disneyFormSheet.replaceSync(`
.settings-container:not(.dpd-form) { display: none !important; }
.dpd-tiles {
  padding: 8px; background-color: rgba(255,255,255,.08); border-radius: 6px;
  --styled-radio-buttons--flex-wrap: wrap; --styled-radio-buttons--gap: 12px;
  --styled-radio-buttons--padding: 0; --styled-radio-buttons--margin: 0;
  --styled-radio-buttons__styled-radio--width: 40px; --styled-radio-buttons__styled-radio--height: 44px;
  --styled-radio-buttons__styled-radio--outline: 2px solid #ffffff;
  --styled-radio-buttons__styled-radio--focused-outline: 3px solid #ffffff;
  --styled-radio-buttons__styled-radio--background-color: rgba(255,255,255,.08);
  --styled-radio-buttons__styled-radio--border-radius: 4px;
  --styled-radio-buttons__styled-radio--padding: 7px 6px;
  --styled-radio-buttons__styled-radio__before--color: #ffffff;
  --styled-radio-buttons__styled-radio__before--font-size: 20px;
  --styled-radio-buttons__styled-radio__before--line-height: 30px;
  --styled-radio-buttons__styled-radio__before--text-align: center;
}
.dpd-tiles.dpd-screens {
  --styled-radio-buttons__styled-radio--width: 56px; --styled-radio-buttons__styled-radio--height: 36px;
  --styled-radio-buttons__styled-radio--padding: 0;
}
.dpd-dots {
  padding: 10px; background-color: #000000; border-radius: 6px;
  --picker-dots--gap: 12px; --picker-dots--flex-wrap: wrap;
  --picker-dots__dot--size: 24px;
  --picker-dots__dot--outline: 2px solid #ffffff;
  --picker-dots__dot--focused-outline: 3px solid #ffffff;
}
.dpd-slider {
  padding: 10px 14px; background-color: #000000; border-radius: 6px;
  --snap-slider--padding: 0 10px; --snap-slider__range--height: 24px; --snap-slider__range--width: 100%;
  --snap-slider__range--background-color: #f0f0f0;
  --snap-slider__range--background-image: linear-gradient(90deg, rgba(0,0,0,0), #000000);
  --snap-slider__range--before--background-color: #f0f0f0;
  --snap-slider__range--after--background-color: #000000;
  --snap-slider__range--border-width: 2px; --snap-slider__range--border-style: solid; --snap-slider__range--border-color: #666666;
  --snap-slider__thumb--background-color: #333333; --snap-slider__thumb--top: 0; --snap-slider__thumb--size: 24px;
  --snap-slider__thumb--transition: inset-inline-start 100ms ease-out;
  --snap-slider__snap-point--color: #ffffff; --snap-slider__snap-point--size: 10px;
  --snap-slider__snap-point--border-style: solid; --snap-slider__snap-point--border-color: #000000;
  --snap-slider__snap-point--border-width: 0.5px;
}`)

    // Faint ring so the black dot stays visible on the picker's black background.
    const dotsSheet = new CSSStyleSheet()
    dotsSheet.replaceSync('.dot { box-shadow: inset 0 0 0 1px rgba(255,255,255,.45); }')

    // Text size of each option inside Disney+'s size control (grows like the original's small/medium/large).
    const SIZE_BUTTON_PX = { 0: '12px', 1: '14px', 2: '16px', 3: '18px', 4: '20px' }
    const PREVIEW_PX_PER_VH = 4 // preview text is drawn larger than true scale so the steps are readable
    const BG_STEP = 100 / (OPTIONS.background.length - 1)
    const cssString = (s) => `"${String(s).replace(/["\\]/g, '\\$&')}"`

    const styleForms = new Set()

    function createStyleForm(view) {
        const original = view.shadowRoot.querySelector('.settings-container:not(.dpd-form)')
        const textOf = (selector, fallback) => (original && original.querySelector(selector)?.textContent.trim()) || fallback
        const set = (key, value) => { settings[key] = value; commit() }
        const sample = cssString('Aa') // same sample in every language, like Disney+'s own font tiles

        const form = document.createElement('div')
        form.className = 'settings-container dpd-form'
        form.setAttribute('role', 'form')

        const section = (title) => {
            const s = document.createElement('section')
            s.className = 'settings-section'
            const h = document.createElement('h3')
            h.className = 'settings-section__heading locale-metadata-heavy'
            h.textContent = title
            s.append(h)
            form.append(s)
            return s
        }
        const content = (sec, child, wrapClass) => {
            const c = document.createElement('div')
            c.className = 'settings-section__content'
            if (wrapClass) {
                const w = document.createElement('div')
                w.className = wrapClass
                w.append(child)
                c.append(w)
            } else {
                c.append(child)
            }
            sec.append(c)
        }
        const tiles = (name, items, onChange) => {
            const el = document.createElement('styled-radio-buttons')
            el.radioSetName = name
            el.shape = 'rounded-square'
            el.radioItems = items
            el.onChange = onChange
            return el
        }

        // Preview (Disney+'s own preview window, restyled with our settings).
        const previewBox = document.createElement('div')
        previewBox.className = 'caption-preview-container'
        const preview = document.createElement('caption-preview')
        try {
            preview.timedTextAppearance = view.effectiveTimedTextAppearance()
            preview.fontMapping = view.controller.fontMapping
            preview.fontFaceMapping = view.controller.fontFaceMapping
        } catch (_) { /* preview keeps its defaults */ }
        previewBox.append(preview)
        form.append(previewBox)
        const previewSheet = new CSSStyleSheet()

        // Text
        const text = section(textOf('#text-settings-label', t('text')))
        form.setAttribute('aria-label', view.getAttribute('aria-label') || t('text'))
        const size = document.createElement('captions-font-size')
        size.label = 'size'
        size.fontSizeOptions = OPTIONS.size.map((o) => ({ text: optionLabel('size', o), value: o.value }))
        size.fontMapping = SIZE_BUTTON_PX
        size.onChange = (change) => set('size', change.size)
        content(text, size)

        // Font tiles show "Aa" drawn in each font.
        const font = tiles('dpd-font', OPTIONS.font.map((o) => ({
            id: o.value, text: optionLabel('font', o),
            styleOverrides: {
                '--styled-radio-buttons__styled-radio__before--content': sample,
                '--styled-radio-buttons__styled-radio__before--font-family': o.family(),
                '--styled-radio-buttons__styled-radio__before--font-weight': String(o.weight),
            },
        })), (id) => set('font', id))
        content(text, font, 'dpd-tiles')

        const color = document.createElement('picker-dots')
        color.pickerName = 'dpd-color'
        color.dots = OPTIONS.color.map((o) => ({ id: o.value, text: optionLabel('color', o), value: o.css }))
        color.onChange = (id) => set('color', id)
        content(text, color, 'dpd-dots')

        const edge = tiles('dpd-edge', OPTIONS.edge.map((o) => ({
            id: o.value, text: optionLabel('edge', o), backgroundColor: '#7c828c',
            styleOverrides: {
                '--styled-radio-buttons__styled-radio__before--content': sample,
                '--styled-radio-buttons__styled-radio__before--font-family': uiFont(),
                'text-shadow': o.css(DARK),
            },
        })), (id) => set('edge', id))
        content(text, edge, 'dpd-tiles')

        // Background
        const background = section(textOf('#background-settings-label', t('background')))
        const slider = document.createElement('snap-slider')
        slider.min = 0
        slider.max = 100
        slider.numSnapPoints = OPTIONS.background.length
        slider.ariaLabel = t('bgOpacity')
        slider.onChange = (v) => set('background', OPTIONS.background[Math.round(v / BG_STEP)].value)
        content(background, slider, 'dpd-slider')

        // Position: each tile is a tiny screen with the subtitle line at that height.
        const position = section(t('position'))
        const pos = tiles('dpd-position', OPTIONS.position.map((o) => ({
            id: String(o.value), text: optionLabel('position', o), backgroundColor: 'rgba(255,255,255,.08)',
            styleOverrides: {
                '--styled-radio-buttons__styled-radio__before--content': 'none',
                'background-image': 'linear-gradient(#ffffff, #ffffff)',
                'background-repeat': 'no-repeat',
                'background-size': '56% 3px',
                'background-position': `center ${86 - o.value * 18}%`,
            },
        })), (id) => set('position', Number(id)))
        content(position, pos, 'dpd-tiles dpd-screens')

        const reset = document.createElement('button')
        reset.type = 'button'
        reset.className = 'caption-settings-reset locale-metadata-heavy'
        reset.textContent = textOf('.caption-settings-reset', t('reset'))
        reset.addEventListener('click', () => {
            settings = { ...DEFAULTS, wide: settings.wide, quality: settings.quality }
            commit()
        })
        form.append(reset)

        const entry = { form, preview, previewSheet, size, font, color, edge, slider, pos }
        styleForms.add(entry)
        renderStyleForm(entry)
        return form
    }

    function renderStyleForm(f) {
        f.size.value = settings.size
        f.font.value = settings.font
        f.color.value = settings.color
        f.edge.value = settings.edge
        f.slider.value = OPTIONS.background.findIndex((o) => o.value === settings.background) * BG_STEP
        f.pos.value = String(settings.position)

        const font = pick('font')
        const box = boxCss()
        f.previewSheet.replaceSync(`.caption-preview p {
  font-size: ${(pick('size').vh * PREVIEW_PX_PER_VH).toFixed(1)}px !important;
  font-family: ${font.family()} !important; font-weight: ${font.weight} !important;
  color: ${pick('color').css} !important; text-shadow: ${edgeCss()} !important;
  background-color: ${box} !important; ${box === 'transparent' ? '' : 'padding: 0 .3em !important;'}
}`)
        if (f.preview.shadowRoot) adoptSheet(f.preview.shadowRoot, f.previewSheet)
    }

    function renderStyleForms() {
        for (const f of styleForms) {
            if (!f.form.isConnected) styleForms.delete(f)
            else renderStyleForm(f)
        }
    }

    // ------------------------------------------------------------------ Disney+ settings dialog

    function wideLabel() {
        if (!settings.wide) return t('off')
        return lastScale > 1 ? `${t('on')} · ${lastScale.toFixed(2)}×` : t('on')
    }

    // Our items in Disney+'s settings menu, built with its own menu classes so they look native.
    function menuItem(menu, className, role, onClick) {
        let item = menu.querySelector(`.${className}`)
        if (!item) {
            item = document.createElement('button')
            item.type = 'button'
            item.className = `settings-nav-item ${className}`
            item.setAttribute('role', role)
            item.innerHTML =
                '<span class="settings-nav-item__label locale-body-large" aria-hidden="true"></span>' +
                '<span class="settings-nav-item__details" aria-hidden="true">' +
                '<span class="settings-nav-item__sublabel locale-body-copy"></span></span>'
            item.addEventListener('click', (e) => {
                e.stopPropagation()
                onClick()
            })
            menu.appendChild(item)
        }
        return item
    }

    function setMenuText(item, title, sublabel) {
        const label = item.querySelector('.settings-nav-item__label')
        if (label.textContent !== title) label.textContent = title
        const sub = item.querySelector('.settings-nav-item__sublabel')
        if (sub.textContent !== sublabel) sub.textContent = sublabel
        item.setAttribute('aria-label', `${title}, ${sublabel}`)
    }

    function enhanceMainMenu(view) {
        const menu = view.shadowRoot && view.shadowRoot.querySelector('.settings-main-menu')
        if (!menu) return
        const quality = menuItem(menu, 'dpd-quality-item', 'menuitem', cycleQuality)
        setMenuText(quality, t('quality'), qualityLabel())
        const wide = menuItem(menu, 'dpd-wide-item', 'menuitemcheckbox', toggleWide)
        setMenuText(wide, t('wide'), wideLabel())
        wide.setAttribute('aria-checked', String(settings.wide))
    }

    // Swap Disney+'s caption-style form for ours, keeping its header (title, back, close) on top.
    function enhanceCaptionSettings(view) {
        const shadow = view.shadowRoot
        if (!shadow || !shadow.querySelector('modal-menu-header')) return
        adoptSheet(shadow, disneyFormSheet)
        let ours = shadow.querySelector('.dpd-form')
        if (!ours) {
            ours = createStyleForm(view)
            shadow.appendChild(ours)
        }
        // The view lays its children out top-to-bottom; keep ours right under Disney+'s header.
        const header = shadow.querySelector('modal-menu-header')
        if (header.nextElementSibling !== ours) header.after(ours)
        // Disney+'s components render asynchronously; restyle them once their shadow roots exist.
        for (const f of styleForms) {
            if (f.form !== ours) continue
            if (f.preview.shadowRoot) adoptSheet(f.preview.shadowRoot, f.previewSheet)
            if (f.color.shadowRoot) adoptSheet(f.color.shadowRoot, dotsSheet)
        }
    }

    function enhanceDialog(root) {
        for (const view of root.querySelectorAll('main-settings-view')) enhanceMainMenu(view)
        for (const view of root.querySelectorAll('caption-settings-view')) enhanceCaptionSettings(view)
    }

    // React as soon as the dialog switches pages, so Disney+'s own form never shows.
    const watchedDialogs = new WeakSet()

    function watchDialogs(root) {
        for (const dialog of root.querySelectorAll('dialog.settingsModal-dialog')) {
            if (watchedDialogs.has(dialog)) continue
            watchedDialogs.add(dialog)
            new MutationObserver(() => {
                enhanceDialog(root)
                for (const ms of [0, 30, 120]) setTimeout(() => enhanceDialog(root), ms)
            }).observe(dialog, { attributes: true, attributeFilter: ['class'], childList: true })
        }
    }

    function settingsModals(roots) {
        const list = []
        for (const root of roots) for (const m of root.querySelectorAll('settings-modal')) if (m.controller) list.push(m)
        return list
    }

    // The player keeps one settings control per layout (wide / narrow / extra-narrow); use the one laid out now.
    function activeSettingsModal() {
        const modals = settingsModals(collectRoots())
        return modals.find((m) => m.controller.isModalOpen) ||
            modals.find((m) => { const host = m.getRootNode().host; return host && host.getBoundingClientRect().width > 0 }) ||
            null
    }

    // When idle, Disney+ removes its controls overlay entirely; a mouse move brings it back.
    function wakeControls() {
        const target = document.querySelector('disney-web-player-ui') || document.body
        const r = target.getBoundingClientRect()
        for (const type of ['pointermove', 'mousemove']) {
            target.dispatchEvent(new PointerEvent(type, {
                bubbles: true, composed: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
            }))
        }
    }

    // Open Disney+'s settings dialog straight on the caption-style page (toggles it closed again).
    async function toggleSettings() {
        let modal = activeSettingsModal()
        if (!modal && inPlayer()) {
            wakeControls()
            for (let i = 0; i < 15 && !modal; i++) {
                await new Promise((r) => setTimeout(r, 100))
                modal = activeSettingsModal()
            }
        }
        if (!modal) {
            toast(t('openHint'), 3500)
            return
        }
        const c = modal.controller
        try {
            if (c.isModalOpen && c.currentViewName === 'captionSettings') { c.closeModal(); return }
            if (!c.isModalOpen) c.toggle()
            c.navigateToCaptionSettings()
        } catch (_) {
            toast(t('openHint'), 3500)
        }
    }

    // ------------------------------------------------------------------ playback speed (Netflix-style)
    //
    // A speed button sits next to Disney+'s settings button; it opens a picker with five speeds.
    // The speed holds while you stay in the player (next episodes included) and resets to 1× when you leave it.

    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]
    let speed = 1

    const SPEED_ICON =
        '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round"><path d="M4.4 17.6a8.6 8.6 0 1 1 15.2 0"/>' +
        '<path d="M12 14l4.2-4.6"/><circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none"/></svg>'

    const controlsSheet = new CSSStyleSheet()
    controlsSheet.replaceSync(`
.dpd-speed-btn { all: unset; box-sizing: border-box; flex: none; display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; color: #ffffff; cursor: pointer; transition: transform .15s ease; }
.dpd-speed-btn:hover { transform: scale(1.12); }
.dpd-speed-btn:focus-visible { outline: 2px solid #ffffff; outline-offset: 4px; border-radius: 4px; }`)

    function enhanceControls(root) {
        for (const ctl of root.querySelectorAll('settings-modal-control')) {
            const parent = ctl.parentElement
            if (!parent) continue
            let btn = parent.querySelector(':scope > .dpd-speed-btn')
            if (!btn) {
                adoptSheet(root, controlsSheet)
                btn = document.createElement('button')
                btn.type = 'button'
                btn.className = 'dpd-speed-btn'
                btn.innerHTML = SPEED_ICON
                btn.addEventListener('click', (e) => {
                    e.stopPropagation()
                    toggleSpeedPanel(btn)
                })
                parent.insertBefore(btn, ctl)
            }
            btn.setAttribute('aria-label', t('speed'))
            btn.title = t('speed')
            // Match the neighbouring Disney+ button's size and spacing (they change with the layout).
            const r = ctl.getBoundingClientRect()
            let moved = false
            if (r.width > 0) {
                const w = `${Math.round(r.width)}px`
                if (btn.style.width !== w) { btn.style.width = w; btn.style.height = `${Math.round(r.height)}px`; moved = true }
                const m = getComputedStyle(ctl).marginInlineEnd
                if (btn.style.marginInlineEnd !== m) { btn.style.marginInlineEnd = m; moved = true }
            }
            registerPointerHole(btn, 'dpd-speed-btn')
            if (moved) pointerGeometryChanged(btn)
        }
    }

    // Disney+'s player lays a transparent click-to-pause layer (<pointer-actions>) over itself, with holes only
    // where its own controls are. Its controls register with the layer by sending "ui-ptr-exclude-register"
    // (detail: the element) to their scope element (the nearest ancestor with data-ui-ptr-scope); without that,
    // a click on our button lands on the layer and pauses the video instead.
    const PTR_SCOPE_ATTR = 'data-ui-ptr-scope'
    const PTR_SCOPE_ROOT = Symbol.for('ui.ptr.scope.root')
    const pointerHoles = new Map() // our element → the scope it is registered with

    function pointerScope(el) {
        for (let node = el; node;) {
            if (node instanceof Element && (node.hasAttribute(PTR_SCOPE_ATTR) || node[PTR_SCOPE_ROOT])) return node
            const root = node.getRootNode && node.getRootNode()
            node = root && root.host ? root.host : node.parentNode
        }
        return null
    }

    function registerPointerHole(el, component) {
        const scope = pointerScope(el)
        if (!scope || pointerHoles.get(el) === scope) return
        pointerHoles.set(el, scope)
        scope.dispatchEvent(new CustomEvent('ui-ptr-exclude-register', { detail: { el, component } }))
    }

    // The layer re-measures its holes on this ping (Disney+'s controls send it when they move or animate).
    function pointerGeometryChanged(el) {
        const scope = pointerHoles.get(el)
        if (scope) scope.dispatchEvent(new CustomEvent('ui-ptr-exclude-geometry'))
    }

    // Disney+ removes its controls when idle, taking our button with them: unregister what has left the page.
    function prunePointerHoles() {
        for (const [el, scope] of pointerHoles) {
            if (el.isConnected) continue
            pointerHoles.delete(el)
            scope.dispatchEvent(new CustomEvent('ui-ptr-exclude-unregister', { detail: { el } }))
        }
    }

    const SPEED_PANEL_CSS = `
* { box-sizing: border-box; }
.panel { padding: 22px 34px 24px; border-radius: 4px; background: #262626; color: #ffffff;
  box-shadow: 0 10px 32px rgba(0,0,0,.55); user-select: none; cursor: default; }
h2 { margin: 0 0 22px; font-size: 22px; font-weight: 700; letter-spacing: .01em; }
.track { position: relative; display: grid; grid-template-columns: repeat(${SPEEDS.length}, minmax(92px, 1fr)); }
.track::before { content: ''; position: absolute; left: ${50 / SPEEDS.length}%; right: ${50 / SPEEDS.length}%;
  top: 13px; height: 2px; background: #8c8c8c; }
.stop { all: unset; position: relative; display: flex; flex-direction: column; align-items: center; gap: 14px; cursor: pointer; }
.dot { width: 12px; height: 12px; margin: 7px 0; border-radius: 50%; background: #8c8c8c; transition: background .12s; }
.stop:hover .dot { background: #d9d9d9; }
.stop[aria-checked="true"] .dot { width: 26px; height: 26px; margin: 0; background: #ffffff; box-shadow: 0 0 0 5px rgba(255,255,255,.22); }
.label { font-size: 15px; color: #b3b3b3; white-space: nowrap; }
.stop:hover .label { color: #e5e5e5; }
.stop[aria-checked="true"] .label { color: #ffffff; font-weight: 700; }
.stop:focus-visible .dot { outline: 2px solid #ffffff; outline-offset: 4px; }`

    let speedHost = null
    let speedRoot = null
    let speedAnchor = null

    // "1x (Normal)" / "1x（正常）": no space before full-width brackets.
    const speedLabel = (s) => {
        if (s !== 1) return `${s}x`
        const normal = t('normal')
        return normal.startsWith('（') ? `1x${normal}` : `1x ${normal}`
    }

    function buildSpeedPanel() {
        speedHost = document.createElement('div')
        speedHost.setAttribute('popover', 'manual')
        speedHost.style.cssText = 'position:fixed;inset:auto;margin:0;padding:0;border:0;background:transparent;overflow:visible;color-scheme:dark'
        speedRoot = speedHost.attachShadow({ mode: 'open' })
        speedRoot.innerHTML = `<style>${SPEED_PANEL_CSS}</style>
<div class="panel" role="dialog"><h2></h2><div class="track" role="radiogroup">${SPEEDS.map((s) =>
            `<button class="stop" role="radio" data-speed="${s}"><span class="dot"></span><span class="label"></span></button>`).join('')}</div></div>`
        speedRoot.addEventListener('click', (e) => {
            const stop = e.target.closest('[data-speed]')
            if (stop) setSpeed(Number(stop.dataset.speed))
        })
        speedRoot.addEventListener('keydown', (e) => {
            const step = ({ ArrowLeft: -1, ArrowRight: 1 })[e.key]
            if (!step) return
            // The track follows the reading direction (right to left in Arabic and Hebrew), so the arrows do too.
            const next = SPEEDS[SPEEDS.indexOf(speed) + (uiDir() === 'rtl' ? -step : step)]
            if (next === undefined) return
            setSpeed(next)
            e.preventDefault()
            speedRoot.querySelector('[aria-checked="true"]')?.focus()
        })
        // Disney+ hides its controls (and so this panel) when it sees no pointer activity, and activity over the
        // panel happens outside its player: pass it on so the panel stays while it is being used.
        let lastWake = 0
        const keepControlsAwake = () => {
            if (Date.now() - lastWake < 500) return
            lastWake = Date.now()
            safely(wakeControls)
        }
        for (const type of ['pointermove', 'keydown', 'wheel']) speedHost.addEventListener(type, keepControlsAwake)
        // Keep clicks and keys away from the player underneath.
        for (const type of ['click', 'pointerdown', 'mousedown', 'dblclick', 'keydown', 'keyup', 'wheel'])
            speedHost.addEventListener(type, (e) => e.stopPropagation())
        ;(document.body || document.documentElement).appendChild(speedHost)
    }

    function renderSpeedPanel() {
        if (!speedRoot) return
        speedHost.dir = uiDir()
        speedRoot.querySelector('.panel').style.fontFamily = uiFont()
        speedRoot.querySelector('h2').textContent = t('speed')
        speedRoot.querySelector('.panel').setAttribute('aria-label', t('speed'))
        for (const stop of speedRoot.querySelectorAll('[data-speed]')) {
            const s = Number(stop.dataset.speed)
            stop.setAttribute('aria-checked', String(s === speed))
            stop.querySelector('.label').textContent = speedLabel(s)
        }
    }

    const isSpeedPanelOpen = () => !!speedHost && speedHost.isConnected && speedHost.matches(':popover-open')

    function positionSpeedPanel() {
        if (!speedAnchor) return
        const a = speedAnchor.getBoundingClientRect()
        const p = speedHost.getBoundingClientRect()
        const left = Math.min(Math.max(12, a.left + a.width / 2 - p.width / 2), innerWidth - p.width - 12)
        const top = Math.max(12, a.top - p.height - 18)
        speedHost.style.left = `${left}px`
        speedHost.style.top = `${top}px`
    }

    function openSpeedPanel(anchor) {
        // One popup at a time, like Netflix: close Disney+'s settings dialog if it is open.
        for (const m of settingsModals(collectRoots())) {
            try { if (m.controller.isModalOpen) m.controller.closeModal() } catch (_) { }
        }
        if (!speedHost || !speedHost.isConnected) buildSpeedPanel()
        speedAnchor = anchor
        renderSpeedPanel()
        bringToTop(speedHost)
        positionSpeedPanel()
        speedRoot.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true })
    }

    function closeSpeedPanel() {
        try { speedHost?.hidePopover() } catch (_) { }
        speedAnchor = null
    }

    function toggleSpeedPanel(anchor) {
        if (isSpeedPanelOpen() && speedAnchor === anchor) closeSpeedPanel()
        else openSpeedPanel(anchor)
    }

    function setSpeed(s) {
        speed = s
        if (lastVideo) lastVideo.playbackRate = speed
        renderSpeedPanel()
    }

    // Keep the speed applied (Disney+ may reset it when it swaps the video for the next episode).
    function applySpeed() {
        if (!inPlayer()) { speed = 1; return }
        if (lastVideo && Math.abs(lastVideo.playbackRate - speed) > 0.001) lastVideo.playbackRate = speed
    }

    // Close the picker when clicking elsewhere or when the player controls go away.
    document.addEventListener('pointerdown', (e) => {
        if (!isSpeedPanelOpen()) return
        const path = e.composedPath()
        if (!path.includes(speedHost) && !path.includes(speedAnchor)) closeSpeedPanel()
    }, true)

    function checkSpeedPanel() {
        if (!isSpeedPanelOpen()) return
        const anchorShown = speedAnchor && speedAnchor.isConnected &&
            speedAnchor.checkVisibility({ visibilityProperty: true, opacityProperty: true })
        if (!anchorShown || !inPlayer()) closeSpeedPanel()
        else positionSpeedPanel()
    }

    // ------------------------------------------------------------------ high quality (1080p / 4K HDR)
    //
    // Disney+'s player decides the stream from a device profile. For Edge on Windows it has a PlayReady profile
    // (hardware DRM, up to 1080p), but its server config keeps Edge on Widevine (720p, or 480p without HDCP).
    // When this PC really can play protected HD — hardware PlayReady and HDCP on the display output — we give
    // the player that PlayReady profile (1080p), or for 4K HDR additionally allow HEVC/HDR10 and ask for
    // Disney+'s HEVC HDR10 stream. Nothing is decrypted or spoofed: Disney+'s licence server and the CDM still
    // decide, and if playback does not start we step down (4K HDR → 1080p → Disney+'s default).

    const nativeRequestMediaKeySystemAccess = navigator.requestMediaKeySystemAccess.bind(navigator)
    const HQ_FAILED_KEY = 'dpd.hq.failed'   // sessionStorage: highest level that failed in this tab
    const HQ_NOTICE_KEY = 'dpd.hq.notice'   // sessionStorage: show a one-time "stepped down" toast
    const HQ_FORCE_KEY = 'dpd.hq.force'     // localStorage (diagnostics): skip the HDCP pre-check

    // Tried in this order, each failure moving on to the next. Both need hardware PlayReady (SL3000): Disney+
    // licenses software PlayReady (SL2000) for 720p at most — its own player drops to that when hardware DRM fails.
    const HQ_ORDER = ['uhd', 'fhd']
    const HQ_PROFILES = {
        fhd: { label: '1080p', scenario: null, resolution: '1920x1080', maxHeight: 1080, minHdcp: '1.4', filtering: {} },
        uhd: {
            label: '4K HDR', scenario: 'tv-drm-ctr-h265-hdr10-atmos', resolution: '3840x2160', maxHeight: 2160, minHdcp: '2.2',
            // Windows browsers can't decode Dolby Vision or HDR10+; everything else HEVC is allowed.
            filtering: {
                maxFrameRate: 60, blockHdr10Plus: true,
                blockVideoFormats: ['HEVC_DOLBY_VISION_5', 'HEVC_DOLBY_VISION_8', 'HEVC_DOLBY_VISION_20', 'HEVC_HDR10_PLUS'],
            },
        },
    }

    // `restricted`: the player has capped this session's quality itself (see hqTrouble), so requests stay as it makes them.
    const hq = {
        checked: false, playReady: false, hdcp: {},
        active: null, restricted: false, askedHeight: 0, since: 0, height: 0, timer: 0, licences: 0, failing: false, diag: null,
    }
    const HQ_FAILURES_KEY = 'dpd.hq.failures' // sessionStorage: why each level stepped down, by level

    async function checkHqSupport() {
        try {
            const access = await nativeRequestMediaKeySystemAccess('com.microsoft.playready.recommendation', [{
                initDataTypes: ['cenc'], distinctiveIdentifier: 'not-allowed',
                videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.640028"', robustness: '3000' }],
            }])
            const keys = await access.createMediaKeys()
            hq.playReady = true
            if (typeof keys.getStatusForPolicy === 'function') {
                for (const version of ['1.4', '2.2']) {
                    try { hq.hdcp[version] = (await keys.getStatusForPolicy({ minHdcpVersion: version })) === 'usable' }
                    catch (_) { hq.hdcp[version] = false }
                }
            }
        } catch (_) {
            hq.playReady = false
        }
        hq.checked = true
    }

    // A PC whose hardware DRM output fails (e.g. the NVIDIA RTX 50 driver issue behind 0x8004CD22) fails the
    // same way every time, so remember it for a week instead of retrying on every launch. Choosing the quality
    // setting again (e.g. after a driver update) retries right away.
    const HQ_BLOCKED_KEY = 'dpd.hq.blocked' // localStorage: { gpu, since, reason }
    const HQ_BLOCK_MS = 7 * 24 * 3600 * 1000
    let gpu
    const gpuOnce = () => (gpu === undefined ? (gpu = gpuName()) : gpu)
    function hqBlocked() {
        try {
            const block = JSON.parse(localStorage.getItem(HQ_BLOCKED_KEY) || 'null')
            return block && block.gpu === gpuOnce() && Date.now() - block.since < HQ_BLOCK_MS ? block : null
        } catch (_) {
            return null
        }
    }

    const hqForced = () => { try { return localStorage.getItem(HQ_FORCE_KEY) === '1' } catch (_) { return false } }
    const hqFailed = () => { try { return sessionStorage.getItem(HQ_FAILED_KEY) } catch (_) { return null } }
    const hevcHdrDecodable = () => decodable('hvc1.2.4.L153.90')
    // The diagnostics flag skips the whole pre-check (Chromium also turns hardware DRM off for a while after
    // a hardware decryption failure, which would otherwise hide the path on a test PC).
    // A usable higher HDCP version covers the lower ones (some CDMs answer "1.4" oddly while "2.2" is usable).
    const hdcpAtLeast = (min) => Object.entries(hq.hdcp).some(([version, usable]) => usable && parseFloat(version) >= parseFloat(min))
    const hqSupported = (level) => hqForced() || (hq.playReady && hdcpAtLeast(HQ_PROFILES[level].minHdcp))

    // The level to use for the next playback session, or null for Disney+'s default.
    function hqPlan() {
        if (settings.quality === 'off' || !hq.checked || (!hqForced() && hqBlocked())) return null
        const failed = hqFailed()
        const from = failed ? HQ_ORDER.indexOf(failed) + 1 : settings.quality === 'uhd' ? 0 : 1
        for (const level of HQ_ORDER.slice(from)) {
            if (level === 'uhd' && (settings.quality !== 'uhd' || !hevcHdrDecodable())) continue
            if (hqSupported(level)) return level
        }
        return null
    }

    function hqOverrides(level) {
        const p = HQ_PROFILES[level]
        return {
            engine: {
                drmKeySystem: 'PLAYREADY', drmPlayReadyRecommendationFlow: true, drmWidevineHdcpCheckEnabled: false,
                allowSeamlessSwitch: false, allowMediaSourceReuse: false,
            },
            session: {
                enableDrmPreflightCheck: false,
                vod: {
                    playlistFiltering: { maxHeight: p.maxHeight, ...p.filtering },
                    playbackAttributesConfig: { resolution: { max: [p.resolution] } },
                },
            },
        }
    }

    // Deep merge where arrays replace (same rule as Disney+'s own config merge).
    const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
    function mergeConfig(target, source) {
        for (const [key, value] of Object.entries(source)) {
            if (isPlainObject(value)) {
                if (!isPlainObject(target[key])) target[key] = {}
                mergeConfig(target[key], value)
            } else {
                target[key] = Array.isArray(value) ? [...value] : value
            }
        }
        return target
    }

    // The browser device profile declares no FHD/UHD and no HEVC at all, which filters those streams out
    // whatever the config says. The service keeps that list in `mediaCapabilitiesInfo` and hands it to each
    // new playback session, so declare what this PC really decodes for the level in use (and restore Disney+'s
    // own list otherwise).
    const decodable = (codecs) => {
        try { return MediaSource.isTypeSupported(`video/mp4; codecs="${codecs}"`) } catch (_) { return false }
    }

    function applyHqCapabilities(service, level) {
        if (!service || typeof service !== 'object' || !('mediaCapabilitiesInfo' in service)) return
        if (!Object.prototype.hasOwnProperty.call(service, '__dpdCapabilities'))
            Object.defineProperty(service, '__dpdCapabilities', { value: service.mediaCapabilitiesInfo, writable: true })
        const original = service.__dpdCapabilities
        if (!level || !original) { service.mediaCapabilitiesInfo = original; return }
        const tiers = new Set([...(original.videoResolutions || []), 'SD', 'HD', 'FHD'])
        if (level === 'uhd') tiers.add('UHD')
        const caps = { ...original, videoResolutions: ['SD', 'HD', 'FHD', 'UHD'].filter((r) => tiers.has(r)) }
        if (level === 'uhd') {
            const formats = new Set(original.videoFormats || [])
            if (decodable('hvc1.1.6.L150.90')) formats.add('HEVC_SDR')
            if (decodable('hvc1.2.4.L153.90')) formats.add('HEVC_HDR10')
            caps.videoFormats = [...formats]
        }
        service.mediaCapabilitiesInfo = caps
    }

    // Hook Disney+'s playback SDK as soon as its script defines the "playback-service" global.
    function patchPlaybackService(exports) {
        const proto = exports && exports.PlaybackService && exports.PlaybackService.prototype
        if (!proto || typeof proto.createPlaybackSession !== 'function' || proto.__dpdHq) return
        const create = proto.createPlaybackSession
        Object.defineProperty(proto, '__dpdHq', { value: true })
        // createPlaybackSession is async in the SDK, so waiting for our (fast) support check is safe.
        proto.createPlaybackSession = async function (options, ...rest) {
            if (!hq.checked) await Promise.race([hqCheck, new Promise((resolve) => setTimeout(resolve, 2000))])
            const level = hqPlan()
            safely(() => showTip(qualityTip(), 4000))
            safely(applyHqCapabilities, this, level)
            if (level && options && typeof options === 'object') {
                try {
                    const client = { ...(options.clientParameters || {}) }
                    const overrides = { ...(client.configOverrides || {}) }
                    overrides['hive-dmp'] = mergeConfig(JSON.parse(JSON.stringify(overrides['hive-dmp'] || {})), hqOverrides(level))
                    client.configOverrides = overrides
                    options = { ...options, clientParameters: client }
                    hqStart(level)
                } catch (e) {
                    console.warn('[Disney+ Desktop] high quality not applied', e)
                    hqStart(null)
                }
            } else {
                hqStart(null)
            }
            return create.call(this, options, ...rest)
        }
    }

    function trapGlobal(name, onValue) {
        let current = globalThis[name]
        if (current) safely(onValue, current)
        try {
            Object.defineProperty(globalThis, name, {
                configurable: true, enumerable: true,
                get: () => current,
                set: (value) => { current = value; safely(onValue, value) },
            })
        } catch (e) { console.warn('[Disney+ Desktop] cannot watch', name, e) }
    }

    // Playback request: Disney+'s HEVC HDR10 stream for 4K HDR, and the resolution cap for both levels.
    const PLAYBACK_URL = /^https:\/\/disney\.playback\.edge\.bamgrid\.com\/v7\/playback\/([^/?#]+)/
    const REWRITABLE_SCENARIOS = new Set(['ctr-regular', 'ctr-high', 'tv-drm-ctr-h265-atmos', 'tv-drm-ctr-h265-hdr10-atmos'])

    const rewriting = () => !!hq.active && !hq.restricted

    function hqRequestUrl(url) {
        const p = rewriting() && HQ_PROFILES[hq.active]
        const m = p && p.scenario && PLAYBACK_URL.exec(url)
        return m && REWRITABLE_SCENARIOS.has(m[1]) ? url.replace(`/v7/playback/${m[1]}`, `/v7/playback/${p.scenario}`) : url
    }

    // Highest height in a request's `resolution.max`, e.g. ["1280x720"] → 720.
    const requestedHeight = (resolution) =>
        Math.max(0, ...((resolution && Array.isArray(resolution.max) && resolution.max) || []).map((r) => parseInt(String(r).split('x')[1], 10) || 0))

    function hqRequestBody(body) {
        if (!rewriting() || typeof body !== 'string') return body
        try {
            const json = JSON.parse(body)
            const attributes = json && json.playback && json.playback.attributes
            if (!attributes) return body
            // A later request in the same session asking for less than the first one means the player has
            // capped quality after a DRM problem; follow it (overriding it gets the licence refused: error 83).
            const asked = requestedHeight(attributes.resolution)
            if (!hq.askedHeight) hq.askedHeight = asked
            else if (asked && asked < hq.askedHeight) { hqTrouble(`player lowered its request to ${asked}p`); return body }
            attributes.resolution = { max: [HQ_PROFILES[hq.active].resolution] }
            return JSON.stringify(json)
        } catch (_) {
            return body
        }
    }

    // Licence refusals (e.g. insufficient security level) make the player retry at a lower quality.
    const LICENCE_URL = /^https:\/\/[^/?#]*(bamgrid|disney)[^/?#]*\/[^?#]*licen[cs]e/i
    // (Rate limits and timeouts are retried by the player and aren't a refusal.)
    const checkLicenceResponse = (status) => {
        if (status >= 400 && status < 500 && status !== 408 && status !== 429 && hq.active)
            hqTrouble(`licence request refused (HTTP ${status})`)
    }

    // Quality labels on Disney+'s pages. The web app labels every title "HD" at most: the line under a title
    // keeps only a few labels (HD, IMAX Enhanced, CC, AD) whatever the title offers, while the details tab
    // lists everything the title has. Relabel both from what this PC really plays: 4K (plus HDR10 on an HDR
    // display) when the 4K HDR level would be used, otherwise HD. Dolby Vision, 3D, Dolby Atmos and DTS:X never
    // reach a browser, and the web player picks stereo AAC over the 5.1 tracks, so those labels go.
    const EXPLORE_URL = /^https:\/\/disney\.api\.edge\.bamgrid\.com\/explore\/v[\d.]+\//
    const NEVER_DELIVERED = new Set(['three_dimensional', 'dolby_vision', 'dolby_atmos', 'dts_x', 'dolby_51'])
    const HD_LABEL = { value: 'hd', imageId: 'B8D865E2C27C15120BEA079C2490163A2BDAE0E41873483A29AF7AD0F78471D5', tts: 'HD' }

    // `short`: the line under a title, which drops values other than "hd" & co., so real labels go in as "hd".
    function relabelFlags(flags, short, tier, hdLabel) {
        const has = new Set(flags.map((f) => f && f.value))
        const uhd = tier === 'uhd' && has.has('uhd')
        const hdr = uhd && has.has('hdr_10') && matchMedia('(dynamic-range: high)').matches
        const kept = (f) => (short ? { ...f, value: 'hd' } : f)
        const out = []
        let hdShown = false
        for (const f of flags) {
            const value = f && f.value
            if (NEVER_DELIVERED.has(value)) continue
            if (tier && (value === 'uhd' || value === 'hd')) {
                if (uhd) { if (value === 'uhd') out.push(kept(f)) }
                else if (!hdShown) { out.push(value === 'hd' ? f : hdLabel); hdShown = true }
                continue
            }
            if (tier && value === 'hdr_10') { if (hdr) out.push(kept(f)); continue }
            out.push(f)
        }
        return out
    }

    // Relabel every `audioVisual.flags` list in an explore API response (pages, sets, details).
    function relabelExplore(json) {
        // Unknown until the support check has run: then only the never-delivered labels go.
        const tier = hq.checked ? (hqPlan() === 'uhd' ? 'uhd' : 'hd') : null
        const lists = []
        let hdLabel = null
        const walk = (node, short) => {
            if (!node || typeof node !== 'object') return
            if (Array.isArray(node)) { for (const item of node) walk(item, false); return }
            for (const [key, value] of Object.entries(node)) {
                if (key === 'audioVisual' && value && Array.isArray(value.flags)) {
                    lists.push([value, short])
                    hdLabel = hdLabel || value.flags.find((f) => f && f.value === 'hd') || null
                } else {
                    walk(value, key === 'metastringParts')
                }
            }
        }
        walk(json, false)
        for (const [audioVisual, short] of lists) audioVisual.flags = relabelFlags(audioVisual.flags, short, tier, hdLabel || HD_LABEL)
        return lists.length > 0
    }

    // The web app reads explore responses through XHR; hand it the relabelled data whichever way it reads.
    const nativeResponseText = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText').get
    const nativeResponse = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'response').get
    function relabelXhr(xhr) {
        let source = null
        let text = null
        const relabelled = () => {
            const raw = nativeResponseText.call(xhr)
            if (raw !== source) {
                source = raw
                text = raw
                try {
                    const json = JSON.parse(raw)
                    if (relabelExplore(json)) text = JSON.stringify(json)
                } catch (_) { }
            }
            return text
        }
        const done = new WeakSet()
        Object.defineProperty(xhr, 'responseText', {
            configurable: true,
            get: () => (xhr.readyState === 4 ? relabelled() : nativeResponseText.call(xhr)),
        })
        Object.defineProperty(xhr, 'response', {
            configurable: true,
            get: () => {
                if (xhr.readyState === 4 && (xhr.responseType === '' || xhr.responseType === 'text')) return relabelled()
                const value = nativeResponse.call(xhr)
                if (xhr.readyState === 4 && xhr.responseType === 'json' && value && typeof value === 'object' && !done.has(value)) {
                    done.add(value)
                    safely(relabelExplore, value)
                }
                return value
            },
        })
    }

    const nativeXhrOpen = XMLHttpRequest.prototype.open
    const nativeXhrSend = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        if (!this.__dpdExplore && String(method).toUpperCase() === 'GET' && EXPLORE_URL.test(String(url))) {
            this.__dpdExplore = true
            safely(relabelXhr, this)
        }
        const post = String(method).toUpperCase() === 'POST'
        this.__dpdPlayback = rewriting() && post && PLAYBACK_URL.test(String(url))
        // Registered before the player's own handlers, so the reaction comes before its retry.
        if (hq.active && post && !this.__dpdLicence && LICENCE_URL.test(String(url))) {
            this.__dpdLicence = true
            this.addEventListener('readystatechange', () => { if (this.readyState === 4) checkLicenceResponse(this.status) })
        }
        return nativeXhrOpen.call(this, method, this.__dpdPlayback ? hqRequestUrl(String(url)) : url, ...rest)
    }
    XMLHttpRequest.prototype.send = function (body) {
        return nativeXhrSend.call(this, this.__dpdPlayback ? hqRequestBody(body) : body)
    }

    const nativeFetch = window.fetch
    window.fetch = async function (input, init) {
        let licence = false
        if (hq.active) {
            try {
                const isRequest = typeof Request !== 'undefined' && input instanceof Request
                const url = typeof input === 'string' ? input : input instanceof URL ? input.href : isRequest ? input.url : ''
                const method = String((init && init.method) || (isRequest ? input.method : 'GET')).toUpperCase()
                licence = method === 'POST' && LICENCE_URL.test(url)
                if (method === 'POST' && rewriting() && PLAYBACK_URL.test(url)) {
                    let body = init && init.body
                    if (body == null && isRequest) body = await input.clone().text()
                    return nativeFetch.call(this, hqRequestUrl(url), {
                        ...(init || {}),
                        method: 'POST',
                        headers: (init && init.headers) || (isRequest ? input.headers : undefined),
                        credentials: (init && init.credentials) || (isRequest ? input.credentials : undefined),
                        body: hqRequestBody(body),
                    })
                }
            } catch (e) { console.warn('[Disney+ Desktop] playback request left unchanged', e) }
        }
        if (!licence) return nativeFetch.apply(this, arguments)
        // Checked before the player sees the response, so the reaction comes before its retry.
        const response = await nativeFetch.apply(this, arguments)
        safely(checkLicenceResponse, response.status)
        return response
    }

    // PlayReady in Edge's recommendation flow runs without a distinctive identifier.
    navigator.requestMediaKeySystemAccess = function (keySystem, configurations) {
        if (hq.active && /playready/i.test(keySystem) && Array.isArray(configurations))
            configurations = configurations.map((c) => ({ ...c, distinctiveIdentifier: 'not-allowed' }))
        return nativeRequestMediaKeySystemAccess(keySystem, configurations)
    }

    // Disney+'s player treats these media errors as "hardware DRM failed" and restarts the stream with
    // software PlayReady at 720p. 0x8004CD22 is DRM_E_TEE_OUTPUT_PROTECTION_REQUIREMENTS_NOT_MET: the
    // display connection doesn't meet the content's output protection. The player reads `video.error`
    // synchronously when it fails, so watching that getter lets us step aside before its retry request.
    const HARDWARE_DRM_ERRORS = /0x8004cd22|0xc00d7159/i
    const mediaErrorProperty = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'error')
    if (mediaErrorProperty && mediaErrorProperty.get) {
        Object.defineProperty(HTMLMediaElement.prototype, 'error', {
            ...mediaErrorProperty,
            get() {
                const error = mediaErrorProperty.get.call(this)
                if (error && hq.active && !hq.restricted) safely(hqMediaError, error)
                return error
            },
        })
    }

    function hqMediaError(error) {
        const text = `media error ${error.code} ${error.message || ''}`.trim()
        if (hq.diag && hq.diag.mediaErrors.length < 4 && !hq.diag.mediaErrors.includes(text)) hq.diag.mediaErrors.push(text)
        if (HARDWARE_DRM_ERRORS.test(error.message || '')) hqTrouble(`hardware DRM output protection failed: ${text}`, true)
    }

    // Watch the session. It works once the picture actually advances (or is decoded and paused by the user).
    // Trouble the player handles itself is in hqTrouble. The session has failed on a media error that lasts 8 s,
    // on no progress within 40 s, or when the player keeps renewing licences in a loop.
    function hqStart(level) {
        clearInterval(hq.timer)
        hq.active = level
        hq.restricted = false
        hq.askedHeight = 0
        hq.height = 0
        hq.licences = 0
        hq.failing = false
        hq.since = Date.now()
        hq.diag = level ? { level, started: Date.now(), sourceBuffers: [], keyStatuses: [], mediaErrors: [] } : null
        if (!level) return
        let firstTime = null
        let pausedSince = 0
        let errorSince = 0
        hq.timer = setInterval(() => {
            if (!inPlayer()) { clearInterval(hq.timer); return }
            const v = lastVideo
            const error = v && v.error
            if (error) {
                const text = `media error ${error.code} ${error.message || ''}`.trim()
                if (!errorSince) {
                    errorSince = Date.now()
                    if (hq.diag.mediaErrors.length < 4 && !hq.diag.mediaErrors.includes(text)) hq.diag.mediaErrors.push(text)
                }
                if (Date.now() - errorSince > 8000) hqFail(level, text)
                return
            }
            errorSince = 0
            if (v && v.readyState >= 2 && v.videoHeight > 0) {
                if (firstTime === null) firstTime = v.currentTime
                pausedSince = v.paused ? pausedSince || Date.now() : 0
                if (v.currentTime - firstTime >= 2 || (pausedSince && Date.now() - pausedSince > 5000)) {
                    hq.height = v.videoHeight
                    clearInterval(hq.timer)
                    return
                }
            }
            if (Date.now() - hq.since > 40000) {
                hqFail(level, v ? `no progress in 40 s (readyState ${v.readyState}, ${v.videoWidth}x${v.videoHeight}, t=${Math.round(v.currentTime)})`
                    : 'no video element in 40 s')
            }
        }, 1000)
    }

    // A DRM problem at this level while the player is still running (hardware DRM failure, refused keys or
    // licence). 4K HDR reloads straight into 1080p. At 1080p, Disney+'s player recovers by itself at 720p with
    // software DRM, so let it: stop shaping its requests (forcing 1080p again gets the licence refused and
    // ends in error 83) and keep watching that it plays. Later sessions in this tab use Disney+'s default.
    function hqTrouble(reason, hardwareOutput = false) {
        const level = hq.active
        if (!level || hq.restricted || hq.failing) return
        hq.restricted = true
        if (level === 'uhd') { hqFail(level, reason); return }
        recordHqFailure(level, reason)
        if (hardwareOutput) {
            try { localStorage.setItem(HQ_BLOCKED_KEY, JSON.stringify({ gpu: gpuOnce(), since: Date.now(), reason })) } catch (_) { }
            safely(showTip, 'tipOutput')
        } else {
            safely(toast, t('hqFellBackFhd'), 4500)
        }
        hq.since = Date.now()
    }

    // Record which streams the player sets up, for diagnostics (e.g. whether 4K picked HEVC).
    const nativeAddSourceBuffer = MediaSource.prototype.addSourceBuffer
    MediaSource.prototype.addSourceBuffer = function (type) {
        if (hq.diag && hq.diag.sourceBuffers.length < 12) hq.diag.sourceBuffers.push(type)
        return nativeAddSourceBuffer.call(this, type)
    }

    const REFUSED_KEY_STATUSES = new Set(['output-restricted', 'output-downscaled', 'internal-error'])
    const nativeGenerateRequest = MediaKeySession.prototype.generateRequest
    MediaKeySession.prototype.generateRequest = function (...args) {
        const level = hq.active
        if (level) {
            if (++hq.licences > 8) hqFail(level, `licence loop (${hq.licences} key sessions)`)
            this.addEventListener('keystatuseschange', () => {
                if (hq.active !== level) return
                const statuses = []
                this.keyStatuses.forEach((status) => statuses.push(status))
                if (hq.diag && hq.diag.keyStatuses.length < 24) hq.diag.keyStatuses.push(statuses.join('/') || '(none)')
                if (statuses.length && statuses.every((s) => REFUSED_KEY_STATUSES.has(s)))
                    hqTrouble(`licence keys refused: ${[...new Set(statuses)].join(', ')}`)
            })
        }
        return nativeGenerateRequest.apply(this, args)
    }

    // Remember why a level failed (per level, for __dpd.qualityInfo) and skip it for the rest of this tab.
    function recordHqFailure(level, reason) {
        const failure = {
            reason, afterSeconds: hq.diag ? Math.round((Date.now() - hq.diag.started) / 1000) : null,
            licenceSessions: hq.licences, sourceBuffers: hq.diag ? hq.diag.sourceBuffers : [],
            keyStatuses: hq.diag ? hq.diag.keyStatuses : [], mediaErrors: hq.diag ? hq.diag.mediaErrors : [],
        }
        if (hq.diag) hq.diag.reason = reason
        try {
            sessionStorage.setItem(HQ_FAILURES_KEY, JSON.stringify({ ...hqFailures(), [level]: failure }))
            sessionStorage.setItem(HQ_FAILED_KEY, level)
        } catch (_) { }
        console.warn('[Disney+ Desktop] high quality did not hold; stepping down from', level, failure)
    }

    // Give up on this level and reload into the next one.
    function hqFail(level, reason) {
        if (hq.failing) return
        hq.failing = true
        clearInterval(hq.timer)
        // After hqTrouble at 1080p the step down is already recorded and announced; keep its first cause.
        const told = hq.restricted && level !== 'uhd'
        const first = told && hq.diag && hq.diag.reason
        recordHqFailure(level, first && first !== reason ? `${first}; then ${reason}` : reason)
        try {
            // Tell the user only when the picture quality actually drops: 4K → 1080p, or 1080p → default.
            const next = hqPlan()
            const notice = !next ? 'fhd' : level === 'uhd' ? 'uhd' : ''
            if (notice && !told) sessionStorage.setItem(HQ_NOTICE_KEY, notice)
        } catch (_) { }
        location.reload()
    }

    function gpuName() {
        try {
            const gl = document.createElement('canvas').getContext('webgl')
            const ext = gl && gl.getExtension('WEBGL_debug_renderer_info')
            return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null
        } catch (_) {
            return null
        }
    }

    function hqFailures() {
        try { return JSON.parse(sessionStorage.getItem(HQ_FAILURES_KEY) || '{}') } catch (_) { return {} }
    }

    // ------------------------------------------------------------------ quality tips
    // Why this PC gets less than the chosen quality, and what helps (e.g. moving the monitor to the integrated
    // graphics when an NVIDIA RTX 50 driver fails Disney+'s output protection). Shown once per app session.
    const hardwareOutputFailed = () =>
        !!hqBlocked() || Object.values(hqFailures()).some((f) => /^hardware DRM output/.test((f && f.reason) || ''))

    function qualityTip() {
        if (settings.quality === 'off' || !hq.checked || hqForced()) return null
        if (hardwareOutputFailed()) return 'tipOutput'
        if (!hq.playReady) return 'tipNoPlayReady'
        if (!hdcpAtLeast('1.4')) return 'tipNoHdcp'
        if (settings.quality !== 'uhd') return null
        if (!hevcHdrDecodable()) return 'tipNoHevc'
        if (!hdcpAtLeast('2.2')) return 'tipNoHdcp22'
        if (hqPlan() === 'uhd' && !matchMedia('(dynamic-range: high)').matches) return 'tipHdrOff'
        return null
    }

    function showTip(tip, delay = 0) {
        if (!tip) return
        try {
            const key = `dpd.tip.${tip}`
            if (sessionStorage.getItem(key)) return
            sessionStorage.setItem(key, '1')
        } catch (_) { }
        setTimeout(() => toast(t(tip), 12000), delay)
    }

    function showHqNotice() {
        let notice = null
        try { notice = sessionStorage.getItem(HQ_NOTICE_KEY); sessionStorage.removeItem(HQ_NOTICE_KEY) } catch (_) { }
        if (notice) setTimeout(() => toast(t(notice === 'uhd' ? 'hqFellBackUhd' : 'hqFellBackFhd'), 4500), 2500)
    }

    // Settings-menu text, e.g. "4K HDR · 2160p", "1080p · no HDCP · 480p", "Off".
    function qualityLabel() {
        if (settings.quality === 'off') return t('off')
        const parts = [HQ_PROFILES[settings.quality].label]
        if (hq.checked && !hq.playReady && !hqForced()) parts.push(t('hqNoPlayReady'))
        else if (hq.checked && !hqSupported('fhd')) parts.push(t('hqNoHdcp'))
        else if (hqFailed() || hqBlocked()) parts.push(t('hqDowngraded'))
        const height = lastVideo && lastVideo.videoHeight
        if (height) parts.push(`${height}p`)
        return parts.join(' · ')
    }

    function cycleQuality() {
        settings.quality = QUALITIES[(QUALITIES.indexOf(settings.quality) + 1) % QUALITIES.length]
        try { sessionStorage.removeItem(HQ_FAILED_KEY); localStorage.removeItem(HQ_BLOCKED_KEY) } catch (_) { }
        commit()
        // The SDK reads its profile when a playback session starts, so restart the current one.
        if (inPlayer()) {
            toast(t('hqReload'))
            setTimeout(() => location.reload(), 800)
        }
    }

    const hqCheck = checkHqSupport()
    trapGlobal('playback-service', patchPlaybackService)
    showHqNotice()

    // ------------------------------------------------------------------ state changes

    // Each feature runs on its own, so a failure in one (e.g. after a Disney+ update) never stops the others.
    function safely(fn, ...args) {
        try { fn(...args) } catch (e) { console.warn('[Disney+ Desktop]', fn.name, e) }
    }

    function tick() {
        safely(() => { if (sheetLang !== lang()) refreshSubtitleSheet() })
        let roots = [document]
        safely(() => { roots = collectRoots() })
        for (const root of roots) {
            safely(adoptSheet, root, sheet)
            safely(watchSubtitles, root)
            safely(markSubtitleBoxes, root)
            safely(watchDialogs, root)
            safely(enhanceDialog, root)
            safely(enhanceControls, root)
        }
        safely(applyWide, roots)
        safely(applySpeed)
        safely(checkSpeedPanel)
        safely(prunePointerHoles)
    }

    function commit() {
        refreshSubtitleSheet()
        tick()
        renderStyleForms()
        post({ settings })
        post({ state: { wide: settings.wide } })
    }

    function toggleWide() {
        settings.wide = !settings.wide
        commit()
        if (!settings.wide) toast(t('wideOff'))
        else if (!lastVideo) toast(t('wideOnLater'))
        else if (lastScale > 1) toast(t('wideOn', { scale: lastScale.toFixed(2) }))
        else toast(t('wideOnNoZoom'))
    }

    // ------------------------------------------------------------------ hotkeys & lifecycle

    addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isSpeedPanelOpen()) {
            e.preventDefault()
            e.stopImmediatePropagation()
            closeSpeedPanel()
            return
        }
        let cmd = null
        const plain = !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey
        if (plain && e.key === 'F11') cmd = 'fullscreen'
        else if (plain && e.key === 'F1') cmd = 'help'
        else if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
            if (e.code === 'KeyW') cmd = 'wide'
            else if (e.code === 'KeyS') cmd = 'settings'
        }
        if (!cmd) return
        e.preventDefault()
        e.stopImmediatePropagation()
        if (!e.repeat) post({ cmd })
    }, true)

    addEventListener('resize', tick)

    // Entering fullscreen puts the player on top of the top layer; lift our overlays back above it.
    document.addEventListener('fullscreenchange', () => {
        if (toastEl && toastEl.matches(':popover-open')) bringToTop(toastEl)
        if (isSpeedPanelOpen()) bringToTop(speedHost)
        tick()
    })

    Object.defineProperty(window, '__dpd', {
        value: Object.freeze({
            toast,
            showHelp,
            toggleSettings,
            toggleWide,
            getSettings: () => ({ ...settings }),
            getSpeed: () => speed,
            qualityInfo: () => ({
                appVersion: APP_VERSION,
                setting: settings.quality, checked: hq.checked,
                hardwarePlayReady: hq.playReady, hdcp: { ...hq.hdcp },
                nextSession: hqPlan(), activeSession: hq.active, playerCappedQuality: hq.restricted,
                steppedDownFrom: hqFailed(), failures: hqFailures(), hardwareDrmBlocked: hqBlocked(), tip: qualityTip(),
                language: `${locale()} → ${lang()}`,
                currentSession: hq.diag ? { ...hq.diag, started: undefined, licenceSessions: hq.licences } : null,
                playing: lastVideo ? `${lastVideo.videoWidth}x${lastVideo.videoHeight}` : null,
                environment: {
                    gpu: gpuOnce(),
                    screen: `${Math.round(screen.width * devicePixelRatio)}x${Math.round(screen.height * devicePixelRatio)}`,
                    hdrDisplay: matchMedia('(dynamic-range: high)').matches,
                    hevcMain: decodable('hvc1.1.6.L150.90'), hevcMain10: decodable('hvc1.2.4.L153.90'),
                },
            }),
        }),
    })

    setInterval(tick, 500)
    safely(refreshSubtitleSheet)
    safely(adoptSheet, document, sheet)
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick, { once: true })
    else tick()
    post({ state: { wide: settings.wide } })
})()

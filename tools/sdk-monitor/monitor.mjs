// SDK monitor for Disney+ Desktop (Node 20+, no dependencies).
//
// Watches what the app depends on but doesn't control, and reports changes:
//   • Disney+ playback SDK (playback-service / playback-session), from Disney+'s public playback config (PCS).
//     Disney+ rolls versions out gradually, so several can be live at once; every new one is reported.
//   • Disney+ web player UI bundle: the tags in its public CDN manifest ("latest" is what goes live next).
//   • Disney+'s player config for Edge on Windows (PCS "hive-dmp"): which DRM, max height, blocked formats.
//   • Microsoft WebView2 SDK on NuGet, compared with the version in DisneyPlusDesktop.csproj.
// For a new Disney+ SDK or player bundle it downloads the code and checks that every name player.js relies on
// is still there. Nothing is released automatically.
//
//   node monitor.mjs [--state state.json] [--report report.md] [--init]
// --init records the current state as the baseline without reporting. Writes "changed=true|false" to
// $GITHUB_OUTPUT when run in GitHub Actions.

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback }
const STATE_FILE = arg('--state', join(here, 'state.json'))
const REPORT_FILE = arg('--report', join(here, 'report.md'))
const INIT = process.argv.includes('--init')
const CSPROJ = join(here, '..', '..', 'src', 'DisneyPlusDesktop', 'DisneyPlusDesktop.csproj')

// The same public requests the Disney+ website makes (no sign-in).
const PCS_URLS = [
    'https://pcs.bamgrid.com/v1/disneyplus?namespaces=hive-dmp,dmp-js-distribution',
    'https://pcs.bamgrid.com/v1/disneyplus?brand=microsoft&platform=edge&os=windows&namespaces=hive-dmp,dmp-js-distribution,dmp-js-config,cpe-js-config,dmp-js-feature-enablement,ads,pqm',
]
const EDGE_CONFIG_URL = 'https://pcs.bamgrid.com/v1/disneyplus?brand=microsoft&platform=edge&os=windows&namespaces=hive-dmp'
const PLAYER_CDN = 'https://d24y7t659lna8o.cloudfront.net/@disney-web-player/bundle'
const NUGET_WEBVIEW2 = 'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/index.json'
const SDK_URL = /https:\/\/hiveplayer-static\.bamgrid\.com\/artifacts\/hive\/(playback-service|playback-session)\/([^/"]+)\/[^"]+?\.js/g
// Edge config settings the high-quality feature overrides or follows: DRM, max height, formats, preflight.
const EDGE_KEYS = /^engine\.(drm|allowMediaSourceReuse|allowSeamlessSwitch)|^session\.(enableDrmPreflightCheck|(vod|live|linear)\.(playlistFiltering|playbackAttributesConfig))/

// What player.js relies on, by where it lives. A missing name means that feature probably broke.
const CHECKS = {
    'playback-service': [
        ['createPlaybackSession', 'High quality: the hook into each playback session'],
        ['mediaCapabilitiesInfo', 'High quality: declaring FHD/UHD/HEVC support'],
        ['configOverrides', 'High quality: per-session config overrides'],
        ['clientParameters', 'High quality: per-session config overrides'],
        ['drmPlayReadyRecommendationFlow', 'High quality: PlayReady (Edge) profile'],
        ['drmKeySystem', 'High quality: switching to PlayReady'],
        ['enableDrmPreflightCheck', 'High quality: skipping the 720p preflight cap'],
        ['playbackAttributesConfig', 'High quality: requesting 1080p/2160p'],
        ['playlistFiltering', 'High quality: max height and blocked formats'],
        ['blockVideoFormats', 'High quality: allowing HEVC HDR10'],
        ['HEVC_HDR10', '4K HDR: HEVC HDR10 format name'],
    ],
    'playback-session': [
        ['com.microsoft.playready.recommendation', 'High quality: PlayReady key system'],
        ['0x8004cd22', 'High quality: hardware DRM failure handling (NVIDIA RTX 50 hint)'],
        ['enablePlayReadySoftwareFallback', 'High quality: following the player\'s own 720p fallback'],
        ['drmRestrictedMaxHeight', 'High quality: following the player\'s own quality cap'],
        ['videoRanges', '4K HDR: HDR10 request attribute'],
        ['hive-subtitle-renderer-cue', 'Subtitle styling: Disney+\'s subtitle elements'],
    ],
    player: [
        ['ui-ptr-exclude-register', 'Playback speed button: registering with the click-to-pause layer'],
        ['ui-ptr-exclude-unregister', 'Playback speed button: unregistering'],
        ['ui-ptr-exclude-geometry', 'Playback speed button: hole position updates'],
        ['data-ui-ptr-scope', 'Playback speed button: finding the layer\'s scope'],
        ['settings-modal-control', 'Settings menu integration and the speed button position'],
        ['main-settings-view', 'Settings menu: Widescreen fill and High quality items'],
        ['caption-settings-view', 'Subtitle Styling page'],
        ['settings-nav-item', 'Settings menu items'],
        ['captionSettings', 'Ctrl+Shift+S: opening Subtitle Styling'],
        ['caption-preview', 'Subtitle Styling: preview component'],
        ['captions-font-size', 'Subtitle Styling: size component'],
        ['styled-radio-buttons', 'Subtitle Styling: font/effect/position tiles'],
        ['picker-dots', 'Subtitle Styling: colour dots'],
        ['snap-slider', 'Subtitle Styling: background slider'],
        ['timed-text-override-region', 'Subtitle styling and position'],
        ['main-app-controls-overlay', 'Waking the controls, speed button'],
    ],
}

// ------------------------------------------------------------------ helpers

async function get(url, { json = false, tries = 3 } = {}) {
    for (let i = 1; ; i++) {
        try {
            const r = await fetch(url, { headers: { 'user-agent': 'DisneyPlusDesktop-sdk-monitor' } })
            if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
            return json ? await r.json() : await r.text()
        } catch (e) {
            if (i >= tries) throw new Error(`${url}: ${e.message}`)
            await new Promise((res) => setTimeout(res, 2000 * i))
        }
    }
}

const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v
const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16)

function flatten(obj, prefix = '', out = {}) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
    } else out[prefix] = JSON.stringify(obj)
    return out
}

// The web player's remote entry and every chunk it imports (same folder), as one text.
async function playerCode(version) {
    const base = `${PLAYER_CDN}/${version}/dist/remote/`
    const seen = new Set(['index.js'])
    const queue = ['index.js']
    let all = ''
    while (queue.length && seen.size < 400) {
        const file = queue.shift()
        const code = await get(base + file)
        all += '\n' + code
        for (const m of code.matchAll(/["'`]\.\/([A-Za-z0-9_.-]+\.js)["'`]/g)) {
            if (!seen.has(m[1])) { seen.add(m[1]); queue.push(m[1]) }
        }
    }
    return { code: all, files: seen.size }
}

function runChecks(kind, code) {
    return CHECKS[kind].map(([name, what]) => ({ name, what, ok: code.includes(name) }))
}

function checkTable(results) {
    const lines = ['| Check | Used for | Result |', '| --- | --- | --- |']
    for (const r of results) lines.push(`| \`${r.name}\` | ${r.what} | ${r.ok ? '✅ found' : '❌ **missing**'} |`)
    return lines.join('\n')
}

// ------------------------------------------------------------------ current state

async function current() {
    const sdk = new Map() // "playback-service 26.16.2-piglet" → url
    for (const url of PCS_URLS) {
        // Several requests: the rollout can answer differently each time.
        for (let i = 0; i < 3; i++) {
            const text = await get(url)
            for (const m of text.matchAll(SDK_URL)) sdk.set(`${m[1]} ${m[2]}`, m[0])
        }
    }

    const manifest = await get(`${PLAYER_CDN}/manifest.json`, { json: true })
    const playerTags = {}
    for (const [tag, entry] of Object.entries(manifest.tags || {})) {
        const v = (entry.esm || '').match(/\/bundle\/([^/]+)\/dist\//)
        if (v) playerTags[tag] = v[1]
    }

    // Only the settings the high-quality feature works with (Disney+ edits the rest of this document often).
    const edge = await get(EDGE_CONFIG_URL, { json: true })
    const edgeFlat = flatten(sortKeys((edge['hive-dmp'] && edge['hive-dmp'].document) || {}))
    const relevant = Object.fromEntries(Object.entries(edgeFlat).filter(([k]) => EDGE_KEYS.test(k)))

    const nuget = await get(NUGET_WEBVIEW2, { json: true })
    const stable = nuget.versions.filter((v) => !v.includes('-'))
    const csproj = existsSync(CSPROJ) ? readFileSync(CSPROJ, 'utf8') : ''
    const used = (csproj.match(/Include="Microsoft\.Web\.WebView2" Version="([^"]+)"/) || [])[1] || null

    return {
        sdk: Object.fromEntries([...sdk.entries()].sort()),
        playerLatest: playerTags.latest || null,
        playerTags,
        edgeConfig: { hash: sha(JSON.stringify(relevant)), documentVersion: edge['hive-dmp'] && edge['hive-dmp'].metadata && edge['hive-dmp'].metadata.documentVersion, flat: relevant },
        webView2: { latest: stable[stable.length - 1], used },
    }
}

// ------------------------------------------------------------------ main

// Manual checks: --check-player <version> | --check-sdk <playback-service or playback-session URL>
const checkPlayer = arg('--check-player')
const checkSdk = arg('--check-sdk')
if (checkPlayer || checkSdk) {
    let failed = 0
    if (checkPlayer) {
        const { code, files } = await playerCode(checkPlayer)
        const results = runChecks('player', code)
        failed += results.filter((r) => !r.ok).length
        console.log(`Disney+ web player ${checkPlayer} (${files} files)\n${checkTable(results)}\n`)
    }
    if (checkSdk) {
        const kind = checkSdk.includes('playback-session') ? 'playback-session' : 'playback-service'
        const results = runChecks(kind, await get(checkSdk))
        failed += results.filter((r) => !r.ok).length
        console.log(`Disney+ ${kind}: ${checkSdk}\n${checkTable(results)}\n`)
    }
    process.exitCode = failed ? 1 : 0
} else {
    await monitor()
}

async function monitor() {
const now = await current()
const old = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : null
const report = []
const titles = []

if (old && !INIT) {
    // New Disney+ playback SDK versions.
    const newSdk = Object.keys(now.sdk).filter((k) => !(k in (old.sdkSeen || {})))
    for (const key of newSdk) {
        const [kind, version] = key.split(' ')
        let section = `### Disney+ ${kind} ${version}\n\nNow served by Disney+'s playback config: ${now.sdk[key]}\n\n`
        try {
            const results = runChecks(kind, await get(now.sdk[key]))
            const failed = results.filter((r) => !r.ok).length
            section += `**Compatibility:** ${failed ? `❌ ${failed} check(s) failed. The features listed below probably need a fix.` : '✅ every name the app relies on is still there.'}\n\n${checkTable(results)}\n`
            titles.push(`${kind} ${version}${failed ? ' ⚠️' : ''}`)
        } catch (e) {
            section += `Couldn't download it to check: ${e.message}\n`
            titles.push(`${kind} ${version}`)
        }
        report.push(section)
    }

    // New web player bundle published as "latest".
    if (now.playerLatest && now.playerLatest !== old.playerLatest) {
        let section = `### Disney+ web player ${now.playerLatest} (was ${old.playerLatest || 'unknown'})\n\n` +
            `Tagged "latest" on Disney+'s CDN. Disney+ switches the site to it on its own schedule, so it may not be live yet.\n\n`
        try {
            const { code, files } = await playerCode(now.playerLatest)
            const results = runChecks('player', code)
            const failed = results.filter((r) => !r.ok).length
            section += `**Compatibility** (${files} files checked): ${failed ? `❌ ${failed} check(s) failed. The features listed below probably need a fix before this goes live.` : '✅ every name the app relies on is still there.'}\n\n${checkTable(results)}\n`
            titles.push(`web player ${now.playerLatest}${failed ? ' ⚠️' : ''}`)
        } catch (e) {
            section += `Couldn't download it to check: ${e.message}\n`
            titles.push(`web player ${now.playerLatest}`)
        }
        report.push(section)
    }

    // Disney+'s player config for Edge on Windows.
    if (old.edgeConfig && now.edgeConfig.hash !== old.edgeConfig.hash) {
        const before = old.edgeConfig.flat || {}
        const after = now.edgeConfig.flat
        const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => before[k] !== after[k]).sort()
        const rows = keys.slice(0, 60).map((k) => `| \`${k}\` | ${before[k] ?? '—'} | ${after[k] ?? '—'} |`)
        report.push(`### Disney+ player config for Edge changed (${old.edgeConfig.documentVersion} → ${now.edgeConfig.documentVersion})\n\n` +
            `The high-quality feature overrides parts of this config; check the rows below (DRM, max height, blocked formats).\n\n` +
            `| Setting | Before | After |\n| --- | --- | --- |\n${rows.join('\n')}${keys.length > 60 ? `\n\n…and ${keys.length - 60} more.` : ''}\n`)
        titles.push('Edge player config')
    }

    // A newer WebView2 SDK than the app uses (reported once per version).
    if (now.webView2.used && now.webView2.latest !== now.webView2.used && now.webView2.latest !== old.webView2Reported) {
        report.push(`### Microsoft WebView2 SDK ${now.webView2.latest}\n\n` +
            `The app uses ${now.webView2.used}. To ship it: update the PackageReference in DisneyPlusDesktop.csproj, raise <Version>, build and release.\n`)
        titles.push(`WebView2 SDK ${now.webView2.latest}`)
    }
}

// Only what changes when something is reported, so the file (committed by the workflow) changes only then.
// Versions seen during a rollout are kept, so one flickering back and forth is reported once.
const fresh = INIT || !old
const state = {
    sdkSeen: { ...(fresh ? {} : old.sdkSeen), ...now.sdk },
    playerLatest: now.playerLatest,
    edgeConfig: now.edgeConfig,
    webView2Reported: titles.some((t) => t.startsWith('WebView2')) || fresh ? now.webView2.latest : old.webView2Reported,
}
writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n')

const changed = report.length > 0
const title = `SDK update: ${titles.join(', ')}`.replace(/[\r\n]+/g, ' ')
if (changed) {
    writeFileSync(REPORT_FILE, `${report.join('\n')}\n---\nDetected by the SDK monitor on ${new Date().toISOString()}. ` +
        'Nothing has been released; decide whether a new version is needed.\n')
    console.log(title)
} else {
    console.log(fresh ? 'Baseline recorded.' : 'No changes.')
}
console.log(`Live SDK: ${Object.keys(now.sdk).join(', ')} | web player latest: ${now.playerLatest} | ` +
    `Edge config ${now.edgeConfig.documentVersion} | WebView2 ${now.webView2.used} (latest ${now.webView2.latest})`)
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\ntitle=${changed ? title : ''}\n`)
}

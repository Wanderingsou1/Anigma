# Embed / Streaming Providers — Market Test

Last tested: **2026-07-02**. Test title: **One Piece** (MAL `21`, AniList `21`),
episode `1`.

## What these tests can and can't tell you

Tests run via `curl` from a **datacenter IP** (same conditions as Vercel) and
**cannot execute JavaScript**. So they prove **structural viability**, not final
playback:

- ✅ reachable (HTTP 200, not 403/404/5xx/timeout)
- ✅ **frameable** — no `X-Frame-Options` and no CSP `frame-ancestors` that would
  stop Anigma from iframing it (this alone kills several providers)
- ✅ returns a real **player** (jwplayer / hls / video markers) instead of an
  error shell or a Cloudflare challenge

A provider can pass all of the above and still not play a *specific* title if its
catalog lacks that anime or it geo-gates the stream. Final confirmation needs the
browser. "Structurally OK" below means "worth keeping / testing in-app", not
"guaranteed to play every episode".

## Full sweep

| Provider | Keyed by | HTTP | Frameable | Player? | Verdict |
| -------- | -------- | ---- | --------- | ------- | ------- |
| **VidNest** (`vidnest.fun`) | AniList | 200 | ✅ | ✅ real | ✅ **Working** — confirmed playing in-browser (default) |
| **VidLink** (`vidlink.pro`) | MAL | 200 | ✅ | ✅ jwplayer+m3u8 | ❌ **Broken** — in-browser: "not found" for all titles/ids |
| **VidPlus** (`player.vidplus.to`) | AniList | 403 | ❌ SAMEORIGIN | ❌ CF challenge | ❌ **Broken** |
| **VidSrc.cc** (`vidsrc.cc/v2`) | MAL | 522 / timeout | ✅ | ❌ origin down | ❌ **Down** |
| **VidSrc.su** (`vidsrc.su`) | AniList | 200 | ✅ | ⚠️ empty SPA shell | ⚠️ **Inconclusive** — no player markers |
| **VidFast** (`vidfast.pro`) | AniList | 404 | ✅ | ❌ Error | ❌ **No anime support** |
| **VidWish** (`vidwish.live`) | MAL | 200 | ✅ | ❌ "Error - Vidcloud" | ❌ **No source for id format** |
| **MegaPlay** (`megaplay.buzz`) | HiAnime ep id | 200 | ✅ | ❌ error w/ MAL id | ⚠️ **Needs HiAnime id** (not MAL) |
| **AniPlay** (`animeplay.cfd`) | HiAnime ep id | 200 | ✅ | ❌ error w/ MAL id | ⚠️ **Needs HiAnime id** (MegaPlay mirror) |
| **2anime.xyz** | title slug | 403 | ✅ | ❌ | ❌ **Blocked / slug-only** |
| **AutoEmbed** (`anime.autoembed.cc`) | title slug | DNS fail | — | — | ❌ **Dead / slug-only** |
| **AnimeOwl** (`animeowl.me`) | — | 200 | ✅ | ❌ full site, not embed | ❌ **Not an embed API** |
| **RiveStream** (`rivestream.net`) | TMDB | timeout | ✅ | — | ❌ **Down / not MAL-keyed** |
| **Miruro** (`miruro.tv`) | — | SSL error | — | — | ❌ **Full app, not embed** |
| **HiAnime** (aniwatch SDK, in-process) | title→id | fetchError | n/a | n/a | ⚠️ **Datacenter-blocked** — works residential/local |
| **Senshi HLS API** (`senshi.live/episode-embeds`) | MAL | 200 | n/a | ✅ returns m3u8 | ✅ **Working via `/api/hls`** — confirmed playing in-app (even from datacenter) |
| **Senshi iframe** (`senshi.live/watch`) | MAL | 200 | ✅ | ❌ landing page | ❌ **Dead — removed** |

## Coverage matrix — VidNest vs Senshi (16 titles, in-app, 2026-07-02)

Episode 1 (sub), driven through the real app. ✅ = video actually played.

| Anime | VidNest | Senshi |
| ----- | ------- | ------ |
| One Piece | ✅ | ✅ |
| Naruto | ✅ | ✅ |
| Attack on Titan | ✅ | ✅ |
| Death Note | ✅ | ✅ |
| FMA: Brotherhood | ✅ | ✅ |
| Demon Slayer | ❌ no source | ✅ |
| Jujutsu Kaisen | ✅ | ✅ |
| Frieren | ✅ | ✅ |
| Solo Leveling | ✅ | ✅ |
| Dandadan | ❌ no source | ✅ |
| Chainsaw Man | ✅ | ✅ |
| Spy x Family | ✅ | ✅ |
| Steins;Gate | ✅ | ✅ |
| Bleach | ✅ | ✅ |
| Your Name (movie) | ✅ | ❌ no source |
| Cowboy Bebop | ✅ | ✅ |
| **Score** | **14 / 16** | **15 / 16** |

**Key takeaway:** the two providers are **complementary** — every title one
missed, the other had. **Combined coverage was 16/16.** VidNest tends to have
movies (Your Name); Senshi tends to have newer TV that VidNest lacks (Demon
Slayer, Dandadan). This is a strong case for an automatic cross-provider
fallback.

## Categories

### ✅ Use — confirmed working
- **VidNest** — `https://vidnest.fun/anime/{anilistId}/{ep}/{sub|dub}`
  Player-only iframe, no framing restriction, returns a real player. Default.

### ⚠️ Keep as fallback — structurally OK, playback not guaranteed
- **HiAnime** (aniwatch SDK, server-side) — resolved in-process. Works on a
  residential IP (local dev), fails on Vercel/datacenter (`fetchError`).

### ✅ Use — Senshi HLS (server-side, works even on datacenter)
- **Senshi HLS API** — `https://senshi.live/episode-embeds/{malId}/{ep}` returns
  an m3u8. Played through `/api/hls`, which sends the `senshi.live` referer the
  hotlink-protected stream host requires and rewrites every segment/child URL
  back through the proxy. **Confirmed playing in-app 2026-07-02** (readyState 4,
  time advancing, 1080p) — and it worked from a datacenter IP, unlike HiAnime.
  Selectable in the UI as "Senshi" / "Senshi (Dub)"; resolved in
  `sources/route.ts`, no iframe.

### ⚠️ Possible but needs work — not drop-in
- **MegaPlay / AniPlay** — `https://megaplay.buzz/stream/s-2/{hianimeEpId}/{sub|dub}`
  Frameable and returns a real player, **but keyed by HiAnime episode id**, not
  MAL/AniList. Using it requires first resolving the HiAnime id — which is the
  same datacenter-blocked scrape as HiAnime. Only viable if paired with a
  working HiAnime id resolver (i.e. residential host / proxy).
- **VidSrc.su** — reachable + frameable but returns an empty SPA shell with no
  player markers; couldn't confirm it actually has anime. Test in-browser before
  trusting.

### ❌ Do not use
- **VidLink** — reachable and frameable, but its `/anime/{id}` player returns
  "We Couldn't Find This Episode" for every title tested (One Piece, Frieren,
  Solo Leveling, AoT, Dandadan) with both MAL and AniList ids. Anime endpoint is
  defunct. Confirmed in-browser 2026-07-02.
- **VidPlus** — Cloudflare 403 challenge + `X-Frame-Options: SAMEORIGIN`. Cannot
  be embedded under any config.
- **VidSrc.cc** — origin down (HTTP 522) at test time.
- **VidFast** — 404, no anime support via id.
- **VidWish** — "Error - Vidcloud", no content for the id format.
- **2anime.xyz / AutoEmbed** — slug-keyed (no MAL/AniList id form) and
  blocked/dead.
- **AnimeOwl / Miruro** — full websites, not embeddable player APIs.
- **RiveStream** — TMDB-keyed (movies/TV), not anime by MAL; down at test time.
- **Senshi `/watch` iframe** — now a landing page, no player.

## Recommendation

1. **VidNest** = default and the **only confirmed-working client-side provider**
   (verified playing in-browser 2026-07-02).
2. Keep **HiAnime** (works local) + **Senshi HLS API** (works via proxy) for
   environments with a residential IP.
3. Drop **VidPlus** and **VidLink** (both done), plus the dead **Senshi
   `/watch`** iframe.
4. **MegaPlay** is the best *additional* option but only pays off if you have a
   working HiAnime-id resolver (residential host or proxy) — otherwise it can't
   be keyed from MAL/AniList alone.

## Re-running

Iframe providers (status + framing + player markers):

```bash
url="https://vidnest.fun/anime/21/1/sub"
curl -s -m 20 -A "Mozilla/5.0" -e "https://anigma.app/" -D - -o /tmp/b.html -L "$url" \
  | grep -iE "^HTTP/|x-frame-options|frame-ancestors"
grep -oiE "m3u8|hls|jwplayer|<video|error|just a moment" /tmp/b.html | sort -u
```

HiAnime (server-side SDK):

```bash
node --input-type=module -e '
import { HiAnime } from "aniwatch";
console.log((await new HiAnime.Scraper().search("one piece"))?.animes?.[0]?.id);
'
```

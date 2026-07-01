# Anigma

A modern anime streaming and discovery web app built with **Next.js 16 (App Router)** and **React 19**. Anigma aggregates metadata from public anime databases (Jikan/MyAnimeList, AniList, MangaDex) and resolves playable video sources from multiple streaming providers, presenting everything through a polished, dark-themed UI.

> ⚠️ **Disclaimer** — This project is for educational purposes. It does not host any video content; it links to and embeds third-party streaming providers. Respect the terms of service of every upstream API and streaming source, and the copyright laws of your jurisdiction.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Streaming: how playback works](#streaming-how-playback-works)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)

---

## Features

- **Discovery** — trending, top-rated, seasonal, and genre-based browsing, plus full-text search.
- **Rich detail pages** — synopsis, genres, studio, rating, episode lists, and trailers, aggregated from multiple metadata sources.
- **Multi-provider streaming** — a single watch page that resolves the best available source across several providers, with automatic fallback.
- **Sub & Dub** — switch audio track where a provider supports it.
- **Custom HLS player** — direct `.m3u8` streams play in an in-app [hls.js](https://github.com/video-dev/hls.js) player with seek-safe segment proxying; iframe providers render as embedded players.
- **Authentication** — OAuth sign-in via Google and Discord (NextAuth).
- **User area** — favorites, watchlist, watch history, and profile (session-gated API scaffolding).
- **Responsive dark UI** — built with Tailwind CSS v4, custom gradients, and glassmorphism.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Auth | NextAuth v4 (Google + Discord OAuth) |
| Validation | Zod |
| Data (models) | Mongoose (MongoDB) |
| Streaming | `aniwatch` (HiAnime scraper), `@consumet/extensions`, iframe embed providers, hls.js |
| HTTP | native `fetch`, Axios |
| Language | TypeScript |

---

## Architecture

Anigma is a **Next.js full-stack app**. The browser talks only to Anigma's own API routes (`/api/*`); those routes fan out to upstream services server-side. This keeps API keys, referers, and provider quirks on the server and gives the client one consistent shape.

```
Browser (React)
   │   fetch /api/...
   ▼
Next.js API Routes  ──►  Jikan (MyAnimeList)   — metadata, episodes, schedule
   │                ──►  AniList (GraphQL)      — metadata, trending
   │                ──►  MangaDex               — related manga/extras
   │                ──►  aniwatch (HiAnime)      — HLS source scraping
   │                ──►  Senshi                  — HLS source
   │                └─►  iframe providers        — player-only embeds
   ▼
/api/hls  ──►  proxies + rewrites .m3u8 playlists and segments (CORS, referer, range)
```

### Metadata sources
- **Jikan** (`https://api.jikan.moe/v4`) — MyAnimeList data: search, top, seasonal, schedule, episodes.
- **AniList** (`https://graphql.anilist.co`) — trending and supplementary metadata.
- **MangaDex** (`https://api.mangadex.org`) — related manga/extras.

Helpers live in [src/lib/api/](src/lib/api/): [jikan.ts](src/lib/api/jikan.ts), [anilist.ts](src/lib/api/anilist.ts), [mangadex.ts](src/lib/api/mangadex.ts), with a small in-memory [cache.ts](src/lib/api/cache.ts).

---

## Streaming: how playback works

The watch page ([src/app/watch/[id]/WatchContent.tsx](src/app/watch/[id]/WatchContent.tsx)) requests sources from [`/api/anime/[id]/sources`](src/app/api/anime/[id]/sources/route.ts), which tries providers **in order** and returns the first that works:

1. **HiAnime (aniwatch)** — scrapes hianime.to for a raw `.m3u8` (sub/dub). Returned as `type: "hls"`.
2. **Senshi** — resolves a raw `.m3u8` from its embed endpoint. Returned as `type: "hls"`.
3. **Iframe embeds** — player-only providers keyed by MyAnimeList ID + episode. Returned as `type: "iframe"`.

Registered embed providers live in [src/lib/api/embeds.ts](src/lib/api/embeds.ts):

| Provider | Type | Notes |
|---|---|---|
| **HiAnime** | HLS (scraped) | Largest library; unreliable on datacenter IPs (see Limitations) |
| **VidNest** | iframe | Player-only, reliable, used as the universal fallback |
| **Senshi** | HLS (scraped) | Played in the in-app player; never embedded as a full page |

### The player
- **HLS sources** play in a native `<video>` element driven by **hls.js**, loaded on demand from a CDN. The player includes fatal-error recovery (network errors → retry `startLoad()`, media errors → `recoverMediaError()`) so recoverable stalls after seeking don't kill playback.
- **iframe sources** render in a sandboxed `<iframe>` — playback happens in the viewer's browser, which sidesteps server-side IP blocks.

### The HLS proxy — [`/api/hls`](src/app/api/hls/route.ts)
Raw provider streams can't be played directly from the browser (CORS, required `Referer` headers, mixed origins). The proxy solves this:

- Fetches upstream with the correct `Referer`/`Origin`/`User-Agent`.
- Rewrites `.m3u8` playlists so **every** segment, child playlist, encryption key (`#EXT-X-KEY`), init segment (`#EXT-X-MAP`), and rendition (`#EXT-X-MEDIA`) URL is routed back through the proxy.
- **Forwards HTTP `Range` requests** and preserves `206 Partial Content` + `Content-Range`, so seeking into byte-range / fragmented-MP4 segments fetches the correct slice instead of stalling.
- Adds permissive CORS headers.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # landing
│   ├── home/ browse/ search/    # discovery pages
│   ├── anime/[id]/              # detail page
│   ├── genre/[slug]/            # genre listing
│   ├── watch/[id]/              # player page (WatchContent.tsx)
│   ├── login/ signup/ profile/  # auth + user pages
│   └── api/                     # backend routes (see below)
├── components/                  # Navbar, Carousel, HeroBanner, AnimeCard, …
│   └── providers/AuthProvider.tsx
├── lib/
│   ├── api/                     # jikan, anilist, mangadex, aniwatch, embeds, cache, extras, types
│   ├── db/                      # mongoose connection + models (User, Favorite, Watchlist, WatchHistory)
│   └── validations/auth.ts      # Zod schemas
└── middleware.ts                # currently a pass-through
```

---

## API Routes

### Anime / metadata
| Route | Purpose |
|---|---|
| `GET /api/anime/[id]` | Full anime details |
| `GET /api/anime/[id]/episodes` | Episode list |
| `GET /api/anime/[id]/sources?ep=&server=&subOrDub=` | Resolve a playable source (HLS or iframe) |
| `GET /api/anime/search` | Search |
| `GET /api/anime/top` | Top-rated |
| `GET /api/anime/trending` | Trending |
| `GET /api/anime/seasonal` | Current season |
| `GET /api/anime/schedule` | Airing schedule |
| `GET /api/anime/genre/[genreId]` | By genre |
| `GET /api/anime/providers` | Available streaming providers |

### Streaming
| Route | Purpose |
|---|---|
| `GET /api/hls?url=&ref=` | CORS/referer/range-aware `.m3u8` + segment proxy |

### Auth & user
| Route | Purpose |
|---|---|
| `.../api/auth/[...nextauth]` | NextAuth (Google + Discord) |
| `POST /api/auth/register` | Registration |
| `GET/POST /api/user/favorites` | Favorites (session-gated) |
| `GET/POST /api/user/watchlist` | Watchlist (session-gated) |
| `GET/POST /api/user/history` | Watch history (session-gated) |
| `GET /api/user/profile` | Profile (session-gated) |

---

## Getting Started

**Prerequisites:** Node.js 18.18+ (Node 20+ recommended).

```bash
# 1. Install dependencies
npm install

# 2. Create your env file (see below)
#    create .env.local manually in the project root

# 3. Run the dev server (Turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Create `.env.local` in the project root:

```bash
# NextAuth (required for auth)
NEXTAUTH_SECRET=your-random-secret        # generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000        # your deployed URL in production

# Google OAuth (optional — enables Google sign-in)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Discord OAuth (optional — enables Discord sign-in)
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

All external metadata/streaming APIs used are **public and keyless**, so no additional keys are required to browse and stream.

---

## Deployment

Optimized for **Vercel** (`next build`). Set the same environment variables in your Vercel project settings, and set `NEXTAUTH_URL` to your production domain.

Configured image domains (see [next.config.ts](next.config.ts)): `cdn.myanimelist.net`, `s4.anilist.co`, `uploads.mangadex.org`, `api.waifu.pics`, `img1.ak.crunchyroll.com`.

---

## Known Limitations

- **HiAnime/aniwatch on Vercel** — the `aniwatch` scraper and other server-side scrapers make requests from Vercel's **datacenter IPs**, which streaming sites (behind Cloudflare) frequently block. On Vercel these paths may silently fail and fall back to iframe providers. **Iframe embeds (e.g. VidNest) are unaffected** because they load in the viewer's browser (residential IP). To get reliable raw HLS from HiAnime, self-host [aniwatch-api](https://github.com/ghoshRitesh12/aniwatch-api) on a non-datacenter host and fetch it from the app.
- **Serverless timeouts** — the sources route chains several provider lookups; on constrained plans this can approach the function time limit. Consider raising `maxDuration` or trimming the provider chain.
- **User persistence** — auth is wired, and Mongoose models exist under [src/lib/db/](src/lib/db/), but the user data routes (favorites/watchlist/history) are currently session-gated scaffolding and not yet backed by a live database connection.
- **Third-party providers change often** — streaming/embed endpoints go down or change format without notice; providers are intentionally kept behind the `/api/anime/[id]/sources` fallback chain for resilience.

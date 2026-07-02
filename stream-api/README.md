# anigma-stream-api

Standalone HiAnime scraping service for Anigma. `hianime.to` blocks datacenter
IPs (Vercel, this sandbox, etc.), so the scraper has to run on a
**non-datacenter host**. Deploy this folder on Railway / Render / Fly / a VPS,
then point the Anigma app at it via `STREAM_API_URL`.

## Endpoints

| Method | Path                                              | Returns |
| ------ | ------------------------------------------------- | ------- |
| GET    | `/health`                                         | `{ ok: true }` |
| GET    | `/search?q=<title>`                                | `{ success, data: { animes: [{ id, name, ... }] } }` |
| GET    | `/episodes?animeId=<hianime-id>`                  | `{ success, data: { episodes: [{ episodeId, number, title, isFiller }] } }` |
| GET    | `/sources?episodeId=<id>&category=sub\|dub`       | `{ success, data: { sources: [{ url, type }], tracks, intro, outro, headers } }` |

All non-health requests require `?key=<API_KEY>` (or an `x-api-key` header)
**only if** `API_KEY` is set in the environment.

## Environment variables

| Var       | Required | Default | Notes |
| --------- | -------- | ------- | ----- |
| `PORT`    | no       | `3001`  | Most hosts inject this automatically. |
| `API_KEY` | no       | (none)  | Shared secret. If set, callers must pass `?key=`. Must match Anigma's `STREAM_API_KEY`. |

## Run locally

```bash
cd stream-api
npm install
npm start
# smoke test
curl "http://localhost:3001/health"
curl "http://localhost:3001/search?q=naruto"
```

> Running locally on a residential connection works. Running on a datacenter IP
> returns `success: true` with empty results — that's the block you're avoiding.

## Deploy

### Railway / Render
1. New service → **Deploy from repo** (or drag this folder into a fresh repo).
2. Root directory: `stream-api`.
3. Build command: `npm install` · Start command: `npm start`.
4. Set `API_KEY` to a random string (optional but recommended).
5. Copy the public URL it gives you.

### Fly.io
```bash
cd stream-api
fly launch --now      # accept the generated Dockerfile / Nixpacks build
fly secrets set API_KEY=<random-string>
```

### Any VPS
```bash
cd stream-api
npm install
API_KEY=<random-string> PORT=3001 node server.js   # put behind pm2 + a reverse proxy
```

## Wire up Anigma

In the main app's environment (Vercel project settings, or `.env.local`):

```
STREAM_API_URL=https://your-stream-api.example.com
STREAM_API_KEY=<same value as the service's API_KEY>   # omit if API_KEY unset
```

When `STREAM_API_URL` is unset, the app no-ops gracefully and falls back to its
other providers (see `src/lib/api/aniwatch.ts`).

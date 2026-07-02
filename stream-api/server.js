import express from "express";
import cors from "cors";
import { HiAnime } from "aniwatch";

const app = express();
const scraper = new HiAnime.Scraper();

app.use(cors());

// Optional shared secret. If API_KEY is set in the environment, every request
// must send `?key=...` (or an `x-api-key` header) that matches it. Keeps random
// traffic off your instance.
const API_KEY = process.env.API_KEY || "";
app.use((req, res, next) => {
  if (req.path === "/" || req.path === "/health") return next();
  if (!API_KEY) return next();
  const key = req.query.key || req.headers["x-api-key"];
  if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
});

const ok = (res, data) =>
  res.set("Cache-Control", "public, max-age=60").json({ success: true, data });
const fail = (res, err, code = 500) =>
  res.status(code).json({ success: false, error: String(err?.message || err) });

app.get(["/", "/health"], (_req, res) => res.json({ ok: true, service: "anigma-stream-api" }));

/**
 * GET /search?q=naruto
 * -> { success, data: { animes: [{ id, name, ... }] } }
 */
app.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return fail(res, "Missing q", 400);
  try {
    const result = await scraper.search(q);
    ok(res, { animes: result?.animes ?? [] });
  } catch (err) {
    fail(res, err);
  }
});

/**
 * GET /episodes?animeId=<hianime-id>
 * -> { success, data: { episodes: [{ episodeId, number, title, isFiller }] } }
 */
app.get("/episodes", async (req, res) => {
  const animeId = String(req.query.animeId || "").trim();
  if (!animeId) return fail(res, "Missing animeId", 400);
  try {
    const result = await scraper.getEpisodes(animeId);
    ok(res, { episodes: result?.episodes ?? [] });
  } catch (err) {
    fail(res, err);
  }
});

/**
 * GET /sources?episodeId=<id>&category=sub|dub&server=hd-1
 * -> { success, data: { sources: [{ url, type }], tracks, headers, ... } }
 * The `episodeId` is the full HiAnime episode id (e.g. "naruto-677?ep=12345").
 */
app.get("/sources", async (req, res) => {
  const episodeId = String(req.query.episodeId || "").trim();
  const category = req.query.category === "dub" ? "dub" : "sub";
  const serverName = String(req.query.server || "").trim();
  if (!episodeId) return fail(res, "Missing episodeId", 400);

  // Map a friendly server name to the aniwatch enum; default to VidStreaming.
  const serverMap = {
    vidstreaming: HiAnime.Servers.VidStreaming,
    "hd-1": HiAnime.Servers.VidStreaming,
    vidcloud: HiAnime.Servers.VidCloud,
    "hd-2": HiAnime.Servers.VidCloud,
    streamsb: HiAnime.Servers.StreamSB,
    streamtape: HiAnime.Servers.StreamTape,
  };
  const server = serverMap[serverName.toLowerCase()] ?? HiAnime.Servers.VidStreaming;

  try {
    const result = await scraper.getEpisodeSources(episodeId, server, category);
    ok(res, {
      sources: (result?.sources ?? []).map((s) => ({
        url: s.url,
        type: s.type === "mp4" ? "mp4" : "m3u8",
      })),
      tracks: result?.tracks ?? [],
      intro: result?.intro ?? null,
      outro: result?.outro ?? null,
      headers: result?.headers ?? {},
    });
  } catch (err) {
    fail(res, err);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`anigma-stream-api listening on :${PORT}`));

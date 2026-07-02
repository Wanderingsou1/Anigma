import type { EmbedServer } from "./types";
import { getAniListIdByMalId } from "./anilist";

export const EMBED_SERVERS: EmbedServer[] = [
  // ── SUB servers ────────────────────────────────────────────────────────────
  // VidNest is a player-only iframe that loads from the viewer's browser
  // (residential IP), so it works reliably on Vercel. HiAnime and Senshi are
  // resolved server-side as HLS streams (see sources/route.ts) and played
  // through the /api/hls proxy — they have no iframe URL. VidNest is the default.
  {
    key: "vidnest-sub",
    label: "VidNest",
    subOrDub: "sub",
    // VidNest keys its catalog by AniList ID.
    getUrl: ({ anilistId }, episode) =>
      `https://vidnest.fun/anime/${anilistId}/${episode}/sub`,
  },
  {
    key: "aniwatch-sub",
    label: "HiAnime",
    subOrDub: "sub",
    getUrl: () => "", // resolved server-side via aniwatch SDK
  },
  {
    // Senshi is resolved server-side as an HLS stream in sources/route.ts and
    // played via the /api/hls proxy; it has no iframe URL.
    key: "senshi-sub",
    label: "Senshi",
    subOrDub: "sub",
    getUrl: () => "",
  },

  // ── DUB servers ────────────────────────────────────────────────────────────
  {
    key: "vidnest-dub",
    label: "VidNest (Dub)",
    subOrDub: "dub",
    getUrl: ({ anilistId }, episode) =>
      `https://vidnest.fun/anime/${anilistId}/${episode}/dub`,
  },
  {
    key: "aniwatch-dub",
    label: "HiAnime (Dub)",
    subOrDub: "dub",
    getUrl: () => "",
  },
  {
    key: "senshi-dub",
    label: "Senshi (Dub)",
    subOrDub: "dub",
    getUrl: () => "",
  },
];

export const SUB_SERVERS = EMBED_SERVERS.filter((s) => s.subOrDub === "sub");
export const DUB_SERVERS = EMBED_SERVERS.filter((s) => s.subOrDub === "dub");

export function getEmbedServer(key: string): EmbedServer | undefined {
  return EMBED_SERVERS.find((s) => s.key === key);
}

export function getDefaultServer(subOrDub: "sub" | "dub"): EmbedServer {
  return subOrDub === "dub" ? DUB_SERVERS[0] : SUB_SERVERS[0];
}

export interface EmbedSourceResponse {
  malId: number;
  episode: number;
  subOrDub: "sub" | "dub";
  serverKey: string;
  embedUrl: string;
  type?: "hls" | "iframe";
  servers: {
    sub: { key: string; label: string }[];
    dub: { key: string; label: string }[];
  };
}

export async function buildSourceResponse(
  malId: number,
  episode: number,
  serverKey: string,
  subOrDub: "sub" | "dub",
  anilistId?: number
): Promise<EmbedSourceResponse> {
  const server = getEmbedServer(serverKey) ?? getDefaultServer(subOrDub);
  // Some providers key by AniList ID; resolve it from the MAL ID when unknown.
  const resolvedAniListId =
    anilistId || (await getAniListIdByMalId(malId)) || malId;
  return {
    malId,
    episode,
    subOrDub: server.subOrDub,
    serverKey: server.key,
    embedUrl: server.getUrl({ malId, anilistId: resolvedAniListId }, episode),
    servers: {
      sub: SUB_SERVERS.map((s) => ({ key: s.key, label: s.label })),
      dub: DUB_SERVERS.map((s) => ({ key: s.key, label: s.label })),
    },
  };
}

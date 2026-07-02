import type { EmbedServer } from "./types";
import { getAniListIdByMalId } from "./anilist";

export const EMBED_SERVERS: EmbedServer[] = [
  // ── SUB servers ────────────────────────────────────────────────────────────
  {
    key: "aniwatch-sub",
    label: "HiAnime",
    subOrDub: "sub",
    getUrl: () => "", // resolved server-side via aniwatch SDK
  },
  {
    // Player-only iframe embed (loads from the viewer's browser — no Vercel IP block)
    key: "vidnest-sub",
    label: "VidNest",
    subOrDub: "sub",
    // VidNest keys its catalog by AniList ID.
    getUrl: ({ anilistId }, episode) =>
      `https://vidnest.fun/anime/${anilistId}/${episode}/sub`,
  },
  {
    // Senshi is played as an HLS stream in sources/route.ts; this URL is only a
    // last-resort iframe fallback.
    key: "senshi-sub",
    label: "Senshi",
    subOrDub: "sub",
    getUrl: ({ malId }, episode) =>
      `https://senshi.live/watch/${malId}/${episode}`,
  },

  // ── DUB servers ────────────────────────────────────────────────────────────
  {
    key: "aniwatch-dub",
    label: "HiAnime (Dub)",
    subOrDub: "dub",
    getUrl: () => "",
  },
  {
    key: "vidnest-dub",
    label: "VidNest (Dub)",
    subOrDub: "dub",
    getUrl: ({ anilistId }, episode) =>
      `https://vidnest.fun/anime/${anilistId}/${episode}/dub`,
  },
  {
    key: "senshi-dub",
    label: "Senshi (Dub)",
    subOrDub: "dub",
    getUrl: ({ malId }, episode) =>
      `https://senshi.live/watch/${malId}/${episode}?dub=1`,
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

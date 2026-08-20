import dbConnect from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import type { AnimeData } from "@/lib/api/types";

export type MalListStatus = "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";

export interface MalListEntry {
  anime: AnimeData;
  listStatus: MalListStatus;
  malProgress: number;
  userScore: number;
  updatedAt: string;
}

interface MalListNode {
  id: number;
  title: string;
  main_picture?: { medium?: string; large?: string };
  mean?: number;
  media_type?: string;
  status?: string;
  num_episodes?: number;
}

interface MalListApiEntry {
  node: MalListNode;
  list_status: {
    status: MalListStatus;
    num_episodes_watched: number;
    score: number;
    updated_at?: string;
  };
}

function normalizeMalListEntry(entry: MalListApiEntry): MalListEntry {
  const { node, list_status } = entry;
  const imageUrl = node.main_picture?.large || node.main_picture?.medium || "";
  const malStatus = (() => {
    const s = node.status ?? "";
    if (s === "currently_airing") return "ongoing";
    if (s === "finished_airing") return "completed";
    if (s === "not_yet_aired") return "upcoming";
    return s || "unknown";
  })();

  return {
    anime: {
      id: `mal::${node.id}`,
      malId: node.id,
      title: node.title,
      titleJapanese: "",
      titleEnglish: node.title,
      synopsis: "",
      genres: [],
      type: node.media_type ? node.media_type.toUpperCase() : "TV",
      status: malStatus,
      rating: node.mean ?? 0,
      episodes: node.num_episodes ?? 0,
      currentEpisode: list_status.num_episodes_watched ?? 0,
      year: 0,
      season: "",
      studio: "",
      duration: "",
      source: "MyAnimeList",
      imageUrl,
      imageLargeUrl: imageUrl,
      bannerUrl: "",
      tags: [],
      airing: malStatus === "ongoing",
    },
    listStatus: list_status.status,
    malProgress: list_status.num_episodes_watched ?? 0,
    userScore: list_status.score ?? 0,
    updatedAt: list_status.updated_at ?? "",
  };
}

export const MAL_AUTHORIZE_URL = "https://myanimelist.net/v1/oauth2/authorize";
export const MAL_TOKEN_URL = "https://myanimelist.net/v1/oauth2/token";
export const MAL_API_BASE = "https://api.myanimelist.net/v2";

interface MalTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

async function exchangeToken(params: Record<string, string>): Promise<MalTokenResponse> {
  const res = await fetch(MAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("MAL_CLIENT_ID"),
      client_secret: requireEnv("MAL_CLIENT_SECRET"),
      ...params,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MAL token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<MalTokenResponse> {
  return exchangeToken({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: requireEnv("MAL_REDIRECT_URI"),
  });
}

async function refreshMalToken(refreshToken: string): Promise<MalTokenResponse> {
  return exchangeToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

/** Returns a valid access token for the user, refreshing and persisting a new one if the stored token is near expiry. */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return null;

  const bufferMs = 5 * 60 * 1000;
  if (user.malTokenExpiresAt.getTime() - bufferMs > Date.now()) {
    return user.malAccessToken;
  }

  const refreshed = await refreshMalToken(user.malRefreshToken);
  user.malAccessToken = refreshed.access_token;
  user.malRefreshToken = refreshed.refresh_token;
  user.malTokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await user.save();

  return user.malAccessToken;
}

export async function malGet<T = unknown>(userId: string, path: string, params?: Record<string, string>): Promise<T> {
  const token = await getValidAccessToken(userId);
  if (!token) throw new Error("No MAL account connected");

  const url = new URL(`${MAL_API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MAL GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function malPatch<T = unknown>(userId: string, path: string, form: Record<string, string>): Promise<T> {
  const token = await getValidAccessToken(userId);
  if (!token) throw new Error("No MAL account connected");

  const res = await fetch(`${MAL_API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MAL PATCH ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function malDelete(userId: string, path: string): Promise<void> {
  const token = await getValidAccessToken(userId);
  if (!token) throw new Error("No MAL account connected");

  const res = await fetch(`${MAL_API_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  // MAL returns 404 if the title was already off the list — treat that as success.
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`MAL DELETE ${path} failed: ${res.status} ${text}`);
  }
}

export async function getMalAnimeList(userId: string): Promise<MalListEntry[]> {
  const token = await getValidAccessToken(userId);
  if (!token) throw new Error("No MAL account connected");

  const entries: MalListApiEntry[] = [];
  let url: string | null =
    `${MAL_API_BASE}/users/@me/animelist?fields=list_status,num_episodes,mean,media_type,status&limit=100&nsfw=true`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MAL GET animelist failed: ${res.status} ${text}`);
    }
    const json: { data: MalListApiEntry[]; paging?: { next?: string } } = await res.json();
    entries.push(...json.data);
    url = json.paging?.next ?? null;
  }

  return entries.map(normalizeMalListEntry);
}

interface MalMyListStatus {
  status: MalListStatus;
  num_episodes_watched: number;
}

/**
 * Called as the user watches an episode. Marks all episodes strictly before
 * `episode` as watched and, if the title isn't on the list yet (or is still
 * "plan to watch"), flips it to "watching". Never lowers progress or moves
 * status backward — a manual "completed"/"dropped"/"on_hold" choice is never
 * silently overwritten by this automatic call.
 */
export async function trackWatchProgress(
  userId: string,
  malId: number,
  episode: number
): Promise<{ status: MalListStatus; episode: number } | null> {
  const token = await getValidAccessToken(userId);
  if (!token) return null;

  const res = await fetch(`${MAL_API_BASE}/anime/${malId}?fields=my_list_status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json: { my_list_status?: MalMyListStatus } = await res.json();
  const existing = json.my_list_status;

  const watchedBefore = Math.max(0, episode - 1);
  const newEpisodeCount = Math.max(existing?.num_episodes_watched ?? 0, watchedBefore);
  const newStatus: MalListStatus =
    !existing || existing.status === "plan_to_watch" ? "watching" : existing.status;

  const changedEpisode = newEpisodeCount !== (existing?.num_episodes_watched ?? -1);
  const changedStatus = newStatus !== existing?.status;
  if (!changedEpisode && !changedStatus) {
    return { status: newStatus, episode: newEpisodeCount };
  }

  const form: Record<string, string> = { num_watched_episodes: String(newEpisodeCount) };
  if (changedStatus) form.status = newStatus;

  await malPatch(userId, `/anime/${malId}/my_list_status`, form);
  return { status: newStatus, episode: newEpisodeCount };
}

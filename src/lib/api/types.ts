export type AnimeSourceKey = "jikan" | "anilist";

// Unified anime type used across all API sources
export interface AnimeData {
  id: string;
  malId: number;
  anilistId?: number;
  title: string;
  titleJapanese: string;
  titleEnglish: string;
  synopsis: string;
  genres: string[];
  type: string;
  status: string;
  rating: number;
  scored_by?: number;
  members?: number;
  popularity?: number;
  rank?: number;
  episodes: number;
  currentEpisode: number;
  year: number;
  season: string;
  studio: string;
  studios?: string[];
  duration: string;
  source: string;
  imageUrl: string;
  imageLargeUrl: string;
  bannerUrl: string;
  trailerUrl?: string;
  trailerEmbedUrl?: string;
  tags: string[];
  airing: boolean;
  hasSub?: boolean;
  hasDub?: boolean;
  aired?: {
    from: string;
    to: string;
  };
}

export interface AnimeEpisode {
  id: string;
  malId: number;
  number: number;
  title: string;
  titleJapanese?: string;
  aired?: string;
  filler: boolean;
  recap: boolean;
  imageUrl?: string;
}

export interface AnimeCharacter {
  malId: number;
  name: string;
  imageUrl: string;
  role: string;
  voiceActors: {
    name: string;
    language: string;
    imageUrl: string;
  }[];
}

export interface SearchFilters {
  q?: string;
  genres?: string;
  type?: string;
  status?: string;
  rating?: string;
  orderBy?: string;
  sort?: string;
  page?: number;
  limit?: number;
  minScore?: number;
  maxScore?: number;
  sfw?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    lastVisiblePage: number;
    hasNextPage: boolean;
    currentPage: number;
    totalItems: number;
  };
}

export interface ScheduleDay {
  day: string;
  anime: AnimeData[];
}

// IDs a streaming provider may need. Providers differ: some key their catalog
// by MyAnimeList ID, others (e.g. VidNest) by AniList ID.
export interface EmbedIds {
  malId: number;
  anilistId: number;
}

// Embed streaming server definition
export interface EmbedServer {
  key: string;
  label: string;
  subOrDub: "sub" | "dub";
  getUrl: (ids: EmbedIds, episode: number) => string;
}

// AniList specific types
export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  coverImage: {
    large: string;
    extraLarge: string;
  };
  bannerImage: string | null;
  averageScore: number | null;
  popularity: number;
  episodes: number | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
  genres: string[];
  studios: {
    nodes: { name: string }[];
  };
  format: string;
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
}

// MangaDex types
export interface MangaData {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  status: string;
  year: number | null;
  tags: string[];
  coverUrl: string;
  contentRating: string;
  author: string;
  artist: string;
}

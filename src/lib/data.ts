export type AnimeStatus = 'ongoing' | 'completed' | 'upcoming';
export type AnimeType = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special';
export type AnimeSeason = 'Winter' | 'Spring' | 'Summer' | 'Fall';

export interface Episode {
  id: number;
  number: number;
  title: string;
  duration: string;
  thumbnail: string;
  airDate: string;
}

export interface Anime {
  id: string;
  title: string;
  titleJapanese: string;
  synopsis: string;
  genres: string[];
  type: AnimeType;
  status: AnimeStatus;
  rating: number;
  episodes: number;
  currentEpisode: number;
  year: number;
  season: AnimeSeason;
  studio: string;
  duration: string;
  poster: string;
  banner: string;
  trailer?: string;
  tags: string[];
  episodeList?: Episode[];
}

// Gradient-based poster colors for placeholder cards
export const ANIME_COLORS: Record<string, string> = {
  'action': 'linear-gradient(135deg, #e63946, #9d0208)',
  'adventure': 'linear-gradient(135deg, #f4a261, #e76f51)',
  'fantasy': 'linear-gradient(135deg, #7c3aed, #4c1d95)',
  'romance': 'linear-gradient(135deg, #f472b6, #9d174d)',
  'isekai': 'linear-gradient(135deg, #06b6d4, #0e7490)',
  'shounen': 'linear-gradient(135deg, #f59e0b, #b45309)',
  'seinen': 'linear-gradient(135deg, #6366f1, #3730a3)',
  'horror': 'linear-gradient(135deg, #1a1a2e, #e63946)',
  'comedy': 'linear-gradient(135deg, #10b981, #059669)',
  'mecha': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
};

export const MOCK_ANIME: Anime[] = [
  {
    id: 'attack-on-titan',
    title: 'Attack on Titan',
    titleJapanese: 'Shingeki no Kyojin',
    synopsis: 'In a world where humanity lives within enormous walled cities to protect themselves from Titans, gigantic humanoid creatures who devour humans seemingly without reason, a young boy named Eren Yeager vows to exterminate them after a Titan shatters the wall of his hometown and kills his mother.',
    genres: ['Action', 'Drama', 'Fantasy', 'Military'],
    type: 'TV',
    status: 'completed',
    rating: 9.1,
    episodes: 87,
    currentEpisode: 87,
    year: 2013,
    season: 'Spring',
    studio: 'MAPPA',
    duration: '24 min',
    poster: 'attack-on-titan',
    banner: 'attack-on-titan',
    tags: ['Dark', 'Gore', 'Psychological', 'Epic'],
    episodeList: Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      title: `Episode ${i + 1}`,
      duration: '24 min',
      thumbnail: '',
      airDate: '2013',
    })),
  },
  {
    id: 'demon-slayer',
    title: 'Demon Slayer',
    titleJapanese: 'Kimetsu no Yaiba',
    synopsis: 'A young boy becomes a demon slayer after his family is slaughtered and his sister is turned into a demon. Set in Taisho-era Japan, Tanjiro Kamado embarks on a journey to find a cure for his sister while battling terrifying demons.',
    genres: ['Action', 'Fantasy', 'Shounen'],
    type: 'TV',
    status: 'ongoing',
    rating: 8.7,
    episodes: 44,
    currentEpisode: 44,
    year: 2019,
    season: 'Spring',
    studio: 'ufotable',
    duration: '23 min',
    poster: 'demon-slayer',
    banner: 'demon-slayer',
    tags: ['Swords', 'Family', 'Demons', 'Historical'],
  },
  {
    id: 'jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    titleJapanese: 'Jujutsu Kaisen',
    synopsis: 'A high school student joins a secret organization of Jujutsu Sorcerers to eliminate a powerful Curse named Ryomen Sukuna, of whom Itadori has become the host.',
    genres: ['Action', 'Fantasy', 'Shounen', 'Supernatural'],
    type: 'TV',
    status: 'ongoing',
    rating: 8.6,
    episodes: 47,
    currentEpisode: 47,
    year: 2020,
    season: 'Fall',
    studio: 'MAPPA',
    duration: '23 min',
    poster: 'jujutsu-kaisen',
    banner: 'jujutsu-kaisen',
    tags: ['Curses', 'Dark', 'School', 'Supernatural'],
  },
  {
    id: 'one-piece',
    title: 'One Piece',
    titleJapanese: 'One Piece',
    synopsis: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger. The famous mystery treasure named "One Piece".',
    genres: ['Action', 'Adventure', 'Comedy', 'Fantasy'],
    type: 'TV',
    status: 'ongoing',
    rating: 9.0,
    episodes: 1100,
    currentEpisode: 1100,
    year: 1999,
    season: 'Fall',
    studio: 'Toei Animation',
    duration: '24 min',
    poster: 'one-piece',
    banner: 'one-piece',
    tags: ['Pirates', 'Adventure', 'Long-running', 'Epic'],
  },
  {
    id: 'fullmetal-alchemist',
    title: 'Fullmetal Alchemist: Brotherhood',
    titleJapanese: 'Hagane no Renkinjutsushi: FULLMETAL ALCHEMIST',
    synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong, leaving them in damaged physical forms.',
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
    type: 'TV',
    status: 'completed',
    rating: 9.2,
    episodes: 64,
    currentEpisode: 64,
    year: 2009,
    season: 'Spring',
    studio: 'Bones',
    duration: '24 min',
    poster: 'fullmetal',
    banner: 'fullmetal',
    tags: ['Alchemy', 'Brothers', 'War', 'Philosophical'],
  },
  {
    id: 'death-note',
    title: 'Death Note',
    titleJapanese: 'Death Note',
    synopsis: 'A high school student discovers a supernatural notebook that can kill anyone whose name is written in it, and decides to use it to rid the world of criminals.',
    genres: ['Mystery', 'Psychological', 'Thriller', 'Supernatural'],
    type: 'TV',
    status: 'completed',
    rating: 9.0,
    episodes: 37,
    currentEpisode: 37,
    year: 2006,
    season: 'Fall',
    studio: 'Madhouse',
    duration: '23 min',
    poster: 'death-note',
    banner: 'death-note',
    tags: ['Psychological', 'Crime', 'Thriller', 'Dark'],
  },
  {
    id: 'my-hero-academia',
    title: 'My Hero Academia',
    titleJapanese: 'Boku no Hero Academia',
    synopsis: 'In a world where most of the population has superpowers, a boy born without any enrolls in a prestigious hero school after the greatest hero passes his powers on to him.',
    genres: ['Action', 'Comedy', 'School', 'Shounen'],
    type: 'TV',
    status: 'completed',
    rating: 8.0,
    episodes: 138,
    currentEpisode: 138,
    year: 2016,
    season: 'Spring',
    studio: 'Bones',
    duration: '23 min',
    poster: 'mha',
    banner: 'mha',
    tags: ['Superheroes', 'School', 'Action', 'Power'],
  },
  {
    id: 'naruto',
    title: 'Naruto: Shippuden',
    titleJapanese: 'Naruto: Shippuuden',
    synopsis: 'Naruto Uzumaki, a mischievous adolescent ninja, struggles as he searches for recognition and dreams of becoming the Hokage, the village\'s leader and strongest ninja.',
    genres: ['Action', 'Adventure', 'Fantasy', 'Shounen'],
    type: 'TV',
    status: 'completed',
    rating: 8.7,
    episodes: 500,
    currentEpisode: 500,
    year: 2007,
    season: 'Winter',
    studio: 'Pierrot',
    duration: '23 min',
    poster: 'naruto',
    banner: 'naruto',
    tags: ['Ninja', 'Friendship', 'Epic', 'Classic'],
  },
  {
    id: 'steins-gate',
    title: 'Steins;Gate',
    titleJapanese: 'Steins;Gate',
    synopsis: 'A group of friends accidentally invent a device capable of sending text messages to the past and must navigate the consequences of altering history.',
    genres: ['Drama', 'Mystery', 'Psychological', 'Sci-Fi'],
    type: 'TV',
    status: 'completed',
    rating: 9.1,
    episodes: 24,
    currentEpisode: 24,
    year: 2011,
    season: 'Spring',
    studio: 'White Fox',
    duration: '24 min',
    poster: 'steins-gate',
    banner: 'steins-gate',
    tags: ['Time Travel', 'Science', 'Thriller', 'Romance'],
  },
  {
    id: 're-zero',
    title: 'Re:ZERO − Starting Life in Another World',
    titleJapanese: 'Re:Zero kara Hajimeru Isekai Seikatsu',
    synopsis: 'Suddenly transported to another world, Subaru Natsuki discovers he has the ability to return to a specific point in time upon death, forcing him to relive events again and again.',
    genres: ['Drama', 'Fantasy', 'Isekai', 'Psychological'],
    type: 'TV',
    status: 'ongoing',
    rating: 8.4,
    episodes: 50,
    currentEpisode: 50,
    year: 2016,
    season: 'Spring',
    studio: 'White Fox',
    duration: '23 min',
    poster: 're-zero',
    banner: 're-zero',
    tags: ['Isekai', 'Dark', 'Time Loop', 'Romance'],
  },
  {
    id: 'vinland-saga',
    title: 'Vinland Saga',
    titleJapanese: 'Vinland Saga',
    synopsis: 'A young Viking warrior seeks revenge against the man who killed his father while being drawn into the political intrigue of 11th century Europe.',
    genres: ['Action', 'Adventure', 'Drama', 'Historical'],
    type: 'TV',
    status: 'completed',
    rating: 8.8,
    episodes: 48,
    currentEpisode: 48,
    year: 2019,
    season: 'Summer',
    studio: 'MAPPA',
    duration: '24 min',
    poster: 'vinland-saga',
    banner: 'vinland-saga',
    tags: ['Vikings', 'Historical', 'Mature', 'Epic'],
  },
  {
    id: 'spy-x-family',
    title: 'Spy x Family',
    titleJapanese: 'Spy x Family',
    synopsis: 'A spy on a mission must create a fake family to complete his assignment. He adopts a girl with telepathic powers and marries an assassin, though neither reveals their true identities.',
    genres: ['Action', 'Comedy', 'Romance', 'School'],
    type: 'TV',
    status: 'ongoing',
    rating: 8.7,
    episodes: 37,
    currentEpisode: 37,
    year: 2022,
    season: 'Spring',
    studio: 'Wit Studio / CloverWorks',
    duration: '24 min',
    poster: 'spy-family',
    banner: 'spy-family',
    tags: ['Family', 'Comedy', 'Spy', 'Heartwarming'],
  },
];

export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Historical',
  'Horror', 'Isekai', 'Mecha', 'Military', 'Mystery', 'Psychological',
  'Romance', 'Samurai', 'School', 'Sci-Fi', 'Seinen', 'Shounen',
  'Slice of Life', 'Sports', 'Super Power', 'Supernatural', 'Thriller',
];

export const FEATURED_ANIME = MOCK_ANIME[0]; // Attack on Titan as hero

export const TRENDING = MOCK_ANIME.slice(0, 8);
export const NEW_RELEASES = [...MOCK_ANIME].sort(() => Math.random() - 0.5).slice(0, 8);
export const TOP_RATED = [...MOCK_ANIME].sort((a, b) => b.rating - a.rating).slice(0, 8);
export const ONGOING = MOCK_ANIME.filter(a => a.status === 'ongoing');
export const COMPLETED = MOCK_ANIME.filter(a => a.status === 'completed');

// Gradient map for anime cards (cycles through colors by index)
export const CARD_GRADIENTS = [
  'linear-gradient(135deg, #7c3aed 0%, #1e1b4b 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0c4a6e 100%)',
  'linear-gradient(135deg, #e63946 0%, #450a0a 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #451a03 100%)',
  'linear-gradient(135deg, #10b981 0%, #022c22 100%)',
  'linear-gradient(135deg, #f472b6 0%, #500724 100%)',
  'linear-gradient(135deg, #6366f1 0%, #1e1b4b 100%)',
  'linear-gradient(135deg, #a855f7 0%, #2e1065 100%)',
  'linear-gradient(135deg, #ef4444 0%, #450a0a 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1e3a5f 100%)',
  'linear-gradient(135deg, #ec4899 0%, #500724 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #042f2e 100%)',
];

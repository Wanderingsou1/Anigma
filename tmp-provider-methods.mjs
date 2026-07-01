import HianimeModule from '@consumet/extensions/dist/providers/anime/hianime.js';
import AnimeKaiModule from '@consumet/extensions/dist/providers/anime/animekai.js';
import AnimePaheModule from '@consumet/extensions/dist/providers/anime/animepahe.js';
import KickAssAnimeModule from '@consumet/extensions/dist/providers/anime/kickassanime.js';
import AnimeSaturnModule from '@consumet/extensions/dist/providers/anime/animesaturn.js';
const Hianime = HianimeModule.default ?? HianimeModule;
const AnimeKai = AnimeKaiModule.default ?? AnimeKaiModule;
const AnimePahe = AnimePaheModule.default ?? AnimePaheModule;
const KickAssAnime = KickAssAnimeModule.default ?? KickAssAnimeModule;
const AnimeSaturn = AnimeSaturnModule.default ?? AnimeSaturnModule;
const providers = {
  hianime: new Hianime(),
  animekai: new AnimeKai(),
  animepahe: new AnimePahe(),
  kickassanime: new KickAssAnime(),
  animesaturn: new AnimeSaturn(),
};
for (const [name, client] of Object.entries(providers)) {
  for (const [method, fn] of [
    ['fetchTopAiring', () => client.fetchTopAiring?.(1)],
    ['fetchMostPopular', () => client.fetchMostPopular?.(1)],
    ['fetchMostFavorite', () => client.fetchMostFavorite?.(1)],
    ['fetchLatestCompleted', () => client.fetchLatestCompleted?.(1)],
    ['fetchRecentlyUpdated', () => client.fetchRecentlyUpdated?.(1)],
    ['fetchRecentlyAdded', () => client.fetchRecentlyAdded?.(1)],
    ['fetchTopUpcoming', () => client.fetchTopUpcoming?.(1)],
  ]) {
    try {
      const r = await fn();
      console.log(name, method, JSON.stringify({ results: r?.results?.length ?? 0, total: r?.totalResults ?? 0 }, null, 2));
    } catch (e) {
      console.log(name, method, 'ERR', e?.message || String(e));
    }
  }
}

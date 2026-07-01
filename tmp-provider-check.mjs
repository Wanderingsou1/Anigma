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
  try {
    const search = await client.search?.('one piece', 1);
    console.log(name, 'search', JSON.stringify({ results: search?.results?.length ?? 0, totalResults: search?.totalResults ?? 0 }, null, 2));
  } catch (e) {
    console.log(name, 'search ERR', e?.message || String(e));
  }
  try {
    const top = await client.fetchTopAiring?.(1);
    console.log(name, 'top', JSON.stringify({ results: top?.results?.length ?? 0 }, null, 2));
  } catch (e) {
    console.log(name, 'top ERR', e?.message || String(e));
  }
}

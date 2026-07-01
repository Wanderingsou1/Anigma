import HianimeModule from '@consumet/extensions/dist/providers/anime/hianime.js';
const H = HianimeModule.default ?? HianimeModule;
const h = new H();
const tests = [
  ['search', () => h.search('one piece', 1)],
  ['topAiring', () => h.fetchTopAiring(1)],
  ['mostPopular', () => h.fetchMostPopular(1)],
  ['genre', () => h.genreSearch('action', 1)],
];
for (const [name, fn] of tests) {
  try {
    const r = await fn();
    console.log(name, JSON.stringify({ results: r.results?.length ?? 0, hasNextPage: r.hasNextPage ?? false, totalResults: r.totalResults ?? 0, first: r.results?.[0] ?? null }, null, 2));
  } catch (e) {
    console.log(name, 'ERR', e?.message || String(e));
  }
}

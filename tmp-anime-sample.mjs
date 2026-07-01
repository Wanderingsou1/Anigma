import AnimeSaturnModule from '@consumet/extensions/dist/providers/anime/animesaturn.js';
const AnimeSaturn = AnimeSaturnModule.default ?? AnimeSaturnModule;
const client = new AnimeSaturn();
const r = await client.search('one piece', 1);
console.log('results', r.results?.length ?? 0);
console.log(JSON.stringify(r.results?.[0], null, 2));

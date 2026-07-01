import AnimeSaturnModule from '@consumet/extensions/dist/providers/anime/animesaturn.js';
const AnimeSaturn = AnimeSaturnModule.default ?? AnimeSaturnModule;
const client = new AnimeSaturn();
const r = await client.search('one piece', 1);
console.log(JSON.stringify(r.results?.slice(0, 5), null, 2));

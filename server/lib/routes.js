import neo4j from './model/DAL/neo4j';

export var routes = [
  {
    method: 'GET',
    path: '/api/test',
    handler: (_, reply) => {
      console.log('here');
      let song = {
        type: 'Song',
        name: 'Test',
        durationMs: 500,
        number: 1,
        popularity: 50,
      };
      let album = {
        type: 'Album',
        name: 'Test',
        year: 2014,
        popularity: 50,
      };
      let artist = {
        type: 'Artist',
        name: 'Test',
        popularity: 50,
      };
      let playlist = {
        type: 'Playlist',
        name: 'Test',
      };
      neo4j.create([
        song, album, artist, playlist
      ], [
        {start: song, end: album, label: 'Album'},
        {start: album, end: artist, label: 'Artist'},
        {start: playlist, end: song, label: 'Song'},
      ]).then(() => reply('saved')).catch(err => {throw err;});
    },
  },
  {
    method: 'POST',
    path: '/api/area',
    handler: (request, reply) =>
      updateArea(request.payload.name, request.payload.longitude, request.payload.latitude)
        .then(() => reply('saved')),
  },
];

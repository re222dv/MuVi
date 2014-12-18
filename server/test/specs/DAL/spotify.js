/* jshint -W030 */
let chai = require('chai');
let mockery = require('mockery');
let Rx = require('rx');
let sinon = require('sinon');

let expect = chai.expect;
chai.use(require('sinon-chai'));

describe('Spotify DAL', () => {
  let spotify, countCall;
  let token = {};

  beforeEach(() => {
    countCall = sinon.spy();
    mockery.registerMock('../../services/oauth_request.js', (_token, method, url) => {
      expect(_token).to.equal(token);
      expect(method).to.equal('GET');

      if (url === 'https://api.spotify.com/v1/me') return Rx.Observable.of(`{
        "country": "SE",
        "display_name": "JM Wizzler",
        "email": "email@example.com",
        "external_urls": {
          "spotify": "https://open.spotify.com/user/wizzler"
        },
        "followers" : {
          "href" : null,
          "total" : 3829
        },
        "href": "https://api.spotify.com/v1/users/wizzler",
        "id": "wizzler",
        "images": [
          {
            "height": null,
            "url": "https://akamaihd.net/1970403_10152215092574354_1798272330_n.jpg",
            "width": null
          }
        ],
        "product": "premium",
        "type": "user",
        "uri": "spotify:user:wizzler"
      }`);

      if (url === 'https://api.spotify.com/v1/users/wizzler/playlists') return Rx.Observable.of(`{
        "href": "https://api.spotify.com/v1/users/wizzler/playlists",
        "items": [ {
          "collaborative": false,
          "external_urls": {
            "spotify": "http://open.spotify.com/user/wizzler/playlists/53Y8wT46QIMz5H4WQ8O22c"
          },
          "href": "https://api.spotify.com/v1/users/wizzler/playlists/53Y8wT46QIMz5H4WQ8O22c",
          "id": "53Y8wT46QIMz5H4WQ8O22c",
          "images" : [ ],
          "name": "Wizzlers Big Playlist",
          "owner": {
            "external_urls": {
              "spotify": "http://open.spotify.com/user/wizzler"
            },
            "href": "https://api.spotify.com/v1/users/wizzler",
            "id": "wizzler",
            "type": "user",
            "uri": "spotify:user:wizzler"
          },
          "public": true,
          "tracks": {
            "href": "https://api.spotify.com/v1/users/wizzler/playlists/53Y8wT46QIMz5H4WQ8O22c/tracks",
            "total": 30
          },
          "type": "playlist",
          "uri": "spotify:user:wizzler:playlist:53Y8wT46QIMz5H4WQ8O22c"
        }, {
          "collaborative": false,
          "external_urls": {
            "spotify": "http://open.spotify.com/user/wizzlersmate/playlists/1AVZz0mBuGbCEoNRQdYQju"
          },
          "href": "https://api.spotify.com/v1/users/wizzlersmate/playlists/1AVZz0mBuGbCEoNRQdYQju",
          "id": "1AVZz0mBuGbCEoNRQdYQju",
          "images" : [ ],
          "name": "Another Playlist",
          "owner": {
            "external_urls": {
              "spotify": "http://open.spotify.com/user/wizzlersmate"
            },
            "href": "https://api.spotify.com/v1/users/wizzlersmate",
            "id": "wizzlersmate",
            "type": "user",
            "uri": "spotify:user:wizzlersmate"
          },
          "public": true,
          "tracks": {
            "href": "https://api.spotify.com/v1/users/wizzlersmate/playlists/1AVZz0mBuGbCEoNRQdYQju/tracks",
            "total": 58
          },
          "type": "playlist",
          "uri": "spotify:user:wizzlersmate:playlist:1AVZz0mBuGbCEoNRQdYQju"
        } ],
        "limit": 9,
        "next": null,
        "offset": 0,
        "previous": null,
        "total": 9
      }`);

      if (url === 'https://api.spotify.com/v1/users/spotify_espa%C3%B1a/playlists/21THa8j9TaSGuXYNBU5tsC/tracks')
        return Rx.Observable.of(`{
        "href" : "https://api.spotify.com/v1/users/spotify_espa%C3%B1a/playlists/21THa8j9TaSGuXYNBU5tsC/tracks",
        "items" : [ {
          "added_at" : "2014-08-18T20:16:08Z",
          "added_by" : {
            "external_urls" : {
              "spotify" : "http://open.spotify.com/user/spotify_espa%C3%B1a"
            },
            "href" : "https://api.spotify.com/v1/users/spotify_espa%C3%B1a",
            "id" : "spotify_españa",
            "type" : "user",
            "uri" : "spotify:user:spotify_espa%C3%B1a"
          },
          "track" : {
            "album" : {
              "album_type" : "single",
              "available_markets" : [ "AD", "AR", "AT", "AU", "BE", "BG", "BO", "BR", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "EC", "EE", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "PA", "PE", "PH", "PL", "PT", "PY", "RO", "SE", "SG", "SI", "SK", "SV", "TR", "TW", "US", "UY" ],
              "external_urls" : {
                "spotify" : "https://open.spotify.com/album/53fWaWYPGghRHppKdD7A2S"
              },
              "href" : "https://api.spotify.com/v1/albums/53fWaWYPGghRHppKdD7A2S",
              "id" : "53fWaWYPGghRHppKdD7A2S",
              "images" : [ {
                "height" : 640,
                "url" : "https://i.scdn.co/image/c06e5283ea7e430eeabef6215aa8ca58c9e05a3f",
                "width" : 640
              }, {
                "height" : 300,
                "url" : "https://i.scdn.co/image/34311df6e7baf6abb2b0326cd0a83e0c20df3a67",
                "width" : 300
              }, {
                "height" : 64,
                "url" : "https://i.scdn.co/image/9cb03d83dd72f14ce8fca8a416d47a500e5b91f8",
                "width" : 64
              } ],
              "name" : "El Taxi (feat. Pitbull, Sensato)",
              "type" : "album",
              "uri" : "spotify:album:53fWaWYPGghRHppKdD7A2S"
            },
            "artists" : [ {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/artist/6W0XSFVBD0xJlJhahPSlKZ"
              },
              "href" : "https://api.spotify.com/v1/artists/6W0XSFVBD0xJlJhahPSlKZ",
              "id" : "6W0XSFVBD0xJlJhahPSlKZ",
              "name" : "Osmani Garcia",
              "type" : "artist",
              "uri" : "spotify:artist:6W0XSFVBD0xJlJhahPSlKZ"
            }, {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg"
              },
              "href" : "https://api.spotify.com/v1/artists/0TnOYISbd1XYRBk9myaseg",
              "id" : "0TnOYISbd1XYRBk9myaseg",
              "name" : "Pitbull",
              "type" : "artist",
              "uri" : "spotify:artist:0TnOYISbd1XYRBk9myaseg"
            }, {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/artist/7iJrDbKM5fEkGdm5kpjFzS"
              },
              "href" : "https://api.spotify.com/v1/artists/7iJrDbKM5fEkGdm5kpjFzS",
              "id" : "7iJrDbKM5fEkGdm5kpjFzS",
              "name" : "Sensato",
              "type" : "artist",
              "uri" : "spotify:artist:7iJrDbKM5fEkGdm5kpjFzS"
            } ],
            "available_markets" : [ "AD", "AR", "AT", "AU", "BE", "BG", "BO", "BR", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "EC", "EE", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "PA", "PE", "PH", "PL", "PT", "PY", "RO", "SE", "SG", "SI", "SK", "SV", "TR", "TW", "US", "UY" ],
            "disc_number" : 1,
            "duration_ms" : 324440,
            "explicit" : false,
            "external_ids" : {
              "isrc" : "CH9181400018"
            },
            "external_urls" : {
              "spotify" : "https://open.spotify.com/track/1qpbJ8GiPc706AfGqZAIei"
            },
            "href" : "https://api.spotify.com/v1/tracks/1qpbJ8GiPc706AfGqZAIei",
            "id" : "1qpbJ8GiPc706AfGqZAIei",
            "name" : "El Taxi",
            "popularity" : 69,
            "preview_url" : "https://p.scdn.co/mp3-preview/e5dddaabe2c026bceae32e2cd2139ced0445879e",
            "track_number" : 1,
            "type" : "track",
            "uri" : "spotify:track:1qpbJ8GiPc706AfGqZAIei"
          }
        } ],
        "limit" : 100,
        "next" : null,
        "offset" : 0,
        "previous" : null,
        "total" : 58
      }`);

      console.log(url);
      throw 'unknown url';
    });

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
    });

    spotify = require('../../../lib/model/DAL/spotify.js');
  });

  afterEach(mockery.disable);

  it('should be able to get the user', (done) =>
    spotify.getUser(token)
      .doOnNext(countCall)
      .doOnNext(user =>
        expect(user).to.deep.equal({
          user: {
            type: 'User',
            name: 'JM Wizzler',
          },
          spotifyEntity: {
            type: 'SpotifyEntity',
            spotifyId: 'wizzler',
            spotifyType: 'user',
          },
        })
      )
      .subscribeOnCompleted(() => {
        expect(countCall).to.have.been.called.once;
        done();
      })
  );

  it('should be able to get playlists from a user', (done) =>
      spotify.getPlaylists(token, 'wizzler')
        .doOnNext(countCall)
        .doOnNext(playlists =>
          expect(playlists).to.deep.equal([
            {
              playlist: {
                type: 'Playlist',
                name: 'Wizzlers Big Playlist',
              },
              spotifyEntity: {
                type: 'SpotifyEntity',
                spotifyId: '53Y8wT46QIMz5H4WQ8O22c',
                spotifyType: 'playlist',
              },
            }, {
              playlist: {
                type: 'Playlist',
                name: 'Another Playlist',
              },
              spotifyEntity: {
                type: 'SpotifyEntity',
                spotifyId: '1AVZz0mBuGbCEoNRQdYQju',
                spotifyType: 'playlist',
              },
            }
          ])
        )
        .subscribeOnCompleted(() => {
          expect(countCall).to.have.been.called.once;
          done();
        })
  );

  it('should be able to get song data from a playlist', (done) =>
      spotify.getPlaylist(token, 'https://api.spotify.com/v1/users/spotify_espa%C3%B1a/playlists/21THa8j9TaSGuXYNBU5tsC/tracks')
        .doOnNext(countCall)
        .doOnNext(data =>
          expect(data).to.deep.equal({
            entities: [{
              type: 'Song',
              name: 'El Taxi',
              durationMs: 324440,
              number: 1,
              popularity: 69,
            }, {
              type: 'SpotifyEntity',
              spotifyId: '1qpbJ8GiPc706AfGqZAIei',
              spotifyType: 'track',
            }, {
              type: 'Album',
              name: 'El Taxi (feat. Pitbull, Sensato)',
              albumType: 'single',
            }, {
              type: 'SpotifyEntity',
              spotifyId: '53fWaWYPGghRHppKdD7A2S',
              spotifyType: 'album',
            }, {
              type: 'Artist',
              name: 'Osmani Garcia',
            }, {
              type: 'SpotifyEntity',
              spotifyId: '6W0XSFVBD0xJlJhahPSlKZ',
              spotifyType: 'artist',
            }, {
              type: 'Artist',
              name: 'Pitbull',
            }, {
              type: 'SpotifyEntity',
              spotifyId: '0TnOYISbd1XYRBk9myaseg',
              spotifyType: 'artist',
            }, {
              type: 'Artist',
              name: 'Sensato',
            }, {
              type: 'SpotifyEntity',
              spotifyId: '7iJrDbKM5fEkGdm5kpjFzS',
              spotifyType: 'artist',
            }],
            relations: [
              {
                start: {
                  type: 'Song',
                  name: 'El Taxi',
                  durationMs: 324440,
                  number: 1,
                  popularity: 69,
                },
                end: {
                  type: 'SpotifyEntity',
                  spotifyId: '1qpbJ8GiPc706AfGqZAIei',
                  spotifyType: 'track',
                },
              }, {
                start: {
                  type: 'Song',
                  name: 'El Taxi',
                  durationMs: 324440,
                  number: 1,
                  popularity: 69,
                },
                end: {
                  type: 'Album',
                  name: 'El Taxi (feat. Pitbull, Sensato)',
                  albumType: 'single',
                },
              }, {
                start: {
                  type: 'Album',
                  name: 'El Taxi (feat. Pitbull, Sensato)',
                  albumType: 'single',
                },
                end: {
                  type: 'SpotifyEntity',
                  spotifyId: '53fWaWYPGghRHppKdD7A2S',
                  spotifyType: 'album',
                },
              }, {
                start: {
                  type: 'Song',
                  name: 'El Taxi',
                  durationMs: 324440,
                  number: 1,
                  popularity: 69,
                },
                end: {
                  type: 'Artist',
                  name: 'Osmani Garcia',
                },
              }, {
                start: {
                  type: 'Artist',
                  name: 'Osmani Garcia',
                },
                end: {
                  type: 'SpotifyEntity',
                  spotifyId: '6W0XSFVBD0xJlJhahPSlKZ',
                  spotifyType: 'artist',
                },
              }, {
                start: {
                  type: 'Song',
                  name: 'El Taxi',
                  durationMs: 324440,
                  number: 1,
                  popularity: 69,
                },
                end: {
                  type: 'Artist',
                  name: 'Pitbull',
                },
              }, {
                start: {
                  type: 'Artist',
                  name: 'Pitbull',
                },
                end: {
                  type: 'SpotifyEntity',
                  spotifyId: '0TnOYISbd1XYRBk9myaseg',
                  spotifyType: 'artist',
                },
              }, {
                start: {
                  type: 'Song',
                  name: 'El Taxi',
                  durationMs: 324440,
                  number: 1,
                  popularity: 69,
                },
                end: {
                  type: 'Artist',
                  name: 'Sensato',
                },
              }, {
                start: {
                  type: 'Artist',
                  name: 'Sensato',
                },
                end: {
                  type: 'SpotifyEntity',
                  spotifyId: '7iJrDbKM5fEkGdm5kpjFzS',
                  spotifyType: 'artist',
                },
              },
            ]})
      )
        .subscribeOnCompleted(() => {
          expect(countCall).to.have.been.called.once;
          done();
        })
  );
});

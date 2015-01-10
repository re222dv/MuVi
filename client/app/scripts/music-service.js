(function (Rx) {
  'use strict';

  const TEN_MINUTES = 1000 * 60 * 10;

  let working = {};

  window.MusicService = {
    getPlaylist: (playlistId) => window.MusicService._cachedRequest(`/api/playlists/${playlistId}`),
    getPlaylists: () => window.MusicService._cachedRequest('/api/playlists'),
    _cachedRequest: function (url) {
      let subject = new Rx.ReplaySubject(1); // Buffer at most one response
      let cache = JSON.parse(localStorage.getItem(url));

      if (!cache || Date.now() - cache.timestamp > TEN_MINUTES) {

        if (!working[url]) {
          working[url] = new Rx.Subject();
          Rx.DOM.getJSON(url)
            .subscribe((data) => {
              localStorage.setItem(url, JSON.stringify({timestamp: Date.now(), data}));
              working[url].onNext(data);
            }, (e) => {
              if (e.status === 401) {
                window.location = '/login.html';
              }
              working[url].onError(e);
              delete working[url];
            }, () => {
              working[url].onCompleted();
              working[url].dispose();
              delete working[url];
            });
        }

        working[url].subscribe(data => {
          subject.onNext(data);
        }, (e) => {
          if (!cache) {
            subject.onError(e);
          }
        }, () => {
          subject.onCompleted();
          subject.dispose();
        });
      }

      if (cache) {
        subject.onNext(cache.data);
      }

      return subject.asObservable();
    }
  };
})(Rx);

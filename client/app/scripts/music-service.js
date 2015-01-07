(function (Rx) {
  'use strict';

  const TEN_HOURS = 1000 * 60 * 60;

  let working = {};

  window.MusicService = {
    getPlaylist: (playlistId) => window.MusicService._cachedRequest(`/api/playlists/${playlistId}`),
    getPlaylists: () => window.MusicService._cachedRequest('/api/playlists'),
    _cachedRequest: function (url) {
      let cache = JSON.parse(localStorage.getItem(url));

      if (!cache || Date.now() - cache.timestamp > TEN_HOURS) {
        let subject = new Rx.Subject();

        if (!working[url]) {
          working[url] = new Rx.Subject();
          Rx.DOM.getJSON(url)
            .subscribe((data) => {
              localStorage.setItem(url, JSON.stringify({timestamp: Date.now(), data}));
              working[url].onNext(data);
            }, () => {
              working[url].onError();
              delete working[url];
            }, () => {
              working[url].onCompleted();
              working[url].dispose();
              delete working[url];
            });
        }

        working[url].subscribe(data => {
          subject.onNext(data);
        }, () => {
          subject.onNext(cache.data);
        }, () => {
          subject.onCompleted();
          subject.dispose();
        });

        return subject.asObservable();
      }

      return Rx.Observable.return(cache.data);
    }
  };
})(Rx);

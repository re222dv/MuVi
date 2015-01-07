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
          working[url] = Rx.DOM.getJSON(url).asObservable();
          working[url].subscribe((data) => {
            localStorage.setItem(url, JSON.stringify({timestamp: Date.now(), data}));
          }, null, () => {delete working[url];});
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

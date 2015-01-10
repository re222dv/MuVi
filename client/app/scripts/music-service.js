(function (Rx) {
  'use strict';

  const TEN_MINUTES = 1000 * 60 * 10;

  let working = {};

  let request = (url, wait) => {
    let requestAgain = false;

    Rx.DOM.get(wait ? `${url}?wait` : url)
      .subscribe((xhr) => {
          let data = JSON.parse(xhr.responseText);
          localStorage.setItem(url, JSON.stringify({timestamp: Date.now(), data}));
          working[url].onNext(data);

          console.log('header', xhr.getResponseHeader('x-updating'));

          if (xhr.getResponseHeader('x-updating')) {
            requestAgain = true;
          }
        }, (e) => {
          if (e.status === 401) {
            window.location = '/login.html';
          }
          working[url].onError(e);
          delete working[url];
        }, () => {
          if (requestAgain) {
            console.log('requestAgain');
            request(url, true);
          } else {
            working[url].onCompleted();
            working[url].dispose();
            delete working[url];
          }
        });
  }

  window.MusicService = {
    getPlaylist: (playlistId) => window.MusicService._cachedRequest(`/api/playlists/${playlistId}`),
    getPlaylists: () => window.MusicService._cachedRequest('/api/playlists'),
    _cachedRequest: function (url) {
      let subject = new Rx.ReplaySubject(1); // Buffer at most one response
      let cache = JSON.parse(localStorage.getItem(url));

      if (!cache || Date.now() - cache.timestamp > TEN_MINUTES) {

        if (!working[url]) {
          working[url] = new Rx.Subject();
          request(url);
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

(function (Rx) {
  'use strict';

  const TEN_MINUTES = 1000 * 60 * 10;

  let working = {};

  let request = (url, wait) => {
    let requestAgain = false;

    Rx.DOM.get(wait ? `${url}?wait` : url)
      .subscribe((xhr) => {
        window.authorized();

        if (xhr.status !== 204) {
          let data = JSON.parse(xhr.responseText);
          localStorage.setItem(url, JSON.stringify({timestamp: Date.now(), data}));
          working[url].onNext(data);
        }

        if (xhr.getResponseHeader('x-updating')) {
          requestAgain = true;
        } else if (xhr.status === 203) {
          working[url].onError('partial response');
        }
      }, (e) => {
        if (e.status === 401) {
          window.unauthorized();
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
  };

  window.MusicService = {
    getPlaylist: (playlistId) => window.MusicService._cachedRequest(`/api/playlists/${playlistId}`),
    getPlaylists: () => window.MusicService._cachedRequest('/api/playlists'),
    _cachedRequest: function (url) {
      let cache = JSON.parse(localStorage.getItem(url));

      if (!cache || !window.authKnown || Date.now() - cache.timestamp > TEN_MINUTES) {
        let subject = new Rx.ReplaySubject(1); // Buffer at most one response

        if (cache) {
          subject.onNext(cache.data);
        }

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

        return subject.asObservable();
      }

      return Rx.Observable.just(cache.data);
    }
  };
})(Rx);

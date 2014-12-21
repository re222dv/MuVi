(function (Rx) {
  'use strict';

  window.MusicService = {
    getFreshPlaylist: (playlistId) =>
       Rx.DOM.getJSON(`http://localhost:9099/api/playlists/${playlistId}`),
  };
})(Rx);

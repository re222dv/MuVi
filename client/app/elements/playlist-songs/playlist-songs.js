(function() {
  'use strict';

  Polymer('playlist-songs', {
    playlistIdChanged: function (_, playlistId) {
      console.log('asd');
      console.log(playlistId);
      this.playlistId = playlistId;
      this.$.ajax.setAttribute('url', `http://localhost:9099/api/playlists/${playlistId}`);
      this.$.ajax.go();
    },
    play: function (event) {
      let songId = event.currentTarget.getAttribute('data-songid');
      this.$.nowPlaying.playPlaylist(this.playlistId, songId);
    }
  });
})();


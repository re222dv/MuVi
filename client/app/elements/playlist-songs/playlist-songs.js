(function (music) {
  'use strict';

  Polymer('playlist-songs', {
    playlistIdChanged: function (_, playlistId) {
      this.playlistId = playlistId;
      this.playlist = [];
      music.getPlaylist(playlistId)
        .subscribe(this.$.indicator.onData(playlist => this.playlist = playlist));
    },
    play: function (event) {
      let songId = event.currentTarget.getAttribute('data-songid');
      this.$.nowPlaying.playPlaylist(this.playlistId, songId);
    }
  });
})(MusicService);


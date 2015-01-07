(function (music) {
  'use strict';

  Polymer('playlist-songs', {
    playlistIdChanged: function (_, playlistId) {
      console.log('asd');
      console.log(playlistId);
      this.playlistId = playlistId;
      music.getPlaylist(playlistId)
        .subscribe(playlist => this.playlist = playlist);
    },
    play: function (event) {
      let songId = event.currentTarget.getAttribute('data-songid');
      this.$.nowPlaying.playPlaylist(this.playlistId, songId);
    }
  });
})(MusicService);


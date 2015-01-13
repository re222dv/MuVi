(function (music, Rx) {
  'use strict';

  Polymer('playlist-songs', {
    playlistIdChanged: function (_, playlistId) {
      this.playlistId = playlistId;
      this.playlist = [];
      music.getPlaylist(playlistId)
        .subscribe(this.$.indicator.onData(playlist => {
          this.playlist = playlist;
          this.$.list.scrollToItem(0);
        }));
    },
    play: function (event) {
      let songId = event.currentTarget.getAttribute('data-songid');
      this.$.nowPlaying.playPlaylist(this.playlistId, songId);
    },
    playSong: function (event) {
      let songId = event.currentTarget.getAttribute('data-songid');
      this.$.nowPlaying.playSong(songId, this.playlistId);
    },
    queueSong: function (event) {
      let songId = event.currentTarget.getAttribute('data-songid');
      this.$.nowPlaying.queueSong(songId, this.playlistId);
    },
    domReady: function () {
      Rx.DOM.fromEvent(window, 'resize')
        .debounce(250) // Debounce to avoid crashing the tab in Chrome
        .subscribe(() => {
          this.$.list.updateSize();
        });
    },
  });
})(MusicService, Rx);


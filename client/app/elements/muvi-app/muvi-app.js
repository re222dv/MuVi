(function (music) {
  'use strict';

  Polymer('muvi-app', {
    playlistName: 'MuVi',
    queue: false,
    playlistClick: function (event) {
      console.log(event.target.getAttribute('data-id'));
      this.playlistId = event.target.getAttribute('data-id');
      music.getFreshPlaylist(this.playlistId).subscribeOnNext(playlist => {
        console.log(playlist);
        this.queue = false;
        this.playlistName = playlist.name;
      });
    },
    toggleQueue: function () {
      this.queue = !this.queue;
    }
  });
})(MusicService);


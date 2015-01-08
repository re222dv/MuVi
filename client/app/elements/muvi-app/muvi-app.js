(function (music, Rx) {
  'use strict';

  Polymer('muvi-app', {
    playlistName: 'MuVi',
    queue: false,
    playlistClick: function (event) {
      console.log(event.target.getAttribute('data-id'));
      this.playlistId = event.target.getAttribute('data-id');
      music.getPlaylist(this.playlistId).subscribe(playlist => {
        console.log(playlist);
        this.queue = false;
        this.playlistName = playlist.name;
      });
    },
    toggleQueue: function () {
      this.queue = !this.queue;
    },
    toggleUserMenu: function () {
      this.$.dropdown.toggle();
    },
    logOut: function (e) {
      Rx.DOM.get('/auth/logout').subscribe(() => {
        localStorage.clear();
        location.reload();
      });
      e.stopPropagation();
    },
    domReady: function () {
      music.getPlaylists()
        .subscribe(playlists => this.playlists = playlists);
    }
  });
})(MusicService, Rx);


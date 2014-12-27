(function() {
  'use strict';

  Polymer('now-playing-queue', {
    play: function (event) {
      let songId = event.currentTarget.getAttribute('data-songid');
      this.$.nowPlaying.playSong(songId);
    },
    songChange: function (_, nowPlaying) {
      this.nowPlaying = nowPlaying;
    },
  });
})();


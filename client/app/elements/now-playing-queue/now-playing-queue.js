(function() {
  'use strict';

  Polymer('now-playing-queue', {
    playing: false,
    play: function (event) {
      let songId = event.currentTarget.getAttribute('data-songid');
      this.$.nowPlaying.playSong(songId);
    },
    songChange: function (_, nowPlaying) {
      this.nowPlaying = nowPlaying;
    },
    statusChange: function (_, playing) {
      console.log('status', playing);
      this.playing = playing;
    },
  });
})();

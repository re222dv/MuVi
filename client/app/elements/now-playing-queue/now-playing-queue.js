(function() {
  'use strict';

  Polymer('now-playing-queue', {
    playing: false,
    play: function (event) {
      let index = event.currentTarget.getAttribute('data-index');
      this.$.nowPlaying.playSongIndex(index);
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

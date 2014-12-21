(function() {
  'use strict';

  Polymer('video-player', {
    play: function () {
      this.$.music.play();
    },
    pause: function () {
      this.$.music.pause();
    },
    next: function () {
      this.$.music.next();
    },
    previous: function () {
      this.$.music.previous();
    },
    updateVideo: function (_, nowPlaying) {
      console.log(nowPlaying);
      this.$.youtube.setAttribute('videoid', nowPlaying.video.youtubeId);
      this.$.youtube.play();
    },
    videoState: function (_, state) {
      if (state.data === 0) { // Ended
        this.$.music.next();
      } else if (state.data === 5) { // Cued/Ready to play
        this.$.youtube.setAttribute('videoid', this.$.music.nowPlaying.video.youtubeId);
        this.$.youtube.play();
      }
      console.log('state', state.data);
    }
  });
})();


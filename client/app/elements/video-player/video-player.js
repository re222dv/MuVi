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
    songChange: function (_, nowPlaying) {
      console.log(nowPlaying);
      this.$.youtube.setAttribute('videoid', nowPlaying.video.youtubeId);
      this.async(() => this.videoLoaded = true);
    },
    statusChange: function (_, playing) {
      console.log(playing);
      if (playing && this.state !== 1) { // Playing
        console.log('play');
        this.$.youtube.play();
      } else if (!playing && this.state !== 2) { // Paused
        console.log('pause');
        this.$.youtube.pause();
      }
    },
    videoState: function (_, state) {
      if (state.data === 0) { // Ended
        this.$.music.next();
      } else if (state.data === 1) { // Playing
        this.$.music.setPlaying(true);
      } else if (state.data === 2) { // Paused
        this.$.music.setPlaying(false);
      } else if (state.data === 5) { // Cued/Ready to play
        if (this.playing) {
          this.$.youtube.setAttribute('videoid', this.$.music.nowPlaying.video.youtubeId);
          this.$.youtube.play();
        }
      }
      console.log('state', state.data);
    }
  });
})();


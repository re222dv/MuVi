(function() {
  'use strict';

  Polymer('video-player', {
    fullscreen: false,
    toggleFullscreen: function () {
      this.fullscreen = !this.fullscreen;
    },
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
      this.song = nowPlaying;
      //this.song = nowPlaying.name;
      //this.artist = nowPlaying.artist.name;
      //this.$.youtube.setAttribute('videoid', nowPlaying.video.youtubeId);
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
    },
    domReady: function () {
      let mousemoves = Rx.DOM.fromEvent(this.$.player, 'mousemove')
        .where(() => this.fullscreen)
        .where(() => this.playing);

      this.handleControls = mousemoves
        .subscribe(() => {
          this.showControls = true;

          mousemoves
            .takeUntil(mousemoves)
            .timeout(2000, Promise.resolve(true))
            .where(data => data === true)
            .subscribe(() => {
              this.showControls = false;
            });
        });

      this.fullscreenListener = Rx.DOM.dblclick(this.$.player)
        .subscribe(() => this.toggleFullscreen());
      this.playbackListener = Rx.DOM.fromEvent(this.$.player, 'click')
        .subscribe(() => {
          if (this.playing) {
            this.pause();
          } else {
            this.play();
          }
        })
    },
    detached: function () {
      this.handleControls.dispose();
      this.fullscreenListener.dispose();
      this.playbackListener.dispose();
    }
  });
})();


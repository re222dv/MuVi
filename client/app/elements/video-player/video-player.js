(function() {
  'use strict';

  let stopProp = (callback) => function(event) {
    if (event) {
      event.stopPropagation();
    }
    return callback.apply(this);
  };

  Polymer('video-player', {
    fullscreen: false,
    readyToPlay: false,
    clickedOnVideo: false,
    /**
     * Firefox and Chrome on desktop doesn't require the user to be able to click on the video,
     * IE and Chrome on Android does. Safari is untested so taking the safe path here. Opera with
     * blink engine should probably be ok so not filtering that.
     */
    get needToClickOnVideo() {
      let ua = navigator.userAgent.toLowerCase();
      let isAndroid = ua.indexOf('android') !== -1;
      let isNotBlink = ua.indexOf('chrome') !== -1;
      let isNotFirefox = ua.indexOf('firefox') !== -1;
      return isAndroid || (isNotBlink && isNotFirefox);
    },
    toggleFullscreen: stopProp(function () {
      this.fullscreen = !this.fullscreen;

      // Code from https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode
      if (this.fullscreen) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    }),
    toggleRepeat: stopProp(function () {
      this.$.music.toggleRepeat();
    }),
    toggleShuffle: stopProp(function () {
      this.$.music.toggleShuffle();
    }),
    play: stopProp(function () {
      this.$.music.play();
    }),
    pause: stopProp(function () {
      this.$.music.pause();
    }),
    next: stopProp(function () {
      this.$.music.next();
    }),
    previous: stopProp(function () {
      this.$.music.previous();
    }),
    seek: function (e) {
      console.log(e.target.immediateValue);
      this.$.youtube.seekTo(e.target.immediateValue);
    },
    songChange: function (_, nowPlaying) {
      if (!nowPlaying || !nowPlaying.id) {
        nowPlaying = undefined;
      }
      if (this.readyToPlay) {
        this.song = nowPlaying;
      } else {
        this.whenReady = nowPlaying;
      }
      if (!window.nativeWebComponents) {
        // Browsers without native web components need to show the player before it can be ready
        this.async(() => this.videoLoaded = true);
      }
    },
    statusChange: function (_, playing) {
      if (playing && this.state !== 1) { // Playing
        this.$.youtube.play();
        this.playing = true;
      } else if (!playing && this.state !== 2) { // Paused
        this.$.youtube.pause();
      }
    },
    videoState: function (_, state) {
      if (state.data === 0) { // Ended
        this.$.music.next();
        this.async(() => {
          if (this.song.video) {
            this.$.music.setPlaying(true);
          }
        });
      } else if (state.data === 1) { // Playing
        this.$.music.setPlaying(true);
        this.clickedOnVideo = true;
      } else if (state.data === 2) { // Paused
        this.$.music.setPlaying(false);
      } else if (state.data === 5) { // Cued/Ready to play
        this.async(() => this.videoLoaded = true);
        if (this.playing) {
          this.$.youtube.play();
        }
      }
      console.log('state', state.data);
    },
    stopProp: stopProp(function () {}),
    youtubeReady: function () {
      console.log('Very ready');
      this.readyToPlay = true;
      if (this.whenReady) {
        this.song = this.whenReady;
      }
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
            .timeout(2000, Promise.resolve(true)) // Hide controls after 2s of no movement
            .where(data => data === true)
            .subscribe(() => {
              this.showControls = false;
            });
        });

      let timeout;

      this.fullscreenListener = Rx.DOM.dblclick(this.$.player)
        .subscribe(() => this.toggleFullscreen());
      this.playbackListener = Rx.DOM.fromEvent(this.$.player, 'click')
        .subscribe(() => {
          if (document.body.getBoundingClientRect().width <= 600) {
            if (this.fullscreen) {
              if (this.showControls) {
                window.clearTimeout(timeout);
              }
              this.showControls = true;
              timeout = window.setTimeout(() => { // Hide controls 3s after click
                this.showControls = false;
              }, 3000);
            } else {
              this.toggleFullscreen();
            }
            return;
          }
          if (this.playing) {
            this.pause();
          } else {
            this.play();
          }
        });
    },
    detached: function () {
      this.handleControls.dispose();
      this.fullscreenListener.dispose();
      this.playbackListener.dispose();
    }
  });
})();


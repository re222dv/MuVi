(function (music, Rx) {
  'use strict';

  let queue = [];
  let index;
  let playing = false;

  let songSubject = new Rx.Subject();
  let statusSubject = new Rx.Subject();

  Polymer('service-now-playing', {
    get nowPlaying() {
      return queue[index];
    },
    play: function () {
      playing = true;
      this.updateStatus();
    },
    pause: function () {
      playing = false;
      this.updateStatus();
    },
    next: function () {
      index++;
      this.updateSong();
    },
    previous: function () {
      index--;
      this.updateSong();
    },
    setPlaying: function (isPlaying) {
      playing = isPlaying;
      this.updateStatus();
    },
    playPlaylist: function (playlistId, startSongId) {
      console.log('playPlaylist');
      music.getFreshPlaylist(playlistId)
        .subscribe(playlist => {
          queue = playlist.songs;
          index = queue.findIndex(song => song.id === startSongId);
          this.updateSong();
          this.play();
          console.log('nowPlayling', this.nowPlaying.name);
        }, err => console.error('Error', err));
    },
    updateSong: function () {
      console.log('updateSong');
      songSubject.onNext(this.nowPlaying);
    },
    updateStatus: function () {
      console.log('updateStatus');
      this.playing = playing;
      statusSubject.onNext(playing);
    },
    domReady: function () {
      this.subscriptionSong = songSubject.subscribeOnNext(update => {
        console.log('domReady');
        this.fire('song-change', update);
      });
      this.subscriptionStatus = statusSubject.subscribeOnNext(update => {
        console.log('domReady');
        this.fire('status-change', update);
      });
    },
    detached: function () {
      this.subscriptionSong.dispose();
      this.subscriptionStatus.dispose();
    }
  });
})(MusicService, Rx);

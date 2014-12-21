(function (music, Rx) {
  'use strict';

  let queue = [];
  let index;
  let playing = false;

  let nowPlayingChange = new Rx.Subject();

  Polymer('service-now-playing', {
    get nowPlaying() {
      return queue[index];
    },
    play: function () {
      playing = true;
      this.updateSong();
    },
    pause: function () {
      playing = false;
      this.updateSong();
    },
    next: function () {
      index++;
      this.updateSong();
    },
    previous: function () {
      index--;
      this.updateSong();
    },
    playPlaylist: function (playlistId, startSongId) {
      console.log('playPlaylist');
      music.getFreshPlaylist(playlistId)
        .subscribe(playlist => {
          queue = playlist.songs;
          index = queue.findIndex(song => song.id === startSongId);
          this.play();
          console.log('nowPlayling', this.nowPlaying.name);
        }, err => console.error('Error', err));
    },
    updateSong: function () {
      console.log('updateSOng');
      this.playing = playing;
      nowPlayingChange.onNext(this.nowPlaying);
    },
    domReady: function () {
      this.subscription = nowPlayingChange.subscribeOnNext(update => {
        console.log('domReady');
        this.fire('now-playing', update);
      });
    },
    detached: function () {
      this.subscription.dispose();
    }
  });
})(MusicService, Rx);

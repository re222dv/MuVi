(function (music, Rx) {
  'use strict';

  let queue = [];
  let backupQueue = [];
  let index;
  let playing = false;
  let shuffle = false;
  let repeat = false;

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
      if (index >= queue.length) {
        if (repeat) {
          index = 0;
        } else {
          this.pause();
        }
      }
      this.updateSong();
    },
    previous: function () {
      index--;
      if (index < 0) {
        if (repeat) {
          index = queue.length - 1;
        } else {
          index = 0;
        }
      }
      this.updateSong();
    },
    setPlaying: function (isPlaying) {
      playing = isPlaying;
      this.updateStatus();
    },
    setRepeat: function (isRepeat) {
      repeat = isRepeat;
      this.updateStatus();
    },
    setShuffle: function (isShuffle) {
      shuffle = isShuffle;
      if (isShuffle) {
        backupQueue = queue;
        queue = shuffleArray(queue, true);
      } else {
        queue = backupQueue;
      }
      console.log(queue);
      this.updateStatus();
    },
    toggleRepeat: function () {
      this.setRepeat(!repeat);
    },
    toggleShuffle: function () {
      this.setShuffle(!shuffle);
    },
    playPlaylist: function (playlistId, startSongId) {
      console.log('playPlaylist');
      music.getFreshPlaylist(playlistId)
        .subscribe(playlist => {
          queue = playlist.songs;
          this.playSong(startSongId);
        }, err => console.error('Error', err));
    },
    playSong: function (songId) {
      console.log('playSong');

      index = queue.findIndex(song => song.id === songId);
      this.updateSong();
      this.play();
      console.log('nowPlayling', this.nowPlaying.name);
    },
    updateSong: function () {
      console.log('updateSong');
      songSubject.onNext(this.nowPlaying);
    },
    updateStatus: function () {
      console.log('updateStatus');
      this.playing = playing;
      this.repeat = repeat;
      this.shuffle = shuffle;
      statusSubject.onNext(playing);
    },
    domReady: function () {
      this.subscriptionSong = songSubject.subscribeOnNext(update => {
        console.log('domReady');
        this.queue = queue;
        this.fire('song-change', update);
      });
      this.subscriptionStatus = statusSubject.subscribeOnNext(update => {
        console.log('domReady');
        this.queue = queue;
        this.fire('status-change', update);
      });
    },
    detached: function () {
      this.subscriptionSong.dispose();
      this.subscriptionStatus.dispose();
    }
  });
})(MusicService, Rx);

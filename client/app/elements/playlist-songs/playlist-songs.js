(function() {
  'use strict';

  Polymer('playlist-songs', {
    playlistIdChanged: function (_, playlistId) {
      console.log('asd');
      console.log(playlistId);
      this.$.ajax.setAttribute('url', 'http://localhost:9099/api/playlists/'+playlistId)
      this.$.ajax.go();
    },
    play: function (event) {
      var videoId = event.currentTarget.getAttribute('data-videoid');
    console.log(videoId);
      this.$.youtube.setAttribute('videoid', videoId);
      this.$.youtube.play();
    }
  });
})();


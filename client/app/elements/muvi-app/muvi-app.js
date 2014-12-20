(function() {
  'use strict';

  Polymer('muvi-app', {
    playlistClick: function (event) {
      console.log(event.target.getAttribute('data-id'));
      this.playlistId = event.target.getAttribute('data-id');
    }
  });
})();


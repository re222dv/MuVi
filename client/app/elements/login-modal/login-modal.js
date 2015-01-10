(function () {
  'use strict';

  Polymer('login-modal', {
    backdrop: true,
    dialog: false,
    attached: function () {
      window.authorized = () => {
        if (this.backdrop) {
          this.backdrop = false;
        }
        window.authKnown = true;
      };
      window.unauthorized = () => {
        this.backdrop = true;
        this.dialog = true;
        window.authKnown = true;
      };
    }
  });
})();


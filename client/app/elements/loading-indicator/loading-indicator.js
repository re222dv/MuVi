(function (Rx) {
  'use strict';

  Polymer('loading-indicator', {
    activateSpinner: false,
    hideSpinner: true,
    loadPartial: false,
    loadFailed: false,
    displaySpinner: function (display = true) {
      this.activateSpinner = display;
      if (display) {
        this.hideSpinner = false;
      } else {
        window.setTimeout(() => this.hideSpinner = true, 250);
      }
    },
    onData: function (callback) {
      let loaded = false;

      window.setTimeout(() => {
        if (!loaded) {
          this.displaySpinner();
        }
      }, 100);

      return Rx.Observer.create(callback,
      (error) => {
        loaded = true;
        this.displaySpinner(false);
        if (error === 'partial response') {
          this.loadPartial = true;
        } else {
          this.loadFailed = true;
        }
      },
      () => {
        loaded = true;
        this.displaySpinner(false);
      });
    },
    hideError: function () {
      this.loadPartial = false;
      this.loadFailed = false;
    },
  });
})(Rx);


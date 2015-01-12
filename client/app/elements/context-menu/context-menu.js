(function () {
  'use strict';

  Polymer('context-menu', {
    toggle: function (e) {
      this.$.menu.toggle();
      e.stopPropagation();
      e.preventDefault();
    },
  });
})();


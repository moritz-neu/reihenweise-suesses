(function (RS) {
  'use strict';

  RS.App = {
    save: RS.Save.load(),
    persist: function () {
      return RS.Save.store(RS.App.save);
    }
  };

  RS.UI.init(document.getElementById('app'));
  RS.UI.show('menu');
})(window.RS = window.RS || {});

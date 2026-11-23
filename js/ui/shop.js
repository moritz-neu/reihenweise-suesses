(function (RS) {
  'use strict';

  // Laden auf der Levelkarte: Zuckerstangen gegen Joker tauschen. Er zeigt die Joker,
  // deren Welt offen ist; Name, Preis und Wirkung stehen in der Joker-Tabelle (RS.Jokers).
  // Beim ersten Besuch erklärt Annika zuerst, wie es funktioniert.

  var el = RS.UI.el;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var PROBLEMS = { money: 'Nicht genug Zuckerstangen', full: 'Vorrat voll' };

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  // Eigene kleine Zeichnung: rot-weiß gestreifte Zuckerstange mit Haken.
  function stickIcon() {
    var svg = svgEl('svg', { 'class': 'stick-icon', viewBox: '0 0 24 24',
      'aria-hidden': 'true', focusable: 'false' });
    var d = 'M7 22 V9 a5 5 0 0 1 10 0 v1';
    svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': '4.6',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: '#e0204f', 'stroke-width': '4.6',
      'stroke-linecap': 'butt', 'stroke-dasharray': '2.6 3.4', 'stroke-linejoin': 'round' }));
    svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'rgba(60,10,40,0.35)', 'stroke-width': '0.8',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: 'translate(2.3 0)' }));
    return svg;
  }

  // Eigene kleine Zeichnungen für die Joker: Hammer, Besen und "+5"-Abzeichen.
  function jokerIcon(kind) {
    var svg = svgEl('svg', { 'class': 'joker-icon', viewBox: '0 0 24 24',
      'aria-hidden': 'true', focusable: 'false' });
    if (kind === 'besen') {
      svg.appendChild(svgEl('rect', { x: '10.8', y: '1.5', width: '2.4', height: '12', rx: '1.2', fill: '#fff',
        stroke: '#e0204f', 'stroke-width': '0.8', 'stroke-dasharray': '1.6 1.6' }));
      svg.appendChild(svgEl('path', { d: 'M8 13 h8 l3 9 H5 Z', fill: '#ffd24d', stroke: '#fff', 'stroke-width': '1.1',
        'stroke-linejoin': 'round' }));
      svg.appendChild(svgEl('path', { d: 'M9 16 L8 21 M12 16 V21 M15 16 L16 21', stroke: '#c98a4b',
        'stroke-width': '1', 'stroke-linecap': 'round' }));
      svg.appendChild(svgEl('rect', { x: '7.5', y: '12', width: '9', height: '2.6', rx: '1.3', fill: '#ff4d7a' }));
    } else if (kind === 'hammer') {
      svg.appendChild(svgEl('rect', { x: '10.5', y: '9', width: '3', height: '13', rx: '1.2', fill: '#c98a4b' }));
      svg.appendChild(svgEl('rect', { x: '3', y: '3', width: '18', height: '8', rx: '2.5', fill: '#ff4d7a',
        stroke: '#fff', 'stroke-width': '1.2' }));
    } else {
      svg.appendChild(svgEl('circle', { cx: '12', cy: '12', r: '10', fill: '#8b5aff', stroke: '#ffd78c',
        'stroke-width': '1.6' }));
      var t = svgEl('text', { x: '12', y: '16.2', 'text-anchor': 'middle', 'font-size': '11',
        'font-weight': '700', fill: '#fff', 'font-family': 'sans-serif' });
      t.textContent = '+5';
      svg.appendChild(t);
    }
    return svg;
  }

  function balance(save) {
    var node = el('p', 'stick-balance');
    node.appendChild(stickIcon());
    node.appendChild(el('span', 'stick-balance-num', String(save.sticks)));
    node.setAttribute('aria-label', save.sticks + ' Zuckerstangen');
    return node;
  }

  function price(kind) {
    var p = el('span', 'shop-price');
    p.appendChild(stickIcon());
    p.appendChild(el('span', null, String(RS.Shop.PRICES[kind])));
    p.setAttribute('aria-label', RS.Shop.PRICES[kind] + ' Zuckerstangen');
    return p;
  }

  function render(body) {
    var save = RS.App.save;
    body.innerHTML = '';
    var top = el('div', 'shop-top');
    top.appendChild(el('span', 'shop-top-label', 'Dein Vorrat an Zuckerstangen'));
    top.appendChild(balance(save));
    body.appendChild(top);

    var list = el('ul', 'shop-list');
    RS.Jokers.available(save).forEach(function (info) {
      var kind = info.kind;
      var problem = RS.Shop.buyProblem(save, kind);
      var item = el('li', 'shop-item');
      var text = el('div', 'shop-item-text');
      text.appendChild(el('h3', 'shop-item-name', info.name));
      text.appendChild(el('p', 'shop-item-desc', info.text));
      text.appendChild(el('p', 'shop-item-stock', 'Vorrat ' + save.jokers[kind] + ' / ' + RS.Shop.MAX_STOCK));
      item.appendChild(text);

      var buy = el('div', 'shop-item-buy');
      buy.appendChild(price(kind));
      var btn = el('button', 'btn btn--gold', 'Kaufen');
      btn.type = 'button';
      btn.setAttribute('data-joker', kind);
      if (problem) { btn.disabled = true; }
      btn.addEventListener('click', function () {
        if (RS.Shop.buy(save, kind)) {
          RS.Audio.play({ type: 'click' });
          RS.App.persist();
        }
        render(body);
        var again = body.querySelector('button[data-joker="' + kind + '"]');
        if (again && !again.disabled) { again.focus(); return; }
        var done = document.querySelector('.dialog--shop .dialog-actions .btn');
        if (done) { done.focus(); }
      });
      buy.appendChild(btn);
      if (problem && PROBLEMS[problem]) { buy.appendChild(el('p', 'shop-reason', PROBLEMS[problem])); }
      item.appendChild(buy);
      list.appendChild(item);
    });
    body.appendChild(list);
  }

  function showShop(onClose) {
    var body = el('div', 'shop');
    render(body);
    RS.UI.dialog({
      title: 'Laden',
      className: 'dialog--shop',
      body: body,
      buttons: [{ label: 'Fertig', className: 'btn--gold', onClick: function () {
        if (onClose) { onClose(); }
      } }],
      onCancel: function () { if (onClose) { onClose(); } }
    });
  }

  function open(onClose) {
    var save = RS.App.save;
    if (RS.Save.hasSeen(save, 'laden')) { showShop(onClose); return; }
    RS.UI.Dialog.say(RS.STORY.shop).then(function () {
      RS.Save.markSeen(save, 'laden');
      RS.App.persist();
      showShop(onClose);
    });
  }

  RS.UI.Shop = { stickIcon: stickIcon, jokerIcon: jokerIcon, balance: balance, open: open };
})(window.RS = window.RS || {});

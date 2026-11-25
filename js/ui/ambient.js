(function (RS) {
  'use strict';

  // Lebendige Kulissen je Welt: Himmel, Horizont-Silhouette und kleine animierte Figuren, die
  // sich langsam und leise bewegen (css/ambient.css). Alles liegt hinter dem Spielgeschehen und
  // fängt keine Klicks ab; bei „Bewegung reduzieren“ steht alles still (css/theme.css).
  // - gameLayer(worldId): Hintergrund des Spielbildschirms (Himmel, Horizont, Figuren am Rand).
  // - mapLayer(worldId, seg, segs): Figuren für einen Abschnitt der langen Karte, je Abschnitt
  //   andere, dazu ein Farbschleier, der zur Bosshöhe hin dunkler wird.
  // Jede Figur ist ein SVG im Feld 0 0 100 100; Teile mit Klassen amb-wing, amb-tail, amb-arm,
  // amb-eye, amb-flame, amb-beam bewegen sich einzeln.

  function svg(inner, extra) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"' + (extra || '') + '>' + inner + '</svg>';
  }

  var EYE = '#2a1638';

  // ---------- Figuren ----------

  var F = {
    // Welt 1: Kandishain
    gingerbread: svg(
      '<g class="amb-arm amb-arm--r"><path d="M64 46 Q78 38 84 26" stroke="#b8732f" stroke-width="10" stroke-linecap="round" fill="none"/>' +
      '<path d="M74 37 l4 -2" stroke="#fff8ee" stroke-width="2" stroke-linecap="round"/></g>' +
      '<path d="M36 46 Q24 54 20 64" stroke="#b8732f" stroke-width="10" stroke-linecap="round" fill="none"/>' +
      '<circle cx="50" cy="26" r="15" fill="#c9843a"/>' +
      '<path d="M38 44 Q50 38 62 44 L64 76 Q50 80 36 76 Z" fill="#c9843a"/>' +
      '<path d="M40 76 L36 94 M60 76 L64 94" stroke="#c9843a" stroke-width="10" stroke-linecap="round"/>' +
      '<circle class="amb-eye" cx="45" cy="24" r="2.2" fill="' + EYE + '"/><circle class="amb-eye" cx="55" cy="24" r="2.2" fill="' + EYE + '"/>' +
      '<path d="M44 31 Q50 35 56 31" stroke="#fff8ee" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="50" cy="52" r="3" fill="#e0204f"/><circle cx="50" cy="62" r="3" fill="#13b371"/>' +
      '<path d="M36 72 Q50 68 64 72" stroke="#fff8ee" stroke-width="2.4" fill="none" stroke-dasharray="3 3"/>'),
    cat: svg(
      '<g class="amb-tail"><path d="M64 84 Q88 80 86 58 Q85 48 92 44" stroke="#3a2458" stroke-width="7" fill="none" stroke-linecap="round"/></g>' +
      '<path d="M34 92 Q30 62 46 54 Q50 40 50 34 L42 22 L54 30 L62 22 L60 36 Q70 50 66 70 Q68 88 60 92 Z" fill="#3a2458"/>' +
      '<g class="amb-eye"><ellipse cx="50" cy="38" rx="3" ry="3.6" fill="#ffd24d"/><ellipse cx="58" cy="38" rx="3" ry="3.6" fill="#ffd24d"/></g>' +
      '<rect x="10" y="90" width="84" height="6" rx="3" fill="#5c3a2e"/>'),
    lantern: svg(
      '<circle cx="50" cy="50" r="22" fill="#ffd78c" opacity="0.25"/><circle cx="50" cy="50" r="12" fill="#ffe9b8" opacity="0.55"/>' +
      '<circle cx="50" cy="50" r="6" fill="#fff6dc"/>'),

    // Welt 2: Frostzuckerberge
    hare: svg(
      '<ellipse cx="50" cy="70" rx="24" ry="18" fill="#f4fbff"/>' +
      '<circle cx="66" cy="52" r="13" fill="#f4fbff"/>' +
      '<g class="amb-ear"><ellipse cx="62" cy="28" rx="4.5" ry="15" fill="#f4fbff"/><ellipse cx="62" cy="28" rx="2" ry="10" fill="#ffc6d9"/>' +
      '<ellipse cx="72" cy="30" rx="4.5" ry="14" fill="#f4fbff" transform="rotate(14 72 30)"/></g>' +
      '<circle class="amb-eye" cx="70" cy="50" r="2" fill="' + EYE + '"/><circle cx="78" cy="55" r="2" fill="#ff8fb3"/>' +
      '<circle cx="27" cy="66" r="6" fill="#ffffff"/>'),
    snowman: svg(
      '<circle cx="50" cy="76" r="20" fill="#f4fbff"/><circle cx="50" cy="46" r="15" fill="#f4fbff"/>' +
      '<circle cx="50" cy="22" r="11" fill="#f4fbff"/>' +
      '<g class="amb-scarf"><path d="M38 33 Q50 38 62 33 L62 37 Q50 42 38 37 Z" fill="#e0204f"/>' +
      '<path d="M58 36 L66 52 L60 53 L54 38 Z" fill="#e0204f"/></g>' +
      '<circle class="amb-eye" cx="46" cy="20" r="1.8" fill="' + EYE + '"/><circle class="amb-eye" cx="54" cy="20" r="1.8" fill="' + EYE + '"/>' +
      '<path d="M50 24 L60 26 L50 27 Z" fill="#ff9f43"/>' +
      '<circle cx="50" cy="46" r="2" fill="#1384d6"/><circle cx="50" cy="56" r="2" fill="#1384d6"/>' +
      '<path d="M40 10 h20 v-3 h-4 v-6 h-12 v6 h-4 z" fill="#3a2458"/>'),
    snowflake: svg(
      '<g stroke="#e8f8ff" stroke-width="5" stroke-linecap="round"><path d="M50 14 V86 M19 32 L81 68 M19 68 L81 32"/>' +
      '<path d="M50 14 l-8 8 M50 14 l8 8 M50 86 l-8 -8 M50 86 l8 -8" stroke-width="3.5"/></g>'),

    // Welt 3: Karamellwüste
    camel: svg(
      '<path d="M20 58 Q22 40 36 40 Q42 26 50 40 Q56 30 62 40 Q72 42 74 56 L74 60 L20 60 Z" fill="#c97a2e"/>' +
      '<path d="M72 50 Q80 46 80 34 Q80 24 88 24 Q94 26 92 32 L88 34 Q86 46 80 56 Z" fill="#c97a2e"/>' +
      '<circle class="amb-eye" cx="88" cy="28" r="1.6" fill="' + EYE + '"/>' +
      '<g class="amb-legs"><path d="M28 60 V88 M38 60 V88 M58 60 V88 M68 60 V88" stroke="#b36a24" stroke-width="6" stroke-linecap="round"/></g>' +
      '<path d="M36 44 Q50 36 62 44" stroke="#e0204f" stroke-width="3" fill="none"/>' +
      '<path d="M40 46 h20" stroke="#ffd24d" stroke-width="3" stroke-dasharray="3 3"/>'),
    cactus: svg(
      '<path d="M44 96 V30 a6 6 0 0 1 12 0 V96 Z M44 66 H34 a5 5 0 0 1 -5 -5 V46 a4 4 0 0 1 8 0 V58 H44 Z M56 56 H64 V40 a4 4 0 0 1 8 0 V54 a7 7 0 0 1 -7 7 H56 Z" fill="#3fc48a"/>' +
      '<path d="M48 28 V94 M52 28 V94" stroke="#2f9a6a" stroke-width="1.6"/>' +
      '<circle cx="50" cy="20" r="8" fill="#ff4d7a"/><path d="M50 20 m-3 0 a3 3 0 1 1 6 0" stroke="#fff" stroke-width="1.6" fill="none"/>'),
    sparkle: svg(
      '<path d="M50 10 C53 40 60 47 90 50 C60 53 53 60 50 90 C47 60 40 53 10 50 C40 47 47 40 50 10 Z" fill="#fff2c4"/>'),

    // Welt 4: Kaugummi-Dschungel
    parrot: svg(
      '<path d="M44 92 Q36 74 40 56 L54 58 Q56 76 50 92 Z" fill="#1384d6"/>' +
      '<ellipse cx="50" cy="50" rx="15" ry="20" fill="#e0204f"/>' +
      '<g class="amb-wing"><path d="M40 44 Q26 54 34 74 Q44 66 46 50 Z" fill="#13b371"/></g>' +
      '<circle cx="54" cy="30" r="12" fill="#e0204f"/>' +
      '<path d="M62 30 Q74 32 66 42 Q64 36 60 36 Z" fill="#ffd24d"/>' +
      '<circle cx="58" cy="28" r="4" fill="#fff"/><circle class="amb-eye" cx="59" cy="28" r="2" fill="' + EYE + '"/>' +
      '<path d="M26 92 H74" stroke="#7a4a1e" stroke-width="5" stroke-linecap="round"/>'),
    monkey: svg(
      '<path d="M50 0 V30" stroke="#2f9a6a" stroke-width="4"/>' +
      '<path d="M50 30 Q42 36 44 46" stroke="#8a5a3c" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<circle cx="46" cy="52" r="12" fill="#8a5a3c"/><circle cx="34" cy="48" r="5" fill="#8a5a3c"/><circle cx="58" cy="48" r="5" fill="#8a5a3c"/>' +
      '<ellipse cx="46" cy="55" rx="8" ry="6" fill="#e8c09a"/>' +
      '<circle class="amb-eye" cx="42" cy="50" r="1.8" fill="' + EYE + '"/><circle class="amb-eye" cx="50" cy="50" r="1.8" fill="' + EYE + '"/>' +
      '<path d="M43 58 Q46 60 49 58" stroke="' + EYE + '" stroke-width="1.4" fill="none"/>' +
      '<ellipse cx="46" cy="76" rx="10" ry="12" fill="#8a5a3c"/>' +
      '<path d="M54 82 Q70 90 66 72" stroke="#8a5a3c" stroke-width="4" fill="none" stroke-linecap="round"/>'),
    bubble: svg(
      '<circle cx="50" cy="50" r="30" fill="#ff8fc4" opacity="0.75"/><circle cx="50" cy="50" r="30" fill="none" stroke="#ffd3ea" stroke-width="3"/>' +
      '<ellipse cx="40" cy="38" rx="8" ry="5" fill="#fff" opacity="0.7" transform="rotate(-30 40 38)"/>'),

    parrotfly: svg(
      '<g class="amb-wing"><path d="M44 46 Q30 18 12 22 Q24 34 30 50 Z" fill="#13b371"/><path d="M56 46 Q70 18 88 22 Q76 34 70 50 Z" fill="#1384d6"/></g>' +
      '<ellipse cx="50" cy="56" rx="14" ry="12" fill="#e0204f"/>' +
      '<circle cx="66" cy="48" r="9" fill="#e0204f"/><path d="M73 47 Q82 48 76 55 Z" fill="#ffd24d"/>' +
      '<circle cx="68" cy="46" r="3" fill="#fff"/><circle class="amb-eye" cx="69" cy="46" r="1.5" fill="' + EYE + '"/>' +
      '<path d="M36 60 L18 72 L22 62 Z" fill="#1384d6"/>'),

    // Welt 5: Kirschgarten
    bee: svg(
      '<g class="amb-wing"><ellipse cx="42" cy="34" rx="12" ry="8" fill="#e6f6ff" opacity="0.85"/><ellipse cx="58" cy="32" rx="12" ry="8" fill="#e6f6ff" opacity="0.85"/></g>' +
      '<ellipse cx="50" cy="52" rx="22" ry="16" fill="#ffd24d"/>' +
      '<path d="M42 38 V66 M54 37 V67" stroke="#2a1638" stroke-width="6"/>' +
      '<circle cx="72" cy="50" r="9" fill="#2a1638"/><circle class="amb-eye" cx="75" cy="47" r="2" fill="#fff"/>' +
      '<path d="M28 52 l-8 2" stroke="#2a1638" stroke-width="3" stroke-linecap="round"/>'),
    bird: svg(
      '<path d="M20 90 H80" stroke="#5c3a2e" stroke-width="5" stroke-linecap="round"/>' +
      '<g class="amb-peck"><ellipse cx="50" cy="66" rx="18" ry="15" fill="#ff6f91"/>' +
      '<circle cx="62" cy="52" r="10" fill="#ff6f91"/><path d="M70 52 L80 55 L70 57 Z" fill="#ffd24d"/>' +
      '<circle class="amb-eye" cx="64" cy="50" r="1.8" fill="' + EYE + '"/>' +
      '<path d="M34 64 Q40 76 52 72" stroke="#ffd1dc" stroke-width="3" fill="none"/></g>' +
      '<path d="M46 80 V88 M54 80 V88" stroke="#ff9f43" stroke-width="2.4"/>'),
    petal: svg(
      '<path d="M50 20 C70 30 70 60 50 80 C30 60 30 30 50 20 Z" fill="#ffb3c6"/><path d="M50 26 V74" stroke="#ff8fb3" stroke-width="2"/>'),

    // Welt 6: Zuckerwattenwolken
    balloon: svg(
      '<path d="M50 6 C76 6 86 30 76 50 C70 62 58 68 56 72 H44 C42 68 30 62 24 50 C14 30 24 6 50 6 Z" fill="#ff8fc4"/>' +
      '<path d="M50 6 C60 18 62 52 56 72 M50 6 C40 18 38 52 44 72" stroke="#ffd3ea" stroke-width="3" fill="none"/>' +
      '<path d="M45 72 L42 82 M55 72 L58 82" stroke="#8a5a3c" stroke-width="1.6"/>' +
      '<rect x="40" y="82" width="20" height="12" rx="2" fill="#b77a4a"/>'),
    cloudsheep: svg(
      '<g fill="#fff6fb"><circle cx="36" cy="52" r="14"/><circle cx="52" cy="44" r="16"/><circle cx="66" cy="54" r="13"/>' +
      '<circle cx="48" cy="60" r="14"/></g>' +
      '<ellipse cx="26" cy="54" rx="8" ry="9" fill="#5a4a7a"/>' +
      '<circle class="amb-eye" cx="24" cy="52" r="1.6" fill="#fff"/>' +
      '<path d="M40 72 V82 M58 70 V80" stroke="#5a4a7a" stroke-width="4" stroke-linecap="round"/>'),
    star: svg(
      '<path d="M50 8 L61 38 L93 40 L68 60 L76 92 L50 74 L24 92 L32 60 L7 40 L39 38 Z" fill="#fff2b3"/>'),

    // Welt 7: Knallhafen
    gull: svg(
      '<g class="amb-wing"><path d="M8 50 Q28 30 50 50 Q72 30 92 50 Q72 42 50 58 Q28 42 8 50 Z" fill="#f4f8ff"/></g>' +
      '<path d="M48 52 l-4 2 l4 1 z" fill="#ffd24d"/>'),
    boat: svg(
      '<path d="M48 14 V64" stroke="#8a5a3c" stroke-width="3"/>' +
      '<path d="M50 16 L76 58 H50 Z" fill="#f4f8ff"/><path d="M46 24 L28 58 H46 Z" fill="#ffb3c6"/>' +
      '<path d="M16 64 H84 L74 80 H26 Z" fill="#e0204f"/><path d="M22 70 H78" stroke="#fff" stroke-width="2"/>' +
      '<path d="M48 14 L60 18 L48 22 Z" fill="#ffd24d"/>'),
    firework: svg(
      '<g stroke-linecap="round" stroke-width="4"><path d="M50 50 L50 14 M50 50 L50 86 M50 50 L14 50 M50 50 L86 50" stroke="#ffd24d"/>' +
      '<path d="M50 50 L24 24 M50 50 L76 24 M50 50 L24 76 M50 50 L76 76" stroke="#ff4d7a"/></g>' +
      '<circle cx="50" cy="50" r="6" fill="#fff6dc"/>'),

    // Welt 8: Marzipanschloss
    flag: svg(
      '<path d="M20 4 V96" stroke="#d8c3a0" stroke-width="4"/>' +
      '<g class="amb-flagcloth"><path d="M22 8 Q46 2 70 10 Q60 22 72 34 Q46 28 22 34 Z" fill="#8a2be2"/>' +
      '<circle cx="42" cy="20" r="5" fill="#ffd24d"/></g>'),
    knight: svg(
      '<path d="M36 50 Q34 30 50 26 Q66 30 64 50 Z" fill="#c9c9d9"/>' +
      '<rect x="40" y="38" width="20" height="4" rx="2" fill="#2a1638"/>' +
      '<path d="M50 26 Q60 12 72 14 Q62 20 56 28 Z" fill="#e0204f"/>' +
      '<path d="M36 50 H64 L62 78 H38 Z" fill="#f0d9b5"/><path d="M50 50 V78" stroke="#e0204f" stroke-width="4"/>' +
      '<g class="amb-legs"><path d="M42 78 V94 M58 78 V94" stroke="#c9c9d9" stroke-width="7" stroke-linecap="round"/></g>' +
      '<path d="M66 44 V82" stroke="#d8c3a0" stroke-width="3"/><path d="M60 42 h12 l-6 -12 z" fill="#c9c9d9"/>'),
    torch: svg(
      '<path d="M44 52 H56 L53 92 H47 Z" fill="#7a4a1e"/>' +
      '<g class="amb-flame"><path d="M50 10 C64 26 62 42 56 50 H44 C38 42 36 26 50 10 Z" fill="#ff9f43"/>' +
      '<path d="M50 24 C58 34 56 44 53 50 H47 C44 44 42 34 50 24 Z" fill="#ffe08a"/></g>'),

    // Welt 9: Schillerbucht
    dolphin: svg(
      '<path d="M12 58 Q30 30 60 34 Q80 36 90 50 Q80 48 72 52 Q60 60 40 62 Q26 64 12 58 Z" fill="#4dc3ff"/>' +
      '<path d="M52 34 Q56 20 66 22 Q60 28 62 36 Z" fill="#3aa0d8"/>' +
      '<path d="M14 58 Q4 50 6 42 Q14 52 20 56 Z M14 58 Q6 66 8 74 Q16 64 20 60 Z" fill="#3aa0d8"/>' +
      '<circle class="amb-eye" cx="78" cy="44" r="2" fill="' + EYE + '"/>' +
      '<path d="M44 58 Q56 60 70 54" stroke="#c4ecff" stroke-width="3" fill="none"/>'),
    fish: svg(
      '<path d="M20 50 Q44 24 72 50 Q44 76 20 50 Z" fill="#ff9f43"/><path d="M72 50 L92 34 L88 50 L92 66 Z" fill="#ff9f43"/>' +
      '<path d="M40 38 V62 M52 36 V64" stroke="#fff2c4" stroke-width="3"/>' +
      '<circle class="amb-eye" cx="30" cy="47" r="2.4" fill="' + EYE + '"/>'),
    chameleon: svg(
      '<path d="M10 86 H90" stroke="#8a5a3c" stroke-width="6" stroke-linecap="round"/>' +
      '<g class="amb-shift"><path d="M22 74 Q24 50 50 48 Q72 48 76 64 Q78 74 70 78 H30 Z" fill="#13b371"/>' +
      '<path d="M70 58 Q86 52 88 62 Q84 70 74 70 Z" fill="#13b371"/>' +
      '<path d="M22 74 Q8 72 10 60 Q14 52 22 56 Q16 60 20 66" stroke="#13b371" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<path d="M36 52 l4 -6 l4 6 l4 -6 l4 6" stroke="#4dffb0" stroke-width="2" fill="none"/></g>' +
      '<circle cx="80" cy="60" r="5" fill="#fff"/><circle class="amb-eye" cx="81" cy="60" r="2.4" fill="' + EYE + '"/>' +
      '<path d="M36 78 V86 M64 78 V86" stroke="#0f8a58" stroke-width="5" stroke-linecap="round"/>'),

    // Welt 10: Bitterburg
    bat: svg(
      '<g class="amb-wing"><path d="M50 50 Q36 30 10 34 Q20 42 16 52 Q28 48 34 58 Q42 50 50 56 Q58 50 66 58 Q72 48 84 52 Q80 42 90 34 Q64 30 50 50 Z" fill="#3a2458"/></g>' +
      '<ellipse cx="50" cy="52" rx="8" ry="10" fill="#2a1638"/>' +
      '<path d="M44 44 L46 36 L49 43 M56 44 L54 36 L51 43" fill="#2a1638"/>' +
      '<circle cx="47" cy="50" r="1.6" fill="#ff4d7a"/><circle cx="53" cy="50" r="1.6" fill="#ff4d7a"/>'),
    ghost: svg(
      '<path d="M26 90 V44 Q26 16 50 16 Q74 16 74 44 V90 L66 82 L58 90 L50 82 L42 90 L34 82 Z" fill="#e6dcff" opacity="0.85"/>' +
      '<g class="amb-eye"><ellipse cx="42" cy="44" rx="4" ry="6" fill="#3a2458"/><ellipse cx="58" cy="44" rx="4" ry="6" fill="#3a2458"/></g>' +
      '<ellipse cx="50" cy="60" rx="5" ry="4" fill="#3a2458"/>')
  };

  // ---------- Welten: Farben, Horizont, Figuren ----------

  // anim: Bewegung (css/ambient.css); game/map: Plätze im Spiel bzw. Gewicht auf der Karte.
  var WORLDS = {
    1: { sky: ['#160c3a', '#3b2470'], figures: [
      { f: 'gingerbread', anim: 'bob' }, { f: 'cat', anim: 'still' }, { f: 'lantern', anim: 'float' }] },
    2: { sky: ['#061436', '#1f4f86'], fall: 'snowflake', figures: [
      { f: 'hare', anim: 'hop' }, { f: 'snowman', anim: 'sway' }, { f: 'snowflake', anim: 'spin' }] },
    3: { sky: ['#24103a', '#8a4a3a'], figures: [
      { f: 'camel', anim: 'walk' }, { f: 'cactus', anim: 'sway' }, { f: 'sparkle', anim: 'twinkle' }] },
    4: { sky: ['#071f16', '#1a5a3c'], rise: 'bubble', figures: [
      { f: 'parrot', anim: 'bob' }, { f: 'monkey', anim: 'swing' }, { f: 'bubble', anim: 'float' }] },
    5: { sky: ['#260c2c', '#7a2e5c'], fall: 'petal', figures: [
      { f: 'bee', anim: 'buzz' }, { f: 'bird', anim: 'still' }, { f: 'petal', anim: 'spin' }] },
    6: { sky: ['#2a1f6a', '#7a5ab8'], figures: [
      { f: 'balloon', anim: 'float' }, { f: 'cloudsheep', anim: 'bob' }, { f: 'star', anim: 'twinkle' }] },
    7: { sky: ['#081634', '#1d4a86'], figures: [
      { f: 'gull', anim: 'glide' }, { f: 'boat', anim: 'rock' }, { f: 'firework', anim: 'burst' }] },
    8: { sky: ['#1e0f2a', '#5a2f5e'], figures: [
      { f: 'flag', anim: 'still' }, { f: 'knight', anim: 'walk' }, { f: 'torch', anim: 'still' }] },
    9: { sky: ['#052434', '#17788a'], figures: [
      { f: 'dolphin', anim: 'jump' }, { f: 'fish', anim: 'swim' }, { f: 'chameleon', anim: 'still' }] },
    10: { sky: ['#07040e', '#34102a'], figures: [
      { f: 'bat', anim: 'flutter' }, { f: 'ghost', anim: 'haunt' }, { f: 'torch', anim: 'still' }] }
  };

  // Kleine Szenen: ab und zu zieht ein Bewohner quer durchs Bild (etwa einmal je Minute).
  // f: Figur, move: Eigenbewegung unterwegs, at: Höhe ('bottom' oder 'top' in Prozent),
  // size: Größe in vmin, dur: Dauer eines Durchlaufs in Sekunden, rev: von rechts nach links,
  // flock: mehrere hintereinander.
  var SCENES = {
    1: { f: 'gingerbread', move: 'bob', bottom: 6, size: 9, dur: 64 },
    2: { f: 'hare', move: 'hop', bottom: 5, size: 8, dur: 58 },
    3: { f: 'camel', move: 'bob', bottom: 6, size: 13, dur: 80 },
    4: { f: 'parrotfly', move: 'float', top: 16, size: 9, dur: 56 },
    5: { f: 'bee', move: 'buzz', top: 30, size: 6, dur: 52 },
    6: { f: 'balloon', move: 'float', top: 10, size: 12, dur: 96 },
    7: { f: 'boat', move: 'rock', bottom: 9, size: 10, dur: 84 },
    8: { f: 'knight', move: 'bob', bottom: 5, size: 9, dur: 72 },
    9: { f: 'fish', move: 'bob', bottom: 7, size: 6, dur: 60, rev: true, flock: 3 },
    10: { f: 'bat', move: 'flutter', top: 14, size: 7, dur: 54, flock: 3 }
  };

  // Horizont-Silhouetten (Feld 0 0 400 100, unten bündig).
  var HORIZON = {
    1: '<path d="M0 100 V70 L20 70 L20 56 L36 44 L52 56 L52 70 L70 70 L70 50 L92 34 L114 50 L114 70 L140 70 L140 60 L156 48 L172 60 L172 70 L200 70 L200 46 L222 30 L244 46 L244 70 L270 70 L270 58 L288 44 L306 58 L306 70 L330 70 L330 52 L350 38 L370 52 L370 70 L400 70 V100 Z" fill="#241544"/>' +
      '<g class="amb-windows" fill="#ffd78c"><rect x="30" y="58" width="6" height="7"/><rect x="86" y="54" width="7" height="8"/><rect x="152" y="60" width="6" height="6"/>' +
      '<rect x="216" y="50" width="7" height="8"/><rect x="230" y="58" width="6" height="7"/><rect x="284" y="58" width="6" height="7"/><rect x="346" y="56" width="6" height="7"/></g>',
    2: '<path d="M0 100 V64 L40 30 L70 52 L110 14 L150 56 L180 36 L220 64 L262 22 L300 58 L336 34 L370 54 L400 40 V100 Z" fill="#1d3a6e"/>' +
      '<path d="M40 30 L52 40 L44 42 L36 38 Z M110 14 L126 30 L116 30 L104 24 Z M262 22 L276 36 L266 36 L254 32 Z M336 34 L348 44 L340 46 L330 42 Z" fill="#e8f8ff"/>',
    3: '<path d="M0 100 V70 Q60 50 120 66 T240 62 T400 60 V100 Z" fill="#7c4226"/>' +
      '<path d="M250 64 L290 22 L330 64 Z" fill="#9a5a2e"/><path d="M290 22 L330 64 L300 64 Z" fill="#7c4226"/>' +
      '<path d="M0 100 V84 Q100 72 200 84 T400 80 V100 Z" fill="#5e301c"/>',
    4: '<path d="M0 100 V58 Q20 30 44 52 Q60 20 86 50 Q104 26 130 52 Q150 34 170 54 Q196 18 222 50 Q244 28 266 54 Q290 22 316 50 Q338 30 360 54 Q380 36 400 48 V100 Z" fill="#0f3322"/>' +
      '<path d="M60 100 V60 M200 100 V56 M330 100 V58" stroke="#0a2618" stroke-width="10"/>',
    5: '<path d="M0 100 V80 H400 V100 Z" fill="#3a1630"/>' +
      '<g fill="#5c2440"><circle cx="50" cy="56" r="26"/><circle cx="150" cy="50" r="30"/><circle cx="260" cy="58" r="24"/><circle cx="350" cy="52" r="28"/></g>' +
      '<g fill="#ff8fb3" opacity="0.55"><circle cx="40" cy="50" r="12"/><circle cx="160" cy="42" r="14"/><circle cx="250" cy="52" r="10"/><circle cx="356" cy="44" r="12"/></g>' +
      '<path d="M50 80 V70 M150 80 V72 M260 80 V72 M350 80 V70" stroke="#2a0f22" stroke-width="8"/>',
    6: '<g fill="#e7d3ff" opacity="0.55"><circle cx="40" cy="80" r="40"/><circle cx="110" cy="70" r="44"/><circle cx="190" cy="84" r="40"/>' +
      '<circle cx="260" cy="68" r="46"/><circle cx="340" cy="80" r="42"/><circle cx="400" cy="74" r="36"/></g>' +
      '<g fill="#fff4fb" opacity="0.7"><circle cx="70" cy="96" r="34"/><circle cx="160" cy="98" r="36"/><circle cx="240" cy="96" r="34"/><circle cx="330" cy="98" r="38"/></g>',
    7: '<path d="M330 100 V40 L338 28 L346 40 V100 Z" fill="#f4f8ff"/><path d="M330 52 H346 M330 68 H346" stroke="#e0204f" stroke-width="7"/>' +
      '<path d="M326 28 H350 L338 16 Z" fill="#2a1638"/><circle cx="338" cy="30" r="4" fill="#ffd24d"/>' +
      '<g class="amb-beam"><path d="M338 30 L260 16 L262 40 Z" fill="#fff2b3" opacity="0.25"/></g>' +
      '<path d="M0 100 V74 Q25 66 50 74 T100 74 T150 74 T200 74 T250 74 T300 74 T350 74 T400 74 V100 Z" fill="#14336a"/>' +
      '<path d="M0 100 V86 Q25 80 50 86 T100 86 T150 86 T200 86 T250 86 T300 86 T350 86 T400 86 V100 Z" fill="#0c2552"/>',
    8: '<path d="M0 100 V70 H40 V44 H34 V36 H40 V30 H48 V36 H56 V30 H64 V36 H70 V44 H64 V70 H120 V50 H170 V24 H164 V16 H172 V8 H178 V16 H186 V8 H192 V16 H200 V24 H194 V50 H240 V70 H300 V40 H294 V32 H300 V26 H308 V32 H316 V26 H324 V32 H330 V40 H324 V70 H400 V100 Z" fill="#3a1f48"/>' +
      '<g class="amb-windows" fill="#ffb347"><rect x="48" y="50" width="6" height="9" rx="3"/><rect x="178" y="30" width="6" height="9" rx="3"/><rect x="306" y="46" width="6" height="9" rx="3"/></g>',
    9: '<path d="M0 100 V62 Q25 54 50 62 T100 62 T150 62 T200 62 T250 62 T300 62 T350 62 T400 62 V100 Z" fill="#126a7c" class="amb-wave"/>' +
      '<path d="M0 100 V78 Q25 70 50 78 T100 78 T150 78 T200 78 T250 78 T300 78 T350 78 T400 78 V100 Z" fill="#0c4e5e"/>' +
      '<path d="M0 100 V92 Q100 86 200 92 T400 90 V100 Z" fill="#e0c08a"/>',
    10: '<path d="M0 100 V60 L30 60 L30 40 L40 30 L50 40 L50 60 L120 60 L120 30 L110 30 L130 4 L150 30 L140 30 L140 60 L220 60 L220 44 L250 20 L280 44 L280 60 L340 60 L340 36 L360 18 L380 36 L380 60 L400 60 V100 Z" fill="#12091c"/>' +
      '<g class="amb-windows" fill="#ff4d7a"><rect x="126" y="36" width="6" height="8"/><rect x="246" y="38" width="7" height="9"/><rect x="356" y="40" width="6" height="8"/></g>'
  };

  // Plätze der Figuren im Spielbildschirm (Prozent des Fensters) - Ränder, nie mittig oben.
  var GAME_SPOTS = [
    { left: 2, bottom: 6, size: 15 },
    { right: 3, bottom: 8, size: 13 },
    { right: 3, top: 1, size: 8 }
  ];
  // Zusätzliche Plätze nur auf breiten Fenstern (css/ambient.css: .amb-wide ab 900 px).
  var WIDE_SPOTS = [
    { left: 4, top: 36, size: 12 },
    { right: 5, top: 44, size: 11 }
  ];

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    return n;
  }

  function figureNode(def, spot, delay) {
    var n = el('div', 'amb-fig amb-' + def.f + ' amb-anim-' + def.anim);
    Object.keys(spot).forEach(function (k) {
      if (k === 'size') { n.style.width = 'clamp(42px, ' + spot.size + 'vmin, 150px)'; }
      else { n.style[k] = spot[k] + '%'; }
    });
    n.style.animationDelay = delay + 's';
    n.innerHTML = F[def.f];
    return n;
  }

  // Eine kleine Szene: Bewohner, die ab und zu quer durchs Bild ziehen.
  function sceneNode(worldId, delay) {
    var sc = SCENES[worldId];
    if (!sc) { return null; }
    var n = el('div', 'amb-scene' + (sc.rev ? ' amb-scene--rev' : ''));
    if (sc.top !== undefined) { n.style.top = sc.top + '%'; } else { n.style.bottom = sc.bottom + '%'; }
    n.style.animationDuration = sc.dur + 's';
    n.style.animationDelay = (delay !== undefined ? delay : -sc.dur * 0.42) + 's';
    var count = sc.flock || 1;
    for (var i = 0; i < count; i++) {
      var f = el('div', 'amb-fig amb-' + sc.f + ' amb-anim-' + sc.move);
      f.style.width = 'clamp(26px, ' + (count > 1 ? sc.size * (1 - i * 0.18) : sc.size) + 'vmin, 120px)';
      f.style.animationDelay = (-i * 0.6) + 's';
      f.innerHTML = F[sc.f];
      n.appendChild(f);
    }
    return n;
  }

  // Hintergrund des Spielbildschirms einer Welt.
  function gameLayer(worldId) {
    var w = WORLDS[worldId] || WORLDS[1];
    var layer = el('div', 'ambient ambient--w' + worldId);
    layer.setAttribute('aria-hidden', 'true');
    layer.style.setProperty('--amb-sky-top', w.sky[0]);
    layer.style.setProperty('--amb-sky-bottom', w.sky[1]);
    var horizon = el('div', 'ambient-horizon');
    horizon.innerHTML = '<svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      (HORIZON[worldId] || HORIZON[1]) + '</svg>';
    layer.appendChild(horizon);
    // Fallende oder steigende Teilchen (Schnee, Blüten, Kaugummiblasen).
    var drift = w.fall || w.rise;
    if (drift) {
      for (var i = 0; i < 5; i++) {
        var p = el('div', 'amb-particle amb-particle--' + (w.fall ? 'fall' : 'rise'));
        p.style.left = (8 + i * 21) + '%';
        p.style.animationDelay = (-i * 3.7) + 's';
        p.style.animationDuration = (14 + (i % 3) * 4) + 's';
        p.innerHTML = F[drift];
        layer.appendChild(p);
      }
    }
    var scene = sceneNode(worldId);
    if (scene) { layer.appendChild(scene); }
    WIDE_SPOTS.forEach(function (spot, i) {
      var extra = figureNode(w.figures[(i + 1) % w.figures.length], spot, -2.1 - i * 1.9);
      extra.classList.add('amb-wide');
      layer.appendChild(extra);
    });
    w.figures.forEach(function (def, i) {
      layer.appendChild(figureNode(def, GAME_SPOTS[i], -i * 1.3));
    });
    return layer;
  }

  // Figuren und Farbschleier für Abschnitt seg (0 = unten) der langen Karte mit segs Abschnitten.
  // Zwei Figuren am linken und rechten Rand, je Abschnitt im Wechsel andere.
  function mapLayer(worldId, seg, segs) {
    var w = WORLDS[worldId] || WORLDS[1];
    var figs = w.figures;
    var a = figs[seg % figs.length];
    var b = figs[(seg + 1) % figs.length];
    var dusk = segs > 1 ? seg / (segs - 1) : 0;   // 0 unten, 1 oben am Boss
    var top = 18 + (seg * 23) % 40;
    function place(def, side, y, size, delay) {
      return '<div class="amb-fig amb-' + def.f + ' amb-anim-' + def.anim + '" style="' + side + ':3%;top:' + y +
        '%;width:' + size + '%;animation-delay:' + delay + 's">' + F[def.f] + '</div>';
    }
    return '<div class="ambient-map" aria-hidden="true" style="--amb-dusk:' + dusk.toFixed(2) + '">' +
      place(a, 'left', top, 15, -seg * 1.1) + place(b, 'right', top + 38, 13, -seg * 1.7) + '</div>';
  }

  // Eine einzelne Figur als HTML (Hauptmenü, Weltenübersicht); index wählt die Figur der Welt.
  function figure(worldId, index, cls) {
    var w = WORLDS[worldId] || WORLDS[1];
    var def = w.figures[index % w.figures.length];
    return '<span class="amb-fig amb-' + def.f + ' amb-anim-' + def.anim + (cls ? ' ' + cls : '') +
      '" aria-hidden="true" style="animation-delay:' + (-index * 1.4 - worldId * 0.7) + 's">' + F[def.f] + '</span>';
  }

  // Konfetti über dem ganzen Bildschirm (Sieg); räumt sich nach 4 s selbst weg. Bei
  // „Bewegung reduzieren“ gibt es keins.
  var CONFETTI = ['#ff4d7a', '#ffd24d', '#4dffb0', '#4dc3ff', '#c77dff', '#ff9f43', '#fff2c4'];
  function confetti(count) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return null; }
    var layer = el('div', 'amb-confetti');
    layer.setAttribute('aria-hidden', 'true');
    var n = count || 46;
    for (var i = 0; i < n; i++) {
      var p = el('span', 'amb-confetto');
      p.style.left = ((i * 37) % 100) + '%';
      p.style.background = CONFETTI[i % CONFETTI.length];
      p.style.setProperty('--amb-dx', (((i * 53) % 21) - 10) + 'vw');
      p.style.setProperty('--amb-rot', (((i * 97) % 720) - 360) + 'deg');
      p.style.animationDelay = ((i % 9) * 0.07) + 's';
      p.style.animationDuration = (2.2 + (i % 5) * 0.35) + 's';
      if (i % 3 === 0) { p.style.borderRadius = '50%'; }
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(function () { if (layer.parentNode) { layer.parentNode.removeChild(layer); } }, 4200);
    return layer;
  }

  // Goldener Lichtblitz über dem ganzen Bildschirm (Bosssieg); räumt sich selbst weg.
  function flash() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return null; }
    var f = el('div', 'amb-flash');
    f.setAttribute('aria-hidden', 'true');
    document.body.appendChild(f);
    setTimeout(function () { if (f.parentNode) { f.parentNode.removeChild(f); } }, 1300);
    return f;
  }

  RS.UI.Ambient = { gameLayer: gameLayer, mapLayer: mapLayer, figure: figure, confetti: confetti, flash: flash,
    scene: sceneNode, WORLDS: WORLDS, SCENES: SCENES, FIGURES: F };
})(window.RS = window.RS || {});

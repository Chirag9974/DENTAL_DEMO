/* Runs before first paint: saved choice wins, then the OS preference, then full motion. */
(function () {
  var mode = 'full';
  try {
    var saved = window.localStorage.getItem('tc-motion');
    if (saved === 'full' || saved === 'calm') {
      mode = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mode = 'calm';
    }
  } catch (e) {
    /* storage blocked — keep the default */
  }
  document.documentElement.setAttribute('data-motion', mode);
})();

'use strict';
(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const valid = params.size === 1 && /^(?:[A-HJ-NP-Z2-9]{6}|123456)$/.test(code ?? "");
  document.getElementById(valid ? 'invitation' : 'invalid').hidden = false;
  if (!valid) return;
  document.getElementById('code').textContent = code;
  document.getElementById('open').href = 'com.kevincarter.gameprefs://invite?code=' + code;
  document.getElementById('copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      document.getElementById('copied').textContent = 'Code copied.';
    } catch {
      document.getElementById('copied').textContent = 'Select the code above to copy it.';
    }
  });
  // This first-party file is operator-controlled. No destination comes from the invite URL.
  fetch('invite-distribution.json', {credentials: 'omit', referrerPolicy: 'no-referrer'})
    .then(response => response.ok ? response.json() : null)
    .then(config => {
      if (!config || !['beta', 'appStore'].includes(config.mode)) return;
      const url = new URL(config.url);
      const validDestination = url.protocol === 'https:' && !url.username && !url.password && !url.port &&
        ((config.mode === 'beta' && url.hostname === 'testflight.apple.com' && /^\/join\/[a-zA-Z0-9]+$/.test(url.pathname)) ||
         (config.mode === 'appStore' && url.hostname === 'apps.apple.com' && /\/id[0-9]+$/.test(url.pathname)));
      if (!validDestination || url.search || url.hash) return;
      const link = document.createElement('a');
      link.href = url.href;
      link.textContent = config.mode === 'beta' ? 'Join the GameOrbit beta' : 'Get GameOrbit on the App Store';
      document.getElementById('distribution').replaceChildren(link);
    }).catch(() => {});
})();

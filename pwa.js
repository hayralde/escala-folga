// ============================================================
// INSTALAÇÃO COMO APP (PWA)
// ============================================================
let installPrompt = null;

function setInstallVisible(show) {
  document.querySelectorAll('.install-btn').forEach(b => b.classList.toggle('hidden', !show));
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

async function installApp() {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  setInstallVisible(false);
}

// Chrome/Edge/Android: o navegador avisa quando o app pode ser instalado
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  setInstallVisible(true);
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  setInstallVisible(false);
  toast('App instalado!');
});

// iPhone/iPad não têm botão de instalação: mostra a instrução manual
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone()) {
  document.getElementById('ios-install-hint')?.classList.remove('hidden');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

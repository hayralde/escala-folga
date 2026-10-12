// ============================================================
// INSTALAÇÃO COMO APP (PWA)
// ============================================================
// A opção "Instalar app" fica sempre visível (exceto quando já está aberto como app).
// Se o navegador oferecer a instalação direta (Chrome/Edge/Android), abre a janela dele;
// senão, mostra o passo a passo para o aparelho/navegador em uso.
let installPrompt = null;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function setInstallVisible(show) {
  document.querySelectorAll('.install-btn').forEach(b => b.classList.toggle('hidden', !show));
}

function detectarPlataforma() {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return 'ios';
  if (/android/i.test(ua)) {
    if (/samsungbrowser/i.test(ua)) return 'android-samsung';
    if (/firefox/i.test(ua)) return 'android-firefox';
    return 'android';
  }
  if (/firefox/i.test(ua)) return 'desktop-firefox';
  if (/safari/i.test(ua) && !/chrome|chromium|edg/i.test(ua)) return 'desktop-safari';
  return 'desktop';
}

const PASSOS_INSTALACAO = {
  'ios': [
    'Abra este site no <strong>Safari</strong>.',
    'Toque em <strong>Compartilhar</strong> <i class="fas fa-arrow-up-from-bracket"></i> na barra inferior.',
    'Escolha <strong>Adicionar à Tela de Início</strong> e toque em <strong>Adicionar</strong>.'
  ],
  'android': [
    'Toque no menu <strong>⋮</strong> do Chrome (canto superior direito).',
    'Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.',
    'Confirme em <strong>Instalar</strong>.'
  ],
  'android-samsung': [
    'Toque no menu <strong>☰</strong> na barra inferior.',
    'Escolha <strong>Adicionar página a</strong> → <strong>Tela inicial</strong>.',
    'Confirme em <strong>Adicionar</strong>.'
  ],
  'android-firefox': [
    'Toque no menu <strong>⋮</strong> do Firefox.',
    'Escolha <strong>Instalar</strong> ou <strong>Adicionar à tela inicial</strong>.',
    'Confirme em <strong>Adicionar</strong>.'
  ],
  'desktop': [
    'No Chrome ou Edge, clique no ícone de instalar <i class="fas fa-desktop"></i> no fim da barra de endereço.',
    'Ou abra o menu <strong>⋮</strong> → <strong>Transmitir, salvar e compartilhar</strong> → <strong>Instalar página como app</strong>.',
    'Confirme em <strong>Instalar</strong>.'
  ],
  'desktop-safari': [
    'No Safari (macOS Sonoma ou mais recente), abra o menu <strong>Arquivo</strong>.',
    'Escolha <strong>Adicionar ao Dock</strong>.',
    'Confirme em <strong>Adicionar</strong>.'
  ],
  'desktop-firefox': [
    'O Firefox no computador não instala apps.',
    'Abra este site no <strong>Chrome</strong> ou <strong>Edge</strong> e clique no ícone de instalar na barra de endereço.'
  ]
};

async function installApp() {
  if (installPrompt) {
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;
    if (outcome === 'accepted') setInstallVisible(false);
    return;
  }
  const passos = PASSOS_INSTALACAO[detectarPlataforma()];
  document.getElementById('install-steps').innerHTML = passos.map((p, i) => `
    <li class="flex gap-3 items-start">
      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style="background:var(--green);color:#fff">${i + 1}</span>
      <span class="text-sm pt-1">${p}</span>
    </li>`).join('');
  const m = document.getElementById('modal-install');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeInstallModal() {
  const m = document.getElementById('modal-install');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

// Chrome/Edge/Android: o navegador avisa quando o app pode ser instalado direto
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  setInstallVisible(false);
  closeInstallModal();
  toast('App instalado!');
});

setInstallVisible(!isStandalone());

// ============================================================
// CONVITE CLÁSSICO: caixa de diálogo que abre ao acessar o site
// ============================================================
// Aparece se o app não estiver instalado; "Agora não" esconde por 7 dias.
const CONVITE_KEY = 'ef_pwa_convite_dispensado';
const CONVITE_DIAS = 7;

function conviteDispensadoRecentemente() {
  try {
    const t = parseInt(localStorage.getItem(CONVITE_KEY), 10);
    return t && (Date.now() - t) < CONVITE_DIAS * 86400000;
  } catch (e) { return false; }
}

function abrirConvitePwa() {
  const m = document.getElementById('modal-pwa');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function fecharConvitePwa() {
  const m = document.getElementById('modal-pwa');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

function dispensarConvitePwa() {
  try { localStorage.setItem(CONVITE_KEY, String(Date.now())); } catch (e) {}
  fecharConvitePwa();
}

function instalarPeloConvite() {
  fecharConvitePwa();
  installApp();
}

window.addEventListener('appinstalled', fecharConvitePwa);

if (!isStandalone() && !conviteDispensadoRecentemente()) {
  window.addEventListener('load', () => setTimeout(() => {
    // Não abre por cima de outra janela (ex.: instruções já abertas)
    if (!isStandalone() && document.querySelectorAll('.modal-backdrop.flex').length === 0) abrirConvitePwa();
  }, 1500));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

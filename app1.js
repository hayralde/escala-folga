// ============================================================
// DADOS INICIAIS (referência: tabela oficial de Setembro 2026)
// ============================================================
const INITIAL_DATA = {
  config: {
    titulo: "Elétrica & Cogeração",
    dataVersion: 3
  },
  users: [
    { matricula: "779", nome: "ADRIEL SODRE DOS SANTOS" },
    { matricula: "254", nome: "CARLOS JOSE BARBOSA DA SILVA" },
    { matricula: "88", nome: "EDSON CARLOS SCATOLIN" },
    { matricula: "750", nome: "MARINILSON GONCALVES FERREIRA", ciclo: 7 },
    { matricula: "707", nome: "JADSON SAMPAIO DA SILVA" },
    { matricula: "888", nome: "LEANDRO SOUZA SARAIVA" },
    { matricula: "719", nome: "LUCAS SOARES DE OLIVEIRA DOS SANTOS" },
    { matricula: "229", nome: "MARCIO IDEIGLAN DA CONCEICAO SILVA" },
    { matricula: "884", nome: "NIBSON MACENA DA SILVA" },
    { matricula: "195", nome: "VALTER JOSE DA SILVA CANDIDO" },
    { matricula: "241", nome: "VANDERLEY DA GAMA FERREIRA" }
  ],
  schedules: {
    "2026-09": {
      titulo: "ESCALA DE FOLGA DO MÊS DE SETEMBRO 2026",
      diasNoMes: 30,
      data: {
        "779": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "254": ["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],
        "88": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "750": ["","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","",""],
        "707": ["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],
        "888": ["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],
        "719": ["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],
        "229": ["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],
        "884": ["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],
        "195": ["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],
        "241": ["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"]
      }
    },
    "2026-10": {
      titulo: "ESCALA DE FOLGA DO MÊS DE OUTUBRO 2026",
      diasNoMes: 31,
      data: {
        "779": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],
        "254": ["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],
        "88": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],
        "750": ["","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","","","","",""],
        "707": ["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],
        "888": ["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "719": ["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],
        "229": ["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "884": ["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "195": ["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],
        "241": ["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""]
      }
    },
    "2026-11": {
      titulo: "ESCALA DE FOLGA DO MÊS DE NOVEMBRO 2026",
      diasNoMes: 30,
      data: {
        "779": ["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],
        "254": ["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],
        "88": ["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],
        "750": ["F","","","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F",""],
        "707": ["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],
        "888": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "719": ["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],
        "229": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "884": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "195": ["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],
        "241": ["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""]
      }
    },
    "2026-12": {
      titulo: "ESCALA DE FOLGA DO MÊS DE DEZEMBRO 2026",
      diasNoMes: 31,
      data: {
        "779": ["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],
        "254": ["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],
        "88": ["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],
        "750": ["","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","","",""],
        "707": ["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],
        "888": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],
        "719": ["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],
        "229": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],
        "884": ["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],
        "195": ["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],
        "241": ["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""]
      }
    }
  }
};


// ============================================================
// ESTADO
// ============================================================
let DB = null;
let currentUser = null;
let editMode = false;
let loginType = 'user';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Mês exibido por padrão: o mês atual do calendário; se não houver escala, o cadastrado mais próximo
function mesPadrao() {
  const keys = Object.keys(DB.schedules).sort();
  const now = new Date();
  const atual = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const anteriores = keys.filter(k => k <= atual);
  return anteriores.length ? anteriores[anteriores.length - 1] : keys[0];
}

// Ciclo de folga contínuo entre meses: conta os dias a partir de 01/09/2026
const CICLO_PADRAO = 6;
function userCiclo(matricula) {
  return DB.users.find(u => u.matricula === matricula)?.ciclo || CICLO_PADRAO;
}
function cycleDay(mesKey, dayIdx, ciclo = CICLO_PADRAO) {
  const [y, m] = mesKey.split('-').map(Number);
  const n = Math.round((Date.UTC(y, m - 1, dayIdx + 1) - Date.UTC(2026, 8, 1)) / 86400000);
  return ((n % ciclo) + ciclo) % ciclo;
}

// ============================================================
// PERSISTÊNCIA
// ============================================================
const SUPABASE_URL = 'https://rsqbbcsaqmxfriwwbamv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yCxFBZus6N2UHxY2W8Xdmw_Jo7SCFIx';
const CACHE_KEY = 'portal_escala_folga';
let adminSenha = null;   // guardada só em memória enquanto o admin está logado
let dbOffline = false;   // true quando os dados vieram do cache local

async function sbFetch(path, options = {}) {
  const r = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || ('HTTP ' + r.status));
  }
  return r.status === 204 ? null : r.json();
}

function sbRpc(fn, args) {
  return sbFetch('/rest/v1/rpc/' + fn, { method: 'POST', body: JSON.stringify(args) });
}

async function loadDB() {
  try {
    const rows = await sbFetch('/rest/v1/escala_folga?id=eq.main&select=data');
    if (!rows.length) throw new Error('sem dados');
    DB = rows[0].data;
    dbOffline = false;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(DB)); } catch (e) {}
  } catch (e) {
    // Sem conexão com o banco: usa a última cópia do navegador (somente leitura)
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e2) {}
    DB = (cached && cached.users && cached.schedules) ? cached : JSON.parse(JSON.stringify(INITIAL_DATA));
    dbOffline = true;
  }
}

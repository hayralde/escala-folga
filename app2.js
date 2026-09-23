const APP_VERSION = 'v2.0.0';

let saveQueue = Promise.resolve();

// Grava no Supabase (só admin logado). As gravações são enfileiradas para manter a ordem.
function saveDB() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(DB)); } catch (e) {}
  if (!adminSenha) return Promise.resolve(false);
  const snapshot = JSON.parse(JSON.stringify(DB));
  saveQueue = saveQueue
    .then(() => sbRpc('escala_folga_save', { p_password: adminSenha, p_data: snapshot }))
    .then(() => true, e => { toast('Erro ao salvar no servidor: ' + e.message, true); return false; });
  return saveQueue;
}

function setLoginType(type) {
  loginType = type;
  document.getElementById('btn-tipo-user').classList.toggle('active', type === 'user');
  document.getElementById('btn-tipo-admin').classList.toggle('active', type === 'admin');
  document.getElementById('login-user-fields').classList.toggle('hidden', type !== 'user');
  document.getElementById('login-admin-fields').classList.toggle('hidden', type !== 'admin');
  document.getElementById('login-error').classList.add('hidden');
}

// Tema claro/escuro: a escolha fica só neste aparelho
function toggleTheme() {
  const novo = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', novo);
  try { localStorage.setItem('ef_theme', novo); } catch (e) {}
  syncThemeIcons();
}

function syncThemeIcons() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('.theme-btn i').forEach(i => { i.className = dark ? 'fas fa-sun' : 'fas fa-moon'; });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0F2015' : '#174A2B');
}

async function doLogin() {
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  const showErr = msg => { err.textContent = msg; err.classList.remove('hidden'); };
  if (!DB) { showErr('Carregando dados, tente novamente em instantes.'); return; }
  if (loginType === 'admin') {
    const senha = document.getElementById('input-senha').value;
    if (dbOffline) await loadDB();
    if (dbOffline) { showErr('Sem conexão com o servidor. O acesso de administrador requer internet.'); return; }
    let ok = false;
    try { ok = await sbRpc('escala_folga_check', { p_password: senha }); }
    catch (e) { showErr('Erro ao conectar: ' + e.message); return; }
    if (!ok) { showErr('Senha incorreta.'); return; }
    adminSenha = senha;
    currentUser = { type: 'admin' };
  } else {
    const mat = document.getElementById('input-matricula').value.trim();
    const user = DB.users.find(u => u.matricula === mat);
    if (!user) {
      err.textContent = 'Matrícula não encontrada.';
      err.classList.remove('hidden');
      return;
    }
    currentUser = { type: 'user', matricula: user.matricula, nome: user.nome };
  }
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderApp();
}

function doLogout() {
  currentUser = null;
  adminSenha = null;
  editMode = false;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('input-matricula').value = '';
  document.getElementById('input-senha').value = '';
  document.getElementById('login-error').classList.add('hidden');
}

function renderTitulo() {
  const titulo = DB.config.titulo || 'Elétrica & Cogeração';
  document.getElementById('header-subtitle').textContent = titulo;
  document.getElementById('login-titulo').textContent = titulo;
}

function renderApp() {
  renderTitulo();
  const isAdmin = currentUser.type === 'admin';
  document.getElementById('admin-nav').classList.toggle('hidden', !isAdmin);
  // Espaço para a barra inferior do admin
  document.getElementById('main').style.paddingBottom = isAdmin ? '110px' : '';
  document.getElementById('app-footer').style.paddingBottom = isAdmin ? '90px' : '';
  if (isAdmin) {
    document.getElementById('user-badge').innerHTML = '<span class="avatar" style="width:40px;height:40px;background:var(--green)" title="Administrador"><i class="fas fa-shield-halved" style="color:#FFD35C"></i></span>';
    showSection('admin-dashboard');
  } else {
    const u = DB.users.find(x => x.matricula === currentUser.matricula) || currentUser;
    document.getElementById('user-badge').innerHTML = avatarHtml(u, 40);
    document.getElementById('user-welcome').innerHTML = 'Olá, ' + esc(primeiroNome(currentUser.nome)) + ' <i class="fas fa-leaf text-lg" style="color:var(--green-2)"></i>';
    showSection('user-escala');
  }
}

function showSection(id) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById('section-' + id);
  if (el) { el.classList.remove('hidden'); el.classList.add('fade-in'); }
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === id));
  document.getElementById('fab-add').classList.toggle('hidden', id !== 'admin-usuarios');
  window.scrollTo({ top: 0 });
  if (id === 'user-escala') renderUserEscala();
  if (id === 'admin-dashboard') renderDashboard();
  if (id === 'admin-escala') renderAdminEscala();
  if (id === 'admin-usuarios') renderUsers();
  if (id === 'admin-config') { renderMeses(); renderConfig(); }
}

function fillMesSelect(selectId) {
  const sel = document.getElementById(selectId);
  const keys = Object.keys(DB.schedules).sort().reverse();
  // Mantém o mês escolhido pelo usuário; só usa o padrão na primeira vez
  const atual = keys.includes(sel.value) ? sel.value : mesPadrao();
  sel.innerHTML = keys.map(k => `<option value="${k}" ${k === atual ? 'selected' : ''}>${mesLabel(k)}</option>`).join('');
}

const WEEKDAYS_SEG = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

function renderUserEscala() {
  fillMesSelect('user-mes-select');
  const mesKey = document.getElementById('user-mes-select').value || mesPadrao();
  const sched = DB.schedules[mesKey];
  if (!sched) return;
  const [year, month] = mesKey.split('-').map(Number);
  const mm = String(month).padStart(2, '0');
  const dias = sched.data[currentUser.matricula] || Array(sched.diasNoMes).fill('');
  const folgas = dias.map((d, i) => d === 'F' ? i + 1 : null).filter(Boolean);
  const ciclo = userCiclo(currentUser.matricula);
  document.getElementById('user-mes-info').textContent = sched.titulo || mesLabel(mesKey);
  document.getElementById('user-cal-title').textContent = mesLabel(mesKey);
  document.getElementById('user-ciclo').textContent = 'Folga a cada ' + ciclo + ' dias';
  document.getElementById('user-status').innerHTML = statusHtml(currentUser.matricula);
  document.getElementById('stat-folgas').textContent = folgas.length;
  document.getElementById('stat-trabalho').textContent = sched.diasNoMes - folgas.length;
  const today = new Date();
  const isMesAtual = year === today.getFullYear() && month === today.getMonth() + 1;
  let proxima = '—';
  if (isMesAtual) {
    const next = folgas.find(d => d >= today.getDate());
    if (next) proxima = next + '/' + mm;
  } else if (folgas.length) {
    proxima = folgas[0] + '/' + mm;
  }
  document.getElementById('stat-proxima').textContent = proxima;
  // Semana começa na segunda-feira
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  let html = WEEKDAYS_SEG.map(w => `<div class="wd">${w}</div>`).join('');
  for (let i = 0; i < offset; i++) html += '<div></div>';
  for (let d = 1; d <= sched.diasNoMes; d++) {
    const isFolga = dias[d - 1] === 'F';
    const isToday = isMesAtual && d === today.getDate();
    html += `<div class="day ${isFolga ? 'folga' : ''} ${isToday ? 'hoje' : ''}"><span class="n">${d}</span><span class="t">${isFolga ? 'FOLGA' : 'TRAB'}</span></div>`;
  }
  document.getElementById('user-calendar').innerHTML = html;
  document.getElementById('user-lista-folgas').innerHTML = folgas.length
    ? folgas.map(d => `<span class="pill pill-gold font-semibold"><i class="fas fa-leaf text-[10px]"></i>${d}/${mm}</span>`).join('')
    : '<span class="text-sm muted">Nenhuma folga neste mês</span>';
}

function renderDashboard() {
  const users = [...DB.users].sort((a, b) => a.nome.localeCompare(b.nome));
  document.getElementById('dash-users').textContent = users.length;
  document.getElementById('dash-meses').textContent = Object.keys(DB.schedules).length;
  document.getElementById('dash-avatars').innerHTML = users.slice(0, 4).map(u => `<span style="box-shadow:0 0 0 2px #2E7D32;border-radius:50%">${avatarHtml(u, 36)}</span>`).join('')
    + (users.length > 4 ? `<span class="avatar" style="width:36px;height:36px;font-size:12px;background:#F5F1E8;color:#174A2B;box-shadow:0 0 0 2px #2E7D32">+${users.length - 4}</span>` : '');
  const mes = mesPadrao();
  const sched = DB.schedules[mes];
  document.getElementById('dash-mes-ativo').textContent = mes ? mesLabel(mes) + ' • ' + (DB.config.titulo || 'Elétrica & Cogeração') : '—';
  const hoje = new Date();
  document.getElementById('dash-hoje-data').textContent = String(hoje.getDate()).padStart(2, '0') + '/' + String(hoje.getMonth() + 1).padStart(2, '0');
  const deFolga = users.filter(u => statusHoje(u.matricula) === 'folga');
  document.getElementById('dash-hoje').innerHTML = deFolga.length
    ? deFolga.map(u => `<span class="pill" style="padding:.25rem .75rem .25rem .25rem">${avatarHtml(u, 26)}<span class="font-medium text-strong">${esc(primeiroNome(u.nome))}</span></span>`).join('')
    : '<span class="text-sm muted">Ninguém de folga hoje</span>';
  if (!sched) { document.getElementById('dash-folgas').textContent = 0; document.getElementById('dash-barras').innerHTML = ''; return; }
  let totalF = 0;
  const contagem = users.map(u => {
    const n = (sched.data[u.matricula] || []).filter(x => x === 'F').length;
    totalF += n;
    return { u, n };
  });
  document.getElementById('dash-folgas').textContent = totalF;
  const max = Math.max(1, ...contagem.map(c => c.n));
  document.getElementById('dash-barras').innerHTML = contagem.map(({ u, n }) => `
    <div class="flex items-center gap-3">
      ${avatarHtml(u, 30)}
      <div class="flex-1 min-w-0">
        <div class="flex justify-between text-sm mb-1"><span class="font-medium text-strong truncate">${esc(primeiroNome(u.nome))}</span><span class="text-xs muted shrink-0">${n} folgas</span></div>
        <div class="bar"><span style="width:${(n / max) * 100}%;background:${avatarCor(u.matricula)}"></span></div>
      </div>
    </div>`).join('');
}

function renderAdminEscala() {
  fillMesSelect('admin-mes-select');
  const mesKey = document.getElementById('admin-mes-select').value || mesPadrao();
  const sched = DB.schedules[mesKey];
  const table = document.getElementById('admin-table');
  if (!sched) {
    document.getElementById('admin-table-header').innerHTML = '';
    document.getElementById('admin-table-body').innerHTML = '<tr><td class="p-4 muted">Nenhuma escala neste mês</td></tr>';
    return;
  }
  const { mes: mesHoje, idx: idxHoje } = hojeKey();
  table.classList.toggle('editing', editMode);
  let th = `<th class="sticky-col col-mat px-3 py-2.5 text-left text-xs whitespace-nowrap">Mat.</th><th class="sticky-col col-nome px-3 py-2.5 text-left text-xs whitespace-nowrap">Colaborador</th>`;
  for (let d = 1; d <= sched.diasNoMes; d++) {
    const hoje = mesKey === mesHoje && d - 1 === idxHoje;
    th += `<th class="px-1 py-2.5 text-center text-xs min-w-[30px]" ${hoje ? 'style="color:var(--gold)"' : ''}>${String(d).padStart(2, '0')}</th>`;
  }
  document.getElementById('admin-table-header').innerHTML = th;
  const sorted = [...DB.users].sort((a, b) => a.nome.localeCompare(b.nome));
  let body = '';
  sorted.forEach(u => {
    const dias = sched.data[u.matricula] || Array(sched.diasNoMes).fill('');
    body += `<tr><td class="sticky-col col-mat px-3 py-1.5 font-mono text-xs muted">${esc(u.matricula)}</td><td class="sticky-col col-nome px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-strong" title="${esc(u.nome)}">${esc(u.nome)}</td>`;
    for (let i = 0; i < sched.diasNoMes; i++) {
      const isF = dias[i] === 'F';
      const hoje = mesKey === mesHoje && i === idxHoje;
      const click = editMode ? `onclick="toggleCell('${mesKey}','${esc(u.matricula)}',${i}, event)"` : '';
      body += `<td class="px-0.5 py-1 text-center" ${click} title="${editMode ? 'Toque: reprogramar ciclo | Shift+clique: limpar' : ''}"><div class="cell ${isF ? 'folga' : 'trab'} ${hoje ? 'hoje' : ''}">${isF ? 'F' : ''}</div></td>`;
    }
    body += '</tr>';
  });
  document.getElementById('admin-table-body').innerHTML = body;
  document.getElementById('edit-hint').classList.toggle('hidden', !editMode);
  document.getElementById('btn-save-escala').classList.toggle('hidden', !editMode);
  const b = document.getElementById('btn-edit-mode');
  b.innerHTML = editMode ? '<i class="fas fa-xmark"></i> Cancelar' : '<i class="fas fa-pen"></i> Editar';
  b.className = editMode ? 'btn btn-ghost' : 'btn btn-gold';
  b.style.height = '38px';
}

function toggleEditMode() {
  editMode = !editMode;
  // Cancelar edição: descarta mudanças não salvas recarregando do servidor
  if (!editMode) { loadDB().then(renderAdminEscala); return; }
  renderAdminEscala();
}

function toggleCell(mesKey, matricula, dayIdx, event) {
  if (!editMode) return;
  const sched = DB.schedules[mesKey];
  if (!sched.data[matricula]) sched.data[matricula] = Array(sched.diasNoMes).fill('');
  const arr = sched.data[matricula];
  const diasNoMes = sched.diasNoMes;
  if (event && event.shiftKey) {
    for (let i = 0; i < diasNoMes; i++) arr[i] = '';
    renderAdminEscala();
    toast('Folgas de ' + (DB.users.find(u => u.matricula === matricula)?.nome?.split(' ')[0] || matricula) + ' limpas');
    return;
  }
  const ciclo = userCiclo(matricula);
  const residual = cycleDay(mesKey, dayIdx, ciclo);
  for (let i = 0; i < diasNoMes; i++) arr[i] = (cycleDay(mesKey, i, ciclo) === residual) ? 'F' : '';
  const nomeCurto = (DB.users.find(u => u.matricula === matricula)?.nome || matricula).split(' ')[0];
  const diasMarcados = arr.map((v, i) => v === 'F' ? (i + 1) : null).filter(Boolean);
  toast(`${nomeCurto}: folgas reprogramadas → dias ${diasMarcados.join(', ')}`);
  renderAdminEscala();
}


function saveDB() {
  localStorage.setItem('portal_escala_folga', JSON.stringify(DB));
}

function setLoginType(type) {
  loginType = type;
  document.getElementById('btn-tipo-user').className = type === 'user'
    ? 'py-2.5 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 font-medium text-sm'
    : 'py-2.5 rounded-lg border-2 border-slate-200 text-slate-600 font-medium text-sm hover:border-slate-300';
  document.getElementById('btn-tipo-admin').className = type === 'admin'
    ? 'py-2.5 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 font-medium text-sm'
    : 'py-2.5 rounded-lg border-2 border-slate-200 text-slate-600 font-medium text-sm hover:border-slate-300';
  document.getElementById('login-user-fields').classList.toggle('hidden', type !== 'user');
  document.getElementById('login-admin-fields').classList.toggle('hidden', type !== 'admin');
  document.getElementById('login-error').classList.add('hidden');
}

function doLogin() {
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  if (loginType === 'admin') {
    const senha = document.getElementById('input-senha').value;
    if (senha !== DB.config.adminPassword) {
      err.textContent = 'Senha incorreta.';
      err.classList.remove('hidden');
      return;
    }
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
  editMode = false;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('input-matricula').value = '';
  document.getElementById('input-senha').value = '';
  document.getElementById('login-error').classList.add('hidden');
}

function renderApp() {
  document.getElementById('header-subtitle').textContent = DB.config.titulo || 'Elétrica & Cogeração';
  if (currentUser.type === 'admin') {
    document.getElementById('user-badge').innerHTML = '<i class="fas fa-shield-alt text-amber-500 mr-1"></i> Administrador';
    document.getElementById('admin-nav').classList.remove('hidden');
    showSection('admin-dashboard');
  } else {
    document.getElementById('user-badge').textContent = currentUser.nome.split(' ')[0];
    document.getElementById('admin-nav').classList.add('hidden');
    document.getElementById('user-welcome').textContent = 'Olá, ' + currentUser.nome.split(' ')[0] + '!';
    showSection('user-escala');
  }
}

function showSection(id) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById('section-' + id);
  if (el) { el.classList.remove('hidden'); el.classList.add('fade-in'); }
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('border-blue-400', 'text-blue-300');
    b.classList.add('border-transparent');
  });
  const active = document.querySelector(`[data-section="${id}"]`);
  if (active) { active.classList.add('border-blue-400', 'text-blue-300'); active.classList.remove('border-transparent'); }
  if (id === 'user-escala') renderUserEscala();
  if (id === 'admin-dashboard') renderDashboard();
  if (id === 'admin-escala') renderAdminEscala();
  if (id === 'admin-usuarios') renderUsers();
  if (id === 'admin-meses') renderMeses();
  if (id === 'admin-config') renderConfig();
}

function fillMesSelect(selectId) {
  const sel = document.getElementById(selectId);
  const keys = Object.keys(DB.schedules).sort().reverse();
  sel.innerHTML = keys.map(k => {
    const [y, m] = k.split('-');
    const label = MONTH_NAMES[parseInt(m)-1] + ' ' + y;
    const selected = k === DB.config.mesAtivo ? 'selected' : '';
    return `<option value="${k}" ${selected}>${label}</option>`;
  }).join('');
}

function renderUserEscala() {
  fillMesSelect('user-mes-select');
  const mesKey = document.getElementById('user-mes-select').value || DB.config.mesAtivo;
  const sched = DB.schedules[mesKey];
  if (!sched) return;
  const [year, month] = mesKey.split('-').map(Number);
  const dias = sched.data[currentUser.matricula] || Array(sched.diasNoMes).fill('');
  const folgas = dias.map((d, i) => d === 'F' ? i + 1 : null).filter(Boolean);
  document.getElementById('user-mes-info').textContent = sched.titulo || (MONTH_NAMES[month-1] + ' ' + year);
  document.getElementById('stat-folgas').textContent = folgas.length;
  document.getElementById('stat-trabalho').textContent = sched.diasNoMes - folgas.length;
  const today = new Date();
  let proxima = '—';
  if (year === today.getFullYear() && month === today.getMonth() + 1) {
    const next = folgas.find(d => d >= today.getDate());
    if (next) proxima = next + '/' + String(month).padStart(2,'0');
    else if (folgas.length) proxima = 'Nenhuma restante';
  } else if (folgas.length) {
    proxima = folgas[0] + '/' + String(month).padStart(2,'0');
  }
  document.getElementById('stat-proxima').textContent = proxima;
  const firstDay = new Date(year, month - 1, 1).getDay();
  let html = WEEKDAYS.map(w => `<div class="text-center text-xs font-semibold text-slate-400 py-1">${w}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += '<div></div>';
  for (let d = 1; d <= sched.diasNoMes; d++) {
    const isFolga = dias[d - 1] === 'F';
    const isToday = (year === today.getFullYear() && month === today.getMonth()+1 && d === today.getDate());
    const cls = isFolga ? 'folga-cell text-white' : 'bg-slate-50 text-slate-700 border border-slate-200';
    const ring = isToday ? 'ring-2 ring-blue-500 ring-offset-1' : '';
    html += `<div class="calendar-day rounded-lg flex flex-col items-center justify-center font-medium ${cls} ${ring}"><span>${d}</span>${isFolga ? '<span class="text-[9px] leading-none opacity-90">FOLGA</span>' : ''}</div>`;
  }
  document.getElementById('user-calendar').innerHTML = html;
  document.getElementById('user-lista-folgas').innerHTML = folgas.length
    ? folgas.map(d => `<span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">${d}/${String(month).padStart(2,'0')}</span>`).join('')
    : '<span class="text-slate-400">Nenhuma folga neste mês</span>';
}

function renderDashboard() {
  document.getElementById('dash-users').textContent = DB.users.length;
  document.getElementById('dash-meses').textContent = Object.keys(DB.schedules).length;
  const mes = DB.config.mesAtivo;
  if (mes && DB.schedules[mes]) {
    const [y, m] = mes.split('-');
    document.getElementById('dash-mes-ativo').textContent = MONTH_NAMES[parseInt(m)-1] + ' ' + y;
    let totalF = 0;
    Object.values(DB.schedules[mes].data).forEach(arr => totalF += arr.filter(x => x === 'F').length);
    document.getElementById('dash-folgas').textContent = totalF;
  }
}

function renderAdminEscala() {
  fillMesSelect('admin-mes-select');
  const mesKey = document.getElementById('admin-mes-select').value || DB.config.mesAtivo;
  const sched = DB.schedules[mesKey];
  if (!sched) {
    document.getElementById('admin-table-header').innerHTML = '';
    document.getElementById('admin-table-body').innerHTML = '<tr><td class="p-4 text-slate-400">Nenhuma escala neste mês</td></tr>';
    return;
  }
  let th = `<th class="sticky-col px-3 py-2 text-left font-semibold text-xs whitespace-nowrap">Mat.</th><th class="sticky-col px-3 py-2 text-left font-semibold text-xs whitespace-nowrap" style="left:70px">Colaborador</th>`;
  for (let d = 1; d <= sched.diasNoMes; d++) {
    th += `<th class="px-1 py-2 text-center font-semibold text-xs min-w-[28px]">${String(d).padStart(2,'0')}</th>`;
  }
  document.getElementById('admin-table-header').innerHTML = th;
  const sorted = [...DB.users].sort((a,b) => a.nome.localeCompare(b.nome));
  let body = '';
  sorted.forEach(u => {
    const dias = sched.data[u.matricula] || Array(sched.diasNoMes).fill('');
    body += `<tr class="border-t border-slate-100 hover:bg-slate-50"><td class="sticky-col px-3 py-1.5 font-mono text-xs text-slate-500">${u.matricula}</td><td class="sticky-col px-3 py-1.5 text-xs font-medium whitespace-nowrap max-w-[180px] truncate" style="left:70px" title="${u.nome}">${u.nome}</td>`;
    for (let i = 0; i < sched.diasNoMes; i++) {
      const isF = dias[i] === 'F';
      const cls = isF ? 'folga-cell' : 'trabalho-cell';
      const click = editMode ? `onclick="toggleCell('${mesKey}','${u.matricula}',${i}, event)"` : '';
      const cursor = editMode ? 'cursor-pointer' : '';
      body += `<td class="px-0.5 py-1 text-center ${cursor}" ${click} title="${editMode ? 'Clique: reprogramar ciclo 6 dias | Shift+clique: limpar' : ''}"><div class="w-6 h-6 mx-auto rounded flex items-center justify-center text-xs ${cls}">${isF ? 'F' : ''}</div></td>`;
    }
    body += '</tr>';
  });
  document.getElementById('admin-table-body').innerHTML = body;
  document.getElementById('edit-hint').classList.toggle('hidden', !editMode);
  document.getElementById('btn-save-escala').classList.toggle('hidden', !editMode);
  document.getElementById('btn-edit-mode').innerHTML = editMode ? '<i class="fas fa-times mr-1"></i> Cancelar Edição' : '<i class="fas fa-pen mr-1"></i> Modo Edição';
}

function toggleEditMode() {
  editMode = !editMode;
  if (!editMode) loadDB();
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
  const CICLO = 6;
  const residual = dayIdx % CICLO;
  for (let i = 0; i < diasNoMes; i++) arr[i] = (i % CICLO === residual) ? 'F' : '';
  const nomeCurto = (DB.users.find(u => u.matricula === matricula)?.nome || matricula).split(' ')[0];
  const diasMarcados = arr.map((v, i) => v === 'F' ? (i + 1) : null).filter(Boolean);
  toast(`${nomeCurto}: folgas reprogramadas → dias ${diasMarcados.join(', ')}`);
  renderAdminEscala();
}

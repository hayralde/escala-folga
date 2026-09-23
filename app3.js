
async function saveEscala() {
  if (!(await saveDB())) return;
  editMode = false;
  toast('Escala salva com sucesso!');
  renderAdminEscala();
}

function renderUsers() {
  const sorted = [...DB.users].sort((a, b) => a.nome.localeCompare(b.nome));
  document.getElementById('equipe-count').textContent = sorted.length + ' colaboradores';
  document.getElementById('users-list').innerHTML = sorted.map(u => `
    <button onclick="openUserModal('${esc(u.matricula)}')" class="card w-full p-4 flex items-center gap-3 text-left">
      ${avatarHtml(u, 46, true)}
      <span class="flex-1 min-w-0">
        <span class="block font-semibold text-strong truncate">${esc(u.nome)}</span>
        <span class="flex items-center gap-2 mt-1 text-xs muted">
          <span class="chip-mat">${esc(u.matricula)}</span>
          <span>${esc(u.setor || 'Sem setor')}</span>
          <span>• ${userCiclo(u.matricula)} dias</span>
        </span>
      </span>
      <span class="only-desktop">${statusHtml(u.matricula)}</span>
      <i class="fas fa-chevron-right text-xs muted"></i>
    </button>`).join('') || '<p class="text-sm muted">Nenhum colaborador</p>';
}

function openUserModal(matricula) {
  document.getElementById('modal-user').classList.remove('hidden');
  document.getElementById('modal-user').classList.add('flex');
  const diaInput = document.getElementById('form-dia-folga');
  if (matricula) {
    const u = DB.users.find(x => x.matricula === matricula);
    document.getElementById('modal-user-title').textContent = 'Editar colaborador';
    document.getElementById('edit-user-id').value = matricula;
    document.getElementById('form-matricula').value = u.matricula;
    document.getElementById('form-matricula').disabled = true;
    document.getElementById('form-nome').value = u.nome;
    document.getElementById('form-ciclo').value = u.ciclo || CICLO_PADRAO;
    document.getElementById('form-setor').value = u.setor || '';
    document.getElementById('btn-delete-user').classList.remove('hidden');
    const dias = DB.schedules[anchorMes()]?.data[matricula] || [];
    const primeira = dias.findIndex(d => d === 'F');
    diaInput.value = primeira >= 0 ? (primeira + 1) : '';
  } else {
    document.getElementById('modal-user-title').textContent = 'Novo colaborador';
    document.getElementById('edit-user-id').value = '';
    document.getElementById('form-matricula').value = '';
    document.getElementById('form-matricula').disabled = false;
    document.getElementById('form-nome').value = '';
    document.getElementById('form-ciclo').value = CICLO_PADRAO;
    document.getElementById('form-setor').value = '';
    document.getElementById('btn-delete-user').classList.add('hidden');
    diaInput.value = '';
  }
}

function closeUserModal() {
  document.getElementById('modal-user').classList.add('hidden');
  document.getElementById('modal-user').classList.remove('flex');
}

// O dia-âncora é um dia do mês atual; o ciclo continua nos demais meses
function anchorMes() {
  return mesPadrao();
}

function applyCycleToUser(matricula, diaAncora) {
  const ciclo = userCiclo(matricula);
  const residual = cycleDay(anchorMes(), parseInt(diaAncora, 10) - 1, ciclo);
  Object.keys(DB.schedules).forEach(k => {
    const sched = DB.schedules[k];
    if (!sched.data[matricula]) sched.data[matricula] = Array(sched.diasNoMes).fill('');
    for (let i = 0; i < sched.diasNoMes; i++) {
      sched.data[matricula][i] = (cycleDay(k, i, ciclo) === residual) ? 'F' : '';
    }
  });
}

function saveUser() {
  const mat = document.getElementById('form-matricula').value.trim();
  const nome = document.getElementById('form-nome').value.trim().toUpperCase();
  const editId = document.getElementById('edit-user-id').value;
  const diaFolga = document.getElementById('form-dia-folga').value.trim();
  const ciclo = parseInt(document.getElementById('form-ciclo').value, 10) || CICLO_PADRAO;
  const setor = document.getElementById('form-setor').value;
  if (!mat || !nome) { toast('Preencha matrícula e nome', true); return; }
  if (ciclo < 2 || ciclo > 31) { toast('Ciclo deve ser entre 2 e 31 dias', true); return; }
  if (diaFolga) {
    const d = parseInt(diaFolga, 10);
    if (isNaN(d) || d < 1 || d > 31) { toast('Dia da folga deve ser entre 1 e 31', true); return; }
  }
  if (editId) {
    const u = DB.users.find(x => x.matricula === editId);
    if (u) {
      u.nome = nome;
      if (ciclo === CICLO_PADRAO) delete u.ciclo; else u.ciclo = ciclo;
      if (setor) u.setor = setor; else delete u.setor;
    }
    if (diaFolga) applyCycleToUser(editId, diaFolga);
  } else {
    if (DB.users.some(x => x.matricula === mat)) { toast('Matrícula já existe', true); return; }
    const novo = { matricula: mat, nome };
    if (ciclo !== CICLO_PADRAO) novo.ciclo = ciclo;
    if (setor) novo.setor = setor;
    DB.users.push(novo);
    Object.keys(DB.schedules).forEach(k => {
      DB.schedules[k].data[mat] = Array(DB.schedules[k].diasNoMes).fill('');
    });
    if (diaFolga) applyCycleToUser(mat, diaFolga);
  }
  saveDB();
  closeUserModal();
  renderUsers();
  if (diaFolga) {
    const k = anchorMes();
    const dias = (DB.schedules[k]?.data[editId || mat] || []).map((v, i) => v === 'F' ? i + 1 : null).filter(Boolean);
    toast(`Colaborador salvo! Folgas em ${k}: ${dias.join(', ')}`);
  } else {
    toast('Colaborador salvo!');
  }
}

function deleteUser(matricula) {
  if (!confirm('Excluir o colaborador ' + matricula + ' e todas as suas escalas?')) return;
  DB.users = DB.users.filter(u => u.matricula !== matricula);
  Object.keys(DB.schedules).forEach(k => { delete DB.schedules[k].data[matricula]; });
  saveDB();
  closeUserModal();
  renderUsers();
  toast('Colaborador excluído');
}

function renderMeses() {
  const keys = Object.keys(DB.schedules).sort().reverse();
  const atual = mesPadrao();
  document.getElementById('meses-grid').innerHTML = keys.map(k => {
    const s = DB.schedules[k];
    const totalF = Object.values(s.data).reduce((acc, arr) => acc + arr.filter(x => x === 'F').length, 0);
    return `<div class="card p-4 flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0" style="background:${k === atual ? 'var(--green)' : 'var(--surface-2)'};color:${k === atual ? '#fff' : 'var(--text-strong)'}">
          <span class="text-[10px] font-bold tracking-wider">${MONTH_NAMES[parseInt(k.split('-')[1], 10) - 1].slice(0, 3).toUpperCase()}</span>
          <span class="text-[10px] opacity-80">${k.split('-')[0]}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-strong">${mesLabel(k)}${k === atual ? ' <span class="pill pill-gold ml-1" style="padding:.1rem .5rem;font-size:10px">atual</span>' : ''}</div>
          <div class="text-xs muted">${Object.keys(s.data).length} colaboradores • ${totalF} folgas</div>
        </div>
        <button onclick="deleteMes('${k}')" class="icon-btn" style="color:var(--danger)" title="Excluir mês"><i class="fas fa-trash-can text-sm"></i></button>
      </div>`;
  }).join('') || '<p class="text-sm muted">Nenhum mês cadastrado</p>';
}

function openMesModal() {
  document.getElementById('modal-mes').classList.remove('hidden');
  document.getElementById('modal-mes').classList.add('flex');
  document.getElementById('form-mes-key').value = '';
  document.getElementById('form-mes-titulo').value = '';
  const sel = document.getElementById('form-mes-copy');
  sel.innerHTML = '<option value="">— Em branco —</option>' +
    Object.keys(DB.schedules).sort().reverse().map(k => {
      const [y,m] = k.split('-');
      return `<option value="${k}">${MONTH_NAMES[parseInt(m)-1]} ${y}</option>`;
    }).join('');
}

function closeMesModal() {
  document.getElementById('modal-mes').classList.add('hidden');
  document.getElementById('modal-mes').classList.remove('flex');
}

function saveMes() {
  const key = document.getElementById('form-mes-key').value;
  if (!key) { toast('Selecione o mês', true); return; }
  if (DB.schedules[key]) { toast('Este mês já existe', true); return; }
  const [y, m] = key.split('-').map(Number);
  const diasNoMes = new Date(y, m, 0).getDate();
  const titulo = document.getElementById('form-mes-titulo').value || `ESCALA DE FOLGA DO MÊS DE ${MONTH_NAMES[m-1].toUpperCase()} ${y}`;
  const copyFrom = document.getElementById('form-mes-copy').value;
  const data = {};
  DB.users.forEach(u => {
    if (copyFrom && DB.schedules[copyFrom]?.data[u.matricula]) {
      // Continua o ciclo do colaborador a partir do mês de origem em vez de copiar dia a dia
      const ciclo = userCiclo(u.matricula);
      const primeira = DB.schedules[copyFrom].data[u.matricula].indexOf('F');
      const residual = primeira >= 0 ? cycleDay(copyFrom, primeira, ciclo) : -1;
      data[u.matricula] = Array(diasNoMes).fill('').map((_, i) => cycleDay(key, i, ciclo) === residual ? 'F' : '');
    } else {
      data[u.matricula] = Array(diasNoMes).fill('');
    }
  });
  DB.schedules[key] = { titulo, diasNoMes, data };
  saveDB();
  closeMesModal();
  renderMeses();
  toast('Mês criado!');
}

function deleteMes(key) {
  if (Object.keys(DB.schedules).length <= 1) { toast('É necessário manter pelo menos um mês', true); return; }
  if (!confirm('Excluir o mês ' + key + '?')) return;
  delete DB.schedules[key];
  saveDB();
  renderMeses();
  toast('Mês excluído');
}

function renderConfig() {
  document.getElementById('config-senha').value = '';
  document.getElementById('config-titulo').value = DB.config.titulo || '';
}

async function changeAdminPassword() {
  const nova = document.getElementById('config-senha').value;
  if (!nova || nova.length < 4) { toast('Senha deve ter ao menos 4 caracteres', true); return; }
  try {
    await sbRpc('escala_folga_change_password', { p_old: adminSenha, p_new: nova });
  } catch (e) { toast('Erro ao alterar senha: ' + e.message, true); return; }
  adminSenha = nova;
  toast('Senha alterada!');
  document.getElementById('config-senha').value = '';
}

function saveConfig() {
  DB.config.titulo = document.getElementById('config-titulo').value.trim() || 'Elétrica & Cogeração';
  saveDB();
  renderTitulo();
  toast('Configurações salvas!');
}

function resetAllData() {
  if (!confirm('Isso apagará TODOS os dados e restaurará a escala original de Setembro/2026. Continuar?')) return;
  DB = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveDB();
  toast('Dados resetados');
  renderApp();
}

function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'escala-folga-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  toast('Backup exportado!');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.users || !data.schedules || !data.config) throw new Error('Formato inválido');
      delete data.config.adminPassword;
      DB = data;
      saveDB();
      toast('Dados importados com sucesso!');
      renderApp();
    } catch (err) {
      toast('Erro ao importar: arquivo inválido', true);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

let toastTimer = null;
function toast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.innerHTML = `<div class="toast-inner fade-in ${isError ? 'err' : ''}"><span class="ic">${isError ? '!' : '✓'}</span><span>${esc(msg)}</span></div>`;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3200);
}

syncThemeIcons();
document.querySelectorAll('.app-version').forEach(el => { el.textContent = APP_VERSION; });
loadDB().then(() => {
  renderTitulo();
  if (dbOffline) toast('Sem conexão com o servidor — exibindo a última cópia salva neste aparelho', true);
});
document.getElementById('input-matricula').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('input-senha').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

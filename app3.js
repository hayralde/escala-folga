
function saveEscala() {
  saveDB();
  editMode = false;
  toast('Escala salva com sucesso!');
  renderAdminEscala();
}

function renderUsers() {
  const tbody = document.getElementById('users-table-body');
  const sorted = [...DB.users].sort((a,b) => a.nome.localeCompare(b.nome));
  tbody.innerHTML = sorted.map(u => `
    <tr class="border-t border-slate-100 hover:bg-slate-50">
      <td class="px-4 py-3 font-mono text-sm">${u.matricula}</td>
      <td class="px-4 py-3 text-sm">${u.nome}</td>
      <td class="px-4 py-3">
        <button onclick="openUserModal('${u.matricula}')" class="text-blue-600 hover:text-blue-800 mr-3" title="Editar"><i class="fas fa-edit"></i></button>
        <button onclick="deleteUser('${u.matricula}')" class="text-red-500 hover:text-red-700" title="Excluir"><i class="fas fa-trash-alt"></i></button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="3" class="px-4 py-6 text-center text-slate-400">Nenhum colaborador</td></tr>';
}

function openUserModal(matricula) {
  document.getElementById('modal-user').classList.remove('hidden');
  document.getElementById('modal-user').classList.add('flex');
  const diaInput = document.getElementById('form-dia-folga');
  if (matricula) {
    const u = DB.users.find(x => x.matricula === matricula);
    document.getElementById('modal-user-title').textContent = 'Editar Colaborador';
    document.getElementById('edit-user-id').value = matricula;
    document.getElementById('form-matricula').value = u.matricula;
    document.getElementById('form-matricula').disabled = true;
    document.getElementById('form-nome').value = u.nome;
    const mesAtivo = DB.config.mesAtivo;
    const dias = (mesAtivo && DB.schedules[mesAtivo]?.data[matricula]) || [];
    const primeira = dias.findIndex(d => d === 'F');
    diaInput.value = primeira >= 0 ? (primeira + 1) : '';
  } else {
    document.getElementById('modal-user-title').textContent = 'Novo Colaborador';
    document.getElementById('edit-user-id').value = '';
    document.getElementById('form-matricula').value = '';
    document.getElementById('form-matricula').disabled = false;
    document.getElementById('form-nome').value = '';
    diaInput.value = '';
  }
}

function closeUserModal() {
  document.getElementById('modal-user').classList.add('hidden');
  document.getElementById('modal-user').classList.remove('flex');
}

function applyCycleToUser(matricula, diaAncora) {
  const CICLO = 6;
  const residual = (parseInt(diaAncora, 10) - 1) % CICLO;
  Object.keys(DB.schedules).forEach(k => {
    const sched = DB.schedules[k];
    if (!sched.data[matricula]) sched.data[matricula] = Array(sched.diasNoMes).fill('');
    for (let i = 0; i < sched.diasNoMes; i++) {
      sched.data[matricula][i] = (i % CICLO === residual) ? 'F' : '';
    }
  });
}

function saveUser() {
  const mat = document.getElementById('form-matricula').value.trim();
  const nome = document.getElementById('form-nome').value.trim().toUpperCase();
  const editId = document.getElementById('edit-user-id').value;
  const diaFolga = document.getElementById('form-dia-folga').value.trim();
  if (!mat || !nome) { toast('Preencha matrícula e nome', true); return; }
  if (diaFolga) {
    const d = parseInt(diaFolga, 10);
    if (isNaN(d) || d < 1 || d > 31) { toast('Dia da folga deve ser entre 1 e 31', true); return; }
  }
  if (editId) {
    const u = DB.users.find(x => x.matricula === editId);
    if (u) u.nome = nome;
    if (diaFolga) applyCycleToUser(editId, diaFolga);
  } else {
    if (DB.users.some(x => x.matricula === mat)) { toast('Matrícula já existe', true); return; }
    DB.users.push({ matricula: mat, nome });
    Object.keys(DB.schedules).forEach(k => {
      DB.schedules[k].data[mat] = Array(DB.schedules[k].diasNoMes).fill('');
    });
    if (diaFolga) applyCycleToUser(mat, diaFolga);
  }
  saveDB();
  closeUserModal();
  renderUsers();
  if (diaFolga) {
    const d = parseInt(diaFolga, 10);
    const CICLO = 6;
    const residual = (d - 1) % CICLO;
    const dias = [];
    for (let i = residual; i < 31; i += CICLO) dias.push(i + 1);
    toast(`Colaborador salvo! Folgas geradas: ${dias.join(', ')}`);
  } else {
    toast('Colaborador salvo!');
  }
}

function deleteUser(matricula) {
  if (!confirm('Excluir o colaborador ' + matricula + ' e todas as suas escalas?')) return;
  DB.users = DB.users.filter(u => u.matricula !== matricula);
  Object.keys(DB.schedules).forEach(k => { delete DB.schedules[k].data[matricula]; });
  saveDB();
  renderUsers();
  toast('Colaborador excluído');
}

function renderMeses() {
  const grid = document.getElementById('meses-grid');
  const keys = Object.keys(DB.schedules).sort().reverse();
  grid.innerHTML = keys.map(k => {
    const s = DB.schedules[k];
    const [y, m] = k.split('-');
    const isAtivo = k === DB.config.mesAtivo;
    const totalF = Object.values(s.data).reduce((acc, arr) => acc + arr.filter(x => x === 'F').length, 0);
    return `<div class="bg-white rounded-xl border ${isAtivo ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'} p-5 shadow-sm">
        <div class="flex items-start justify-between mb-2"><div><div class="font-bold text-lg">${MONTH_NAMES[parseInt(m)-1]} ${y}</div><div class="text-xs text-slate-500 mt-0.5">${s.titulo || ''}</div></div>
          ${isAtivo ? '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Ativo</span>' : ''}</div>
        <div class="text-sm text-slate-600 mb-3">${Object.keys(s.data).length} colaboradores • ${totalF} folgas</div>
        <div class="flex gap-2">${!isAtivo ? `<button onclick="setMesAtivo('${k}')" class="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">Definir Ativo</button>` : ''}
          <button onclick="deleteMes('${k}')" class="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Excluir</button></div></div>`;
  }).join('') || '<p class="text-slate-400">Nenhum mês cadastrado</p>';
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
      const src = DB.schedules[copyFrom].data[u.matricula];
      data[u.matricula] = Array(diasNoMes).fill('').map((_, i) => src[i] || '');
    } else {
      data[u.matricula] = Array(diasNoMes).fill('');
    }
  });
  DB.schedules[key] = { titulo, diasNoMes, data };
  if (!DB.config.mesAtivo) DB.config.mesAtivo = key;
  saveDB();
  closeMesModal();
  renderMeses();
  toast('Mês criado!');
}

function setMesAtivo(key) {
  DB.config.mesAtivo = key;
  saveDB();
  renderMeses();
  toast('Mês ativo atualizado');
}

function deleteMes(key) {
  if (Object.keys(DB.schedules).length <= 1) { toast('É necessário manter pelo menos um mês', true); return; }
  if (!confirm('Excluir o mês ' + key + '?')) return;
  delete DB.schedules[key];
  if (DB.config.mesAtivo === key) DB.config.mesAtivo = Object.keys(DB.schedules).sort().reverse()[0];
  saveDB();
  renderMeses();
  toast('Mês excluído');
}

function renderConfig() {
  document.getElementById('config-senha').value = '';
  document.getElementById('config-titulo').value = DB.config.titulo || '';
}

function changeAdminPassword() {
  const nova = document.getElementById('config-senha').value;
  if (!nova || nova.length < 4) { toast('Senha deve ter ao menos 4 caracteres', true); return; }
  DB.config.adminPassword = nova;
  saveDB();
  toast('Senha alterada!');
  document.getElementById('config-senha').value = '';
}

function saveConfig() {
  DB.config.titulo = document.getElementById('config-titulo').value.trim() || 'Elétrica & Cogeração';
  saveDB();
  document.getElementById('header-subtitle').innerHTML = DB.config.titulo + ' <span class="text-slate-400">' + APP_VERSION + '</span>';
  toast('Configurações salvas!');
}

function resetAllData() {
  if (!confirm('Isso apagará TODOS os dados e restaurará a escala original de Agosto/2026. Continuar?')) return;
  localStorage.removeItem('portal_escala_folga');
  loadDB();
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

function toast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm fade-in ${isError ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

loadDB();
document.getElementById('input-matricula').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('input-senha').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

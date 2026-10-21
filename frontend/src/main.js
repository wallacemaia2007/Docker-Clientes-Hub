import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar"><a class="brand" href="#"><span class="brand-mark">D</span> docker<span class="brand-light">lab</span></a><span class="live"><i></i> aplicação online</span></header>
    <section class="hero"><p class="eyebrow">DEMO PRÁTICA · DOCKER COMPOSE</p><h1>Gestão de <span>clientes.</span></h1><p class="subtitle">Uma aplicação simples, três serviços e tudo conectado por uma rede Docker.</p>
      <div class="architecture"><div class="arch-item"><span class="arch-icon browser-icon">▣</span><div><b>Frontend</b><small>Vite + Nginx</small></div></div><span class="connector">⟷</span><div class="arch-item"><span class="arch-icon api-icon">⌘</span><div><b>Backend</b><small>Node + Express</small></div></div><span class="connector">⟷</span><div class="arch-item"><span class="arch-icon db-icon">▤</span><div><b>Database</b><small>PostgreSQL</small></div></div></div>
    </section>
    <section class="panel"><div class="panel-heading"><div><p class="eyebrow">CADASTRO</p><h2>Seus clientes</h2></div><span id="count" class="count">0 clientes</span></div>
      <form id="client-form"><input id="client-id" type="hidden"><label>Nome<input id="nome" name="nome" placeholder="Ex.: Ana Souza" maxlength="120" required></label><label>E-mail<input id="email" name="email" type="email" placeholder="ana@exemplo.com" maxlength="254" required></label><div class="form-actions"><button id="cancel" class="button secondary hidden" type="button">Cancelar edição</button><button id="submit" class="button primary" type="submit"><span>＋</span> Cadastrar cliente</button></div></form>
      <div id="notice" class="notice hidden"></div><div class="table-wrap"><table><thead><tr><th>CLIENTE</th><th>E-MAIL</th><th>CADASTRADO EM</th><th></th></tr></thead><tbody id="rows"></tbody></table><div id="empty" class="empty"><span class="empty-icon">⌁</span><b>Nenhum cliente por enquanto</b><p>Cadastre o primeiro cliente acima para testar a API e o banco.</p></div></div>
    </section>
    <footer><span>Uma demo didática de CRUD</span><span>Front <b>→</b> API <b>→</b> PostgreSQL</span></footer>
  </main>`;

const form = document.querySelector('#client-form');
const rows = document.querySelector('#rows');
const notice = document.querySelector('#notice');
let noticeTimer;

function avisar(texto, erro = false) {
  notice.textContent = texto;
  notice.classList.toggle('error', erro);
  notice.classList.remove('hidden');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => notice.classList.add('hidden'), 4000);
}

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.erro || `Erro HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

async function carregar() {
  try {
    const clientes = await api('/api/clientes');
    document.querySelector('#count').textContent = `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`;
    document.querySelector('#empty').classList.toggle('hidden', clientes.length > 0);
    rows.innerHTML = clientes.map((c) => `<tr><td><span class="avatar">${escapar(c.nome.charAt(0).toUpperCase())}</span><b>${escapar(c.nome)}</b></td><td class="email-cell">${escapar(c.email)}</td><td class="date-cell">${new Date(c.criado_em).toLocaleDateString('pt-BR')}</td><td class="row-actions"><button class="icon-button edit" data-id="${c.id}" title="Editar">✎</button><button class="icon-button delete" data-id="${c.id}" title="Excluir">×</button></td></tr>`).join('');
  } catch (err) { avisar(`Não foi possível carregar os clientes: ${err.message}`, true); }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.querySelector('#client-id').value;
  const payload = { nome: document.querySelector('#nome').value, email: document.querySelector('#email').value };
  try {
    await api(id ? `/api/clientes/${id}` : '/api/clientes', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    avisar(id ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
    form.reset();
    document.querySelector('#client-id').value = '';
    document.querySelector('#submit').innerHTML = '<span>＋</span> Cadastrar cliente';
    document.querySelector('#cancel').classList.add('hidden');
    await carregar();
  } catch (err) { avisar(err.message, true); }
});

rows.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  try {
    if (button.classList.contains('edit')) {
      const cliente = await api(`/api/clientes/${button.dataset.id}`);
      document.querySelector('#client-id').value = cliente.id;
      document.querySelector('#nome').value = cliente.nome;
      document.querySelector('#email').value = cliente.email;
      document.querySelector('#submit').innerHTML = 'Guardar alterações';
      document.querySelector('#cancel').classList.remove('hidden');
      document.querySelector('#nome').focus();
    } else if (button.classList.contains('delete')) {
      if (!confirm('Tem certeza de que deseja excluir este cliente?')) return;
      await api(`/api/clientes/${button.dataset.id}`, { method: 'DELETE' });
      avisar('Cliente removido.');
      await carregar();
    }
  } catch (err) { avisar(err.message, true); }
});

document.querySelector('#cancel').addEventListener('click', () => {
  form.reset();
  document.querySelector('#client-id').value = '';
  document.querySelector('#submit').innerHTML = '<span>＋</span> Cadastrar cliente';
  document.querySelector('#cancel').classList.add('hidden');
});

carregar();

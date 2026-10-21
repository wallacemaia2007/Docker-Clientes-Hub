const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'clientes_db',
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app_dev_password',
});

app.use(express.json());

function validarCliente(body) {
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!nome || !email) return { erro: 'Nome e e-mail são obrigatórios.' };
  if (nome.length > 120 || email.length > 254) return { erro: 'Nome ou e-mail demasiado longo.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { erro: 'Informe um e-mail válido.' };
  return { nome, email };
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/api/clientes', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, email, criado_em FROM clientes ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

app.get('/api/clientes/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, email, criado_em FROM clientes WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

app.post('/api/clientes', async (req, res, next) => {
  const cliente = validarCliente(req.body);
  if (cliente.erro) return res.status(400).json(cliente);
  try {
    const { rows } = await pool.query(
      'INSERT INTO clientes (nome, email) VALUES ($1, $2) RETURNING id, nome, email, criado_em',
      [cliente.nome, cliente.email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'Já existe um cliente com este e-mail.' });
    next(err);
  }
});

app.put('/api/clientes/:id', async (req, res, next) => {
  const cliente = validarCliente(req.body);
  if (cliente.erro) return res.status(400).json(cliente);
  try {
    const { rows } = await pool.query(
      'UPDATE clientes SET nome = $1, email = $2 WHERE id = $3 RETURNING id, nome, email, criado_em',
      [cliente.nome, cliente.email, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'Já existe um cliente com este e-mail.' });
    next(err);
  }
});

app.delete('/api/clientes/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ erro: 'Cliente não encontrado.' });
    res.status(204).end();
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

async function iniciar() {
  // A tabela é criada automaticamente para a demo; os dados vivem no volume do PostgreSQL.
  await pool.query(`CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  app.listen(port, '0.0.0.0', () => console.log(`API disponível na porta ${port}`));
}

iniciar().catch((err) => {
  console.error('Não foi possível iniciar a API:', err);
  process.exit(1);
});

import { getDatabaseConnection } from "../connection.js";

export async function runMigrations() {
  const db = await getDatabaseConnection();

  // 1. Tabela de Usuários
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('candidato', 'empresa', 'admin')),
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Tabela de Perfis de Candidatos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS candidatos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL UNIQUE,
      telefone TEXT,
      cidade TEXT,
      resumo_profissional TEXT,
      experiencias TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `);

  // 3. Tabela de Empresas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL UNIQUE,
      nome_fantasia TEXT NOT NULL,
      razao_social TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      descricao TEXT,
      cidade TEXT,
      telefone TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `);

  // 4. Tabela de Categorias
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      ativa INTEGER NOT NULL DEFAULT 1
    );
  `);

  // 5. Tabela de Cidades
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      uf TEXT NOT NULL,
      UNIQUE(nome, uf)
    );
  `);

  // 6. Tabela de Vagas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vagas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      categoria_id INTEGER NOT NULL,
      cidade_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      requisitos TEXT,
      salario REAL,
      tipo_trabalho TEXT DEFAULT 'presencial',
      status TEXT NOT NULL DEFAULT 'ativa' CHECK(status IN ('ativa', 'encerrada')),
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id),
      FOREIGN KEY (cidade_id) REFERENCES cidades(id)
    );
  `);

  // 7. Tabela de Candidaturas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS candidaturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vaga_id INTEGER NOT NULL,
      candidato_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'aceito', 'recusado')),
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(vaga_id, candidato_id),
      FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE CASCADE,
      FOREIGN KEY (candidato_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `);

  // 8. Tabela de Configurações do Sistema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);

  // Índices para otimização
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_vagas_empresa ON vagas(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_vagas_categoria ON vagas(categoria_id);
    CREATE INDEX IF NOT EXISTS idx_vagas_cidade ON vagas(cidade_id);
    CREATE INDEX IF NOT EXISTS idx_vagas_status ON vagas(status);
    CREATE INDEX IF NOT EXISTS idx_candidaturas_vaga ON candidaturas(vaga_id);
    CREATE INDEX IF NOT EXISTS idx_candidaturas_candidato ON candidaturas(candidato_id);
  `);

  console.log("-> Migrações do banco de dados executadas com sucesso.");
}
import bcrypt from "bcryptjs";
import { getDatabaseConnection } from "../connection.js";
import { runMigrations } from "../migrations/init.js";
import { ROLES } from "../../constants/roles.js";
import { STATUS_VAGA, STATUS_CANDIDATURA } from "../../constants/status.js";

export async function runSeed() {
  console.log("🌱 Iniciando povoamento de dados de teste (Seed)...");

  // Executa as migrações/criação das tabelas antes de popular
  await runMigrations();

  const db = await getDatabaseConnection();

  // Restante do seu código da seed...

  // 1. Categorias
  const categorias = [
    "Tecnologia e TI",
    "Vendas e Comercial",
    "Marketing e Comunicação",
    "Financeiro e Contabilidade",
    "Recursos Humanos",
    "Saúde e Enfermagem"
  ];

  for (const nome of categorias) {
    const existe = await db.get("SELECT id FROM categorias WHERE nome = ?", [nome]);
    if (!existe) {
      await db.run("INSERT INTO categorias (nome, ativa) VALUES (?, 1)", [nome]);
    }
  }

  // 2. Cidades
  const cidades = [
    { nome: "São Paulo", uf: "SP" },
    { nome: "Rio de Janeiro", uf: "RJ" },
    { nome: "Curitiba", uf: "PR" },
    { nome: "Belo Horizonte", uf: "MG" },
    { nome: "Cascavel", uf: "PR" }
  ];

  for (const c of cidades) {
    const existe = await db.get("SELECT id FROM cidades WHERE nome = ? AND uf = ?", [c.nome, c.uf]);
    if (!existe) {
      await db.run("INSERT INTO cidades (nome, uf) VALUES (?, ?)", [c.nome, c.uf]);
    }
  }

  // Hash padrão para testes: "Senha@123"
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash("Senha@123", salt);
  const senhaAdminHash = await bcrypt.hash("Admin@123", salt);

  // 3. Usuário Administrador
  let admin = await db.get("SELECT id FROM usuarios WHERE email = ?", ["admin@conectavagas.com"]);
  if (!admin) {
    const res = await db.run(
      "INSERT INTO usuarios (nome, email, senha, role, ativo) VALUES (?, ?, ?, ?, 1)",
      ["Administrador", "admin@conectavagas.com", senhaAdminHash, ROLES.ADMIN]
    );
    admin = { id: res.lastID };
  }

  // 4. Usuários e Perfis de Empresas
  let usuarioEmpresa = await db.get("SELECT id FROM usuarios WHERE email = ?", ["contato@techsolutions.com"]);
  let empresaId;

  if (!usuarioEmpresa) {
    const resUser = await db.run(
      "INSERT INTO usuarios (nome, email, senha, role, ativo) VALUES (?, ?, ?, ?, 1)",
      ["Tech Solutions LTDA", "contato@techsolutions.com", senhaHash, ROLES.EMPRESA]
    );
    usuarioEmpresa = { id: resUser.lastID };

    const resEmpresa = await db.run(
      `INSERT INTO empresas (usuario_id, nome_fantasia, razao_social, cnpj, descricao, cidade, telefone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioEmpresa.id,
        "Tech Solutions",
        "Tech Solutions Tecnologia da Informação LTDA",
        "12.345.678/0001-90",
        "Empresa especialista em desenvolvimento de software e soluções cloud.",
        "São Paulo - SP",
        "(11) 98888-7777"
      ]
    );
    empresaId = resEmpresa.lastID;
  } else {
    const emp = await db.get("SELECT id FROM empresas WHERE usuario_id = ?", [usuarioEmpresa.id]);
    empresaId = emp.id;
  }

  // 5. Usuários e Perfis de Candidatos
  let usuarioCandidato = await db.get("SELECT id FROM usuarios WHERE email = ?", ["dev.silva@email.com"]);
  let candidatoId;

  if (!usuarioCandidato) {
    const resUser = await db.run(
      "INSERT INTO usuarios (nome, email, senha, role, ativo) VALUES (?, ?, ?, ?, 1)",
      ["Carlos Silva", "dev.silva@email.com", senhaHash, ROLES.CANDIDATO]
    );
    candidatoId = resUser.lastID;

    await db.run(
      `INSERT INTO candidatos (usuario_id, telefone, cidade, resumo_profissional, experiencias)
       VALUES (?, ?, ?, ?, ?)`,
      [
        candidatoId,
        "(11) 97777-6666",
        "São Paulo - SP",
        "Desenvolvedor Full Stack com 3 anos de experiência em Node.js e React.",
        "Desenvolvedor Junior na empresa X (2022-2024)."
      ]
    );
  } else {
    candidatoId = usuarioCandidato.id;
  }

  // 6. Vagas de Teste
  const catTI = await db.get("SELECT id FROM categorias WHERE nome = 'Tecnologia e TI'");
  const cidSP = await db.get("SELECT id FROM cidades WHERE nome = 'São Paulo'");

  let vaga1 = await db.get("SELECT id FROM vagas WHERE titulo = 'Desenvolvedor Node.js Backend'");
  if (!vaga1 && catTI && cidSP && empresaId) {
    const resVaga = await db.run(
      `INSERT INTO vagas (empresa_id, titulo, descricao, requisitos, salario, tipo_trabalho, cidade_id, categoria_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empresaId,
        "Desenvolvedor Node.js Backend",
        "Buscamos desenvolvedor backend apaixonado por APIs RESTful e arquitetura limpa.",
        "Conhecimento avançado em Node.js, Express e SQLite/PostgreSQL.",
        5500.00,
        "remoto",
        cidSP.id,
        catTI.id,
        STATUS_VAGA.ATIVA
      ]
    );
    vaga1 = { id: resVaga.lastID };
  }

  // 7. Candidatura de Teste
  if (vaga1 && candidatoId) {
    const existeCand = await db.get(
      "SELECT id FROM candidaturas WHERE vaga_id = ? AND candidato_id = ?",
      [vaga1.id, candidatoId]
    );
    if (!existeCand) {
      await db.run(
        "INSERT INTO candidaturas (vaga_id, candidato_id, status) VALUES (?, ?, ?)",
        [vaga1.id, candidatoId, STATUS_CANDIDATURA.PENDENTE]
      );
    }
  }

  console.log("✅ Seed executado com sucesso!");
}

if (process.argv[1] && process.argv[1].endsWith("init.seed.js")) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Erro ao executar seed:", err);
      process.exit(1);
    });
}
import { getDatabaseConnection } from "../database/connection.js";

export class CandidaturaRepository {
  static async criar({ vaga_id, candidato_id }) {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO candidaturas (vaga_id, candidato_id, status) VALUES (?, ?, 'pendente')`,
      [Number(vaga_id), Number(candidato_id)]
    );
    return result.lastID;
  }

  static async buscarPorVagaECandidato(vagaId, candidatoId) {
    const db = await getDatabaseConnection();
    return db.get(
      `SELECT * FROM candidaturas WHERE vaga_id = ? AND candidato_id = ?`,
      [Number(vagaId), Number(candidatoId)]
    );
  }

  static async buscarPorId(id) {
    const db = await getDatabaseConnection();
    return db.get(
      `SELECT c.*, v.empresa_id 
       FROM candidaturas c
       INNER JOIN vagas v ON v.id = c.vaga_id
       /* Trava: O candidato E a empresa precisam estar ativos para visualizar */
       INNER JOIN usuarios u_candidato ON u_candidato.id = c.candidato_id AND u_candidato.ativo = 1
       INNER JOIN usuarios u_empresa ON u_empresa.id = v.empresa_id AND u_empresa.ativo = 1
       WHERE c.id = ?`,
      [Number(id)]
    );
  }
static async listarPorCandidato(candidatoId) {
    const db = await getDatabaseConnection();
    return db.all(
      `SELECT c.id as candidatura_id, c.id, c.status, c.criado_em,
              v.id as vaga_id, v.titulo as vaga_titulo, v.tipo_trabalho,
              COALESCE(e.nome_fantasia, u_empresa.nome, 'Confidencial') as empresa_nome,
              cid.nome as cidade_nome, cid.uf as cidade_uf
       FROM candidaturas c
       /* Mudamos TUDO para LEFT JOIN. Assim, se faltar um pedaço de dado da vaga, 
          a candidatura não some da sua tela! */
       LEFT JOIN vagas v ON v.id = c.vaga_id
       LEFT JOIN empresas e ON (e.id = v.empresa_id OR e.usuario_id = v.empresa_id)
       LEFT JOIN usuarios u_empresa ON (u_empresa.id = e.usuario_id OR u_empresa.id = v.empresa_id)
       LEFT JOIN cidades cid ON cid.id = v.cidade_id
       WHERE c.candidato_id = ?
       ORDER BY c.id DESC`,
      [Number(candidatoId)]
    );
  }

  static async listarPorVagaEEmpresa(vagaId, empresaId) {
    const db = await getDatabaseConnection();
    return db.all(
      `SELECT c.id as candidatura_id, c.id, c.status, c.criado_em,
              u.id as candidato_id, u.nome as candidato_nome, u.nome, u.email as candidato_email, u.email
       FROM candidaturas c
       INNER JOIN vagas v ON v.id = c.vaga_id
       /* CAPA DE INVISIBILIDADE: Oculta da lista da empresa os candidatos bloqueados */
       INNER JOIN usuarios u ON u.id = c.candidato_id AND u.ativo = 1
       LEFT JOIN empresas e ON (e.id = v.empresa_id OR e.usuario_id = v.empresa_id)
       WHERE c.vaga_id = ? 
         AND (v.empresa_id = ? OR v.empresa_id = e.usuario_id OR e.id = ?)
       ORDER BY c.id DESC`,
      [Number(vagaId), Number(empresaId), Number(empresaId)]
    );
  }

  static async atualizarStatus(id, status) {
    const db = await getDatabaseConnection();
    await db.run(`UPDATE candidaturas SET status = ? WHERE id = ?`, [status, Number(id)]);
    return CandidaturaRepository.buscarPorId(id);
  }

  async criar(dados) { return CandidaturaRepository.criar(dados); }
  async buscarPorVagaECandidato(vId, cId) { return CandidaturaRepository.buscarPorVagaECandidato(vId, cId); }
  async buscarPorId(id) { return CandidaturaRepository.buscarPorId(id); }
  async listarPorCandidato(cId) { return CandidaturaRepository.listarPorCandidato(cId); }
  async listarPorVagaEEmpresa(vId, eId) { return CandidaturaRepository.listarPorVagaEEmpresa(vId, eId); }
  async atualizarStatus(id, status) { return CandidaturaRepository.atualizarStatus(id, status); }
}
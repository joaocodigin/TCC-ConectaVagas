import { getDatabaseConnection } from "../database/connection.js";

export class UsuarioRepository {
  async buscarPorEmail(email) {
    const db = await getDatabaseConnection();
    return await db.get("SELECT * FROM usuarios WHERE email = ?", [email]);
  }

  async buscarPorNome(nome) {
    const db = await getDatabaseConnection();
    return await db.get("SELECT * FROM usuarios WHERE nome = ?", [nome]);
  }

  async buscarPorId(id) {
    const db = await getDatabaseConnection();
    return await db.get(
      "SELECT id, nome, email, role, ativo, criado_em FROM usuarios WHERE id = ?",
      [id]
    );
  }

  // ATUALIZADO: Suporte a LIMIT e OFFSET para Paginação
async listarTodos(termoPesquisa = "", page = 1, limit = 15) {
    const db = await getDatabaseConnection();
    let queryWhere = "";
    let params = [];

    if (termoPesquisa) {
      queryWhere = " WHERE nome LIKE ? OR email LIKE ? OR id = ?";
      const likeTerm = `%${termoPesquisa}%`;
      params = [likeTerm, likeTerm, termoPesquisa];
    }

    const countQuery = `SELECT COUNT(*) as total FROM usuarios ${queryWhere}`;
    const countResult = await db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    const offset = (page - 1) * limit;
    
    // CORREÇÃO: Interpolando diretamente como Number para forçar o SQLite a respeitar o limite!
    const query = `SELECT id, nome, email, role, ativo, criado_em FROM usuarios ${queryWhere} ORDER BY id DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    const usuarios = await db.all(query, params);

    return { usuarios, total };
  }

  async criar({ nome, email, senhaHash, role }) {
    const db = await getDatabaseConnection();
    const resultado = await db.run(
      "INSERT INTO usuarios (nome, email, senha, role, ativo) VALUES (?, ?, ?, ?, 1)",
      [nome, email, senhaHash, role]
    );
    return { id: resultado.lastID, nome, email, role };
  }

  async atualizar(id, { nome, email, role }) {
    const db = await getDatabaseConnection();
    await db.run("UPDATE usuarios SET nome = ?, email = ?, role = ? WHERE id = ?", [nome, email, role, id]);
    return this.buscarPorId(id);
  }

  async excluir(id) {
    const db = await getDatabaseConnection();
    await db.run("DELETE FROM candidaturas WHERE candidato_id = ?", [id]);
    await db.run(`DELETE FROM candidaturas WHERE vaga_id IN (SELECT id FROM vagas WHERE empresa_id = ?)`, [id]);
    await db.run("DELETE FROM vagas WHERE empresa_id = ?", [id]);
    await db.run("DELETE FROM usuarios WHERE id = ?", [id]);
    return true;
  }

  async inativarVagasDaEmpresa(empresaId) {
    const db = await getDatabaseConnection();
    await db.run("UPDATE vagas SET status = 'encerrada' WHERE empresa_id = ?", [empresaId]);
  }
}
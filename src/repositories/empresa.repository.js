import { getDatabaseConnection } from "../database/connection.js";

export class EmpresaRepository {
  static async buscarPorUsuarioId(usuarioId) {
    const db = await getDatabaseConnection();
    return db.get("SELECT * FROM empresas WHERE usuario_id = ?", [Number(usuarioId)]);
  }

  static async buscarPorId(id) {
    const db = await getDatabaseConnection();
    return db.get("SELECT * FROM empresas WHERE id = ?", [Number(id)]);
  }

  static async buscarPorCnpj(cnpj) {
    const db = await getDatabaseConnection();
    return db.get("SELECT * FROM empresas WHERE cnpj = ?", [cnpj]);
  }

  static async criar({ usuario_id, nome_fantasia, razao_social, cnpj, descricao, cidade, telefone }) {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO empresas (usuario_id, nome_fantasia, razao_social, cnpj, descricao, cidade, telefone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [Number(usuario_id), nome_fantasia, razao_social, cnpj, descricao || null, cidade || null, telefone || null]
    );
    return result.lastID;
  }

  static async atualizar(id, { nome_fantasia, razao_social, descricao, cidade, telefone }) {
    const db = await getDatabaseConnection();
    await db.run(
      `UPDATE empresas 
       SET nome_fantasia = ?, razao_social = ?, descricao = ?, cidade = ?, telefone = ?
       WHERE id = ?`,
      [nome_fantasia, razao_social, descricao || null, cidade || null, telefone || null, Number(id)]
    );
    return this.buscarPorId(id);
  }
}
import { getDatabaseConnection } from "../database/connection.js";

export class CategoriaRepository {
 static async listarTodas(termo = "", page = 1, limit = 15) {
    const db = await getDatabaseConnection();
    let queryWhere = termo ? "WHERE LOWER(nome) LIKE LOWER(?)" : "";
    let params = termo ? [`%${termo}%`] : [];
    
    const count = await db.get(`SELECT COUNT(*) as total FROM categorias ${queryWhere}`, params);
    const offset = (page - 1) * limit;
    const categorias = await db.all(`SELECT * FROM categorias ${queryWhere} ORDER BY nome ASC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    return { categorias, total: count ? count.total : 0 };
  }

  static async listarAtivas(termo = "", page = 1, limit = 15) {
    const db = await getDatabaseConnection();
    let queryWhere = termo ? "WHERE ativa = 1 AND LOWER(nome) LIKE LOWER(?)" : "WHERE ativa = 1";
    let params = termo ? [`%${termo}%`] : [];
    
    const count = await db.get(`SELECT COUNT(*) as total FROM categorias ${queryWhere}`, params);
    const offset = (page - 1) * limit;
    const categorias = await db.all(`SELECT * FROM categorias ${queryWhere} ORDER BY nome ASC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    return { categorias, total: count ? count.total : 0 };
  }

  static async listarAtivas(termo = "") {
    const db = await getDatabaseConnection();
    if (termo) {
      return db.all("SELECT * FROM categorias WHERE ativa = 1 AND nome LIKE ? ORDER BY nome ASC", [`%${termo}%`]);
    }
    return db.all("SELECT * FROM categorias WHERE ativa = 1 ORDER BY nome ASC");
  }

  static async buscarPorId(id) {
    const db = await getDatabaseConnection();
    return db.get("SELECT * FROM categorias WHERE id = ?", [id]);
  }

  static async buscarPorNome(nome) {
    const db = await getDatabaseConnection();
    return db.get("SELECT * FROM categorias WHERE LOWER(nome) = LOWER(?)", [nome]);
  }

  static async criar(nome) {
    const db = await getDatabaseConnection();
    const result = await db.run("INSERT INTO categorias (nome) VALUES (?)", [nome]);
    return result.lastID;
  }

  static async atualizar(id, { nome, ativa }) {
    const db = await getDatabaseConnection();
    await db.run(
      "UPDATE categorias SET nome = ?, ativa = ? WHERE id = ?",
      [nome, ativa, id]
    );
    return this.buscarPorId(id);
  }

  // Verifica se existem vagas usando esta categoria
  static async contarVagas(id) {
    const db = await getDatabaseConnection();
    const result = await db.get("SELECT COUNT(*) as total FROM vagas WHERE categoria_id = ?", [id]);
    return result ? result.total : 0;
  }

  // Exclui a categoria do banco
  static async excluir(id) {
    const db = await getDatabaseConnection();
    await db.run("DELETE FROM categorias WHERE id = ?", [id]);
    return true;
  }
}
import { getDatabaseConnection } from "../database/connection.js";

export class CidadeRepository {
 static async listarTodas(termo = "", page = 1, limit = 15) {
    const db = await getDatabaseConnection();
    let queryWhere = termo ? "WHERE LOWER(nome) LIKE LOWER(?) OR LOWER(uf) LIKE LOWER(?)" : "";
    let params = termo ? [`%${termo}%`, `%${termo}%`] : [];
    
    const count = await db.get(`SELECT COUNT(*) as total FROM cidades ${queryWhere}`, params);
    const offset = (page - 1) * limit;
    const cidades = await db.all(`SELECT * FROM cidades ${queryWhere} ORDER BY uf ASC, nome ASC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    return { cidades, total: count ? count.total : 0 };
  }

  static async buscarPorId(id) {
    const db = await getDatabaseConnection();
    return db.get("SELECT * FROM cidades WHERE id = ?", [id]);
  }

  static async buscarPorNomeEUf(nome, uf) {
    const db = await getDatabaseConnection();
    return db.get(
      "SELECT * FROM cidades WHERE LOWER(nome) = LOWER(?) AND LOWER(uf) = LOWER(?)",
      [nome, uf]
    );
  }

  static async criar(nome, uf) {
    const db = await getDatabaseConnection();
    const result = await db.run(
      "INSERT INTO cidades (nome, uf) VALUES (?, ?)",
      [nome, uf.toUpperCase()]
    );
    return result.lastID;
  }

  // Novo: Atualiza cidade
  static async atualizar(id, { nome, uf }) {
    const db = await getDatabaseConnection();
    await db.run(
      "UPDATE cidades SET nome = ?, uf = ? WHERE id = ?",
      [nome, uf.toUpperCase(), id]
    );
    return this.buscarPorId(id);
  }

  // Novo: Verifica integridade com vagas
  static async contarVagas(id) {
    const db = await getDatabaseConnection();
    const result = await db.get("SELECT COUNT(*) as total FROM vagas WHERE cidade_id = ?", [id]);
    return result ? result.total : 0;
  }

  // Novo: Exclui cidade
  static async excluir(id) {
    const db = await getDatabaseConnection();
    await db.run("DELETE FROM cidades WHERE id = ?", [id]);
    return true;
  }
}
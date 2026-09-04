import { getDatabaseConnection } from "../database/connection.js";

export class AdminRepository {
  static async obterEstatisticasGlobais() {
    const db = await getDatabaseConnection();
    
    const usuarios = await db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'candidato' THEN 1 ELSE 0 END) as candidatos,
        SUM(CASE WHEN role = 'empresa' THEN 1 ELSE 0 END) as empresas,
        SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as bloqueados
       FROM usuarios`
    );

    const vagas = await db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberta' THEN 1 ELSE 0 END) as abertas,
        SUM(CASE WHEN status = 'encerrada' THEN 1 ELSE 0 END) as encerradas
       FROM vagas`
    );

    const candidaturas = await db.get(
      `SELECT COUNT(*) as total FROM candidaturas`
    );

    return { usuarios, vagas, candidaturas: candidaturas.total };
  }

  static async listarUsuarios() {
    const db = await getDatabaseConnection();
    return db.all(
      `SELECT id, nome, email, role, ativo, criado_em 
       FROM usuarios 
       ORDER BY criado_em DESC`
    );
  }

  static async alternarStatusUsuario(usuarioId, novoStatus) {
    const db = await getDatabaseConnection();
    await db.run(
      `UPDATE usuarios SET ativo = ? WHERE id = ?`,
      [novoStatus, usuarioId]
    );
    return db.get(`SELECT id, nome, email, role, ativo FROM usuarios WHERE id = ?`, [usuarioId]);
  }

  static async listarTodasVagas() {
    const db = await getDatabaseConnection();
    return db.all(
      `SELECT v.*, e.nome_fantasia as empresa_nome, c.nome as categoria_nome, cid.nome as cidade_nome
       FROM vagas v
       INNER JOIN empresas e ON e.id = v.empresa_id
       INNER JOIN categorias c ON c.id = v.categoria_id
       INNER JOIN cidades cid ON cid.id = v.cidade_id
       ORDER BY v.criado_em DESC`
    );
  }

  static async alterarStatusVaga(vagaId, novoStatus) {
    const db = await getDatabaseConnection();
    await db.run(
      `UPDATE vagas SET status = ? WHERE id = ?`,
      [novoStatus, vagaId]
    );
    return db.get(`SELECT * FROM vagas WHERE id = ?`, [vagaId]);
  }
}
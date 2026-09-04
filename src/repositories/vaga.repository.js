import { getDatabaseConnection } from "../database/connection.js";

export class VagaRepository {
  static async criar({ empresa_id, titulo, descricao, requisitos, salario, tipo_trabalho, cidade_id, categoria_id, status }) {
    const db = await getDatabaseConnection();
    const statusValido = (status === 'encerrada') ? 'encerrada' : 'ativa';
    const result = await db.run(
      `INSERT INTO vagas (empresa_id, titulo, descricao, requisitos, salario, tipo_trabalho, cidade_id, categoria_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [empresa_id, titulo, descricao, requisitos || null, salario || null, tipo_trabalho, cidade_id, categoria_id, statusValido]
    );
    return result.lastID;
  }

  static async buscarPorId(id) {
    const db = await getDatabaseConnection();
    return db.get(
      `SELECT v.*, 
              COALESCE(e.nome_fantasia, u.nome, 'Confidencial') as empresa_nome, 
              c.nome as categoria_nome, 
              cid.nome as cidade_nome, 
              cid.uf as cidade_uf
       FROM vagas v
       LEFT JOIN empresas e ON (e.id = v.empresa_id OR e.usuario_id = v.empresa_id)
       /* CORREÇÃO: Puxa o status do usuário correto (dono da empresa) */
       INNER JOIN usuarios u ON (u.id = e.usuario_id OR u.id = v.empresa_id) AND u.ativo = 1
       LEFT JOIN categorias c ON c.id = v.categoria_id
       LEFT JOIN cidades cid ON cid.id = v.cidade_id
       WHERE v.id = ?`,
      [Number(id)]
    );
  }

  static async listarComFiltros({ busca, categoria_id, cidade_id, tipo_trabalho, empresa, salarioMinimo, apenasAbertas = true, page = 1, limit = 20 }) {
    const db = await getDatabaseConnection();
    let queryBase = `
      FROM vagas v
      LEFT JOIN empresas e ON (e.id = v.empresa_id OR e.usuario_id = v.empresa_id)
      INNER JOIN usuarios u ON (u.id = e.usuario_id OR u.id = v.empresa_id) AND u.ativo = 1
      LEFT JOIN categorias c ON c.id = v.categoria_id
      LEFT JOIN cidades cid ON cid.id = v.cidade_id
      WHERE 1=1
    `;
    const params = [];

    if (apenasAbertas) {
      queryBase += ` AND (LOWER(v.status) = 'ativa' OR v.status IS NULL)`;
    }
    if (busca) {
      queryBase += ` AND (LOWER(v.titulo) LIKE LOWER(?) OR LOWER(v.descricao) LIKE LOWER(?))`;
      params.push(`%${busca}%`, `%${busca}%`);
    }
    if (categoria_id) {
      queryBase += ` AND v.categoria_id = ?`;
      params.push(Number(categoria_id));
    }
    if (cidade_id) {
      queryBase += ` AND v.cidade_id = ?`;
      params.push(Number(cidade_id));
    }
    if (tipo_trabalho) {
      queryBase += ` AND v.tipo_trabalho = ?`;
      params.push(tipo_trabalho);
    }
    // NOVO FILTRO: EMPRESA
    if (empresa) {
      queryBase += ` AND (LOWER(u.nome) LIKE LOWER(?) OR LOWER(e.nome_fantasia) LIKE LOWER(?))`;
      params.push(`%${empresa}%`, `%${empresa}%`);
    }
    // NOVO FILTRO: SALÁRIO MÍNIMO
    if (salarioMinimo) {
      queryBase += ` AND v.salario >= ?`;
      params.push(Number(salarioMinimo));
    }

    // Conta o total exato para a paginação
    const countResult = await db.get(`SELECT COUNT(*) as total ${queryBase}`, params);
    const total = countResult ? countResult.total : 0;

    // Busca apenas os registros da página atual
    const offset = (page - 1) * limit;
    const selectQuery = `
      SELECT v.*, 
             COALESCE(e.nome_fantasia, u.nome, 'Confidencial') as empresa_nome, 
             c.nome as categoria_nome, 
             cid.nome as cidade_nome, 
             cid.uf as cidade_uf
      ${queryBase}
      ORDER BY v.id DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;
    const vagas = await db.all(selectQuery, params);

    return { vagas, total };
  }

  static async listarPorEmpresaId(empresaId, usuarioId = null) {
    const db = await getDatabaseConnection();
    const idSecundario = usuarioId || empresaId;

    return db.all(
      `SELECT DISTINCT v.*, 
              c.nome as categoria_nome, 
              cid.nome as cidade_nome, 
              cid.uf as cidade_uf
       FROM vagas v
       LEFT JOIN empresas e ON (e.id = v.empresa_id OR e.usuario_id = v.empresa_id)
       /* CORREÇÃO APLICADA */
       INNER JOIN usuarios u ON (u.id = e.usuario_id OR u.id = v.empresa_id) AND u.ativo = 1
       LEFT JOIN categorias c ON c.id = v.categoria_id
       LEFT JOIN cidades cid ON cid.id = v.cidade_id
       WHERE (v.empresa_id = ? OR v.empresa_id = ? OR e.id = ? OR e.usuario_id = ?)
       ORDER BY v.id DESC`,
      [Number(empresaId), Number(idSecundario), Number(empresaId), Number(idSecundario)]
    );
  }

  static async atualizar(id, { titulo, descricao, requisitos, salario, tipo_trabalho, cidade_id, categoria_id, status }) {
    const db = await getDatabaseConnection();
    const statusValido = (status === 'encerrada') ? 'encerrada' : 'ativa';

    await db.run(
      `UPDATE vagas
       SET titulo = ?, descricao = ?, requisitos = ?, salario = ?, tipo_trabalho = ?, cidade_id = ?, categoria_id = ?, status = ?
       WHERE id = ?`,
      [titulo, descricao, requisitos || null, salario || null, tipo_trabalho, cidade_id, categoria_id, statusValido, Number(id)]
    );
    return VagaRepository.buscarPorId(id);
  }

  async criar(dados) { return VagaRepository.criar(dados); }
  async buscarPorId(id) { return VagaRepository.buscarPorId(id); }
  async listarComFiltros(filtros) { return VagaRepository.listarComFiltros(filtros); }
  async listarPorEmpresaId(emp, usu) { return VagaRepository.listarPorEmpresaId(emp, usu); }
  async atualizar(id, dados) { return VagaRepository.atualizar(id, dados); }
}
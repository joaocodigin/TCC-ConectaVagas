import { VagaRepository } from "../repositories/vaga.repository.js";
import { EmpresaRepository } from "../repositories/empresa.repository.js";
import { CategoriaRepository } from "../repositories/categoria.repository.js";
import { CidadeRepository } from "../repositories/cidade.repository.js";
import { UsuarioRepository } from "../repositories/usuario.repository.js";

const vagaRepo = new VagaRepository();
const empresaRepo = new EmpresaRepository();
const categoriaRepo = new CategoriaRepository();
const cidadeRepo = new CidadeRepository();
const usuarioRepo = new UsuarioRepository();

const buscarEmpresa = async (uId) => {
  try {
    if (EmpresaRepository.buscarPorUsuarioId) {
      return await EmpresaRepository.buscarPorUsuarioId(uId);
    }
    if (empresaRepo.buscarPorUsuarioId) {
      return await empresaRepo.buscarPorUsuarioId(uId);
    }
  } catch (err) {
    return null;
  }
  return null;
};

const buscarCategoria = (cId) => CategoriaRepository.buscarPorId ? CategoriaRepository.buscarPorId(cId) : categoriaRepo.buscarPorId(cId);
const buscarCidade = (cidId) => CidadeRepository.buscarPorId ? CidadeRepository.buscarPorId(cidId) : cidadeRepo.buscarPorId(cidId);
const buscarVaga = (vId) => VagaRepository.buscarPorId ? VagaRepository.buscarPorId(vId) : vagaRepo.buscarPorId(vId);

const obterIdentificadoresEmpresa = async (usuarioId) => {
  let empresa = await buscarEmpresa(usuarioId);

  if (!empresa) {
    const buscarUsuario = UsuarioRepository.buscarPorId || usuarioRepo.buscarPorId.bind(usuarioRepo);
    const usuario = await buscarUsuario(usuarioId);

    const nomeBase = usuario?.nome || "Empresa Cadastrada";
    const timestamp = Date.now().toString().slice(-8);

    const dadosCriacao = {
      usuario_id: usuarioId,
      nome_fantasia: nomeBase,
      razao_social: `${nomeBase} LTDA`,
      cnpj: `000000${timestamp}`,
      descricao: null,
      cidade: null,
      telefone: null
    };

    let novaEmpresaId;
    if (EmpresaRepository.criar) {
      novaEmpresaId = await EmpresaRepository.criar(dadosCriacao);
    } else if (empresaRepo.criar) {
      novaEmpresaId = await empresaRepo.criar(dadosCriacao);
    }

    empresa = { id: novaEmpresaId, usuario_id: usuarioId };
  }

  return {
    empresaId: empresa.id || null,
    usuarioId: Number(usuarioId)
  };
};

export class VagaService {
  static async criarVaga(usuarioId, dados) {
    const { empresaId, usuarioId: uId } = await obterIdentificadoresEmpresa(usuarioId);
    const empresaIdFinal = empresaId || uId;

    const { titulo, descricao, requisitos, salario, tipo_trabalho, cidade_id, categoria_id, status } = dados;

    if (!titulo || !descricao || !tipo_trabalho || !cidade_id || !categoria_id) {
      throw new Error("Titulo, descricao, tipo de trabalho, cidade e categoria sao obrigatorios.");
    }

    const categoria = await buscarCategoria(categoria_id);
    if (!categoria || (categoria.ativa !== undefined && !categoria.ativa)) {
      throw new Error("Categoria invalida ou inativa.");
    }

    const cidade = await buscarCidade(cidade_id);
    if (!cidade) {
      throw new Error("Cidade selecionada e invalida.");
    }

    const statusValido = (status === "encerrada") ? "encerrada" : "ativa";

    const criarMetodo = VagaRepository.criar ? VagaRepository.criar : vagaRepo.criar.bind(vagaRepo);
    const vagaId = await criarMetodo({
      empresa_id: empresaIdFinal,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      requisitos: requisitos ? requisitos.trim() : null,
      salario: salario ? Number(salario) : null,
      tipo_trabalho,
      cidade_id: Number(cidade_id),
      categoria_id: Number(categoria_id),
      status: statusValido
    });

    return await buscarVaga(vagaId);
  }

static async listarVagasPublicas(filtros = {}) {
    const listarMetodo = VagaRepository.listarComFiltros 
      ? VagaRepository.listarComFiltros 
      : (vagaRepo.listarComFiltros ? vagaRepo.listarComFiltros.bind(vagaRepo) : null);

    if (!listarMetodo) {
      const buscarTodas = VagaRepository.buscarTodas ? VagaRepository.buscarTodas : vagaRepo.buscarTodas?.bind(vagaRepo);
      const vagasFallback = (await buscarTodas?.()) || [];
      return { itens: vagasFallback, total: vagasFallback.length, paginaAtual: 1, totalPaginas: 1 };
    }

    const page = parseInt(filtros.page) || 1;
    const limit = parseInt(filtros.limit) || 20;

    const result = await listarMetodo({
      ...filtros,
      apenasAbertas: true,
      page,
      limit
    });

    // Como o repositório agora retorna { vagas, total }, extraímos corretamente
    const vagas = result.vagas || result;
    const total = result.total !== undefined ? result.total : vagas.length;

    return {
      itens: vagas,
      total: total,
      paginaAtual: page,
      totalPaginas: Math.ceil(total / limit)
    };
  }
  static async buscarPorId(id) {
    const vaga = await buscarVaga(id);
    if (!vaga) {
      throw new Error("Vaga nao encontrada.");
    }
    return vaga;
  }

  static async listarMinhasVagas(usuarioId) {
    const { empresaId, usuarioId: uId } = await obterIdentificadoresEmpresa(usuarioId);

    const listarPorEmpresa = VagaRepository.listarPorEmpresaId 
      ? VagaRepository.listarPorEmpresaId 
      : vagaRepo.listarPorEmpresaId.bind(vagaRepo);

    return await listarPorEmpresa(empresaId, uId);
  }

  static async atualizarVaga(usuarioId, vagaId, dados) {
    const { empresaId, usuarioId: uId } = await obterIdentificadoresEmpresa(usuarioId);

    const vagaExistente = await buscarVaga(vagaId);
    if (!vagaExistente) {
      throw new Error("Vaga nao encontrada.");
    }

    const pertenceAEmpresa = Number(vagaExistente.empresa_id) === Number(empresaId) || 
                             Number(vagaExistente.empresa_id) === Number(uId);

    if (!pertenceAEmpresa) {
      throw new Error("Acesso negado: Voce nao tem permissao para alterar esta vaga.");
    }

    const { titulo, descricao, requisitos, salario, tipo_trabalho, cidade_id, categoria_id, status } = dados;

    let statusAtualizar = vagaExistente.status;
    if (status === "ativa" || status === "encerrada") {
      statusAtualizar = status;
    }

    const atualizarMetodo = VagaRepository.atualizar 
      ? VagaRepository.atualizar 
      : vagaRepo.atualizar.bind(vagaRepo);

    return await atualizarMetodo(vagaId, {
      titulo: titulo ? titulo.trim() : vagaExistente.titulo,
      descricao: descricao ? descricao.trim() : vagaExistente.descricao,
      requisitos: requisitos !== undefined ? requisitos : vagaExistente.requisitos,
      salario: salario !== undefined ? salario : vagaExistente.salario,
      tipo_trabalho: tipo_trabalho || vagaExistente.tipo_trabalho,
      cidade_id: cidade_id || vagaExistente.cidade_id,
      categoria_id: categoria_id || vagaExistente.categoria_id,
      status: statusAtualizar
    });
  }
}
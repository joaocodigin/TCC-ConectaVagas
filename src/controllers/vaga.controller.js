import { VagaService } from "../services/vaga.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export class VagaController {
  static async criar(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Usuario nao autenticado.", 401);
      }
      const usuarioId = Number(req.session.usuario.id || req.session.usuario.usuario_id);

      const metodoCriar = VagaService.criar || VagaService.criarVaga;
      
      if (typeof metodoCriar !== "function") {
        return sendError(res, "Metodo de criacao nao encontrado no VagaService.", 500);
      }

      const novaVaga = await metodoCriar.call(VagaService, usuarioId, req.body);
      return sendSuccess(res, novaVaga, 201);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async listarPublicas(req, res) {
    try {
      // Captura todos os filtros avançados e parâmetros de paginação da URL
      const { busca, categoria_id, cidade_id, tipo_trabalho, empresa, salario, page, limit } = req.query;
      
      const metodoBusca = VagaService.listarPublicas || VagaService.listarVagasPublicas || VagaService.listarComFiltros;

      const filtros = {
        busca,
        categoria_id,
        cidade_id,
        tipo_trabalho,
        empresa,
        salarioMinimo: salario,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      const vagas = typeof metodoBusca === "function" 
        ? await metodoBusca.call(VagaService, filtros)
        : { itens: [], total: 0, paginaAtual: 1, totalPaginas: 1 };

      return sendSuccess(res, vagas, 200);
    } catch (error) {
      return sendSuccess(res, { itens: [], total: 0, paginaAtual: 1, totalPaginas: 1 }, 200);
    }
  }

  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const metodoBuscar = VagaService.buscarPorId || VagaService.obterPorId;

      const vaga = typeof metodoBuscar === "function" 
        ? await metodoBuscar.call(VagaService, Number(id))
        : null;

      if (!vaga) {
        return sendError(res, "Vaga nao encontrada.", 404);
      }
      return sendSuccess(res, vaga, 200);
    } catch (error) {
      return sendError(res, error.message, 404);
    }
  }

  static async listarMinhasVagas(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Usuario nao autenticado.", 401);
      }
      const usuarioId = Number(req.session.usuario.id || req.session.usuario.usuario_id);

      const metodoMinhas = VagaService.listarMinhasVagas || VagaService.listarPorEmpresa;

      const vagas = typeof metodoMinhas === "function"
        ? await metodoMinhas.call(VagaService, usuarioId)
        : [];

      return sendSuccess(res, vagas || [], 200);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async atualizar(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Usuario nao autenticado.", 401);
      }
      const usuarioId = Number(req.session.usuario.id || req.session.usuario.usuario_id);
      const { id } = req.params;
      
      const metodoAtualizar = VagaService.atualizar || VagaService.atualizarVaga;

      const vagaAtualizada = typeof metodoAtualizar === "function"
        ? await metodoAtualizar.call(VagaService, usuarioId, Number(id), req.body || {})
        : null;

      return sendSuccess(res, vagaAtualizada, 200);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async encerrar(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Usuario nao autenticado.", 401);
      }
      const usuarioId = Number(req.session.usuario.id || req.session.usuario.usuario_id);
      const { id } = req.params;

      const metodoAtualizar = VagaService.atualizar || VagaService.atualizarVaga;
      const dadosEncerramento = { status: "encerrada" };

      const vagaEncerrada = typeof metodoAtualizar === "function"
        ? await metodoAtualizar.call(VagaService, usuarioId, Number(id), dadosEncerramento)
        : null;

      return sendSuccess(res, vagaEncerrada, 200);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }
}
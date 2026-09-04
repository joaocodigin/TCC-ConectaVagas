import { AdminService } from "../services/admin.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export class AdminController {
  static async dashboard(req, res) {
    try {
      const estatisticas = await AdminService.obterDashboard();
      return sendSuccess(res, estatisticas);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

 // ATUALIZADO: Captura a página requisitada
  static async listarUsuarios(req, res) {
    try {
      const termoPesquisa = req.query.q || "";
      const page = parseInt(req.query.page) || 1;
      const limit = 15; // Regra de negócio exigida: 15 itens por página
      
      const resultado = await AdminService.listarUsuarios(termoPesquisa, page, limit);
      return sendSuccess(res, resultado);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }
  static async alternarStatusUsuario(req, res) {
    try {
      const adminId = req.session.usuario.id;
      const { id } = req.params;
      const usuarioAtualizado = await AdminService.alternarStatusUsuario(adminId, id);
      return sendSuccess(res, usuarioAtualizado);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async editarUsuario(req, res) {
    try {
      const adminId = req.session.usuario.id;
      const { id } = req.params;
      const dados = req.body; // { nome, email, role }
      const usuarioEditado = await AdminService.editarUsuario(adminId, id, dados);
      return sendSuccess(res, usuarioEditado);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async excluirUsuario(req, res) {
    try {
      const adminId = req.session.usuario.id;
      const { id } = req.params;
      const resultado = await AdminService.excluirUsuario(adminId, id);
      return sendSuccess(res, resultado);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async listarVagas(req, res) {
    try {
      const vagas = await AdminService.listarTodasVagas();
      return sendSuccess(res, vagas);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static async alterarStatusVaga(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const vagaAtualizada = await AdminService.alterarStatusVaga(id, status);
      return sendSuccess(res, vagaAtualizada);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }
}
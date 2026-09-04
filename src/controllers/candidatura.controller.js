import { CandidaturaService } from "../services/candidatura.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export class CandidaturaController {
  static async candidatar(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Usuario nao autenticado.", 401);
      }
      const candidatoId = Number(req.session.usuario.id || req.session.usuario.usuario_id);
      const { vaga_id } = req.body;

      if (!vaga_id) {
        return sendError(res, "O ID da vaga é obrigatório.", 400);
      }

      const candidatura = await CandidaturaService.candidatar(candidatoId, Number(vaga_id));
      return sendSuccess(res, candidatura, 201);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async listarMinhas(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Usuario nao autenticado.", 401);
      }
      const candidatoId = Number(req.session.usuario.id || req.session.usuario.usuario_id);
      const candidaturas = await CandidaturaService.listarMinhasCandidaturas(candidatoId);
      return sendSuccess(res, candidaturas || []);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static async listarPorVaga(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Usuario nao autenticado.", 401);
      }
      const usuarioEmpresaId = Number(req.session.usuario.id || req.session.usuario.usuario_id);
      const { vagaId } = req.params;

      if (!vagaId || isNaN(Number(vagaId))) {
        return sendError(res, "ID da vaga inválido.", 400);
      }

      const candidaturas = await CandidaturaService.listarCandidatosDaVaga(usuarioEmpresaId, Number(vagaId));
      return sendSuccess(res, candidaturas || []);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async atualizarStatus(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Usuario nao autenticado.", 401);
      }
      const usuarioEmpresaId = Number(req.session.usuario.id || req.session.usuario.usuario_id);
      const { id } = req.params;
      const { status } = req.body;

      const candidaturaAtualizada = await CandidaturaService.atualizarStatus(usuarioEmpresaId, Number(id), status);
      return sendSuccess(res, candidaturaAtualizada);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }
}
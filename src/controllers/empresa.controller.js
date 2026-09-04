import { EmpresaService } from "../services/empresa.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export class EmpresaController {
  static async registrar(req, res) {
    try {
      const empresa = await EmpresaService.registrarEmpresa(req.body);
      return sendSuccess(res, empresa, 201);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async meuPerfil(req, res) {
    try {
      const usuarioId = req.session.usuario.id;
      const empresa = await EmpresaService.buscarPerfilPorUsuario(usuarioId);
      return sendSuccess(res, empresa);
    } catch (error) {
      return sendError(res, error.message, 404);
    }
  }

  static async atualizarMeuPerfil(req, res) {
    try {
      const usuarioId = req.session.usuario.id;
      const empresaAtualizada = await EmpresaService.atualizarPerfil(usuarioId, req.body);
      return sendSuccess(res, empresaAtualizada);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }
}
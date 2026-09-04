import { CidadeService } from "../services/cidade.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export class CidadeController {
static async listar(req, res) {
    try {
      const termo = req.query.q || "";
      const page = parseInt(req.query.page) || 1;
      const limit = 15;
      const resultado = await CidadeService.listar(termo, page, limit);
      return sendSuccess(res, resultado);
    } catch (error) { return sendError(res, error.message, 500); }
  }

  static async criar(req, res) {
    try {
      const { nome, uf } = req.body;
      const novaCidade = await CidadeService.criar(nome, uf);
      return sendSuccess(res, novaCidade, 201);
    } catch (error) { return sendError(res, error.message, 400); }
  }

  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      const cidadeAtualizada = await CidadeService.atualizar(id, req.body);
      return sendSuccess(res, cidadeAtualizada);
    } catch (error) { return sendError(res, error.message, 400); }
  }

  // ESTE MÉTODO PRECISA EXISTIR AQUI:
  static async excluir(req, res) {
    try {
      const { id } = req.params;
      const resultado = await CidadeService.excluir(id);
      return sendSuccess(res, resultado);
    } catch (error) { 
      return sendError(res, error.message, 400); 
    }
  }
}
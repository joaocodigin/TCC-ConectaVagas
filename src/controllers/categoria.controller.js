import { CategoriaService } from "../services/categoria.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export class CategoriaController {
static async listar(req, res) {
    try {
      const termo = req.query.q || "";
      const page = parseInt(req.query.page) || 1;
      const limit = 15;
      const apenasAtivas = !req.session?.usuario || req.session.usuario.role !== "admin";
      const resultado = await CategoriaService.listar(apenasAtivas, termo, page, limit);
      return sendSuccess(res, resultado);
    } catch (error) { return sendError(res, error.message, 500); }
  }
    

  static async criar(req, res) {
    try {
      const { nome } = req.body;
      const novaCategoria = await CategoriaService.criar(nome);
      return sendSuccess(res, novaCategoria, 201);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      const categoriaAtualizada = await CategoriaService.atualizar(id, req.body);
      return sendSuccess(res, categoriaAtualizada);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async excluir(req, res) {
    try {
      const { id } = req.params;
      const resultado = await CategoriaService.excluir(id);
      return sendSuccess(res, resultado);
    } catch (error) {
      return sendError(res, error.message, 400); // 400 pois pode ser erro de integridade (vagas vinculadas)
    }
  }
}
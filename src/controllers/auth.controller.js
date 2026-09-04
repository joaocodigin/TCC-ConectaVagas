import { AuthService } from "../services/auth.service.js";
import { UsuarioRepository } from "../repositories/usuario.repository.js";
import { sendSuccess, sendError } from "../utils/response.js";

const usuarioRepository = new UsuarioRepository();
const authService = new AuthService();

export class AuthController {
  
  static async registrar(req, res, next) {
    try {
      const { nome, email, senha, role } = req.body;
      const usuario = await authService.registrar({ nome, email, senha, role });

      // Oculta a senha do retorno
      const { senha: _, ...usuarioSemSenha } = usuario;
      return sendSuccess(res, usuarioSemSenha, 201);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;
      const usuario = await authService.login({ email, senha });

      // Prepara os dados limpos do usuario para a sessao
      const dadosUsuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      };

      req.session.usuario = dadosUsuario;

      // Grava a sessao explicitamente antes de responder
      return req.session.save((err) => {
        if (err) {
          return sendError(res, "Nao foi possivel salvar a sessao.", 500);
        }
        return sendSuccess(res, { usuario: dadosUsuario }, 200);
      });
    } catch (error) {
      return sendError(res, error.message, 401);
    }
  }

  static async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return sendError(res, "Nao foi possivel encerrar a sessao.", 500);
      }
      res.clearCookie("connect.sid");
      return sendSuccess(res, { message: "Logout realizado com sucesso." }, 200);
    });
  }

  static async me(req, res) {
    try {
      if (!req.session || !req.session.usuario) {
        return sendError(res, "Nenhum usuario autenticado.", 401);
      }

      // Tenta buscar no banco; se falhar por erro de SQL/BD, usa a propria sessao para nao quebrar a tela
      let usuario = null;
      try {
        usuario = await usuarioRepository.buscarPorId(req.session.usuario.id);
      } catch (errDb) {
        usuario = req.session.usuario;
      }

      if (!usuario) {
        usuario = req.session.usuario;
      }

      // Remove campo de senha por seguranca caso tenha vindo do BD
      const { senha: _, ...usuarioLimpo } = usuario;

      return sendSuccess(res, { usuario: usuarioLimpo }, 200);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }
}
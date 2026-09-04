import { UsuarioRepository } from "../repositories/usuario.repository.js";

export const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ success: false, message: "Não autorizado. Faça login." });
  }

  try {
    // Validação em tempo real: Verifica se o usuário foi bloqueado ou excluído pelo admin
    const usuarioRepo = new UsuarioRepository();
    const usuarioBanco = await usuarioRepo.buscarPorId(req.session.usuario.id);

    if (!usuarioBanco || usuarioBanco.ativo === 0) {
      req.session.destroy(); // Destrói a sessão na hora (Auto-Logout)
      return res.status(401).json({ success: false, message: "Sessão invalidada. Conta bloqueada ou removida." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao validar sessão." });
  }
};
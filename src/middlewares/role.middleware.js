import { sendError } from "../utils/response.js";

export function requireRole(...rolesPermitidas) {
  return (req, res, next) => {
    if (!req.session || !req.session.usuario) {
      return sendError(res, "Acesso não autorizado.", 401);
    }

    const roleUsuario = req.session.usuario.role;
    if (!rolesPermitidas.includes(roleUsuario)) {
      return sendError(res, "Você não possui permissão para acessar este recurso.", 403);
    }

    next();
  };
}
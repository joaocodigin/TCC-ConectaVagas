import { Router } from "express";
import { EmpresaController } from "../controllers/empresa.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

// Rota pública de registro de empresa (conta + perfil)
router.post("/registrar", EmpresaController.registrar);

// Rotas protegidas (exclusivas para contas do tipo EMPRESA)
router.get("/meu-perfil", requireAuth, requireRole(ROLES.EMPRESA), EmpresaController.meuPerfil);
router.put("/meu-perfil", requireAuth, requireRole(ROLES.EMPRESA), EmpresaController.atualizarMeuPerfil);

export default router;
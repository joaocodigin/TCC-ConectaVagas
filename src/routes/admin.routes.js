import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

// Todas as rotas deste grupo exigem AUTENTICAÇÃO + PERFIL DE ADMIN
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get("/dashboard", AdminController.dashboard);
router.get("/usuarios", AdminController.listarUsuarios);
router.patch("/usuarios/:id/status", AdminController.alternarStatusUsuario);
router.put("/usuarios/:id", AdminController.editarUsuario);
router.delete("/usuarios/:id", AdminController.excluirUsuario);
router.get("/vagas", AdminController.listarVagas);
router.patch("/vagas/:id/status", AdminController.alterarStatusVaga);

export default router;
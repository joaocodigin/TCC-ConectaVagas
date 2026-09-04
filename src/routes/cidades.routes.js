import { Router } from "express";
import { CidadeController } from "../controllers/cidade.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

// Rota pública para listagem
router.get("/", CidadeController.listar);

// Rotas administrativas (Apenas ADMIN)
router.post("/", requireAuth, requireRole(ROLES.ADMIN), CidadeController.criar);
router.put("/:id", requireAuth, requireRole(ROLES.ADMIN), CidadeController.atualizar);
router.delete("/:id", requireAuth, requireRole(ROLES.ADMIN), CidadeController.excluir);

export default router;
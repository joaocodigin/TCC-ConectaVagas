import { Router } from "express";
import { CategoriaController } from "../controllers/categoria.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

// Rota pública para listagem
router.get("/", CategoriaController.listar);

// Rotas administrativas (Apenas ADMIN)
router.post("/", requireAuth, requireRole(ROLES.ADMIN), CategoriaController.criar);
router.put("/:id", requireAuth, requireRole(ROLES.ADMIN), CategoriaController.atualizar);
router.delete("/:id", requireAuth, requireRole(ROLES.ADMIN), CategoriaController.excluir);

export default router;
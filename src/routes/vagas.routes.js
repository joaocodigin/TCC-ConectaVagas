import { Router } from "express";
import { VagaController } from "../controllers/vaga.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

// 1. Rotas estaticas publicas e autenticadas
router.get("/", VagaController.listarPublicas);
router.get("/minhas", requireAuth, requireRole(ROLES.EMPRESA), VagaController.listarMinhasVagas);

// 2. Criacao de vaga
router.post("/", requireAuth, requireRole(ROLES.EMPRESA), VagaController.criar);

// 3. Rotas com parametro dinamico ID
router.get("/:id", VagaController.buscarPorId);
router.put("/:id", requireAuth, requireRole(ROLES.EMPRESA), VagaController.atualizar);

// 4. Rota de encerramento da vaga (Atende a chamada do frontend)
router.patch("/:id/encerrar", requireAuth, requireRole(ROLES.EMPRESA), VagaController.atualizar);

export default router;
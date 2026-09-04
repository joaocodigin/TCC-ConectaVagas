import { Router } from "express";
import { CandidaturaController } from "../controllers/candidatura.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

// Rotas exclusivas de CANDIDATOS
router.post("/", requireAuth, requireRole(ROLES.CANDIDATO), CandidaturaController.candidatar);
router.get("/minhas", requireAuth, requireRole(ROLES.CANDIDATO), CandidaturaController.listarMinhas);

// Rotas exclusivas de EMPRESAS
router.get("/vaga/:vagaId", requireAuth, requireRole(ROLES.EMPRESA), CandidaturaController.listarPorVaga);
router.patch("/:id/status", requireAuth, requireRole(ROLES.EMPRESA), CandidaturaController.atualizarStatus);

export default router;
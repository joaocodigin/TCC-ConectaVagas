import express from "express";
import { sessionConfig } from "./config/session.js";
import { sendError, sendSuccess } from "./utils/response.js";
import authRoutes from "./routes/auth.routes.js";
import empresaRoutes from "./routes/empresa.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import cidadesRoutes from "./routes/cidades.routes.js";
import vagasRoutes from "./routes/vagas.routes.js";
import candidaturasRoutes from "./routes/candidaturas.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

// Middlewares Globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessao registrada ANTES das rotas e estaticos
app.use(sessionConfig);

// Servir arquivos estaticos do frontend
app.use(express.static("public"));

// Registrando Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/cidades", cidadesRoutes);
app.use("/api/vagas", vagasRoutes);
app.use("/api/candidaturas", candidaturasRoutes);
app.use("/api/admin", adminRoutes);

// Rota de Health Check
app.get("/api/health", (req, res) => {
  return sendSuccess(res, { status: "OK", timestamp: new Date() });
});

// Middleware Centralizado de Tratamento de Erros
app.use((err, req, res, next) => {
  console.error("Erro capturado no middleware centralizado:", err.message);
  return sendError(res, "Ocorreu um erro interno ao processar a requisicao.", 500);
});

export default app;
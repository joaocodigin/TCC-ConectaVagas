import app from "./app.js";
import { env } from "./config/env.js";
import { getDatabaseConnection } from "./database/connection.js";
import { runMigrations } from "./database/migrations/init.js";

async function startServer() {
  try {
    // 1. Conecta ao banco de dados
    await getDatabaseConnection();
    console.log("-> Conexao com SQLite estabelecida com sucesso.");

    // 2. Executa as migracao de tabelas
    await runMigrations();

    // 3. Inicia o servidor HTTP
    app.listen(env.port, () => {
      console.log(`-> Servidor Conecta Vagas rodando na porta ${env.port}`);
    });
  } catch (error) {
    console.error("-> Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
}

startServer();
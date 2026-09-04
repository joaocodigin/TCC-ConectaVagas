import { getDatabaseConnection } from "../src/database/connection.js";

const BASE_URL = process.env.API_URL || "http://localhost:3000";

async function testarConexaoBanco() {
  console.log("[1/4] Testando conexao com o banco de dados...");
  try {
    const db = await getDatabaseConnection();
    const resultado = await db.get("SELECT 1 + 1 AS resultado");
    
    if (resultado && resultado.resultado === 2) {
      console.log("OK: Conexao com o banco de dados estabelecida com sucesso.");
      return true;
    }
    throw new Error("Resultado inesperado da consulta SQL de teste.");
  } catch (error) {
    console.error("ERRO: Falha ao conectar no banco de dados:", error.message);
    return false;
  }
}

async function testarHealthcheckServidor() {
  console.log("\n[2/4] Testando disponibilidade da API...");
  try {
    const resposta = await fetch(`${BASE_URL}/api/health`);
    if (resposta.ok) {
      console.log("OK: Servidor online e respondendo na porta configurada.");
      return true;
    }
    console.log("AVISO: Endpoint /api/health nao encontrado. Verificando rota raiz '/'...");
    const respostaRaiz = await fetch(`${BASE_URL}/`);
    if (respostaRaiz.ok || respostaRaiz.status === 404) {
      console.log("OK: Servidor HTTP respondendo requisicoes.");
      return true;
    }
    throw new Error(`Servidor respondeu com status ${resposta.status}`);
  } catch (error) {
    console.error("ERRO: Servidor HTTP inacessivel em", BASE_URL);
    console.error("Certifique-se de que o servidor Node.js esta rodando (npm start).");
    return false;
  }
}

async function testarFluxoAutenticacao() {
  console.log("\n[3/4] Testando fluxo de registro e login...");
  
  const emailTeste = `teste_${Date.now()}@conectavagas.com`;
  const senhaTeste = "SenhaTeste123!";

  try {
    // 1. Registro
    const resRegistro = await fetch(`${BASE_URL}/api/auth/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Usuario Teste Integracao",
        email: emailTeste,
        senha: senhaTeste,
        role: "candidato"
      })
    });

    const bodyRegistro = await resRegistro.json();

    if (!resRegistro.ok || !bodyRegistro.success) {
      throw new Error(`Falha no registro: ${bodyRegistro.message || resRegistro.statusText}`);
    }
    console.log("OK: Registro de novo usuario realizado com sucesso.");

    // 2. Login
    const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailTeste,
        senha: senhaTeste
      })
    });

    const bodyLogin = await resLogin.json();

    if (!resLogin.ok || !bodyLogin.success) {
      throw new Error(`Falha no login: ${bodyLogin.message || resLogin.statusText}`);
    }

    console.log("OK: Autenticacao (login) realizada com sucesso.");

    // 3. Limpeza do usuario de teste no banco SQLite
    const db = await getDatabaseConnection();
    await db.run("DELETE FROM usuarios WHERE email = ?", [emailTeste]);
    console.log("OK: Registro de teste removido do banco de dados.");

    return true;
  } catch (error) {
    console.error("ERRO: Falha no teste do fluxo de autenticacao:", error.message);
    return false;
  }
}

async function executarTestes() {
  console.log("==================================================");
  console.log("   INICIANDO TESTES DE INTEGRACAO - CONECTA VAGAS  ");
  console.log("==================================================\n");

  const bancoOk = await testarConexaoBanco();
  if (!bancoOk) {
    console.error("\nCANCELADO: Impossivel prosseguir sem conexao com o banco de dados.");
    process.exit(1);
  }

  const servidorOk = await testarHealthcheckServidor();
  if (!servidorOk) {
    console.error("\nCANCELADO: Impossivel prosseguir sem o servidor rodando.");
    process.exit(1);
  }

  const fluxoOk = await testarFluxoAutenticacao();

  console.log("\n==================================================");
  if (bancoOk && servidorOk && fluxoOk) {
    console.log("RESULTADO FINAL: TODOS OS TESTES PASSARAM COM SUCESSO!");
    console.log("==================================================");
    process.exit(0);
  } else {
    console.log("RESULTADO FINAL: ALGUNS TESTES FALHARAM.");
    console.log("==================================================");
    process.exit(1);
  }
}

executarTestes();
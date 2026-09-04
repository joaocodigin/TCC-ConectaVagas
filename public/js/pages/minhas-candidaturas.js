import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { listarMinhasCandidaturas } from "../api/candidaturas.api.js";

const listaCandidaturas = document.getElementById("lista-candidaturas");
const mensagemErro = document.getElementById("mensagem-erro");
const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
  btnLogout.addEventListener("click", async (e) => {
    e.preventDefault();
    await logout();
    window.location.href = "/login.html";
  });
}

async function verificarAcesso() {
  try {
    const perfilRes = await buscarPerfilAtual();
    
    // Extração segura do objeto de usuário para evitar undefined na role
    const usuario = perfilRes?.data?.usuario || perfilRes?.data;

    if (!perfilRes?.success || !usuario || usuario.role !== "candidato") {
      window.location.href = "/";
      return false;
    }
    return true;
  } catch (error) {
    window.location.href = "/login.html";
    return false;
  }
}

async function carregarCandidaturas() {
  try {
    const resposta = await listarMinhasCandidaturas();

    // Tratamento flexível para extrair o array de candidaturas
    let candidaturas = [];
    if (Array.isArray(resposta?.data)) {
      candidaturas = resposta.data;
    } else if (Array.isArray(resposta?.data?.candidaturas)) {
      candidaturas = resposta.data.candidaturas;
    } else if (Array.isArray(resposta)) {
      candidaturas = resposta;
    }

    if (!listaCandidaturas) return;

    if (candidaturas.length === 0) {
      listaCandidaturas.innerHTML = `
        <div class="card">
          <p>Você ainda não se candidatou a nenhuma vaga.</p>
          <br>
          <a href="/">Navegar pelas vagas disponíveis</a>
        </div>
      `;
      return;
    }

    listaCandidaturas.innerHTML = candidaturas.map((candidatura) => {
      let classeStatus = "";
      const statusLower = (candidatura.status || "pendente").toLowerCase();

      if (statusLower === "aceito") {
        classeStatus = "color: #166534; font-weight: bold;";
      } else if (statusLower === "recusado") {
        classeStatus = "color: #991b1b; font-weight: bold;";
      } else {
        classeStatus = "color: #854d0e; font-weight: bold;";
      }

      const salarioFormatado = candidatura.salario
        ? `R$ ${Number(candidatura.salario).toFixed(2)}`
        : "A combinar";

      return `
        <div class="card" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3>${candidatura.vaga_titulo || candidatura.titulo || "Vaga sem título"}</h3>
              <p><strong>Empresa:</strong> ${candidatura.empresa_nome || "Confidencial"}</p>
              <p><strong>Cidade:</strong> ${candidatura.cidade_nome || "Não informada"}</p>
              <p><strong>Salário:</strong> ${salarioFormatado}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Status:</strong> <span style="${classeStatus}">${statusLower.toUpperCase()}</span></p>
              <br>
              <a href="/vaga-detalhes.html?id=${candidatura.vaga_id || candidatura.id}">Ver Detalhes da Vaga</a>
            </div>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    if (mensagemErro) {
      mensagemErro.textContent = error.message || "Erro ao carregar lista de candidaturas.";
      mensagemErro.style.display = "block";
    }
    if (listaCandidaturas) {
      listaCandidaturas.innerHTML = `<div class="card"><p>Não foi possível exibir suas candidaturas no momento.</p></div>`;
    }
  }
}

async function inicializar() {
  const autorizado = await verificarAcesso();
  if (autorizado) {
    await carregarCandidaturas();
  }
}

inicializar();
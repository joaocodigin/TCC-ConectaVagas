import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { listarMinhasVagas, alterarStatusVaga } from "../api/vagas.api.js";
import { listarCandidatosDaVaga, atualizarStatusCandidatura } from "../api/candidaturas.api.js";

const listaMinhasVagas = document.getElementById("lista-minhas-vagas");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");
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
    const usuario = perfilRes?.data?.usuario || perfilRes?.data;

    if (!perfilRes?.success && !usuario) {
      window.location.href = "/";
      return false;
    }
    return true;
  } catch (error) {
    console.error("Erro ao verificar perfil:", error);
    window.location.href = "/login.html";
    return false;
  }
}

async function carregarVagas() {
  if (!listaMinhasVagas) return;

  try {
    const resposta = await listarMinhasVagas();
    
    let vagas = [];
    if (Array.isArray(resposta)) {
      vagas = resposta;
    } else if (resposta && typeof resposta === 'object') {
      if (Array.isArray(resposta.data)) {
        vagas = resposta.data;
      } else if (resposta.data && Array.isArray(resposta.data.vagas)) {
        vagas = resposta.data.vagas;
      } else if (Array.isArray(resposta.vagas)) {
        vagas = resposta.vagas;
      }
    }

    if (!vagas || vagas.length === 0) {
      listaMinhasVagas.innerHTML = `
        <div class="card" style="padding: 1.5rem; text-align: center;">
          <p>Sua empresa ainda não cadastrou nenhuma vaga.</p>
        </div>`;
      return;
    }

    listaMinhasVagas.innerHTML = "";

    vagas.forEach((vaga) => {
      const vagaId = vaga.id || vaga.vaga_id;
      const titulo = vaga.titulo || vaga.nome || "Vaga sem título";
      const status = vaga.status || "ativa";
      const salarioValor = vaga.salario ? Number(vaga.salario) : null;
      const salarioTexto = salarioValor && !isNaN(salarioValor) 
        ? `R$ ${salarioValor.toFixed(2)}` 
        : "A combinar";

      const cardVaga = document.createElement("div");
      cardVaga.className = "card";
      cardVaga.style.marginBottom = "1rem";
      cardVaga.style.padding = "1rem";
      cardVaga.style.border = "1px solid #e2e8f0";
      cardVaga.style.borderRadius = "8px";

      // Verifica se a vaga está ativa ou não
      const ehAtiva = status.toLowerCase() === "ativa" || status.toLowerCase() === "aberta";
      
      // Renderiza botão vermelho se estiver ativa, e verde se estiver encerrada
      const btnStatusHtml = ehAtiva
        ? `<button class="btn-toggle-status" data-id="${vagaId}" data-novo-status="encerrada" style="background-color: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold;">Encerrar Vaga</button>` 
        : `<button class="btn-toggle-status" data-id="${vagaId}" data-novo-status="ativa" style="background-color: #16a34a; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold;">Ativar Vaga</button>`;

      cardVaga.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="margin-top: 0;">${titulo}</h3>
            <p><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: bold; color: ${ehAtiva ? '#16a34a' : '#dc2626'};">${status}</span></p>
            <p><strong>Salário:</strong> ${salarioTexto}</p>
          </div>
          <div>${btnStatusHtml}</div>
        </div>
        <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #e2e8f0;">
        <h4 style="margin-bottom: 0.5rem;">Candidatos Inscritos:</h4>
        <div id="candidatos-vaga-${vagaId}" style="margin-top: 0.5rem;">
          <p style="color: #64748b;">Carregando candidatos...</p>
        </div>
      `;

      listaMinhasVagas.appendChild(cardVaga);

      if (vagaId) {
        carregarCandidatos(vagaId);
      }
    });

    vincularEventosStatusVaga();
  } catch (error) {
    console.error("Erro na renderização das vagas no Front:", error);
    listaMinhasVagas.innerHTML = `
      <div class="card" style="padding: 1rem; color: #dc2626;">
        <p><strong>Erro no Frontend:</strong> ${error.message}</p>
      </div>`;
  }
}

async function carregarCandidatos(vagaId) {
  const container = document.getElementById(`candidatos-vaga-${vagaId}`);
  if (!container) return;

  try {
    const resposta = await listarCandidatosDaVaga(vagaId);
    let candidatos = [];

    if (Array.isArray(resposta)) {
      candidatos = resposta;
    } else if (resposta?.data && Array.isArray(resposta.data)) {
      candidatos = resposta.data;
    }

    if (!candidatos || candidatos.length === 0) {
      container.innerHTML = `<p style="color: #64748b; font-style: italic;">Nenhum candidato inscrito até o momento.</p>`;
      return;
    }

    container.innerHTML = candidatos.map(c => {
      const candId = c.id || c.candidatura_id;
      const nome = c.candidato_nome || c.nome || "Candidato";
      const email = c.candidato_email || c.email || "-";
      const status = c.status || "pendente";

      return `
        <div style="padding: 0.5rem 0; border-bottom: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0.2rem 0;"><strong>Nome:</strong> ${nome}</p>
            <p style="margin: 0.2rem 0;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 0.2rem 0;"><strong>Status:</strong> ${status}</p>
          </div>
          <div>
            <button class="btn-status" data-id="${candId}" data-status="aceito" style="background-color: #16a34a; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; margin-right: 0.2rem;">Aceitar</button>
            <button class="btn-status" data-id="${candId}" data-status="recusado" style="background-color: #dc2626; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer;">Recusar</button>
          </div>
        </div>
      `;
    }).join("");

    vincularEventosStatusCandidato();
  } catch (error) {
    console.warn(`Erro ao listar candidatos da vaga ${vagaId}:`, error);
    container.innerHTML = `<p style="color: #64748b; font-style: italic;">Nenhum candidato inscrito até o momento.</p>`;
  }
}

function vincularEventosStatusVaga() {
  document.querySelectorAll(".btn-toggle-status").forEach(btn => {
    btn.onclick = async (e) => {
      const vagaId = e.target.dataset.id;
      const novoStatus = e.target.dataset.novoStatus; // "ativa" ou "encerrada"
      
      try {
        await alterarStatusVaga(vagaId, novoStatus);
        
        const mensagem = novoStatus === "ativa" 
          ? "Vaga ativada com sucesso! Ela voltará a aparecer para os usuários." 
          : "Vaga encerrada com sucesso! Ela não aparecerá mais nas buscas.";
          
        exibirSucesso(mensagem);
        
        // Recarrega a listagem para atualizar as cores e botões
        carregarVagas();
      } catch (err) {
        exibirErro(err.message);
      }
    };
  });
}

function vincularEventosStatusCandidato() {
  document.querySelectorAll(".btn-status").forEach(btn => {
    btn.onclick = async (e) => {
      const candidaturaId = e.target.dataset.id;
      const novoStatus = e.target.dataset.status;

      try {
        await atualizarStatusCandidatura(candidaturaId, novoStatus);
        exibirSucesso(`Candidatura alterada para ${novoStatus}.`);
        carregarVagas();
      } catch (err) {
        exibirErro(err.message);
      }
    };
  });
}

function exibirErro(msg) {
  if (!mensagemErro) return;
  mensagemErro.textContent = msg;
  mensagemErro.style.display = "block";
  if (mensagemSucesso) mensagemSucesso.style.display = "none";
}

function exibirSucesso(msg) {
  if (!mensagemSucesso) return;
  mensagemSucesso.textContent = msg;
  mensagemSucesso.style.display = "block";
  if (mensagemErro) mensagemErro.style.display = "none";
}

async function inicializar() {
  const autorizado = await verificarAcesso();
  if (autorizado) {
    await carregarVagas();
  }
}

inicializar();
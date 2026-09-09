import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { listarMinhasCandidaturas } from "../api/candidaturas.api.js";

// Elementos de Sessao e Navegacao
const navUsuario = document.getElementById("nav-usuario");
const modalLogout = document.getElementById("modal-logout");
const btnCancelarLogout = document.getElementById("btn-cancelar-logout");
const btnConfirmarLogout = document.getElementById("btn-confirmar-logout");
const btnLogout = document.getElementById("btn-logout");

// Elementos de Interface
const listaCandidaturas = document.getElementById("lista-candidaturas");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

// Extrator seguro para evitar falhas com diferentes formatos de resposta da API
function extrairArray(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.data?.candidaturas)) return resposta.data.candidaturas;
  if (Array.isArray(resposta.data?.itens)) return resposta.data.itens;
  if (Array.isArray(resposta.candidaturas)) return resposta.candidaturas;
  if (Array.isArray(resposta.itens)) return resposta.itens;
  return [];
}

// ==========================================
// CONTROLE DE SESSAO E CABECALHO
// ==========================================
async function verificarAcesso() {
  try {
    const resposta = await buscarPerfilAtual();
    const usuario = resposta?.data?.usuario || resposta?.data || resposta?.usuario;
    const role = String(usuario?.role || "").trim().toLowerCase();

    if (!resposta?.success || !usuario || (role !== "candidato" && role !== "admin")) {
      window.location.href = "/";
      return false;
    }

    renderizarNavAutenticado(usuario);
    return true;
  } catch (error) {
    console.error("Erro ao validar sessao:", error);
    window.location.href = "/login.html";
    return false;
  }
}

function renderizarNavAutenticado(usuario) {
  if (!navUsuario) return;

  const nomeExibicao = usuario.nome || usuario.email || "Candidato";
  const primeiroNome = String(nomeExibicao).trim().split(" ")[0];

  navUsuario.innerHTML = `
    <a href="/vagas.html">Vagas</a>
    <a href="/minhas-candidaturas.html" class="nav-link-active">Minhas Candidaturas</a>
    <span style="margin: 0 1rem; color: var(--color-text-muted); font-size: 0.95rem;">
      Ola, <strong style="color: var(--color-primary);">${primeiroNome}</strong>
    </span>
    <button type="button" id="btn-sair" class="btn-perigo" style="padding: 8px 16px; font-size: 0.85rem;">Sair</button>
  `;

  const btnSair = document.getElementById("btn-sair");
  if (btnSair) {
    btnSair.addEventListener("click", abrirModalLogout);
  }
}

function abrirModalLogout(e) {
  if (e) e.preventDefault();
  if (modalLogout) {
    modalLogout.style.display = "flex";
  } else {
    executarLogout();
  }
}

function fecharModalLogout() {
  if (modalLogout) {
    modalLogout.style.display = "none";
  }
}

async function executarLogout() {
  try {
    await logout();
    fecharModalLogout();
    window.location.href = "/login.html";
  } catch (error) {
    fecharModalLogout();
  }
}

function configurarEventosModal() {
  if (btnCancelarLogout) {
    btnCancelarLogout.addEventListener("click", fecharModalLogout);
  }

  if (btnConfirmarLogout) {
    btnConfirmarLogout.addEventListener("click", executarLogout);
  }

  if (modalLogout) {
    modalLogout.addEventListener("click", (e) => {
      if (e.target === modalLogout) {
        fecharModalLogout();
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", abrirModalLogout);
  }
}

// ==========================================
// CARREGAMENTO DE CANDIDATURAS
// ==========================================
async function carregarCandidaturas() {
  if (!listaCandidaturas) return;

  try {
    listaCandidaturas.innerHTML = `
      <div class="card" style="padding: 2rem; text-align: center;">
        <p class="texto-mutado">Carregando suas candidaturas...</p>
      </div>
    `;

    const resposta = await listarMinhasCandidaturas();
    const candidaturas = extrairArray(resposta);

    if (candidaturas.length === 0) {
      listaCandidaturas.innerHTML = `
        <div class="card" style="padding: 2rem; text-align: center;">
          <p class="texto-mutado">Voce ainda nao se candidatou a nenhuma vaga.</p>
          <a href="/vagas.html" class="btn-principal" style="margin-top: 1rem; display: inline-block;">Explorar Vagas Disponiveis</a>
        </div>
      `;
      return;
    }

    listaCandidaturas.innerHTML = candidaturas.map((candidatura) => {
      const statusLower = String(candidatura.status || "pendente").trim().toLowerCase();
      
      let statusCor = "var(--color-text-muted)";
      if (statusLower === "aceito") {
        statusCor = "var(--color-success, #16a34a)";
      } else if (statusLower === "recusado") {
        statusCor = "var(--color-danger, #dc2626)";
      }

      const salarioValor = candidatura.salario ? Number(candidatura.salario) : null;
      const salarioTexto = salarioValor && !isNaN(salarioValor)
        ? `R$ ${salarioValor.toFixed(2)}`
        : "A combinar";

      const vagaId = candidatura.vaga_id || candidatura.id;
      const titulo = candidatura.vaga_titulo || candidatura.titulo || "Vaga sem titulo";
      const empresa = candidatura.empresa_nome || "Confidencial";
      const cidade = candidatura.cidade_nome 
        ? `${candidatura.cidade_nome}${candidatura.cidade_uf ? ` - ${candidatura.cidade_uf}` : ""}`
        : "Nao informada";

      return `
        <article class="card" style="margin-bottom: 1.5rem; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div>
              <h3 style="margin: 0 0 0.5rem 0;">${titulo}</h3>
              <p style="margin: 0.25rem 0;"><strong>Empresa:</strong> ${empresa}</p>
              <p style="margin: 0.25rem 0;"><strong>Cidade:</strong> ${cidade}</p>
              <p style="margin: 0.25rem 0;"><strong>Salario:</strong> ${salarioTexto}</p>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem;">
              <span style="text-transform: uppercase; font-weight: 700; font-size: 0.85rem; color: ${statusCor}; border: 1px solid var(--color-border); padding: 4px 10px; border-radius: 4px; display: inline-block;">
                ${statusLower}
              </span>
              <a href="/vaga-detalhes.html?id=${vagaId}" class="btn-secundario" style="font-size: 0.85rem; padding: 6px 12px;">Ver Detalhes da Vaga</a>
            </div>
          </div>
        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("Erro ao carregar candidaturas:", error);
    if (mensagemErro) {
      mensagemErro.textContent = error.message || "Erro ao carregar lista de candidaturas.";
      mensagemErro.style.display = "block";
    }
    listaCandidaturas.innerHTML = `
      <div class="card" style="padding: 1.5rem; text-align: center; color: var(--color-danger, #dc2626);">
        <p>Nao foi possivel exibir suas candidaturas no momento.</p>
      </div>
    `;
  }
}

// ==========================================
// INICIALIZACAO
// ==========================================
async function inicializar() {
  configurarEventosModal();
  const autorizado = await verificarAcesso();
  if (autorizado) {
    await carregarCandidaturas();
  }
}

inicializar();
import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { listarMinhasVagas, alterarStatusVaga, excluirVaga } from "../api/vagas.api.js";
import { listarCandidatosDaVaga, atualizarStatusCandidatura } from "../api/candidaturas.api.js";

// Elementos de Sessao e Navegacao
const navUsuario = document.getElementById("nav-usuario");
const modalLogout = document.getElementById("modal-logout");
const btnCancelarLogout = document.getElementById("btn-cancelar-logout");
const btnConfirmarLogout = document.getElementById("btn-confirmar-logout");
const btnLogout = document.getElementById("btn-logout");

// Elementos de Interface
const listaMinhasVagas = document.getElementById("lista-minhas-vagas");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

let perfilAtual = null;

// Extrator universal
function extrairArray(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.data?.vagas)) return resposta.data.vagas;
  if (Array.isArray(resposta.data?.itens)) return resposta.data.itens;
  if (Array.isArray(resposta.vagas)) return resposta.vagas;
  if (Array.isArray(resposta.itens)) return resposta.itens;
  return [];
}

// ==========================================
// CONTROLE DE SESSAO
// ==========================================
async function verificarAcesso() {
  try {
    const resposta = await buscarPerfilAtual();
    const usuario = resposta?.data?.usuario || resposta?.data;
    const role = String(usuario?.role || "").trim().toLowerCase();

    if (!resposta?.success || !usuario || (role !== "empresa" && role !== "admin")) {
      window.location.href = "/login.html";
      return false;
    }

    perfilAtual = usuario;
    renderizarNavAutenticado(usuario);
    return true;
  } catch (error) {
    window.location.href = "/login.html";
    return false;
  }
}

function renderizarNavAutenticado(usuario) {
  if (!navUsuario) return;

  const nomeExibicao = usuario.nome || usuario.nome_fantasia || usuario.razao_social || "Empresa";
  const primeiroNome = String(nomeExibicao).trim().split(" ")[0];

  navUsuario.innerHTML = `
    <a href="/vagas.html">Vagas</a>
    <a href="/minhas-vagas.html" class="nav-link-active">Minhas Vagas</a>
    <a href="/criar-vaga.html">Cadastrar Vaga</a>
    <span style="margin: 0 1rem; color: var(--color-text-muted); font-size: 0.95rem;">
      Ola, <strong style="color: var(--color-primary);">${primeiroNome}</strong>
    </span>
    <button type="button" id="btn-sair" class="btn-perigo" style="padding: 8px 16px; font-size: 0.85rem;">Sair</button>
  `;

  const btnSair = document.getElementById("btn-sair");
  if (btnSair) btnSair.addEventListener("click", abrirModalLogout);
}

function abrirModalLogout(e) {
  if (e) e.preventDefault();
  if (modalLogout) modalLogout.style.display = "flex";
  else executarLogout();
}

function fecharModalLogout() {
  if (modalLogout) modalLogout.style.display = "none";
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
  if (btnCancelarLogout) btnCancelarLogout.addEventListener("click", fecharModalLogout);
  if (btnConfirmarLogout) btnConfirmarLogout.addEventListener("click", executarLogout);
  if (modalLogout) {
    modalLogout.addEventListener("click", (e) => {
      if (e.target === modalLogout) fecharModalLogout();
    });
  }
  if (btnLogout) btnLogout.addEventListener("click", abrirModalLogout);
}

// ==========================================
// RENDERIZACAO DE VAGAS E CANDIDATOS
// ==========================================
async function carregarVagas() {
  if (!listaMinhasVagas) return;

  try {
    listaMinhasVagas.innerHTML = `<p class="texto-mutado" style="text-align: center; padding: 2rem;">Carregando vagas cadastradas...</p>`;
    const resposta = await listarMinhasVagas();
    const vagas = extrairArray(resposta);

    if (vagas.length === 0) {
      listaMinhasVagas.innerHTML = `
        <div class="card" style="padding: 2rem; text-align: center;">
          <p class="texto-mutado">Sua empresa ainda nao cadastrou nenhuma vaga.</p>
          <a href="/criar-vaga.html" class="btn-principal" style="margin-top: 1rem; display: inline-block;">Cadastrar Primeira Vaga</a>
        </div>`;
      return;
    }

    listaMinhasVagas.innerHTML = "";

    vagas.forEach((vaga) => {
      const vagaId = vaga.id || vaga.vaga_id;
      const titulo = vaga.titulo || vaga.nome || "Vaga sem titulo";
      const status = String(vaga.status || "ativa").trim();
      const salarioValor = vaga.salario ? Number(vaga.salario) : null;
      const salarioTexto = salarioValor && !isNaN(salarioValor) ? `R$ ${salarioValor.toFixed(2)}` : "A combinar";
      const ehAtiva = status.toLowerCase() === "ativa" || status.toLowerCase() === "aberta";

      const btnStatusHtml = ehAtiva
        ? `<button type="button" class="btn-toggle-status btn-perigo" data-id="${vagaId}" data-novo-status="encerrada" style="padding: 6px 12px; font-size: 0.85rem; width: 100%;">Encerrar Vaga</button>`
        : `<button type="button" class="btn-toggle-status btn-sucesso" data-id="${vagaId}" data-novo-status="ativa" style="padding: 6px 12px; font-size: 0.85rem; width: 100%;">Ativar Vaga</button>`;

      const btnEditarHtml = `<button type="button" class="btn-acao-vaga btn-secundario" data-id="${vagaId}" data-acao="editar" data-status="${status.toLowerCase()}" style="padding: 6px 12px; font-size: 0.85rem;">Editar</button>`;
      const btnExcluirHtml = `<button type="button" class="btn-acao-vaga btn-perigo" data-id="${vagaId}" data-acao="excluir" data-status="${status.toLowerCase()}" style="padding: 6px 12px; font-size: 0.85rem;">Excluir</button>`;

      const cardVaga = document.createElement("article");
      cardVaga.className = "card";
      cardVaga.style.marginBottom = "1.5rem";
      cardVaga.style.padding = "1.5rem";

      cardVaga.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
          <div>
            <h3 style="margin: 0 0 0.5rem 0;">${titulo}</h3>
            <p style="margin: 0.25rem 0;"><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: 600; color: ${ehAtiva ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)'};">${status}</span></p>
            <p style="margin: 0.25rem 0;"><strong>Salario:</strong> ${salarioTexto}</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
            ${btnStatusHtml}
            <div style="display: flex; gap: 8px;">
              ${btnEditarHtml}
              ${btnExcluirHtml}
            </div>
          </div>
        </div>
        <hr style="margin: 1rem 0; border: 0; border-top: 1px solid var(--color-border);">
        <h4 style="margin: 0 0 0.5rem 0;">Candidatos Inscritos</h4>
        <div id="candidatos-vaga-${vagaId}" style="margin-top: 0.5rem;">
          <p class="texto-mutado" style="font-size: 0.9rem;">Carregando inscritos...</p>
        </div>
      `;

      listaMinhasVagas.appendChild(cardVaga);

      if (vagaId) {
        carregarCandidatos(vagaId);
      }
    });

    vincularEventosStatusVaga();
    vincularEventosAcoesVaga();
  } catch (error) {
    listaMinhasVagas.innerHTML = `<div class="card" style="padding: 1rem; color: var(--color-danger, #dc2626); text-align: center;"><p>Erro ao carregar vagas: ${error.message}</p></div>`;
  }
}

async function carregarCandidatos(vagaId) {
  const container = document.getElementById(`candidatos-vaga-${vagaId}`);
  if (!container) return;

  try {
    const resposta = await listarCandidatosDaVaga(vagaId);
    const candidatos = extrairArray(resposta);

    if (candidatos.length === 0) {
      container.innerHTML = `<p class="texto-mutado" style="font-style: italic; font-size: 0.9rem;">Nenhum candidato inscrito ate o momento.</p>`;
      return;
    }

    container.innerHTML = candidatos.map(c => {
      const candId = c.candidatura_id || c.id || c._id;
      const nome = c.candidato_nome || c.nome || "Candidato";
      const email = c.candidato_email || c.email || "Nao informado";
      const status = String(c.status || "pendente").trim();
      const statusLower = status.toLowerCase();

      let statusColor = "var(--color-text-muted)";
      if (statusLower === "aceito") statusColor = "var(--color-success, #16a34a)";
      if (statusLower === "recusado") statusColor = "var(--color-danger, #dc2626)";

      return `
        <div style="padding: 0.75rem 0; border-bottom: 1px dashed var(--color-border); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div>
            <p style="margin: 0.15rem 0;"><strong>Nome:</strong> ${nome}</p>
            <p style="margin: 0.15rem 0;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 0.15rem 0;"><span style="text-transform: capitalize; font-weight: 600; color: ${statusColor};">${status}</span></p>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-status btn-sucesso" data-vaga-id="${vagaId}" data-id="${candId}" data-status="aceito" style="padding: 4px 10px; font-size: 0.8rem;">Aceitar</button>
            <button type="button" class="btn-status btn-perigo" data-vaga-id="${vagaId}" data-id="${candId}" data-status="recusado" style="padding: 4px 10px; font-size: 0.8rem;">Recusar</button>
          </div>
        </div>
      `;
    }).join("");

    if (!candidatos[0].candidatura_id && !candidatos[0].id) {
       container.innerHTML += `<p class="texto-perigo" style="font-size:0.8rem;">Erro de integridade do Banco de Dados: ID da candidatura nao recebido.</p>`;
    } else {
       vincularEventosStatusCandidato(container, vagaId);
    }
  } catch (error) {
    container.innerHTML = `<p class="texto-mutado" style="font-style: italic; font-size: 0.9rem;">Erro ao carregar lista de inscritos.</p>`;
  }
}

// ==========================================
// ACOES E DISPAROS DE EVENTOS
// ==========================================
function vincularEventosStatusVaga() {
  document.querySelectorAll(".btn-toggle-status").forEach(btn => {
    btn.onclick = async (e) => {
      const vagaId = e.currentTarget.dataset.id;
      const novoStatus = e.currentTarget.dataset.novoStatus;

      try {
        await alterarStatusVaga(vagaId, novoStatus);
        const msg = novoStatus === "ativa"
          ? "Vaga ativada com sucesso! Ela voltara a aparecer nas pesquisas publicas."
          : "Vaga encerrada com sucesso! As buscas publicas nao exibirao mais este anuncio.";

        exibirSucesso(msg);
        carregarVagas();
      } catch (err) {
        exibirErro(err.message);
      }
    };
  });
}

function vincularEventosAcoesVaga() {
  document.querySelectorAll(".btn-acao-vaga").forEach(btn => {
    btn.onclick = async (e) => {
      const vagaId = e.currentTarget.dataset.id;
      const acao = e.currentTarget.dataset.acao;
      const statusVaga = e.currentTarget.dataset.status;

      // Trava de Seguranca: So permite editar/excluir se a vaga estiver encerrada
      if (statusVaga === "ativa" || statusVaga === "aberta") {
        exibirErro(`Para ${acao} esta vaga, voce precisa encerra-la primeiro clicando no botao vermelho.`);
        return;
      }

      if (acao === "editar") {
        const confirmar = confirm("Deseja realmente editar as informacoes desta vaga?");
        if (confirmar) {
          window.location.href = `/editar-vaga.html?id=${vagaId}`;
        }
      } else if (acao === "excluir") {
        const confirmar = confirm("Tem certeza que deseja EXCLUIR esta vaga permanentemente? Todos os candidatos vinculados a ela tambem serao removidos. Esta acao nao pode ser desfeita.");
        if (confirmar) {
          try {
            await excluirVaga(vagaId);
            exibirSucesso("Vaga excluida com sucesso!");
            carregarVagas();
          } catch (err) {
            exibirErro(err.message || "Erro ao tentar excluir a vaga.");
          }
        }
      }
    };
  });
}

function vincularEventosStatusCandidato(containerContext, vagaContextId) {
  const botoes = containerContext ? containerContext.querySelectorAll(".btn-status") : document.querySelectorAll(".btn-status");
  
  botoes.forEach(btn => {
    btn.onclick = async (e) => {
      const candidaturaId = e.currentTarget.dataset.id;
      const novoStatus = e.currentTarget.dataset.status;
      const vagaId = e.currentTarget.dataset.vagaId || vagaContextId;

      if (!candidaturaId || candidaturaId === 'undefined') {
        exibirErro("Erro fatal: Identificador da candidatura (ID) nao localizado pelo Front-End.");
        return;
      }

      try {
        await atualizarStatusCandidatura(candidaturaId, novoStatus);
        exibirSucesso(`Candidatura atualizada para o status: ${novoStatus}.`);
        
        if (vagaId) {
           carregarCandidatos(vagaId);
        } else {
           carregarVagas();
        }
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
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function exibirSucesso(msg) {
  if (!mensagemSucesso) return;
  mensagemSucesso.textContent = msg;
  mensagemSucesso.style.display = "block";
  if (mensagemErro) mensagemErro.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function inicializar() {
  configurarEventosModal();
  const autorizado = await verificarAcesso();
  if (autorizado) {
    await carregarVagas();
  }
}

inicializar();
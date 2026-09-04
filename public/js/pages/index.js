import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { listarVagas } from "../api/vagas.api.js";

const navUsuario = document.getElementById("nav-usuario");
const listaVagas = document.getElementById("lista-vagas");
const modalLogout = document.getElementById("modal-logout");
const btnCancelarLogout = document.getElementById("btn-cancelar-logout");
const btnConfirmarLogout = document.getElementById("btn-confirmar-logout");

async function verificarEstadoLogin() {
  try {
    const resposta = await buscarPerfilAtual();

    // Extrai o usuario com fallback flexivel para a estrutura do data
    const usuario = resposta?.data?.usuario || resposta?.data;

    if (resposta && resposta.success && usuario && (usuario.id || usuario.role)) {
      renderizarNavAutenticado(usuario);
    } else {
      renderizarNavVisitante();
    }
  } catch (error) {
    renderizarNavVisitante();
  }
}

function renderizarNavAutenticado(usuario) {
  if (!navUsuario) return;

  let linksExclusivos = "";

  if (usuario.role === "candidato") {
    linksExclusivos = `<a href="/minhas-candidaturas.html">Minhas Candidaturas</a>`;
  } else if (usuario.role === "empresa") {
    linksExclusivos = `
      <a href="../minhas-vagas.html">Minhas Vagas</a>
      <a href="../criar-vaga.html">Cadastrar Vaga</a>
    `;
  } else if (usuario.role === "admin") {
    linksExclusivos = `<a href="/admin.html">Painel Admin</a>`;
  }

  // ATUALIZAÇÃO VISUAL: Aplicadas as variáveis de cor e o botão padronizado (.btn-perigo)
  navUsuario.innerHTML = `
    <a href="/vagas.html">Vagas</a>
    ${linksExclusivos}
    <span style="margin: 0 1rem; color: var(--color-text-muted); font-size: 0.95rem;">
      Olá, <strong style="color: var(--color-primary);">${usuario.nome || "Usuário"}</strong>
    </span>
    <button type="button" id="btn-sair" class="btn-perigo" style="padding: 8px 16px; font-size: 0.85rem;">Sair</button>
  `;

  const btnSair = document.getElementById("btn-sair");
  if (btnSair) {
    btnSair.addEventListener("click", abrirModalLogout);
  }
}

function renderizarNavVisitante() {
  if (!navUsuario) return;
  // ATUALIZAÇÃO VISUAL: Aplicada a classe .btn-principal no cadastro
  navUsuario.innerHTML = `
    <a href="/">Vagas</a>
    <a href="/login.html">Login</a>
    <a href="/cadastro.html" class="btn-principal">Cadastrar-se</a>
  `;
}

function abrirModalLogout(e) {
  e.preventDefault();
  if (modalLogout) {
    modalLogout.style.display = "flex";
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
}

async function carregarVagas() {
  if (!listaVagas) return;

  try {
    const resposta = await listarVagas();
    const vagas = Array.isArray(resposta?.data) ? resposta.data : [];
    const ultimasVagas = vagas.slice(-6).reverse();

    if (!resposta?.success || ultimasVagas.length === 0) {
      listaVagas.innerHTML = `<div class="card" style="grid-column: 1 / -1; text-align: center;"><p style="color: var(--color-text-muted);">Nenhuma vaga disponível no momento.</p></div>`;
      return;
    }

    // ATUALIZAÇÃO VISUAL: Layout atualizado para o padrão .vaga-card (removido o margin-bottom inline que quebrava o carrossel)
    listaVagas.innerHTML = ultimasVagas.map(vaga => `
      <article class="card vaga-card">
        <h3 class="vaga-card__titulo">${vaga.titulo}</h3>
        
        <div class="vaga-card__info">
          <span style="font-size: 1.1rem;"></span> 
          <span>${vaga.empresa_nome || "Confidencial"}</span>
        </div>
        
        <div class="vaga-card__info">
          <span style="font-size: 1.1rem;"></span> 
          <span>${vaga.cidade_nome || "Não informada"}</span>
        </div>
        
        <div class="vaga-card__info">
          <span style="font-size: 1.1rem;"></span> 
          <span style="font-weight: 600; color: var(--color-text);">${vaga.salario ? `R$ ${Number(vaga.salario).toFixed(2)}` : "A combinar"}</span>
        </div>
        
        <div class="vaga-card__rodape">
          <a href="/vaga-detalhes.html?id=${vaga.id}" class="btn-principal" style="width: 100%;">Ver detalhes da vaga</a>
        </div>
      </article>
    `).join("");

  } catch (error) {
    listaVagas.innerHTML = `<div class="card" style="grid-column: 1 / -1; text-align: center;"><p style="color: var(--color-danger);">Erro ao carregar a lista de vagas.</p></div>`;
  }
}

async function inicializar() {
  configurarEventosModal();
  await verificarEstadoLogin();
  await carregarVagas();
}

inicializar();
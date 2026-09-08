import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { listarVagas, listarCategorias, listarCidades } from "../api/vagas.api.js";

// Elementos de Sessao
const navUsuario = document.getElementById("nav-usuario");
const modalLogout = document.getElementById("modal-logout");
const btnCancelarLogout = document.getElementById("btn-cancelar-logout");
const btnConfirmarLogout = document.getElementById("btn-confirmar-logout");

// Elementos de Filtro
const inputBusca = document.getElementById("filtro-busca");
const inputEmpresa = document.getElementById("filtro-empresa");
const inputSalario = document.getElementById("filtro-salario");
const selectCategoria = document.getElementById("filtro-categoria");
const selectCidade = document.getElementById("filtro-cidade");
const selectTipo = document.getElementById("filtro-tipo");
const btnLimpar = document.getElementById("btn-limpar-filtros");

// Elementos de Listagem
const listaVagas = document.getElementById("lista-vagas");
const containerPaginacao = document.getElementById("container-paginacao");

// Estado da Tela
let estado = {
  page: 1,
  limit: 20,
  busca: "",
  empresa: "",
  salario: "",
  categoria_id: "",
  cidade_id: "",
  tipo_trabalho: "",
  totalPaginas: 1
};
let timeoutFiltro = null;

// ==========================================
// AUTENTICACAO E NAVEGACAO (PADRAO INDEX.JS)
// ==========================================
async function verificarEstadoLogin() {
  try {
    const resposta = await buscarPerfilAtual();
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

  navUsuario.innerHTML = `
   
    ${linksExclusivos}
    <span style="margin: 0 1rem; color: var(--color-text-muted); font-size: 0.95rem;">
      Ola, <strong style="color: var(--color-primary);">${usuario.nome || "Usuario"}</strong>
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
  navUsuario.innerHTML = `
    <a href="/">Vagas</a>
    <a href="/login.html">Login</a>
    <a href="/cadastro.html" class="btn-principal">Cadastrar-se</a>
  `;
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
}

// ==========================================
// CARREGAMENTO DE CATEGORIAS E CIDADES
// ==========================================
function extrairLista(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.data?.itens)) return resposta.data.itens;
  if (Array.isArray(resposta.data?.categorias)) return resposta.data.categorias;
  if (Array.isArray(resposta.data?.cidades)) return resposta.data.cidades;
  return [];
}

async function carregarCategorias() {
  try {
    const res = await listarCategorias();
    const categorias = extrairLista(res);

    if (!selectCategoria) return;

    selectCategoria.innerHTML = '<option value="">Todas as categorias</option>';
    categorias.forEach(c => {
      selectCategoria.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nome}</option>`);
    });
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
  }
}

async function carregarCidades() {
  try {
    const res = await listarCidades();
    const cidades = extrairLista(res);

    if (!selectCidade) return;

    selectCidade.innerHTML = '<option value="">Todas as cidades</option>';
    cidades.forEach(c => {
      selectCidade.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nome} - ${c.uf}</option>`);
    });
  } catch (error) {
    console.error("Erro ao carregar cidades:", error);
  }
}

// ==========================================
// CARREGAMENTO DE VAGAS
// ==========================================
async function carregarVagas() {
  if (!listaVagas) return;

  try {
    listaVagas.innerHTML = `<p class="texto-mutado" style="text-align: center; width: 100%;">Buscando oportunidades...</p>`;
    const res = await listarVagas(estado);

    const itens = Array.isArray(res?.data?.itens)
      ? res.data.itens
      : (Array.isArray(res?.data) ? res.data : []);

    estado.totalPaginas = res?.data?.totalPaginas || 1;

    if (!res?.success || itens.length === 0) {
      listaVagas.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px; width: 100%;">
          <p class="texto-mutado">Nenhuma vaga encontrada com estes filtros.</p>
        </div>`;
      if (containerPaginacao) containerPaginacao.innerHTML = "";
      return;
    }

    listaVagas.innerHTML = itens.map(vaga => `
      <article class="card vaga-card">
        <h3 class="vaga-card__titulo">${vaga.titulo}</h3>
        
        <div class="vaga-card__info">
          <span>${vaga.empresa_nome || "Confidencial"}</span>
        </div>
        
        <div class="vaga-card__info">
          <span>${vaga.cidade_nome ? `${vaga.cidade_nome} - ${vaga.cidade_uf || ""}` : "Nao informada"}</span>
        </div>
        
        <div class="vaga-card__info">
          <span style="font-weight: 600; color: var(--color-text);">${vaga.salario ? `R$ ${Number(vaga.salario).toFixed(2)}` : "A combinar"}</span>
        </div>
        
        <div class="vaga-card__rodape">
          <a href="/vaga-detalhes.html?id=${vaga.id}" class="btn-principal" style="width: 100%; text-align: center;">Ver detalhes da vaga</a>
        </div>
      </article>
    `).join("");

    renderizarPaginacao();
  } catch (error) {
    listaVagas.innerHTML = `<p class="texto-perigo" style="text-align: center; width: 100%;">Erro ao carregar a lista de vagas.</p>`;
  }
}

// ==========================================
// FILTROS E PAGINACAO
// ==========================================
function vincularEventosFiltros() {
  const delayFiltro = () => {
    clearTimeout(timeoutFiltro);
    timeoutFiltro = setTimeout(() => {
      estado.page = 1;
      estado.busca = inputBusca ? inputBusca.value.trim() : "";
      estado.empresa = inputEmpresa ? inputEmpresa.value.trim() : "";
      estado.salario = inputSalario ? inputSalario.value.trim() : "";
      carregarVagas();
    }, 500);
  };

  if (inputBusca) inputBusca.addEventListener("input", delayFiltro);
  if (inputEmpresa) inputEmpresa.addEventListener("input", delayFiltro);
  if (inputSalario) inputSalario.addEventListener("input", delayFiltro);

  const aplicarFiltroSelect = () => {
    estado.page = 1;
    estado.categoria_id = selectCategoria ? selectCategoria.value : "";
    estado.cidade_id = selectCidade ? selectCidade.value : "";
    estado.tipo_trabalho = selectTipo ? selectTipo.value : "";
    carregarVagas();
  };

  if (selectCategoria) selectCategoria.addEventListener("change", aplicarFiltroSelect);
  if (selectCidade) selectCidade.addEventListener("change", aplicarFiltroSelect);
  if (selectTipo) selectTipo.addEventListener("change", aplicarFiltroSelect);

  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      if (inputBusca) inputBusca.value = "";
      if (inputEmpresa) inputEmpresa.value = "";
      if (inputSalario) inputSalario.value = "";
      if (selectCategoria) selectCategoria.value = "";
      if (selectCidade) selectCidade.value = "";
      if (selectTipo) selectTipo.value = "";
      estado = {
        page: 1,
        limit: 20,
        busca: "",
        empresa: "",
        salario: "",
        categoria_id: "",
        cidade_id: "",
        tipo_trabalho: "",
        totalPaginas: 1
      };
      carregarVagas();
    });
  }
}

function renderizarPaginacao() {
  if (!containerPaginacao) return;

  if (estado.totalPaginas <= 1) {
    containerPaginacao.innerHTML = "";
    return;
  }

  let html = `<div class="paginacao">`;
  html += `<button type="button" class="btn-page btn-secundario" data-page="${estado.page - 1}" ${estado.page === 1 ? "disabled" : ""}>&laquo;</button>`;

  let startPage = Math.max(1, estado.page - 2);
  let endPage = Math.min(estado.totalPaginas, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    const isAtivo = i === estado.page ? "btn-principal" : "btn-secundario";
    html += `<button type="button" class="btn-page ${isAtivo}" data-page="${i}">${i}</button>`;
  }

  html += `<button type="button" class="btn-page btn-secundario" data-page="${estado.page + 1}" ${estado.page === estado.totalPaginas ? "disabled" : ""}>&raquo;</button>`;
  html += `</div>`;

  containerPaginacao.innerHTML = html;

  document.querySelectorAll("#container-paginacao .btn-page").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const novaPagina = parseInt(e.currentTarget.dataset.page);
      if (!novaPagina || novaPagina < 1 || novaPagina > estado.totalPaginas || novaPagina === estado.page) return;
      estado.page = novaPagina;
      carregarVagas();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

// ==========================================
// INICIALIZACAO
// ==========================================
async function inicializar() {
  configurarEventosModal();
  await verificarEstadoLogin();
  await Promise.all([carregarCategorias(), carregarCidades()]);
  await carregarVagas();
  vincularEventosFiltros();
}

inicializar();
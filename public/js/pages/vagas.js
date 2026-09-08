import { buscarVagas, listarCategorias, listarCidades } from "../api/vagas.api.js";
import { buscarPerfilAtual, logout } from "../api/auth.api.js";

// Elementos de Filtro
const inputBusca = document.getElementById("filtro-busca");
const inputEmpresa = document.getElementById("filtro-empresa");
const inputSalario = document.getElementById("filtro-salario");
const selectCategoria = document.getElementById("filtro-categoria");
const selectCidade = document.getElementById("filtro-cidade");
const selectTipo = document.getElementById("filtro-tipo");
const btnLimpar = document.getElementById("btn-limpar-filtros");

// Elementos de Layout
const listaVagas = document.getElementById("lista-vagas");
const containerPaginacao = document.getElementById("container-paginacao");
const navUsuario = document.getElementById("nav-usuario");

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
let perfilUsuario = null;

// Extrator seguro para evitar erros de iteracao
function extrairArray(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.data?.itens)) return resposta.data.itens;
  if (Array.isArray(resposta.data?.categorias)) return resposta.data.categorias;
  if (Array.isArray(resposta.data?.cidades)) return resposta.data.cidades;
  if (Array.isArray(resposta.itens)) return resposta.itens;
  return [];
}

// ==========================================
// INICIALIZACAO
// ==========================================
async function inicializar() {
  await carregarSessao();
  await Promise.all([carregarCategorias(), carregarCidades()]);
  await carregarVagas();
  vincularEventosFiltros();
}

async function carregarSessao() {
  try {
    const res = await buscarPerfilAtual();
    if (res.success && res.data) {
      perfilUsuario = res.data.usuario || res.data;
      navUsuario.innerHTML = `
        <span class="texto-mutado" style="margin-right: 12px;">Ola, ${perfilUsuario.nome.split(" ")[0]}</span>
        <a href="${perfilUsuario.role === 'admin' ? '/admin.html' : '/painel.html'}" class="btn-secundario">Painel</a>
        <a href="#" id="btn-logout-vagas" class="btn-perigo">Sair</a>
      `;
      document.getElementById("btn-logout-vagas").addEventListener("click", async (e) => {
        e.preventDefault();
        await logout();
        window.location.reload();
      });
    }
  } catch (error) {
    // Usuario deslogado, mantem botoes padrao
  }
}

// ==========================================
// CARREGAMENTO DE DADOS (SELECTS E VAGAS)
// ==========================================
async function carregarCategorias() {
  try {
    const res = await listarCategorias();
    const categorias = extrairArray(res);

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
    const cidades = extrairArray(res);

    if (!selectCidade) return;

    selectCidade.innerHTML = '<option value="">Todas as cidades</option>';
    cidades.forEach(c => {
      selectCidade.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nome} - ${c.uf}</option>`);
    });
  } catch (error) {
    console.error("Erro ao carregar cidades:", error);
  }
}

async function carregarVagas() {
  try {
    listaVagas.innerHTML = `<p class="texto-mutado" style="text-align: center;">Buscando oportunidades...</p>`;
    const res = await buscarVagas(estado);
    const itens = extrairArray(res);

    if (!res?.success || itens.length === 0) {
      listaVagas.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px; width: 100%;">
          <p class="texto-mutado">Nenhuma vaga encontrada com estes filtros.</p>
        </div>`;
      containerPaginacao.innerHTML = "";
      return;
    }

    estado.totalPaginas = res.data?.totalPaginas || 1;

    listaVagas.innerHTML = itens.map(vaga => `
      <div class="card vaga-card">
        <div class="vaga-card-header">
          <h3 class="vaga-titulo">${vaga.titulo}</h3>
          <span class="vaga-empresa">${vaga.empresa_nome}</span>
        </div>
        <div class="vaga-card-body">
          <p class="vaga-info">${vaga.cidade_nome} - ${vaga.cidade_uf} | ${vaga.tipo_trabalho}</p>
          <p class="vaga-info">${vaga.salario ? 'R$ ' + vaga.salario : 'A combinar'}</p>
        </div>
        <div class="vaga-card-footer">
          <a href="/vaga-detalhes.html?id=${vaga.id}" class="btn-principal" style="width: 100%; text-align: center;">Ver Detalhes</a>
        </div>
      </div>
    `).join("");

    renderizarPaginacao();
  } catch (error) {
    listaVagas.innerHTML = `<p class="texto-perigo" style="text-align: center;">Ocorreu um erro ao buscar as vagas.</p>`;
  }
}

// ==========================================
// EVENTOS E FILTRAGEM
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
  if (estado.totalPaginas <= 1) {
    containerPaginacao.innerHTML = "";
    return;
  }

  let html = `<div class="paginacao">`;
  html += `<button class="btn-page btn-secundario" data-page="${estado.page - 1}" ${estado.page === 1 ? "disabled" : ""}>&laquo;</button>`;

  let startPage = Math.max(1, estado.page - 2);
  let endPage = Math.min(estado.totalPaginas, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    const isAtivo = i === estado.page ? "btn-principal" : "btn-secundario";
    html += `<button class="btn-page ${isAtivo}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="btn-page btn-secundario" data-page="${estado.page + 1}" ${estado.page === estado.totalPaginas ? "disabled" : ""}>&raquo;</button>`;
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

inicializar();
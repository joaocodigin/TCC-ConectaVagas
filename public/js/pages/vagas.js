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

// ==========================================
// INICIALIZAÇÃO
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
        <span class="texto-mutado" style="margin-right:12px;">Olá, ${perfilUsuario.nome.split(" ")[0]}</span>
        <a href="${perfilUsuario.role === 'admin' ? '/admin.html' : '/painel.html'}" class="btn-secundario">Painel</a>
        <a href="#" id="btn-logout-vagas" class="btn-perigo">Sair</a>
      `;
      document.getElementById("btn-logout-vagas").addEventListener("click", async (e) => {
        e.preventDefault();
        await logout();
        window.location.reload();
      });
    }
  } catch (error) { /* Permanece deslogado */ }
}

// ==========================================
// CARREGAMENTO DE DADOS (FILTROS E VAGAS)
// ==========================================
async function carregarCategorias() {
  try {
    const res = await listarCategorias();
    // A API nova retorna os itens dentro de data.itens (devido à paginação)
    const categorias = res.data?.itens || res.data || [];
    categorias.forEach(c => {
      selectCategoria.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.nome}</option>`);
    });
  } catch (error) { console.error("Erro categorias:", error); }
}

async function carregarCidades() {
  try {
    const res = await listarCidades();
    const cidades = res.data?.itens || res.data || [];
    cidades.forEach(c => {
      selectCidade.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.nome} - ${c.uf}</option>`);
    });
  } catch (error) { console.error("Erro cidades:", error); }
}

async function carregarVagas() {
  try {
    listaVagas.innerHTML = `<p class="texto-mutado">Buscando oportunidades...</p>`;
    const res = await buscarVagas(estado);
    
    if (!res.success || !res.data || !res.data.itens || res.data.itens.length === 0) {
      listaVagas.innerHTML = `
        <div class="card" style="text-align:center; padding: 40px;">
          <p class="texto-mutado">Nenhuma vaga encontrada com estes filtros.</p>
        </div>`;
      containerPaginacao.innerHTML = "";
      return;
    }

    estado.totalPaginas = res.data.totalPaginas;
    
    listaVagas.innerHTML = res.data.itens.map(vaga => `
      <div class="card vaga-card">
        <div class="vaga-card-header">
          <h3 class="vaga-titulo">${vaga.titulo}</h3>
          <span class="vaga-empresa">${vaga.empresa_nome}</span>
        </div>
        <div class="vaga-card-body">
          <p class="vaga-info">📍 ${vaga.cidade_nome} - ${vaga.cidade_uf} | 🏢 ${vaga.tipo_trabalho}</p>
          <p class="vaga-info">💰 ${vaga.salario ? 'R$ ' + vaga.salario : 'A combinar'}</p>
        </div>
        <div class="vaga-card-footer">
          <a href="/vaga-detalhes.html?id=${vaga.id}" class="btn-principal" style="width: 100%; text-align: center;">Ver Detalhes</a>
        </div>
      </div>
    `).join("");

    renderizarPaginacao();
  } catch (error) {
    listaVagas.innerHTML = `<p class="texto-perigo">Ocorreu um erro ao buscar as vagas.</p>`;
  }
}

// ==========================================
// EVENTOS E PAGINAÇÃO
// ==========================================
function vincularEventosFiltros() {
  // Atraso de 500ms na digitação para não travar o banco
  const delayFiltro = () => {
    clearTimeout(timeoutFiltro);
    timeoutFiltro = setTimeout(() => {
      estado.page = 1; // Ao filtrar, volta para a aba 1
      estado.busca = inputBusca.value.trim();
      estado.empresa = inputEmpresa.value.trim();
      estado.salario = inputSalario.value.trim();
      carregarVagas();
    }, 500);
  };

  inputBusca.addEventListener("input", delayFiltro);
  inputEmpresa.addEventListener("input", delayFiltro);
  inputSalario.addEventListener("input", delayFiltro);

  // Selects disparam instantaneamente no "change"
  const aplicarFiltroSelect = () => {
    estado.page = 1;
    estado.categoria_id = selectCategoria.value;
    estado.cidade_id = selectCidade.value;
    estado.tipo_trabalho = selectTipo.value;
    carregarVagas();
  };

  selectCategoria.addEventListener("change", aplicarFiltroSelect);
  selectCidade.addEventListener("change", aplicarFiltroSelect);
  selectTipo.addEventListener("change", aplicarFiltroSelect);

  // Limpar Filtros
  btnLimpar.addEventListener("click", () => {
    inputBusca.value = ""; inputEmpresa.value = ""; inputSalario.value = "";
    selectCategoria.value = ""; selectCidade.value = ""; selectTipo.value = "";
    estado = { page: 1, limit: 20, busca: "", empresa: "", salario: "", categoria_id: "", cidade_id: "", tipo_trabalho: "", totalPaginas: 1 };
    carregarVagas();
  });
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

  // Eventos de clique nas abas numéricas
  document.querySelectorAll("#container-paginacao .btn-page").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const novaPagina = parseInt(e.currentTarget.dataset.page);
      if (!novaPagina || novaPagina < 1 || novaPagina > estado.totalPaginas || novaPagina === estado.page) return;
      estado.page = novaPagina;
      carregarVagas();
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola pro topo suavemente ao trocar de página
    });
  });
}

inicializar();
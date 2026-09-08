import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { criarVaga, listarCategorias, listarCidades } from "../api/vagas.api.js";

// Elementos de Sessao e Navegacao
const navUsuario = document.getElementById("nav-usuario");
const modalLogout = document.getElementById("modal-logout");
const btnCancelarLogout = document.getElementById("btn-cancelar-logout");
const btnConfirmarLogout = document.getElementById("btn-confirmar-logout");

// Elementos do Formulario
const formCriarVaga = document.getElementById("form-criar-vaga");
const selectCategoria = document.getElementById("categoria-id");
const selectCidade = document.getElementById("cidade-id");
const selectTipoTrabalho = document.getElementById("tipo-trabalho");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

// Extrator universal de dados para compatibilidade com respostas paginadas ou diretas
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
// CONTROLE DE SESSAO E CABECALHO
// ==========================================
async function verificarAcesso() {
  try {
    const resposta = await buscarPerfilAtual();
    const usuario = resposta?.data?.usuario || resposta?.data;
    const role = (usuario?.role || "").toLowerCase();

    if (!resposta?.success || !usuario || (role !== "empresa" && role !== "admin")) {
      window.location.href = "/login.html";
      return false;
    }

    renderizarNavAutenticado(usuario);
    return true;
  } catch (error) {
    console.error("Erro ao validar acesso da empresa:", error);
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
    <a href="/minhas-vagas.html">Minhas Vagas</a>
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
}

// ==========================================
// CARREGAMENTO DOS SELECTS
// ==========================================
async function popularSelects() {
  try {
    const [categoriasRes, cidadesRes] = await Promise.all([
      listarCategorias().catch(() => null),
      listarCidades().catch(() => null)
    ]);

    const categorias = extrairArray(categoriasRes);
    const cidades = extrairArray(cidadesRes);

    if (selectCategoria) {
      selectCategoria.innerHTML = `<option value="">Selecione uma categoria</option>`;
      categorias.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.nome;
        selectCategoria.appendChild(option);
      });
    }

    if (selectCidade) {
      selectCidade.innerHTML = `<option value="">Selecione uma cidade</option>`;
      cidades.forEach((cid) => {
        const option = document.createElement("option");
        option.value = cid.id;
        const estadoUf = cid.uf || cid.estado || cid.sigla || "";
        option.textContent = estadoUf ? `${cid.nome} - ${estadoUf}` : cid.nome;
        selectCidade.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Erro ao popular campos de selecao:", error);
  }
}

// ==========================================
// SUBMISSAO DO FORMULARIO
// ==========================================
function configurarFormulario() {
  if (!formCriarVaga) return;

  formCriarVaga.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (mensagemErro) mensagemErro.style.display = "none";
    if (mensagemSucesso) mensagemSucesso.style.display = "none";

    const titulo = document.getElementById("titulo")?.value.trim();
    const categoriaId = selectCategoria?.value;
    const cidadeId = selectCidade?.value;
    const tipoTrabalho = selectTipoTrabalho?.value || "presencial";
    const salario = document.getElementById("salario")?.value;
    const requisitos = document.getElementById("requisitos")?.value.trim();
    const descricao = document.getElementById("descricao")?.value.trim();

    if (!titulo || !categoriaId || !cidadeId || !descricao) {
      exibirErro("Por favor, preencha todos os campos obrigatorios.");
      return;
    }

    const payload = {
      titulo,
      categoria_id: Number(categoriaId),
      cidade_id: Number(cidadeId),
      tipo_trabalho: tipoTrabalho,
      requisitos: requisitos || null,
      descricao
    };

    if (salario) {
      payload.salario = Number(salario);
    }

    try {
      const resposta = await criarVaga(payload);
      if (resposta?.success) {
        exibirSucesso("Vaga cadastrada com sucesso! Redirecionando...");
        formCriarVaga.reset();

        setTimeout(() => {
          window.location.href = "/minhas-vagas.html";
        }, 1500);
      } else {
        throw new Error(resposta?.message || "Erro ao cadastrar vaga.");
      }
    } catch (error) {
      exibirErro(error.message);
    }
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

// ==========================================
// INICIALIZACAO
// ==========================================
async function inicializar() {
  configurarEventosModal();
  const autorizado = await verificarAcesso();
  if (autorizado) {
    await popularSelects();
    configurarFormulario();
  }
}

inicializar();
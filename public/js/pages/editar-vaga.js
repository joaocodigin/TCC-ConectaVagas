import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { buscarVagaPorId, atualizarVaga, listarCategorias, listarCidades } from "../api/vagas.api.js";

// Elementos de Sessao
const navUsuario = document.getElementById("nav-usuario");
const modalLogout = document.getElementById("modal-logout");
const btnCancelarLogout = document.getElementById("btn-cancelar-logout");
const btnConfirmarLogout = document.getElementById("btn-confirmar-logout");
const btnLogout = document.getElementById("btn-logout");

// Elementos do Form
const formEditarVaga = document.getElementById("form-editar-vaga");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

const selectCategoria = document.getElementById("categoria_id");
const selectCidade = document.getElementById("cidade_id");

// Pega o ID da vaga que esta na URL (ex: editar-vaga.html?id=5)
const urlParams = new URLSearchParams(window.location.search);
const vagaId = urlParams.get("id");

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
    renderizarNavAutenticado(usuario);
    return true;
  } catch (error) {
    window.location.href = "/login.html";
    return false;
  }
}

function renderizarNavAutenticado(usuario) {
  if (!navUsuario) return;
  const nomeExibicao = usuario.nome || usuario.nome_fantasia || "Empresa";
  const primeiroNome = String(nomeExibicao).trim().split(" ")[0];

  navUsuario.innerHTML = `
    <a href="/vagas.html">Vagas</a>
    <a href="/minhas-vagas.html">Minhas Vagas</a>
    <a href="/criar-vaga.html">Cadastrar Vaga</a>
    <span style="margin: 0 1rem; color: var(--color-text-muted); font-size: 0.95rem;">
      Ola, <strong style="color: var(--color-primary);">${primeiroNome}</strong>
    </span>
    <button type="button" id="btn-sair" class="btn-perigo" style="padding: 8px 16px; font-size: 0.85rem;">Sair</button>
  `;

  document.getElementById("btn-sair")?.addEventListener("click", () => modalLogout.style.display = "flex");
}

// ==========================================
// CARREGAR DADOS NO FORMULARIO
// ==========================================
async function carregarFiltros() {
  try {
    const [resCategorias, resCidades] = await Promise.all([
      listarCategorias("", 1, 100), // Traz tudo para preencher o select
      listarCidades("", 1, 500)
    ]);

    const categorias = resCategorias?.data?.itens || resCategorias?.data || resCategorias || [];
    const cidades = resCidades?.data?.itens || resCidades?.data || resCidades || [];

    if (selectCategoria) {
      selectCategoria.innerHTML = `<option value="">Selecione a categoria...</option>` + 
        categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join("");
    }

    if (selectCidade) {
      selectCidade.innerHTML = `<option value="">Selecione a cidade...</option>` + 
        cidades.map(c => `<option value="${c.id}">${c.nome} - ${c.uf}</option>`).join("");
    }
  } catch (error) {
    exibirErro("Falha ao carregar lista de cidades e categorias.");
  }
}

async function carregarDadosDaVaga() {
  if (!vagaId) {
    exibirErro("ID da vaga não informado.");
    setTimeout(() => window.location.href = "/minhas-vagas.html", 2000);
    return;
  }

  try {
    const resposta = await buscarVagaPorId(vagaId);
    const vaga = resposta?.data || resposta;

    if (!vaga) throw new Error("Vaga não encontrada.");

    // Trava de segurança no Front-End:
    if (String(vaga.status).toLowerCase() !== "encerrada") {
      exibirErro("Você só pode editar uma vaga se ela estiver ENCERRADA. Redirecionando de volta ao painel...");
      setTimeout(() => window.location.href = "/minhas-vagas.html", 3500);
      return;
    }

    // Preenche os campos sozinhos
    document.getElementById("titulo").value = vaga.titulo || "";
    document.getElementById("descricao").value = vaga.descricao || "";
    document.getElementById("requisitos").value = vaga.requisitos || "";
    document.getElementById("salario").value = vaga.salario ? Number(vaga.salario).toFixed(2) : "";
    
    // Setando os selects (precisa ser depois de carregarFiltros())
    if (vaga.tipo_trabalho) document.getElementById("tipo_trabalho").value = vaga.tipo_trabalho;
    if (vaga.categoria_id) selectCategoria.value = vaga.categoria_id;
    if (vaga.cidade_id) selectCidade.value = vaga.cidade_id;

    // Mostra o form só quando tudo estiver carregado para evitar "piscar" a tela
    formEditarVaga.style.display = "block";

  } catch (error) {
    exibirErro(error.message || "Erro ao carregar os dados da vaga.");
    setTimeout(() => window.location.href = "/minhas-vagas.html", 3000);
  }
}

// ==========================================
// SUBMIT DO FORMULARIO (ATUALIZAR)
// ==========================================
if (formEditarVaga) {
  formEditarVaga.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = formEditarVaga.querySelector("button[type='submit']");
    const textoOriginal = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Salvando...";

    const dados = {
      titulo: document.getElementById("titulo").value,
      categoria_id: document.getElementById("categoria_id").value,
      cidade_id: document.getElementById("cidade_id").value,
      tipo_trabalho: document.getElementById("tipo_trabalho").value,
      salario: document.getElementById("salario").value || null,
      descricao: document.getElementById("descricao").value,
      requisitos: document.getElementById("requisitos").value
    };

    try {
      await atualizarVaga(vagaId, dados);
      exibirSucesso("Vaga atualizada com sucesso! Redirecionando ao painel...");
      
      setTimeout(() => {
        window.location.href = "/minhas-vagas.html";
      }, 2000);

    } catch (error) {
      exibirErro(error.message || "Ocorreu um erro ao tentar salvar a vaga.");
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });
}

function exibirErro(msg) {
  mensagemErro.textContent = msg;
  mensagemErro.style.display = "block";
  mensagemSucesso.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function exibirSucesso(msg) {
  mensagemSucesso.textContent = msg;
  mensagemSucesso.style.display = "block";
  mensagemErro.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Inicialização Sequencial (Primeiro traz os selects, depois preenche a vaga)
async function inicializar() {
  const autorizado = await verificarAcesso();
  if (autorizado) {
    await carregarFiltros();
    await carregarDadosDaVaga();
  }
}

inicializar();

// Controles do Modal de Logout
btnCancelarLogout?.addEventListener("click", () => modalLogout.style.display = "none");
btnLogout?.addEventListener("click", (e) => { e.preventDefault(); modalLogout.style.display = "flex"; });
btnConfirmarLogout?.addEventListener("click", async () => {
  await logout();
  window.location.href = "/login.html";
});
import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { listarTodosUsuarios, alternarStatusUsuario, editarUsuario, excluirUsuario, criarCategoria, atualizarCategoria, excluirCategoria, criarCidade, atualizarCidade, excluirCidade } from "../api/admin.api.js";
import { listarCategorias, listarCidades } from "../api/vagas.api.js";

const containerUsuarios = document.getElementById("container-usuarios");
const listaCategorias = document.getElementById("lista-categorias");
const listaCidades = document.getElementById("lista-cidades");
const inputBuscaUsuario = document.getElementById("input-busca-usuario");
const inputBuscaCategoria = document.getElementById("input-busca-categoria");
const inputBuscaCidade = document.getElementById("input-busca-cidade");

const formCriarCategoria = document.getElementById("form-criar-categoria");
const formCriarCidade = document.getElementById("form-criar-cidade");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");
const btnLogout = document.getElementById("btn-logout");

// ESTADO GLOBAL DAS 3 TABELAS
let estadoUsuarios = { pagina: 1, termo: "", totalPaginas: 1 };
let estadoCategorias = { pagina: 1, termo: "", totalPaginas: 1 };
let estadoCidades = { pagina: 1, termo: "", totalPaginas: 1 };
let timers = {};

if (btnLogout) {
  btnLogout.addEventListener("click", async (e) => {
    e.preventDefault();
    await logout();
    window.location.href = "/login.html";
  });
}

// EVENTOS DE BUSCA COM DEBOUNCE (Resetam para página 1)
function configurarBusca(input, estado, callback) {
  if (!input) return;
  input.addEventListener("input", (e) => {
    clearTimeout(timers[input.id]);
    timers[input.id] = setTimeout(() => {
      estado.termo = e.target.value.trim();
      estado.pagina = 1; 
      callback();
    }, 400);
  });
}

configurarBusca(inputBuscaUsuario, estadoUsuarios, carregarUsuarios);
configurarBusca(inputBuscaCategoria, estadoCategorias, carregarCategorias);
configurarBusca(inputBuscaCidade, estadoCidades, carregarCidades);

// DELEGAÇÃO DE EVENTOS PARA OS BOTÕES DE PAGINAÇÃO (ESTILO GOOGLE)
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-page")) {
    if (e.target.disabled) return;
    const tipo = e.target.dataset.tipo;
    const novaPagina = parseInt(e.target.dataset.page);
    
    if (tipo === 'usuarios' && novaPagina !== estadoUsuarios.pagina) {
      estadoUsuarios.pagina = novaPagina; carregarUsuarios();
    } else if (tipo === 'categorias' && novaPagina !== estadoCategorias.pagina) {
      estadoCategorias.pagina = novaPagina; carregarCategorias();
    } else if (tipo === 'cidades' && novaPagina !== estadoCidades.pagina) {
      estadoCidades.pagina = novaPagina; carregarCidades();
    }
  }
});

// GERADOR DE PAGINAÇÃO VISUAL (EXIBE ATÉ 5 NÚMEROS)
function construirPaginacao(paginaAtual, totalPaginas, tipo) {
  if (totalPaginas <= 1) return "";
  let html = `<div class="paginacao" style="display: flex; justify-content: center; gap: 6px; margin-top: 16px;">`;
  html += `<button class="btn-page btn-secundario" data-tipo="${tipo}" data-page="${paginaAtual - 1}" ${paginaAtual === 1 ? "disabled" : ""} style="padding: 4px 10px;">&laquo;</button>`;

  let startPage = Math.max(1, paginaAtual - 2);
  let endPage = Math.min(totalPaginas, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    const isAtivo = i === paginaAtual ? "btn-principal" : "btn-secundario";
    html += `<button class="btn-page ${isAtivo}" data-tipo="${tipo}" data-page="${i}" style="padding: 4px 10px;">${i}</button>`;
  }

  html += `<button class="btn-page btn-secundario" data-tipo="${tipo}" data-page="${paginaAtual + 1}" ${paginaAtual === totalPaginas ? "disabled" : ""} style="padding: 4px 10px;">&raquo;</button>`;
  html += `</div>`;
  return html;
}

async function verificarAcessoAdmin() {
  try {
    const perfilRes = await buscarPerfilAtual();
    const usuario = perfilRes?.data?.usuario || perfilRes?.data;
    if (!perfilRes?.success || !usuario || (usuario?.role || "").toLowerCase() !== "admin") {
      window.location.href = "/";
      return false;
    }
    return true;
  } catch (error) { window.location.href = "/login.html"; return false; }
}

// ==========================================
// RENDERIZAÇÃO DAS 3 TABELAS
// ==========================================
async function carregarUsuarios() {
  try {
    containerUsuarios.innerHTML = `<p class="texto-mutado">Carregando...</p>`;
    const resposta = await listarTodosUsuarios(estadoUsuarios.termo, estadoUsuarios.pagina);

    if (!resposta?.success || !resposta.data || !resposta.data.itens || resposta.data.itens.length === 0) {
      containerUsuarios.innerHTML = `<p class="texto-mutado">Nenhum usuário encontrado.</p>`;
      return;
    }

    estadoUsuarios.totalPaginas = resposta.data.totalPaginas;

    const htmlTabela = `
      <div class="tabela-container">
        <table class="tabela-admin">
          <thead>
            <tr>
              <th>ID</th><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${resposta.data.itens.map(u => `
              <tr>
                <td>${u.id}</td><td><strong>${u.nome}</strong></td><td>${u.email}</td><td>${u.role}</td><td>${u.ativo === 1 ? "Ativo" : "Bloqueado"}</td>
                <td>
                  ${u.role !== "admin" ? `
                    <div style="display: flex; gap: 8px;">
                      <button class="btn-toggle-status ${u.ativo === 1 ? "btn-perigo" : "btn-sucesso"}" data-id="${u.id}" data-ativo="${u.ativo}" style="padding: 4px 8px;">
                        ${u.ativo === 1 ? "Bloquear" : "Desbloquear"}
                      </button>
                      <button class="btn-editar-usuario btn-secundario" data-id="${u.id}" data-nome="${u.nome}" data-email="${u.email}" style="padding: 4px 8px;">Editar</button>
                      <button class="btn-excluir-usuario btn-perigo" data-id="${u.id}" style="padding: 4px 8px;">Excluir</button>
                    </div>
                  ` : "<em>N/A</em>"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    containerUsuarios.innerHTML = htmlTabela + construirPaginacao(estadoUsuarios.pagina, estadoUsuarios.totalPaginas, "usuarios");
    vincularEventosUsuarios();
  } catch (error) { containerUsuarios.innerHTML = `<p class="texto-perigo">Erro ao carregar usuários.</p>`; }
}

async function carregarCategorias() {
  try {
    listaCategorias.innerHTML = `<li>Carregando...</li>`;
    const resposta = await listarCategorias(estadoCategorias.termo, estadoCategorias.pagina);
    
    if (resposta.success && resposta.data && resposta.data.itens.length > 0) {
      estadoCategorias.totalPaginas = resposta.data.totalPaginas;
      let html = resposta.data.itens.map(c => `
        <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 4px; border-bottom: 1px dashed var(--color-border);">
          <span>${c.nome} ${c.ativa ? "" : "(Inativa)"}</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-editar-categoria btn-secundario" data-id="${c.id}" data-nome="${c.nome}" data-ativa="${c.ativa}" style="padding: 2px 6px; font-size: 0.75rem;">Editar</button>
            <button class="btn-excluir-categoria btn-perigo" data-id="${c.id}" style="padding: 2px 6px; font-size: 0.75rem;">Excluir</button>
          </div>
        </li>
      `).join("");
      
      listaCategorias.innerHTML = html + construirPaginacao(estadoCategorias.pagina, estadoCategorias.totalPaginas, "categorias");
      vincularEventosCategorias();
    } else {
      listaCategorias.innerHTML = `<li>Nenhuma categoria encontrada.</li>`;
    }
  } catch (error) { listaCategorias.innerHTML = `<li>Erro ao carregar categorias.</li>`; }
}

async function carregarCidades() {
  try {
    listaCidades.innerHTML = `<li>Carregando...</li>`;
    const resposta = await listarCidades(estadoCidades.termo, estadoCidades.pagina);
    
    if (resposta.success && resposta.data && resposta.data.itens.length > 0) {
      estadoCidades.totalPaginas = resposta.data.totalPaginas;
      let html = resposta.data.itens.map(c => `
        <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 4px; border-bottom: 1px dashed var(--color-border);">
          <span>${c.nome} - ${c.uf}</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-editar-cidade btn-secundario" data-id="${c.id}" data-nome="${c.nome}" data-uf="${c.uf}" style="padding: 2px 6px; font-size: 0.75rem;">Editar</button>
            <button class="btn-excluir-cidade btn-perigo" data-id="${c.id}" style="padding: 2px 6px; font-size: 0.75rem;">Excluir</button>
          </div>
        </li>
      `).join("");
      
      listaCidades.innerHTML = html + construirPaginacao(estadoCidades.pagina, estadoCidades.totalPaginas, "cidades");
      vincularEventosCidades();
    } else {
      listaCidades.innerHTML = `<li>Nenhuma cidade encontrada.</li>`;
    }
  } catch (error) { listaCidades.innerHTML = `<li>Erro ao carregar cidades.</li>`; }
}

// ==========================================
// VINCULAÇÃO DE EVENTOS DE AÇÃO
// ==========================================
function vincularEventosUsuarios() {
  document.querySelectorAll(".btn-toggle-status").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      try {
        await alternarStatusUsuario(e.currentTarget.dataset.id, Number(e.currentTarget.dataset.ativo) === 1 ? 0 : 1);
        exibirSucesso(`Status alterado com sucesso!`); carregarUsuarios();
      } catch (err) { exibirErro(err.message); }
    });
  });
  document.querySelectorAll(".btn-editar-usuario").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const nomeAtual = e.currentTarget.dataset.nome;
      const novoNome = prompt("Digite o novo nome para este usuário:", nomeAtual);
      if (novoNome && novoNome.trim() !== nomeAtual) {
        try {
          await editarUsuario(e.currentTarget.dataset.id, { nome: novoNome.trim(), email: e.currentTarget.dataset.email, role: "empresa" });
          exibirSucesso("Usuário atualizado com sucesso!"); carregarUsuarios();
        } catch (err) { exibirErro(err.message); }
      }
    });
  });
  document.querySelectorAll(".btn-excluir-usuario").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      if (confirm("ATENÇÃO: Isso excluirá o usuário, suas vagas e candidaturas para sempre. Confirmar?")) {
        try { await excluirUsuario(e.currentTarget.dataset.id); exibirSucesso("Usuário excluído."); carregarUsuarios(); }
        catch (err) { exibirErro(err.message); }
      }
    });
  });
}

function vincularEventosCategorias() {
  document.querySelectorAll(".btn-editar-categoria").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const nome = prompt("Novo nome da categoria:", e.currentTarget.dataset.nome);
      if (nome) {
        try { await atualizarCategoria(e.currentTarget.dataset.id, { nome, ativa: true }); carregarCategorias(); }
        catch (err) { exibirErro(err.message); }
      }
    });
  });
  document.querySelectorAll(".btn-excluir-categoria").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      if (confirm("Excluir esta categoria?")) {
        try { await excluirCategoria(e.currentTarget.dataset.id); exibirSucesso("Categoria excluída."); carregarCategorias(); }
        catch (err) { exibirErro(err.message); }
      }
    });
  });
}

function vincularEventosCidades() {
  document.querySelectorAll(".btn-editar-cidade").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const nome = prompt("Novo nome da cidade:", e.currentTarget.dataset.nome);
      if (nome) {
        try { await atualizarCidade(e.currentTarget.dataset.id, { nome, uf: e.currentTarget.dataset.uf }); carregarCidades(); }
        catch (err) { exibirErro(err.message); }
      }
    });
  });
  document.querySelectorAll(".btn-excluir-cidade").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      if (confirm("Excluir esta cidade?")) {
        try { await excluirCidade(e.currentTarget.dataset.id); exibirSucesso("Cidade excluída."); carregarCidades(); }
        catch (err) { exibirErro(err.message); }
      }
    });
  });
}

// SUBMITS DE CADASTRO
if (formCriarCategoria) {
  formCriarCategoria.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await criarCategoria(document.getElementById("categoria-nome").value.trim());
      exibirSucesso("Categoria cadastrada!"); document.getElementById("categoria-nome").value = ""; carregarCategorias();
    } catch (err) { exibirErro(err.message); }
  });
}

if (formCriarCidade) {
  formCriarCidade.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await criarCidade(document.getElementById("cidade-nome").value.trim(), document.getElementById("cidade-uf").value.trim().toUpperCase());
      exibirSucesso("Cidade cadastrada!"); document.getElementById("cidade-nome").value = ""; document.getElementById("cidade-uf").value = ""; carregarCidades();
    } catch (err) { exibirErro(err.message); }
  });
}

function exibirErro(msg) {
  mensagemErro.textContent = msg; mensagemErro.style.display = "block"; mensagemSucesso.style.display = "none"; window.scrollTo({ top: 0, behavior: 'smooth' });
}
function exibirSucesso(msg) {
  mensagemSucesso.textContent = msg; mensagemSucesso.style.display = "block"; mensagemErro.style.display = "none"; window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function inicializar() {
  if (await verificarAcessoAdmin()) {
    await Promise.all([carregarUsuarios(), carregarCategorias(), carregarCidades()]);
  }
}

inicializar();
import { buscarPerfilAtual, logout } from "../api/auth.api.js";
import { buscarVagaPorId } from "../api/vagas.api.js";
import { candidatarSe, listarMinhasCandidaturas } from "../api/candidaturas.api.js";

const navUsuario = document.getElementById("nav-usuario");
const conteudoVaga = document.getElementById("conteudo-vaga");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

let usuarioAtual = null;

async function inicializarHeader() {
  try {
    const perfilRes = await buscarPerfilAtual();
    if (perfilRes.success && perfilRes.data) {
      usuarioAtual = perfilRes.data;
      navUsuario.innerHTML = `
        <a href="/">Vagas</a>
        <button type="button" id="btn-sair" class="btn-perigo" style="padding: 8px 16px; font-size: 0.85rem;">Sair</button>
      `;

      document.getElementById("btn-sair").addEventListener("click", async (e) => {
        e.preventDefault();
        await logout();
        window.location.reload();
      });
    }
  } catch (error) {
    // Usuario visitando de forma anonima
  }
}

function obterVagaIdDaURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function carregarDetalhesVaga() {
  const vagaId = obterVagaIdDaURL();

  if (!vagaId) {
    conteudoVaga.innerHTML = `<p>Vaga nao especificada. Retorne a pagina principal.</p>`;
    return;
  }

  try {
    const resposta = await buscarVagaPorId(vagaId);
    if (!resposta.success || !resposta.data) {
      conteudoVaga.innerHTML = `<p>Vaga nao encontrada.</p>`;
      return;
    }

    const vaga = resposta.data;
    let jaCandidatado = false;

    if (usuarioAtual && usuarioAtual.role === "candidato") {
      try {
        const minhasCandidaturas = await listarMinhasCandidaturas();
        if (minhasCandidaturas.success && minhasCandidaturas.data) {
          jaCandidatado = minhasCandidaturas.data.some(c => Number(c.vaga_id) === Number(vagaId));
        }
      } catch (e) {
        // Ignora erro de checagem se falhar
      }
    }

    let acaoHtml = "";

    if (!usuarioAtual) {
      acaoHtml = `<p><em>Faca <a href="/login.html">login</a> como candidato para se candidatar a esta vaga.</em></p>`;
    } else if (usuarioAtual.role === "empresa") {
      acaoHtml = `<p><em>Contas do tipo Empresa nao podem se candidatar a vagas.</em></p>`;
    } else if (jaCandidatado) {
      acaoHtml = `<div class="alert alert-success">Voce ja se candidatou a esta vaga.</div>`;
    } else {
      acaoHtml = `<button id="btn-candidatar" data-id="${vaga.id}">Candidatar-se a esta vaga</button>`;
    }

    conteudoVaga.innerHTML = `
      <h2>${vaga.titulo}</h2>
      <br>
      <p><strong>Empresa:</strong> ${vaga.empresa_nome || "Confidencial"}</p>
      <p><strong>Categoria:</strong> ${vaga.categoria_nome || "Nao informada"}</p>
      <p><strong>Cidade:</strong> ${vaga.cidade_nome || "Nao informada"}</p>
      <p><strong>Salario:</strong> R$ ${vaga.salario ? Number(vaga.salario).toFixed(2) : "A combinar"}</p>
      <p><strong>Status:</strong> ${vaga.status || "Ativa"}</p>
      <br>
      <h3>Requisitos:</h3>
      <p>${vaga.requisitos || "Nenhum requisito especifico informado."}</p>
      <br>
      <h3>Descricao da Vaga:</h3>
      <p>${vaga.descricao}</p>
      <br>
      <div id="area-acao">
        ${acaoHtml}
      </div>
    `;

    const btnCandidatar = document.getElementById("btn-candidatar");
    if (btnCandidatar) {
      btnCandidatar.addEventListener("click", () => processarCandidatura(vaga.id));
    }

  } catch (error) {
    conteudoVaga.innerHTML = `<p>Erro ao carregar os detalhes da vaga.</p>`;
  }
}

async function processarCandidatura(vagaId) {
  mensagemErro.style.display = "none";
  mensagemSucesso.style.display = "none";

  try {
    const resposta = await candidatarSe(vagaId);
    if (resposta.success) {
      mensagemSucesso.textContent = "Candidatura realizada com sucesso!";
      mensagemSucesso.style.display = "block";

      const areaAcao = document.getElementById("area-acao");
      if (areaAcao) {
        areaAcao.innerHTML = `<div class="alert alert-success">Voce ja se candidatou a esta vaga.</div>`;
      }
    }
  } catch (error) {
    mensagemErro.textContent = error.message;
    mensagemErro.style.display = "block";
  }
}

async function inicializar() {
  await inicializarHeader();
  await carregarDetalhesVaga();
}

inicializar();
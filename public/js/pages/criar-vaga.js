import { buscarPerfilAtual } from "../api/auth.api.js";
import { criarVaga, listarCategorias, listarCidades } from "../api/vagas.api.js";

const formCriarVaga = document.getElementById("form-criar-vaga");
const selectCategoria = document.getElementById("categoria-id");
const selectCidade = document.getElementById("cidade-id");
const selectTipoTrabalho = document.getElementById("tipo-trabalho");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

async function verificarAcessoEPopularForm() {
  try {
    const perfilRes = await buscarPerfilAtual();
    const usuario = perfilRes?.data?.usuario || perfilRes?.data;

    if (!perfilRes?.success || !usuario || usuario.role !== "empresa") {
      window.location.href = "/";
      return;
    }

    const [categoriasRes, cidadesRes] = await Promise.all([
      listarCategorias().catch(() => ({ success: false, data: [] })),
      listarCidades().catch(() => ({ success: false, data: [] }))
    ]);

    // Extrai o array flexibilizando o payload da API
    const categorias = Array.isArray(categoriasRes) ? categoriasRes : (categoriasRes?.data?.categorias || categoriasRes?.data || []);
    const cidades = Array.isArray(cidadesRes) ? cidadesRes : (cidadesRes?.data?.cidades || cidadesRes?.data || []);

    if (selectCategoria && Array.isArray(categorias)) {
      selectCategoria.innerHTML = `<option value="">Selecione uma categoria</option>`;
      categorias.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.nome;
        selectCategoria.appendChild(option);
      });
    }

    if (selectCidade && Array.isArray(cidades)) {
      selectCidade.innerHTML = `<option value="">Selecione uma cidade</option>`;
      cidades.forEach((cid) => {
        const option = document.createElement("option");
        option.value = cid.id;
        
        // Trata variacoes do campo de estado (uf, estado, sigla)
        const estadoUf = cid.uf || cid.estado || cid.sigla || "";
        option.textContent = estadoUf ? `${cid.nome} - ${estadoUf}` : cid.nome;
        
        selectCidade.appendChild(option);
      });
    }
  } catch (error) {
    window.location.href = "/login.html";
  }
}

if (formCriarVaga) {
  formCriarVaga.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (mensagemErro) mensagemErro.style.display = "none";
    if (mensagemSucesso) mensagemSucesso.style.display = "none";

    const titulo = document.getElementById("titulo")?.value;
    const categoriaId = selectCategoria?.value;
    const cidadeId = selectCidade?.value;
    const tipoTrabalho = selectTipoTrabalho?.value || "presencial";
    const salario = document.getElementById("salario")?.value;
    const requisitos = document.getElementById("requisitos")?.value;
    const descricao = document.getElementById("descricao")?.value;

    const payload = {
      titulo,
      categoria_id: Number(categoriaId),
      cidade_id: Number(cidadeId),
      tipo_trabalho: tipoTrabalho,
      requisitos,
      descricao
    };

    if (salario) {
      payload.salario = Number(salario);
    }

    try {
      const resposta = await criarVaga(payload);
      if (resposta?.success) {
        if (mensagemSucesso) {
          mensagemSucesso.textContent = "Vaga cadastrada com sucesso! Redirecionando...";
          mensagemSucesso.style.display = "block";
        }
        formCriarVaga.reset();

        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        throw new Error(resposta?.message || "Erro ao cadastrar vaga.");
      }
    } catch (error) {
      if (mensagemErro) {
        mensagemErro.textContent = error.message;
        mensagemErro.style.display = "block";
      }
    }
  });
}

verificarAcessoEPopularForm();
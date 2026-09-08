import { CategoriaRepository } from "../repositories/categoria.repository.js";

export class CategoriaService {
static async listar(apenasAtivas = true, termo = "", page = 1, limit = 15) {
    const result = apenasAtivas 
      ? await CategoriaRepository.listarAtivas(termo, page, limit)
      : await CategoriaRepository.listarTodas(termo, page, limit);

    const lista = Array.isArray(result) ? result : (result?.categorias || result?.itens || []);
    const total = result?.total !== undefined ? result.total : lista.length;

    return {
      itens: lista,
      total: total,
      paginaAtual: page,
      totalPaginas: Math.ceil(total / limit) || 1
    };
  }

  static async criar(nome) {
    if (!nome || !nome.trim()) {
      throw new Error("O nome da categoria é obrigatório.");
    }

    const categoriaExistente = await CategoriaRepository.buscarPorNome(nome.trim());
    if (categoriaExistente) {
      throw new Error("Já existe uma categoria cadastrada com este nome.");
    }

    const id = await CategoriaRepository.criar(nome.trim());
    return CategoriaRepository.buscarPorId(id);
  }

  static async atualizar(id, { nome, ativa }) {
    const categoria = await CategoriaRepository.buscarPorId(id);
    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    const nomeFinal = nome ? nome.trim() : categoria.nome;
    const ativaFinal = ativa !== undefined ? (ativa ? 1 : 0) : categoria.ativa;

    if (nome && nome.trim() !== categoria.nome) {
      const duplicada = await CategoriaRepository.buscarPorNome(nomeFinal);
      if (duplicada) {
        throw new Error("Já existe outra categoria com este nome.");
      }
    }

    return CategoriaRepository.atualizar(id, {
      nome: nomeFinal,
      ativa: ativaFinal
    });
  }

  // Novo: Função de Exclusão com trava de integridade
  static async excluir(id) {
    const categoria = await CategoriaRepository.buscarPorId(id);
    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    const totalVagas = await CategoriaRepository.contarVagas(id);
    if (totalVagas > 0) {
      throw new Error("Não é possível excluir: existem vagas vinculadas a esta categoria. Recomendamos inativá-la.");
    }

    await CategoriaRepository.excluir(id);
    return { mensagem: "Categoria excluída com sucesso." };
  }
}
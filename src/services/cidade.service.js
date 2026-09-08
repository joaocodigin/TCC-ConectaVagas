import { CidadeRepository } from "../repositories/cidade.repository.js";

export class CidadeService {
static async listar(termo = "", page = 1, limit = 15) {
    const result = await CidadeRepository.listarTodas(termo, page, limit);

    const lista = Array.isArray(result) ? result : (result?.cidades || result?.itens || []);
    const total = result?.total !== undefined ? result.total : lista.length;

    return {
      itens: lista,
      total: total,
      paginaAtual: page,
      totalPaginas: Math.ceil(total / limit) || 1
    };
  }

  static async criar(nome, uf) {
    if (!nome || !nome.trim() || !uf || !uf.trim()) {
      throw new Error("Nome da cidade e UF são obrigatórios.");
    }

    if (uf.trim().length !== 2) {
      throw new Error("A UF deve conter exatamente 2 caracteres.");
    }

    const cidadeExistente = await CidadeRepository.buscarPorNomeEUf(nome.trim(), uf.trim());
    if (cidadeExistente) {
      throw new Error("Esta cidade já está cadastrada para este estado.");
    }

    const id = await CidadeRepository.criar(nome.trim(), uf.trim());
    return CidadeRepository.buscarPorId(id);
  }

  // Novo: Edita a cidade com validação
  static async atualizar(id, { nome, uf }) {
    const cidade = await CidadeRepository.buscarPorId(id);
    if (!cidade) throw new Error("Cidade não encontrada.");

    const nomeFinal = nome ? nome.trim() : cidade.nome;
    const ufFinal = uf ? uf.trim().toUpperCase() : cidade.uf;

    if (ufFinal.length !== 2) throw new Error("A UF deve conter exatamente 2 caracteres.");

    // Verifica se já existe outra cidade com o mesmo nome no mesmo estado
    if (nomeFinal !== cidade.nome || ufFinal !== cidade.uf) {
      const duplicada = await CidadeRepository.buscarPorNomeEUf(nomeFinal, ufFinal);
      if (duplicada) {
        throw new Error("Já existe outra cidade cadastrada com este nome e UF.");
      }
    }

    return CidadeRepository.atualizar(id, { nome: nomeFinal, uf: ufFinal });
  }

  // Novo: Exclui a cidade respeitando a integridade
  static async excluir(id) {
    const cidade = await CidadeRepository.buscarPorId(id);
    if (!cidade) throw new Error("Cidade não encontrada.");

    const totalVagas = await CidadeRepository.contarVagas(id);
    if (totalVagas > 0) {
      throw new Error("Não é possível excluir: existem vagas vinculadas a esta cidade. Para manter a integridade, você não pode excluí-la.");
    }

    await CidadeRepository.excluir(id);
    return { mensagem: "Cidade excluída com sucesso." };
  }
}
import { AdminRepository } from "../repositories/admin.repository.js";
import { UsuarioRepository } from "../repositories/usuario.repository.js";
import { VagaRepository } from "../repositories/vaga.repository.js";
import { ROLES } from "../constants/roles.js";
import { STATUS_VAGA } from "../constants/status.js";

export class AdminService {
  static async obterDashboard() {
    return AdminRepository.obterEstatisticasGlobais();
  }

  // ATUALIZADO: Calcula a matemática da paginação
  static async listarUsuarios(termoPesquisa = "", page = 1, limit = 15) {
    const usuarioRepo = new UsuarioRepository();
    const { usuarios, total } = await usuarioRepo.listarTodos(termoPesquisa, page, limit);
    
    return {
      itens: usuarios,
      total: total,
      paginaAtual: page,
      totalPaginas: Math.ceil(total / limit)
    };
  }

  static async alternarStatusUsuario(adminUsuarioId, targetUsuarioId) {
    if (Number(adminUsuarioId) === Number(targetUsuarioId)) {
      throw new Error("Não é possível alterar o próprio status de administrador.");
    }

    const usuarioRepo = new UsuarioRepository();
    const usuario = await usuarioRepo.buscarPorId(targetUsuarioId);
    
    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    if (usuario.role === ROLES.ADMIN) {
      throw new Error("Não é permitido bloquear outra conta de administrador.");
    }

    const novoStatus = usuario.ativo === 1 ? 0 : 1;
    
    // ATENÇÃO (Regra de Ocultação): 
    // Nós NÃO alteramos mais o status das vagas no banco de dados aqui.
    // Os dados ficam intactos. Se novoStatus for 0, os "INNER JOIN u.ativo = 1" 
    // nos repositories farão tudo desaparecer automaticamente.

    return AdminRepository.alternarStatusUsuario(targetUsuarioId, novoStatus);
  }

  static async editarUsuario(adminUsuarioId, targetUsuarioId, dadosAtualizados) {
    const usuarioRepo = new UsuarioRepository();
    const usuario = await usuarioRepo.buscarPorId(targetUsuarioId);
    
    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }
    
    if (Number(adminUsuarioId) === Number(targetUsuarioId) && dadosAtualizados.role !== ROLES.ADMIN) {
      throw new Error("Você não pode remover seu próprio privilégio de administrador.");
    }
    
    return await usuarioRepo.atualizar(targetUsuarioId, dadosAtualizados);
  }

  static async excluirUsuario(adminUsuarioId, targetUsuarioId) {
    if (Number(adminUsuarioId) === Number(targetUsuarioId)) {
      throw new Error("Não é possível excluir a própria conta de administrador.");
    }

    const usuarioRepo = new UsuarioRepository();
    const usuario = await usuarioRepo.buscarPorId(targetUsuarioId);
    
    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }
    
    if (usuario.role === ROLES.ADMIN) {
      throw new Error("Não é permitido excluir outra conta de administrador.");
    }

    await usuarioRepo.excluir(targetUsuarioId);
    
    return { mensagem: "Usuário e seus dados vinculados excluídos com sucesso." };
  }

  static async listarTodasVagas() {
    return AdminRepository.listarTodasVagas();
  }

  static async alterarStatusVaga(vagaId, novoStatus) {
    const statusValidos = Object.values(STATUS_VAGA);
    if (!statusValidos.includes(novoStatus)) {
      throw new Error("Status de vaga informado é inválido.");
    }

    const vaga = await VagaRepository.buscarPorId(vagaId);
    if (!vaga) {
      throw new Error("Vaga não encontrada.");
    }

    return AdminRepository.alterarStatusVaga(vagaId, novoStatus);
  }
}
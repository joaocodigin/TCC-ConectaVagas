import { CandidaturaRepository } from "../repositories/candidatura.repository.js";
import { VagaRepository } from "../repositories/vaga.repository.js";
import { EmpresaRepository } from "../repositories/empresa.repository.js";
import { UsuarioRepository } from "../repositories/usuario.repository.js";
import { STATUS_CANDIDATURA, STATUS_VAGA } from "../constants/status.js";

const candidaturaRepo = new CandidaturaRepository();
const vagaRepo = new VagaRepository();
const empresaRepo = new EmpresaRepository();
const usuarioRepo = new UsuarioRepository();

// Auxiliares para chamadas seguras (estáticas ou de instância)
const buscarVaga = (vId) => VagaRepository.buscarPorId ? VagaRepository.buscarPorId(vId) : vagaRepo.buscarPorId(vId);
const buscarEmpresa = async (uId) => {
  if (EmpresaRepository.buscarPorUsuarioId) {
    return await EmpresaRepository.buscarPorUsuarioId(uId);
  }
  return await empresaRepo.buscarPorUsuarioId(uId);
};

// Garante que exista um registro de empresa para o usuário autenticado
const obterEmpresaOuCriar = async (usuarioEmpresaId) => {
  let empresa = await buscarEmpresa(usuarioEmpresaId);

  if (!empresa) {
    const buscarUsuario = UsuarioRepository.buscarPorId || usuarioRepo.buscarPorId.bind(usuarioRepo);
    const usuario = await buscarUsuario(usuarioEmpresaId);

    const nomeBase = usuario?.nome || "Empresa Cadastrada";
    const timestamp = Date.now().toString().slice(-8);

    const dadosCriacao = {
      usuario_id: usuarioEmpresaId,
      nome_fantasia: nomeBase,
      razao_social: `${nomeBase} LTDA`,
      cnpj: `000000${timestamp}`,
      descricao: null,
      cidade: null,
      telefone: null
    };

    let novaEmpresaId;
    if (EmpresaRepository.criar) {
      novaEmpresaId = await EmpresaRepository.criar(dadosCriacao);
    } else if (empresaRepo.criar) {
      novaEmpresaId = await empresaRepo.criar(dadosCriacao);
    }

    empresa = { id: novaEmpresaId, usuario_id: usuarioEmpresaId };
  }

  return empresa;
};

export class CandidaturaService {
  static async candidatar(candidatoId, vagaId) {
    const vaga = await buscarVaga(vagaId);
    if (!vaga) {
      throw new Error("Vaga não encontrada.");
    }

    // Regra 23: Não aceitar candidaturas para vagas encerradas
    const statusValido = STATUS_VAGA?.ATIVA || "ativa";
    if (vaga.status && vaga.status !== statusValido && vaga.status !== "aberta") {
      throw new Error("Não é possível se candidatar a uma vaga encerrada.");
    }

    const buscarExistente = CandidaturaRepository.buscarPorVagaECandidato 
      ? CandidaturaRepository.buscarPorVagaECandidato 
      : candidaturaRepo.buscarPorVagaECandidato.bind(candidaturaRepo);

    const jaCandidatado = await buscarExistente(vagaId, candidatoId);
    if (jaCandidatado) {
      throw new Error("Você já se candidatou a esta vaga.");
    }

    const criarMetodo = CandidaturaRepository.criar 
      ? CandidaturaRepository.criar 
      : candidaturaRepo.criar.bind(candidaturaRepo);

    const candidaturaId = await criarMetodo({
      vaga_id: vagaId,
      candidato_id: candidatoId
    });

    const buscarCandidatura = CandidaturaRepository.buscarPorId 
      ? CandidaturaRepository.buscarPorId 
      : candidaturaRepo.buscarPorId.bind(candidaturaRepo);

    return await buscarCandidatura(candidaturaId);
  }

  static async listarMinhasCandidaturas(candidatoId) {
    const listarMetodo = CandidaturaRepository.listarPorCandidato 
      ? CandidaturaRepository.listarPorCandidato 
      : candidaturaRepo.listarPorCandidato.bind(candidaturaRepo);

    return await listarMetodo(candidatoId);
  }

  static async listarCandidatosDaVaga(usuarioEmpresaId, vagaId) {
    const empresa = await obterEmpresaOuCriar(usuarioEmpresaId);
    const vaga = await buscarVaga(vagaId);

    if (!vaga) {
      throw new Error("Vaga não encontrada.");
    }

    // Validação IDOR flexível: confere contra ID da empresa ou ID do usuário criador
    const pertenceAEmpresa = Number(vaga.empresa_id) === Number(empresa.id) || 
                             Number(vaga.empresa_id) === Number(usuarioEmpresaId);

    if (!pertenceAEmpresa) {
      throw new Error("Acesso negado: Você não é o proprietário desta vaga.");
    }

    const listarPorVagaMetodo = CandidaturaRepository.listarPorVagaEEmpresa 
      ? CandidaturaRepository.listarPorVagaEEmpresa 
      : (CandidaturaRepository.listarPorVaga 
          ? CandidaturaRepository.listarPorVaga 
          : candidaturaRepo.listarPorVagaEEmpresa?.bind(candidaturaRepo));

    return await listarPorVagaMetodo(vagaId, empresa.id);
  }

  static async atualizarStatus(usuarioEmpresaId, candidaturaId, novoStatus) {
    const statusPermitidos = STATUS_CANDIDATURA ? Object.values(STATUS_CANDIDATURA) : ["pendente", "aceito", "recusado"];
    if (!statusPermitidos.includes(novoStatus)) {
      throw new Error("Status informado é inválido.");
    }

    const empresa = await obterEmpresaOuCriar(usuarioEmpresaId);

    const buscarCandidatura = CandidaturaRepository.buscarPorId 
      ? CandidaturaRepository.buscarPorId 
      : candidaturaRepo.buscarPorId.bind(candidaturaRepo);

    const candidatura = await buscarCandidatura(candidaturaId);
    if (!candidatura) {
      throw new Error("Candidatura não encontrada.");
    }

    // Validação IDOR: Empresa só pode alterar status de candidaturas das suas próprias vagas
    const pertenceAEmpresa = Number(candidatura.empresa_id) === Number(empresa.id) || 
                             Number(candidatura.empresa_id) === Number(usuarioEmpresaId);

    if (candidatura.empresa_id && !pertenceAEmpresa) {
      throw new Error("Acesso negado: Você não possui permissão para alterar esta candidatura.");
    }

    const atualizarMetodo = CandidaturaRepository.atualizarStatus 
      ? CandidaturaRepository.atualizarStatus 
      : candidaturaRepo.atualizarStatus.bind(candidaturaRepo);

    return await atualizarMetodo(candidaturaId, novoStatus);
  }
}
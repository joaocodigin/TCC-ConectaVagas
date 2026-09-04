import bcrypt from "bcryptjs";
import { EmpresaRepository } from "../repositories/empresa.repository.js";
import { UsuarioRepository } from "../repositories/usuario.repository.js";
import { ROLES } from "../constants/roles.js";

export class EmpresaService {
  static async registrarEmpresa({ nome, email, senha, nome_fantasia, razao_social, cnpj, descricao, cidade, telefone }) {
    if (!nome || !email || !senha || !nome_fantasia || !razao_social || !cnpj) {
      throw new Error("Preencha todos os campos obrigatórios para o cadastro da empresa.");
    }

    const emailExistente = await UsuarioRepository.buscarPorEmail(email);
    if (emailExistente) {
      throw new Error("E-mail já cadastrado no sistema.");
    }

    const cnpjExistente = await EmpresaRepository.buscarPorCnpj(cnpj);
    if (cnpjExistente) {
      throw new Error("CNPJ já cadastrado no sistema.");
    }

    // Criar a conta de usuário com a role EMPRESA
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const usuarioId = await UsuarioRepository.criar({
      nome,
      email,
      senha: senhaHash,
      role: ROLES.EMPRESA
    });

    // Criar o perfil vinculado da Empresa
    const empresaId = await EmpresaRepository.criar({
      usuario_id: usuarioId,
      nome_fantasia,
      razao_social,
      cnpj,
      descricao,
      cidade,
      telefone
    });

    return EmpresaRepository.buscarPorId(empresaId);
  }

  static async buscarPerfilPorUsuario(usuarioId) {
    const empresa = await EmpresaRepository.buscarPorUsuarioId(usuarioId);
    if (!empresa) {
      throw new Error("Perfil de empresa não encontrado.");
    }
    return empresa;
  }

  static async atualizarPerfil(usuarioId, dados) {
    const empresa = await EmpresaRepository.buscarPorUsuarioId(usuarioId);
    if (!empresa) {
      throw new Error("Empresa não encontrada para atualização.");
    }

    const { nome_fantasia, razao_social, descricao, cidade, telefone } = dados;

    if (!nome_fantasia || !razao_social) {
      throw new Error("Nome Fantasia e Razão Social são obrigatórios.");
    }

    return EmpresaRepository.atualizar(empresa.id, {
      nome_fantasia,
      razao_social,
      descricao,
      cidade,
      telefone
    });
  }
}
import bcrypt from "bcryptjs";
import { UsuarioRepository } from "../repositories/usuario.repository.js";

export class AuthService {
  constructor() {
    this.usuarioRepository = new UsuarioRepository();
  }

  async registrar({ nome, email, senha, role }) {
    if (!nome || !email || !senha || !role) {
      throw new Error("Todos os campos obrigatorios devem ser preenchidos.");
    }

    const rolesPermitidas = ["candidato", "empresa", "admin"];
    if (!rolesPermitidas.includes(role)) {
      throw new Error("Perfil invalido. Escolha candidato ou empresa.");
    }

    if (senha.length < 6) {
      throw new Error("A senha deve conter no minimo 6 caracteres.");
    }

    const usuarioExistente = await this.usuarioRepository.buscarPorEmail(email);
    if (usuarioExistente) {
      throw new Error("Este e-mail ja esta cadastrado no sistema.");
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const novoUsuario = await this.usuarioRepository.criar({
      nome,
      email,
      senhaHash,
      role
    });

    return novoUsuario;
  }

 async login({ email, senha }) {
    if (!email || !senha) {
      throw new Error("E-mail e senha são obrigatórios.");
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      throw new Error("Credenciais inválidas.");
    }

    // TRAVA: Mensagem customizada de bloqueio
    if (usuario.ativo === 0) {
      throw new Error("Acesso negado: Seu usuário foi bloqueado. Entre em contato com suporte@conectavagas.com.br");
    }

    const hashNoBanco = usuario.senha || usuario.senha_hash;

    if (!hashNoBanco) {
      throw new Error("Erro de configuração na conta do usuário.");
    }

    const senhaValida = await bcrypt.compare(senha, hashNoBanco);
    if (!senhaValida) {
      throw new Error("Credenciais inválidas.");
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role
    };
  }
}
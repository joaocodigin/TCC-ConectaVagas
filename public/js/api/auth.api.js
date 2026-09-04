import { apiRequest } from "./api.js";

export async function registrarUsuario(dadosUsuario) {
  return await apiRequest("/api/auth/registrar", "POST", dadosUsuario);
}

export async function login(email, senha) {
  return await apiRequest("/api/auth/login", "POST", { email, senha });
}

export async function buscarPerfilAtual() {
  try {
    const resposta = await apiRequest("/api/auth/me", "GET");
    return resposta;
  } catch (error) {
    // Retorna resposta padrao tratada de visitante nao autenticado
    return { success: false, data: null, message: error.message };
  }
}

export async function logout() {
  return await apiRequest("/api/auth/logout", "POST");
}

export async function registrarCandidato(dados) {
  return await apiRequest("/api/auth/registrar", "POST", { ...dados, role: "candidato" });
}

export async function registrarEmpresa(dados) {
  return await apiRequest("/api/auth/registrar", "POST", { ...dados, role: "empresa" });
}
import { apiRequest } from "./api.js";

// ==========================================
// GESTÃO DE USUÁRIOS
// ==========================================
export async function listarTodosUsuarios(termoPesquisa = "", page = 1) {
  const query = new URLSearchParams();
  if (termoPesquisa) query.append("q", termoPesquisa);
  if (page > 1) query.append("page", page);
  
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return await apiRequest(`/api/admin/usuarios${queryString}`, "GET");
}

export async function alternarStatusUsuario(usuarioId, ativo) {
  return await apiRequest(`/api/admin/usuarios/${usuarioId}/status`, "PATCH", { ativo });
}

export async function editarUsuario(usuarioId, dados) {
  return await apiRequest(`/api/admin/usuarios/${usuarioId}`, "PUT", dados);
}

export async function excluirUsuario(usuarioId) {
  return await apiRequest(`/api/admin/usuarios/${usuarioId}`, "DELETE");
}

// ==========================================
// GESTÃO DE CATEGORIAS
// ==========================================

export async function criarCategoria(nome) {
  return await apiRequest("/api/categorias", "POST", { nome });
}

export async function atualizarCategoria(id, dados) {
  return await apiRequest(`/api/categorias/${id}`, "PUT", dados);
}

export async function excluirCategoria(id) {
  return await apiRequest(`/api/categorias/${id}`, "DELETE");
}

// ==========================================
// GESTÃO DE CIDADES
// ==========================================

export async function criarCidade(nome, uf) {
  return await apiRequest("/api/cidades", "POST", { nome, uf });
}

export async function atualizarCidade(id, dados) {
  return await apiRequest(`/api/cidades/${id}`, "PUT", dados);
}

export async function excluirCidade(id) {
  return await apiRequest(`/api/cidades/${id}`, "DELETE");
}
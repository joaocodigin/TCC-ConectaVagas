import { apiRequest } from "./api.js";

export async function listarVagas(filtros = {}) {
  const query = new URLSearchParams();
  if (filtros.busca) query.append("busca", filtros.busca);
  if (filtros.categoria_id) query.append("categoria_id", filtros.categoria_id);
  if (filtros.cidade_id) query.append("cidade_id", filtros.cidade_id);
  if (filtros.tipo_trabalho) query.append("tipo_trabalho", filtros.tipo_trabalho);
  if (filtros.empresa) query.append("empresa", filtros.empresa);
  if (filtros.salario) query.append("salario", filtros.salario);
  if (filtros.page) query.append("page", filtros.page);
  if (filtros.limit) query.append("limit", filtros.limit);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return await apiRequest(`/api/vagas${queryString}`, "GET");
}
export async function criarVaga(dadosVaga) {
  return await apiRequest("/api/vagas", "POST", dadosVaga);
}

export async function listarCategorias(termo = "", page = 1) {
  const query = new URLSearchParams();
  if (termo) query.append("q", termo);
  if (page > 1) query.append("page", page);
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return await apiRequest(`/api/categorias${queryString}`, "GET");
}

export async function listarCidades(termo = "", page = 1) {
  const query = new URLSearchParams();
  if (termo) query.append("q", termo);
  if (page > 1) query.append("page", page);
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return await apiRequest(`/api/cidades${queryString}`, "GET");
}
export async function buscarVagaPorId(id) {
  return await apiRequest(`/api/vagas/${id}`, "GET");
}

export async function listarMinhasVagas() {
  return await apiRequest("/api/vagas/minhas", "GET");
}

export async function encerrarVaga(id) {
  return await apiRequest(`/api/vagas/${id}/encerrar`, "PATCH");
}

export async function alterarStatusVaga(id, status) {
  return await apiRequest(`/api/vagas/${id}`, "PUT", { status });
}
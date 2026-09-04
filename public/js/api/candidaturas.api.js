import { apiRequest } from "./api.js";

export async function candidatarSe(vagaId) {
  return await apiRequest("/api/candidaturas", "POST", { vaga_id: vagaId });
}

export async function listarMinhasCandidaturas() {
  return await apiRequest("/api/candidaturas/minhas", "GET");
}

export async function listarCandidatosDaVaga(vagaId) {
  return await apiRequest(`/api/candidaturas/vaga/${vagaId}`, "GET");
}

export async function atualizarStatusCandidatura(candidaturaId, status) {
  return await apiRequest(`/api/candidaturas/${candidaturaId}/status`, "PATCH", { status });
}
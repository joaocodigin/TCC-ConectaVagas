export async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {},
    credentials: "include"
  };

  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(endpoint, options);
    const data = await response.json().catch(() => ({ message: "Resposta invalida do servidor" }));

    if (!response.ok) {
      const mensagemDetalhada = data.message || `Erro HTTP ${response.status}: ${response.statusText}`;
      console.error(`[API Error] ${method} ${endpoint}:`, mensagemDetalhada);
      throw new Error(mensagemDetalhada);
    }

    return data;
  } catch (error) {
    console.error(`[Fetch Fail] ${method} ${endpoint}:`, error.message);
    throw error;
  }
}
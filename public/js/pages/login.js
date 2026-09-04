import { login, buscarPerfilAtual } from "../api/auth.api.js";

const formLogin = document.getElementById("form-login");
const mensagemErro = document.getElementById("mensagem-erro");

// Se o usuario ja estiver logado, redireciona direto para a home
async function verificarSessaoAtiva() {
  try {
    const res = await buscarPerfilAtual();
    const usuario = res?.data?.usuario || res?.data;
    if (res?.success && usuario && usuario.id) {
      window.location.href = "/";
    }
  } catch (err) {
    // Usuario visitante, continua na tela de login
  }
}

function exibirErro(mensagem) {
  if (!mensagemErro) return;
  if (!mensagem) {
    mensagemErro.style.display = "none";
    mensagemErro.textContent = "";
  } else {
    mensagemErro.style.display = "block";
    mensagemErro.textContent = mensagem;
  }
}

if (formLogin) {
  formLogin.addEventListener("submit", async (event) => {
    event.preventDefault();
    exibirErro("");

    const emailInput = document.getElementById("email");
    const senhaInput = document.getElementById("senha");

    const email = emailInput ? emailInput.value.trim() : "";
    const senha = senhaInput ? senhaInput.value : "";

    try {
      const resposta = await login(email, senha);

      if (resposta && resposta.success) {
        // Aguarda 200ms para garantir a gravacao do cookie HTTP connect.sid
        setTimeout(() => {
          window.location.href = "/";
        }, 200);
      } else {
        exibirErro(resposta?.message || "Credenciais invalidas.");
      }
    } catch (error) {
      exibirErro(error.message || "Erro ao conectar com o servidor.");
    }
  });
}

verificarSessaoAtiva();
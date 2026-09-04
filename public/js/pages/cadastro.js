import { registrarUsuario } from "../api/auth.api.js";

const formCadastro = document.getElementById("form-cadastro");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

if (formCadastro) {
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    ocultarMensagens();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const role = document.getElementById("role").value;
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;

    if (senha !== confirmarSenha) {
      exibirErro("As senhas informadas nao conferem.");
      return;
    }

    if (senha.length < 6) {
      exibirErro("A senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    try {
      const resposta = await registrarUsuario({
        nome,
        email,
        senha,
        role
      });

      if (resposta.success) {
        exibirSucesso("Cadastro realizado com sucesso! Redirecionando para o login...");
        formCadastro.reset();

        setTimeout(() => {
          window.location.href = "/login.html";
        }, 2000);
      }
    } catch (error) {
      exibirErro(error.message || "Ocorreu um erro ao realizar o cadastro.");
    }
  });
}

function exibirErro(mensagem) {
  mensagemErro.textContent = mensagem;
  mensagemErro.style.display = "block";
  mensagemSucesso.style.display = "none";
}

function exibirSucesso(mensagem) {
  mensagemSucesso.textContent = mensagem;
  mensagemSucesso.style.display = "block";
  mensagemErro.style.display = "none";
}

function ocultarMensagens() {
  mensagemErro.style.display = "none";
  mensagemSucesso.style.display = "none";
}
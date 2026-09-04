import { registrarCandidato, registrarEmpresa } from "../api/auth.api.js";

const formRegistro = document.getElementById("form-registro");
const tipoContaSelect = document.getElementById("tipo-conta");
const camposEmpresa = document.getElementById("campos-empresa");
const mensagemErro = document.getElementById("mensagem-erro");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

const inputNomeFantasia = document.getElementById("nome-fantasia");
const inputRazaoSocial = document.getElementById("razao-social");
const inputCnpj = document.getElementById("cnpj");

tipoContaSelect.addEventListener("change", (e) => {
  const isEmpresa = e.target.value === "empresa";
  
  camposEmpresa.style.display = isEmpresa ? "block" : "none";
  inputNomeFantasia.required = isEmpresa;
  inputRazaoSocial.required = isEmpresa;
  inputCnpj.required = isEmpresa;
});

if (formRegistro) {
  formRegistro.addEventListener("submit", async (event) => {
    event.preventDefault();
    mensagemErro.style.display = "none";
    mensagemSucesso.style.display = "none";

    const tipoConta = tipoContaSelect.value;
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
      if (tipoConta === "candidato") {
        await registrarCandidato({ nome, email, senha });
      } else {
        const nomeFantasia = inputNomeFantasia.value;
        const razaoSocial = inputRazaoSocial.value;
        const cnpj = inputCnpj.value;

        await registrarEmpresa({
          nome,
          email,
          senha,
          nomeFantasia,
          razaoSocial,
          cnpj
        });
      }

      mensagemSucesso.textContent = "Cadastro realizado com sucesso! Redirecionando para o login...";
      mensagemSucesso.style.display = "block";

      setTimeout(() => {
        window.location.href = "/login.html";
      }, 2000);
    } catch (error) {
      mensagemErro.textContent = error.message;
      mensagemErro.style.display = "block";
    }
  });
}
/**
 * Conecta Vagas - Animação do Carrossel de Vagas (Home)
 * Arquitetura Visual: Container estático (overflow: hidden) -> Pista interna (transform: translateX)
 */

function inicializarCarrossel() {
  const container = document.getElementById("lista-vagas");
  if (!container) return;

  const prefereMenosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefereMenosMovimento) return;

  const tentarIniciar = () => {
    const items = Array.from(container.children);
    
    const textoContainer = container.textContent.toLowerCase();
    const carregando = textoContainer.includes("carregando");
    const erro = textoContainer.includes("erro");
    const vazio = textoContainer.includes("nenhuma vaga");

    // Só inicia a animação se for uma lista de vagas reais
    if (items.length > 0 && !carregando && !erro && !vazio) {
      setTimeout(() => configurarAnimacaoContinua(container, items), 100);
      return true;
    }
    return false;
  };

  if (!tentarIniciar()) {
    const observer = new MutationObserver((mutations, obs) => {
      if (tentarIniciar()) {
        obs.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
  }
}

function configurarAnimacaoContinua(container, cardsIniciais) {
  // 1. Cria a "pista" interna que vai rolar
  const track = document.createElement("div");
  track.style.display = "flex";
  track.style.gap = "24px";
  track.style.width = "max-content"; // Impede que os cards sejam esmagados

  // 2. Prepara o container principal (A Janela)
  container.style.display = "block";
  container.style.overflow = "hidden";
  container.style.padding = "10px 0";

  // 3. Move os cards originais para a pista e calcula a largura de UM ciclo perfeito
  let larguraCiclo = 0;
  cardsIniciais.forEach(card => {
    card.style.flex = "0 0 320px"; // Fixa a largura do card
    track.appendChild(card);
    larguraCiclo += 320 + 24; // 320px do card + 24px do gap
  });

  // 4. Clona os cards para garantir que a tela fique cheia (mesmo se houver apenas 1 vaga)
  // Calcula quantos ciclos são necessários para cobrir telas ultra-wide (ex: 2500px)
  const copiasNecessarias = Math.max(2, Math.ceil(2500 / larguraCiclo) + 1);
  
  for (let i = 0; i < copiasNecessarias; i++) {
    cardsIniciais.forEach(card => {
      const clone = card.cloneNode(true);
      track.appendChild(clone);
    });
  }

  // 5. Adiciona a pista dentro do container
  container.appendChild(track);

  // 6. Motor da Animação
  let posicao = 0;
  let pausado = false;

  const animar = () => {
    if (!pausado) {
      posicao -= 1; // Velocidade (aumente este número para rolar mais rápido)
      
      // Reset invisível: quando rola exatamente a largura do ciclo original, volta para o zero
      if (Math.abs(posicao) >= larguraCiclo) {
        posicao = 0;
      }
      
      // Movimenta a pista, não o container
      track.style.transform = `translateX(${posicao}px)`;
    }
    requestAnimationFrame(animar);
  };

  // 7. Microinterações: Pausa ao interagir
  container.addEventListener("mouseenter", () => pausado = true);
  container.addEventListener("mouseleave", () => pausado = false);
  container.addEventListener("touchstart", () => pausado = true, { passive: true });
  container.addEventListener("touchend", () => pausado = false);

  animar();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarCarrossel);
} else {
  inicializarCarrossel();
}
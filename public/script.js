const botao = document.getElementById("gerar");
const tabela = document.querySelector("#tabela tbody");
const som = document.getElementById("som");

// Função simulada (você pode conectar depois com API ou dados reais)
function gerarRodada() {
  const hora = new Date().toLocaleTimeString();
  const multiplicador = (Math.random() * 20 + 1).toFixed(2) + "x";
  const cor = parseFloat(multiplicador) > 5 ? "🔥 Alta" : "🧊 Baixa";
  return { hora, multiplicador, cor };
}

// Gera e adiciona nova linha
function adicionarRodada() {
  const rodada = gerarRodada();
  const linha = document.createElement("tr");
  linha.innerHTML = `
    <td>${rodada.hora}</td>
    <td>${rodada.multiplicador}</td>
    <td>${rodada.cor}</td>
  `;
  tabela.prepend(linha);

  // Toca o som de clique
  som.currentTime = 0;
  som.play();
}

// Botão de gerar palpite
botao.addEventListener("click", adicionarRodada);

// Atualiza automaticamente a cada 20 segundos (simulação de histórico)
setInterval(() => {
  adicionarRodada();
}, 20000);  document.getElementById("ultimaRodada").innerText = `Última rodada: ${ultima}x`;
  document.getElementById("resultado").innerText = `Proteção: ${protecao}x | Cai em: ${queda}x`;

  const tabela = document.getElementById("histTable");
  const row = tabela.insertRow(-1);
  row.insertCell(0).innerText = total;
  row.insertCell(1).innerText = hora;
  row.insertCell(2).innerText = `${ultima}x`;
  row.insertCell(3).innerText = `${protecao}x`;
  row.insertCell(4).innerText = `${queda}x`;
  row.insertCell(5).innerText = acertou ? "Acertou" : "Errou";
      }

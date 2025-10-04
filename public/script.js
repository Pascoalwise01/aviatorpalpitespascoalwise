let total = 0;
let acertos = 0;
let erros = 0;
let ultimaRodada = 0;

// Função para gerar número aleatório entre min e max
function aleatorio(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Função principal
function gerarPalpite() {
  // Simula a última rodada (ex: 1.24x, 3.88x, 12.65x)
  ultimaRodada = aleatorio(1, 15);

  // Gera uma lógica simples baseada na última rodada
  let protecao, queda;

  if (ultimaRodada < 2) {
    // se voo foi baixo, o próximo tende a subir
    protecao = aleatorio(2, 3);
    queda = aleatorio(6, 10);
  } else if (ultimaRodada >= 2 && ultimaRodada < 5) {
    // voo médio → leve ajuste
    protecao = aleatorio(2, 2.8);
    queda = aleatorio(4, 7);
  } else {
    // voo alto → tendência de queda
    protecao = aleatorio(1.5, 2.3);
    queda = aleatorio(2.5, 4.5);
  }

  // Atualiza textos na tela
  document.getElementById("ultimaRodada").innerText = `Última rodada: ${ultimaRodada}x`;
  document.getElementById("resultado").innerText = `Proteção: ${protecao}x  |  Cai em: ${queda}x`;

  // Atualiza estatísticas simuladas
  total++;
  // Gera um "acerto" aleatório (50% chance)
  if (Math.random() > 0.5) {
    acertos++;
  } else {
    erros++;
  }

  document.getElementById("total").innerText = total;
  document.getElementById("acertos").innerText = acertos;
  document.getElementById("erros").innerText = erros;
}

#estatisticas {
  margin: 20px auto;
  border-collapse: collapse;
  width: 80%;
  color: #f1f1f1;
  background: #1d3557;
  border-radius: 10px;
  overflow: hidden;
}

#estatisticas th, #estatisticas td {
  border: 1px solid #457b9d;
  padding: 10px;
}

#estatisticas th {
  background: #e63946;
}

.info {
  font-size: 18px;
  margin: 10px 0;
  }

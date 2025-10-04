let total = 0, acertos = 0, erros = 0;

function aleatorio(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function gerarPalpite() {
  const now = new Date();
  const hora = now.toLocaleTimeString();

  // simular última rodada
  const ultima = aleatorio(1, 15);

  // lógica de proteção e alvo
  let protecao, queda;
  if (ultima < 2) {
    protecao = aleatorio(2, 3);
    queda = aleatorio(6, 10);
  } else if (ultima < 5) {
    protecao = aleatorio(2, 2.8);
    queda = aleatorio(4, 7);
  } else {
    protecao = aleatorio(1.5, 2.3);
    queda = aleatorio(2.5, 4.5);
  }

  // gerar probabilidade de acerto simulado
  const acertou = Math.random() > 0.5;

  total++;
  if (acertou) acertos++; else erros++;

  document.getElementById("total").innerText = total;
  document.getElementById("acertos").innerText = acertos;
  document.getElementById("erros").innerText = erros;

  document.getElementById("ultimaRodada").innerText = `Última rodada: ${ultima}x`;
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

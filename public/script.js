// === VARIÁVEIS GLOBAIS ===
let limiteRodadas = 20;
let total = 0;
let acertos = 0;
let erros = 0;
let historico = [];
let fatorAjuste = 1.0;

// === GERAR PALPITE AUTOMÁTICO ===
function gerarPalpite() {
  const ultimaRodada = (Math.random() * 10 + 1).toFixed(2);
  const protecao = (Math.random() * 2 + 1.5 * fatorAjuste).toFixed(2);
  const alvo = (parseFloat(protecao) + Math.random() * 6 * fatorAjuste).toFixed(2);
  const hora = new Date().toLocaleTimeString();

  document.getElementById('ultimaRodada').innerText = `Última rodada: ${ultimaRodada}x`;
  document.getElementById('resultado').innerHTML = `
    <strong>Proteção:</strong> ${protecao}x | 
    <strong>Cai em:</strong> ${alvo}x
    <br><br>
    <button onclick="registrarResultado('acertou', '${ultimaRodada}', '${protecao}', '${alvo}', '${hora}')">✅ Acertou</button>
    <button onclick="registrarResultado('errou', '${ultimaRodada}', '${protecao}', '${alvo}', '${hora}')">❌ Errou</button>
  `;

  total++;
  document.getElementById('total').innerText = total;
}

// === REGISTRAR RESULTADO ===
function registrarResultado(status, ultimaRodada, protecao, alvo, hora) {
  let resultadoTexto = "";

  if (status === "acertou") {
    acertos++;
    document.getElementById("acertos").innerText = acertos;
    resultadoTexto = "✅ Acerto";
    ajustarFator(true);
  } else {
    const real = prompt("Digite o valor real onde o Aviator parou (ex: 3.75):");
    erros++;
    document.getElementById("erros").innerText = erros;
    resultadoTexto = `❌ Erro (real: ${real}x)`;
    ajustarFator(false, parseFloat(real), parseFloat(alvo));
  }

  adicionarHistorico(hora, ultimaRodada, protecao, alvo, resultadoTexto, status);
  atualizarTaxa();
  document.getElementById("resultado").innerText = "Palpite registrado. Gere o próximo!";
}

// === AJUSTE LÓGICO ===
function ajustarFator(acertou, real = null, alvo = null) {
  if (acertou) {
    fatorAjuste += 0.02;
  } else if (real && alvo) {
    if (real < alvo) fatorAjuste -= 0.05;
    else fatorAjuste += 0.05;
  }

  if (fatorAjuste < 0.5) fatorAjuste = 0.5;
  if (fatorAjuste > 2.0) fatorAjuste = 2.0;
}

// === HISTÓRICO + GRÁFICO ===
function adicionarHistorico(hora, ultimaRodada, protecao, alvo, resultado, status) {
  historico.push({ hora, ultimaRodada, protecao, alvo, resultado, status });
  if (historico.length > 20) historico.shift();

  const tabela = document.getElementById("histTable");
  tabela.innerHTML = `
    <tr>
      <th>#</th>
      <th>Hora</th>
      <th>Última Rodada</th>
      <th>Proteção</th>
      <th>Cai em</th>
      <th>Resultado</th>
    </tr>
  `;

  historico.forEach((item, i) => {
    const linha = tabela.insertRow(-1);
    linha.insertCell(0).innerText = i + 1;
    linha.insertCell(1).innerText = item.hora;
    linha.insertCell(2).innerText = `${item.ultimaRodada}x`;
    linha.insertCell(3).innerText = `${item.protecao}x`;
    linha.insertCell(4).innerText = `${item.alvo}x`;
    linha.insertCell(5).innerText = item.resultado;
  });

  desenharGrafico();
}

// === GRÁFICO VISUAL ===
function desenharGrafico() {
  const canvas = document.getElementById("graficoResultados");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const larguraBarra = canvas.width / 20;
  historico.forEach((item, i) => {
    ctx.fillStyle = item.status === "acertou" ? "#00ff80" : "#ff3366";
    ctx.fillRect(i * larguraBarra, canvas.height - 40, larguraBarra - 4, 40);
  });

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 1);
  ctx.lineTo(canvas.width, canvas.height - 1);
  ctx.stroke();
}

// === TAXA DE ACERTO ===
function atualizarTaxa() {
  const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
  const elemento = document.getElementById("taxaAcerto");

  elemento.innerText = `Taxa de acerto: ${taxa}%`;

  if (taxa >= 60) {
    elemento.style.color = "#00ff80"; // verde
  } else if (taxa >= 30) {
    elemento.style.color = "#ffcc00"; // amarelo
  } else {
    elemento.style.color = "#ff3366"; // vermelho
    function atualizarLimite() {
  const select = document.getElementById("limiteRodadas");
  limiteRodadas = parseInt(select.value);
  console.log(`Limite de rodadas ajustado para: ${limiteRodadas}`);
    }
  }
    }

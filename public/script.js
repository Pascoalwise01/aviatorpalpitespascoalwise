let history = [];
let ocrReady = false;

// Simula inicialização do OCR (exemplo visual)
setTimeout(() => {
  ocrReady = true;
  document.getElementById("ocr-status").innerText = "✅ OCR pronto para processar imagem.";
}, 1500);

document.getElementById("processImage").addEventListener("click", () => {
  if (!ocrReady) {
    alert("Erro: OCR ainda a iniciar. Tente depois de alguns segundos.");
    return;
  }

  const image = document.getElementById("imageUpload").files[0];
  if (!image) {
    alert("Por favor, seleciona uma imagem do histórico.");
    return;
  }

  // Simula extração de valores do histórico
  history = gerarHistoricoAleatorio(20);
  exibirHistorico();

  document.getElementById("upload-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
});

function gerarHistoricoAleatorio(qtd) {
  let arr = [];
  for (let i = 0; i < qtd; i++) {
    arr.push((Math.random() * 20).toFixed(2));
  }
  return arr;
}

function exibirHistorico() {
  const div = document.getElementById("history");
  div.innerHTML = "";
  history.slice(-20).forEach((h) => {
    const span = document.createElement("span");
    span.classList.add("hold");

    const valor = parseFloat(h);
    if (valor < 2) span.classList.add("azul");
    else if (valor < 10) span.classList.add("lilas");
    else span.classList.add("vermelho");

    span.textContent = h + "x";
    div.appendChild(span);
  });
}

document.getElementById("generatePrediction").addEventListener("click", () => {
  const prediction = gerarPrevisao();
  const resultEl = document.getElementById("predictionResult");
  resultEl.innerHTML = `🎯 Próximo palpite: <strong>${prediction.valor}x</strong> (${prediction.cor.toUpperCase()})`;

  // Simula erro em 25% dos casos
  if (Math.random() < 0.25) {
    document.getElementById("manual-correction").style.display = "block";
  } else {
    document.getElementById("manual-correction").style.display = "none";
  }
});

function gerarPrevisao() {
  const media = history.slice(-5).reduce((a, b) => a + parseFloat(b), 0) / 5;
  const variacao = (Math.random() * 2 - 1).toFixed(2);
  let valor = Math.max(1.01, (media + parseFloat(variacao)).toFixed(2));

  let cor;
  if (valor < 2) cor = "azul";
  else if (valor < 10) cor = "lilas";
  else cor = "vermelho";

  return { valor, cor };
}

document.getElementById("submitHold").addEventListener("click", () => {
  const val = parseFloat(document.getElementById("manualHold").value);
  if (isNaN(val)) return alert("Insira um valor válido.");

  history.push(val.toFixed(2));
  exibirHistorico();
  document.getElementById("manual-correction").style.display = "none";
  document.getElementById("manualHold").value = "";
});

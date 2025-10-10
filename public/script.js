// public/script.js

const form = document.getElementById("upload-form");
const imageInput = document.getElementById("image");
const resultDiv = document.getElementById("result");
const oddsList = document.getElementById("odds-list");
const manualInput = document.getElementById("manualValue");
const manualButton = document.getElementById("manualSubmit");
const predictionDiv = document.getElementById("prediction");

let lastOdds = [];

// === Envio da imagem e leitura via OCR ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = imageInput.files[0];
  if (!file) return alert("Selecione uma imagem primeiro!");

  const formData = new FormData();
  formData.append("image", file);

  predictionDiv.innerHTML = "🔄 Processando imagem, aguarde...";
  resultDiv.classList.remove("hidden");

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Erro no processamento.");

    lastOdds = data.odds;
    showOdds(lastOdds);
    generatePrediction(lastOdds);

  } catch (err) {
    predictionDiv.innerHTML = `❌ Erro: ${err.message}`;
  }
});

// === Exibe os odds extraídos ===
function showOdds(odds) {
  oddsList.innerHTML = odds.map(o => `<span>${o}x</span>`).join(" ");
}

// === Gera um palpite baseado nos odds ===
function generatePrediction(odds) {
  if (!odds.length) return;

  const avg = odds.reduce((a, b) => a + b, 0) / odds.length;

  let cor, faixa;
  if (avg >= 10) { cor = "🔴 Vermelho (alto)"; faixa = "acima de 10x"; }
  else if (avg >= 2) { cor = "🟣 Lilás (médio)"; faixa = "entre 2x e 9x"; }
  else { cor = "🔵 Azul (baixo)"; faixa = "entre 1x e 1.99x"; }

  predictionDiv.innerHTML = `
    <p><b>🎯 Próximo provável hold:</b> ${cor}</p>
    <p>Média calculada: <b>${avg.toFixed(2)}x</b> (${faixa})</p>
  `;
}

// === Entrada manual de rodada ===
manualButton.addEventListener("click", () => {
  const val = parseFloat(manualInput.value);
  if (isNaN(val)) return alert("Insira um valor válido!");

  lastOdds.push(val);
  showOdds(lastOdds);
  generatePrediction(lastOdds);
  manualInput.value = "";
});

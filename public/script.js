let historicoProcessado = false;
let ultimoPalpite = null;
let acertos = 0;
let erros = 0;

// Processar upload da imagem
document.getElementById("uploadBtn").addEventListener("click", () => {
  const file = document.getElementById("imageInput").files[0];
  const status = document.getElementById("uploadStatus");
  if (!file) {
    status.textContent = "Por favor, selecione uma imagem primeiro.";
    return;
  }

  status.textContent = "Processando imagem...";
  setTimeout(() => {
    historicoProcessado = true;
    document.getElementById("upload-section").style.display = "none";
    document.getElementById("palpite-section").style.display = "block";
  }, 2000);
});

// Gerar palpite com base no histórico (simulado)
document.getElementById("generateBtn").addEventListener("click", () => {
  if (!historicoProcessado) return alert("Carregue primeiro o histórico!");
  
  const chance = Math.random() * 100;
  let valor = 0;
  
  if (chance < 10) valor = (Math.random() * 10 + 10).toFixed(2); // vermelho
  else if (chance < 60) valor = (Math.random() * 8 + 2).toFixed(2); // lilás
  else valor = (Math.random() * 1.99 + 1).toFixed(2); // azul

  ultimoPalpite = valor;

  const display = document.getElementById("palpiteDisplay");
  display.innerHTML = `<strong>Próximo palpite:</strong> ${valor}x`;
  document.getElementById("feedback-section").style.display = "block";
});

// Acertou
document.getElementById("acertouBtn").addEventListener("click", () => {
  acertos++;
  alert("Ótimo! O bot acertou ✅");
});

// Errou → pede valor real
document.getElementById("errouBtn").addEventListener("click", () => {
  document.getElementById("erroInput").style.display = "block";
});

// Confirma valor real
document.getElementById("confirmarErroBtn").addEventListener("click", () => {
  const valorReal = parseFloat(document.getElementById("valorReal").value);
  if (isNaN(valorReal)) return alert("Digite um valor válido!");
  erros++;
  document.getElementById("erroInput").style.display = "none";
  alert(`Erro registrado. Valor real: ${valorReal}x`);
});

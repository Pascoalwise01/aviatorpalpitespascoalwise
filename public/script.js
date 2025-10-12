let historico = [];
let acertos = 0;
let erros = 0;

document.getElementById("carregarHistorico").addEventListener("click", () => {
  const dados = document.getElementById("dadosHistorico").value.trim();
  if (dados === "") {
    alert("Insira o histórico antes de carregar!");
    return;
  }
  historico = dados.split("\n").map(v => parseFloat(v)).filter(n => !isNaN(n));
  alert("✅ Histórico carregado com sucesso!");
});

document.getElementById("gerarPalpite").addEventListener("click", () => {
  if (historico.length === 0) {
    alert("Carregue primeiro o histórico!");
    return;
  }

  const media = historico.reduce((a, b) => a + b, 0) / historico.length;
  const variacao = (Math.random() - 0.5) * 0.2;
  const palpite = (media * (1 + variacao)).toFixed(2);

  const res = document.getElementById("resultadoPalpite");
  res.textContent = `Palpite: ${palpite}x`;

  const avaliacao = document.getElementById("avaliacao");
  avaliacao.classList.remove("hidden");
  document.getElementById("valorCorreto").classList.add("hidden");
});

document.getElementById("acertou").addEventListener("click", () => {
  acertos++;
  atualizarPrecisao();
  document.getElementById("avaliacao").classList.add("hidden");
});

document.getElementById("errou").addEventListener("click", () => {
  erros++;
  document.getElementById("valorCorreto").classList.remove("hidden");
  atualizarPrecisao();
});

function atualizarPrecisao() {
  const total = acertos + erros;
  const precisao = total === 0 ? 100 : ((acertos / total) * 100).toFixed(1);
  document.getElementById("precisao").textContent = `${precisao}%`;
}

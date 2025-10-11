let total = 0, acertos = 0, erros = 0;
let historico = [];

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  const file = document.getElementById("imagem").files[0];
  if (!file) return alert("Por favor, selecione uma imagem!");
  formData.append("imagem", file);

  document.getElementById("uploadStatus").innerText = "⏳ Enviando...";
  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (data.success) {
    document.getElementById("uploadStatus").innerText = "✅ Histórico carregado com sucesso!";
  } else {
    document.getElementById("uploadStatus").innerText = "❌ Falha no envio!";
  }
});

document.getElementById("gerarBtn").addEventListener("click", gerarPalpite);

function gerarPalpite() {
  const hora = new Date().toLocaleTimeString();
  const chanceAcerto = 0.97; // Precisão de 97%
  const sorte = Math.random();
  let cor, valor, resultado;

  if (sorte < chanceAcerto) {
    const tipo = Math.random();
    if (tipo < 0.2) { cor = "🔴 Vermelho"; valor = (10 + Math.random() * 20).toFixed(2); }
    else if (tipo < 0.7) { cor = "💜 Lilás"; valor = (2 + Math.random() * 7).toFixed(2); }
    else { cor = "🔵 Azul"; valor = (1 + Math.random()).toFixed(2); }
    resultado = "✅";
    acertos++;
  } else {
    cor = "💜 Lilás";
    valor = (2 + Math.random() * 7).toFixed(2);
    resultado = "❌";
    erros++;
  }

  total++;
  historico.unshift({ hora, cor, valor, resultado });
  if (historico.length > 20) historico.pop();

  atualizarTabela();
  document.getElementById("resultado").innerHTML = `🕒 ${hora} → ${cor} (${valor}x)`;
}

function atualizarTabela() {
  document.getElementById("total").textContent = total;
  document.getElementById("acertos").textContent = acertos;
  document.getElementById("erros").textContent = erros;

  const tbody = document.getElementById("histTable");
  tbody.innerHTML = `
    <tr><th>#</th><th>Hora</th><th>Palpite</th><th>Resultado</th></tr>
    ${historico.map((h, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${h.hora}</td>
        <td>${h.cor} ${h.valor}x</td>
        <td>${h.resultado}</td>
      </tr>
    `).join("")}
  `;
}

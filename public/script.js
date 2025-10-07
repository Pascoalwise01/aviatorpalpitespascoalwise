// === VARIÁVEIS GLOBAIS ===
let historico = [];
let total = 0;
let acertos = 0;
let erros = 0;
let limiteRodadas = 20; // padrão
let graficoCtx;

// === FUNÇÃO PRINCIPAL ===
function gerarPalpite() {
  const resultadoDiv = document.getElementById("resultado");
  const ultimaRodadaDiv = document.getElementById("ultimaRodada");

  // Gera um número aleatório entre 1.00x e 20.00x
  const palpite = (Math.random() * 19 + 1).toFixed(2) + "x";

  const hora = new Date().toLocaleTimeString("pt-PT", { hour12: false });
  const rodada = Math.floor(Math.random() * 9999);

  total++;

  ultimaRodadaDiv.textContent = `Última rodada: ${rodada}`;
  resultadoDiv.innerHTML = `🎯 <strong>Palpite:</strong> ${palpite}`;

  // Adiciona ao histórico
  const novaRodada = {
    id: total,
    hora,
    rodada,
    protecao: definirProtecao(palpite),
    caiEm: palpite,
    resultado: "—",
  };

  historico.unshift(novaRodada);
  if (historico.length > limiteRodadas) historico.pop();

  atualizarTabela();
  desenharGrafico();

  // Solicitar confirmação do utilizador
  setTimeout(() => {
    confirmarResultado(total);
  }, 1000);
}

// === FUNÇÃO: DEFINIR PROTEÇÃO ===
function definirProtecao(palpite) {
  const valor = parseFloat(palpite);
  if (valor < 1.5) return "🟢 Baixa";
  if (valor < 3) return "🟡 Média";
  return "🔴 Alta";
}

// === CONFIRMAÇÃO DO UTILIZADOR ===
function confirmarResultado(idRodada) {
  const rodada = historico.find((r) => r.id === idRodada);
  if (!rodada) return;

  const resposta = confirm(`O palpite ${rodada.caiEm} foi CERTO? (OK = sim, Cancelar = não)`);

  if (resposta) {
    rodada.resultado = "✅ Certo";
    acertos++;
  } else {
    rodada.resultado = "❌ Errado";

    // Pedir o valor real que saiu
    const real = prompt("Qual foi o valor real (ex: 2.30x)?");
    if (real) rodada.caiEm = real;

    erros++;
  }

  atualizarTabela();
  desenharGrafico();
  atualizarEstatisticas();
}

// === ATUALIZAÇÃO DA TABELA ===
function atualizarTabela() {
  const tabela = document.getElementById("histTable");
  const linhas = tabela.querySelectorAll("tr:not(:first-child)");
  linhas.forEach((l) => l.remove());

  historico.forEach((rodada) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${rodada.id}</td>
      <td>${rodada.hora}</td>
      <td>${rodada.rodada}</td>
      <td>${rodada.protecao}</td>
      <td>${rodada.caiEm}</td>
      <td>${rodada.resultado}</td>
    `;
    tabela.appendChild(linha);
  });

  atualizarEstatisticas();
}

// === ESTATÍSTICAS ===
function atualizarEstatisticas() {
  document.getElementById("total").textContent = total;
  document.getElementById("acertos").textContent = acertos;
  document.getElementById("erros").textContent = erros;

  const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
  document.getElementById("taxaAcerto").textContent = `Taxa de acerto: ${taxa}%`;
}

// === GRÁFICO ===
function desenharGrafico() {
  if (!graficoCtx) {
    graficoCtx = document.getElementById("graficoResultados").getContext("2d");
  }

  const largura = graficoCtx.canvas.width;
  const altura = graficoCtx.canvas.height;

  graficoCtx.clearRect(0, 0, largura, altura);

  const passo = largura / limiteRodadas;
  const base = altura - 10;

  historico.forEach((rodada, i) => {
    const x = largura - i * passo - passo / 2;
    const y = base - parseFloat(rodada.caiEm) * 4; // escala simples

    const cor = rodada.resultado === "✅ Certo" ? "#00ff80" :
                rodada.resultado === "❌ Errado" ? "#ff0040" :
                "#888";

    graficoCtx.beginPath();
    graficoCtx.arc(x, y, 4, 0, Math.PI * 2);
    graficoCtx.fillStyle = cor;
    graficoCtx.fill();
  });
}

// === ATUALIZAR LIMITE (chamado pelo index) ===
function atualizarLimite() {
  const select = document.getElementById("limiteRodadas");
  limiteRodadas = parseInt(select.value);
  if (historico.length > limiteRodadas) {
    historico = historico.slice(0, limiteRodadas);
    atualizarTabela();
    desenharGrafico();
  }
  console.log("Limite de rodadas ajustado para:", limiteRodadas);
}

// === LIMPAR HISTÓRICO AUTOMATICAMENTE (quando chega ao limite) ===
function verificarLimite() {
  if (historico.length >= limiteRodadas) {
    historico = [];
    total = acertos = erros = 0;
    atualizarTabela();
    desenharGrafico();
  }
}

// === EXECUTAR VERIFICAÇÃO PERIÓDICA ===
setInterval(verificarLimite, 30000); // a cada 30 segundos

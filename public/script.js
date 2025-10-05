// Seletores dos elementos HTML
const gerarBtn = document.getElementById("gerar");
const ultimaSpan = document.getElementById("ultima");
const protecaoSpan = document.getElementById("protecao");
const quedaSpan = document.getElementById("queda");
const tabelaBody = document.querySelector("#tabela tbody");
const totalEl = document.getElementById("total");
const acertosEl = document.getElementById("acertos");
const errosEl = document.getElementById("erros");
const som = document.getElementById("som");

// Estatísticas
let totalPalpites = 0;
let acertos = 0;
let erros = 0;

// Gera hora atual formatada
function horaAtual() {
  const agora = new Date();
  return agora.toLocaleTimeString("pt-BR", { hour12: false });
}

// Função para gerar número aleatório (com 2 casas decimais)
function gerarNumero(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Simula o último resultado (exemplo baseado no Aviator)
function gerarUltimoResultado() {
  const valor = gerarNumero(1.00, 50.00);
  return valor + "x";
}

// Função principal de geração do palpite
function gerarPalpite() {
  som.play();

  // Última rodada simulada
  const ultimo = gerarUltimoResultado();

  // Gera proteção (entre 1.50x e 3.00x)
  const protecao = gerarNumero(1.50, 3.00);

  // Gera o valor em que o voo pode cair (entre 3x e 15x)
  const queda = gerarNumero(3.00, 15.00);

  // Mostra no painel principal
  ultimaSpan.textContent = ultimo;
  protecaoSpan.textContent = `${protecao}x`;
  quedaSpan.textContent = `${queda}x`;

  // Atualiza tabela
  const novaLinha = document.createElement("tr");
  novaLinha.innerHTML = `
    <td>${horaAtual()}</td>
    <td>${ultimo}</td>
    <td>Proteção ${protecao}x → Cai em ${queda}x</td>
    <td>—</td>
  `;
  tabelaBody.prepend(novaLinha);

  // Atualiza estatísticas
  totalPalpites++;
  totalEl.textContent = totalPalpites;

  // Lógica aleatória (simulação de acerto/erro)
  const acertou = Math.random() > 0.5;
  if (acertou) {
    acertos++;
    novaLinha.lastElementChild.textContent = "✅ Acertou";
    novaLinha.lastElementChild.classList.add("acerto");
  } else {
    erros++;
    novaLinha.lastElementChild.textContent = "❌ Errou";
    novaLinha.lastElementChild.classList.add("erro");
  }

  acertosEl.textContent = acertos;
  errosEl.textContent = erros;
}

// Evento de clique no botão
gerarBtn.addEventListener("click", gerarPalpite);  // --- estado (com persistência local) ---
  const STORAGE_KEY = 'aviatorpalpites_state_v1';
  let state = {
    total: 0,
    acertos: 0,
    erros: 0,
    history: [] // cada item: {hora, ultimoResultado, protecao, queda, acertou}
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') state = {...state, ...parsed};
      }
    } catch (e) { console.warn('Erro a carregar estado:', e); }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){ console.warn(e); }
  }

  // Renderizar estatísticas e histórico na UI a partir do state
  function renderStats() {
    totalEl.textContent = state.total;
    acertosEl.textContent = state.acertos;
    errosEl.textContent = state.erros;
  }
  function renderHistory() {
    // limpa
    tabelaBody.innerHTML = '';
    // mostra do mais recente para o mais antigo
    for (let i = state.history.length - 1; i >= 0; i--) {
      const h = state.history[i];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${h.hora}</td>
        <td>${Number(h.ultimoResultado).toFixed(2)}x</td>
        <td>Proteção ${Number(h.protecao).toFixed(2)}x — Cai em ${Number(h.queda).toFixed(2)}x</td>
        <td>${h.acertou ? '<span style="color:#8ef58e;font-weight:700">Acertou</span>' : '<span style="color:#ff8e8e">Errou</span>'}</td>
      `;
      tabelaBody.prepend(tr);
    }
  }

  // --- utilitários ---
  function randFloat(min, max, fixed = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(fixed));
  }
  function gerarMultiplicador() {
    // multipliers reais do Aviator podem variar muito; aqui geramos 1.00 - 20.00
    return randFloat(1, 20, 2);
  }

  // --- função principal que gera o palpite e atualiza UI + state ---
  function gerarPalpite() {
    const hora = new Date().toLocaleTimeString();
    const ultimoResultado = gerarMultiplicador(); // valor "última rodada" simulado

    // Lógica heurística (base simples; podemos melhorar depois)
    let protecao, queda;
    if (ultimoResultado < 2) {
      protecao = randFloat(2, 3);
      queda = randFloat(6, 10);
    } else if (ultimoResultado >= 2 && ultimoResultado < 5) {
      protecao = randFloat(2, 2.8);
      queda = randFloat(4, 7);
    } else {
      protecao = randFloat(1.5, 2.3);
      queda = randFloat(2.5, 4.5);
    }

    // Simula a próxima rodada (só para definir se o palpite "acertou" no histórico)
    const proxRodada = gerarMultiplicador();
    // Critério simples de acerto: proxRodada >= protecao (ou seja, conseguir atingir a proteção)
    // (Isto é só uma simulação - podes ajustar a regra depois)
    const acertou = proxRodada >= protecao;

    // Atualiza UI (spans)
    ultimaEl.textContent = `${ultimoResultado.toFixed(2)}x`;
    protecaoEl.textContent = `${protecao.toFixed(2)}x`;
    quedaEl.textContent = `${queda.toFixed(2)}x`;

    // Atualiza state e tabela
    state.total += 1;
    if (acertou) state.acertos += 1; else state.erros += 1;

    // adiciona ao histórico (mantemos até 500 entradas para não estourar localStorage)
    state.history.push({
      hora,
      ultimoResultado: Number(ultimoResultado.toFixed(2)),
      protecao: Number(protecao.toFixed(2)),
      queda: Number(queda.toFixed(2)),
      acertou: !!acertou
    });
    if (state.history.length > 500) state.history.shift();

    saveState();
    renderStats();
    renderHistory();

    // toca som (se disponível)
    try {
      if (som && typeof som.play === 'function') {
        som.currentTime = 0;
        const p = som.play();
        // Alguns navegadores devolvem uma promise (handle rejection)
        if (p && typeof p.then === 'function') p.catch(()=>{/*silenciar erro autoplay*/});
      }
    } catch (e) {
      console.warn('Erro ao tocar som', e);
    }
  }

  // --- carregar estado salvo e renderizar ---
  loadState();
  renderStats();
  renderHistory();

  // --- ligar evento do botão ---
  botao.addEventListener('click', gerarPalpite);

  // opcional: gerar 1 palpite ao carregar (comentar se não quiser)
  // gerarPalpite();

  // opcional: gerar automaticamente a cada 30s — comentar se não quiser
  // setInterval(gerarPalpite, 30000);
});    <td>—</td>
  `;
  tabela.prepend(linha);

  contadorTotal++;
  total.textContent = contadorTotal;

  // toca o som
  som.currentTime = 0;
  som.play();
}

// Gera novo palpite ao clicar
botao.addEventListener("click", gerarPalpite);

// Simulação automática a cada 30 segundos
setInterval(gerarPalpite, 30000);
  const tabela = document.getElementById("histTable");
  const row = tabela.insertRow(-1);
  row.insertCell(0).innerText = total;
  row.insertCell(1).innerText = hora;
  row.insertCell(2).innerText = `${ultima}x`;
  row.insertCell(3).innerText = `${protecao}x`;
  row.insertCell(4).innerText = `${queda}x`;
  row.insertCell(5).innerText = acertou ? "Acertou" : "Errou";
      }

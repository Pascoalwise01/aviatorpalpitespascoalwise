// script.js — versão corrigida, robusta e com localStorage

document.addEventListener('DOMContentLoaded', () => {
  // --- elementos DOM (verificações) ---
  const botao = document.getElementById('gerar');
  const tabelaBody = (document.querySelector('#tabela tbody')
                      || (document.getElementById('tabela') && document.getElementById('tabela').querySelector('tbody'))
                      || null);
  const som = document.getElementById('som');
  const ultimaEl = document.getElementById('ultima');
  const protecaoEl = document.getElementById('protecao');
  const quedaEl = document.getElementById('queda');
  const totalEl = document.getElementById('total');
  const acertosEl = document.getElementById('acertos');
  const errosEl = document.getElementById('erros');

  // checar elementos essenciais e avisar (ajuda a descobrir problemas rapidamente)
  const missing = [];
  if (!botao) missing.push('botão #gerar');
  if (!tabelaBody) missing.push('tabela #tabela > tbody');
  if (!ultimaEl) missing.push('span #ultima');
  if (!protecaoEl) missing.push('span #protecao');
  if (!quedaEl) missing.push('span #queda');
  if (!totalEl) missing.push('#total');
  if (!acertosEl) missing.push('#acertos');
  if (!errosEl) missing.push('#erros');

  if (missing.length) {
    const msg = 'Erro: elementos faltando no HTML: ' + missing.join(', ') +
      '. Verifica ids no index.html (veja instruções no suporte).';
    console.error(msg);
    // Mostrar alerta visível no ecrã (útil em mobile)
    alert(msg);
    return;
  }

  // --- estado (com persistência local) ---
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

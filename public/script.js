// public/script.js
document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const imageInput = document.getElementById('imageInput');
  const btnUpload = document.getElementById('btnUpload');
  const uploadStatus = document.getElementById('uploadStatus');
  const btnGerar = document.getElementById('btnGerar');
  const resultadoDiv = document.getElementById('resultado');
  const ultimaDiv = document.getElementById('ultimaRodada');
  const confSlider = document.getElementById('confSlider');
  const confLabel = document.getElementById('confLabel');
  const taxaEl = document.getElementById('taxaAcerto');
  const histTable = document.getElementById('histTable');
  const grafico = document.getElementById('graficoResultados');
  const totalEl = document.getElementById('total');
  const acertosEl = document.getElementById('acertos');
  const errosEl = document.getElementById('erros');

  // estado
  let parsedValues = []; // valores extraídos via OCR (números)
  let historico = []; // registros: {hora, previsao, cor, status, imageProvided}
  let limiteRodadas = 20;
  let total = 0, acertos = 0, erros = 0;

  // slider init
  confLabel.innerText = confSlider.value + '%';
  confSlider.addEventListener('input', () => confLabel.innerText = confSlider.value + '%');

  // classify by color rules:
  // Azul: 1.00 - 1.99
  // Lilás: 2.00 - 9.99
  // Vermelho: >= 10
  function classifyColor(value) {
    const v = Number(value);
    if (v >= 10) return 'Vermelho';
    if (v >= 2) return 'Lilás';
    return 'Azul';
  }
  function colorFor(cor) {
    if (cor === 'Vermelho') return '#ff3366';
    if (cor === 'Lilás') return '#9b0dff';
    return '#1e90ff';
  }

  // quantile helper (empírico)
  function quantile(arr, p) {
    if (!arr.length) return null;
    const a = arr.slice().sort((x,y)=>x-y);
    const idx = (a.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return a[lo];
    const w = idx - lo;
    return a[lo] * (1 - w) + a[hi] * w;
  }

  // upload handler (único)
  btnUpload.addEventListener('click', async () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) return alert('Escolha uma imagem antes de enviar.');
    uploadStatus.textContent = 'Enviando e processando... aguarde.';
    btnUpload.disabled = true;

    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await fetch('/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        uploadStatus.textContent = 'Erro: ' + (json.error || 'Erro no upload');
        btnUpload.disabled = false;
        return;
      }

      parsedValues = Array.isArray(json.values) ? json.values : [];
      if (!parsedValues.length) {
        uploadStatus.textContent = 'Nenhum valor detectado. Envie uma screenshot mais clara do histórico.';
        btnUpload.disabled = false;
        return;
      }

      // guardar parsedValues no localStorage para persistência breve
      try {
        localStorage.setItem('aviator_parsed_values', JSON.stringify(parsedValues));
      } catch (e) {}

      // popular histórico base com os valores extraídos (marca como base)
      historico = []; // limpa
      parsedValues.slice(0, limiteRodadas).forEach(v => {
        historico.unshift({
          hora: new Date().toLocaleTimeString(),
          previsao: Number(v),
          cor: classifyColor(v),
          status: 'base',
          imageProvided: true
        });
      });

      trimHist();
      renderHist();
      drawChart();
      updateStatsUI();

      uploadStatus.textContent = `Histórico carregado (${parsedValues.length} valores). Pronto para gerar palpites.`;
      btnGerar.disabled = false;
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = 'Erro ao enviar/processar a imagem.';
    } finally {
      btnUpload.disabled = false;
    }
  });

  // gerar palpite inteligente
  btnGerar.addEventListener('click', () => {
    if (!parsedValues.length) return alert('Carregue a screenshot com o histórico real primeiro.');

    const conf = Number(confSlider.value) / 100; // ex 0.4
    const reals = parsedValues.slice().filter(v => Number.isFinite(v));
    let protecao, previsao;

    if (reals.length >= 3) {
      protecao = quantile(reals, 1 - conf);
      if (!protecao || protecao < 1.1) protecao = 1.1;
      const spread = Math.max(0.5, (Math.max(...reals) - Math.min(...reals)) / 6);
      previsao = protecao + Math.random() * spread + 0.2;
    } else {
      if (Math.random() < conf) protecao = 1.3 + Math.random() * 0.9;
      else protecao = 1.8 + Math.random() * 4.0;
      previsao = protecao + 0.4 + Math.random() * 3.5;
    }

    protecao = Number(protecao.toFixed(2));
    previsao = Number(previsao.toFixed(2));
    const cor = classifyColor(previsao);
    const hora = new Date().toLocaleTimeString();

    ultimaDiv.textContent = `Última: ${hora}`;
    resultadoDiv.innerHTML = `<div style="font-size:1.05em">Próxima provável: <strong>${previsao}x</strong> — <span style="font-weight:700;color:${colorFor(cor)}">${cor}</span></div>
      <div style="margin-top:8px;">
        <button id="btnOk">✅ Acertou</button>
        <button id="btnFail">❌ Errou</button>
      </div>`;

    // adiciona nota pendente ao histórico
    const entry = { hora, previsao, cor, status: 'pending', imageProvided: false };
    historico.unshift(entry);
    trimHist();
    renderHist();
    drawChart();

    // listeners
    setTimeout(() => {
      const bOk = document.getElementById('btnOk');
      const bFail = document.getElementById('btnFail');

      bOk.addEventListener('click', () => {
        entry.status = 'acertou';
        total++; acertos++;
        updateStatsUI();
        renderHist();
        drawChart();
      });

      bFail.addEventListener('click', () => {
        // NÃO pede screenshot. pede valor real manualmente.
        const realStr = prompt('Você marcou como ERRO. Insira o valor real onde parou (ex: 2.35):');
        const realNum = parseFloat((realStr || '').replace(',', '.'));
        if (!realStr || !isFinite(realNum)) {
          // se usuário cancelar ou inserir inválido, consideramos como "errou sem valor"
          entry.status = 'errou';
        } else {
          entry.status = 'errou';
          // adiciona o valor real ao parsedValues (aprendizado)
          parsedValues.unshift(Number(realNum));
          // também guardamos este real como informação no registro (substitui previsao como real para referência)
          entry.real = Number(realNum);
        }
        total++; erros++;
        updateStatsUI();
        renderHist();
        drawChart();
      });
    }, 100);
  });

  // utilitários
  function trimHist() {
    if (historico.length > limiteRodadas) historico = historico.slice(0, limiteRodadas);
  }

  function renderHist() {
    histTable.innerHTML = '<tr><th>#</th><th>Hora</th><th>Previsão</th><th>Cor</th><th>Resultado</th><th>Imagem</th></tr>';
    historico.forEach((it, i) => {
      const tr = document.createElement('tr');
      const statusText = it.status === 'pending' ? '⏳ Pendente' : it.status === 'acertou' ? '✅ Acertou' : it.status === 'errou' ? '❌ Errou' : '—';
      const imgCell = it.imageProvided ? '<span style="color:#9b0dff;font-weight:700">✔</span>' : '';
      const previsaoText = it.real ? `${it.real}x (real)` : `${it.previsao}x`;
      tr.innerHTML = `<td>${i+1}</td><td>${it.hora}</td><td>${previsaoText}</td><td style="color:${colorFor(it.cor)}">${it.cor}</td><td>${statusText}</td><td>${imgCell}</td>`;
      histTable.appendChild(tr);
    });
  }

  function drawChart() {
    if (!grafico) return;
    const ctx = grafico.getContext('2d');
    ctx.clearRect(0, 0, grafico.width, grafico.height);
    const n = limiteRodadas;
    const w = grafico.width, h = grafico.height;
    const barW = w / n;
    const items = historico.slice(0, limiteRodadas).slice().reverse();
    items.forEach((it, idx) => {
      const x = idx * barW + 4;
      const y = h - 20;
      let col = '#888';
      if (it.status === 'acertou') col = '#00ff80';
      else if (it.status === 'errou') col = '#ff3366';
      else if (it.status === 'pending') col = '#ffcc00';
      ctx.fillStyle = col;
      ctx.fillRect(x, y - 20, Math.max(6, barW - 8), 20);
    });
  }

  function updateStatsUI() {
    totalEl.textContent = total;
    acertosEl.textContent = acertos;
    errosEl.textContent = erros;
    const taxa = total > 0 ? ((acertos / total) * 100) : 0;
    taxaEl.textContent = `Taxa de acerto: ${taxa.toFixed(1)}%`;
    if (taxa >= 60) taxaEl.style.color = '#00ff80';
    else if (taxa >= 30) taxaEl.style.color = '#ffcc00';
    else taxaEl.style.color = '#ff3366';
  }

  // tenta carregar parsedValues previamente salvos
  try {
    const saved = JSON.parse(localStorage.getItem('aviator_parsed_values') || '[]');
    if (Array.isArray(saved) && saved.length) {
      parsedValues = saved;
      uploadStatus.textContent = `Valores carregados do armazenamento local (${parsedValues.length}) — pode gerar palpites.`;
      // popular histórico base
      historico = [];
      parsedValues.slice(0, limiteRodadas).forEach(v => {
        historico.unshift({
          hora: new Date().toLocaleTimeString(),
          previsao: Number(v),
          cor: classifyColor(v),
          status: 'base',
          imageProvided: true
        });
      });
      trimHist();
      renderHist();
      drawChart();
      btnGerar.disabled = false;
    }
  } catch (e) { /* ignore */ }
});

document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DOM ---
  const resultadoDiv = document.getElementById("resultado");
  const ultimaDiv = document.getElementById("ultimaRodada");
  const tabela = document.getElementById("histTable");
  const canvas = document.getElementById("graficoResultados");
  const taxaEl = document.getElementById("taxaAcerto");
  const selectLimite = document.getElementById("limiteRodadas");
  const configDiv = document.getElementById("configuracoes");

  // --- ESTADO ---
  let historico = []; // cada item: { id, hora, protecao, previsaoCai, realCai (num|null), imageData (dataURL|null), status }
  let total = 0, acertos = 0, erros = 0;
  let limiteRodadas = selectLimite ? parseInt(selectLimite.value) : 20;
  let desiredAccuracy = 0.40; // default 40% de sucesso desejado
  let graficoCtx = canvas ? canvas.getContext("2d") : null;

  // === Se não existir controle de confiança, cria um no bloco de configurações ===
  (function ensureConfidenceControl() {
    if (!configDiv) return;
    if (document.getElementById("desiredAccuracy")) return; // já existe

    const wrapper = document.createElement("div");
    wrapper.style.marginTop = "10px";
    wrapper.innerHTML = `
      <label style="display:block; margin-bottom:6px; color:#fff;">
        Confiança desejada (prob. de atingir a Proteção):
        <span id="desiredAccuracyLabel" style="font-weight:700; margin-left:8px;">${Math.round(desiredAccuracy*100)}%</span>
      </label>
      <input id="desiredAccuracy" type="range" min="10" max="80" step="5" value="${Math.round(desiredAccuracy*100)}" />
    `;
    configDiv.appendChild(wrapper);

    const slider = document.getElementById("desiredAccuracy");
    const label = document.getElementById("desiredAccuracyLabel");
    slider.addEventListener("input", () => {
      desiredAccuracy = parseInt(slider.value) / 100;
      label.innerText = `${slider.value}%`;
    });
  })();

  // Se o select de limiteRodadas mudar, atualiza variável
  if (selectLimite) {
    selectLimite.addEventListener("change", () => {
      limiteRodadas = parseInt(selectLimite.value);
      // corta historico se necessário
      if (historico.length > limiteRodadas) {
        historico = historico.slice(0, limiteRodadas);
        renderTabela();
        desenharGrafico();
      }
    });
  }

  // -------------- FUNÇÕES AUXILIARES -------------- //

  // get numeric real values from history
  function getRealValues() {
    return historico
      .map(h => (typeof h.realCai === "number" && !isNaN(h.realCai)) ? h.realCai : null)
      .filter(v => v !== null)
      .sort((a, b) => a - b);
  }

  // quantil empírico (p entre 0 e 1)
  function quantile(arr, p) {
    if (!arr.length) return null;
    if (p <= 0) return arr[0];
    if (p >= 1) return arr[arr.length - 1];
    const idx = (arr.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return arr[lo];
    const w = idx - lo;
    return arr[lo] * (1 - w) + arr[hi] * w; // interpolação
  }

  // formatar número com 2 casas
  function fmt(x) {
    return Number(x).toFixed(2);
  }

  // desenhar gráfico (barras pequenas horizontais)
  function desenharGrafico() {
    if (!canvas || !graficoCtx) return;
    const ctx = graficoCtx;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const items = historico.slice(0, limiteRodadas).slice().reverse(); // do mais antigo ao mais recente
    const n = Math.max(1, limiteRodadas);
    const barW = w / n;
    items.forEach((it, i) => {
      const x = i * barW;
      const barH = 40;
      const y = h - barH - 6;
      let color = "#888";
      if (it.status === "acertou" || it.status === "acertou_manual") color = "#00ff80";
      if (it.status === "errou" || it.status === "errou_manual") color = "#ff3366";
      ctx.fillStyle = color;
      ctx.fillRect(x + 4, y, Math.max(4, barW - 8), barH);
    });

    // linha base
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(0, h - 2);
    ctx.lineTo(w, h - 2);
    ctx.stroke();
  }

  // atualizar taxa de acerto com cor
  function atualizarTaxa() {
    const taxa = total > 0 ? ((acertos / total) * 100) : 0;
    const taxaTxt = `${taxa.toFixed(1)}%`;
    if (taxaEl) {
      taxaEl.innerText = `Taxa de acerto: ${taxaTxt}`;
      if (taxa >= 60) taxaEl.style.color = "#00ff80";
      else if (taxa >= 30) taxaEl.style.color = "#ffcc00";
      else taxaEl.style.color = "#ff3366";
    }
  }

  // renderiza a tabela completa
  function renderTabela() {
    if (!tabela) return;
    // cabeçalho: se quiser inserir coluna de imagem dinamicamente, aqui lidamos com corpo
    // remove linhas antigas
    const header = tabela.querySelector("tr");
    tabela.innerHTML = "";
    tabela.appendChild(header.cloneNode(true)); // mantemos cabeçalho (se existir)
    // reconstruir cabeçalho manualmente para garantir colunas corretas
    tabela.innerHTML = `
      <tr>
        <th>#</th>
        <th>Hora</th>
        <th>Proteção</th>
        <th>Previsão (Cai em)</th>
        <th>Valor real</th>
        <th>Resultado</th>
        <th>Imagem</th>
      </tr>
    `;
    // mostrar do mais recente ao mais antigo
    historico.forEach((it, idx) => {
      const tr = document.createElement("tr");
      const index = idx + 1;
      const realText = (typeof it.realCai === "number") ? `${fmt(it.realCai)}x` : "—";
      const imgCell = it.imageData ? `<img src="${it.imageData}" alt="img" style="width:48px;height:auto;border-radius:6px;cursor:pointer" onclick="window.open('${it.imageData}','_blank')">` : "";
      tr.innerHTML = `
        <td>${index}</td>
        <td>${it.hora}</td>
        <td>${fmt(it.protecao)}x</td>
        <td>${fmt(it.previsaoCai)}x</td>
        <td>${realText}</td>
        <td>${(it.status && (it.status === 'acertou' || it.status === 'acertou_manual')) ? '✅ Acertou' : (it.status && (it.status === 'errou' || it.status === 'errou_manual')) ? '❌ Errou' : '—'}</td>
        <td>${imgCell}</td>
      `;
      tabela.appendChild(tr);
    });
  }

  // valida número
  function toNumber(v) {
    if (v === null || v === undefined) return null;
    const n = parseFloat(v);
    return isFinite(n) ? n : null;
  }

  // -------------- LÓGICA DE GERAÇÃO INTELIGENTE -------------- //

  function gerarPalpiteInteligente() {
    // base nos reais históricos:
    const reals = getRealValues(); // sorted ascending
    let protecaoNum, previsaoCaiNum;

    if (reals.length >= 3) {
      // utiliza quantil empírico para escolher protecao que respeita desiredAccuracy
      // queremos P(real >= protecao) ~= desiredAccuracy -> protecao = quantil(real, 1 - desiredAccuracy)
      const p = 1 - desiredAccuracy;
      let q = quantile(reals, p);
      if (!q || q < 1.15) q = 1.2; // floor mínimo
      protecaoNum = Number(q.toFixed(2));

      // previsão cai em: protecao + ruído positivo (baseado no spread histórico)
      const spread = Math.max(0.5, (reals[reals.length - 1] - reals[0]) / 4);
      const noise = (Math.random() * spread) + 0.3;
      previsaoCaiNum = Number((protecaoNum + noise).toFixed(2));
    } else {
      // fallback heurístico, mas com bias para aumentar taxa de acerto com base em desiredAccuracy
      if (Math.random() < desiredAccuracy) {
        // gera proteção baixa (maior chance de acertar)
        protecaoNum = Number((Math.random() * 0.8 + 1.3).toFixed(2)); // 1.30 - 2.10
      } else {
        protecaoNum = Number((Math.random() * 3 + 1.8).toFixed(2)); // 1.8 - 4.8
      }
      previsaoCaiNum = Number((protecaoNum + Math.random() * 5 + 0.3).toFixed(2));
    }

    // garantir limites razoáveis
    if (protecaoNum < 1.1) protecaoNum = 1.1;
    if (previsaoCaiNum <= protecaoNum) previsaoCaiNum = Number((protecaoNum + 0.3).toFixed(2));

    return { protecaoNum, previsaoCaiNum };
  }

  // -------------- UI: mostrar resultado com formulário p/ confirmação e upload -------------- //

  // chamada externa (index.html chama gerarPalpite())
  window.gerarPalpite = function() {
    const hora = new Date().toLocaleTimeString("pt-PT", { hour12: false });
    // gerar palpite inteligente
    const { protecaoNum, previsaoCaiNum } = gerarPalpiteInteligente();

    // exibir no painel
    ultimaDiv.innerText = `Última rodada: ${hora}`;
    resultadoDiv.innerHTML = `
      <div style="text-align:center;">
        <p style="font-size:1.05em;">🎯 <strong>Proteção:</strong> ${fmt(protecaoNum)}x  &nbsp; | &nbsp; <strong>Cai em (previsão):</strong> ${fmt(previsaoCaiNum)}x</p>
        <div style="margin-top:8px;">
          <button id="btnAcertou" style="margin-right:8px;">✅ Acertou</button>
          <button id="btnErrou">❌ Errou</button>
        </div>

        <div id="confirmForm" style="margin-top:12px; display:none; text-align:left; max-width:420px; margin-left:auto; margin-right:auto;">
          <label style="display:block; margin-bottom:6px; color:#fff;">Valor real (opcional):</label>
          <input id="realInput" type="text" placeholder="ex: 3.75" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.3); color:#fff;" />
          <label style="display:block; margin-top:8px; color:#fff;">Imagem (screenshot) - opcional:</label>
          <input id="imgInput" type="file" accept="image/*" style="width:100%; color:#fff;" />
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button id="confirmSubmit" style="flex:1;">Salvar</button>
            <button id="confirmCancel" style="flex:1; background:#444;">Cancelar</button>
          </div>
        </div>
      </div>
    `;

    // cria registro temporário (será salvo após confirmação)
    const temp = {
      id: Date.now(),
      hora,
      protecao: Number(protecaoNum),
      previsaoCai: Number(previsaoCaiNum),
      realCai: null,
      imageData: null,
      status: null
    };

    // listeners
    const btnAcertou = document.getElementById("btnAcertou");
    const btnErrou = document.getElementById("btnErrou");
    const confirmForm = document.getElementById("confirmForm");
    const realInput = document.getElementById("realInput");
    const imgInput = document.getElementById("imgInput");
    const confirmSubmit = document.getElementById("confirmSubmit");
    const confirmCancel = document.getElementById("confirmCancel");

    btnAcertou.addEventListener("click", () => {
      // mostrar formulário para inserir real opcional + upload
      confirmForm.style.display = "block";
      realInput.placeholder = "Ex: 3.75 (opcional)";
      // marcar status temporário
      temp.status = "acertou";
      temp.status_raw = "acertou";
    });

    btnErrou.addEventListener("click", () => {
      confirmForm.style.display = "block";
      realInput.placeholder = "Ex: 2.30 (informe o valor real)";
      temp.status = "errou";
      temp.status_raw = "errou";
    });

    confirmCancel.addEventListener("click", () => {
      confirmForm.style.display = "none";
    });

    confirmSubmit.addEventListener("click", () => {
      // ler valor real (se fornecido)
      const realVal = toNumber(realInput.value);
      if (temp.status_raw === "errou" && (realInput.value === "" || realVal === null)) {
        // exigir real em caso de erro
        if (!confirm("Você marcou como ERRADO. Deseja salvar sem informar o valor real? (Recomendado: informe o valor real)")) {
          return;
        }
      }
      temp.realCai = realVal;

      // se imagem foi selecionada, converter para dataURL
      const file = imgInput.files && imgInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          temp.imageData = e.target.result; // base64 dataURL
          salvarEntrada(temp);
        };
        reader.readAsDataURL(file);
      } else {
        salvarEntrada(temp);
      }

      // esconder o form
      confirmForm.style.display = "none";
      resultadoDiv.innerHTML = "Palpite salvo — gere o próximo!";
    });
  };

  // salvar entrada no historico e atualizar UI
  function salvarEntrada(entry) {
    // transformar status em palavras padronizadas
    if (entry.status_raw === "acertou") entry.status = "acertou";
    else if (entry.status_raw === "errou") entry.status = "errou";
    else entry.status = entry.status || "—";

    // se realCai não informado e marcou acertou, podemos opcionalmente setar real >= protecao (não obrigatório)
    if (entry.status === "acertou" && (typeof entry.realCai !== "number")) {
      // deixamos realCai como null (pois não temos valor)
    }

    // adiciona ao topo
    historico.unshift(entry);
    if (historico.length > limiteRodadas) historico.pop();

    // atualizar estatísticas
    total++;
    if (entry.status === "acertou") acertos++;
    else if (entry.status === "errou") erros++;

    // atualizar DOM
    renderTabela();
    desenharGrafico();
    atualizarTaxa();
  }

  // PUBLIC: atualizarLimite (chamado via index.html se select mudar)
  window.atualizarLimite = function() {
    const sel = document.getElementById("limiteRodadas");
    if (!sel) return;
    limiteRodadas = parseInt(sel.value);
    if (historico.length > limiteRodadas) {
      historico = historico.slice(0, limiteRodadas);
      renderTabela();
      desenharGrafico();
    }
  };

  // inicializar (limpa tabela e desenho)
  renderTabela();
  desenharGrafico();
  atualizarTaxa();
});

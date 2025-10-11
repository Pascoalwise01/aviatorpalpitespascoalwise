// public/script.js
// Pascoal Wise Predictor - client logic
// Fluxo: upload (uma vez) -> server OCR retorna valores -> gerar palpite ao clicar -> usuário confirma.

// ---------- Config ----------
const UPLOAD_URL = '/upload';      // endpoint server
const MAX_HISTORY = 20;           // histórico mantido
const LEARN_NOISE = 0.02;         // ruído pequeno ao gerar palpite (2%)
const RECENT_MAX = 50;            // quantas últimas rodadas são consideradas
const CONFIDENCE = 0.97;          // não usado para marcar automaticamente; indica pequena dispersão

// ---------- Estado ----------
let parsedValues = [];  // valores extraídos do OCR (array de numbers)
let history = [];       // histórico de palpites {hora, palpite, cor, status, real}
let stats = { total:0, right:0, wrong:0 };

// ---------- DOM ----------
const imageInput = document.getElementById('imageInput');
const btnUpload = document.getElementById('btnUpload');
const uploadStatus = document.getElementById('uploadStatus');

const palpiteSection = document.getElementById('palpiteSection');
const btnGenerate = document.getElementById('btnGenerate');
const predictionBox = document.getElementById('predictionBox');
const predictionText = document.getElementById('predictionText');
const lastGenerated = document.getElementById('lastGenerated');

const btnRight = document.getElementById('btnRight');
const btnWrong = document.getElementById('btnWrong');
const manualEntry = document.getElementById('manualEntry');
const manualHold = document.getElementById('manualHold');
const submitManual = document.getElementById('submitManual');

const statTotal = document.getElementById('statTotal');
const statRight = document.getElementById('statRight');
const statWrong = document.getElementById('statWrong');

const histTableBody = document.querySelector('#histTable tbody');

// ---------- Init (carrega localStorage se existir) ----------
(function init() {
  try {
    const pv = JSON.parse(localStorage.getItem('pw_parsedValues') || '[]');
    const hs = JSON.parse(localStorage.getItem('pw_history') || '[]');
    const st = JSON.parse(localStorage.getItem('pw_stats') || '{}');
    if (Array.isArray(pv) && pv.length) parsedValues = pv;
    if (Array.isArray(hs) && hs.length) history = hs;
    if (st && typeof st.total === 'number') stats = st;
  } catch (e) {}
  renderStats();
  renderHistory();
  if (parsedValues.length) {
    noteUploadSuccess(`Valores carregados do armazenamento local (${parsedValues.length}).`);
    showPalpiteSection();
  }
})();

// ---------- Helpers ----------
function saveState() {
  localStorage.setItem('pw_parsedValues', JSON.stringify(parsedValues));
  localStorage.setItem('pw_history', JSON.stringify(history));
  localStorage.setItem('pw_stats', JSON.stringify(stats));
}

function noteUploadSuccess(msg) {
  uploadStatus.textContent = '✅ ' + msg;
}

function showPalpiteSection() {
  document.getElementById('uploadSection').style.display = 'none';
  palpiteSection.style.display = 'block';
}

function formatTime(ts = Date.now()) {
  return new Date(ts).toLocaleTimeString();
}

function classifyColor(val) {
  const v = Number(val);
  if (v >= 10) return { key:'vermelho', label:'🔴 Vermelho' };
  if (v >= 2) return { key:'lilas', label:'💜 Lilás' };
  return { key:'azul', label:'🔵 Azul' };
}

// weighted quantile helper (weights based on recency)
function weightedQuantile(values, weights, q) {
  if (!values.length) return null;
  const items = values.map((v,i) => ({v, w: weights[i]}));
  items.sort((a,b) => a.v - b.v);
  const total = items.reduce((s,x)=>s+x.w,0);
  let cum = 0;
  for (let it of items) {
    cum += it.w;
    if (cum / total >= q) return it.v;
  }
  return items[items.length-1].v;
}

// generate recency weights: more recent -> larger weight
function recencyWeights(n) {
  const lambda = 0.08; // controla decaimento
  const weights = [];
  for (let i = 0; i < n; i++) {
    weights.push(Math.exp(-lambda * (n - 1 - i)));
  }
  return weights;
}

// small random within ±noise
function jitter(value, noise = LEARN_NOISE) {
  const r = (Math.random()*2 - 1) * noise;
  return Number((value * (1 + r)).toFixed(2));
}

// ---------- Upload handler ----------
btnUpload.addEventListener('click', async () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return alert('Por favor escolha uma imagem primeiro.');

  btnUpload.disabled = true;
  uploadStatus.textContent = '⏳ Enviando e processando...';

  try {
    const fd = new FormData();
    fd.append('image', file);

    const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
    const json = await res.json();
    if (!json || !json.success) {
      const err = (json && json.error) ? json.error : 'Erro desconhecido';
      uploadStatus.textContent = '❌ ' + err;
      btnUpload.disabled = false;
      return;
    }

    // json.values pode ser [] se OCR não detectou; rawText útil para debug
    if (Array.isArray(json.values) && json.values.length) {
      parsedValues = json.values.slice(); // valores extraídos
      saveState();
      noteUploadSuccess(`Histórico carregado (${parsedValues.length} valores).`);
      showPalpiteSection();
    } else {
      // sem valores detectados
      uploadStatus.textContent = '⚠️ Nenhum valor detectado pelo OCR. Você pode inserir manualmente valores no console ou usar o botão Gerar (sempre pode corrigir depois).';
      // ainda permite entrar no fluxo (mostrar secção de palpites)
      parsedValues = [];
      showPalpiteSection();
    }
  } catch (err) {
    console.error(err);
    uploadStatus.textContent = '❌ Erro no upload/processamento.';
  } finally {
    btnUpload.disabled = false;
  }
});

// ---------- Gerar palpite (ao clique) ----------
btnGenerate.addEventListener('click', () => {
  // precisa de parsedValues; se vazio, avisar para usuário inserir manualmente
  if (!parsedValues || parsedValues.length === 0) {
    // permitir gerar mesmo sem OCR: gerar com distribuição padrão (mais conservadora)
    if (!confirm('Nenhum valor detectado. Deseja gerar um palpite baseado em heurística padrão (conservador)?')) return;
  }

  const now = formatTime();
  const palpite = makePrediction();

  const entry = {
    id: Date.now(),
    hora: now,
    palpite: palpite.value,
    corKey: palpite.color.key,
    corLabel: palpite.color.label,
    status: 'pending',
    real: null
  };

  history.unshift(entry);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  saveState();
  renderLastPrediction(entry);
  renderHistory();
  renderStats();
});

// ---------- prediction algorithm ----------
function makePrediction() {
  // If parsedValues empty, fallback heuristic
  if (!parsedValues || parsedValues.length === 0) {
    // heuristic: 70% chance lilás (2-8), 20% azul, 10% vermelho
    const r = Math.random();
    if (r < 0.1) return { value: (10 + Math.random()*15).toFixed(2), color: classifyColor(12) };
    if (r < 0.3) return { value: (1 + Math.random()*0.95).toFixed(2), color: classifyColor(1.5) };
    return { value: (2 + Math.random()*6).toFixed(2), color: classifyColor(4) };
  }

  // considerar as últimas N
  const recent = parsedValues.slice(-RECENT_MAX);
  const n = recent.length;
  const weights = recencyWeights(n);

  // categoriza e soma pesos por categoria
  let sumAzul = 0, sumLilas = 0, sumVermelho = 0;
  const valsAzul = [], valsLilas = [], valsVermelho = [];
  recent.forEach((v,i) => {
    const w = weights[i] || 1;
    if (v < 2) { sumAzul += w; valsAzul.push({v,w}); }
    else if (v < 10) { sumLilas += w; valsLilas.push({v,w}); }
    else { sumVermelho += w; valsVermelho.push({v,w}); }
  });

  // escolhe categoria com maior peso
  let chosenCat = 'lilas';
  if (sumVermelho > sumLilas && sumVermelho > sumAzul) chosenCat = 'vermelho';
  else if (sumAzul > sumLilas && sumAzul > sumVermelho) chosenCat = 'azul';

  // obtém base value com quantil ponderado
  function getWeightedQ(arr, q) {
    if (!arr.length) return null;
    // maps to arrays
    const values = arr.map(x => x.v);
    const ws = arr.map(x => x.w);
    return weightedQuantile(values, ws, q);
  }

  let base = null;
  if (chosenCat === 'vermelho') {
    base = getWeightedQ(valsVermelho, 0.8) || Math.max(...recent);
    if (!base) base = Math.max(...recent);
  } else if (chosenCat === 'lilas') {
    base = getWeightedQ(valsLilas, 0.7) || weightedQuantile(recent, weights, 0.6);
  } else { // azul
    base = getWeightedQ(valsAzul, 0.6) || weightedQuantile(recent, weights, 0.4);
  }

  if (!base || !isFinite(base)) {
    base = weightedQuantile(recent, weights, 0.6) || (2 + Math.random()*4);
  }

  // aplicar pequeno jitter para simular precisão alta (LEARN_NOISE)
  const predicted = Math.max(1.0, jitter(base, 0.02));
  const color = classifyColor(predicted);
  return { value: predicted.toFixed(2), color };
}

// ---------- render functions ----------
function renderLastPrediction(entry) {
  predictionBox.style.display = 'block';
  predictionText.innerHTML = `<span class="chip ${entry.corKey}">${entry.corLabel}</span> <strong>${entry.palpite}x</strong>`;
  lastGenerated.textContent = `Último: ${entry.hora} → ${entry.corLabel} (${entry.palpite}x)`;
  // show buttons
  btnRight.disabled = false; btnWrong.disabled = false;
  manualEntry.style.display = 'none';
}

function renderHistory() {
  const body = histTableBody;
  body.innerHTML = '';
  history.forEach((h, idx) => {
    const tr = document.createElement('tr');

    const realText = h.real ? `${h.real}x` : '—';
    const resultText = h.status === 'pending' ? '⏳' : (h.status === 'acertou' ? '✅' : '❌');

    tr.innerHTML = `
      <td style="text-align:center">${idx+1}</td>
      <td>${h.hora}</td>
      <td><span class="chip ${h.corKey}">${h.corLabel}</span> <strong>${h.palpite}x</strong></td>
      <td style="text-align:center">${resultText}</td>
      <td style="text-align:center">${realText}</td>
    `;
    // se pending, acrescenta botões inline para marcar (opcional)
    if (h.status === 'pending') {
      const actionsTd = document.createElement('td');
      actionsTd.style.textAlign = 'center';
      const okB = document.createElement('button');
      okB.className = 'ok small';
      okB.textContent = '✅';
      okB.onclick = () => markAsRight(h.id);
      const nok = document.createElement('button');
      nok.className = 'bad small';
      nok.textContent = '❌';
      nok.style.marginLeft = '6px';
      nok.onclick = () => markAsWrong(h.id);
      const extraTd = document.createElement('td');
      extraTd.appendChild(okB);
      extraTd.appendChild(nok);
      tr.appendChild(extraTd);
    }
    body.appendChild(tr);
  });
}

// ---------- marking functions ----------
function markAsRight(entryId) {
  const e = history.find(x => x.id === entryId);
  if (!e) return;
  e.status = 'acertou';
  stats.total++; stats.right++;
  saveState();
  renderStats();
  renderHistory();
}

function markAsWrong(entryId) {
  const e = history.find(x => x.id === entryId);
  if (!e) return;
  // exibimos manualEntry para inserir real
  manualEntry.style.display = 'flex';
  // quando usuario submeter, associamos ao mesmo entry
  submitManual.onclick = () => {
    const v = parseFloat((manualHold.value || '').toString().replace(',', '.'));
    if (!isFinite(v)) { alert('Insira um valor válido (ex 2.35)'); return; }
    e.real = Number(v.toFixed(2));
    e.status = 'errou';
    // adicionar ao parsedValues para aprendizado
    parsedValues.push(e.real);
    if (parsedValues.length > 300) parsedValues = parsedValues.slice(-300);
    // atualizar stats
    stats.total++; stats.wrong++;
    saveState();
    manualEntry.style.display = 'none';
    manualHold.value = '';
    renderStats();
    renderHistory();
  };
}

// For the global action buttons (the latest generated)
btnRight.addEventListener('click', () => {
  // marca o primeiro history (mais recente) que esteja pending
  const e = history.find(h => h.status === 'pending');
  if (!e) return alert('Nenhum palpite pendente para marcar.');
  e.status = 'acertou';
  stats.total++; stats.right++;
  saveState();
  renderStats();
  renderHistory();
});

btnWrong.addEventListener('click', () => {
  const e = history.find(h => h.status === 'pending');
  if (!e) return alert('Nenhum palpite pendente para marcar.');
  // mostra manualEntry para inserir real
  manualEntry.style.display = 'flex';
  submitManual.onclick = () => {
    const v = parseFloat((manualHold.value || '').toString().replace(',', '.'));
    if (!isFinite(v)) { alert('Insira um valor válido (ex 2.35)'); return; }
    e.real = Number(v.toFixed(2));
    e.status = 'errou';
    parsedValues.push(e.real);
    if (parsedValues.length > 300) parsedValues = parsedValues.slice(-300);
    stats.total++; stats.wrong++;
    manualEntry.style.display = 'none';
    manualHold.value = '';
    saveState();
    renderStats();
    renderHistory();
  };
});

// ---------- Stats & UI ----------
function renderStats() {
  statTotal.textContent = stats.total;
  statRight.textContent = stats.right;
  statWrong.textContent = stats.wrong;
}

// ---------- Utility: weightedQuantile for raw array (no weights) ----------
function weightedQuantile(arr, weights, q) {
  // arr: numbers, weights: same length
  if (!arr || arr.length === 0) return null;
  const items = arr.map((v,i) => ({v, w: weights[i] || 1}));
  items.sort((a,b) => a.v - b.v);
  const total = items.reduce((s,it) => s + it.w, 0);
  let cum = 0;
  for (let it of items) {
    cum += it.w;
    if ((cum / total) >= q) return it.v;
  }
  return items[items.length-1].v;
}

// ---------- Render initial ----------
renderStats();
renderHistory();

// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { createWorker } = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// upload temporário
const TMP_DIR = path.join(__dirname, 'tmp_uploads');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB
});

// Tesseract worker (inicializa uma vez)
const worker = createWorker({
  logger: (m) => { /*console.log('Tesseract:', m);*/ }
});

let workerReady = false;
(async () => {
  console.log('Inicializando OCR (Tesseract)...');
  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    workerReady = true;
    console.log('✅ Tesseract pronto!');
  } catch (e) {
    console.error('Erro ao inicializar Tesseract:', e);
  }
})();

// bloqueia uploads até o worker estar pronto
app.use((req, res, next) => {
  if (!workerReady) {
    return res.status(503).send('OCR ainda a iniciar, aguarde alguns segundos e recarregue.');
  }
  next();
});
// Rota OCR: recebe campo 'image' e devolve valores extraídos
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  const filePath = req.file.path;

  // basic mime check
  const mime = req.file.mimetype || '';
  if (!mime.startsWith('image/')) {
    try { fs.unlinkSync(filePath); } catch (e) {}
    return res.status(400).json({ error: 'Apenas imagens são permitidas' });
  }

  if (!workerReady) {
    // tenta aguardar um pouco
    await new Promise(r => setTimeout(r, 1500));
    if (!workerReady) {
      try { fs.unlinkSync(filePath); } catch (e) {}
      return res.status(503).json({ error: 'OCR ainda a iniciar. Tente novamente em alguns segundos.' });
    }
  }

  try {
    const { data: { text } } = await worker.recognize(filePath);

    // remove ficheiro temporário
    try { fs.unlinkSync(filePath); } catch (e) {}

    // extrair números plausíveis (ex: 1.23x, 12x, 3.5)
    // regex captura números com ou sem "x" (ponto ou vírgula)
    const re = /(\d+(?:[.,]\d+)?)(?:\s*[xX])?/g;
    const matches = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      let raw = m[1].replace(',', '.');
      const val = parseFloat(raw);
      if (isFinite(val) && val >= 0.5 && val <= 10000) matches.push(Number(val.toFixed(2)));
    }

    // processar: filtrar duplicates adjacentes e valores plausíveis
    const filtered = [];
    for (let v of matches) {
      if (filtered.length === 0 || Math.abs(filtered[filtered.length - 1] - v) > 0.001) {
        // Aceitamos a partir de 1.0 como mais plausível, mas guardamos >=0.5
        if (v >= 0.9 && v <= 10000) filtered.push(v);
      }
    }

    // Se não encontrou valores úteis, devolve texto bruto para debug
    if (!filtered.length) {
      return res.json({ values: [], rawText: text });
    }

    // Retorna array de números (ordem de extração)
    return res.json({ values: filtered, rawText: text });
  } catch (err) {
    try { fs.unlinkSync(filePath); } catch (e) {}
    console.error('OCR error:', err);
    return res.status(500).json({ error: 'Erro ao processar imagem', detail: String(err) });
  }
});

app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

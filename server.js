// server.js
// Servidor Express + Multer + Tesseract (OCR)
// Usa campo "image" no upload multipart/form-data

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { createWorker } = require('tesseract.js');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// garante uploads/
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer config (arquivo temporário)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Inicializa Tesseract worker (uma vez)
const worker = createWorker({
  logger: m => {
    // opcional: console.log('TESS:', m);
  }
});
let workerReady = false;
(async () => {
  try {
    console.log('Inicializando Tesseract...');
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    workerReady = true;
    console.log('Tesseract pronto.');
  } catch (err) {
    console.error('Erro ao inicializar Tesseract:', err);
  }
})();

// Função utilitária para extrair números plausíveis do texto OCR
function extractMultipliers(text) {
  // procura padrões como 1.23x, 12x, 3,45x, etc.
  const re = /(\d+(?:[.,]\d+)?)(?:\s*[xX])?/g;
  const matches = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    let raw = m[1].replace(',', '.');
    const v = parseFloat(raw);
    if (isFinite(v) && v >= 1.0 && v <= 10000) {
      matches.push(Number(v.toFixed(2)));
    }
  }
  // remover duplicates adjacentes
  const filtered = [];
  for (let v of matches) {
    if (filtered.length === 0 || Math.abs(filtered[filtered.length - 1] - v) > 0.001) {
      filtered.push(v);
    }
  }
  return filtered;
}

// rota de upload com espera por workerReady (até alguns segundos)
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada.' });

  const filePath = req.file.path;

  // aguarda o worker inicializar (até ~12s)
  let tries = 0;
  while (!workerReady && tries < 12) {
    await new Promise(r => setTimeout(r, 1000));
    tries++;
  }
  if (!workerReady) {
    // remove arquivo e responde erro
    try { fs.unlinkSync(filePath); } catch (e) {}
    return res.status(503).json({ success: false, error: 'OCR ainda não pronto. Tente de novo em alguns segundos.' });
  }

  try {
    const { data } = await worker.recognize(filePath);
    const text = (data && data.text) ? data.text : '';
    const values = extractMultipliers(text);

    // remove arquivo temporário
    try { fs.unlinkSync(filePath); } catch (e) {}

    if (!values.length) {
      // envia raw text para debug e permite que front peça entrada manual
      return res.json({ success: true, values: [], rawText: text });
    }

    // devolve valores extraídos (ordem de extração)
    return res.json({ success: true, values, rawText: text });
  } catch (err) {
    console.error('Erro OCR:', err);
    try { fs.unlinkSync(filePath); } catch (e) {}
    return res.status(500).json({ success: false, error: 'Falha no processamento OCR.' });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

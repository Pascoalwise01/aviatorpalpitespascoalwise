// === server.js ===
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import Tesseract from "tesseract.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// === Configuração do upload ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// === Inicialização do Tesseract (OCR) ===
let workerReady = false;
const worker = Tesseract.createWorker();

(async () => {
  console.log("🧠 Inicializando OCR (Tesseract)...");
  try {
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    workerReady = true;
    console.log("✅ Tesseract pronto para uso!");
  } catch (e) {
    console.error("❌ Erro ao inicializar Tesseract:", e);
  }
})();

// Bloqueia uploads até o OCR estar pronto
app.use((req, res, next) => {
  if (!workerReady) {
    return res
      .status(503)
      .send("OCR ainda a iniciar, aguarde alguns segundos e recarregue a página.");
  }
  next();
});

// === Rota de upload + processamento OCR ===
app.post("/upload", upload.single("image"), async (req, res) => {
  const filePath = req.file.path;
  console.log("📸 Imagem recebida:", filePath);

  try {
    const { data } = await worker.recognize(filePath);
    const text = data.text;

    // Extrai todos os números no formato "X.xx" seguidos de "x"
    const odds = Array.from(text.matchAll(/(\d{1,3}\.\d{1,2})x?/g)).map(m => parseFloat(m[1]));
    console.log("🎯 Odds extraídos:", odds);

    // Limpa arquivo temporário
    fs.unlinkSync(filePath);

    if (odds.length === 0) {
      return res.status(400).json({ error: "Nenhum valor de rodada identificado na imagem." });
    }

    res.json({ success: true, odds });
  } catch (err) {
    console.error("Erro ao processar OCR:", err);
    res.status(500).json({ error: "Falha ao processar imagem." });
  }
});

// === Inicializa o servidor ===
app.listen(port, () => {
  console.log(`🚀 Servidor online em http://localhost:${port}`);
});

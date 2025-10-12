// server.js — versão corrigida Pascoal Wise Predictor
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Tesseract from "tesseract.js";

const app = express();

// Corrige diretório base (necessário no Render)
const __dirname = path.resolve();

// Pasta pública (onde está index.html)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Pasta de uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ---------- ROTAS PRINCIPAIS ---------- //

// rota raiz → serve o index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// rota de upload da imagem
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhum arquivo recebido." });
    }

    const imagePath = req.file.path;

    // OCR
    const result = await Tesseract.recognize(imagePath, "eng");
    const text = result.data.text;

    fs.unlinkSync(imagePath);
    res.json({ success: true, text });
  } catch (err) {
    console.error("Erro no OCR:", err.message);
    res.status(500).json({ success: false, message: "Erro ao processar a imagem." });
  }
});

// rota para verificar se o servidor está vivo
app.get("/status", (req, res) => {
  res.json({ status: "ok", message: "Servidor Pascoal Wise Predictor ativo." });
});

// ---------- INICIALIZAÇÃO ---------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

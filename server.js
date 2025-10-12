// server.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Tesseract from "tesseract.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Caminho absoluto da pasta pública
const __dirname = path.resolve();

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Configuração da pasta de upload
const uploadFolder = path.join(__dirname, "upload");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ Redireciona a rota raiz ("/") para o index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota de upload e processamento OCR
app.post("/process-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });
    }

    const imagePath = req.file.path;
    console.log(`🖼️ Processando imagem: ${imagePath}`);

    const result = await Tesseract.recognize(imagePath, "eng");
    const text = result.data.text;
    fs.unlinkSync(imagePath); // Apaga a imagem após o processamento

    res.json({ success: true, text });
  } catch (error) {
    console.error("Erro no processamento OCR:", error);
    res.status(500).json({ success: false, message: "Falha ao processar a imagem." });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  // const result = await Tesseract.recognize(imagePath, "eng");
// const text = result.data.text;
// fs.unlinkSync(imagePath);
// res.json({ success: true, text });
res.json({ success: true, text: "Simulação de OCR (teste de deploy)." });
});

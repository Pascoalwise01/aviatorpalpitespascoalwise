// server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import Tesseract from "tesseract.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));

// === Configuração de armazenamento para uploads ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// === Endpoint principal de upload e OCR ===
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Reconhece texto com Tesseract OCR
    const result = await Tesseract.recognize(filePath, "eng");

    // Extrai números decimais (valores tipo 1.23, 5x, 12.4x)
    const text = result.data.text;
    const odds = Array.from(text.matchAll(/(\d+(\.\d+)?)[xX]?/g)).map((m) =>
      parseFloat(m[1])
    );

    // Apaga o ficheiro após processar
    fs.unlinkSync(filePath);

    if (!odds.length)
      return res.json({ success: false, error: "Nenhum valor numérico encontrado." });

    res.json({ success: true, odds });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Servidor online na porta ${PORT}`));

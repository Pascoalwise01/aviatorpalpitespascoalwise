import express from "express";
import multer from "multer";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Configura upload
const upload = multer({ dest: "uploads/" });

// Middlewares
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Upload simples de imagem
app.post("/upload", upload.single("imagem"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma imagem recebida!" });
  }
  res.json({
    success: true,
    message: "Imagem carregada com sucesso!",
    filePath: `/uploads/${req.file.filename}`,
  });
});

// Inicia servidor
app.listen(PORT, () => console.log(`🚀 Servidor online na porta ${PORT}`));

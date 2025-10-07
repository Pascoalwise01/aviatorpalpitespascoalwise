const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
// === ROTA DE PROXY PARA O AVIATOR ===
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.get('/elephant', async (req, res) => {
  try {
    const targetUrl = 'https://elephantbet.co.ao/casino/aviator';
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.get('user-agent'),
        'Referer': 'https://elephantbet.co.ao/'
      }
    });
    let html = await response.text();
    // Corrige caminhos relativos no HTML
    html = html.replace(/(href|src)=["']\//g, `$1="https://elephantbet.co.ao/`);
    res.send(html);
  } catch (e) {
    console.error('Erro no proxy ElephantBet:', e.message);
    res.status(500).send('Erro ao conectar ao servidor ElephantBet.');
  }
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

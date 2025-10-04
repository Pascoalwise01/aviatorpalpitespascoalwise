const botao = document.getElementById("gerar");
const tabela = document.querySelector("#tabela tbody");
const som = document.getElementById("som");
const ultima = document.getElementById("ultima");
const protecao = document.getElementById("protecao");
const queda = document.getElementById("queda");

const total = document.getElementById("total");
const acertos = document.getElementById("acertos");
const erros = document.getElementById("erros");

let contadorTotal = 0;
let contadorAcertos = 0;
let contadorErros = 0;

// Função para gerar multiplicador aleatório
function gerarMultiplicador() {
  return (Math.random() * 20 + 1).toFixed(2);
}

// Função principal
function gerarPalpite() {
  const hora = new Date().toLocaleTimeString();
  const ultimoResultado = gerarMultiplicador();
  const palpiteProtecao = (Math.random() * 2 + 1.5).toFixed(2);
  const palpiteQueda = (Math.random() * 10 + 3).toFixed(2);

  ultima.textContent = `${ultimoResultado}x`;
  protecao.textContent = `${palpiteProtecao}x`;
  queda.textContent = `${palpiteQueda}x`;

  const linha = document.createElement("tr");
  linha.innerHTML = `
    <td>${hora}</td>
    <td>${ultimoResultado}x</td>
    <td>Proteção ${palpiteProtecao}x — Cai em ${palpiteQueda}x</td>
    <td>—</td>
  `;
  tabela.prepend(linha);

  contadorTotal++;
  total.textContent = contadorTotal;

  // toca o som
  som.currentTime = 0;
  som.play();
}

// Gera novo palpite ao clicar
botao.addEventListener("click", gerarPalpite);

// Simulação automática a cada 30 segundos
setInterval(gerarPalpite, 30000);
  const tabela = document.getElementById("histTable");
  const row = tabela.insertRow(-1);
  row.insertCell(0).innerText = total;
  row.insertCell(1).innerText = hora;
  row.insertCell(2).innerText = `${ultima}x`;
  row.insertCell(3).innerText = `${protecao}x`;
  row.insertCell(4).innerText = `${queda}x`;
  row.insertCell(5).innerText = acertou ? "Acertou" : "Errou";
      }

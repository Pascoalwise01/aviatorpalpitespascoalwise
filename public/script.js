function gerarPalpite() {
  const cores = ["Vermelha (🔥)", "Azul (🔵)", "Lilás (💜)"];
  const escolha = cores[Math.floor(Math.random() * cores.length)];
  document.getElementById("resultado").innerText = "Próxima provável: " + escolha;
}

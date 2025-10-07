let historico = JSON.parse(localStorage.getItem('historico')) || [];
let total = 0, acertos = 0, erros = 0;

function gerarPalpite() {
  const ultimaRodada = (Math.random() * 10).toFixed(2);
  const protecao = (Math.random() * 2 + 1).toFixed(2);
  const caiEm = (Math.random() * 10 + 1).toFixed(2);
  const resultado = Math.random() > 0.5 ? 'Acerto ✅' : 'Erro ❌';
  const hora = new Date().toLocaleTimeString();

  const novo = { hora, ultimaRodada, protecao, caiEm, resultado };
  historico.unshift(novo);

  if (resultado.includes('Acerto')) acertos++;
  else erros++;
  total++;

  atualizarEstatisticas();
  renderHistorico();
  salvarHistorico();
}

function atualizarEstatisticas() {
  document.getElementById('total').textContent = total;
  document.getElementById('acertos').textContent = acertos;
  document.getElementById('erros').textContent = erros;
}

function renderHistorico() {
  const tabela = document.getElementById('histTable');
  tabela.innerHTML = `
    <tr>
      <th>#</th>
      <th>Hora</th>
      <th>Última Rodada</th>
      <th>Proteção</th>
      <th>Cai em</th>
      <th>Resultado</th>
    </tr>
  `;
  historico.slice(0, 15).forEach((item, i) => {
    tabela.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.hora}</td>
        <td>${item.ultimaRodada}</td>
        <td>${item.protecao}</td>
        <td>${item.caiEm}</td>
        <td>${item.resultado}</td>
      </tr>
    `;
  });
}

function salvarHistorico() {
  localStorage.setItem('historico', JSON.stringify(historico));
}

function limparHistorico() {
  if (confirm('Deseja realmente limpar o histórico?')) {
    historico = [];
    total = acertos = erros = 0;
    salvarHistorico();
    renderHistorico();
    atualizarEstatisticas();
  }
}

// 🔄 Carregar histórico salvo ao abrir
window.onload = function() {
  if (historico.length > 0) {
    total = historico.length;
    acertos = historico.filter(h => h.resultado.includes('Acerto')).length;
    erros = historico.filter(h => h.resultado.includes('Erro')).length;
    atualizarEstatisticas();
    renderHistorico();
  }
};

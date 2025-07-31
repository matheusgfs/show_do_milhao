let perguntasTema = [];
let perguntaAtual = 0;
let pontuacao = 0;
let ajudas = {
  pular: 1,
  eliminar: 1,
  dica: 1
};

const valoresPontuacao = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 300000, 1000000];

function iniciarJogo(tema) {
  fetch("perguntas.json")
    .then(res => res.json())
    .then(data => {
      perguntasTema = embaralharArray(data[tema]).slice(0, 11); // 11 perguntas p/ permitir pular
      perguntaAtual = 0;
      pontuacao = 0;
      ajudas = { pular: 1, eliminar: 1, dica: 1 };
      document.getElementById("tela-inicial").style.display = "none";
      document.getElementById("tela-jogo").style.display = "block";
      mostrarPergunta();
    });
}

function mostrarPergunta() {
  if (perguntaAtual >= 10) {
    finalizarJogo(true);
    return;
  }

  const p = perguntasTema[perguntaAtual];
  document.getElementById("pergunta").innerText = p.pergunta;
  document.getElementById("dica").innerText = "";
  const alternativasEl = document.getElementById("alternativas");
  alternativasEl.innerHTML = "";

  p.alternativas.forEach(alt => {
    const btn = document.createElement("button");
    btn.innerText = alt;
    btn.onclick = () => responder(alt);
    alternativasEl.appendChild(btn);
  });

  document.getElementById("progresso").innerText = `Pergunta ${perguntaAtual + 1} de 10`;
  document.getElementById("pontuacao").innerText = `Pontuação: R$ ${pontuacao.toLocaleString("pt-BR")}`;
  document.getElementById("feedback").innerText = "";
  document.getElementById("controle-decidir").style.display = "none";

  atualizarEstadoAjudas();
}

function responder(resposta) {
  const correta = perguntasTema[perguntaAtual].correta;
  if (resposta === correta) {
    pontuacao = valoresPontuacao[perguntaAtual];
    document.getElementById("feedback").innerText = "✅ Resposta correta!";
    document.querySelectorAll("#alternativas button").forEach(btn => btn.disabled = true);
    document.getElementById("controle-decidir").style.display = "block";
  } else {
    document.getElementById("feedback").innerText = "❌ Resposta incorreta!";
    setTimeout(() => finalizarJogo(false), 1500);
  }
}

function continuarJogo() {
  perguntaAtual++;
  mostrarPergunta();
}

function encerrarComPremio() {
  alert(`🏆 Você encerrou com R$ ${pontuacao.toLocaleString("pt-BR")}!`);
  reiniciarJogo();
}

function usarAjuda(tipo) {
  if (ajudas[tipo] <= 0) return;

  if (tipo === "pular") {
    ajudas.pular--;
    perguntaAtual++;
    mostrarPergunta();
  }

  if (tipo === "eliminar") {
    ajudas.eliminar--;
    eliminarAlternativas();
  }

  if (tipo === "dica") {
    ajudas.dica--;
    mostrarDica();
  }

  atualizarEstadoAjudas();
}

function eliminarAlternativas() {
  const correta = perguntasTema[perguntaAtual].correta;
  const botoes = Array.from(document.querySelectorAll("#alternativas button"));
  let erradas = botoes.filter(b => b.innerText !== correta);
  embaralharArray(erradas).slice(0, 2).forEach(btn => btn.disabled = true);
}

function mostrarDica() {
  const dica = perguntasTema[perguntaAtual].dica;
  document.getElementById("dica").innerText = "💡 Dica: " + dica;
}

function atualizarEstadoAjudas() {
  document.getElementById("botaoPular").disabled = ajudas.pular <= 0;
  document.getElementById("botaoPular").innerText = `🔁 Pular (${ajudas.pular} uso${ajudas.pular === 1 ? "" : "s"})`;

  document.getElementById("botaoEliminar").disabled = ajudas.eliminar <= 0;
  document.getElementById("botaoEliminar").innerText = `❌ Eliminar (${ajudas.eliminar} uso${ajudas.eliminar === 1 ? "" : "s"})`;

  document.getElementById("botaoDica").disabled = ajudas.dica <= 0;
  document.getElementById("botaoDica").innerText = `💡 Dica (${ajudas.dica} uso${ajudas.dica === 1 ? "" : "s"})`;
}

function finalizarJogo(vitoria) {
  const msg = vitoria
    ? `🎉 Parabéns! Você venceu e ganhou R$ 1.000.000!`
    : `💥 Você errou. Sua pontuação final foi de R$ ${pontuacao.toLocaleString("pt-BR")}`;
  alert(msg);
  reiniciarJogo();
}

function reiniciarJogo() {
  location.reload();
}

function embaralharArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

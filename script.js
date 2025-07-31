let perguntasTema = [];
let perguntaAtual = 0;
let pontuacao = 0;
let ajudas = { pular: 1, eliminar: 1, dica: 1 };

const valoresPontuacao = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 300000, 1000000];

let perguntasJson = null;
let categoriaSelecionada = "";
let subcategoriaSelecionada = "";

async function carregarPerguntasJson() {
  if (!perguntasJson) {
    const res = await fetch("perguntas.json");
    perguntasJson = await res.json();
  }
}

function mostrarTelaInicial() {
  document.getElementById("tela-inicial").style.display = "block";
  document.getElementById("tela-jogo").style.display = "none";
  document.getElementById("subcategorias").style.display = "none";
  document.getElementById("botoes-subcategorias").innerHTML = "";
}

function selecionarCategoria(categoria) {
  categoriaSelecionada = categoria;
  if (categoria === "matematica") {
    iniciarJogo(categoria);
  } else {
    // mostrar subcategorias para futebol e filmes
    mostrarSubcategorias(categoria);
  }
}

function mostrarSubcategorias(categoria) {
  document.getElementById("categorias").style.display = "none";
  const subcatDiv = document.getElementById("subcategorias");
  const botoesDiv = document.getElementById("botoes-subcategorias");
  botoesDiv.innerHTML = "";

  let subcats = [];
  if (categoria === "futebol") {
    subcats = Object.keys(perguntasJson.futebol); // ex: selecao, atletico, cruzeiro, flamengo
  } else if (categoria === "filmes") {
    subcats = Object.keys(perguntasJson.filmes); // ex: senhor_dos_aneis, round6, marvel
  }

  subcats.forEach(subcat => {
    const btn = document.createElement("button");
    // Formata o nome para visual mais amigável
    btn.textContent = subcat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    btn.onclick = () => {
      subcategoriaSelecionada = subcat;
      iniciarJogo(categoria, subcat);
    };
    botoesDiv.appendChild(btn);
  });

  subcatDiv.style.display = "block";
}

function voltarParaCategorias() {
  categoriaSelecionada = "";
  subcategoriaSelecionada = "";
  document.getElementById("categorias").style.display = "block";
  document.getElementById("subcategorias").style.display = "none";
  document.getElementById("botoes-subcategorias").innerHTML = "";
}

async function iniciarJogo(categoria, subcategoria = "") {
  await carregarPerguntasJson();

  // Esconde telas iniciais
  document.getElementById("tela-inicial").style.display = "none";
  document.getElementById("subcategorias").style.display = "none";
  document.getElementById("tela-jogo").style.display = "block";

  perguntaAtual = 0;
  pontuacao = 0;
  ajudas = { pular: 1, eliminar: 1, dica: 1 };

  // Carregar perguntas conforme categoria e subcategoria
  if (categoria === "matematica") {
    perguntasTema = perguntasJson[categoria].slice(0, 11);
  } else if (categoria === "futebol") {
    perguntasTema = perguntasJson.futebol[subcategoria].slice(0, 11);
  } else if (categoria === "filmes") {
    perguntasTema = perguntasJson.filmes[subcategoria].slice(0, 11);
  } else {
    perguntasTema = [];
  }

  mostrarPergunta();
  atualizarEstadoAjudas();
}

function mostrarPergunta() {
  if (perguntaAtual >= perguntasTema.length) {
    finalizarJogo(true);
    return;
  }

  const p = perguntasTema[perguntaAtual];
  document.getElementById("pergunta").innerText = p.pergunta;
  document.getElementById("feedback").innerText = "";
  document.getElementById("dica-container").innerText = "";

  const alternativasEl = document.getElementById("alternativas");
  alternativasEl.innerHTML = "";

  const letras = ["A", "B", "C", "D"];

  // Cria botões com letra identificadora
p.alternativas.forEach((alt, index) => {
  const btn = document.createElement("button");
  const letra = ["A", "B", "C", "D"][index];
  btn.textContent = alt;
  btn.setAttribute("data-letra", `${letra})`);
  btn.onclick = () => responder(alt, btn);
  alternativasEl.appendChild(btn);
});

  document.getElementById("progresso").innerText = `Pergunta ${perguntaAtual + 1} de ${perguntasTema.length}`;
  document.getElementById("pontuacao").innerText = `Pontuação: R$ ${pontuacao.toLocaleString("pt-BR")}`;
  document.getElementById("controle-decidir").style.display = "none";
}


function responder(resposta, botaoClicado) {
  const correta = perguntasTema[perguntaAtual].correta;
  const botoes = Array.from(document.querySelectorAll("#alternativas button"));

  // Desabilita todos os botões para evitar múltiplos cliques
  botoes.forEach(b => b.disabled = true);

  if (resposta === correta) {
    pontuacao = valoresPontuacao[perguntaAtual];
    document.getElementById("feedback").innerText = "✅ Resposta correta!";
    botaoClicado.style.backgroundColor = "#4CAF50"; // verde
    document.getElementById("controle-decidir").style.display = "block";
  } else {
    document.getElementById("feedback").innerText = `❌ Resposta incorreta! A correta era: ${correta}`;
    botaoClicado.style.backgroundColor = "#f44336"; // vermelho

    // Destaca resposta correta
    botoes.forEach(b => {
      if (b.innerText === correta) {
        b.style.backgroundColor = "#4CAF50";
      }
    });

    setTimeout(() => finalizarJogo(false), 1500);
  }
}

function continuarJogo() {
  perguntaAtual++;
  mostrarPergunta();
  atualizarEstadoAjudas();
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
  } else if (tipo === "eliminar") {
    ajudas.eliminar--;
    eliminarAlternativas();
  } else if (tipo === "dica") {
    ajudas.dica--;
    mostrarDica();
  }

  atualizarEstadoAjudas();
}

function eliminarAlternativas() {
  const correta = perguntasTema[perguntaAtual].correta;
  const botoes = Array.from(document.querySelectorAll("#alternativas button"));
  const erradas = botoes.filter(b => b.innerText !== correta && !b.disabled);

  // Desabilita duas alternativas erradas aleatórias
  embaralharArray(erradas).slice(0, 2).forEach(btn => {
    btn.disabled = true;
    btn.style.backgroundColor = "#bbb"; // cinza claro para indicar desabilitado
  });
}

function mostrarDica() {
  const dica = perguntasTema[perguntaAtual].dica;
  document.getElementById("dica-container").innerText = "💡 Dica: " + dica;
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
  if (vitoria) {
    alert("🎉 Parabéns! Você venceu e ganhou R$ 1.000.000!");
  } else {
    alert(`💥 Você errou. Sua pontuação final foi de R$ ${pontuacao.toLocaleString("pt-BR")}`);
  }
  reiniciarJogo();
}

function reiniciarJogo() {
  location.reload();
}

function embaralharArray(array) {
  return array.slice().sort(() => Math.random() - 0.5);
}

// Inicializa mostrando tela inicial e carregando perguntas JSON
window.onload = async () => {
  await carregarPerguntasJson();
  mostrarTelaInicial();
};

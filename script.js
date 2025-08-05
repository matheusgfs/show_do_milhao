let perguntasJson = null;

let perguntasRestantes = []; // perguntas que podem ser usadas no jogo
let perguntasRespondidas = []; // perguntas já respondidas (pular ou respondidas)
let perguntaAtual = null; // pergunta atual (objeto)
let perguntaAtualIndex = 0; // índice dentro do array perguntasRespondidas (quantas já passaram)

let pontuacao = 0;
let ajudas = { pular: 1, eliminar: 1, dica: 1 };

const valoresPontuacao = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 300000, 1000000];

let respostaSelecionada = null;

let categoriaSelecionada = "";
let subcategoriaSelecionada = "";
let nomeJogador = "";

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
  document.getElementById("tela-final").style.display = "none";
  document.getElementById("botoes-subcategorias").innerHTML = "";
  document.body.className = "";
}

function selecionarCategoria(categoria) {
  categoriaSelecionada = categoria;
  if (categoria === "matematica") {
    iniciarJogo(categoria);
  } else {
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
    subcats = Object.keys(perguntasJson.futebol);
  } else if (categoria === "filmes") {
    subcats = Object.keys(perguntasJson.filmes);
  }

  subcats.forEach(subcat => {
    const btn = document.createElement("button");
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
  document.body.className = "";
}

async function iniciarJogo(categoria, subcategoria = "") {
  await carregarPerguntasJson();

  // Pega o nome do jogador (se digitado)
  nomeJogador = document.getElementById("input-nome").value.trim();

  document.getElementById("tela-inicial").style.display = "none";
  document.getElementById("subcategorias").style.display = "none";
  document.getElementById("tela-jogo").style.display = "block";
  document.getElementById("tela-final").style.display = "none";

  perguntaAtualIndex = 0;
  pontuacao = 0;
  ajudas = { pular: 1, eliminar: 1, dica: 1 };
  respostaSelecionada = null;

  // Seleciona todas perguntas possíveis (de onde tirar para jogar)
  if (categoria === "matematica") {
    perguntasRestantes = perguntasJson[categoria].slice(); // cópia
  } else if (categoria === "futebol") {
    perguntasRestantes = perguntasJson.futebol[subcategoria].slice();
  } else if (categoria === "filmes") {
    perguntasRestantes = perguntasJson.filmes[subcategoria].slice();
  } else {
    perguntasRestantes = [];
  }

  perguntasRespondidas = [];

  subcategoriaSelecionada = subcategoria;
  categoriaSelecionada = categoria;

  aplicarTemaVisual(subcategoria);

  // Inicializa as primeiras 10 perguntas que serão respondidas
  for (let i = 0; i < 10; i++) {
    sortearNovaPergunta();
  }

  mostrarPergunta();
  atualizarEstadoAjudas();
}

function sortearNovaPergunta() {
  if (perguntasRestantes.length === 0) return;

  // Sorteia uma pergunta aleatória das que ainda não foram usadas
  let idx = Math.floor(Math.random() * perguntasRestantes.length);
  let novaPergunta = perguntasRestantes.splice(idx, 1)[0];
  perguntasRespondidas.push(novaPergunta);
}

function mostrarPergunta() {
  if (perguntaAtualIndex >= perguntasRespondidas.length) {
    // Perguntas acabaram - perdeu (não conseguiu 10 acertos)
    finalizarJogo(false);
    return;
  }

  perguntaAtual = perguntasRespondidas[perguntaAtualIndex];
  respostaSelecionada = null;

  // Atualiza UI
  document.getElementById("pergunta").innerText = perguntaAtual.pergunta;
  document.getElementById("feedback").innerText = "";
  document.getElementById("explicacao").innerText = "";
  document.getElementById("dica-container").innerText = "";
  document.getElementById("btn-confirmar").style.display = "none";

  // Alternativas
  const alternativasEl = document.getElementById("alternativas");
  alternativasEl.innerHTML = "";

  const letras = ["A", "B", "C", "D"];

  perguntaAtual.alternativas.forEach((alt, i) => {
    const btn = document.createElement("button");
    btn.textContent = alt;
    btn.setAttribute("data-letra", letras[i]);
    btn.onclick = () => selecionarResposta(btn, alt);
    btn.disabled = false;
    btn.style.backgroundColor = "#f4d35e";
    alternativasEl.appendChild(btn);
  });

  // Pontuação, progresso, acertos e faltando
  document.getElementById("pontuacao").innerText = `Pontuação: R$ ${pontuacao.toLocaleString("pt-BR")}`;
  document.getElementById("progresso").innerText = `Pergunta ${perguntaAtualIndex + 1} de 10`;
  document.getElementById("acertos-faltando").innerText = `Acertos: ${pontuacao === 0 ? 0 : contarAcertos()} | Faltam: ${10 - contarAcertos()}`;
  document.getElementById("valor-pergunta").innerText = `Valor: R$ ${valoresPontuacao[perguntaAtualIndex].toLocaleString("pt-BR")}`;

  // Remove tema do botão continuar e encerrar
  document.getElementById("controle-decidir").style.display = "none";
}

function selecionarResposta(botao, resposta) {
  // Remove seleção anterior
  const botoes = Array.from(document.querySelectorAll("#alternativas button"));
  botoes.forEach(b => {
    b.style.backgroundColor = "#f4d35e";
  });

  botao.style.backgroundColor = "#eece41"; // amarelo para selecionado
  respostaSelecionada = resposta;

  // Mostrar botão confirmar resposta
  document.getElementById("btn-confirmar").style.display = "inline-block";
}

function confirmarResposta() {
  if (!respostaSelecionada) return;

  const correta = perguntaAtual.correta;
  const botoes = Array.from(document.querySelectorAll("#alternativas button"));

  // Desabilita todas alternativas após confirmação
  botoes.forEach(b => b.disabled = true);

  document.getElementById("btn-confirmar").style.display = "none";

  if (respostaSelecionada === correta) {
    pontuacao = valoresPontuacao[perguntaAtualIndex];
    document.getElementById("feedback").innerText = "✅ Resposta correta!";
    document.getElementById("explicacao").innerText = perguntaAtual.explicacao || "";
    botoes.forEach(b => {
      if (b.textContent === correta) b.style.backgroundColor = "#4CAF50";
    });

    document.getElementById("controle-decidir").style.display = "block";
  } else {
    document.getElementById("feedback").innerText = `❌ Resposta incorreta! A correta era: ${correta}`;
    document.getElementById("explicacao").innerText = perguntaAtual.explicacao || "";

    botoes.forEach(b => {
      if (b.textContent === correta) b.style.backgroundColor = "#4CAF50";
      if (b.textContent === respostaSelecionada) b.style.backgroundColor = "#f44336";
    });

    setTimeout(() => finalizarJogo(false), 1500);
  }
}

function contarAcertos() {
  // Retorna quantas perguntas o jogador acertou
  // Aqui, como pontuação só aumenta com acerto, podemos usar o índice do progresso
  // Mas aqui vamos contar quantas perguntas o jogador respondeu corretamente até agora (assumindo que só avança ao acertar)
  // Como usuário pode pular, e pontuação pode não refletir isso, vamos criar um contador explícito:

  return acertos;
}

function usarAjuda(tipo) {
  if (ajudas[tipo] <= 0) return;

  if (tipo === "pular") {
    if (ajudas.pular > 0) {
      ajudas.pular--;
      pularPergunta();
    }
  } else if (tipo === "eliminar") {
    if (ajudas.eliminar > 0) {
      ajudas.eliminar--;
      eliminarAlternativas();
    }
  } else if (tipo === "dica") {
    if (ajudas.dica > 0) {
      ajudas.dica--;
      mostrarDica();
    }
  }

  atualizarEstadoAjudas();
}

function pularPergunta() {
  // Remove pergunta atual de respondidas e substitui por nova (se disponível)
  // Não incrementa perguntaAtualIndex para que caia numa nova pergunta em seguida

  perguntasRespondidas.splice(perguntaAtualIndex, 1); // remove pergunta atual

  // tenta sortear nova pergunta e inserir no lugar da que saiu
  if (perguntasRestantes.length > 0) {
    let idx = Math.floor(Math.random() * perguntasRestantes.length);
    let novaPergunta = perguntasRestantes.splice(idx, 1)[0];
    perguntasRespondidas.splice(perguntaAtualIndex, 0, novaPergunta);
  }

  mostrarPergunta();
}

function eliminarAlternativas() {
  const correta = perguntaAtual.correta;
  const botoes = Array.from(document.querySelectorAll("#alternativas button"));
  const erradas = botoes.filter(b => !b.disabled && !b.textContent.includes(correta));

  // Desabilita duas alternativas erradas aleatórias
  embaralharArray(erradas).slice(0, 2).forEach(btn => {
    btn.disabled = true;
    btn.style.backgroundColor = "#bbb";
  });
}

function mostrarDica() {
  const dica = perguntaAtual.dica;
  document.getElementById("dica-container").innerText = "💡 Dica: " + dica;
}

function atualizarEstadoAjudas() {
  document.getElementById("botaoPular").disabled = ajudas.pular <= 0;
  document.getElementById("botaoPular").innerText = `🔁 Pular (${ajudas.pular})`;

  document.getElementById("botaoEliminar").disabled = ajudas.eliminar <= 0;
  document.getElementById("botaoEliminar").innerText = `❌ Eliminar (${ajudas.eliminar})`;

  document.getElementById("botaoDica").disabled = ajudas.dica <= 0;
  document.getElementById("botaoDica").innerText = `💡 Dica (${ajudas.dica})`;
}

function continuarJogo() {
  perguntaAtualIndex++;
  respostaSelecionada = null;
  // Só avançar se não venceu ainda
  if (contarAcertos() >= 10) {
    finalizarJogo(true);
  } else if (perguntaAtualIndex >= perguntasRespondidas.length) {
    // Se acabou perguntas, e não venceu, perde
    finalizarJogo(false);
  } else {
    mostrarPergunta();
    atualizarEstadoAjudas();
  }
}

function encerrarComPremio() {
  let mensagem = "";

  if (contarAcertos() >= 10) {
    mensagem = `Parabéns ${nomeJogador || "Jogador"}! Você venceu e ganhou R$ 1.000.000!`;
  } else {
    mensagem = `${nomeJogador || "Jogador"}, você encerrou a partida com R$ ${pontuacao.toLocaleString("pt-BR")}.`;
  }

  mostrarTelaFinal(mensagem);
}

function finalizarJogo(venceu) {
  let mensagem = "";

  if (venceu) {
    mensagem = `Parabéns ${nomeJogador || "Jogador"}! Você venceu e ganhou R$ 1.000.000!`;
  } else {
    mensagem = `${nomeJogador || "Jogador"}, você errou. Sua pontuação final foi de R$ ${pontuacao.toLocaleString("pt-BR")}.`;
  }

  mostrarTelaFinal(mensagem);
}

function mostrarTelaFinal(mensagem) {
  document.getElementById("tela-jogo").style.display = "none";
  document.getElementById("tela-inicial").style.display = "none";
  document.getElementById("subcategorias").style.display = "none";
  document.getElementById("tela-final").style.display = "block";
  document.getElementById("mensagem-final").innerText = mensagem;
  document.body.className = "";
}

function reiniciarJogo() {
  location.reload();
}

function embaralharArray(array) {
  return array.slice().sort(() => Math.random() - 0.5);
}

// Contador de acertos explícito
let acertos = 0;

function contarAcertos() {
  return acertos;
}

// Incrementa acertos após resposta correta
function incrementarAcertos() {
  acertos++;
}

window.onload = async () => {
  await carregarPerguntasJson();
  mostrarTelaInicial();
};

// Modificar confirmarResposta para incrementar acertos corretamente
function confirmarResposta() {
  if (!respostaSelecionada) return;

  const correta = perguntaAtual.correta;
  const botoes = Array.from(document.querySelectorAll("#alternativas button"));

  botoes.forEach(b => b.disabled = true);
  document.getElementById("btn-confirmar").style.display = "none";

  if (respostaSelecionada === correta) {
    pontuacao = valoresPontuacao[perguntaAtualIndex];
    document.getElementById("feedback").innerText = "✅ Resposta correta!";
    document.getElementById("explicacao").innerText = perguntaAtual.explicacao || "";
    botoes.forEach(b => {
      if (b.textContent === correta) b.style.backgroundColor = "#4CAF50";
    });
    incrementarAcertos();
    document.getElementById("controle-decidir").style.display = "block";
  } else {
    document.getElementById("feedback").innerText = `❌ Resposta incorreta! A correta era: ${correta}`;
    document.getElementById("explicacao").innerText = perguntaAtual.explicacao || "";
    botoes.forEach(b => {
      if (b.textContent === correta) b.style.backgroundColor = "#4CAF50";
      if (b.textContent === respostaSelecionada) b.style.backgroundColor = "#f44336";
    });
    setTimeout(() => finalizarJogo(false), 1500);
  }

  // Atualiza contadores e UI
  document.getElementById("acertos-faltando").innerText = `Acertos: ${contarAcertos()} | Faltam: ${10 - contarAcertos()}`;
  document.getElementById("pontuacao").innerText = `Pontuação: R$ ${pontuacao.toLocaleString("pt-BR")}`;
}
  
// Função para aplicar tema visual conforme a subcategoria
function aplicarTemaVisual(subcategoria) {
  const body = document.body;
  body.className = "";
  if (subcategoria) {
    const classeTema = `tema-${subcategoria.toLowerCase().replace(/\s/g, "-")}`;
    body.classList.add(classeTema);
  }
}

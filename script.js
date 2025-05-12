// script.js

const container = document.getElementById("container");
const alerta = document.getElementById("alerta");
const contador = document.getElementById("contador");

const nomeInput = document.getElementById("nomeInput");
const areaInput = document.getElementById("areaInput");
const quantidadeInput = document.getElementById("quantidadeInput");
const addButton = document.getElementById("addButton");

let orientadores = [];

// sanitize inputs as the user types
nomeInput.addEventListener("input", () => {
  // permite apenas letras (com acentos) e espaços
  nomeInput.value = nomeInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "");
});

areaInput.addEventListener("input", () => {
  // permite apenas dígitos
  areaInput.value = areaInput.value.replace(/\D/g, "");
});

quantidadeInput.addEventListener("input", () => {
  // permite apenas dígitos
  quantidadeInput.value = quantidadeInput.value.replace(/\D/g, "");
});

addButton.addEventListener("click", adicionarOrientador);

function adicionarOrientador() {
  const nome = nomeInput.value.trim();
  const area = areaInput.value.trim();
  const quantidade = quantidadeInput.value.trim();

  // validações regex
  const nomeRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;
  const numeroRegex = /^\d+$/;

  // checa campos preenchidos
  if (!nome || !area || !quantidade) {
    alerta.textContent = "Preencha todos os campos antes de adicionar.";
    return;
  }

  // checa nome (só letras e espaços)
  if (!nomeRegex.test(nome)) {
    alerta.textContent = "Nome inválido: somente letras e espaços.";
    return;
  }

  // checa área (somente números)
  if (!numeroRegex.test(area)) {
    alerta.textContent = "Área inválida: somente números.";
    return;
  }

  // checa quantidade (somente números)
  if (!numeroRegex.test(quantidade)) {
    alerta.textContent = "Quantidade inválida: somente números.";
    return;
  }

  // **checa duplicatas**
  // nome (insensível a maiúsculas/minúsculas)
  if (orientadores.some(o => o.nome.toLowerCase() === nome.toLowerCase())) {
    alerta.textContent = "Este nome de orientador já foi adicionado.";
    return;
  }
  // área (número único)
  if (orientadores.some(o => o.area === area)) {
    alerta.textContent = "Esta área já foi adicionada.";
    return;
  }

  // limite de 15 orientadores
  if (orientadores.length >= 15) {
    alerta.textContent = "Máximo de 15 orientadores atingido.";
    return;
  }

  // adiciona e atualiza lista
  orientadores.push({ nome, area, quantidade });
  updateLista();

  // limpa campos e alerta
  nomeInput.value = "";
  areaInput.value = "";
  quantidadeInput.value = "";
  alerta.textContent = "";
}

function updateLista() {
  const tbody = document.querySelector("#listaOrientadores tbody");
  tbody.innerHTML = "";
  orientadores.forEach(({ nome, area, quantidade }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${nome}</td><td>${area}</td><td>${quantidade}</td>`;
    tbody.appendChild(tr);
  });
}

function gerarEtiquetas() {
  container.innerHTML = "";
  alerta.textContent = "";
  contador.textContent = "";

  if (orientadores.length === 0) {
    alerta.textContent = "Adicione ao menos um orientador antes de gerar etiquetas.";
    return;
  }

  const tipos = [
    { cor: "red", formato: "circulo" },
    { cor: "red", formato: "retangulo" },
    { cor: "green", formato: "circulo" },
    { cor: "green", formato: "retangulo" },
    { cor: "white", formato: "retangulo" },
  ];

  const etiquetas = [];

  // 1) Etiquetas únicas (círculo ou retângulo colorido)
  const unicas = tipos.filter((t) => t.cor !== "white");
  for (let tipo of unicas) etiquetas.push([tipo]);

  // 2) Círculo + retângulo de cor diferente
  for (let c of tipos.filter((t) => t.formato === "circulo")) {
    for (let r of tipos.filter((t) => t.formato === "retangulo" && t.cor !== c.cor)) {
      etiquetas.push([c, r]);
    }
  }

  // 3) Dois retângulos verticais de cores diferentes
  const retangulos = tipos.filter((t) => t.formato === "retangulo");
  for (let i = 0; i < retangulos.length; i++) {
    for (let j = 0; j < retangulos.length; j++) {
      if (i !== j && retangulos[i].cor !== retangulos[j].cor) {
        etiquetas.push([
          { ...retangulos[i], formato: "retangulo-vertical", pos: "esquerda" },
          { ...retangulos[j], formato: "retangulo-vertical", pos: "direita" },
        ]);
      }
    }
  }

  // 4) Círculo + retângulo branco + retângulo colorido
  for (let c of tipos.filter((t) => t.formato === "circulo")) {
    for (let r of tipos.filter(
      (t) => t.formato === "retangulo" && t.cor !== "white" && t.cor !== c.cor
    )) {
      etiquetas.push([c, { cor: "white", formato: "retangulo" }, r]);
    }
  }

  // desenha até 15 cartões
  orientadores.slice(0, 15).forEach((o, i) =>
    desenharCard(o.nome, etiquetas[i] || [])
  );

  contador.textContent = `Orientadores processados: ${Math.min(
    orientadores.length,
    etiquetas.length
  )}`;
}

function desenharCard(nome, componentes) {
  const card = document.createElement("div");
  card.className = "card";

  const titulo = document.createElement("div");
  titulo.textContent = nome;
  titulo.className = "titulo";

  const etiquetaDiv = document.createElement("div");
  etiquetaDiv.className = "etiqueta";

  componentes.forEach((comp) => {
    const el = document.createElement("div");
    el.className = comp.formato + (comp.pos ? " " + comp.pos : "");
    el.style.background = comp.cor;
    etiquetaDiv.appendChild(el);
  });

  card.appendChild(titulo);
  card.appendChild(etiquetaDiv);
  container.appendChild(card);
}

function limparCards() {
  container.innerHTML = "";
  orientadores = [];
  updateLista();
  nomeInput.value = "";
  areaInput.value = "";
  quantidadeInput.value = "";
  alerta.textContent = "";
  contador.textContent = "";
}

// Constantes e Variáveis Globais
const container = document.getElementById("container");
const alerta = document.getElementById("alerta");
const contador = document.getElementById("contador");

// Formulário e Inputs
const cadastroForm = document.getElementById("cadastroForm");
const nomeInput = document.getElementById("nomeInput");
const areaInput = document.getElementById("areaInput");
const quantidadeInput = document.getElementById("quantidadeInput");

// // Botões
// const gerarEtiquetasButton = document.getElementById("gerarEtiquetasButton");
const limparDadosButton = document.getElementById("limparDadosButton");
const imprimirButton = document.getElementById("imprimirButton");

let orientadores = [];

const CAIXAS_CONFIG = [
  { id: 7, cap: 30 },
  { id: 3, cap: 24 },
  { id: 2, cap: 12 },
  { id: 1, cap: 5 },
  { id: 6, cap: 2 },
].sort((a, b) => b.cap - a.cap); // Ordenar por capacidade descendente

const STORAGE_KEY = "orientadoresData";

// --- Funções de Alerta --- 
function mostrarAlerta(mensagem, tipo = "info") { // tipo pode ser "sucesso", "erro", "aviso", "info"
  console.log(`[mostrarAlerta] Mensagem: ${mensagem}, Tipo: ${tipo}`);
  alerta.textContent = mensagem;
  alerta.className = "alerta"; // Reseta classes
  if (tipo === "sucesso") {
    alerta.classList.add("sucesso");
  } else if (tipo === "erro") {
    alerta.classList.add("erro");
  } else if (tipo === "aviso") {
    alerta.classList.add("aviso");
  }
  if (tipo !== "erro") {
    setTimeout(() => {
      alerta.textContent = "";
      alerta.className = "alerta";
    }, 3000);
  }
}

// --- Funções de Persistência de Dados (localStorage) ---
function salvarOrientadores() {
  console.log("[salvarOrientadores] Salvando orientadores:", orientadores);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orientadores));
}

function carregarOrientadores() {
  console.log("[carregarOrientadores] Tentando carregar orientadores do localStorage.");
  const dadosSalvos = localStorage.getItem(STORAGE_KEY);
  if (dadosSalvos) {
    try {
      orientadores = JSON.parse(dadosSalvos);
      console.log("[carregarOrientadores] Orientadores carregados:", orientadores);
    } catch (e) {
      console.error("[carregarOrientadores] Erro ao carregar dados do localStorage:", e);
      mostrarAlerta("Erro ao carregar dados salvos. Pode ser necessário limpar os dados do site.", "erro");
      orientadores = [];
      localStorage.removeItem(STORAGE_KEY);
    }
    updateLista();
    if (orientadores.length > 0) {
      console.log("[carregarOrientadores] Chamando gerarEtiquetas() após carregar.");
      gerarEtiquetas();
    }
  } else {
    orientadores = [];
    console.log("[carregarOrientadores] Nenhum dado salvo encontrado.");
  }
}

// --- Event Listeners ---
// Validação de Input em Tempo Real
nomeInput.addEventListener("input", () => {
  nomeInput.value = nomeInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "");
});
areaInput.addEventListener("input", () => {
  areaInput.value = areaInput.value.replace(/\D/g, "");
});
quantidadeInput.addEventListener("input", () => {
  quantidadeInput.value = quantidadeInput.value.replace(/\D/g, "");
});

// Ações Principais
if (cadastroForm) {
    cadastroForm.addEventListener("submit", adicionarOrientador);
}
if (gerarEtiquetasButton) {
    gerarEtiquetasButton.addEventListener("click", gerarEtiquetas);
}
if (limparDadosButton) {
    limparDadosButton.addEventListener("click", limparDados); 
}
if (imprimirButton) {
    imprimirButton.addEventListener("click", () => window.print());
}

// Carregar dados ao iniciar
document.addEventListener("DOMContentLoaded", carregarOrientadores);


// --- Lógica de Combinação de Caixas ---
function getBoxCombination(qty) {
  // ... (código existente sem alterações de log, para brevidade)
  const foundCombinations = [];
  function findOptimalCombinationRecursive(targetQty, boxIndex, currentBoxesList) {
    if (targetQty <= 0) { 
      let currentCapacity = 0;
      const counts = {};
      const uniqueBoxIdsInCombo = new Set();
      currentBoxesList.forEach(box => {
        currentCapacity += box.cap;
        counts[box.id] = (counts[box.id] || 0) + 1;
        uniqueBoxIdsInCombo.add(box.id);
      });
      foundCombinations.push({
        combination: counts,
        totalBoxes: currentBoxesList.length,
        totalCapacity: currentCapacity,
        wasted: currentCapacity - qty,
        uniqueBoxTypesCount: uniqueBoxIdsInCombo.size
      });
      return;
    }
    if (boxIndex >= CAIXAS_CONFIG.length) return; 
    if (currentBoxesList.length > (qty / CAIXAS_CONFIG[CAIXAS_CONFIG.length -1].cap) + 5 && currentBoxesList.length > 10) { 
        return;
    }
    const currentBoxType = CAIXAS_CONFIG[boxIndex];
    currentBoxesList.push(currentBoxType);
    findOptimalCombinationRecursive(targetQty - currentBoxType.cap, boxIndex, currentBoxesList); 
    currentBoxesList.pop(); 
    findOptimalCombinationRecursive(targetQty, boxIndex + 1, currentBoxesList);
  }
  findOptimalCombinationRecursive(qty, 0, []);
  const createFallbackCombination = (currentQty) => {
    let currentTotalCap = 0;
    const fallbackCombination = {};
    const sortedCaixasByCapAsc = [...CAIXAS_CONFIG].sort((a, b) => a.cap - b.cap);
    if (sortedCaixasByCapAsc.length === 0 && currentQty > 0) return { combination: {}, wasted: currentQty, totalBoxes: 0, uniqueBoxTypesCount: 0, totalCapacity: 0 };
    const smallestBox = sortedCaixasByCapAsc[0];
    let numSmallestBoxes = 0;
    if (currentQty > 0 && smallestBox) {
      while (currentTotalCap < currentQty) {
        currentTotalCap += smallestBox.cap;
        fallbackCombination[smallestBox.id] = (fallbackCombination[smallestBox.id] || 0) + 1;
        numSmallestBoxes++;
      }
      return {
        combination: fallbackCombination,
        wasted: currentTotalCap - currentQty,
        totalBoxes: numSmallestBoxes,
        uniqueBoxTypesCount: Object.keys(fallbackCombination).length > 0 ? 1 : 0,
        totalCapacity: currentTotalCap
      };
    } else if (currentQty <= 0) {
      return { combination: {}, wasted: 0, totalBoxes: 0, uniqueBoxTypesCount: 0, totalCapacity: 0 };
    }
    return { combination: {}, wasted: currentQty, totalBoxes: 0, uniqueBoxTypesCount: 0, totalCapacity: 0 }; 
  };
  if (foundCombinations.length === 0) {
    return createFallbackCombination(qty);
  }
  const validOnes = foundCombinations.filter(c => c.wasted >= 0);
  if (validOnes.length === 0) {
    return createFallbackCombination(qty);
  }
  validOnes.sort((a, b) => {
    if (a.uniqueBoxTypesCount !== b.uniqueBoxTypesCount) return a.uniqueBoxTypesCount - b.uniqueBoxTypesCount;
    if (a.totalBoxes !== b.totalBoxes) return a.totalBoxes - b.totalBoxes;
    if (a.wasted !== b.wasted) return a.wasted - b.wasted;
    return b.totalCapacity - a.totalCapacity;
  });
  const best = validOnes[0];
  return {
    combination: best.combination,
    wasted: best.wasted,
    totalBoxes: best.totalBoxes,
    uniqueBoxTypesCount: best.uniqueBoxTypesCount 
  };
}

// --- Funções Principais da Aplicação ---
function adicionarOrientador(event) {
  event.preventDefault();
  console.log("[adicionarOrientador] Evento de submit capturado.");
  const nome = nomeInput.value.trim();
  const area = areaInput.value.trim();
  const quantidadeStr = quantidadeInput.value.trim();
  const nomeRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;
  const numRegex = /^\d+$/; // Corrigido para aceitar apenas dígitos
  alerta.textContent = "";
  alerta.className = "alerta";
  if (!nome || !area || !quantidadeStr) { 
    mostrarAlerta("Erro: Preencha todos os campos (Nome, Área, Quantidade).", "erro"); 
    return; 
  }
  if (!nomeRegex.test(nome)) { 
    mostrarAlerta("Erro: Nome inválido. Use apenas letras e espaços.", "erro"); 
    return; 
  }
  if (!numRegex.test(area)) { 
    mostrarAlerta("Erro: Área inválida. Use apenas números.", "erro"); 
    return; 
  }
  const quantidade = parseInt(quantidadeStr, 10);
  if (!numRegex.test(quantidadeStr) || isNaN(quantidade) || quantidade <= 0) { 
    mostrarAlerta("Erro: Quantidade inválida. Use apenas números maiores que zero.", "erro"); 
    return; 
  }
  if (orientadores.some(o => o.nome.toLowerCase() === nome.toLowerCase())) { 
    mostrarAlerta("Atenção: Este nome de orientador já foi adicionado.", "aviso"); 
    return; 
  }
  if (orientadores.some(o => o.area === area)) { 
    mostrarAlerta("Atenção: Esta área já foi adicionada.", "aviso"); 
    return; 
  }
  orientadores.push({ nome, area, quantidade });
  console.log("[adicionarOrientador] Orientador adicionado à lista:", { nome, area, quantidade });
  salvarOrientadores();
  updateLista();
  console.log("[adicionarOrientador] Chamando gerarEtiquetas() após adicionar.");
  gerarEtiquetas();
  cadastroForm.reset();
  nomeInput.focus();
  mostrarAlerta("Orientador adicionado com sucesso!", "sucesso");
}

function updateLista() {
  console.log("[updateLista] Atualizando lista na tabela.");
  const tbody = document.querySelector("#listaOrientadores tbody");
  tbody.innerHTML = "";
  if (orientadores.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td"); 
    td.colSpan = 5;
    td.textContent = "Nenhum orientador cadastrado."; 
    td.style.textAlign = "center";
    tr.appendChild(td); 
    tbody.appendChild(tr); 
    console.log("[updateLista] Lista vazia.");
    return;
  }
  orientadores.forEach(({ nome, area, quantidade }) => {
    const qty = parseInt(quantidade, 10);
    const { combination, wasted, totalBoxes } = getBoxCombination(qty);
    const textoCaixas = Object.keys(combination).length > 0
      ? Object.keys(combination)
        .map(id => ({ id: parseInt(id), count: combination[id] }))
        .sort((a, b) => CAIXAS_CONFIG.find(c => c.id === b.id).cap - CAIXAS_CONFIG.find(c => c.id === a.id).cap)
        .map(item => `Caixa n°${item.id} (x${item.count})`).join(", ") : "N/A";
    const tr = document.createElement("tr");
    const tdNome = document.createElement("td");
    tdNome.textContent = nome;
    tr.appendChild(tdNome);
    const tdArea = document.createElement("td");
    tdArea.textContent = area;
    tr.appendChild(tdArea);
    const tdQuantidade = document.createElement("td");
    tdQuantidade.textContent = quantidade;
    tr.appendChild(tdQuantidade);
    const tdTotalCaixas = document.createElement("td");
    tdTotalCaixas.textContent = totalBoxes || 0;
    tr.appendChild(tdTotalCaixas);
    const tdCaixasDetalhadas = document.createElement("td");
    tdCaixasDetalhadas.textContent = `${textoCaixas} (Ociosidade: ${wasted})`;
    tr.appendChild(tdCaixasDetalhadas);
    tbody.appendChild(tr);
  });
  console.log("[updateLista] Lista atualizada com sucesso.");
}

let finalEtiquetasVisuaisConfig = [];

function gerarEtiquetas() {
  console.log("--- [gerarEtiquetas] INÍCIO ---");
  console.log("[gerarEtiquetas] Container antes de limpar:", container.innerHTML);
  container.innerHTML = "";
  console.log("[gerarEtiquetas] Container após limpar:", container.innerHTML);
  contador.textContent = "";
  
  if (!orientadores || orientadores.length === 0) { 
    console.log("[gerarEtiquetas] Nenhum orientador na lista.");
    container.innerHTML = "<p style=\"text-align:center; width:100%;\">Nenhuma etiqueta para gerar. Adicione orientadores primeiro.</p>"; 
    console.log("[gerarEtiquetas] Mensagem de lista vazia adicionada ao container.");
    console.log("--- [gerarEtiquetas] FIM (lista vazia) ---");
    return; 
  }
  
  console.log("[gerarEtiquetas] Orientadores para processar:", JSON.parse(JSON.stringify(orientadores)));
  console.log("[gerarEtiquetas] Configurações de etiquetas avançadas (etiquetasAvancadasConfig):", JSON.parse(JSON.stringify(etiquetasAvancadasConfig)));

  finalEtiquetasVisuaisConfig = [...etiquetasAvancadasConfig];
  console.log("[gerarEtiquetas] finalEtiquetasVisuaisConfig copiada:", JSON.parse(JSON.stringify(finalEtiquetasVisuaisConfig)));
  
  let configsEsgotadas = false;
  const maxCardsToDisplay = 50;
  
  orientadores.slice(0, maxCardsToDisplay).forEach((o, i) => {
    console.log(`[gerarEtiquetas] Processando orientador ${i + 1}:`, JSON.parse(JSON.stringify(o)));
    const qty = parseInt(o.quantidade, 10);
    const combinationResult = getBoxCombination(qty);
    console.log(`[gerarEtiquetas] Resultado da combinação de caixas para ${o.nome}:`, JSON.parse(JSON.stringify(combinationResult)));
    
    let configEtiquetaAtual;
    if (i < finalEtiquetasVisuaisConfig.length) { 
      configEtiquetaAtual = finalEtiquetasVisuaisConfig[i];
      console.log(`[gerarEtiquetas] Usando configEtiquetaAtual ${i} de finalEtiquetasVisuaisConfig:`, JSON.parse(JSON.stringify(configEtiquetaAtual)));
    } else { 
      configEtiquetaAtual = [{ cor: "#cccccc", formato: "retangulo", texto: "Sem visual único" }]; 
      configsEsgotadas = true; 
      console.log("[gerarEtiquetas] Configs esgotadas, usando visual padrão.");
    }
    console.log(`[gerarEtiquetas] Chamando desenharCard para ${o.nome} com config:`, JSON.parse(JSON.stringify(configEtiquetaAtual)));
    desenharCard(o.nome, configEtiquetaAtual, combinationResult, o.area, o.quantidade);
  });
  
  let numOrientadoresParaEtiquetas = Math.min(orientadores.length, maxCardsToDisplay);
  let contadorMsg = `Etiquetas geradas: ${numOrientadoresParaEtiquetas}.`;
  if (orientadores.length > maxCardsToDisplay) { contadorMsg += ` (Exibindo as primeiras ${maxCardsToDisplay} de ${orientadores.length} orientadores).`; }
  contadorMsg += ` Combinações visuais únicas disponíveis: ${finalEtiquetasVisuaisConfig.length}.`;
  if (configsEsgotadas) { contadorMsg += ` Atenção: Todas as ${finalEtiquetasVisuaisConfig.length} combinações únicas foram usadas. Etiquetas subsequentes usam um visual padrão.`; }
  contador.textContent = contadorMsg;
  console.log("[gerarEtiquetas] Mensagem do contador definida:", contadorMsg);
  console.log("[gerarEtiquetas] Container após desenhar todos os cards:", container.innerHTML);
  console.log("--- [gerarEtiquetas] FIM ---");
}

function desenharCard(nome, componentes, combinationResult, area = "", quantidadeOriginal = 0) {
  console.log(`--- [desenharCard] INÍCIO para ${nome} ---`);
  console.log("[desenharCard] Componentes recebidos:", JSON.parse(JSON.stringify(componentes)));
  console.log("[desenharCard] CombinationResult recebido:", JSON.parse(JSON.stringify(combinationResult)));
  console.log(`[desenharCard] Área: ${area}, Quantidade Original: ${quantidadeOriginal}`);

  const { combination, wasted, totalBoxes } = combinationResult;
  const card = document.createElement("div"); card.className = "card";
  console.log("[desenharCard] Card div criado.");
  
  const header = document.createElement("div"); header.className = "header";
  header.innerHTML = `<div class="nome">${nome}</div><div class="area">Setor: ${area}</div>`;
  console.log("[desenharCard] Header criado e populado.");
  
  const etiquetaDiv = document.createElement("div"); etiquetaDiv.className = "etiqueta";
  console.log("[desenharCard] EtiquetaDiv criada.");
  
  const componentesOrdenados = [...componentes].sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0));
  console.log("[desenharCard] Componentes ordenados:", JSON.parse(JSON.stringify(componentesOrdenados)));
  
  if (componentesOrdenados && componentesOrdenados.length > 0) {
    componentesOrdenados.forEach((comp, index) => {
      console.log(`[desenharCard] Processando componente ${index + 1} da etiqueta:`, JSON.parse(JSON.stringify(comp)));
      const el = document.createElement("div"); el.className = comp.formato;
      if (comp.pos) { el.classList.add(comp.pos); }
      el.style.background = comp.cor;
      if (comp.zIndex) { el.style.zIndex = comp.zIndex; }
      if (comp.formato === "retangulo" && comp.cor === "white") { el.classList.add("retangulo-branco"); }
      if (comp.texto) { 
        el.textContent = comp.texto; 
        el.style.fontSize = "10px"; 
        el.style.color = "black"; 
        el.style.textAlign = "center"; 
        el.style.wordBreak = "break-word"; 
        el.style.display = "flex"; 
        el.style.alignItems = "center"; 
        el.style.justifyContent = "center"; 
      } if (!comp.pos) {
  el.style.position = "relative";
  el.style.margin = "0 auto";
}
      el.style.webkitPrintColorAdjust = "exact"; el.style.printColorAdjust = "exact";
      etiquetaDiv.appendChild(el);
      console.log(`[desenharCard] Elemento do componente ${index + 1} adicionado à etiquetaDiv.`);
    });
  } else { 
    etiquetaDiv.innerHTML = "<p style=\"font-size:0.8em; color:#555;\">Visual não definido</p>"; 
    console.log("[desenharCard] Nenhum componente visual definido, usando mensagem padrão.");
  }
  
  const footer = document.createElement("div"); footer.className = "footer";
  const caixasDetalhadasHTML = Object.keys(combination).length > 0
    ? Object.keys(combination).map(id => ({ id: parseInt(id), count: combination[id] }))
      .sort((a, b) => CAIXAS_CONFIG.find(c => c.id === b.id).cap - CAIXAS_CONFIG.find(c => c.id === a.id).cap)
      .map(item => `Caixa n°${item.id}: ${item.count} un.`).join("<br>") : "Nenhuma caixa necessária";
  
  footer.innerHTML = 
  `
    <div class="sumario-caixas-topo">
        Total de Caixas: ${totalBoxes || 0} <br>
        <div class="caixas-detalhes">${caixasDetalhadasHTML}</div>
    </div>
    <div class="sumario-itens-ociosidade">
        Total de Itens: ${quantidadeOriginal || 0} vol.<br>
        Ociosidade: ${wasted} vol. <br>
    </div>`;
  console.log("[desenharCard] Footer criado e populado.");

  card.appendChild(header); 
  card.appendChild(etiquetaDiv); 
  card.appendChild(footer);
  console.log("[desenharCard] Header, etiquetaDiv e footer adicionados ao card.");
  
  container.appendChild(card);
  console.log("[desenharCard] Card final adicionado ao container principal.");
  console.log("[desenharCard] Conteúdo atual do container:", container.innerHTML);
  console.log(`--- [desenharCard] FIM para ${nome} ---`);
}

function limparDados() {
  console.log("[limparDados] Limpando todos os dados e etiquetas.");
  container.innerHTML = "<p style=\"text-align:center; width:100%;\">Nenhuma etiqueta para gerar. Adicione orientadores primeiro.</p>";
  orientadores = []; 
  salvarOrientadores();
  updateLista();
  contador.textContent = "";
  mostrarAlerta("Todos os dados e etiquetas foram limpos.", "info");
}

// A linha abaixo que atribui finalEtiquetasVisuaisConfig diretamente pode ser problemática
// se etiquetasAvancadasConfig não estiver definido globalmente no momento da execução deste script.
// No entanto, como etiquetasAvancadas.js é carregado antes, isso deve funcionar.
// Apenas para garantir, vamos manter a atribuição dentro de gerarEtiquetas ou após DOMContentLoaded.

// Inicialização após o DOM estar pronto
document.addEventListener("DOMContentLoaded", () => {
  console.log("[DOMContentLoaded] DOM completamente carregado e parseado.");
  carregarOrientadores(); 
  // A atribuição de finalEtiquetasVisuaisConfig é feita dentro de gerarEtiquetas agora.
});


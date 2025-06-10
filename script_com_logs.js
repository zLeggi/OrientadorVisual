// Constantes e Variáveis Globais
const orientadoresLabelsPreview = document.getElementById("orientadoresLabelsPreview"); // Onde as pré-visualizações das etiquetas serão exibidas
const printContainer = document.getElementById("printContainer"); // Container oculto para etiquetas de impressão
const alerta = document.getElementById("alerta");     // Elemento para exibir mensagens de alerta
const contador = document.getElementById("contador"); // Elemento para exibir o total de etiquetas geradas

// Formulário e Inputs
const cadastroForm = document.getElementById("cadastroForm");       // Formulário de cadastro de orientadores
const nomeInput = document.getElementById("nomeInput");           // Input para o nome do orientador
const areaInput = document.getElementById("areaInput");           // Input para a área do orientador
const quantidadeInput = document.getElementById("quantidadeInput"); // Input para a quantidade de itens
const uploadFileInput = document.getElementById("uploadFile");    // Input para upload de arquivo

// Botões
const limparDadosButton = document.getElementById("limparDadosButton");     // Botão para limpar todos os dados
const imprimirButton = document.getElementById("imprimirButton");         // Botão para imprimir todas as etiquetas

let orientadores = []; // Array que armazenará os objetos dos orientadores
let usedCombinationIndices = new Set(); // Conjunto para rastrear os índices das combinações de etiquetas já usadas

// Configuração das capacidades das caixas disponíveis, ordenadas da maior para a menor.
// Adicionado 'type' para diferenciar as variações da Caixa 7 e facilitar a pontuação.
const CAIXAS_CONFIG = [
  { id: 7, cap: 30, type: 'C7_30' }, // Caixa 7 padrão
  { id: 3, cap: 24, type: 'C3' },
  { id: 2, cap: 12, type: 'C2' },
  { id: 1, cap: 5, type: 'C1' },
  { id: 6, cap: 2, type: 'C6' },
  { id: 7, cap: 31, type: 'C7_31' } // Caixa 7 com capacidade de 31 (para otimização específica)
].sort((a, b) => b.cap - a.cap); 

const STORAGE_KEY = "orientadoresData"; // Chave para armazenar dados no localStorage

// --- Funções de Alerta --- 
// Exibe uma mensagem de alerta na tela.
function mostrarAlerta(mensagem, tipo = "info") { 
  console.log(`[mostrarAlerta] Mensagem: ${mensagem}, Tipo: ${tipo}`);
  alerta.textContent = mensagem;
  alerta.className = "alerta"; // Reseta as classes para aplicar a nova.
  if (tipo === "sucesso") {
    alerta.classList.add("sucesso");
  } else if (tipo === "erro") {
    alerta.classList.add("erro");
  } else if (tipo === "aviso") {
    alerta.classList.add("aviso");
  } else if (tipo === "info") {
    alerta.classList.add("info");
  }
  // Remove o alerta após 3 segundos, exceto se for um erro.
  if (tipo !== "erro") {
    setTimeout(() => {
      alerta.textContent = "";
      alerta.className = "alerta"; // Limpa as classes para esconder o alerta.
    }, 3000);
  }
}

// --- Funções de Persistência de Dados (localStorage) ---
// Salva o array de orientadores no localStorage.
function salvarOrientadores() {
  console.log("[salvarOrientadores] Salvando orientadores:", orientadores);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orientadores));
}

// Carrega os orientadores do localStorage.
function carregarOrientadores() {
  console.log("[carregarOrientadores] Tentando carregar orientadores do localStorage.");
  const dadosSalvos = localStorage.getItem(STORAGE_KEY);
  if (dadosSalvos) {
    try {
      orientadores = JSON.parse(dadosSalvos);
      // Reconstroi o usedCombinationIndices a partir dos orientadores carregados
      usedCombinationIndices = new Set(orientadores.map(o => o.assignedCombinationIndex).filter(index => index !== undefined));
      console.log("[carregarOrientadores] Orientadores carregados:", orientadores);
      console.log("[carregarOrientadores] Índices de combinação usados:", usedCombinationIndices);
    } catch (e) {
      console.error("[carregarOrientadores] Erro ao carregar dados do localStorage:", e);
      mostrarAlerta("Erro ao carregar dados salvos. Pode ser necessário limpar os dados do site.", "erro");
      orientadores = []; // Limpa os dados se houver erro de parsing.
      usedCombinationIndices = new Set(); // Limpa também os índices usados.
      localStorage.removeItem(STORAGE_KEY); // Remove dados corrompidos.
    }
    updateLista(); // Atualiza a tabela com os dados carregados.
    displayOrientadoresLabelsPreview(); // Exibe as pré-visualizações.
  } else {
    orientadores = [];
    usedCombinationIndices = new Set();
    console.log("[carregarOrientadores] Nenhum dado salvo encontrado.");
  }
}

// --- Event Listeners ---
// Adiciona listeners para validar a entrada dos inputs.
nomeInput.addEventListener("input", () => {
  nomeInput.value = nomeInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, ""); // Apenas letras e espaços
});
areaInput.addEventListener("input", () => {
  areaInput.value = areaInput.value.replace(/\D/g, ""); // Apenas dígitos
});
quantidadeInput.addEventListener("input", () => {
  quantidadeInput.value = quantidadeInput.value.replace(/\D/g, ""); // Apenas dígitos
});

// Adiciona listeners aos botões e formulário.
if (cadastroForm) {
    cadastroForm.addEventListener("submit", adicionarOrientador);
}
if (limparDadosButton) {
    limparDadosButton.addEventListener("click", limparDados); 
}
if (imprimirButton) {
    imprimirButton.addEventListener("click", () => {
        generateAllLabelsForPrint(); // Gera todas as etiquetas para impressão
        window.print(); // Abre a caixa de diálogo de impressão.
    });
}
if (uploadFileInput) {
    uploadFileInput.addEventListener("change", handleFileUpload);
}

// Carrega os orientadores quando o DOM estiver completamente carregado.
document.addEventListener("DOMContentLoaded", () => {
  console.log("[DOMContentLoaded] DOM completamente carregado e parseado.");
  carregarOrientadores(); 
  displayOrientadoresLabelsPreview(); // Garante que as pré-visualizações sejam exibidas ao carregar.
});


// --- Lógica de Combinação de Caixas ---
// Calcula a melhor combinação de caixas para uma dada quantidade de itens.
function getBoxCombination(qty) {
  const caixas = CAIXAS_CONFIG; // Usa a configuração global de caixas.

  // Aumentado o limite de caixas e tipos para permitir combinações para volumes maiores
  const maxTiposDeCaixa = 3; // Aumentado para 3 tipos diferentes
  const maxCaixas = 10;      // Aumentado para 10 caixas no total

  let melhoresCombinacoes = []; // Armazena as combinações válidas encontradas.

  // Função recursiva para encontrar todas as combinações possíveis.
  function combinar(target, i, atual, totalCap, tipos, ociosidade) {
    // Condição de parada: se a capacidade total já atinge o alvo, ou se excedeu os limites de tipos/caixas.
    if (totalCap >= target && tipos.size <= maxTiposDeCaixa && atual.length <= maxCaixas) {
      melhoresCombinacoes.push({
        caixas: [...atual],     // As caixas que formam a combinação.
        totalCap,               // Capacidade total da combinação.
        ociosidade: totalCap - target, // Ociosidade (capacidade não utilizada).
        tipos: new Set([...tipos]),     // Tipos únicos de caixas na combinação.
        originalTarget: target // Adiciona a quantidade original para uso na pontuação
      });
    }
    // Condição de parada para evitar recursão infinita ou desnecessária.
    if (totalCap >= target || i >= caixas.length) return;

    // Tenta incluir a caixa atual na combinação.
    combinar(
      target,
      i,
      [...atual, caixas[i]],
      totalCap + caixas[i].cap,
      new Set([...tipos, caixas[i].cap]),
      ociosidade
    );

    // Tenta não incluir a caixa atual e passa para a próxima.
    combinar(target, i + 1, atual, totalCap, tipos, ociosidade);
  }

  // Inicia o processo de combinação.
  combinar(qty, 0, [], 0, new Set(), 0);

  // Função para pontuar cada combinação, priorizando as melhores.
  // Um score menor indica uma combinação melhor.
  function pontuar(comb) {
    const target = comb.originalTarget; // Obtém a quantidade original para este cálculo
    const isPedidoPequeno = target < 60; // Define se é um pedido pequeno

    const tipos = Array.from(comb.tipos).sort((a, b) => b - a);
    const maior = tipos[0];
    const menor = tipos[tipos.length - 1];
    const diferenca = maior - menor;

    let score = 0;

    // Penalidades baseadas na complexidade e ociosidade.
    score += comb.tipos.size * 10;          // Mais tipos = maior score (pior).
    score += comb.caixas.length * 10;       // AUMENTADO: Mais caixas = maior score (pior).
    score += comb.ociosidade * 1.5;         // Mais ociosidade = maior score (pior).

    // Bônus para combinações ideais.
    if (comb.tipos.size === 1) score -= 10;           // Todas as caixas do mesmo tipo = melhor.
    else if (comb.tipos.size <= 2 && diferenca <= 6) score -= 6; // Poucos tipos e pequena diferença = melhor.

    if (comb.totalCap >= target && isPedidoPequeno && diferenca <= 6) {
      score -= 4; // Bônus para pedidos pequenos com boa combinação.
    }

    // --- Novas regras de pontuação baseadas nas preferências do usuário ---
    let hasC7_30 = false;
    let hasC7_31 = false;
    let hasC1 = false;
    let hasC6 = false;
    let hasC3 = false;
    let hasC2 = false;

    comb.caixas.forEach(box => {
        if (box.type === 'C7_30') hasC7_30 = true;
        if (box.type === 'C7_31') hasC7_31 = true;
        if (box.type === 'C1') hasC1 = true;
        if (box.type === 'C6') hasC6 = true;
        if (box.type === 'C3') hasC3 = true;
        if (box.type === 'C2') hasC2 = true;
    });

    // Penalizar misturar C7_30 e C7_31 na mesma combinação (muito indesejável)
    if (hasC7_30 && hasC7_31) {
        score += 1000; // Penalidade muito alta
    }

    // Penalizar C7 (qualquer tipo) com C1 ou C6
    if ((hasC7_30 || hasC7_31) && (hasC1 || hasC6)) {
        score += 50; // Penalidade significativa
    }

    // Bônus forte para C7_31 se resultar em ajuste perfeito (ociosidade zero)
    if (hasC7_31 && comb.ociosidade === 0) {
        score -= 20; // Bônus forte
    }
    
    // Pequeno bônus para C7 (qualquer tipo) com C3 ou C2, se não houver C1/C6
    if ((hasC7_30 || hasC7_31) && (hasC3 || hasC2) && !(hasC1 || hasC6)) {
        score -= 5; // Pequeno bônus
    }

    return score;
  }
  
  // Se nenhuma combinação for encontrada, retorna um objeto de fallback.
  if (melhoresCombinacoes.length === 0) {
      console.warn(`[getBoxCombination] Nenhuma combinação de caixas encontrada para quantidade: ${qty}.`);
      return { 
        combination: {},
        wasted: qty,
        totalBoxes: 0,
        uniqueBoxTypesCount: 0,
        totalCapacity: 0
      };
  }

  // Ordena as combinações pela pontuação (menor score é melhor).
  melhoresCombinacoes.sort((a, b) => pontuar(a) - pontuar(b)); 
  const melhor = melhoresCombinacoes[0]; // A melhor combinação é a primeira após a ordenação.

  if (!melhor) { 
    console.error("[getBoxCombination] 'melhor' combinação é indefinida após o sort. Quantidade:", qty);
    return { combination: {}, wasted: qty, totalBoxes: 0, uniqueBoxTypesCount: 0, totalCapacity: 0 };
  }

  // Conta a ocorrência de cada tipo de caixa na melhor combinação.
  const counts = {};
  melhor.caixas.forEach(box => {
    // Usar o id da caixa, não o type, para a contagem final
    counts[box.id] = (counts[box.id] || 0) + 1; 
  });

  // Retorna os detalhes da melhor combinação.
  return {
    combination: counts,
    wasted: melhor.ociosidade,
    totalBoxes: melhor.caixas.length,
    uniqueBoxTypesCount: melhor.tipos.size,
    totalCapacity: melhor.totalCap
  };
}

// --- Funções Principais da Aplicação ---
// Adiciona um novo orientador à lista.
function adicionarOrientador(event, dataFromUpload = null) {
  if (event) event.preventDefault(); // Previne o comportamento padrão do formulário (recarregar a página).
  console.log("[adicionarOrientador] Evento de submit capturado ou dados de upload.");

  let nome, area, quantidadeStr;

  if (dataFromUpload) {
    nome = dataFromUpload.nome;
    area = dataFromUpload.area;
    quantidadeStr = String(dataFromUpload.quantidade); // Garante que seja string para validação
  } else {
    nome = nomeInput.value.trim();
    area = areaInput.value.trim();
    quantidadeStr = quantidadeInput.value.trim();
  }
  
  const nomeRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;
  const numRegex = /^\d+$/; 
  
  alerta.textContent = ""; // Limpa qualquer alerta anterior.
  alerta.className = "alerta";

  // Validação dos campos.
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
  if (isNaN(quantidade) || quantidade <= 0) {
    mostrarAlerta("Erro: Quantidade inválida. Use apenas números inteiros maiores que zero.", "erro");
    return;
  }

  // Verifica se o orientador já existe.
  if (orientadores.some(o => o.nome.toLowerCase() === nome.toLowerCase())) {
    mostrarAlerta("Atenção: Este nome de orientador já foi adicionado.", "aviso");
    return;
  }

  // --- Lógica para atribuir uma etiqueta única ---
  const combinacoesDisponiveis = etiquetasAvancadasConfig;
  let assignedCombinationIndex = -1;

  // Encontra o próximo índice de combinação disponível
  for (let i = 0; i < combinacoesDisponiveis.length; i++) {
      if (!usedCombinationIndices.has(i)) {
          assignedCombinationIndex = i;
          break;
      }
  }

  if (assignedCombinationIndex === -1) {
      mostrarAlerta("Não há mais combinações de etiquetas visuais únicas disponíveis. Limpe os dados ou remova orientadores para liberar combinações.", "erro");
      return;
  }

  // Calcula a combinação de caixas para a quantidade informada.
  const boxCombinationResult = getBoxCombination(quantidade);
  console.log("[adicionarOrientador] Resultado da combinação de caixas:", boxCombinationResult);

  // Verifica se a combinação foi bem-sucedida antes de adicionar o orientador.
  if (Object.keys(boxCombinationResult.combination).length === 0 && quantidade > 0) {
    mostrarAlerta(`Não foi possível determinar as caixas para ${nome} com quantidade ${quantidade}. Orientador não adicionado.`, "erro");
    return;
  }

  // Cria o novo objeto orientador.
  const novoOrientador = {
    nome,
    area,
    quantidade,
    caixas: boxCombinationResult.combination,
    ociosidade: boxCombinationResult.wasted,
    totalCaixas: boxCombinationResult.totalBoxes,
    tiposUnicosCaixas: boxCombinationResult.uniqueBoxTypesCount,
    capacidadeTotalGerada: boxCombinationResult.totalCapacity,
    assignedCombinationIndex: assignedCombinationIndex // Atribui o índice da combinação única
  };

  orientadores.push(novoOrientador); // Adiciona o novo orientador ao array.
  usedCombinationIndices.add(assignedCombinationIndex); // Marca a combinação como usada.
  salvarOrientadores();             // Salva os dados no localStorage.
  updateLista();                    // Atualiza a tabela de orientadores.
  displayOrientadoresLabelsPreview(); // Atualiza as pré-visualizações das etiquetas.
  mostrarAlerta("Orientador adicionado com sucesso!", "sucesso"); // Exibe mensagem de sucesso.
  if (!dataFromUpload) { // Limpa o formulário apenas se não for um upload
    cadastroForm.reset();             // Limpa o formulário.
    nomeInput.focus();                // Coloca o foco de volta no campo nome.
  }
}

// Atualiza a tabela de orientadores na interface.
function updateLista() {
  console.log("[updateLista] Atualizando a lista de orientadores na tabela.");
  const tbody = document.querySelector("#listaOrientadores tbody");
  tbody.innerHTML = ""; // Limpa o corpo da tabela.

  if (orientadores.length === 0) {
    console.log("[updateLista] Nenhum orientador para exibir na lista.");
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 5; // Abrange todas as colunas.
    cell.textContent = "Nenhum orientador cadastrado.";
    cell.style.textAlign = "center";
    return;
  }

  // Preenche a tabela com os dados dos orientadores.
  orientadores.forEach((orientador, index) => {
    const row = tbody.insertRow(); // Cria uma nova linha.
    row.insertCell(0).textContent = orientador.nome;
    row.insertCell(1).textContent = orientador.area;
    row.insertCell(2).textContent = orientador.quantidade;

    // Formata a exibição das caixas (ex: "2x C7, 1x C3").
    const caixasFormatadas = Object.entries(orientador.caixas)
      .map(([id, count]) => `${count}x C${id}`)
      .join(", ");
    row.insertCell(3).textContent = caixasFormatadas;

    // Adiciona o botão de exclusão.
    const actionsCell = row.insertCell(4);
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Excluir";
    deleteButton.classList.add("delete-button");
    deleteButton.onclick = () => {
      console.log(`[updateLista] Tentando excluir orientador: ${orientador.nome} (índice: ${index})`);
      showCustomConfirm("Tem certeza que deseja excluir este orientador?", () => {
        // Libera o índice da combinação de etiqueta antes de remover o orientador
        if (orientadores[index] && orientadores[index].assignedCombinationIndex !== undefined) {
            usedCombinationIndices.delete(orientadores[index].assignedCombinationIndex);
            console.log(`[updateLista] Combinação de etiqueta ${orientadores[index].assignedCombinationIndex} liberada.`);
        }
        orientadores.splice(index, 1); // Remove o orientador do array.
        salvarOrientadores();          // Salva as alterações.
        updateLista();                 // Atualiza a tabela.
        displayOrientadoresLabelsPreview(); // Atualiza as pré-visualizações.
        mostrarAlerta("Orientador excluído.", "info");
      });
    };
    actionsCell.appendChild(deleteButton);
  });
  console.log("[updateLista] Lista de orientadores atualizada com sucesso.");
}

// --- Funções para Pré-visualização e Impressão de Etiquetas ---

// Exibe uma pré-visualização da etiqueta para cada orientador.
function displayOrientadoresLabelsPreview() {
    console.log("[displayOrientadoresLabelsPreview] Atualizando as pré-visualizações das etiquetas.");
    orientadoresLabelsPreview.innerHTML = ""; // Limpa o container de pré-visualizações.

    if (orientadores.length === 0) {
        orientadoresLabelsPreview.innerHTML = '<p class="placeholder-text">Adicione orientadores para ver as pré-visualizações das etiquetas.</p>';
        contador.textContent = "Total de orientadores: 0";
        return;
    }

    const combinacoesDisponiveis = etiquetasAvancadasConfig;
    if (!combinacoesDisponiveis || combinacoesDisponiveis.length === 0) {
        console.error("[displayOrientadoresLabelsPreview] Erro: Nenhuma combinação de etiqueta avançada disponível.");
        orientadoresLabelsPreview.innerHTML = '<p class="placeholder-text">Erro na configuração das etiquetas visuais.</p>';
        return;
    }

    orientadores.forEach(orientador => {
        const { assignedCombinationIndex } = orientador;
        
        // Pega a combinação de etiqueta atribuída a este orientador.
        const combinacaoSelecionada = combinacoesDisponiveis[assignedCombinationIndex];

        if (!combinacaoSelecionada) {
            console.warn(`[displayOrientadoresLabelsPreview] Orientador ${orientador.nome} tem um índice de combinação inválido (${assignedCombinationIndex}). Pulando.`);
            return;
        }

        // Desenha o card da pré-visualização, passando o objeto orientador completo
        desenharCard(orientador, combinacaoSelecionada, orientadoresLabelsPreview);
    });
    contador.textContent = `Total de orientadores: ${orientadores.length}`;
}

// Gera todas as etiquetas para impressão em um container oculto.
// Esta função agora gera APENAS UMA ETIQUETA por orientador para a impressão de orientação.
function generateAllLabelsForPrint() {
  console.log("[generateAllLabelsForPrint] Iniciando geração de todas as etiquetas para impressão (orientação).");
  printContainer.innerHTML = ""; // Limpa o container de impressão.

  if (orientadores.length === 0) {
    mostrarAlerta("Nenhum orientador para gerar etiquetas de impressão.", "aviso");
    return;
  }

  const combinacoesDisponiveis = etiquetasAvancadasConfig; 
  if (!combinacoesDisponiveis || combinacoesDisponiveis.length === 0) {
      console.error("[generateAllLabelsForPrint] Erro: Nenhuma combinação de etiqueta avançada disponível.");
      mostrarAlerta("Erro ao carregar configurações de etiquetas visuais para impressão.", "erro");
      return;
  }
  const totalCombinacoes = combinacoesDisponiveis.length;
  console.log(`[generateAllLabelsForPrint] Total de combinações disponíveis: ${totalCombinacoes}`);

  let contadorEtiquetasGeradas = 0;

  orientadores.forEach(orientador => {
    const { caixas, assignedCombinationIndex } = orientador;
    console.log(`[generateAllLabelsForPrint] Processando orientador: ${orientador.nome}`);

    if (!caixas || Object.keys(caixas).length === 0) {
      console.warn(`[generateAllLabelsForPrint] Orientador ${orientador.nome} não possui caixas definidas ou válidas. Pulando.`);
      return;
    }

    // Pega a combinação de etiqueta atribuída a este orientador.
    const combinacaoSelecionada = combinacoesDisponiveis[assignedCombinationIndex];
    if (!combinacaoSelecionada) {
        console.error(`[generateAllLabelsForPrint] Erro: Combinação de etiqueta não encontrada para o índice ${assignedCombinationIndex} do orientador ${orientador.nome}.`);
        return;
    }

    // Gera APENAS UMA ETIQUETA de exemplo para este orientador na impressão.
    // Usamos o primeiro caixaId encontrado para o retângulo branco, se aplicável.
    const firstCaixaId = Object.keys(caixas)[0];
    desenharCard(orientador, combinacaoSelecionada, printContainer, firstCaixaId); 
    contadorEtiquetasGeradas++;
  });

  console.log(`[generateAllLabelsForPrint] Geração de etiquetas para impressão concluída. Total: ${contadorEtiquetasGeradas}`);
}

// Desenha um único card de etiqueta em um container específico.
// Agora recebe o objeto orientador completo e o caixaId opcional para o retângulo branco.
function desenharCard(orientador, combinacao, targetContainer, specificCaixaId = null) {
  console.log(`--- [desenharCard] INÍCIO para ${orientador.nome}, Combinação:`, combinacao, "---");

  const card = document.createElement("div");
  card.classList.add("card");
  console.log("[desenharCard] Card criado.");

  const header = document.createElement("div");
  header.classList.add("header");
  header.innerHTML = `<span class="nome">${orientador.nome}</span><span class="area">${orientador.area}</span>`;
  console.log("[desenharCard] Header criado:", header.innerHTML);

  const etiquetaDiv = document.createElement("div");
  etiquetaDiv.classList.add("etiqueta");
  console.log("[desenharCard] Div de etiqueta criada.");

  // Adiciona os componentes visuais da combinação à etiqueta.
  combinacao.forEach(comp => {
    const el = document.createElement("div");
    el.classList.add(comp.formato); 
    el.style.backgroundColor = comp.cor;
    if (comp.pos) el.classList.add(comp.pos); 
    if (comp.zIndex) el.style.zIndex = comp.zIndex;
    if (comp.classe) el.classList.add(comp.classe); 

    // Se for um retângulo branco, adiciona o ID da caixa como texto.
    // Usa specificCaixaId se fornecido (para impressão), caso contrário, usa o primeiro ID de caixa do orientador.
    if (comp.classe === "retangulo-branco") {
      const caixaIdToDisplay = specificCaixaId || Object.keys(orientador.caixas)[0];
      el.textContent = caixaIdToDisplay; 
      el.style.color = "black"; 
      el.style.display = "flex";
      el.style.justifyContent = "center";
      el.style.alignItems = "center";
      el.style.fontWeight = "bold";
      el.style.fontSize = "1.2em"; // Aumenta o tamanho da fonte para o ID da caixa
    }
    etiquetaDiv.appendChild(el);
    console.log(`[desenharCard] Elemento de etiqueta adicionado: Formato=${comp.formato}, Cor=${comp.cor}, Posição=${comp.pos || 'nenhuma'}`);
  });

  const footer = document.createElement("div");
  footer.classList.add("footer");
  // Formata as informações de quantidade e caixas para o rodapé
  const caixasFormatadas = Object.entries(orientador.caixas)
      .map(([id, count]) => `${count}x C${id}`)
      .join(", ");
  footer.innerHTML = `
    <span class="quantidade-volume">Volume: ${orientador.quantidade} itens</span>
    <span class="caixas-info">Caixas: ${caixasFormatadas}</span>
    <span class="total-caixas">Total de Caixas: ${orientador.totalCaixas}</span>
  `;
  console.log("[desenharCard] Footer criado:", footer.innerHTML);

  // Adiciona as partes ao card.
  card.appendChild(header); 
  card.appendChild(etiquetaDiv); 
  card.appendChild(footer);
  console.log("[desenharCard] Header, etiquetaDiv e footer adicionados ao card.");
  
  targetContainer.appendChild(card); // Adiciona o card ao container especificado.
  console.log("[desenharCard] Card final adicionado ao container principal.");
  console.log(`--- [desenharCard] FIM para ${orientador.nome} ---`);
}

// Limpa todos os dados e etiquetas.
function limparDados() {
  console.log("[limparDados] Limpando todos os dados e etiquetas.");
  showCustomConfirm("Tem certeza que deseja limpar TODOS os dados e etiquetas? Esta ação é irreversível.", () => {
    orientadores = []; // Limpa o array de orientadores.
    usedCombinationIndices = new Set(); // Limpa também os índices usados.
    salvarOrientadores(); // Salva o estado vazio no localStorage.
    updateLista(); // Atualiza a tabela.
    displayOrientadoresLabelsPreview(); // Limpa e atualiza as pré-visualizações.
    // Adicionado: Limpa também o container de impressão
    printContainer.innerHTML = ""; 
    contador.textContent = ""; // Limpa o contador.
    mostrarAlerta("Todos os dados e etiquetas foram limpos.", "info");
  });
}

// --- Funções de Upload de Planilha ---
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        mostrarAlerta("Nenhum arquivo selecionado.", "aviso");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            console.log("[handleFileUpload] Dados da planilha lidos:", json);

            if (json.length === 0) {
                mostrarAlerta("A planilha está vazia ou não contém dados válidos.", "aviso");
                return;
            }

            let orientadoresAdicionados = 0;
            let errosUpload = [];

            json.forEach((row, index) => {
                const nome = row["Nome"] || row["nome"] || "";
                const area = row["Área"] || row["area"] || "";
                const quantidade = row["Quantidade"] || row["quantidade"] || "";

                // Validação básica dos dados da linha da planilha
                if (!nome || !area || !quantidade || isNaN(parseInt(quantidade, 10)) || parseInt(quantidade, 10) <= 0) {
                    errosUpload.push(`Linha ${index + 2}: Dados inválidos (Nome: "${nome}", Área: "${area}", Quantidade: "${quantidade}").`);
                    return; // Pula esta linha
                }

                // Adiciona o orientador, passando os dados diretamente
                // A função adicionarOrientador já lida com validação de duplicidade e cálculo de caixas
                const tempOrientadoresLength = orientadores.length;
                adicionarOrientador(null, { nome: String(nome).trim(), area: String(area).trim(), quantidade: String(quantidade).trim() });
                
                // Verifica se o orientador foi realmente adicionado (não era duplicado, etc.)
                if (orientadores.length > tempOrientadoresLength) {
                    orientadoresAdicionados++;
                }
            });

            salvarOrientadores();
            updateLista();
            displayOrientadoresLabelsPreview();

            if (orientadoresAdicionados > 0) {
                mostrarAlerta(`Planilha carregada com sucesso! ${orientadoresAdicionados} orientadores adicionados.`, "sucesso");
            } else if (errosUpload.length > 0) {
                mostrarAlerta(`Nenhum orientador válido encontrado na planilha. Erros: ${errosUpload.join("; ")}`, "erro");
            } else {
                mostrarAlerta("Nenhum novo orientador foi adicionado da planilha (possíveis duplicatas ou dados inválidos).", "aviso");
            }

            if (errosUpload.length > 0) {
                console.warn("[handleFileUpload] Erros durante o processamento da planilha:", errosUpload);
            }

        } catch (error) {
            console.error("[handleFileUpload] Erro ao processar a planilha:", error);
            mostrarAlerta("Erro ao ler ou processar a planilha. Verifique o formato do arquivo.", "erro");
        } finally {
            event.target.value = ''; // Limpa o input file para permitir o upload do mesmo arquivo novamente
        }
    };
    reader.readAsArrayBuffer(file);
}

// --- Modal de Confirmação Customizado (Substitui confirm()) ---
// Para substituir a função confirm() do navegador, que não é recomendada em iframes.
function showCustomConfirm(message, onConfirm) {
  // Cria um elemento div para o modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  // Cria o conteúdo do modal
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: #34495e;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    text-align: center;
    color: #ecf0f1;
    max-width: 400px;
    width: 90%;
  `;

  const messageText = document.createElement('p');
  messageText.textContent = message;
  messageText.style.cssText = `
    margin-bottom: 25px;
    font-size: 1.1em;
    line-height: 1.5;
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 15px;
  `;

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirmar';
  confirmBtn.style.cssText = `
    background-color: #2ecc71;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;
  `;
  confirmBtn.onmouseover = () => confirmBtn.style.backgroundColor = '#27ae60';
  confirmBtn.onmouseout = () => confirmBtn.style.backgroundColor = '#2ecc71';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.style.cssText = `
    background-color: #e74c3c;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;
  `;
  cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = '#c0392b';
  cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = '#e74c3c';

  confirmBtn.onclick = () => {
    onConfirm();
    document.body.removeChild(modal);
  };

  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  buttonContainer.appendChild(confirmBtn);
  buttonContainer.appendChild(cancelBtn);
  modalContent.appendChild(messageText);
  modalContent.appendChild(buttonContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

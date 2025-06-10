const etiquetasAvancadasConfig = (() => {
  // Define os tipos de componentes visuais (círculos, retângulos) com suas cores e formatos.
  const tipos = {
    CV: { cor: "green", formato: "circulo" },
    CR: { cor: "red", formato: "circulo" },
    RV: { cor: "green", formato: "retangulo" },
    RR: { cor: "red", formato: "retangulo" },
    RAM: { cor: "yellow", formato: "retangulo" },
    RAZ: { cor: "blue", formato: "retangulo" },
    RB: { cor: "white", formato: "retangulo", classe: "retangulo-branco" }, // Retângulo branco especial para texto
  };

  // Função utilitária para clonar objetos, evitando referências diretas.
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const combinacoes = []; // Array que armazenará todas as combinações de etiquetas.

  // Função para adicionar uma nova combinação ao array 'combinacoes'.
  // Recebe múltiplos componentes e os clona, aplicando posições e z-index se especificados.
  function add(...components) {
    const base = components.map(comp => {
      let el = clone(tipos[comp.tipo]);
      if (comp.pos) el.pos = comp.pos;
      if (comp.zIndex) el.zIndex = comp.zIndex;
      if (comp.classe) el.classe = comp.classe;
      return el;
    });
    combinacoes.push(base);
  }

  // Listas de tipos para facilitar a criação de combinações.
  const coresRetangulares = ["green", "red", "yellow", "blue", "white"];
  const tiposRetangulares = ["RV", "RR", "RAM", "RAZ", "RB"];
  const circulares = ["CV", "CR"];

  // --- Definição das Combinações de Etiquetas ---

  // 1. Combinações de elementos "Solo" (um único componente na etiqueta)
  [...circulares, ...tiposRetangulares]
  .filter(tipo => tipo !== "RB") // O retângulo branco (RB) não deve aparecer sozinho.
  .forEach(tipo => add({ tipo }));


  // 2. Combinações de dois retângulos lado a lado (com cores diferentes)
  // Itera sobre todos os pares possíveis de retângulos.
  for (let i = 0; i < tiposRetangulares.length; i++) {
    for (let j = i + 1; j < tiposRetangulares.length; j++) {
      // Garante que as cores dos dois retângulos sejam diferentes para evitar redundância visual.
      if (tipos[tiposRetangulares[i]].cor !== tipos[tiposRetangulares[j]].cor) {
        add(
          { tipo: tiposRetangulares[i], pos: "retangulo-esquerda" }, // Retângulo na posição esquerda
          { tipo: tiposRetangulares[j], pos: "retangulo-direita" }  // Retângulo na posição direita
        );
      }
    }
  }

  // 3. Combinações de um círculo com um retângulo (com cores diferentes)
  // Itera sobre cada círculo disponível.
  circulares.forEach(circ => {
    const corCirc = tipos[circ].cor; // Pega a cor do círculo.
    tiposRetangulares.forEach(ret => {
      // Garante que a cor do retângulo seja diferente da cor do círculo.
      if (tipos[ret].cor !== corCirc) {
        add(
          { tipo: circ, zIndex: 1 }, // Círculo no fundo (z-index 1)
          { tipo: ret, pos: "sobre_circulo_primario", zIndex: 2 } // Retângulo sobre o círculo (z-index 2)
        );
      }
    });
  });

  // 4. Combinações de um círculo com dois retângulos (todas as três cores devem ser diferentes)
  // Itera sobre cada círculo disponível.
  circulares.forEach(circ => {
    const corCirc = tipos[circ].cor; // Pega a cor do círculo.
    // Itera sobre todos os pares possíveis de retângulos.
    for (let i = 0; i < tiposRetangulares.length; i++) {
      for (let j = 0; j < tiposRetangulares.length; j++) {
        // Evita usar o mesmo retângulo duas vezes.
        if (i === j) continue; 

        const cor1 = tipos[tiposRetangulares[i]].cor; // Cor do primeiro retângulo.
        const cor2 = tipos[tiposRetangulares[j]].cor; // Cor do segundo retângulo.

        const coresSet = new Set([corCirc, cor1, cor2]); // Cria um Set para verificar cores únicas.

        // Se o Set tiver 3 elementos, significa que todas as cores são diferentes.
        if (coresSet.size === 3) {
          add(
            { tipo: circ, zIndex: 1 }, // Círculo no fundo.
            {
              tipo: tiposRetangulares[i],
              pos: "retangulo-superior", // Primeiro retângulo na parte superior.
              zIndex: 2,
              classe: "retangulo-superior",
            },
            {
              tipo: tiposRetangulares[j],
              pos: "retangulo-inferior", // Segundo retângulo na parte inferior.
              zIndex: 2,
              classe: "retangulo-inferior",
            }
          );
        }
      }
    }
  });

  return combinacoes; // Retorna o array de combinações.
})();

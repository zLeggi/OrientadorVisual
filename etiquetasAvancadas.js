const etiquetasAvancadasConfig = (() => {
  const tipos = {
    CV: { cor: "green", formato: "circulo" },
    CR: { cor: "red", formato: "circulo" },
    RV: { cor: "green", formato: "retangulo" },
    RR: { cor: "red", formato: "retangulo" },
    RAM: { cor: "yellow", formato: "retangulo" },
    RAZ: { cor: "blue", formato: "retangulo" },
    RB: { cor: "white", formato: "retangulo", classe: "retangulo-branco" },
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const combinacoes = [];

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

  const coresRetangulares = ["green", "red", "yellow", "blue", "white"];
  const tiposRetangulares = ["RV", "RR", "RAM", "RAZ", "RB"];
  const circulares = ["CV", "CR"];

  // 1. Solo
  [...circulares, ...tiposRetangulares]
  .filter(tipo => tipo !== "RB") // Não deixa RB sozinho!
  .forEach(tipo => add({ tipo }));


  // 2. Retângulos lado a lado (cores diferentes)
  for (let i = 0; i < tiposRetangulares.length; i++) {
    for (let j = i + 1; j < tiposRetangulares.length; j++) {
      add(
        { tipo: tiposRetangulares[i], pos: "retangulo-esquerda" },
        { tipo: tiposRetangulares[j], pos: "retangulo-direita" }
      );
    }
  }

  // 3. Círculo + 1 retângulo (sem repetir cor)
  circulares.forEach(circ => {
    const corCirc = tipos[circ].cor;
    tiposRetangulares.forEach(ret => {
      if (tipos[ret].cor !== corCirc) {
        add(
          { tipo: circ, zIndex: 1 },
          { tipo: ret, pos: "sobre_circulo_primario", zIndex: 2 }
        );
      }
    });
  });

  // 4. Círculo + 2 retângulos (todas cores diferentes entre si)
  circulares.forEach(circ => {
    const corCirc = tipos[circ].cor;
    for (let i = 0; i < tiposRetangulares.length; i++) {
      for (let j = 0; j < tiposRetangulares.length; j++) {
        const cor1 = tipos[tiposRetangulares[i]].cor;
        const cor2 = tipos[tiposRetangulares[j]].cor;

        const coresSet = new Set([corCirc, cor1, cor2]);

        if (coresSet.size === 3) {
          add(
            { tipo: circ, zIndex: 1 },
            {
              tipo: tiposRetangulares[i],
              pos: "retangulo-superior",
              zIndex: 2,
              classe: "retangulo-superior",
            },
            {
              tipo: tiposRetangulares[j],
              pos: "retangulo-inferior",
              zIndex: 2,
              classe: "retangulo-inferior",
            }
          );
        }
      }
    }
  });

  return combinacoes;
})();

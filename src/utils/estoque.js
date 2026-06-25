const LIMITE_ESTOQUE_CRITICO = 10;

function obterQuantidadeMaterial(material) {
  return Number(material?.quantidade ?? 0);
}

function obterNomeMaterial(material) {
  return String(material?.nome ?? material?.name ?? 'Material');
}

function isEstoqueCritico(material, limite = LIMITE_ESTOQUE_CRITICO) {
  const quantidade = obterQuantidadeMaterial(material);

  return Number.isFinite(quantidade) && quantidade < limite;
}

module.exports = {
  LIMITE_ESTOQUE_CRITICO,
  obterNomeMaterial,
  obterQuantidadeMaterial,
  isEstoqueCritico,
};

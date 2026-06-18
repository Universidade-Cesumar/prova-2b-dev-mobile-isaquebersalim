function validarRetirada(estoqueAtual, quantidadeRetirada) {
  const estoque = Number(estoqueAtual);
  const retirada = Number(quantidadeRetirada);

  if (!Number.isFinite(estoque) || !Number.isFinite(retirada)) {
    return false;
  }

  return estoque >= 0 && retirada > 0 && retirada <= estoque;
}

module.exports = {
  validarRetirada,
};

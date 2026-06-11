function validarRetirada(estoqueAtual, quantidadeRetirada) {
  const estoque = Number(estoqueAtual);
  const retirada = Number(quantidadeRetirada);

  return retirada > 0 && retirada <= estoque;
}

module.exports = {
  validarRetirada,
};

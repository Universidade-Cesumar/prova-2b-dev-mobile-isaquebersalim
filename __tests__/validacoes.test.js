const { validarRetirada } = require('../src/utils/validacoes');

describe('validarRetirada', () => {
  test('aceita numeros informados como texto', () => {
    expect(validarRetirada('10', '4')).toBe(true);
  });

  test('rejeita valores nao numericos ou infinitos', () => {
    expect(validarRetirada('dez', 2)).toBe(false);
    expect(validarRetirada(10, 'duas')).toBe(false);
    expect(validarRetirada(Infinity, 1)).toBe(false);
  });

  test('rejeita estoque negativo', () => {
    expect(validarRetirada(-1, 1)).toBe(false);
  });
});

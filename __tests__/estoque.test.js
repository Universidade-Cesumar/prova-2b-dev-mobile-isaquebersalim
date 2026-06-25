const {
  LIMITE_ESTOQUE_CRITICO,
  isEstoqueCritico,
  obterNomeMaterial,
  obterQuantidadeMaterial,
} = require('../src/utils/estoque');

describe('regras de estoque', () => {
  test('identifica materiais abaixo do limite critico', () => {
    expect(isEstoqueCritico({ quantidade: 9 })).toBe(true);
    expect(isEstoqueCritico({ quantidade: '1' })).toBe(true);
  });

  test('nao marca como critico quando a quantidade atinge o limite', () => {
    expect(isEstoqueCritico({ quantidade: LIMITE_ESTOQUE_CRITICO })).toBe(false);
    expect(isEstoqueCritico({ quantidade: 25 })).toBe(false);
  });

  test('normaliza nome e quantidade vindos da API', () => {
    const material = { name: 'Luva', quantidade: '12' };

    expect(obterNomeMaterial(material)).toBe('Luva');
    expect(obterQuantidadeMaterial(material)).toBe(12);
  });
});

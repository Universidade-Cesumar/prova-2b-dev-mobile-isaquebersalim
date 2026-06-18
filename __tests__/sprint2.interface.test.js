const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.resolve(__dirname, '../App.js'), 'utf8');

describe('contrato de interface da Sprint 2', () => {
  test('mantem os testIDs obrigatorios por material', () => {
    expect(appSource).toContain('testID="input-retirada"');
    expect(appSource).toContain('testID="btn-baixar"');
    expect(appSource).toContain('testID="btn-excluir"');
  });

  test('usa PUT para atualizar o estoque na MockAPI', () => {
    expect(appSource).toContain("method: 'PUT'");
    expect(appSource).toContain('quantidade: novaQuantidade');
  });

  test('usa DELETE e remove o material do estado local', () => {
    expect(appSource).toContain("method: 'DELETE'");
    expect(appSource).toContain("Alert.alert('Excluir material'");
    expect(appSource).toContain('globalThis.confirm(mensagemConfirmacao)');
    expect(appSource).toContain(
      'estoqueAtual.filter((item) => item.id !== material.id)',
    );
  });
});

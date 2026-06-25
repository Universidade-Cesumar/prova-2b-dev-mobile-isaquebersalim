import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, fireEvent } from '@testing-library/react-native';
import App from '../App';
import { isEstoqueCritico } from '../src/utils/estoque';

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.js'), 'utf8');

describe('Sprint 3 - Dashboard e alertas', () => {
  test('deve conter o campo de busca e o totalizador de itens', () => {
    const { getByTestId } = render(<App />);

    expect(getByTestId('input-busca')).toBeTruthy();
    expect(getByTestId('total-itens')).toBeTruthy();
  });

  test('campo de busca deve aceitar digitacao para filtragem dinamica', () => {
    const { getByTestId } = render(<App />);
    const inputBusca = getByTestId('input-busca');

    fireEvent.changeText(inputBusca, 'Luva');
    expect(inputBusca.props.value).toBe('Luva');
  });

  test('deve declarar o alerta visual obrigatorio para estoque critico', () => {
    expect(isEstoqueCritico({ quantidade: 9 })).toBe(true);
    expect(appSource).toContain("ACESSIBILIDADE_ESTOQUE_CRITICO = 'estoque-critico'");
    expect(appSource).toContain('styles.materialItemCritico');
  });
});

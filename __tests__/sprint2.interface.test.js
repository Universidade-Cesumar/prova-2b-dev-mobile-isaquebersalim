import React from 'react';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import App from '../App';

const API_URL = 'https://6a2b395ab687a7d5cbc4f9df.mockapi.io/materiais';
const material = {
  id: '1',
  nome: 'Luva de procedimento',
  quantidade: 10,
};

jest.setTimeout(15000);

const criarResposta = (dados) => ({
  ok: true,
  json: async () => dados,
});

describe('acoes de estoque da Sprint 2', () => {
  const fetchOriginal = global.fetch;
  const consoleErrorOriginal = console.error;

  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation((mensagem, ...detalhes) => {
      if (String(mensagem).includes('not wrapped in act')) {
        return;
      }

      consoleErrorOriginal(mensagem, ...detalhes);
    });
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  afterAll(() => {
    global.fetch = fetchOriginal;
  });

  test('exibe os controles obrigatorios em cada material', async () => {
    global.fetch.mockResolvedValueOnce(criarResposta([material]));

    const { getByTestId, getByText } = render(<App />);

    await waitFor(() => expect(getByText(material.nome)).toBeTruthy());

    expect(getByTestId('input-retirada')).toBeTruthy();
    expect(getByTestId('btn-baixar')).toBeTruthy();
    expect(getByTestId('btn-excluir')).toBeTruthy();
  });

  test('envia PUT e atualiza o saldo local', async () => {
    global.fetch
      .mockResolvedValueOnce(criarResposta([material]))
      .mockResolvedValueOnce(
        criarResposta({
          ...material,
          quantidade: 7,
        }),
      );

    const { getByTestId, getByText } = render(<App />);

    await waitFor(() => expect(getByText(material.nome)).toBeTruthy());

    fireEvent.changeText(getByTestId('input-retirada'), '3');
    fireEvent(getByTestId('btn-baixar'), 'onPress');

    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        `${API_URL}/${material.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ quantidade: 7 }),
        }),
      ),
    );

    await waitFor(() => expect(getByText('7')).toBeTruthy());
  });

  test('envia DELETE e remove o material da lista', async () => {
    global.fetch
      .mockResolvedValueOnce(criarResposta([material]))
      .mockResolvedValueOnce(criarResposta(material));

    const { getByTestId, getByText, queryByText } = render(<App />);

    await waitFor(() => expect(getByText(material.nome)).toBeTruthy());

    fireEvent(getByTestId('btn-excluir'), 'onPress');

    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        `${API_URL}/${material.id}`,
        { method: 'DELETE' },
      ),
    );

    await waitFor(() => expect(queryByText(material.nome)).toBeNull());
  });
});

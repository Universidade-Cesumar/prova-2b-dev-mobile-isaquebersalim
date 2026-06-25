[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/jOw_Hzd7)

# SysAlmoxarifado

Aplicativo mobile para controle inicial de estoque do almoxarifado de enfermagem.

## Funcionalidades

- Lista de materiais cadastrados em uma lista com rolagem.
- Cadastro de novos materiais com nome e quantidade.
- Consumo da MockAPI para buscar e salvar dados.
- Busca simples para filtrar materiais pelo nome.
- Baixa rapida de estoque diretamente em cada material.
- Exclusao permanente de materiais no servidor.
- Bloqueio de retiradas invalidas ou maiores que o saldo atual.
- Filtro de pesquisa em tempo real por nome do material.
- Dashboard com total de itens listados, unidades e itens criticos.
- Alerta visual para materiais com quantidade menor que 10.
- Tratamento amigavel para falhas de conexao com a API.

## Contrato da Sprint 1

Componentes obrigatorios implementados:

- `input-nome`: campo de texto para nome do material.
- `input-quantidade`: campo numerico para quantidade.
- `btn-cadastrar`: botao para envio do cadastro.
- `lista-materiais`: lista dinamica com os materiais da API.

## Contrato da Sprint 2

Cada material da lista possui:

- `input-retirada`: quantidade que sera retirada do estoque.
- `btn-baixar`: confirma a baixa e envia uma requisicao `PUT`.
- `btn-excluir`: exclui o material por meio de uma requisicao `DELETE`.

A funcao pura `validarRetirada(estoqueAtual, quantidadeRetirada)` esta em
`src/utils/validacoes.js`. Ela impede quantidades negativas, zeradas, nao
numericas ou superiores ao estoque atual.

## Contrato da Sprint 3

Componentes e comportamentos obrigatorios:

- `input-busca`: campo de pesquisa em tempo real.
- `total-itens`: totalizador que acompanha a lista filtrada.
- `accessibilityLabel="estoque-critico"`: aplicado dinamicamente ao card de materiais com quantidade menor que 10.
- Blocos `try/catch`: usados nas requisicoes `GET`, `POST`, `PUT` e `DELETE` para manter a tela estavel em caso de falha de rede.

## Tecnologias

- React Native
- Expo
- JavaScript
- MockAPI
- Jest

## MockAPI

Endpoint usado no projeto:

```txt
https://6a2b395ab687a7d5cbc4f9df.mockapi.io/materiais
```

Modelo minimo enviado no cadastro:

```json
{
  "nome": "Seringa 10ml",
  "quantidade": 50
}
```

Operacoes utilizadas:

- `GET /materiais`: carrega o inventario.
- `POST /materiais`: cadastra um novo material.
- `PUT /materiais/:id`: atualiza o saldo depois de uma retirada.
- `DELETE /materiais/:id`: remove um material permanentemente.

## Como rodar

Instale as dependencias:

```bash
npm install
```

Inicie o Expo para abrir o QR Code:

```bash
npm start
```

Para testar no celular:

1. Instale o aplicativo Expo Go no Android ou iOS.
2. Mantenha o celular e o computador na mesma rede Wi-Fi.
3. Execute `npm start`.
4. Escaneie o QR Code exibido no terminal ou na pagina do Expo.

Para testar no navegador:

```bash
npm run web
```

Para executar os testes:

```bash
npm test
```

A suite automatizada cobre as regras de retirada, o contrato visual da
Sprint 3 e os fluxos de `PUT` e `DELETE`.

## Roteiro de verificacao

- Abrir o aplicativo e conferir se a lista carrega os materiais da MockAPI.
- Digitar no campo `Buscar material` e verificar o total em `total-itens`.
- Conferir se itens com quantidade menor que 10 ficam destacados como estoque critico.
- Cadastrar um material novo e verificar se ele aparece na lista.
- Informar uma quantidade de retirada valida e confirmar a baixa.
- Tentar retirar uma quantidade maior que o saldo e conferir o bloqueio.
- Excluir um material somente depois da confirmacao.

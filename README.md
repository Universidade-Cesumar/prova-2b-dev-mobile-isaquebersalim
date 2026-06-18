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

## Contrato da Sprint 1

Componentes obrigatorios implementados:

- `input-nome`: campo de texto para nome do material.
- `input-quantidade`: campo numerico para quantidade.
- `btn-cadastrar`: botao para envio do cadastro.
- `lista-materiais`: lista dinamica com os materiais da API.

## Contrato da Sprint 2

Cada material da lista possui:

- `input-retirada`: quantidade que sera retirada do estoque.
- `btn-baixar`: confirma a baixa e envia uma requisicao `PATCH`.
- `btn-excluir`: exclui o material por meio de uma requisicao `DELETE`.

A funcao pura `validarRetirada(estoqueAtual, quantidadeRetirada)` esta em
`src/utils/validacoes.js`. Ela impede quantidades negativas, zeradas, nao
numericas ou superiores ao estoque atual.

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
- `PATCH /materiais/:id`: atualiza o saldo depois de uma retirada.
- `DELETE /materiais/:id`: remove um material permanentemente.

## Como rodar

Instale as dependencias:

```bash
npm install
```

Inicie o Expo:

```bash
npm start
```

Para testar no celular, abra o aplicativo Expo Go e escaneie o QR Code exibido no terminal.
O celular e o computador precisam estar conectados na mesma rede.

Para executar os testes:

```bash
npm test
```

A suite automatizada cobre as regras de retirada e os fluxos de `PATCH` e
`DELETE` da Sprint 2.

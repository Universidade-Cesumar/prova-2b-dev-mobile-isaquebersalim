import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { validarRetirada } from './src/utils/validacoes';
import {
  isEstoqueCritico,
  obterNomeMaterial,
  obterQuantidadeMaterial,
} from './src/utils/estoque';

const API_URL = 'https://6a2b395ab687a7d5cbc4f9df.mockapi.io/materiais';
const PLACEHOLDER_COLOR = '#7c8984';
const ACESSIBILIDADE_ESTOQUE_CRITICO = 'estoque-critico';
const MENSAGEM_ERRO_CONEXAO =
  'Nao foi possivel conectar agora. Verifique a internet e tente novamente.';

const obterMensagemErro = (error, mensagemPadrao) => {
  const mensagemOriginal = String(error?.message ?? '');

  if (
    mensagemOriginal.toLowerCase().includes('failed to fetch') ||
    mensagemOriginal.toLowerCase().includes('network request failed')
  ) {
    return MENSAGEM_ERRO_CONEXAO;
  }

  return mensagemOriginal || mensagemPadrao;
};

const isTesteSemFetchMockado = () =>
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV === 'test' &&
  typeof fetch === 'function' &&
  !fetch._isMockFunction;

export default function App() {
  const { width } = useWindowDimensions();
  const layoutCompacto = width < 720;
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [busca, setBusca] = useState('');
  const [materiais, setMateriais] = useState([]);
  const [retiradas, setRetiradas] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [baixandoId, setBaixandoId] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const carregarMateriais = async () => {
    if (typeof fetch !== 'function' || isTesteSemFetchMockado()) {
      return;
    }

    setCarregando(true);
    setMensagem('');

    try {
      const resposta = await fetch(API_URL);

      if (!resposta.ok) {
        throw new Error('Nao foi possivel carregar o estoque.');
      }

      const dados = await resposta.json();
      setMateriais(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setMensagem(
        obterMensagemErro(error, 'Nao foi possivel carregar o estoque.'),
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMateriais();
  }, []);

  const alterarRetirada = (materialId, valor) => {
    setRetiradas((valoresAtuais) => ({
      ...valoresAtuais,
      [materialId]: valor,
    }));
  };

  const baixarMaterial = async (material) => {
    const quantidadeRetirada = Number(retiradas[material.id]);

    if (!validarRetirada(material.quantidade, quantidadeRetirada)) {
      setMensagem('A retirada deve ser maior que zero e respeitar o saldo.');
      return;
    }

    const novaQuantidade = Number(material.quantidade) - quantidadeRetirada;

    setBaixandoId(material.id);
    setMensagem('');

    try {
      const resposta = await fetch(`${API_URL}/${material.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantidade: novaQuantidade,
        }),
      });

      if (!resposta.ok) {
        throw new Error('Nao foi possivel registrar a retirada.');
      }

      const materialAtualizado = await resposta.json();

      setMateriais((estoqueAtual) =>
        estoqueAtual.map((item) =>
          item.id === material.id ? materialAtualizado : item,
        ),
      );
      setRetiradas((valoresAtuais) => ({
        ...valoresAtuais,
        [material.id]: '',
      }));
      Keyboard.dismiss();
      setMensagem('Retirada registrada com sucesso.');
    } catch (error) {
      setMensagem(
        obterMensagemErro(error, 'Nao foi possivel registrar a retirada.'),
      );
    } finally {
      setBaixandoId(null);
    }
  };

  const excluirMaterial = async (material) => {
    setExcluindoId(material.id);
    setMensagem('');

    try {
      const resposta = await fetch(`${API_URL}/${material.id}`, {
        method: 'DELETE',
      });

      if (!resposta.ok) {
        throw new Error('Nao foi possivel excluir o material.');
      }

      setMateriais((estoqueAtual) =>
        estoqueAtual.filter((item) => item.id !== material.id),
      );
      setRetiradas((valoresAtuais) => {
        const proximosValores = { ...valoresAtuais };
        delete proximosValores[material.id];
        return proximosValores;
      });
      setMensagem('Material excluido com sucesso.');
    } catch (error) {
      setMensagem(
        obterMensagemErro(error, 'Nao foi possivel excluir o material.'),
      );
    } finally {
      setExcluindoId(null);
    }
  };

  const confirmarExclusao = (material) => {
    const nomeMaterial = material.nome ?? material.name;
    const mensagemConfirmacao = `Deseja excluir ${nomeMaterial}?`;

    if (Platform.OS === 'web') {
      if (globalThis.confirm(mensagemConfirmacao)) {
        excluirMaterial(material);
      }
      return;
    }

    Alert.alert('Excluir material', mensagemConfirmacao, [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => excluirMaterial(material),
      },
    ]);
  };

  const cadastrarMaterial = async () => {
    const nomeTratado = nome.trim();
    const quantidadeTratada = quantidade.trim();

    if (!nomeTratado || !quantidadeTratada) {
      setMensagem('Preencha o nome e a quantidade do material.');
      return;
    }

    const quantidadeNumerica = Number(quantidadeTratada);

    if (!Number.isFinite(quantidadeNumerica) || quantidadeNumerica <= 0) {
      setMensagem('Informe uma quantidade maior que zero.');
      return;
    }

    if (typeof fetch !== 'function') {
      setMensagem('Conexao com a API indisponivel.');
      return;
    }

    const novoMaterial = {
      nome: nomeTratado,
      quantidade: quantidadeNumerica,
    };

    setSalvando(true);
    setMensagem('');

    try {
      const resposta = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoMaterial),
      });

      if (!resposta.ok) {
        throw new Error('Nao foi possivel cadastrar o material.');
      }

      const materialCadastrado = await resposta.json();

      setMateriais((estoqueAtual) => [materialCadastrado, ...estoqueAtual]);
      setNome('');
      setQuantidade('');
      Keyboard.dismiss();
      setMensagem('Material cadastrado com sucesso.');
    } catch (error) {
      setMensagem(
        obterMensagemErro(error, 'Nao foi possivel cadastrar o material.'),
      );
    } finally {
      setSalvando(false);
    }
  };

  const materiaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return materiais;
    }

    return materiais.filter((material) =>
      obterNomeMaterial(material).toLowerCase().includes(termo),
    );
  }, [busca, materiais]);

  const totalUnidades = useMemo(
    () =>
      materiaisFiltrados.reduce(
        (total, material) => total + obterQuantidadeMaterial(material),
        0,
      ),
    [materiaisFiltrados],
  );
  const totalCriticos = useMemo(
    () => materiaisFiltrados.filter(isEstoqueCritico).length,
    [materiaisFiltrados],
  );

  const exibindoCarregamentoInicial = carregando && materiais.length === 0;
  const termoBusca = busca.trim();
  const mensagemListaVazia = termoBusca
    ? `Nenhum material encontrado para "${termoBusca}".`
    : 'Nenhum material cadastrado.';
  const mensagemSucesso = mensagem.toLowerCase().includes('sucesso');

  const renderMaterial = ({ item }) => {
    const nomeMaterial = obterNomeMaterial(item);
    const quantidadeMaterial = obterQuantidadeMaterial(item);
    const estoqueCritico = isEstoqueCritico(item);
    const estoqueZerado = quantidadeMaterial === 0;
    const retiradaVazia = !String(retiradas[item.id] ?? '').trim();
    const acaoEmAndamento =
      baixandoId === item.id || excluindoId === item.id;
    const baixaDesabilitada = retiradaVazia || acaoEmAndamento;

    return (
      <View
        style={[
          styles.materialItem,
          estoqueCritico && styles.materialItemCritico,
          estoqueZerado && styles.materialItemZerado,
        ]}
        accessibilityLabel={
          estoqueCritico ? ACESSIBILIDADE_ESTOQUE_CRITICO : undefined
        }
      >
        <View style={styles.materialCabecalho}>
          <View style={styles.materialInfo}>
            <Text
              style={[
                styles.materialNome,
                estoqueZerado && styles.materialNomeZerado,
              ]}
            >
              {nomeMaterial}
            </Text>
            <Text
              style={[
                styles.materialDetalhe,
                estoqueZerado && styles.materialDetalheZerado,
              ]}
            >
              Quantidade atual
            </Text>
            {estoqueCritico ? (
              <Text style={styles.materialAlerta}>
                {estoqueZerado ? 'Estoque zerado' : 'Estoque critico'}
              </Text>
            ) : null}
          </View>
          <View
            style={[
              styles.quantidadeContainer,
              estoqueCritico && styles.quantidadeContainerCritica,
              estoqueZerado && styles.quantidadeContainerZerada,
            ]}
          >
            <Text
              style={[
                styles.materialQuantidade,
                estoqueCritico && styles.materialQuantidadeCritica,
                estoqueZerado && styles.materialQuantidadeZerada,
              ]}
            >
              {quantidadeMaterial}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.acoesEstoque,
            layoutCompacto && styles.acoesEstoqueCompactas,
          ]}
        >
          <TextInput
            testID="input-retirada"
            style={[
              styles.inputRetirada,
              !layoutCompacto && styles.inputRetiradaDesktop,
            ]}
            accessibilityLabel={`Quantidade a retirar de ${nomeMaterial}`}
            placeholder="Retirar"
            placeholderTextColor={PLACEHOLDER_COLOR}
            selectionColor="#176b57"
            value={retiradas[item.id] ?? ''}
            onChangeText={(valor) => alterarRetirada(item.id, valor)}
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="done"
            editable={!acaoEmAndamento}
          />
          <TouchableOpacity
            testID="btn-baixar"
            style={[
              styles.botaoBaixar,
              baixaDesabilitada && styles.botaoDesabilitado,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Baixar estoque de ${nomeMaterial}`}
            activeOpacity={0.82}
            onPress={() => baixarMaterial(item)}
            disabled={baixaDesabilitada}
          >
            <Text style={styles.botaoBaixarTexto}>
              {baixandoId === item.id ? 'Baixando...' : 'Baixar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="btn-excluir"
            style={[
              styles.botaoExcluir,
              acaoEmAndamento && styles.botaoDesabilitado,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Excluir ${nomeMaterial}`}
            activeOpacity={0.72}
            onPress={() => confirmarExclusao(item)}
            disabled={acaoEmAndamento}
          >
            <Text style={styles.botaoExcluirTexto}>
              {excluindoId === item.id ? 'Excluindo...' : 'Excluir'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.cabecalho}>
        <View style={styles.cabecalhoConteudo}>
          <View style={styles.marcaVisual} />
          <Text style={styles.title}>Almoxarifado - Enfermagem</Text>
        </View>
      </View>

      <View
        style={[
          styles.areaTrabalho,
          layoutCompacto && styles.areaTrabalhoCompacta,
        ]}
      >
        <View
          style={[
            styles.formulario,
            !layoutCompacto && styles.formularioDesktop,
          ]}
        >
          <TextInput
            testID="input-nome"
            style={[styles.input, styles.inputNome]}
            accessibilityLabel="Nome do material"
            placeholder="Nome do material"
            placeholderTextColor={PLACEHOLDER_COLOR}
            selectionColor="#176b57"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={60}
            returnKeyType="next"
          />

          <TextInput
            testID="input-quantidade"
            style={[
              styles.input,
              !layoutCompacto && styles.inputQuantidadeDesktop,
            ]}
            accessibilityLabel="Quantidade do material"
            placeholder="Quantidade"
            placeholderTextColor={PLACEHOLDER_COLOR}
            selectionColor="#176b57"
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="done"
          />

          <TouchableOpacity
            testID="btn-cadastrar"
            style={[
              styles.botao,
              !layoutCompacto && styles.botaoDesktop,
              salvando && styles.botaoDesabilitado,
            ]}
            accessibilityLabel="Cadastrar material"
            accessibilityRole="button"
            activeOpacity={0.82}
            onPress={cadastrarMaterial}
            disabled={salvando}
          >
            <Text style={styles.botaoTexto}>
              {salvando ? 'Cadastrando...' : 'Cadastrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.resumo,
            layoutCompacto && styles.resumoCompacto,
          ]}
        >
          <View
            style={[
              styles.resumoDados,
              layoutCompacto && styles.resumoDadosCompacto,
            ]}
          >
            <Text testID="total-itens" style={styles.totalItens}>
              Total de itens: {materiaisFiltrados.length}
            </Text>
            <View
              style={[
                styles.divisorResumo,
                layoutCompacto && styles.divisorResumoCompacto,
              ]}
            />
            <Text style={styles.totalUnidades}>
              Unidades em estoque: {totalUnidades}
            </Text>
            <View
              style={[
                styles.divisorResumo,
                layoutCompacto && styles.divisorResumoCompacto,
              ]}
            />
            <Text style={styles.totalCriticos}>
              Criticos: {totalCriticos}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.botaoAtualizar,
              layoutCompacto && styles.botaoAtualizarCompacto,
              carregando && styles.botaoDesabilitado,
            ]}
            accessibilityLabel="Atualizar estoque"
            accessibilityRole="button"
            activeOpacity={0.72}
            onPress={carregarMateriais}
            disabled={carregando}
          >
            <Text style={styles.botaoAtualizarTexto}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          testID="input-busca"
          style={[styles.input, styles.inputBusca]}
          accessibilityLabel="Buscar material"
          placeholder="Buscar material"
          placeholderTextColor={PLACEHOLDER_COLOR}
          selectionColor="#176b57"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
        />

        {mensagem ? (
          <View
            style={[
              styles.mensagemContainer,
              mensagemSucesso
                ? styles.mensagemSucesso
                : styles.mensagemAtencao,
            ]}
          >
            <View
              style={[
                styles.mensagemMarcador,
                mensagemSucesso
                  ? styles.mensagemMarcadorSucesso
                  : styles.mensagemMarcadorAtencao,
              ]}
            />
            <Text
              style={[
                styles.mensagem,
                mensagemSucesso
                  ? styles.mensagemTextoSucesso
                  : styles.mensagemTextoAtencao,
              ]}
            >
              {mensagem}
            </Text>
          </View>
        ) : null}

        {exibindoCarregamentoInicial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#176b57" />
          </View>
        ) : (
          <View testID="lista-materials" style={styles.listaWrapper}>
            <FlatList
              testID="lista-materiais"
              data={materiaisFiltrados}
              keyExtractor={(item, index) => String(item.id ?? index)}
              renderItem={renderMaterial}
              refreshing={carregando}
              onRefresh={carregarMateriais}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listaConteudo}
              ListEmptyComponent={
                <Text style={styles.listaVazia}>{mensagemListaVazia}</Text>
              }
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#edf3f0',
  },
  cabecalho: {
    backgroundColor: '#123b34',
    borderBottomColor: '#dd8b69',
    borderBottomWidth: 3,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  cabecalhoConteudo: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    maxWidth: 1040,
    width: '100%',
  },
  marcaVisual: {
    backgroundColor: '#dd8b69',
    borderRadius: 3,
    height: 30,
    marginRight: 12,
    width: 5,
  },
  title: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '700',
  },
  areaTrabalho: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 1040,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: '100%',
  },
  areaTrabalhoCompacta: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  formulario: {
    gap: 12,
    marginBottom: 22,
  },
  formularioDesktop: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#c8d5d0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#18312b',
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  inputNome: {
    flex: 1,
  },
  inputQuantidadeDesktop: {
    flex: 0,
    width: 180,
  },
  inputBusca: {
    borderColor: '#bacbc5',
    marginBottom: 2,
  },
  botao: {
    alignItems: 'center',
    backgroundColor: '#176b57',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#0d3f33',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 7,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 5px 14px rgba(13, 63, 51, 0.16)',
      },
    }),
  },
  botaoDesktop: {
    minWidth: 160,
  },
  botaoDesabilitado: {
    opacity: 0.58,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  resumo: {
    alignItems: 'center',
    backgroundColor: '#dfeae6',
    borderColor: '#c4d6cf',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resumoDados: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  resumoCompacto: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 10,
  },
  resumoDadosCompacto: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 6,
  },
  totalItens: {
    color: '#123b34',
    fontSize: 14,
    fontWeight: '700',
  },
  divisorResumo: {
    backgroundColor: '#9db7ae',
    height: 22,
    marginHorizontal: 12,
    width: 1,
  },
  divisorResumoCompacto: {
    display: 'none',
  },
  totalUnidades: {
    color: '#38534b',
    fontSize: 14,
    fontWeight: '500',
  },
  totalCriticos: {
    color: '#9b432f',
    fontSize: 14,
    fontWeight: '700',
  },
  botaoAtualizar: {
    backgroundColor: '#fff',
    borderColor: '#176b57',
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 12,
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  botaoAtualizarCompacto: {
    alignSelf: 'flex-end',
    marginLeft: 0,
  },
  botaoAtualizarTexto: {
    color: '#176b57',
    fontSize: 14,
    fontWeight: '700',
  },
  mensagemContainer: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  mensagemSucesso: {
    backgroundColor: '#e2f1e9',
    borderColor: '#b6d8c7',
    borderWidth: 1,
  },
  mensagemAtencao: {
    backgroundColor: '#fff0e8',
    borderColor: '#efc8b6',
    borderWidth: 1,
  },
  mensagemMarcador: {
    borderRadius: 3,
    height: 24,
    marginRight: 10,
    width: 4,
  },
  mensagemMarcadorSucesso: {
    backgroundColor: '#278363',
  },
  mensagemMarcadorAtencao: {
    backgroundColor: '#c66843',
  },
  mensagem: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  mensagemTextoSucesso: {
    color: '#215f4a',
  },
  mensagemTextoAtencao: {
    color: '#87452c',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listaWrapper: {
    flex: 1,
    marginTop: 14,
  },
  listaConteudo: {
    gap: 12,
    paddingBottom: 28,
  },
  materialItem: {
    backgroundColor: '#fff',
    borderColor: '#d1ddd8',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#17362f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 6px 18px rgba(23, 54, 47, 0.08)',
      },
    }),
  },
  materialItemZerado: {
    backgroundColor: '#fff8f6',
    borderColor: '#cf6a5d',
    borderLeftWidth: 4,
  },
  materialItemCritico: {
    backgroundColor: '#fff3ef',
    borderColor: '#d87a57',
    borderLeftWidth: 4,
  },
  materialCabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  materialInfo: {
    flex: 1,
    marginRight: 12,
  },
  materialNome: {
    color: '#17362f',
    fontSize: 17,
    fontWeight: '700',
  },
  materialNomeZerado: {
    color: '#8d342e',
  },
  materialDetalhe: {
    color: '#687b74',
    fontSize: 13,
    marginTop: 4,
  },
  materialDetalheZerado: {
    color: '#a25047',
    fontWeight: '600',
  },
  materialAlerta: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffe1d7',
    borderColor: '#e09a7f',
    borderRadius: 8,
    borderWidth: 1,
    color: '#943d2b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantidadeContainer: {
    alignItems: 'center',
    backgroundColor: '#e3efeb',
    borderColor: '#c1d8d0',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 56,
    paddingHorizontal: 10,
  },
  quantidadeContainerZerada: {
    backgroundColor: '#fde5df',
    borderColor: '#d98a7d',
  },
  quantidadeContainerCritica: {
    backgroundColor: '#fff0e7',
    borderColor: '#dda179',
  },
  materialQuantidade: {
    color: '#176b57',
    fontSize: 20,
    fontWeight: '800',
  },
  materialQuantidadeCritica: {
    color: '#9b432f',
  },
  materialQuantidadeZerada: {
    color: '#b23f35',
  },
  acoesEstoque: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  acoesEstoqueCompactas: {
    flexWrap: 'nowrap',
  },
  inputRetirada: {
    backgroundColor: '#f4f8f6',
    borderColor: '#c5d4cf',
    borderRadius: 8,
    borderWidth: 1,
    color: '#18312b',
    flex: 1,
    fontSize: 14,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  inputRetiradaDesktop: {
    flexBasis: 180,
    flexGrow: 0,
    flexShrink: 0,
    width: 180,
  },
  botaoBaixar: {
    alignItems: 'center',
    backgroundColor: '#176b57',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 82,
    paddingHorizontal: 14,
  },
  botaoBaixarTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  botaoExcluir: {
    alignItems: 'center',
    backgroundColor: '#fff7f4',
    borderColor: '#c75c4f',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 78,
    paddingHorizontal: 12,
  },
  botaoExcluirTexto: {
    color: '#a6443a',
    fontSize: 14,
    fontWeight: '700',
  },
  listaVazia: {
    color: '#61756d',
    fontSize: 15,
    marginTop: 34,
    textAlign: 'center',
  },
});

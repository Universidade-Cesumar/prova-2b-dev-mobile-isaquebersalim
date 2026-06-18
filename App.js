import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { validarRetirada } from './src/utils/validacoes';

const API_URL = 'https://6a2b395ab687a7d5cbc4f9df.mockapi.io/materiais';
const PLACEHOLDER_COLOR = '#7c8984';

const isTesteSemFetchMockado = () =>
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV === 'test' &&
  typeof fetch === 'function' &&
  !fetch._isMockFunction;

export default function App() {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [busca, setBusca] = useState('');
  const [materiais, setMateriais] = useState([]);
  const [retiradas, setRetiradas] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
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
      setMensagem(error.message);
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
      setMensagem('Material cadastrado com sucesso.');
    } catch (error) {
      setMensagem(error.message);
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
      String(material.nome ?? material.name ?? '').toLowerCase().includes(termo),
    );
  }, [busca, materiais]);

  const totalUnidades = useMemo(
    () =>
      materiaisFiltrados.reduce(
        (total, material) => total + Number(material.quantidade ?? 0),
        0,
      ),
    [materiaisFiltrados],
  );

  const exibindoCarregamentoInicial = carregando && materiais.length === 0;
  const mensagemListaVazia = busca.trim()
    ? 'Nenhum material encontrado.'
    : 'Nenhum material cadastrado.';

  const renderMaterial = ({ item }) => (
    <View style={styles.materialItem}>
      <View style={styles.materialInfo}>
        <Text style={styles.materialNome}>{item.nome ?? item.name}</Text>
        <Text style={styles.materialDetalhe}>Quantidade atual</Text>
      </View>
      <Text style={styles.materialQuantidade}>{item.quantidade ?? 0}</Text>
      <TextInput
        testID="input-retirada"
        style={styles.inputRetirada}
        placeholder="Retirar"
        placeholderTextColor={PLACEHOLDER_COLOR}
        value={retiradas[item.id] ?? ''}
        onChangeText={(valor) => alterarRetirada(item.id, valor)}
        keyboardType="numeric"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almoxarifado - Enfermagem</Text>

      <View style={styles.formulario}>
        <TextInput
          testID="input-nome"
          style={styles.input}
          accessibilityLabel="Nome do material"
          placeholder="Nome do material"
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={60}
          returnKeyType="next"
        />

        <TextInput
          testID="input-quantidade"
          style={styles.input}
          accessibilityLabel="Quantidade do material"
          placeholder="Quantidade"
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={quantidade}
          onChangeText={setQuantidade}
          keyboardType="numeric"
          maxLength={5}
          returnKeyType="done"
        />

        <TouchableOpacity
          testID="btn-cadastrar"
          style={[styles.botao, salvando && styles.botaoDesabilitado]}
          accessibilityLabel="Cadastrar material"
          onPress={cadastrarMaterial}
          disabled={salvando}
        >
          <Text style={styles.botaoTexto}>
            {salvando ? 'Cadastrando...' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resumo}>
        <View>
          <Text testID="total-itens" style={styles.totalItens}>
            Total de itens: {materiaisFiltrados.length}
          </Text>
          <Text style={styles.totalUnidades}>
            Unidades em estoque: {totalUnidades}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoAtualizar}
          accessibilityLabel="Atualizar estoque"
          onPress={carregarMateriais}
          disabled={carregando}
        >
          <Text style={styles.botaoAtualizarTexto}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        testID="input-busca"
        style={styles.input}
        accessibilityLabel="Buscar material"
        placeholder="Buscar material"
        placeholderTextColor={PLACEHOLDER_COLOR}
        value={busca}
        onChangeText={setBusca}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}

      {exibindoCarregamentoInicial ? (
        <ActivityIndicator size="large" color="#1f6f5b" style={styles.loading} />
      ) : (
        <View testID="lista-materials" style={styles.listaWrapper}>
          <FlatList
            testID="lista-materiais"
            data={materiaisFiltrados}
            keyExtractor={(item, index) => String(item.id ?? index)}
            renderItem={renderMaterial}
            refreshing={carregando}
            onRefresh={carregarMateriais}
            contentContainerStyle={styles.listaConteudo}
            ListEmptyComponent={
              <Text style={styles.listaVazia}>{mensagemListaVazia}</Text>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf8',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    color: '#17362f',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formulario: {
    gap: 12,
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cfd9d5',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1d2522',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  botao: {
    alignItems: 'center',
    backgroundColor: '#1f6f5b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  botaoDesabilitado: {
    opacity: 0.65,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resumo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalItens: {
    color: '#17362f',
    fontSize: 15,
    fontWeight: '600',
  },
  totalUnidades: {
    color: '#4f5f59',
    fontSize: 14,
    marginTop: 4,
  },
  botaoAtualizar: {
    borderColor: '#1f6f5b',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botaoAtualizarTexto: {
    color: '#1f6f5b',
    fontSize: 14,
    fontWeight: '600',
  },
  mensagem: {
    color: '#8a4b12',
    fontSize: 14,
    marginTop: 10,
  },
  loading: {
    marginTop: 24,
  },
  listaWrapper: {
    flex: 1,
    marginTop: 12,
  },
  listaConteudo: {
    gap: 10,
    paddingBottom: 24,
  },
  materialItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#dce5e1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  materialInfo: {
    flex: 1,
    marginRight: 12,
  },
  materialNome: {
    color: '#1d2522',
    fontSize: 16,
    fontWeight: '600',
  },
  materialDetalhe: {
    color: '#6b7772',
    fontSize: 13,
    marginTop: 3,
  },
  materialQuantidade: {
    color: '#1f6f5b',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  inputRetirada: {
    backgroundColor: '#f7faf8',
    borderColor: '#cfd9d5',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1d2522',
    minHeight: 40,
    paddingHorizontal: 10,
    width: 78,
  },
  listaVazia: {
    color: '#6b7772',
    fontSize: 15,
    marginTop: 24,
    textAlign: 'center',
  },
});

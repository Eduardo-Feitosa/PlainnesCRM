import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { FormField } from '../forms/FormField';
import { FormSelect } from '../forms/FormSelect';
import { TextAreaField } from '../forms/TextAreaField';
import { maskMoney, parseMoney, decimalCasas, formatMoneyBR } from '../../utils/masks';
import { listarClientes } from '../../services/clientes';
import { listarProdutos } from '../../services/produtos';
import type { Cliente } from '../../types/cliente';
import type { Produto } from '../../types/produto';
import {
    CANAIS_VENDA_OPCOES,
    STATUS_VENDA_OPCOES,
    type ItemVenda,
    type Venda,
    type VendaFormValues,
} from '../../types/venda';

const FormRoot = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
`;

const Row = styled.div<{ $cols?: 2 | 3 | 4; $alignEnd?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: ${({ $alignEnd }) => ($alignEnd ? 'flex-end' : 'flex-start')};

  & > * {
    flex: 1 1 ${({ $cols }) => ($cols === 4 ? '200px' : $cols === 3 ? '220px' : '300px')};
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  align-items: center;
  justify-content: flex-start;
`;

const SubmitButton = styled.button<{ $submitting?: boolean }>`
  min-width: 220px;
  height: 46px;
  padding: 0 1.25rem;
  background-color: var(--pl-blue);
  color: #fff;
  border: 1px solid var(--pl-blue);
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background-color: var(--pl-blue-dark);
    border-color: var(--pl-blue-dark);
  }

  &:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }
`;

const GhostButton = styled.button`
  height: 46px;
  padding: 0 1.25rem;
  background: transparent;
  color: var(--pl-navy);
  border: 1px solid #c6c3da;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;

  &:hover {
    background: var(--pl-canvas);
    border-color: var(--pl-blue);
    color: var(--pl-blue);
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: var(--pl-navy);
  margin: 0.5rem 0 0;
  padding: 0 0 0.5rem 0;
  border-bottom: 1px solid #ecebf5;
`;

const AutocompleteWrap = styled.div<{ $hasError?: boolean }>`
  position: relative;
  width: 100%;
`;

const AutocompleteList = styled.div`
  position: absolute;
  z-index: 50;
  margin-top: 0.35rem;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #d8d4ea;
  border-radius: 0.75rem;
  box-shadow: 0 10px 24px rgba(38, 35, 94, 0.08);
  padding: 0.25rem 0;
`;

const AutocompleteItem = styled.button<{ $active?: boolean }>`
  width: 100%;
  text-align: left;
  background: ${({ $active }) => ($active ? 'var(--pl-canvas)' : 'transparent')};
  border: 0;
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  color: var(--pl-navy);
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;

  &:hover, &:focus {
    background: var(--pl-canvas);
    outline: none;
  }

  span { color: #7b77a0; font-size: 0.8rem; display:block; margin-top: 2px; }
`;

const EmptyAuto = styled.div`
  padding: 0.75rem 0.9rem;
  color: #7b77a0;
  font-size: 0.85rem;
`;

const ItemsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid #ecebf5;
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: #faf9ff;
`;

const ItemRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  background: #fff;
  border: 1px solid #ecebf5;
  font-size: 0.92rem;
  color: var(--pl-navy);
  font-weight: 500;

  strong { color: var(--pl-blue); font-weight: 600; }
`;

const RemoveItemBtn = styled.button`
  border: 0;
  background: #fdecef;
  color: #c13353;
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover { background: #f9d7de; }
`;

const TotalItensBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.15rem;
  background: #f4f2ff;
  color: #4a43a2;
  border: 1px solid #e7e4ff;
  border-radius: 0.75rem;
  font-size: 0.92rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;

  strong {
    font-size: 1.05rem;
    color: #3b358c;
    font-weight: 700;
  }
`;

const ValorTotalBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.15rem;
  background: linear-gradient(135deg, #6a62d2 0%, #8a83ee 100%);
  color: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 8px 20px rgba(106, 98, 210, 0.18);

  span { font-size: 0.9rem; opacity: 0.92; font-weight: 500; }
  strong { font-size: 1.4rem; font-weight: 700; letter-spacing: 0.3px; }
`;

const AddItemBtn = styled.button<{ $disabled?: boolean }>`
  height: 48px;
  width: 100%;
  max-width: 240px;
  background: #fff;
  color: var(--pl-blue);
  border: 1px dashed #a49dd3;
  border-radius: 0.75rem;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
  align-self: flex-start;
  margin: 0;
  padding: 0 1rem;
  box-sizing: border-box;
  line-height: 1;
  ${({ $disabled }) => ($disabled ? 'opacity:0.55; cursor:not-allowed;' : '')}

  &:hover:not(:disabled) {
    background: var(--pl-canvas);
    border-color: var(--pl-blue);
  }
`;

// ============================================================================
// Wrapper ESTÁVEL para a linha de itens.
// Reserva um espaço FIXO abaixo do input/label.
// Assim, quando o texto de erro VERMELHO aparece (ex: "preço unitário deve ser
// maior que zero"), ele ocupa a área RESERVADA — sem aumentar altura total do
// container, sem "empurrar" os inputs para cima e sem fazer o botão descer.
// ============================================================================
const StableItemCol = styled.div<{ $grow?: 1 | 2; $basis?: string; $minW?: number; $padBot?: number }>`
  flex: ${({ $grow = 1 }) => ($grow)} 1 ${({ $basis = '220px' }) => $basis};
  min-width: ${({ $minW = 180 }) => $minW}px;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: ${({ $padBot = 22 }) => $padBot}px;
  box-sizing: border-box;
`;

// Versão do StableItemCol ESPECÍFICA para o autocomplete de PRODUTO:
// ele tem texto extra "Selecionado: X" além do erro.
const StableProdutoCol = styled.div`
  flex: 2 1 440px;
  min-width: 280px;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 44px;
  box-sizing: border-box;
`;

// Coluna do botão: mesmo padding-bottom de reserva para ficar baseline-aligned
const StableBtnCol = styled.div`
  flex: 0 0 auto;
  min-width: 180px;
  max-width: 240px;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 22px;
  box-sizing: border-box;
`;

// Espaço vazio no topo da coluna do botão, com a MESMA ALTURA do <label> dos
// outros campos (FieldLabel = fonte 0.875rem + margin-bottom 0.4rem ≈ 18/20px).
// Faz com que o topo do botão alinhe com o topo dos inputs.
const LabelSpacer = styled.div`
  height: calc(0.875rem + 0.4rem);
  min-height: calc(0.875rem + 0.4rem);
  line-height: 1;
  font-size: 0;
  visibility: hidden;
`;

const dataHojeISO = (): string =>
{
    const d = new Date();
    const a = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${a}-${mm}-${dd}`;
};

const emptyValues: VendaFormValues =
{
    clienteId: null,
    dataVenda: dataHojeISO(),
    avaliacao: '',
    observacao: '',
    quantidade: 0,
    canal: '',
    statusVenda: 'Pendente',
    itens: [],
};

type Errors = Partial<Record<keyof VendaFormValues | 'novoProdutoId' | 'novoProdutoPreco' | 'itens_vazio', string>>;

const STATUS_VALORES = STATUS_VENDA_OPCOES.map(o => o.value);
const CANAIS_VALORES = CANAIS_VENDA_OPCOES.map(o => o.value);

export interface VendaFormProps
{
    initialValue?: Venda | null;
    onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
    onCancel?: () => void;
    submitting?: boolean;
}

const valorFormularioInicial = (valorBanco: number | string | null | undefined): string =>
{
    if (valorBanco === null || valorBanco === undefined || valorBanco === '') return '';
    const n = Number(valorBanco);
    if (!Number.isFinite(n)) return '';
    return maskMoney((n * 100).toFixed(0));
};

const dateBRParaISO = (s: string): string => s.trim();

export const VendaForm: React.FC<VendaFormProps> = ({ initialValue, onSubmit, onCancel, submitting }) =>
{
    const [values, setValues] = useState<VendaFormValues>(emptyValues);
    const [errors, setErrors] = useState<Errors>({});

    // cliente autocomplete
    const [clienteQuery, setClienteQuery] = useState('');
    const [clienteAberto, setClienteAberto] = useState(false);
    const clienteWrapRef = useRef<HTMLDivElement | null>(null);

    // novo item autocomplete produto
    const [produtoQuery, setProdutoQuery] = useState('');
    const [produtoAberto, setProdutoAberto] = useState(false);
    const [novoProdutoId, setNovoProdutoId] = useState<number | null>(null);
    const [novoProdutoNome, setNovoProdutoNome] = useState('');
    const [novoProdutoPrecoMask, setNovoProdutoPrecoMask] = useState('');

    const produtoWrapRef = useRef<HTMLDivElement | null>(null);

    // listas
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carregandoListas, setCarregandoListas] = useState(false);

    useEffect(() =>
    {
        setCarregandoListas(true);
        Promise.allSettled([listarClientes(), listarProdutos()]).then((results) =>
        {
            if (results[0].status === 'fulfilled') setClientes(results[0].value || []);
            if (results[1].status === 'fulfilled') setProdutos(results[1].value || []);
        })
            .finally(() => setCarregandoListas(false));
    }, []);

    useEffect(() =>
    {
        if (initialValue)
        {
            const itensNorm = (initialValue.itens || []).map((i) => ({
                produtoId: Number(i.produtoId),
                quantidade: 1,
                precoUnitario: Number(i.precoUnitario),
                produtoNome: i.produtoNome,
                subtotal: i.subtotal ?? Number(i.precoUnitario),
            }));
            setValues({
                id: initialValue.id,
                clienteId: initialValue.clienteId ?? null,
                dataVenda: initialValue.dataVenda ? String(initialValue.dataVenda).slice(0, 10) : dataHojeISO(),
                avaliacao: initialValue.avaliacao ?? '',
                observacao: (initialValue as any).observacao ?? '',
                quantidade: Number((initialValue as any).quantidade ?? itensNorm.length) | 0,
                canal: initialValue.canal ?? '',
                statusVenda: initialValue.statusVenda || 'Pendente',
                itens: itensNorm,
            });
            if (initialValue.clienteId && initialValue.clienteNome)
            {
                setClienteQuery(initialValue.clienteNome);
            }
        }
        else
        {
            setValues({ ...emptyValues });
            setClienteQuery('');
        }
        setNovoProdutoId(null);
        setNovoProdutoNome('');
        setNovoProdutoPrecoMask('');
        setProdutoQuery('');
        setErrors({});
    }, [initialValue]);

    // fecha autocompletes no clique fora
    useEffect(() =>
    {
        const onDocClick = (e: MouseEvent) =>
        {
            const t = e.target as Node;
            if (clienteWrapRef.current && !clienteWrapRef.current.contains(t)) setClienteAberto(false);
            if (produtoWrapRef.current && !produtoWrapRef.current.contains(t)) setProdutoAberto(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    // Mantém quantidade INTEGER sempre sincronizada com o número real de itens
    useEffect(() =>
    {
        setValues((prev) =>
        {
            const qtd = Number(prev.itens.length) | 0;
            return prev.quantidade === qtd ? prev : { ...prev, quantidade: qtd };
        });
    }, [values.itens.length]);

    const clientesFiltrados = useMemo(() =>
    {
        const q = clienteQuery.trim().toLowerCase();
        if (!q) return clientes.slice(0, 50);
        return clientes.filter((c) =>
            c.nome.toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.telefone || '').replace(/\D/g, '').includes(q)
        ).slice(0, 50);
    }, [clientes, clienteQuery]);

    const produtosFiltrados = useMemo(() =>
    {
        const q = produtoQuery.trim().toLowerCase();
        if (!q) return produtos.slice(0, 50);
        return produtos.filter((p) =>
            p.nome.toLowerCase().includes(q) ||
            ((p.nicho || '').toLowerCase().includes(q))
        ).slice(0, 50);
    }, [produtos, produtoQuery]);

    const valorTotal = useMemo(() =>
    {
        let total = 0;
        for (const it of values.itens)
        {
            total += Number(it.precoUnitario || 0);
        }
        return Number((total).toFixed(2));
    }, [values.itens]);

    const clienteSelecionadoNome = useMemo(() =>
    {
        if (!values.clienteId) return '';
        const c = clientes.find((x) => x.id === values.clienteId);
        return c ? c.nome : clienteQuery;
    }, [values.clienteId, clientes, clienteQuery]);

    const setField = <K extends keyof VendaFormValues>(campo: K, valor: VendaFormValues[K]) =>
    {
        setValues((prev) =>
        {
            const novo = { ...prev, [campo]: valor };
            // Se o usuário está adicionando o primeiro item, já pode apagar o
            // aviso "vazia sem items"
            const apagarItensVazio = campo === 'itens' && Array.isArray(valor) && valor.length > 0;
            setErrors((err) => ({
                ...err,
                [campo]: undefined,
                ...(apagarItensVazio ? { itens_vazio: undefined } : {}),
            }));
            return novo;
        });
    };

    const selecionarCliente = (c: Cliente) =>
    {
        setField('clienteId', c.id);
        setClienteQuery(c.nome);
        setClienteAberto(false);
    };

    const limparCliente = () =>
    {
        setField('clienteId', null);
        setClienteQuery('');
    };

    const selecionarProduto = (p: Produto) =>
    {
        setNovoProdutoId(Number(p.id));
        setNovoProdutoNome(p.nome);
        setProdutoQuery(p.nome);
        if (!novoProdutoPrecoMask) setNovoProdutoPrecoMask(valorFormularioInicial(p.valor));
        setProdutoAberto(false);
        setErrors((prev) => ({ ...prev, novoProdutoId: undefined }));
    };

    const limparProdutoSelecionado = (limparErrosTambem = true) =>
    {
        setNovoProdutoId(null);
        setNovoProdutoNome('');
        setProdutoQuery('');
        setNovoProdutoPrecoMask('');
        if (limparErrosTambem)
        {
            setErrors((prev) => ({
                ...prev,
                novoProdutoId: undefined,
                novoProdutoPreco: undefined,
            }));
        }
    };

    const adicionarItem = () =>
    {
        const novosErros: Errors = {};
        if (!novoProdutoId) novosErros.novoProdutoId = 'selecione um produto válido';
        const precoNum = parseMoney(novoProdutoPrecoMask);
        if (precoNum === null || !Number.isFinite(precoNum) || precoNum <= 0)
            novosErros.novoProdutoPreco = 'preço unitário deve ser maior que zero';
        else
        {
            const casas = decimalCasas(novoProdutoPrecoMask);
            if (casas !== null && casas > 2) novosErros.novoProdutoPreco = 'preço unitário máximo 2 casas decimais';
        }
        setErrors((prev) => ({ ...prev, ...novosErros }));
        if (Object.keys(novosErros).length) return;

        const novoItem: ItemVenda = {
            produtoId: novoProdutoId as number,
            quantidade: 1,
            precoUnitario: precoNum as number,
            produtoNome: novoProdutoNome,
            subtotal: Number(((precoNum as number)).toFixed(2)),
        };

        setValues((prev) => ({ ...prev, itens: [...prev.itens, novoItem] }));
        // Adicionou o 1º item → já limpa automaticamente o aviso de "nenhum item"
        setErrors((prev) => ({
            ...prev,
            itens_vazio: prev.itens?.length ? undefined : undefined,
            novoProdutoId: undefined,
            novoProdutoPreco: undefined,
        }));
        limparProdutoSelecionado(true);
    };

    // Validação EM TEMPO REAL do preço unitário: sempre que o usuário digitar
    // algo VÁLIDO (> 0 e ≤ 2 decimais) e JÁ existir erro, apaga o erro
    // automaticamente. Chamado tanto no onChange quanto no onBlur.
    const validarPrecoEmTempoReal = (valorAtual: string) =>
    {
        const precoNum = parseMoney(valorAtual);
        const maiorQueZero = precoNum !== null && Number.isFinite(precoNum) && precoNum > 0;
        const casas = maiorQueZero ? decimalCasas(valorAtual) : null;
        const decimaisOK = casas === null || casas <= 2;

        setErrors((prev) =>
        {
            if (!prev.novoProdutoPreco) return prev;
            if (maiorQueZero && decimaisOK)
            {
                return { ...prev, novoProdutoPreco: undefined };
            }
            return prev;
        });
    };

    const removerItem = (idx: number) =>
    {
        setValues((prev) => ({ ...prev, itens: prev.itens.filter((_, i) => i !== idx) }));
    };

    const validar = (v: VendaFormValues): Errors =>
    {
        const erros: Errors = {};
        if (!v.dataVenda) erros.dataVenda = 'O campo data é obrigatório';
        if (v.dataVenda)
        {
            const dt = String(v.dataVenda).trim();
            if (dt && !/^\d{4}-\d{2}-\d{2}$/.test(dt)) erros.dataVenda = 'campo data da venda inválido';
        }
        if (v.avaliacao && v.avaliacao.length > 255) erros.avaliacao = 'campo avaliação pode ter no máximo 255 caracteres';
        if (v.observacao && v.observacao.length > 45) erros.observacao = 'campo observações pode ter no máximo 45 caracteres';
        if (v.statusVenda && !STATUS_VALORES.includes(v.statusVenda as any)) erros.statusVenda = 'status da venda inválido';
        if (v.canal && !CANAIS_VALORES.includes(v.canal as any)) erros.canal = 'canal da venda inválido';
        if (!v.itens || v.itens.length === 0) erros.itens_vazio = 'venda precisa ter pelo menos 1 item';
        return erros;
    };

    const formatarParaSubmit = (v: VendaFormValues): Record<string, unknown> =>
    {
        const trimOuNull = (s: string | null | undefined) =>
        {
            if (s === null || s === undefined) return null;
            const t = String(s).trim();
            return t === '' ? null : t;
        };
        const itensFormatados = v.itens.map((it) => ({
            produtoId: Number(it.produtoId),
            quantidade: 1,
            precoUnitario: Number(Number(it.precoUnitario).toFixed(2)),
        }));
        return {
            clienteId: v.clienteId ? Number(v.clienteId) : null,
            dataVenda: v.dataVenda ? dateBRParaISO(v.dataVenda) : null,
            avaliacao: trimOuNull(v.avaliacao),
            observacao: trimOuNull(v.observacao),
            quantidade: Number(v.itens.length) | 0,
            canal: trimOuNull(v.canal) || null,
            statusVenda: trimOuNull(v.statusVenda) || 'Pendente',
            itens: itensFormatados,
        };
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) =>
    {
        e.preventDefault();
        const errosSubmit = validar(values);
        setErrors((prev) => ({ ...prev, ...errosSubmit }));
        if (Object.keys(errosSubmit).length > 0) return;
        await onSubmit(formatarParaSubmit(values));
    };

    return (
        <FormRoot noValidate onSubmit={handleSubmit}>
            <SectionTitle>Dados da venda</SectionTitle>
            <Row $cols={2}>
                <AutocompleteWrap ref={clienteWrapRef} $hasError={!!errors.clienteId}>
                    <FormField
                        name="cliente"
                        label="Cliente"
                        placeholder={carregandoListas ? 'Carregando clientes...' : 'Pesquise por nome, e-mail ou telefone'}
                        value={clienteQuery}
                        error={errors.clienteId}
                        helperText="Opcional. Comece a digitar para selecionar um cliente já cadastrado."
                        fullWidth
                        onChange={(e) =>
                        {
                            setClienteQuery(e.target.value);
                            setClienteAberto(true);
                            if (values.clienteId && clientes.every((c) => c.nome !== e.target.value))
                            {
                                setField('clienteId', null);
                            }
                        }}
                        onBlur={() =>
                        {
                            if (values.clienteId)
                            {
                                setErrors((prev) => ({ ...prev, clienteId: undefined }));
                            }
                        }}
                        onFocus={() => setClienteAberto(true)}
                    />
                    {clienteAberto && (
                        <AutocompleteList>
                            {!clientesFiltrados.length
                                ? <EmptyAuto>{carregandoListas ? 'Carregando...' : 'Nenhum cliente encontrado.'}</EmptyAuto>
                                : clientesFiltrados.map((c) =>
                                {
                                    const sub = [c.email, c.telefone].filter(Boolean).join(' · ') || 'Sem contato';
                                    return (
                                        <AutocompleteItem
                                            key={c.id}
                                            type="button"
                                            $active={values.clienteId === c.id}
                                            onClick={() => selecionarCliente(c)}
                                        >
                                            {c.nome}
                                            <span>{sub}</span>
                                        </AutocompleteItem>
                                    );
                                })}
                        </AutocompleteList>
                    )}
                    {values.clienteId && (
                        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: '#6a62d2', fontWeight: 600 }}>
                                Selecionado: {clienteSelecionadoNome}
                            </span>
                            <button
                                type="button"
                                onClick={limparCliente}
                                style={{ background: 'transparent', border: 0, color: '#7b77a0', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
                            >
                                Remover cliente
                            </button>
                        </div>
                    )}
                </AutocompleteWrap>
                <FormField
                    name="dataVenda"
                    label="Data da venda"
                    type="date"
                    required
                    placeholder="Obrigatório. Inclua a data em que a venda foi realizada."
                    value={values.dataVenda}
                    error={errors.dataVenda}
                    fullWidth
                    onChange={(e) => setField('dataVenda', e.target.value)}
                    onBlur={(e) =>
                    {
                        if (e.target.value) setErrors((p) => ({ ...p, dataVenda: undefined }));
                    }}
                />
            </Row>

            <Row $cols={3}>
                <FormSelect
                    name="canal"
                    label="Canal de venda"
                    value={values.canal as any}
                    placeholder="Selecione (opcional)"
                    error={errors.canal}
                    fullWidth
                    options={[{ value: '', label: 'Não informado' }, ...CANAIS_VENDA_OPCOES]}
                    onChange={(e) => setField('canal', e.target.value as any)}
                />
                <FormSelect
                    name="statusVenda"
                    label="Status"
                    value={(values.statusVenda as any) ?? 'Pendente'}
                    error={errors.statusVenda}
                    fullWidth
                    options={STATUS_VENDA_OPCOES}
                    onChange={(e) => setField('statusVenda', e.target.value as any)}
                />
                <FormField
                    name="avaliacao"
                    label="Avaliação / Nota"
                    placeholder="Ex.: 4/5, Excelente, etc."
                    maxLength={255}
                    value={values.avaliacao}
                    error={errors.avaliacao}
                    helperText={`${(values.avaliacao ?? '').length} / 255 caracteres`}
                    fullWidth
                    onChange={(e) => setField('avaliacao', e.target.value)}
                    onBlur={(e) =>
                    {
                        if (e.target.value && e.target.value.length <= 255)
                            setErrors((p) => ({ ...p, avaliacao: undefined }));
                    }}
                />
            </Row>

            <SectionTitle>Itens da venda</SectionTitle>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start', width: '100%' }}>
                <StableProdutoCol>
                    <AutocompleteWrap ref={produtoWrapRef} $hasError={!!errors.novoProdutoId}>
                        <FormField
                            name="produto_pesquisa"
                            label="Produto"
                            placeholder={carregandoListas ? 'Carregando produtos...' : 'Pesquise por nome ou categoria'}
                            value={produtoQuery}
                            error={errors.novoProdutoId}
                            fullWidth
                            onChange={(e) =>
                            {
                                setProdutoQuery(e.target.value);
                                setProdutoAberto(true);
                                if (novoProdutoId && produtos.every((p) => p.nome !== e.target.value))
                                {
                                    limparProdutoSelecionado(false);
                                }
                                // Se o usuário selecionou e apagou do input → limpa o erro tb
                                if (!e.target.value && !novoProdutoId)
                                {
                                    setErrors((prev) => ({ ...prev, novoProdutoId: undefined }));
                                }
                            }}
                            onBlur={() =>
                            {
                                if (novoProdutoId) setErrors((prev) => ({ ...prev, novoProdutoId: undefined }));
                            }}
                            onFocus={() => setProdutoAberto(true)}
                        />
                        {produtoAberto && (
                            <AutocompleteList>
                                {!produtosFiltrados.length
                                    ? <EmptyAuto>{carregandoListas ? 'Carregando...' : 'Nenhum produto encontrado.'}</EmptyAuto>
                                    : produtosFiltrados.map((p) => (
                                        <AutocompleteItem
                                            key={p.id}
                                            type="button"
                                            $active={novoProdutoId === p.id}
                                            onClick={() => selecionarProduto(p)}
                                        >
                                            {p.nome}
                                            <span>
                                                {p.nicho ? `${p.nicho} · ` : ''}{formatMoneyBR(p.valor)}
                                            </span>
                                        </AutocompleteItem>
                                    ))}
                            </AutocompleteList>
                        )}
                        {novoProdutoId && (
                            <div style={{ marginTop: 6, color: '#6a62d2', fontSize: 12, fontWeight: 600 }}>
                                Selecionado: {novoProdutoNome}
                            </div>
                        )}
                    </AutocompleteWrap>
                </StableProdutoCol>

                <StableItemCol $grow={1} $basis="220px" $minW={180} $padBot={22}>
                    <FormField
                        name="precoUnit"
                        label="Preço unitário (R$)"
                        placeholder="R$ 0,00"
                        inputMode="decimal"
                        value={novoProdutoPrecoMask}
                        error={errors.novoProdutoPreco}
                        fullWidth
                        onChange={(e) =>
                        {
                            const v = maskMoney(e.target.value);
                            setNovoProdutoPrecoMask(v);
                            validarPrecoEmTempoReal(v);
                        }}
                        onBlur={(e) => validarPrecoEmTempoReal(e.target.value)}
                    />
                </StableItemCol>

                <StableBtnCol>
                    <LabelSpacer>{" "}</LabelSpacer>
                    <AddItemBtn
                        type="button"
                        $disabled={submitting || carregandoListas}
                        onClick={adicionarItem}
                        disabled={submitting || carregandoListas}
                    >
                        + Adicionar item
                    </AddItemBtn>
                </StableBtnCol>
            </div>

            {errors.itens_vazio && (
                <div style={{ color: '#c13353', fontSize: 13, fontWeight: 600 }}>{errors.itens_vazio}</div>
            )}

            {values.itens.length > 0 ? (
                <ItemsList>
                    {values.itens.map((it, idx) => (
                        <ItemRow key={idx}>
                            <span>
                                Produto {it.produtoNome ?? '(produto)'} 1x valor: {formatMoneyBR(it.precoUnitario)}
                            </span>
                            <RemoveItemBtn type="button" onClick={() => removerItem(idx)}>
                                Remover
                            </RemoveItemBtn>
                        </ItemRow>
                    ))}
                </ItemsList>
            ) : (
                <EmptyAuto style={{ border: '1px dashed #d8d4ea', borderRadius: '0.75rem' }}>
                    Nenhum item adicionado. Use o campo acima para pesquisar e incluir produtos na venda.
                </EmptyAuto>
            )}

            <TotalItensBox>
                <span>Total de itens</span>
                <strong>{values.itens.length} {values.itens.length === 1 ? 'item' : 'itens'}</strong>
            </TotalItensBox>

            <ValorTotalBox>
                <span>Valor total (calculado automaticamente)</span>
                <strong>{formatMoneyBR(valorTotal)}</strong>
            </ValorTotalBox>

            <TextAreaField
                name="observacao"
                label="Observações / Informações adicionais"
                placeholder="Opcional. Anotações curtas sobre a venda (até 45 caracteres)."
                maxLength={45}
                required={false}
                value={values.observacao ?? ''}
                error={errors.observacao}
                helperText={errors.observacao ? undefined : `${(values.observacao ?? '').length} / 45 caracteres`}
                fullWidth
                onChange={(e) => setField('observacao', e.target.value)}
            />

            <ButtonsRow>
                <SubmitButton type="submit" disabled={submitting} $submitting={submitting}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    {submitting ? 'Salvando...' : initialValue ? 'Salvar alterações' : 'Registrar venda'}
                </SubmitButton>
                {onCancel && (
                    <GhostButton type="button" onClick={onCancel} disabled={submitting}>
                        Cancelar
                    </GhostButton>
                )}
            </ButtonsRow>
        </FormRoot>
    );
};

export default VendaForm;

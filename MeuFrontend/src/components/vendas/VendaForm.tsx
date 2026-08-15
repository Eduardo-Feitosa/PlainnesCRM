import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { PlusIcon, SaveIcon, StarIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Autocomplete } from '../ui/Autocomplete';
import { canaisVenda } from '../../data/vendas';
import { formatCurrency } from '../../utils/format';
import type { Cliente, ItemVenda, Produto, Venda } from '../../types/crm';

export type VendaFormValues = Omit<Venda, 'id'>;

interface VendaFormProps {
  clientes: Cliente[];
  produtos: Produto[];
  initialValue?: Venda | null;
  onSubmit: (values: VendaFormValues) => void;
  onCancel?: () => void;
}

interface Errors {
  cliente?: string;
  itens?: string;
  produto?: string;
}

export function VendaForm({ clientes, produtos, initialValue, onSubmit, onCancel }: VendaFormProps) {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteBusca, setClienteBusca] = useState('');
  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().slice(0, 10));
  const [canal, setCanal] = useState(canaisVenda[0]);
  const [status, setStatus] = useState<Venda['status']>('Concluída');
  const [avaliacao, setAvaliacao] = useState(5);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (initialValue) {
      setClienteId(initialValue.clienteId);
      setClienteBusca(clientes.find((c) => c.id === initialValue.clienteId)?.nome ?? '');
      setItens(initialValue.itens);
      setDataVenda(initialValue.dataVenda);
      setCanal(initialValue.canal);
      setStatus(initialValue.status);
      setAvaliacao(initialValue.avaliacao);
    } else {
      setClienteId(null);
      setClienteBusca('');
      setItens([]);
      setDataVenda(new Date().toISOString().slice(0, 10));
      setCanal(canaisVenda[0]);
      setStatus('Concluída');
      setAvaliacao(5);
    }
    setErrors({});
  }, [initialValue, clientes]);

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => c.id === clienteId) ?? null,
    [clientes, clienteId]
  );

  const total = useMemo(
    () => itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0),
    [itens]
  );

  const adicionarProduto = () => {
    if (!produtoSelecionado) {
      setErrors((p) => ({ ...p, produto: 'Busque e selecione um produto pelo nome' }));
      return;
    }
    setItens((prev) => {
      const existente = prev.find((item) => item.produtoId === produtoSelecionado.id);
      if (existente) {
        return prev.map((item) =>
        item.produtoId === produtoSelecionado.id ?
        { ...item, quantidade: item.quantidade + quantidade } :
        item
        );
      }
      return [
      ...prev,
      { produtoId: produtoSelecionado.id, quantidade, valorUnitario: produtoSelecionado.valor }];

    });
    setProdutoSelecionado(null);
    setProdutoBusca('');
    setQuantidade(1);
    setErrors((p) => ({ ...p, produto: undefined, itens: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (!clienteId) nextErrors.cliente = 'Selecione um cliente para a venda';
    if (itens.length === 0) nextErrors.itens = 'Adicione ao menos um produto';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      clienteId: clienteId as number,
      dataVenda,
      avaliacao,
      valorTotal: total,
      canal,
      status,
      itens
    });

    if (!initialValue) {
      setClienteId(null);
      setClienteBusca('');
      setItens([]);
      setAvaliacao(5);
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <div className="pl-eyebrow mb-2">1. Cliente</div>
      {clienteSelecionado ?
      <div className="d-flex align-items-center justify-content-between gap-3 p-3 mb-3 rounded-3" style={{ backgroundColor: 'var(--pl-blue-soft)' }}>
          <div>
            <div className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>{clienteSelecionado.nome}</div>
            <div className="pl-muted" style={{ fontSize: '0.8rem' }}>
              {clienteSelecionado.email} · {clienteSelecionado.telefone}
            </div>
          </div>
          <Button
          variant="link"
          className="text-decoration-none d-inline-flex align-items-center gap-1 p-0"
          onClick={() => {
            setClienteId(null);
            setClienteBusca('');
          }}>
          
            <XIcon size={16} /> Trocar
          </Button>
        </div> :

      <div className="mb-3">
          <Autocomplete
          id="venda-cliente"
          label="Cliente *"
          placeholder="Digite o nome do cliente"
          hint="Apenas 1 cliente por venda."
          error={errors.cliente}
          value={clienteBusca}
          options={clientes.map((c) => ({ id: c.id, label: c.nome, hint: c.email }))}
          onValueChange={setClienteBusca}
          onSelect={(option) => {
            setClienteId(option.id);
            setClienteBusca(option.label);
            setErrors((p) => ({ ...p, cliente: undefined }));
          }} />
        
        </div>
      }

      <hr className="my-4" />

      <div className="pl-eyebrow mb-2">2. Produtos da venda</div>
      <Row className="g-3 align-items-end">
        <Col md={7}>
          <Autocomplete
            id="venda-produto"
            label="Produto"
            placeholder="Digite o nome do produto"
            error={errors.produto}
            value={produtoBusca}
            options={produtos.map((p) => ({ id: p.id, label: p.nome, hint: formatCurrency(p.valor) }))}
            onValueChange={(value) => {
              setProdutoBusca(value);
              setProdutoSelecionado(null);
            }}
            onSelect={(option) => {
              const produto = produtos.find((p) => p.id === option.id) ?? null;
              setProdutoSelecionado(produto);
              setProdutoBusca(option.label);
              setErrors((p) => ({ ...p, produto: undefined }));
            }} />
          
        </Col>
        <Col md={2}>
          <Form.Group controlId="venda-quantidade">
            <Form.Label>Qtd.</Form.Label>
            <Form.Control
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))} />
            
          </Form.Group>
        </Col>
        <Col md={3}>
          <Button
            type="button"
            variant="outline-primary"
            className="w-100 d-inline-flex align-items-center justify-content-center gap-2"
            onClick={adicionarProduto}>
            
            <PlusIcon size={16} />
            Adicionar
          </Button>
        </Col>
      </Row>

      <div className="mt-3">
        {itens.length === 0 ?
        <div
          className="text-center rounded-3 py-4 pl-muted"
          style={{ border: '1px dashed var(--pl-line)', fontSize: '0.875rem' }}>
          
            {errors.itens ?
          <span style={{ color: 'var(--pl-coral-dark)', fontWeight: 600 }}>{errors.itens}</span> :

          'Nenhum produto adicionado ainda.'
          }
          </div> :

        <Table responsive className="pl-table align-middle">
            <thead>
              <tr>
                <th>Produto</th>
                <th style={{ width: 90 }}>Qtd.</th>
                <th style={{ width: 140 }}>Valor un.</th>
                <th style={{ width: 140 }}>Subtotal</th>
                <th style={{ width: 60 }} className="text-end">Ação</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
              const produto = produtos.find((p) => p.id === item.produtoId);
              return (
                <tr key={item.produtoId}>
                    <td className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>{produto?.nome ?? 'Produto removido'}</td>
                    <td>
                      <Form.Control
                      type="number"
                      min={1}
                      value={item.quantidade}
                      aria-label={`Quantidade de ${produto?.nome ?? 'produto'}`}
                      onChange={(e) =>
                      setItens((prev) =>
                      prev.map((i) =>
                      i.produtoId === item.produtoId ?
                      { ...i, quantidade: Math.max(1, Number(e.target.value)) } :
                      i
                      )
                      )
                      }
                      style={{ maxWidth: 80, padding: '0.35rem 0.5rem' }} />
                    
                    </td>
                    <td>{formatCurrency(item.valorUnitario)}</td>
                    <td className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>
                      {formatCurrency(item.valorUnitario * item.quantidade)}
                    </td>
                    <td className="text-end">
                      <Button
                      size="sm"
                      className="btn-danger-soft border-0"
                      aria-label={`Remover ${produto?.nome ?? 'produto'}`}
                      onClick={() => setItens((prev) => prev.filter((i) => i.produtoId !== item.produtoId))}>
                      
                        <Trash2Icon size={15} />
                      </Button>
                    </td>
                  </tr>);

            })}
            </tbody>
          </Table>
        }
      </div>

      <hr className="my-4" />

      <div className="pl-eyebrow mb-2">3. Detalhes</div>
      <Row className="g-3">
        <Col md={3}>
          <Form.Group controlId="venda-data">
            <Form.Label>Data da venda</Form.Label>
            <Form.Control type="date" value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group controlId="venda-canal">
            <Form.Label>Canal</Form.Label>
            <Form.Select value={canal} onChange={(e) => setCanal(e.target.value)}>
              {canaisVenda.map((item) =>
              <option key={item} value={item}>
                  {item}
                </option>
              )}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group controlId="venda-status">
            <Form.Label>Status</Form.Label>
            <Form.Select value={status} onChange={(e) => setStatus(e.target.value as Venda['status'])}>
              <option value="Concluída">Concluída</option>
              <option value="Pendente">Pendente</option>
              <option value="Cancelada">Cancelada</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Label>Avaliação</Form.Label>
          <div className="d-flex gap-1" role="group" aria-label="Avaliação da venda">
            {[1, 2, 3, 4, 5].map((nota) =>
            <button
              key={nota}
              type="button"
              className="btn p-1 border-0"
              aria-label={`${nota} estrela${nota > 1 ? 's' : ''}`}
              aria-pressed={avaliacao === nota}
              onClick={() => setAvaliacao(nota)}>
              
                <StarIcon
                size={20}
                style={{ color: nota <= avaliacao ? '#F0B429' : 'var(--pl-line)' }}
                fill={nota <= avaliacao ? '#F0B429' : 'none'} />
              
              </button>
            )}
          </div>
        </Col>
      </Row>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
        <div>
          <div className="pl-eyebrow">Valor total</div>
          <div className="fs-4 fw-bold" style={{ color: 'var(--pl-blue)' }}>{formatCurrency(total)}</div>
        </div>
        <div className="d-flex gap-2">
          {onCancel &&
          <Button type="button" variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={onCancel}>
              <XIcon size={16} />
              Cancelar
            </Button>
          }
          <Button type="submit" variant="primary" className="d-inline-flex align-items-center gap-2">
            <SaveIcon size={16} />
            {initialValue ? 'Salvar alterações' : 'Registrar venda'}
          </Button>
        </div>
      </div>
    </Form>);

}
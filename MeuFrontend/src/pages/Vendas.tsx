import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Table } from 'react-bootstrap';
import { PencilIcon, PlusIcon, ShoppingCartIcon, StarIcon, Trash2Icon, XIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusChip, toneForStatus } from '../components/ui/StatusChip';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { VendaForm, VendaFormValues } from '../components/vendas/VendaForm';
import { useCrm } from '../contexts/CrmContext';
import { useGlobalSearch } from '../contexts/SearchContext';
import { formatCurrency, formatDate, initials } from '../utils/format';
import type { Venda } from '../types/crm';

export function Vendas() {
  const { vendas, clientes, produtos, addVenda, updateVenda, removeVenda } = useCrm();
  const search = useGlobalSearch();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Venda | null>(null);
  const [toRemove, setToRemove] = useState<Venda | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vendas;
    return vendas.filter((venda) => {
      const cliente = clientes.find((c) => c.id === venda.clienteId)?.nome ?? '';
      const nomesProdutos = venda.itens.
      map((item) => produtos.find((p) => p.id === item.produtoId)?.nome ?? '').
      join(' ');
      return [cliente, nomesProdutos, venda.canal, venda.status].join(' ').toLowerCase().includes(term);
    });
  }, [vendas, clientes, produtos, search]);

  const handleSubmit = (values: VendaFormValues) => {
    if (editing) {
      updateVenda(editing.id, values);
      setFeedback('Venda atualizada com sucesso.');
      setEditing(null);
      setShowForm(false);
    } else {
      addVenda(values);
      setFeedback('Venda registrada com sucesso.');
    }
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Vendas"
        subtitle={`${vendas.length} vendas registradas`}
        actions={
        <Button
          variant={showForm ? 'outline-secondary' : 'primary'}
          className="d-inline-flex align-items-center gap-2"
          onClick={() => showForm ? closeForm() : setShowForm(true)}>
          
            {showForm ? <XIcon size={16} /> : <PlusIcon size={16} />}
            {showForm ? 'Fechar formulário' : 'Nova venda'}
          </Button>
        } />
      

      {feedback &&
      <Alert variant="success" dismissible onClose={() => setFeedback(null)} className="border-0">
          {feedback}
        </Alert>
      }

      {showForm &&
      <Card className="pl-card mb-4">
          <Card.Header>{editing ? `Editar venda #${editing.id}` : 'Registrar nova venda'}</Card.Header>
          <Card.Body>
            <VendaForm
            clientes={clientes}
            produtos={produtos}
            initialValue={editing}
            onSubmit={handleSubmit}
            onCancel={closeForm} />
          
          </Card.Body>
        </Card>
      }

      <Card className="pl-card">
        <Card.Header>Histórico de vendas</Card.Header>
        {filtradas.length === 0 ?
        <EmptyState
          icon={<ShoppingCartIcon size={28} className="pl-muted" />}
          title="Nenhuma venda encontrada"
          description="Registre uma nova venda para começar." /> :


        <Table responsive className="pl-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Produtos</th>
                <th>Data</th>
                <th>Canal</th>
                <th>Total</th>
                <th>Avaliação</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((venda) => {
              const cliente = clientes.find((c) => c.id === venda.clienteId);
              return (
                <tr key={venda.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="pl-avatar" style={{ width: 30, height: 30 }}>
                          {initials(cliente?.nome ?? '?')}
                        </span>
                        <span className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>
                          {cliente?.nome ?? 'Cliente removido'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: 280 }}>
                        {venda.itens.map((item) => {
                        const produto = produtos.find((p) => p.id === item.produtoId);
                        return (
                          <span key={item.produtoId} className="pl-chip pl-chip-neutral">
                              {produto?.nome ?? 'Produto'} ×{item.quantidade}
                            </span>);

                      })}
                      </div>
                    </td>
                    <td>{formatDate(venda.dataVenda)}</td>
                    <td>{venda.canal}</td>
                    <td className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>
                      {formatCurrency(venda.valorTotal)}
                    </td>
                    <td>
                      <span className="d-inline-flex align-items-center gap-1">
                        <StarIcon size={14} style={{ color: '#F0B429' }} fill="#F0B429" />
                        {venda.avaliacao}
                      </span>
                    </td>
                    <td>
                      <StatusChip label={venda.status} tone={toneForStatus(venda.status)} dot />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <Button
                        size="sm"
                        className="btn-light-soft"
                        aria-label={`Alterar venda ${venda.id}`}
                        onClick={() => {
                          setEditing(venda);
                          setShowForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>
                        
                          <PencilIcon size={15} />
                        </Button>
                        <Button
                        size="sm"
                        className="btn-danger-soft"
                        aria-label={`Excluir venda ${venda.id}`}
                        onClick={() => setToRemove(venda)}>
                        
                          <Trash2Icon size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>);

            })}
            </tbody>
          </Table>
        }
      </Card>

      <ConfirmDialog
        show={Boolean(toRemove)}
        title="Excluir venda"
        message="Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita."
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) {
            removeVenda(toRemove.id);
            setFeedback('Venda excluída.');
          }
          setToRemove(null);
        }} />
      
    </>);

}
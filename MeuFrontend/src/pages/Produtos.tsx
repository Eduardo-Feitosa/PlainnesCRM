import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Table } from 'react-bootstrap';
import { PackageIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusChip } from '../components/ui/StatusChip';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ProdutoForm, ProdutoFormValues } from '../components/produtos/ProdutoForm';
import { useCrm } from '../contexts/CrmContext';
import { useGlobalSearch } from '../contexts/SearchContext';
import { formatCurrency } from '../utils/format';
import type { Produto } from '../types/crm';

export function Produtos() {
  const { produtos, vendas, addProduto, updateProduto, removeProduto } = useCrm();
  const search = useGlobalSearch();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [toRemove, setToRemove] = useState<Produto | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return produtos;
    return produtos.filter((p) => [p.nome, p.nicho, p.descricao].join(' ').toLowerCase().includes(term));
  }, [produtos, search]);

  const vendidos = useMemo(() => {
    const map = new Map<number, number>();
    vendas.forEach((venda) =>
    venda.itens.forEach((item) => map.set(item.produtoId, (map.get(item.produtoId) ?? 0) + item.quantidade))
    );
    return map;
  }, [vendas]);

  const handleSubmit = (values: ProdutoFormValues) => {
    if (editing) {
      updateProduto(editing.id, values);
      setFeedback(`Produto ${values.nome} atualizado com sucesso.`);
      setEditing(null);
      setShowForm(false);
    } else {
      addProduto(values);
      setFeedback(`Produto ${values.nome} cadastrado com sucesso.`);
    }
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos"
        subtitle={`${produtos.length} produtos e serviços disponíveis`}
        actions={
        <Button
          variant={showForm ? 'outline-secondary' : 'primary'}
          className="d-inline-flex align-items-center gap-2"
          onClick={() => showForm ? closeForm() : setShowForm(true)}>
          
            {showForm ? <XIcon size={16} /> : <PlusIcon size={16} />}
            {showForm ? 'Fechar formulário' : 'Novo produto'}
          </Button>
        } />
      

      {feedback &&
      <Alert variant="success" dismissible onClose={() => setFeedback(null)} className="border-0">
          {feedback}
        </Alert>
      }

      {showForm &&
      <Card className="pl-card mb-4">
          <Card.Header>{editing ? `Editar produto — ${editing.nome}` : 'Cadastrar novo produto'}</Card.Header>
          <Card.Body>
            <ProdutoForm initialValue={editing} onSubmit={handleSubmit} onCancel={closeForm} />
          </Card.Body>
        </Card>
      }

      <Card className="pl-card">
        <Card.Header>Lista de produtos</Card.Header>
        {filtrados.length === 0 ?
        <EmptyState
          icon={<PackageIcon size={28} className="pl-muted" />}
          title="Nenhum produto encontrado"
          description="Ajuste a busca ou cadastre um novo produto." /> :


        <Table responsive className="pl-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Nicho</th>
                <th>Valor</th>
                <th>Unid. vendidas</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((produto) =>
            <tr key={produto.id}>
                  <td>
                    <div className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>{produto.nome}</div>
                    <div className="pl-muted text-truncate" style={{ fontSize: '0.78rem', maxWidth: 380 }}>
                      {produto.descricao || '—'}
                    </div>
                  </td>
                  <td>
                    <StatusChip label={produto.nicho} />
                  </td>
                  <td className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>{formatCurrency(produto.valor)}</td>
                  <td>{vendidos.get(produto.id) ?? 0}</td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <Button
                    size="sm"
                    className="btn-light-soft"
                    aria-label={`Alterar ${produto.nome}`}
                    onClick={() => {
                      setEditing(produto);
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                    
                        <PencilIcon size={15} />
                      </Button>
                      <Button
                    size="sm"
                    className="btn-danger-soft"
                    aria-label={`Excluir ${produto.nome}`}
                    onClick={() => setToRemove(produto)}>
                    
                        <Trash2Icon size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
            )}
            </tbody>
          </Table>
        }
      </Card>

      <ConfirmDialog
        show={Boolean(toRemove)}
        title="Excluir produto"
        message={`Tem certeza que deseja excluir ${toRemove?.nome}? Ele deixará de aparecer em novas vendas.`}
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) {
            removeProduto(toRemove.id);
            setFeedback(`Produto ${toRemove.nome} excluído.`);
          }
          setToRemove(null);
        }} />
      
    </>);

}
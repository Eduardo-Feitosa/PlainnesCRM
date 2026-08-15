import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Table } from 'react-bootstrap';
import { MailIcon, PencilIcon, PhoneIcon, PlusIcon, Trash2Icon, UsersIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusChip, toneForStatus } from '../components/ui/StatusChip';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ClienteForm, ClienteFormValues } from '../components/clientes/ClienteForm';
import { useCrm } from '../contexts/CrmContext';
import { useGlobalSearch } from '../contexts/SearchContext';
import { formatDate, initials } from '../utils/format';
import type { Cliente } from '../types/crm';

export function Clientes() {
  const { clientes, addCliente, updateCliente, removeCliente } = useCrm();
  const search = useGlobalSearch();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [toRemove, setToRemove] = useState<Cliente | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((c) =>
    [c.nome, c.email, c.telefone, c.estado].join(' ').toLowerCase().includes(term)
    );
  }, [clientes, search]);

  const handleSubmit = (values: ClienteFormValues) => {
    if (editing) {
      updateCliente(editing.id, values);
      setFeedback(`Cliente ${values.nome} atualizado com sucesso.`);
      setEditing(null);
      setShowForm(false);
    } else {
      addCliente(values);
      setFeedback(`Cliente ${values.nome} cadastrado com sucesso.`);
    }
  };

  const startEdit = (cliente: Cliente) => {
    setEditing(cliente);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Cadastros"
        title="Clientes"
        subtitle={`${clientes.length} clientes na carteira`}
        actions={
        <Button
          variant={showForm ? 'outline-secondary' : 'primary'}
          className="d-inline-flex align-items-center gap-2"
          onClick={() => showForm ? closeForm() : setShowForm(true)}>
          
            {showForm ? <XIcon size={16} /> : <PlusIcon size={16} />}
            {showForm ? 'Fechar formulário' : 'Novo cliente'}
          </Button>
        } />
      

      {feedback &&
      <Alert variant="success" dismissible onClose={() => setFeedback(null)} className="border-0">
          {feedback}
        </Alert>
      }

      {showForm &&
      <Card className="pl-card mb-4">
          <Card.Header>{editing ? `Editar cliente — ${editing.nome}` : 'Cadastrar novo cliente'}</Card.Header>
          <Card.Body>
            <ClienteForm initialValue={editing} onSubmit={handleSubmit} onCancel={closeForm} />
          </Card.Body>
        </Card>
      }

      <Card className="pl-card">
        <Card.Header>Lista de clientes</Card.Header>
        {filtrados.length === 0 ?
        <EmptyState
          icon={<UsersIcon size={28} className="pl-muted" />}
          title="Nenhum cliente encontrado"
          description="Ajuste a busca ou cadastre um novo cliente." /> :


        <Table responsive className="pl-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Estado</th>
                <th>Cadastro</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((cliente) =>
            <tr key={cliente.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="pl-avatar">{initials(cliente.nome)}</span>
                      <div>
                        <div className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>{cliente.nome}</div>
                        <div className="pl-muted" style={{ fontSize: '0.78rem' }}>
                          {cliente.instagram || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
                      <MailIcon size={13} /> {cliente.email}
                    </div>
                    <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
                      <PhoneIcon size={13} /> {cliente.telefone}
                    </div>
                  </td>
                  <td>{cliente.estado}</td>
                  <td>{formatDate(cliente.dataCadastramento)}</td>
                  <td>
                    <StatusChip label={cliente.status} tone={toneForStatus(cliente.status)} dot />
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <Button
                    size="sm"
                    className="btn-light-soft"
                    onClick={() => startEdit(cliente)}
                    aria-label={`Alterar ${cliente.nome}`}>
                    
                        <PencilIcon size={15} />
                      </Button>
                      <Button
                    size="sm"
                    className="btn-danger-soft"
                    onClick={() => setToRemove(cliente)}
                    aria-label={`Excluir ${cliente.nome}`}>
                    
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
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir ${toRemove?.nome}? As vendas vinculadas também serão removidas.`}
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) {
            removeCliente(toRemove.id);
            setFeedback(`Cliente ${toRemove.nome} excluído.`);
          }
          setToRemove(null);
        }} />
      
    </>);

}
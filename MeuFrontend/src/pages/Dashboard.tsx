import React, { useMemo } from 'react';
import { Card, Col, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CircleSlashIcon, PackageIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusChip, toneForStatus } from '../components/ui/StatusChip';
import { useCrm } from '../contexts/CrmContext';
import { formatCompactCurrency, formatCurrency, formatDate, initials } from '../utils/format';

export function Dashboard() {
  const { clientes, produtos, vendas, usuario } = useCrm();

  const ativos = clientes.filter((c) => c.status === 'Ativo').length;
  const inativos = clientes.length - ativos;
  const faturamento = vendas.
  filter((v) => v.status === 'Concluída').
  reduce((sum, v) => sum + v.valorTotal, 0);

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const ultimasVendas = useMemo(
    () => [...vendas].sort((a, b) => b.dataVenda.localeCompare(a.dataVenda)).slice(0, 5),
    [vendas]
  );

  const topProdutos = useMemo(() => {
    const totals = new Map<number, number>();
    vendas.forEach((venda) =>
    venda.itens.forEach((item) => {
      totals.set(item.produtoId, (totals.get(item.produtoId) ?? 0) + item.quantidade * item.valorUnitario);
    })
    );
    return produtos.
    map((produto) => ({ produto, total: totals.get(produto.id) ?? 0 })).
    sort((a, b) => b.total - a.total).
    slice(0, 4);
  }, [produtos, vendas]);

  const maiorTotal = topProdutos[0]?.total || 1;

  return (
    <>
      <PageHeader
        title={`Bom dia, ${usuario.nome.split(' ')[0]} 👋`}
        subtitle={`${hoje.charAt(0).toUpperCase() + hoje.slice(1)} — aqui está o resumo da sua operação.`} />
      

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard icon={<UsersIcon size={20} />} value={String(ativos)} label="Clientes ativos" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard icon={<CircleSlashIcon size={20} />} value={String(inativos)} label="Clientes inativos" accent="coral" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            icon={<TrendingUpIcon size={20} />}
            value={formatCompactCurrency(faturamento)}
            label="Faturamento concluído"
            accent="green" />
          
        </Col>
        <Col sm={6} xl={3}>
          <StatCard icon={<PackageIcon size={20} />} value={String(produtos.length)} label="Produtos cadastrados" />
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <Card className="pl-card h-100">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <span>Últimas vendas</span>
              <Link to="/vendas" className="text-decoration-none fw-semibold" style={{ fontSize: '0.82rem' }}>
                Ver todas
              </Link>
            </Card.Header>
            <Table responsive className="pl-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ultimasVendas.map((venda) => {
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
                      <td>{formatDate(venda.dataVenda)}</td>
                      <td className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>
                        {formatCurrency(venda.valorTotal)}
                      </td>
                      <td>
                        <StatusChip label={venda.status} tone={toneForStatus(venda.status)} dot />
                      </td>
                    </tr>);

                })}
              </tbody>
            </Table>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="pl-card h-100">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <span>Produtos mais vendidos</span>
              <Link to="/relatorios" className="text-decoration-none fw-semibold" style={{ fontSize: '0.82rem' }}>
                Ver relatórios
              </Link>
            </Card.Header>
            <Card.Body className="d-flex flex-column gap-3">
              {topProdutos.map(({ produto, total }) =>
              <div key={produto.id}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--pl-navy)' }}>
                      {produto.nome}
                    </span>
                    <span className="pl-muted" style={{ fontSize: '0.82rem' }}>{formatCurrency(total)}</span>
                  </div>
                  <div className="pl-strength-bar">
                    <span style={{ width: `${Math.max(6, total / maiorTotal * 100)}%`, backgroundColor: 'var(--pl-blue)' }} />
                  </div>
                  <div className="pl-muted mt-1" style={{ fontSize: '0.75rem' }}>{produto.nicho}</div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>);

}
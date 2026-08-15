import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { DownloadIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { useCrm } from '../contexts/CrmContext';
import { formatCompactCurrency, formatCurrency } from '../utils/format';

const CHART_COLORS = ['#3B2EE8', '#6E63F5', '#FF9AA6', '#12A06A', '#F0B429', '#9A93FF'];

export function Relatorios() {
  const { vendas, clientes, produtos } = useCrm();
  const [statusFiltro, setStatusFiltro] = useState<string>('Todos');

  const vendasFiltradas = useMemo(
    () => statusFiltro === 'Todos' ? vendas : vendas.filter((v) => v.status === statusFiltro),
    [vendas, statusFiltro]
  );

  const faturamento = vendasFiltradas.reduce((sum, v) => sum + v.valorTotal, 0);
  const ticketMedio = vendasFiltradas.length ? faturamento / vendasFiltradas.length : 0;
  const avaliacaoMedia = vendasFiltradas.length ?
  vendasFiltradas.reduce((sum, v) => sum + v.avaliacao, 0) / vendasFiltradas.length :
  0;

  const porCanal = useMemo(() => {
    const map = new Map<string, number>();
    vendasFiltradas.forEach((v) => map.set(v.canal, (map.get(v.canal) ?? 0) + v.valorTotal));
    return Array.from(map, ([canal, total]) => ({ canal, total }));
  }, [vendasFiltradas]);

  const porNicho = useMemo(() => {
    const map = new Map<string, number>();
    vendasFiltradas.forEach((venda) =>
    venda.itens.forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      if (!produto) return;
      map.set(produto.nicho, (map.get(produto.nicho) ?? 0) + item.quantidade * item.valorUnitario);
    })
    );
    return Array.from(map, ([nicho, total]) => ({ nicho, total }));
  }, [vendasFiltradas, produtos]);

  const ranking = useMemo(() => {
    const map = new Map<number, {total: number;qtd: number;}>();
    vendasFiltradas.forEach((venda) => {
      const atual = map.get(venda.clienteId) ?? { total: 0, qtd: 0 };
      map.set(venda.clienteId, { total: atual.total + venda.valorTotal, qtd: atual.qtd + 1 });
    });
    return Array.from(map, ([clienteId, dados]) => ({
      cliente: clientes.find((c) => c.id === clienteId)?.nome ?? 'Cliente removido',
      ...dados
    })).sort((a, b) => b.total - a.total);
  }, [vendasFiltradas, clientes]);

  return (
    <>
      <PageHeader
        eyebrow="Análises"
        title="Relatórios"
        subtitle="Acompanhe o desempenho comercial da sua carteira"
        actions={
        <>
            <Form.Select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            aria-label="Filtrar por status"
            style={{ width: 180 }}>
            
              <option value="Todos">Todos os status</option>
              <option value="Concluída">Concluída</option>
              <option value="Pendente">Pendente</option>
              <option value="Cancelada">Cancelada</option>
            </Form.Select>
            <Button variant="outline-primary" className="d-inline-flex align-items-center gap-2">
              <DownloadIcon size={16} />
              Exportar
            </Button>
          </>
        } />
      

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard icon={<span className="fw-bold">R$</span>} value={formatCompactCurrency(faturamento)} label="Faturamento no filtro" accent="green" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard icon={<span className="fw-bold">Ø</span>} value={formatCompactCurrency(ticketMedio)} label="Ticket médio" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard icon={<span className="fw-bold">★</span>} value={avaliacaoMedia.toFixed(1)} label="Avaliação média" accent="coral" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard icon={<span className="fw-bold">#</span>} value={String(vendasFiltradas.length)} label="Vendas no filtro" />
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="pl-card h-100">
            <Card.Header>Faturamento por canal</Card.Header>
            <Card.Body style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porCanal} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E4F5" vertical={false} />
                  <XAxis dataKey="canal" tick={{ fontSize: 12, fill: '#7A799B' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#7A799B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => formatCompactCurrency(value)} />
                  
                  <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#EEEBFD' }} />
                  <Bar dataKey="total" fill="#3B2EE8" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="pl-card h-100">
            <Card.Header>Participação por nicho</Card.Header>
            <Card.Body style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={porNicho} dataKey="total" nameKey="nicho" innerRadius={60} outerRadius={95} paddingAngle={3}>
                    {porNicho.map((entry, index) =>
                    <Cell key={entry.nicho} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    )}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {porNicho.map((entry, index) =>
                <span key={entry.nicho} className="d-inline-flex align-items-center gap-1 pl-muted" style={{ fontSize: '0.78rem' }}>
                    <span
                    className="rounded-circle"
                    style={{ width: 8, height: 8, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  
                    {entry.nicho}
                  </span>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="pl-card">
        <Card.Header>Ranking de clientes</Card.Header>
        <Table responsive className="pl-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Cliente</th>
              <th>Vendas</th>
              <th>Faturamento</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((linha, index) =>
            <tr key={linha.cliente}>
                <td className="fw-bold" style={{ color: 'var(--pl-blue)' }}>{index + 1}</td>
                <td className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>{linha.cliente}</td>
                <td>{linha.qtd}</td>
                <td className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>{formatCurrency(linha.total)}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </>);

}
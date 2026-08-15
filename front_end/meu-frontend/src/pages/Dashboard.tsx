import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { ToastMessage, type ToastVariant } from '../components/feedback/ToastMessage';
import { buscarMetricsDashboard, type DashboardMetrics } from '../services/dashboard';
import type { ErroApi } from '../services/vendas';

const mensagemErroApi = (data: ErroApi | any, fallback: string): string =>
{
    if (data && typeof data === 'object')
    {
        if (typeof data.erro === 'string' && data.erro.trim()) return data.erro;
        if (typeof data.mensagem === 'string' && data.mensagem.trim()) return data.mensagem;
        if (typeof data.message === 'string' && data.message.trim()) return data.message;
        if (typeof data.error === 'string' && data.error.trim()) return data.error;
    }
    return fallback;
};

// ============================================
// STYLED COMPONENTS
// ============================================

const Eyebrow = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pl-muted);
  margin-bottom: 0.4rem;
  font-family: 'Inter', sans-serif;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--pl-navy);
  margin: 0 0 0.25rem;
  font-family: 'Inter', sans-serif;
`;

const PageSubtitle = styled.p`
  color: var(--pl-muted);
  font-size: 0.95rem;
  margin: 0 0 1.75rem;
  font-family: 'Inter', sans-serif;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
`;

const MetricCard = styled.div<{ $accent?: 'blue' | 'green' | 'coral' }>`
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 1rem;
  padding: 1.5rem 1.5rem;
  box-shadow: 0 18px 45px -38px rgba(27, 26, 74, 0.55);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-family: 'Inter', sans-serif;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ $accent }) =>
      $accent === 'green'
        ? 'var(--pl-green, #198754)'
        : $accent === 'coral'
        ? 'var(--pl-coral, #ef476f)'
        : 'var(--pl-blue, #3b2ee8)'};
  }
`;

const MetricLabel = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--pl-navy);
  text-transform: uppercase;
`;

const MetricValue = styled.strong`
  font-size: 2rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--pl-navy);
  font-variant-numeric: tabular-nums;
`;

const MetricFootnote = styled.span`
  font-size: 0.78rem;
  color: var(--pl-muted);
  font-weight: 500;
`;

const MetricSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 110px;
`;

const SkeletonBar = styled.span<{ $w?: string }>`
  display: inline-block;
  align-self: flex-start;
  width: ${({ $w }) => $w ?? '45%'};
  height: 0.75rem;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(27, 26, 74, 0.055) 0%,
    rgba(27, 26, 74, 0.115) 50%,
    rgba(27, 26, 74, 0.055) 100%
  );
  background-size: 200% 100%;
  animation: metric-skeleton 1.25s ease-in-out infinite;

  @keyframes metric-skeleton {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const Dashboard: React.FC = () =>
{
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [ metrics, setMetrics ] = useState<DashboardMetrics>({
        totalClientes: 0,
        totalProdutos: 0,
        totalVendas: 0,
        totalFaturado: 0,
    });
    const [ carregando, setCarregando ] = useState(true);
    const [ toast, setToast ] = useState<{ variant: ToastVariant; message: string; visible: boolean }>({
        variant: 'success',
        message: '',
        visible: false,
    });

    const exibirToast = useCallback((variant: ToastVariant, message: string) =>
    {
        setToast({ variant, message, visible: true });
    }, []);

    const tratarErro401 = useCallback((d: any) =>
    {
        if (d && typeof d === 'object' && (d.sessaoInvalida === true || d.contaSemRole === true))
        {
            logout();
            navigate('/login', { replace: true });
            return true;
        }
        if (d && typeof d === 'object' && typeof d.erro === 'string' && /sess(o|ã)o inv(a|á)lida/i.test(d.erro))
        {
            try { logout(); } catch (_) { /* ignore */ }
            navigate('/login', { replace: true });
            return true;
        }
        return false;
    }, [ logout, navigate ]);

    const carregarMetrics = useCallback(async () =>
    {
        setCarregando(true);
        try
        {
            const res = await buscarMetricsDashboard();
            tratarErro401(res);
            setMetrics(res);
        }
        catch (err: any)
        {
            tratarErro401(err);
            console.error(err);
            exibirToast('error', mensagemErroApi(err, 'Erro ao carregar métricas do dashboard. Verifique o backend.'));
            setMetrics({
                totalClientes: 0,
                totalProdutos: 0,
                totalVendas: 0,
                totalFaturado: 0,
            });
        }
        finally
        {
            setCarregando(false);
        }
    }, [ exibirToast, tratarErro401 ]);

    useEffect(() => { carregarMetrics(); }, [ carregarMetrics ]);

    const formatarNumeroBR = (n: number): string =>
    {
        const num = Number.isFinite(n) ? n : 0;
        try { return new Intl.NumberFormat('pt-BR').format(num); }
        catch (_) { return String(Math.round(num)); }
    };

    const cards = [
        {
            label: 'Total Vendas',
            valor: formatarNumeroBR(metrics.totalVendas),
            footnote: carregando ? 'Carregando...' : 'Total vendas registradas',
            accent: 'blue' as const,
        },
        {
            label: 'Produtos da Loja',
            valor: formatarNumeroBR(metrics.totalProdutos),
            footnote: carregando ? 'Carregando...' : 'Total de produtos cadastrados',
            accent: 'green' as const,
        },
        {
            label: 'Total Clientes',
            valor: formatarNumeroBR(metrics.totalClientes),
            footnote: carregando ? 'Carregando...' : 'Total de clientes ativos no sistema',
            accent: 'coral' as const,
        },
    ];

    return (
        <>
            <Eyebrow>Início</Eyebrow>
            <PageTitle>Dashboard</PageTitle>
            <PageSubtitle>
                Acompanhe em tempo real os principais números da sua operação.
            </PageSubtitle>

            <MetricsGrid>
                {cards.map((c) => (
                    <MetricCard key={c.label} $accent={c.accent} aria-label={`${c.label}: ${c.valor}`}>
                        {carregando ? (
                            <MetricSkeleton>
                                <SkeletonBar $w="50%" />
                                <SkeletonBar $w="75%" style={{ height: '1.25rem' }} />
                                <SkeletonBar $w="60%" style={{ height: '0.65rem' }} />
                            </MetricSkeleton>
                        ) : (
                            <>
                                <MetricLabel>{c.label}</MetricLabel>
                                <MetricValue>{c.valor}</MetricValue>
                                <MetricFootnote>{c.footnote}</MetricFootnote>
                            </>
                        )}
                    </MetricCard>
                ))}
            </MetricsGrid>

            <ToastMessage
                variant={toast.variant}
                message={toast.message}
                visible={toast.visible}
                onClose={() => setToast((v) => ({ ...v, visible: false }))}
            />
        </>
    );
};

export default Dashboard;

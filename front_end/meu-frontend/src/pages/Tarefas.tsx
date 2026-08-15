import React from 'react';
import styled from 'styled-components';

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
  margin: 0 0 1.5rem;
  font-family: 'Inter', sans-serif;
`;

const PlaceholderCard = styled.div`
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 18px 45px -38px rgba(27, 26, 74, 0.55);
`;

const PlaceholderTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: var(--pl-navy);
  margin-bottom: 0.5rem;
  font-family: 'Inter', sans-serif;
`;

const PlaceholderText = styled.p`
  color: var(--pl-muted);
  margin: 0;
  font-size: 1rem;
  font-family: 'Inter', sans-serif;
`;

const Tarefas: React.FC = () =>
{
    return (
        <>
            <Eyebrow>Operação</Eyebrow>
            <PageTitle>Tarefas em breve</PageTitle>
            <PageSubtitle>
                Organize suas tarefas, acompanhe prazos e prioridades da sua operação.
            </PageSubtitle>
            <PlaceholderCard>
                <PlaceholderTitle>Tarefas</PlaceholderTitle>
                <PlaceholderText>Funcionalidade em desenvolvimento.</PlaceholderText>
            </PlaceholderCard>
        </>
    );
};

export default Tarefas;

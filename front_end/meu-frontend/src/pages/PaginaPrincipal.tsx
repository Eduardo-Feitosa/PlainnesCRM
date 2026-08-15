import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// Importe suas imagens (ajuste os caminhos conforme sua pasta)
import logo from '../assets/Logotipo.png';
import imgApresentacao from '../assets/Apresentacao.png';
import imgSobre from '../assets/Sobre.png';
import imgCardsSection from '../assets/imgCardsSection.png';

// ============================================
// ANIMAÇÕES
// ============================================
const fadeInLeft = keyframes`
  from { opacity: 0; transform: translateX(-100px); }
  to { opacity: 1; transform: translateX(0); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// ============================================
// STYLED COMPONENTS
// ============================================

// ---- Container geral da página ----
const PageContainer = styled.div`
  width: 100%;
  overflow-x: hidden;
  font-family: 'Inter', sans-serif;
`;

// ---- HEADER ----
const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px 60px;
  background-color: #D3CCFF;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  width: 100%;
  box-sizing: border-box;
`;

const Logo = styled.img`
 margin-bottom:3px;
`;

const Nav = styled.nav`
  margin-right: 40%;
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  gap: 10px;
  margin: 0;
  padding: 0;
`;

const NavLink = styled(Link)`
  text-decoration: none;
   color: #3d3152;
  font-size: 16px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
  font-family: 'Inter', sans-serif;

  &:hover {
    background-color: rgba(63, 95, 255, 0.1);
  }
`;

const NavAnchor = styled.a`
  text-decoration: none;
  color: #3d3152;
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
  font-family: 'Inter', sans-serif;
  font-weight: 700;

  &:hover {
    background-color: rgba(63, 95, 255, 0.1);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 5px;
  margin-right: 20px;
`;

const ButtonPrimary = styled.button<{ $isHovered: boolean }>`
  background-color: ${({ $isHovered }) => ($isHovered ? '#2A4BFF' : '#3F5FFF')};
  color: ${({ $isHovered }) => ($isHovered ? '#f89dd2' : '#FFFFFF')};
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  width: 240px;
  height: 51px;
  transition: background-color 0.3s ease-in-out, transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  box-shadow: ${({ $isHovered }) =>
    $isHovered
      ? '0 6px 20px rgba(63, 95, 255, 0.3)'
      : '0 4px 16px rgba(63, 95, 255, 0.2)'};
  transform: ${({ $isHovered }) => ($isHovered ? 'scale(1.02)' : 'scale(1)')};
`;

const ButtonSecondary = styled.button<{ $isHovered: boolean }>`
  background-color: ${({ $isHovered }) => ($isHovered ? '#3F5FFF' : '#D3CCFF')};
  color: ${({ $isHovered }) => ($isHovered ? '#FFFFFF' : '#3F5FFF')};
  border: 1px solid #3F5FFF;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  width: 240px;
  height: 51px;
  transition: background-color 0.3s ease-in-out, transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  box-shadow: ${({ $isHovered }) =>
    $isHovered
      ? '0 6px 20px rgba(255, 63, 229, 0.3)'
      : '0 4px 16px rgba(126, 12, 120, 0.2)'};
  transform: ${({ $isHovered }) => ($isHovered ? 'scale(1.02)' : 'scale(1)')};
`;

// ---- SEÇÃO APRESENTAÇÃO ----
const SectionApresentacao = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #D3CCFF;
  min-height: 600px;
  overflow: hidden;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  height: 100vh;
  padding: 0 60px;
  box-sizing: border-box;
`;

const TextContainer = styled.div`
  flex: 1;
  max-width: 600px;
  margin-left: 250px;
  margin-bottom: 7%;
`;

const TituloAnimado = styled.h1<{ $isVisible: boolean }>`
  font-size: 48px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
  font-family: 'Inter', sans-serif;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transform: ${({ $isVisible }) => ($isVisible ? 'translateX(0)' : 'translateX(-100px)')};
  animation: ${({ $isVisible }) => ($isVisible ? fadeInLeft : 'none')} 0.8s ease-out 0.2s both;
  margin: 0;
`;

const ParagrafoAnimado = styled.p<{ $isVisible: boolean }>`
  font-size: 18px;
  line-height: 1.6;
  color: #4a4a4a;
  margin-bottom: 40px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transform: ${({ $isVisible }) => ($isVisible ? 'translateY(0)' : 'translateY(30px)')};
  animation: ${({ $isVisible }) => ($isVisible ? fadeInUp : 'none')} 0.8s ease-out 0.6s both;
`;

const BotaoAnimado = styled.button<{ $isVisible: boolean; $isHovered: boolean }>`
  background-color: ${({ $isHovered }) => ($isHovered ? '#2A4BFF' : '#3F5FFF')};
  color: ${({ $isHovered }) => ($isHovered ? '#f89dd2' : '#FCFBFF')};
  border: none;
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background-color 0.1s, color 0.3s, box-shadow 0.005s, transform 0.3s ease;
  box-shadow: ${({ $isHovered }) =>
    $isHovered
      ? '0 6px 20px rgba(63, 95, 255, 0.3)'
      : '0 4px 16px rgba(63, 95, 255, 0.2)'};
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transform: ${({ $isVisible, $isHovered }) =>
    $isVisible ? ($isHovered ? 'translateY(0) scale(1.02)' : 'translateY(0)') : 'translateY(2px)'};
  animation: ${({ $isVisible }) => ($isVisible ? fadeIn : 'none')} 0.5s ease-out 0.8s both;
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 5%;
`;

const ImageWrapper = styled.div`
  width: 600px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const ImagemApresentacao = styled.img<{ $isVisible: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  animation: ${({ $isVisible }) => ($isVisible ? fadeIn : 'none')} 1.2s ease-out 0.4s both;
`;

// ---- SEÇÃO SOBRE ----
const SectionSobre = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  min-height: 600px;
  overflow: hidden;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  height: 100vh;
  padding: 0 60px;
  box-sizing: border-box;
`;

const SobreTextContainer = styled.div`
  flex: 1;
  max-width: 600px;
  margin-left: 250px;
  margin-bottom: 7%;
`;

const SobreTitulo = styled.h1`
  font-size: 48px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
  margin-bottom: 24px;
  font-family: 'Inter', sans-serif;
  text-align: center;
`;

const SobreTexto = styled.div`
  font-size: 24px;
  line-height: 1.5;
  color: #131212;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  padding: 10px;
  word-spacing: 5px;

  p {
    margin-bottom: 20px;
  }
`;

const SobreImageWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 2%;
`;

const SobreImage = styled.img`
  width: 700px;
  height: 600px;
  object-fit: contain;
  border-radius: 12px;
`;

// ---- SEÇÃO BENEFÍCIOS ----
const SectionBeneficios = styled.section`
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  height: 100vh;
  background-color: white;
  position: relative;
  padding: 0 60px;
  box-sizing: border-box;

`;

const BeneficiosTitulo = styled.h2`
  font-size: 48px;
  font-weight: 700;
  color: #1a1a1a;
  font-family: 'Verdana,Inter', sans-serif;
  text-align: center;
  margin: 0;
`;

const BeneficiosImageContainer = styled.div`
  width: 100vw;
  margin-left: 90px;
  height: 100vh;
`;

const BeneficiosImage = styled.img`
  width: auto;
  height: auto;
  max-width: 100%;
`;

const CardsContainer = styled.div`
  position: absolute;
  top: 50%;
  right: 10%;
  transform: translateY(-50%);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 400px;
`;

const Card = styled.div`
  background-color: #6987FF;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(105, 135, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 100px;
`;

const CardTexto = styled.p`
  font-size: 18px;
  font-weight: 500;
  color: white;
  font-family: 'Inter', sans-serif;
  margin: 0;
`;

// ---- SEÇÃO FEEDBACKS (placeholder) ----
// ---- RODAPÉ ----
const Footer = styled.footer`
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  background-color: #6987FF;
  color: white;
  text-align: center;
  padding: 80px 20px;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
  font-weight: bold; 
`;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const Landing = () => {
  // Estados para animações
  const [isVisible, setIsVisible] = useState(false);
  // Estados para hover dos botões do header
  const [isHoveredBtn1, setIsHoveredBtn1] = useState(false);
  const [isHoveredBtn2, setIsHoveredBtn2] = useState(false);
  // Estado para hover do botão "Começar Agora"
  const [isHoveredCta, setIsHoveredCta] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Dados dos cards de benefícios
  const beneficios = [
    { id: 1, texto: 'Organização do seu negocio' },
    { id: 2, texto: 'Conhecer seus clientes' },
    { id: 3, texto: 'Centralizar informações' },
    { id: 4, texto: 'Automatizar tarefas' },
  ];

  return (
    <PageContainer>
      {/* ===== HEADER ===== */}
      <Header>

        <Logo src={logo} alt="Logotipo Plainness CRM" />
        
        <Nav>
          <NavList>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavAnchor href="#beneficios">Benefícios</NavAnchor></li>
            <li><NavAnchor href="#sobre">Sobre</NavAnchor></li>
          </NavList>
        </Nav>

        <ButtonsContainer>

          <Link to="/cadastro" style={{ textDecoration: 'none' }}>

            <ButtonPrimary $isHovered={isHoveredBtn1}
              onMouseEnter={() => setIsHoveredBtn1(true)}
              onMouseLeave={() => setIsHoveredBtn1(false)}>
              Criar conta gratuita
            </ButtonPrimary>

          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>

            <ButtonSecondary $isHovered={isHoveredBtn2}
              onMouseEnter={() => setIsHoveredBtn2(true)}
              onMouseLeave={() => setIsHoveredBtn2(false)}>
              Entrar na sua conta
            </ButtonSecondary>
          </Link>
        </ButtonsContainer>
      </Header>

      {/* ===== SEÇÃO APRESENTAÇÃO ===== */}
      <SectionApresentacao>

        <TextContainer>

          <TituloAnimado $isVisible={isVisible}>
            Alcance resultados com inteligência e estratégia
          </TituloAnimado>

          <ParagrafoAnimado $isVisible={isVisible}>
            Nossa plataforma organiza seus contatos, 
            agiliza tarefas com tecnologia de ponta e fornece análises para que sua equipe foque no que realmente importa:
            fechar negócios.
          </ParagrafoAnimado>

          <BotaoAnimado $isVisible={isVisible}
            $isHovered={isHoveredCta}
            onMouseEnter={() => setIsHoveredCta(true)}
            onMouseLeave={() => setIsHoveredCta(false)}>
            Começar Agora
          </BotaoAnimado>
        </TextContainer>

        <ImageContainer>
          <ImageWrapper>
            <ImagemApresentacao
              src={imgApresentacao}
              alt="Apresentação da plataforma CRM"
              $isVisible={isVisible}
            />
          </ImageWrapper>
        </ImageContainer>
      </SectionApresentacao>

      {/* ===== SEÇÃO SOBRE ===== */}
      <SectionSobre id="sobre">

        <SobreTextContainer>
          <SobreTitulo>Sobre</SobreTitulo>
          <SobreTexto>
            <p>
              O PlainnessCRM é uma plataforma inteligente desenvolvida para ajudar empresas a organizarem, 
              analisarem e aprimorarem o relacionamento com seus clientes. Em um mercado cada vez mais competitivo, 
              entender o comportamento do consumidor e agir com base em dados tornou-se essencial para alcançar melhores resultados.
            </p>
            <p>
              Nossa solução centraliza informações, automatiza tarefas rotineiras e oferece dashboards claros para apoiar decisões estratégicas.
               Com o PlainnessCRM, gestores e equipes ganham mais controle sobre vendas, comunicação e desempenho, tornando os processos mais eficientes, 
               personalizados e orientados por dados.
            </p>
          </SobreTexto>
        </SobreTextContainer>
        
        <SobreImageWrapper>
          <SobreImage src={imgSobre} alt="Sobre a plataforma PlainnessCRM" />
        </SobreImageWrapper>

      </SectionSobre>

      {/* ===== SEÇÃO BENEFÍCIOS ===== */}
      <SectionBeneficios id="beneficios">
        <BeneficiosTitulo>Benefícios</BeneficiosTitulo>

        <BeneficiosImageContainer>
          <BeneficiosImage src={imgCardsSection} alt="Imagem de benefícios" />
        </BeneficiosImageContainer>
        
        <CardsContainer>
          {beneficios.map((beneficio) => (
            <Card key={beneficio.id}>
              <CardTexto>{beneficio.texto}</CardTexto>
            </Card>
          ))}
        </CardsContainer>
      </SectionBeneficios>

      {/* ===== RODAPÉ ===== */}
      <Footer>
        &copy; 2026 Plainness CRM - Todos os direitos reservados.
      </Footer>
    </PageContainer>
  );
};

export default Landing;
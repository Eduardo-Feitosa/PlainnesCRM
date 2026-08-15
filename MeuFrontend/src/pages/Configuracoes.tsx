import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { SaveIcon, ShieldCheckIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { SenhaInput } from '../components/conta/SenhaInput';
import { ForcaSenha } from '../components/conta/ForcaSenha';
import { useCrm } from '../contexts/CrmContext';
import { setores } from '../data/setores';
import { maskCNPJ, maskCPF, maskPhone, onlyDigits } from '../utils/masks';
import { passwordScore } from '../utils/validation';
import { initials } from '../utils/format';
import type { Usuario } from '../types/crm';

const SENHA_ATUAL_MOCK = 'plainness123';

interface SenhaErrors {
  atual?: string;
  nova?: string;
  confirmar?: string;
}

export function Configuracoes() {
  const { usuario, updateUsuario } = useCrm();

  const [dados, setDados] = useState<Usuario>(usuario);
  const [dadosErros, setDadosErros] = useState<Partial<Record<keyof Usuario, string>>>({});
  const [dadosSalvos, setDadosSalvos] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaErros, setSenhaErros] = useState<SenhaErrors>({});
  const [senhaSalva, setSenhaSalva] = useState(false);

  const isPF = dados.tipo === 'pf';

  const setCampo = <K extends keyof Usuario,>(campo: K, valor: Usuario[K]) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
    setDadosErros((prev) => ({ ...prev, [campo]: undefined }));
    setDadosSalvos(false);
  };

  const salvarDados = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const erros: Partial<Record<keyof Usuario, string>> = {};
    if (!dados.nome.trim()) erros.nome = 'Informe o nome';
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(dados.email.trim())) erros.email = 'E-mail inválido';
    if (onlyDigits(dados.telefone).length < 10) erros.telefone = 'Telefone incompleto';
    if (isPF && onlyDigits(dados.cpf).length !== 11) erros.cpf = 'CPF incompleto';
    if (!isPF && onlyDigits(dados.cnpj).length !== 14) erros.cnpj = 'CNPJ incompleto';
    if (!dados.setor) erros.setor = 'Selecione o setor';

    setDadosErros(erros);
    if (Object.keys(erros).length > 0) return;

    updateUsuario(dados);
    setDadosSalvos(true);
  };

  const salvarSenha = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const erros: SenhaErrors = {};
    if (!senhaAtual) erros.atual = 'Confirme sua senha atual';else
    if (senhaAtual !== SENHA_ATUAL_MOCK) erros.atual = 'Senha atual incorreta';
    if (!novaSenha) erros.nova = 'Crie uma nova senha';else
    if (novaSenha.length < 8) erros.nova = 'Use no mínimo 8 caracteres';else
    if (passwordScore(novaSenha) < 2) erros.nova = 'Combine letras e números';else
    if (novaSenha === senhaAtual) erros.nova = 'A nova senha deve ser diferente da atual';
    if (!confirmarSenha) erros.confirmar = 'Repita a nova senha';else
    if (confirmarSenha !== novaSenha) erros.confirmar = 'As senhas não conferem';

    setSenhaErros(erros);
    setSenhaSalva(false);
    if (Object.keys(erros).length > 0) return;

    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setSenhaSalva(true);
  };

  return (
    <>
      <PageHeader eyebrow="Conta" title="Configurações" subtitle="Atualize seus dados de perfil e sua senha de acesso" />

      <Row className="g-3">
        <Col xl={7}>
          <Card className="pl-card">
            <Card.Header>Dados do perfil</Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center gap-3 mb-4">
                <span className="pl-avatar" style={{ width: 56, height: 56, fontSize: '1.1rem' }}>
                  {initials(dados.nome || 'U')}
                </span>
                <div>
                  <div className="fw-bold" style={{ color: 'var(--pl-navy)' }}>{dados.nome}</div>
                  <div className="pl-muted" style={{ fontSize: '0.82rem' }}>
                    {dados.funcao || 'Sem função definida'} · Cliente desde{' '}
                    {new Date(dados.dataCadastro).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {dadosSalvos &&
              <Alert variant="success" className="border-0" dismissible onClose={() => setDadosSalvos(false)}>
                  Dados atualizados com sucesso.
                </Alert>
              }

              <Form noValidate onSubmit={salvarDados}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="conf-nome">
                      <Form.Label>{isPF ? 'Nome completo' : 'Razão social'} *</Form.Label>
                      <Form.Control
                        value={dados.nome}
                        isInvalid={Boolean(dadosErros.nome)}
                        onChange={(e) => setCampo('nome', e.target.value)} />
                      
                      <Form.Control.Feedback type="invalid">{dadosErros.nome}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="conf-email">
                      <Form.Label>E-mail *</Form.Label>
                      <Form.Control
                        type="email"
                        value={dados.email}
                        isInvalid={Boolean(dadosErros.email)}
                        onChange={(e) => setCampo('email', e.target.value)} />
                      
                      <Form.Control.Feedback type="invalid">{dadosErros.email}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="conf-tipo">
                      <Form.Label>Tipo de cadastro</Form.Label>
                      <Form.Select value={dados.tipo} onChange={(e) => setCampo('tipo', e.target.value as Usuario['tipo'])}>
                        <option value="pf">Pessoa Física</option>
                        <option value="pj">Pessoa Jurídica</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="conf-documento">
                      <Form.Label>{isPF ? 'CPF' : 'CNPJ'} *</Form.Label>
                      <Form.Control
                        inputMode="numeric"
                        value={isPF ? dados.cpf : dados.cnpj}
                        placeholder={isPF ? '000.000.000-00' : '00.000.000/0000-00'}
                        isInvalid={Boolean(isPF ? dadosErros.cpf : dadosErros.cnpj)}
                        onChange={(e) =>
                        isPF ?
                        setCampo('cpf', maskCPF(e.target.value)) :
                        setCampo('cnpj', maskCNPJ(e.target.value))
                        } />
                      
                      <Form.Control.Feedback type="invalid">
                        {isPF ? dadosErros.cpf : dadosErros.cnpj}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="conf-telefone">
                      <Form.Label>Telefone *</Form.Label>
                      <Form.Control
                        inputMode="tel"
                        value={dados.telefone}
                        isInvalid={Boolean(dadosErros.telefone)}
                        onChange={(e) => setCampo('telefone', maskPhone(e.target.value))} />
                      
                      <Form.Control.Feedback type="invalid">{dadosErros.telefone}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="conf-nascimento">
                      <Form.Label>{isPF ? 'Data de nascimento' : 'Data de abertura'}</Form.Label>
                      <Form.Control
                        type="date"
                        value={dados.dataNascimento}
                        onChange={(e) => setCampo('dataNascimento', e.target.value)} />
                      
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="conf-funcao">
                      <Form.Label>Função</Form.Label>
                      <Form.Control
                        value={dados.funcao}
                        placeholder="Ex.: Gerente comercial"
                        onChange={(e) => setCampo('funcao', e.target.value)} />
                      
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="conf-setor">
                      <Form.Label>Setor *</Form.Label>
                      <Form.Select
                        value={dados.setor}
                        isInvalid={Boolean(dadosErros.setor)}
                        onChange={(e) => setCampo('setor', e.target.value)}>
                        
                        <option value="">Selecione</option>
                        {setores.map((setor) =>
                        <option key={setor} value={setor}>
                            {setor}
                          </option>
                        )}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{dadosErros.setor}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2 mt-4">
                  <Button type="submit" variant="primary" className="d-inline-flex align-items-center gap-2">
                    <SaveIcon size={16} />
                    Salvar alterações
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={() => setDados(usuario)}>
                    Descartar
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={5}>
          <Card className="pl-card">
            <Card.Header>Alterar senha</Card.Header>
            <Card.Body>
              {senhaSalva &&
              <Alert variant="success" className="border-0" dismissible onClose={() => setSenhaSalva(false)}>
                  Senha alterada com sucesso.
                </Alert>
              }

              <Form noValidate onSubmit={salvarSenha}>
                <SenhaInput
                  id="senha-atual"
                  label="Senha atual *"
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  value={senhaAtual}
                  error={senhaErros.atual}
                  hint="Para testar o protótipo, use: plainness123"
                  onChange={(value) => {
                    setSenhaAtual(value);
                    setSenhaErros((p) => ({ ...p, atual: undefined }));
                  }} />
                

                <SenhaInput
                  id="senha-nova"
                  label="Nova senha *"
                  placeholder="Crie uma nova senha"
                  value={novaSenha}
                  error={senhaErros.nova}
                  hint="Mínimo de 8 caracteres, com letras e números."
                  onChange={(value) => {
                    setNovaSenha(value);
                    setSenhaErros((p) => ({ ...p, nova: undefined }));
                  }} />
                
                <ForcaSenha senha={novaSenha} />

                <SenhaInput
                  id="senha-confirmar"
                  label="Repita a nova senha *"
                  placeholder="Digite a nova senha novamente"
                  value={confirmarSenha}
                  error={senhaErros.confirmar}
                  onChange={(value) => {
                    setConfirmarSenha(value);
                    setSenhaErros((p) => ({ ...p, confirmar: undefined }));
                  }} />
                

                <Button type="submit" variant="primary" className="w-100 d-inline-flex align-items-center justify-content-center gap-2 mt-2">
                  <ShieldCheckIcon size={16} />
                  Atualizar senha
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>);

}
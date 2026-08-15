import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { SaveIcon, XIcon } from 'lucide-react';
import { estadosBrasil, opcoesSexo } from '../../data/clientes';
import { maskPhone, onlyDigits } from '../../utils/masks';
import type { Cliente } from '../../types/crm';

export type ClienteFormValues = Omit<Cliente, 'id'>;

interface ClienteFormProps {
  initialValue?: Cliente | null;
  onSubmit: (values: ClienteFormValues) => void;
  onCancel?: () => void;
}

const emptyValues: ClienteFormValues = {
  nome: '',
  telefone: '',
  email: '',
  instagram: '',
  sexo: '',
  estado: '',
  idade: '',
  descricao: '',
  status: 'Ativo',
  dataCadastramento: new Date().toISOString().slice(0, 10)
};

type Errors = Partial<Record<keyof ClienteFormValues, string>>;

function validate(values: ClienteFormValues): Errors {
  const errors: Errors = {};
  if (!values.nome.trim()) errors.nome = 'Informe o nome do cliente';else
  if (values.nome.trim().length < 3) errors.nome = 'Nome muito curto';
  if (!values.email.trim()) errors.email = 'Informe o e-mail';else
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(values.email.trim())) errors.email = 'E-mail inválido';
  if (!values.telefone.trim()) errors.telefone = 'Informe o telefone';else
  if (onlyDigits(values.telefone).length < 10) errors.telefone = 'Telefone incompleto';
  if (!values.estado) errors.estado = 'Selecione o estado';
  if (values.idade !== '' && (Number(values.idade) < 16 || Number(values.idade) > 120))
  errors.idade = 'Idade entre 16 e 120';
  return errors;
}

export function ClienteForm({ initialValue, onSubmit, onCancel }: ClienteFormProps) {
  const [values, setValues] = useState<ClienteFormValues>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (initialValue) {
      const { id, ...rest } = initialValue;
      setValues(rest);
    } else {
      setValues({ ...emptyValues, dataCadastramento: new Date().toISOString().slice(0, 10) });
    }
    setErrors({});
  }, [initialValue]);

  const setField = <K extends keyof ClienteFormValues,>(field: K, value: ClienteFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
    if (!initialValue) setValues({ ...emptyValues, dataCadastramento: new Date().toISOString().slice(0, 10) });
  };

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group controlId="cliente-nome">
            <Form.Label>Nome *</Form.Label>
            <Form.Control
              value={values.nome}
              placeholder="Ex.: Fernanda Rocha"
              isInvalid={Boolean(errors.nome)}
              onChange={(e) => setField('nome', e.target.value)} />
            
            <Form.Control.Feedback type="invalid">{errors.nome}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="cliente-email">
            <Form.Label>E-mail *</Form.Label>
            <Form.Control
              type="email"
              value={values.email}
              placeholder="cliente@empresa.com.br"
              isInvalid={Boolean(errors.email)}
              onChange={(e) => setField('email', e.target.value)} />
            
            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="cliente-telefone">
            <Form.Label>Telefone *</Form.Label>
            <Form.Control
              value={values.telefone}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              isInvalid={Boolean(errors.telefone)}
              onChange={(e) => setField('telefone', maskPhone(e.target.value))} />
            
            <Form.Control.Feedback type="invalid">{errors.telefone}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="cliente-instagram">
            <Form.Label>Instagram</Form.Label>
            <Form.Control
              value={values.instagram}
              placeholder="@perfil"
              onChange={(e) => setField('instagram', e.target.value)} />
            
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="cliente-idade">
            <Form.Label>Idade</Form.Label>
            <Form.Control
              type="number"
              min={16}
              max={120}
              value={values.idade}
              placeholder="Ex.: 34"
              isInvalid={Boolean(errors.idade)}
              onChange={(e) => setField('idade', e.target.value === '' ? '' : Number(e.target.value))} />
            
            <Form.Control.Feedback type="invalid">{errors.idade}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="cliente-sexo">
            <Form.Label>Sexo</Form.Label>
            <Form.Select value={values.sexo} onChange={(e) => setField('sexo', e.target.value)}>
              <option value="">Selecione</option>
              {opcoesSexo.map((opcao) =>
              <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              )}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="cliente-estado">
            <Form.Label>Estado *</Form.Label>
            <Form.Select
              value={values.estado}
              isInvalid={Boolean(errors.estado)}
              onChange={(e) => setField('estado', e.target.value)}>
              
              <option value="">Selecione</option>
              {estadosBrasil.map((uf) =>
              <option key={uf} value={uf}>
                  {uf}
                </option>
              )}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.estado}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="cliente-status">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={values.status}
              onChange={(e) => setField('status', e.target.value as Cliente['status'])}>
              
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12}>
          <Form.Group controlId="cliente-descricao">
            <Form.Label>Descrição</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={values.descricao}
              placeholder="Observações sobre o cliente, histórico e preferências"
              onChange={(e) => setField('descricao', e.target.value)} />
            
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex gap-2 mt-4">
        <Button type="submit" variant="primary" className="d-inline-flex align-items-center gap-2">
          <SaveIcon size={16} />
          {initialValue ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
        {onCancel &&
        <Button type="button" variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={onCancel}>
            <XIcon size={16} />
            Cancelar
          </Button>
        }
      </div>
    </Form>);

}
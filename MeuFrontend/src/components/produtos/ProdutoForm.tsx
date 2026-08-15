import React, { useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { SaveIcon, XIcon } from 'lucide-react';
import { nichos } from '../../data/produtos';
import type { Produto } from '../../types/crm';

export type ProdutoFormValues = Omit<Produto, 'id'>;

interface ProdutoFormProps {
  initialValue?: Produto | null;
  onSubmit: (values: ProdutoFormValues) => void;
  onCancel?: () => void;
}

const emptyValues: ProdutoFormValues = { nome: '', descricao: '', nicho: '', valor: 0 };

type Errors = Partial<Record<keyof ProdutoFormValues, string>>;

export function ProdutoForm({ initialValue, onSubmit, onCancel }: ProdutoFormProps) {
  const [values, setValues] = useState<ProdutoFormValues>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (initialValue) {
      const { id, ...rest } = initialValue;
      setValues(rest);
    } else {
      setValues(emptyValues);
    }
    setErrors({});
  }, [initialValue]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (!values.nome.trim()) nextErrors.nome = 'Informe o nome do produto';
    if (!values.nicho) nextErrors.nicho = 'Selecione o nicho';
    if (!values.valor || values.valor <= 0) nextErrors.valor = 'Informe um valor maior que zero';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
    if (!initialValue) setValues(emptyValues);
  };

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group controlId="produto-nome">
            <Form.Label>Nome do produto *</Form.Label>
            <Form.Control
              value={values.nome}
              placeholder="Ex.: Licença Enterprise"
              isInvalid={Boolean(errors.nome)}
              onChange={(e) => {
                setValues((p) => ({ ...p, nome: e.target.value }));
                setErrors((p) => ({ ...p, nome: undefined }));
              }} />
            
            <Form.Control.Feedback type="invalid">{errors.nome}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group controlId="produto-nicho">
            <Form.Label>Nicho *</Form.Label>
            <Form.Select
              value={values.nicho}
              isInvalid={Boolean(errors.nicho)}
              onChange={(e) => {
                setValues((p) => ({ ...p, nicho: e.target.value }));
                setErrors((p) => ({ ...p, nicho: undefined }));
              }}>
              
              <option value="">Selecione</option>
              {nichos.map((nicho) =>
              <option key={nicho} value={nicho}>
                  {nicho}
                </option>
              )}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.nicho}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group controlId="produto-valor">
            <Form.Label>Valor *</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text>R$</InputGroup.Text>
              <Form.Control
                type="number"
                min={0}
                step="0.01"
                value={values.valor || ''}
                placeholder="0,00"
                isInvalid={Boolean(errors.valor)}
                onChange={(e) => {
                  setValues((p) => ({ ...p, valor: Number(e.target.value) }));
                  setErrors((p) => ({ ...p, valor: undefined }));
                }} />
              
              <Form.Control.Feedback type="invalid">{errors.valor}</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
        </Col>
        <Col xs={12}>
          <Form.Group controlId="produto-descricao">
            <Form.Label>Descrição</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={values.descricao}
              placeholder="O que está incluso neste produto ou serviço"
              onChange={(e) => setValues((p) => ({ ...p, descricao: e.target.value }))} />
            
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex gap-2 mt-4">
        <Button type="submit" variant="primary" className="d-inline-flex align-items-center gap-2">
          <SaveIcon size={16} />
          {initialValue ? 'Salvar alterações' : 'Cadastrar produto'}
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
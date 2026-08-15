import React, { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface SenhaInputProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}

export function SenhaInput({
  id,
  label,
  value,
  placeholder,
  error,
  hint,
  autoComplete = 'new-password',
  onChange
}: SenhaInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Form.Group controlId={id} className="mb-3">
      <Form.Label>{label}</Form.Label>
      <InputGroup hasValidation>
        <Form.Control
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          isInvalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)} />
        
        <Button
          variant="outline-secondary"
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="d-flex align-items-center px-3">
          
          {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </Button>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </InputGroup>
      {hint && !error && <Form.Text>{hint}</Form.Text>}
    </Form.Group>);

}
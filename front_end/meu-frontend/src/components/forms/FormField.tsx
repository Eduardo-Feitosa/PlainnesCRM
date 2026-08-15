import React from 'react';
import styled from 'styled-components';

// ============================================
// STYLED COMPONENTS
// ============================================

const FieldWrapper = styled.div<{ $fullWidth?: boolean }>`
  width: 100%;
  max-width: ${({ $fullWidth }) => ($fullWidth ? '100%' : '500px')};
  flex: 1 1 260px;
`;

const FieldLabel = styled.label`
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.4rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;

  & .required-star {
    color: var(--pl-coral-dark);
    margin-left: 2px;
  }
`;

const InputRoot = styled.div<{ $hasError?: boolean }>`
  position: relative;
  width: 100%;
`;

const StyledInput = styled.input<{ $hasError?: boolean; $hasSuffix?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 0 20px;
  padding-right: ${({ $hasSuffix }) => ($hasSuffix ? '52px' : '20px')};
  background-color: #f7f7fc;
  border: 1px solid ${({ $hasError }) => ($hasError ? 'var(--pl-coral-dark)' : 'transparent')};
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  color: var(--pl-navy);
  box-sizing: border-box;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    background-color: #fff;
    border-color: var(--pl-blue);
    box-shadow: 0 0 0 0.2rem rgba(59, 46, 232, 0.12);
  }

  &::placeholder {
    color: var(--pl-muted);
  }

  &:disabled {
    opacity: 0.75;
    cursor: not-allowed;
    background-color: #efeff7;
  }
`;

const SuffixWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 10px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ErrorText = styled.div`
  color: var(--pl-coral-dark);
  font-size: 0.75rem;
  margin-top: 0.3rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
`;

const HelperText = styled.div`
  color: var(--pl-muted);
  font-size: 0.75rem;
  margin-top: 0.3rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
`;

// ============================================
// TIPOS
// ============================================

export interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  suffix?: React.ReactNode;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  fullWidth,
  suffix,
  id,
  ...rest
}) =>
{
  const inputId = id || rest.name;

  return (
    <FieldWrapper $fullWidth={fullWidth}>
      {label && (
        <FieldLabel htmlFor={inputId}>
          {label}
          {required && <span className="required-star">*</span>}
        </FieldLabel>
      )}
      <InputRoot $hasError={!!error}>
        <StyledInput
          id={inputId}
          $hasError={!!error}
          $hasSuffix={!!suffix}
          {...rest}
        />
        {suffix && <SuffixWrapper>{suffix}</SuffixWrapper>}
      </InputRoot>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {!error && helperText ? <HelperText>{helperText}</HelperText> : null}
    </FieldWrapper>
  );
};

export default FormField;

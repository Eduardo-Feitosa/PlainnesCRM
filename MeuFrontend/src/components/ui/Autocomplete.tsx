import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';

export interface AutocompleteOption {
  id: number;
  label: string;
  hint?: string;
}

interface AutocompleteProps {
  id: string;
  label: string;
  placeholder: string;
  options: AutocompleteOption[];
  error?: string;
  hint?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (option: AutocompleteOption) => void;
  disabled?: boolean;
}

export function Autocomplete({
  id,
  label,
  placeholder,
  options,
  error,
  hint,
  value,
  onValueChange,
  onSelect,
  disabled = false
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const term = value.trim().toLowerCase();
    const base = term ? options.filter((o) => o.label.toLowerCase().includes(term)) : options;
    return base.slice(0, 8);
  }, [options, value]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const choose = (option: AutocompleteOption) => {
    onSelect(option);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filtered[activeIndex]) choose(filtered[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="position-relative" ref={containerRef}>
      <Form.Group controlId={id}>
        <Form.Label>{label}</Form.Label>
        <Form.Control
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          isInvalid={Boolean(error)}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown} />
        
        {error && <div className="invalid-feedback d-block">{error}</div>}
        {hint && !error && <Form.Text>{hint}</Form.Text>}
      </Form.Group>

      {open && !disabled &&
      <div className="pl-suggestions" role="listbox" aria-label={label}>
          {filtered.length === 0 ?
        <div className="px-3 py-2 pl-muted" style={{ fontSize: '0.85rem' }}>
              Nenhum resultado encontrado
            </div> :

        filtered.map((option, index) =>
        <button
          key={option.id}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className={`pl-suggestion ${index === activeIndex ? 'is-active' : ''}`}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(option)}>
          
                <span className="fw-semibold">{option.label}</span>
                {option.hint && <span className="pl-muted" style={{ fontSize: '0.78rem' }}>{option.hint}</span>}
              </button>
        )
        }
        </div>
      }
    </div>);

}
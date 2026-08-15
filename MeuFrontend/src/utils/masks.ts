export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d.
  replace(/^(\d{3})(\d)/, '$1.$2').
  replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').
  replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function maskCNPJ(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  return d.
  replace(/^(\d{2})(\d)/, '$1.$2').
  replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').
  replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4').
  replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}
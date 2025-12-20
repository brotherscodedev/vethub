// Máscara de CPF: 000.000.000-00
export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// Máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000
export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

// Validação de Email (Regex simples e funcional)
export const validateEmail = (email: string) => {
  return /\S+@\S+\.\S+/.test(email);
};

// Máscara para Peso (ex: 12,50 ou 105,0)
export const maskWeight = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d+)(\d{2})$/, '$1,$2')
    .replace(/^(0+)(\d)/, '$2');
};

// Máscara para Altura (ex: 1,75 ou 0,85)
export const maskHeight = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{1})(\d{2})$/, '$1,$2')
    .replace(/(,\d{2})\d+?$/, '$1');
};

// Máscara para Ano (ex: 2023)
export const maskYear = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{4}).+?$/, '$1');
};

// Máscara para CRMV (ex: 123456/UF)
export const maskCRMV = (value: string) => {
  return value
    .replace(/[^0-9a-zA-Z]/g, '')
    .replace(/^(\d{1,6})([a-zA-Z]{0,2})$/, '$1/$2')
    .toUpperCase();
};

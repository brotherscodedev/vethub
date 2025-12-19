/**
 * Converte uma data americana ou objeto Date para o formato brasileiro (DD/MM/AAAA).
 * @param date - Data em formato string (YYYY-MM-DD ou MM/DD/YYYY) ou objeto Date.
 * @returns String formatada em PT-BR.
 */
export const formatarParaDataBR = (date: string | Date): string => {
  if (!date) return '-';

  if (typeof date === 'string') {
    const [ano, mes, dia] = date.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  }

  return date.toLocaleDateString('pt-BR');
};

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data ISO para o formato localizado (pt-BR)
 * @param dateString - String de data no formato ISO
 * @returns Data formatada no estilo DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro na data';
  }
}

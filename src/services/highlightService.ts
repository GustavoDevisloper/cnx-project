// Tipos de destaque disponíveis
export enum HighlightTypes {
  TEXT = 'text',
  UNDERLINE = 'underline',
  CIRCLE = 'circle'
}

// Cores disponíveis para destaque
export const HighlightColors = {
  yellow: 'bg-yellow-200 dark:bg-yellow-900/40',
  green: 'bg-green-200 dark:bg-green-900/40',
  blue: 'bg-blue-200 dark:bg-blue-900/40',
  red: 'bg-red-200 dark:bg-red-900/40',
  purple: 'bg-purple-200 dark:bg-purple-900/40',
};

// Interface para destacar
export interface Highlight {
  id: string;
  reference: string;  // Formato: "Livro Capítulo:Versículo" (ex: "João 3:16")
  type: HighlightTypes;
  color: keyof typeof HighlightColors;
  note?: string;
  createdAt: Date;
}

// Salvar um destaque no localStorage
export function saveHighlight(highlight: Highlight): void {
  const highlights = getAllHighlights();
  highlights.push(highlight);
  localStorage.setItem('bible_highlights', JSON.stringify(highlights));
}

// Obter todos os destaques
export function getAllHighlights(): Highlight[] {
  const highlights = localStorage.getItem('bible_highlights');
  return highlights ? JSON.parse(highlights) : [];
}

// Obter destaques para uma referência específica
export function getHighlightsByReference(reference: string): Highlight[] {
  const highlights = getAllHighlights();
  return highlights.filter(h => h.reference === reference);
}

// Atualizar um destaque existente
export function updateHighlight(id: string, data: Partial<Highlight>): void {
  const highlights = getAllHighlights();
  const index = highlights.findIndex(h => h.id === id);
  
  if (index !== -1) {
    highlights[index] = { ...highlights[index], ...data };
    localStorage.setItem('bible_highlights', JSON.stringify(highlights));
  }
}

// Remover um destaque
export function removeHighlight(id: string): void {
  let highlights = getAllHighlights();
  highlights = highlights.filter(h => h.id !== id);
  localStorage.setItem('bible_highlights', JSON.stringify(highlights));
} 
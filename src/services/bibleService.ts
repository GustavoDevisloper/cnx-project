import axios from "axios";
import { supabase } from "./supabaseClient";
import { toast } from "@/hooks/use-toast";

// Tipos de versões da Bíblia disponíveis
export type BibleVersion = "NVI" | "ACF" | "ARA" | "NTLH" | "NVT" | "KJV";

// Interface para referência bíblica
export interface ScriptureReference {
  book: string;
  chapter: number;
  verses: number | number[] | string; // Pode ser versículo único, múltiplos ou range (ex: "1-3")
}

// Interface para texto bíblico
export interface ScriptureText {
  reference: string;        // Referência formatada (ex: "João 3:16")
  text: string;             // Texto completo do versículo
  version: BibleVersion;    // Versão da Bíblia
}

export interface BibleVerse {
  reference: string;        // Ex: "João 3:16"
  text: string;             // Texto do versículo
  version: BibleVersion;    // Versão da Bíblia
  bookId?: string;          // ID do livro
  chapter?: number;         // Número do capítulo
  verse?: number;           // Número do versículo
}

export interface VerseExplanation {
  reference: string;        // Referência do versículo
  explanation: string;      // Explicação/comentário sobre o versículo
  authorId?: string;        // ID do autor da explicação (opcional)
  authorName?: string;      // Nome do autor da explicação (opcional)
  source?: string;          // Fonte da explicação (opcional)
}

// Lista de versões da Bíblia com seus nomes completos
export const bibleVersions: Record<BibleVersion, string> = {
  NVI: "Nova Versão Internacional",
  ACF: "Almeida Corrigida Fiel",
  ARA: "Almeida Revista e Atualizada",
  NTLH: "Nova Tradução na Linguagem de Hoje",
  NVT: "Nova Versão Transformadora",
  KJV: "King James Atualizada"
};

// Mapeamento de versões da Bíblia para os códigos da API
const apiVersionMapping: Record<BibleVersion, string> = {
  NVI: "nvi",
  ACF: "acf",
  ARA: "ara",
  NTLH: "ntlh",
  NVT: "nvt",  // Note: If this version is not available in the API, it will fallback to NVI
  KJV: "kjv"   // Note: If this version is not available in the API, it will fallback to NVI
};

// Versão de fallback para quando a selecionada não estiver disponível
const FALLBACK_VERSION = "nvi";

// Adicione este mapeamento de temas para versículos
const themeToScriptures: Record<string, string[]> = {
  "amor": [
    "João 3:16",
    "1 Coríntios 13:4-7",
    "1 João 4:19",
    "Romanos 5:8",
    "1 João 4:7-8"
  ],
  "fé": [
    "Hebreus 11:1",
    "Marcos 11:22-24",
    "2 Coríntios 5:7",
    "Tiago 2:14-17",
    "Romanos 10:17"
  ],
  "esperança": [
    "Romanos 15:13",
    "Jeremias 29:11",
    "Hebreus 6:19",
    "Salmos 71:14",
    "1 Pedro 1:3"
  ],
  "perdão": [
    "Colossenses 3:13",
    "Mateus 6:14-15",
    "Efésios 4:32",
    "1 João 1:9",
    "Lucas 23:34"
  ],
  "gratidão": [
    "1 Tessalonicenses 5:18",
    "Salmos 107:1",
    "Colossenses 3:15-17",
    "Filipenses 4:6-7",
    "Salmos 100:4"
  ]
};

// Substitua a linha que usa process.env por uma variável de ambiente do Vite
const BIBLE_API_KEY = import.meta.env.VITE_BIBLE_API_KEY || '';

// Mapeamento de nomes de livros para os códigos usados pela API
const bookCodeMapping: Record<string, string> = {
  'Gênesis': 'gn',
  'Êxodo': 'ex',
  'Levítico': 'lv',
  'Números': 'nm',
  'Deuteronômio': 'dt',
  'Josué': 'js',
  'Juízes': 'jz',
  'Rute': 'rt',
  '1 Samuel': '1sm',
  '2 Samuel': '2sm',
  '1 Reis': '1rs',
  '2 Reis': '2rs',
  '1º Reis': '1rs', // Formato alternativo
  '2º Reis': '2rs', // Formato alternativo
  '1 Crônicas': '1cr',
  '2 Crônicas': '2cr',
  '1º Crônicas': '1cr', // Formato alternativo
  '2º Crônicas': '2cr', // Formato alternativo
  'Esdras': 'ed',
  'Neemias': 'ne',
  'Ester': 'et',
  'Jó': 'jó',
  'Salmos': 'sl',
  'Provérbios': 'pv',
  'Eclesiastes': 'ec',
  'Cânticos': 'ct',
  'Cantares': 'ct', // Nome alternativo
  'Isaías': 'is',
  'Jeremias': 'jr',
  'Lamentações': 'lm',
  'Ezequiel': 'ez',
  'Daniel': 'dn',
  'Oséias': 'os',
  'Joel': 'jl',
  'Amós': 'am',
  'Obadias': 'ob',
  'Jonas': 'jn',
  'Miquéias': 'mq',
  'Naum': 'na',
  'Habacuque': 'hc',
  'Sofonias': 'sf',
  'Ageu': 'ag',
  'Zacarias': 'zc',
  'Malaquias': 'ml',
  'Mateus': 'mt',
  'Marcos': 'mc',
  'Lucas': 'lc',
  'João': 'jo',
  'Atos': 'at',
  'Romanos': 'rm',
  '1 Coríntios': '1co',
  '2 Coríntios': '2co',
  '1º Coríntios': '1co', // Formato alternativo
  '2º Coríntios': '2co', // Formato alternativo
  'Gálatas': 'gl',
  'Efésios': 'ef',
  'Filipenses': 'fp',
  'Colossenses': 'cl',
  '1 Tessalonicenses': '1ts',
  '2 Tessalonicenses': '2ts',
  '1º Tessalonicenses': '1ts', // Formato alternativo
  '2º Tessalonicenses': '2ts', // Formato alternativo
  '1 Timóteo': '1tm',
  '2 Timóteo': '2tm',
  '1º Timóteo': '1tm', // Formato alternativo
  '2º Timóteo': '2tm', // Formato alternativo
  'Tito': 'tt',
  'Filemom': 'fm',
  'Hebreus': 'hb',
  'Tiago': 'tg',
  '1 Pedro': '1pe',
  '2 Pedro': '2pe',
  '1º Pedro': '1pe', // Formato alternativo
  '2º Pedro': '2pe', // Formato alternativo
  '1 João': '1jo',
  '2 João': '2jo',
  '3 João': '3jo',
  '1º João': '1jo', // Formato alternativo
  '2º João': '2jo', // Formato alternativo
  '3º João': '3jo', // Formato alternativo
  'Judas': 'jd',
  'Apocalipse': 'ap'
};

// Função para analisar uma referência bíblica em texto (ex: "João 3:16-18")
export function parseScriptureReference(reference: string): ScriptureReference | null {
  try {
    // Regex para extrair livro, capítulo e versículos
    const regex = /^(\d*\s*[A-Za-zÀ-ÖØ-öø-ÿ]+)\s*(\d+):(\d+(?:-\d+)?)(?:-(\d+))?$/;
    const match = reference.match(regex);
    
    if (!match) return null;
    
    const [, book, chapter, verses] = match;
    
    return {
      book: book.trim(),
      chapter: parseInt(chapter),
      verses: verses.includes('-') ? verses : parseInt(verses)
    };
  } catch (error) {
    console.error("Erro ao analisar referência bíblica:", error);
    return null;
  }
}

// Função para obter o texto de um versículo específico usando a API
export async function getScriptureText(
  reference: string,
  version: BibleVersion = 'NVI'
): Promise<ScriptureText | null> {
  try {
    const formattedRef = formatReferenceForApi(reference);
    
    // Verificar se a versão existe no mapeamento, senão usar fallback
    const apiVersion = apiVersionMapping[version] || FALLBACK_VERSION;
    
    const url = `https://www.abibliadigital.com.br/api/verses/${apiVersion}/${formattedRef}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${BIBLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error("Erro ao buscar versículo:", response.statusText);
      // Se a versão solicitada não for encontrada, tentar com a versão fallback
      if (response.status === 404 && apiVersion !== FALLBACK_VERSION) {
        console.log(`Tentando com versão fallback: ${FALLBACK_VERSION}`);
        return getScriptureText(reference, 'NVI'); // Tentar novamente com NVI
      }
      
      return {
        reference,
        text: getFallbackScriptureText(reference, version) || '',
        version
      };
    }

    const data = await response.json();
    return {
      reference,
      text: data.text,
      version
    };
  } catch (error) {
    console.error("Erro ao buscar versículo:", error);
    return {
      reference,
      text: getFallbackScriptureText(reference, version) || '',
      version
    };
  }
}

// Função para formatar a referência para a API
function formatReferenceForApi(reference: string): string {
  const parsed = parseScriptureReference(reference);
  if (!parsed) return '';
  
  const bookCode = getBookCode(parsed.book);
  return `${bookCode}/${parsed.chapter}/${parsed.verses}`;
}

// Função para traduzir nomes de livros
function translateBookName(bookName: string): string {
  // Implemente a tradução de nomes de livros se necessário
  return bookName;
}

// Função para obter o código do livro para a API
export function getBookCode(bookName: string): string {
  // Normaliza o formato do nome do livro (remove espaços extras, etc)
  const normalizedBookName = bookName.trim();
  
  const code = bookCodeMapping[normalizedBookName];
  if (!code) {
    console.warn(`Código não encontrado para o livro: ${normalizedBookName}`);
    // Tenta encontrar uma correspondência parcial
    for (const [key, value] of Object.entries(bookCodeMapping)) {
      if (normalizedBookName.includes(key) || key.includes(normalizedBookName)) {
        console.log(`Usando código alternativo: ${value} para livro: ${normalizedBookName}`);
        return value;
      }
    }
    return 'gn'; // Retorna Gênesis como fallback
  }
  return code;
}

// Função para buscar versículos por tema
export const searchVersesByTheme = async (
  theme: string,
  version: BibleVersion = "NVI",
  limit: number = 10
): Promise<BibleVerse[]> => {
  try {
    // Primeiro, tenta buscar versículos pré-definidos para o tema
    const predefinedVerses = themeToScriptures[theme.toLowerCase()];
    if (predefinedVerses) {
      const verses = await Promise.all(
        predefinedVerses.slice(0, limit).map(async (reference) => {
          const verse = await getVerseByReference(reference, version);
          return verse || getFallbackVerse(reference, version);
        })
      );
      return verses.filter((v): v is BibleVerse => v !== null);
    }

    // Se não houver versículos pré-definidos, faz uma busca na API
    const response = await axios.get(
      `https://www.abibliadigital.com.br/api/verses/search`,
      {
        headers: { Authorization: `Bearer ${BIBLE_API_KEY}` },
        params: { 
          version: apiVersionMapping[version] || FALLBACK_VERSION,
          search: theme,
          limit
        }
      }
    );

    if (response.data && response.data.verses) {
      return response.data.verses.map((v: any) => ({
        reference: `${v.book.name} ${v.chapter}:${v.number}`,
        text: v.text,
        version,
        bookId: v.book.abbrev,
        chapter: v.chapter,
        verse: v.number
      }));
    }

    return getFallbackVerses(theme, version);
  } catch (error) {
    console.error("Erro ao buscar versículos por tema:", error);
    return getFallbackVerses(theme, version);
  }
};

// Função para obter um versículo específico
export const getVerseByReference = async (
  reference: string,
  version: BibleVersion = "NVI"
): Promise<BibleVerse | null> => {
  try {
    const scripture = await getScriptureText(reference, version);
    if (!scripture) return null;

    return {
      reference: scripture.reference,
      text: scripture.text,
      version: scripture.version
    };
  } catch (error) {
    console.error("Erro ao buscar versículo:", error);
    return null;
  }
};

// Função para obter explicação de um versículo
export const getVerseExplanation = async (
  reference: string
): Promise<VerseExplanation | null> => {
  try {
    // Aqui você pode implementar a lógica para buscar explicações de um banco de dados
    // Por enquanto, vamos retornar uma explicação genérica
    return {
      reference,
      explanation: getGenericExplanation(reference),
      source: "Sistema Conexão Jovem"
    };
  } catch (error) {
    console.error("Erro ao buscar explicação do versículo:", error);
    return null;
  }
};

// Função para gerar uma explicação genérica
const getGenericExplanation = (reference: string): string => {
  return `Este versículo (${reference}) nos ensina importantes lições sobre fé, amor e esperança. Ele nos lembra da importância de confiar em Deus e seguir Seus ensinamentos em nossa vida diária.`;
};

// Função para obter um versículo em múltiplas versões
export const getVerseInMultipleVersions = async (
  reference: string,
  versions: BibleVersion[] = ["NVI", "ARA", "NTLH", "ACF", "KJV"]
): Promise<BibleVerse[]> => {
  try {
    const results = await Promise.all(
      versions.map(async (version) => {
        const verse = await getVerseByReference(reference, version);
        return verse || getFallbackVerse(reference, version);
      })
    );
    
    return results.filter((v): v is BibleVerse => v !== null);
  } catch (error) {
    console.error("Erro ao buscar versículo em múltiplas versões:", error);
    return versions.map(version => getFallbackVerse(reference, version)).filter((v): v is BibleVerse => v !== null);
  }
};

// Função para obter texto de fallback
const getFallbackScriptureText = (reference: string, version: BibleVersion): string | null => {
  // Implementar lógica de fallback se necessário
  return `[${version}] ${reference} - Texto não disponível no momento.`;
};

// Função para obter versículo de fallback
const getFallbackVerse = (reference: string, version: BibleVersion): BibleVerse => {
  return {
    reference,
    text: getFallbackScriptureText(reference, version) || '',
    version
  };
};

// Função para obter versículos de fallback por tema
const getFallbackVerses = (theme: string, version: BibleVersion): BibleVerse[] => {
  const fallbackReferences = themeToScriptures[theme.toLowerCase()] || ["João 3:16"];
  return fallbackReferences.map(reference => getFallbackVerse(reference, version));
};

// Função para obter um versículo por tema
export function getScriptureByTheme(theme: string): string {
  const versesForTheme = themeToScriptures[theme.toLowerCase()];
  if (versesForTheme && versesForTheme.length > 0) {
    const randomIndex = Math.floor(Math.random() * versesForTheme.length);
    return versesForTheme[randomIndex];
  }
  return "João 3:16"; // Versículo padrão se o tema não for encontrado
}

// Função para gerar uma mensagem baseada em um tema
export function generateThemeMessage(theme: string): string {
  return `Reflexão sobre ${theme}: Este é um momento para refletirmos sobre a importância de ${theme} em nossas vidas. A Bíblia nos ensina valiosas lições sobre este tema.`;
}

// Função para obter a lista de livros da Bíblia
export async function getBooksOfBible(): Promise<string[]> {
  try {
    const response = await axios.get(
      'https://www.abibliadigital.com.br/api/books',
      {
        headers: { Authorization: `Bearer ${BIBLE_API_KEY}` }
      }
    );
    
    return response.data.map((book: any) => book.name);
  } catch (error) {
    console.error("Erro ao buscar livros da Bíblia:", error);
    return Object.keys(bookCodeMapping);
  }
}

// Função para obter o número de capítulos de um livro
export async function getChapterCount(book: string): Promise<number> {
  try {
    const bookCode = getBookCode(book);
    const response = await axios.get(
      `https://www.abibliadigital.com.br/api/books/${bookCode}`,
      {
        headers: { Authorization: `Bearer ${BIBLE_API_KEY}` }
      }
    );
    
    return response.data.chapters;
  } catch (error) {
    console.error("Erro ao buscar número de capítulos:", error);
    return 0;
  }
}

// Função para obter os versículos de um capítulo
export async function getChapterVerses(
  book: string, 
  chapter: number, 
  version: BibleVersion = 'NVI'
): Promise<{number: number, text: string}[]> {
  try {
    const bookCode = getBookCode(book);
    const apiVersion = apiVersionMapping[version] || FALLBACK_VERSION;
    
    const response = await axios.get(
      `https://www.abibliadigital.com.br/api/verses/${apiVersion}/${bookCode}/${chapter}`,
      {
        headers: { Authorization: `Bearer ${BIBLE_API_KEY}` }
      }
    );
    
    return response.data.verses.map((verse: any) => ({
      number: verse.number,
      text: verse.text
    }));
  } catch (error) {
    console.error("Erro ao buscar versículos do capítulo:", error);
    return [];
  }
}

// Função para verificar suporte à síntese de voz
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}

// Função para obter vozes disponíveis
export function getAvailableVoices(lang = 'pt-BR'): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => voice.lang.startsWith(lang));
}

// Função para sintetizar voz
export function speakText(text: string, options: {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  onEnd?: () => void;
  onError?: () => void;
} = {}): SpeechSynthesisUtterance {
  if (!isSpeechSynthesisSupported()) {
    throw new Error('Speech synthesis is not supported in this browser');
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Configurar opções
  utterance.lang = options.lang || 'pt-BR';
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;
  
  if (options.voice) {
    utterance.voice = options.voice;
  }
  
  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }
  
  if (options.onError) {
    utterance.onerror = options.onError;
  }
  
  window.speechSynthesis.speak(utterance);
  return utterance;
}

// Função para parar a síntese de voz
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

// Função para obter o número de capítulos
export function getChaptersCount(book: string): number {
  // Implementar lógica para retornar o número de capítulos de um livro
  // Por enquanto, retornando um valor padrão
  return 50;
}

// Função para buscar versículos por tema
export const fetchBibleVersesByTheme = async (
  theme: string,
  version: BibleVersion = "NVI"
): Promise<ScriptureText[]> => {
  try {
    const verses = await searchVersesByTheme(theme, version);
    return verses.map(verse => ({
      reference: verse.reference,
      text: verse.text,
      version: verse.version
    }));
  } catch (error) {
    console.error("Erro ao buscar versículos por tema:", error);
    return [];
  }
};
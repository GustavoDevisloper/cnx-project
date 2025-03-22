import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { bibleBooks } from '@/data/bibleData';

interface VerseSearchProps {
  onNavigate: (book: string, chapter: number, verse?: number) => void;
}

export function VerseSearch({ onNavigate }: VerseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Função para processar a busca
  const handleSearch = () => {
    // Limpar a consulta de espaços extras
    const query = searchQuery.trim();
    
    if (!query) {
      toast({
        variant: "destructive",
        title: "Consulta inválida",
        description: "Por favor, digite um livro, capítulo ou referência."
      });
      return;
    }

    // Procurar padrões como "João 3:16" ou "Gênesis 1:1-10"
    const referenceRegex = /^([\wÀ-ÿ\s]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i;
    const matches = query.match(referenceRegex);

    if (matches) {
      const [, bookName, chapterStr, verseStr] = matches;
      const normalizedBookName = normalizeBookName(bookName);
      
      // Verificar se o livro existe
      const book = findBook(normalizedBookName);
      
      if (!book) {
        toast({
          variant: "destructive",
          title: "Livro não encontrado",
          description: `Não encontramos o livro "${bookName}" na Bíblia.`
        });
        return;
      }

      const chapter = parseInt(chapterStr);
      const verse = verseStr ? parseInt(verseStr) : undefined;
      
      // Fechar o popover e navegar para o versículo
      setIsOpen(false);
      onNavigate(book, chapter, verse);
      
      toast({
        title: "Referência encontrada",
        description: `Navegando para ${book} ${chapter}${verse ? `:${verse}` : ''}`
      });
    } else {
      // Tentar encontrar apenas o livro
      const book = findBook(normalizeBookName(query));
      
      if (book) {
        setIsOpen(false);
        onNavigate(book, 1); // Ir para o capítulo 1 do livro
        
        toast({
          title: "Livro encontrado",
          description: `Navegando para ${book} capítulo 1`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Referência não reconhecida",
          description: "Use o formato 'Livro Capítulo:Versículo' (ex: João 3:16)"
        });
      }
    }
  };

  // Normaliza o nome do livro para facilitar a busca
  const normalizeBookName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
  };

  // Encontra o livro na lista de livros disponíveis
  const findBook = (normalizedName: string): string | undefined => {
    return bibleBooks.find(book => {
      const normalizedBook = normalizeBookName(book);
      return normalizedBook === normalizedName || 
             normalizedBook.includes(normalizedName) ||
             normalizedName.includes(normalizedBook);
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="w-10 h-10">
          <Search className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Buscar referência bíblica</h4>
          <p className="text-xs text-muted-foreground">
            Digite um livro, capítulo ou referência específica (ex: João 3:16)
          </p>
          <div className="flex space-x-2">
            <Input
              placeholder="Ex: Salmos 23 ou João 3:16"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 
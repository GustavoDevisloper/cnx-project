import React, { useEffect, useState } from "react";
import { getChaptersCount, BibleVersion, bibleVersions } from "@/services/bibleService";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bibleBooks } from '@/data/bibleData'; // Importe do arquivo de dados estáticos

interface BibleNavigationProps {
  currentBook: string;
  currentChapter: number;
  currentVersion: BibleVersion;
  onBookChange: (book: string) => void;
  onChapterChange: (chapter: number) => void;
  onVersionChange: (version: BibleVersion) => void;
}

export function BibleNavigation({
  currentBook,
  currentChapter,
  currentVersion,
  onBookChange,
  onChapterChange,
  onVersionChange,
}: BibleNavigationProps) {
  const [totalChapters, setTotalChapters] = useState(1);
  const [isSticky, setIsSticky] = useState(false);
  
  // Use a lista estática de livros da Bíblia
  const books = bibleBooks;

  // Atualizar o total de capítulos quando o livro mudar
  useEffect(() => {
    setTotalChapters(getChaptersCount(currentBook));
  }, [currentBook]);

  // Configurar o detector de scroll para controlar a barra fixa
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navegar para o capítulo anterior
  const goToPreviousChapter = () => {
    if (currentChapter > 1) {
      onChapterChange(currentChapter - 1);
    } else {
      const currentIndex = books.findIndex(book => book === currentBook);
      if (currentIndex > 0) {
        const previousBook = books[currentIndex - 1];
        const lastChapter = getChaptersCount(previousBook);
        onBookChange(previousBook);
        onChapterChange(lastChapter);
      }
    }
  };

  // Navegar para o próximo capítulo
  const goToNextChapter = () => {
    if (currentChapter < totalChapters) {
      onChapterChange(currentChapter + 1);
    } else {
      const currentIndex = books.findIndex(book => book === currentBook);
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        onBookChange(nextBook);
        onChapterChange(1);
      }
    }
  };

  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <div className={`bg-background border-b py-3 z-20 w-full ${isSticky ? "sticky top-0 shadow-md" : ""}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Seletor de Livro */}
          <div className="w-full">
            <Select value={currentBook} onValueChange={onBookChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um livro" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {books.map((book) => (
                    <SelectItem key={book} value={book}>{book}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Navegação de Capítulos */}
          <div className="flex items-center gap-2 w-full">
            <Button variant="outline" size="icon" onClick={goToPreviousChapter}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select 
              value={currentChapter.toString()} 
              onValueChange={(value) => onChapterChange(parseInt(value))}
              className="flex-1"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Capítulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter} value={chapter.toString()}>
                      {chapter}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={goToNextChapter}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Seletor de Versão */}
          <div className="w-full">
            <Select value={currentVersion} onValueChange={onVersionChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Versão" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(bibleVersions).map(([code, name]) => (
                    <SelectItem key={code} value={code as BibleVersion}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
} 
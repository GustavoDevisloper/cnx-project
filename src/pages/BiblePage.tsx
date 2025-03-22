import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BibleReader } from '@/components/BibleReader';
import { BibleNavigation } from '@/components/BibleNavigation';
import { VerseSearch } from '@/components/VerseSearch';
import { BibleVersion } from '@/services/bibleService';

export default function BiblePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [book, setBook] = useState<string>(searchParams.get('book') || 'Gênesis');
  const [chapter, setChapter] = useState<number>(Number(searchParams.get('chapter')) || 1);
  const [highlightedVerse, setHighlightedVerse] = useState<number | undefined>(
    searchParams.get('verse') ? Number(searchParams.get('verse')) : undefined
  );
  const [version, setVersion] = useState<BibleVersion>(
    (localStorage.getItem("preferredBibleVersion") as BibleVersion) || "NVI"
  );

  // Atualiza a URL quando o livro ou capítulo mudam
  useEffect(() => {
    const params: Record<string, string> = { 
      book, 
      chapter: chapter.toString() 
    };
    
    if (highlightedVerse) {
      params.verse = highlightedVerse.toString();
    }
    
    setSearchParams(params);
  }, [book, chapter, highlightedVerse, setSearchParams]);

  const handleBookChange = (newBook: string) => {
    setBook(newBook);
    setChapter(1); // Reset para o primeiro capítulo ao mudar de livro
    setHighlightedVerse(undefined); // Limpar versículo destacado
  };

  const handleChapterChange = (newChapter: number) => {
    setChapter(newChapter);
    setHighlightedVerse(undefined); // Limpar versículo destacado
  };

  const handleVersionChange = (newVersion: BibleVersion) => {
    setVersion(newVersion);
    localStorage.setItem("preferredBibleVersion", newVersion);
  };

  // Função para navegação direta via pesquisa
  const handleSearchNavigate = (newBook: string, newChapter: number, verse?: number) => {
    setBook(newBook);
    setChapter(newChapter);
    setHighlightedVerse(verse);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bíblia Sagrada</h1>
        <VerseSearch onNavigate={handleSearchNavigate} />
      </div>
      
      <BibleNavigation
        currentBook={book}
        currentChapter={chapter}
        currentVersion={version}
        onBookChange={handleBookChange}
        onChapterChange={handleChapterChange}
        onVersionChange={handleVersionChange}
      />
      
      <BibleReader
        book={book}
        chapter={chapter}
        version={version}
        highlightedVerse={highlightedVerse}
      />
    </div>
  );
} 
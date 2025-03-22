import React, { useState, useEffect, useRef } from 'react';
import { getChapterVerses, BibleVersion } from '@/services/bibleService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HighlightTypes, HighlightColors } from '@/services/highlightService';
import { PenLine, MessageSquare, Bookmark, Share, Trash, BookOpenText, Highlighter, X, Save, Pencil, Volume2, VolumeX, User, UserRound, Check } from 'lucide-react';
import { Highlight } from '@/components/icons/Highlight';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface BibleVerse {
  number: number;
  text: string;
}

interface BibleReaderProps {
  book: string;
  chapter: number;
  version: BibleVersion;
  highlightedVerse?: number;
}

interface UserHighlight {
  id: string;
  reference: string;
  verses: number[];
  color: keyof typeof HighlightColors;
  note?: string;
  createdAt: string;
}

type VoiceGender = 'male' | 'female' | 'any';

export function BibleReader({ book, chapter, version, highlightedVerse }: BibleReaderProps) {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highlights, setHighlights] = useState<UserHighlight[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<keyof typeof HighlightColors>('yellow');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedHighlight, setSelectedHighlight] = useState<UserHighlight | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('any');
  
  // Referências para elementos DOM
  const versesContainerRef = useRef<HTMLDivElement>(null);
  
  // Carregar versículos do capítulo
  useEffect(() => {
    let isMounted = true;
    const fetchVerses = async () => {
      setIsLoading(true);
      try {
        const chapterVerses = await getChapterVerses(book, chapter, version);
        if (isMounted) {
          setVerses(chapterVerses);
        }
      } catch (error) {
        console.error("Erro ao carregar versículos:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchVerses();
    return () => { isMounted = false; };
  }, [book, chapter, version]);
  
  // Carregar grifos salvos do localStorage
  useEffect(() => {
    try {
      const reference = `${book} ${chapter}`;
      const savedHighlights = JSON.parse(localStorage.getItem('bibleHighlights') || '[]');
      setHighlights(savedHighlights.filter((h: UserHighlight) => h.reference === reference));
    } catch (error) {
      console.error("Erro ao carregar grifos:", error);
      setHighlights([]);
    }
  }, [book, chapter]);
  
  // Carregar preferência de gênero de voz do localStorage
  useEffect(() => {
    const savedGender = localStorage.getItem('preferredVoiceGender');
    if (savedGender && ['male', 'female', 'any'].includes(savedGender)) {
      setVoiceGender(savedGender as VoiceGender);
    }
  }, []);
  
  // Função para verificar se um versículo está destacado
  const isVerseHighlighted = (verseNumber: number) => {
    if (!highlights || highlights.length === 0) return false;
    return highlights.some(h => {
      return h && h.verses && Array.isArray(h.verses) && h.verses.includes(verseNumber);
    });
  };
  
  // Função para obter a cor de um versículo destacado
  const getVerseHighlightColor = (verseNumber: number) => {
    if (!highlights || highlights.length === 0) return '';
    const highlight = highlights.find(h => {
      return h && h.verses && Array.isArray(h.verses) && h.verses.includes(verseNumber);
    });
    return highlight ? HighlightColors[highlight.color] : '';
  };
  
  // Função para adicionar ou remover um versículo da seleção
  const toggleVerseSelection = (verseNumber: number) => {
    if (!isHighlighting) return;
    
    // Evitar atualizações de estado em operações pendentes
    setSelectedVerses(prev => {
      // Verificar se o versículo já está selecionado
      const isSelected = prev.includes(verseNumber);
      
      if (isSelected) {
        // Remover o versículo da seleção
        return prev.filter(v => v !== verseNumber);
      } else {
        // Adicionar o versículo à seleção e ordenar
        return [...prev, verseNumber].sort((a, b) => a - b);
      }
    });
  };
  
  // Função para salvar um novo destaque
  const saveHighlight = () => {
    if (selectedVerses.length === 0) return;
    
    try {
      // Criar o novo destaque com todos os dados necessários
      const newHighlight: UserHighlight = {
        id: Date.now().toString(),
        reference: `${book} ${chapter}`,
        verses: [...selectedVerses], // Criar uma cópia para evitar problemas de referência
        color: selectedColor,
        note: noteText.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      
      // Ler destaques existentes do localStorage
      let allHighlights = [];
      try {
        const savedData = localStorage.getItem('bibleHighlights');
        allHighlights = savedData ? JSON.parse(savedData) : [];
      } catch (e) {
        console.error("Erro ao ler destaques existentes:", e);
        allHighlights = [];
      }
      
      const updatedHighlights = [...allHighlights, newHighlight];
      
      // Salvar no localStorage
      localStorage.setItem('bibleHighlights', JSON.stringify(updatedHighlights));
      
      // Importante: Primeiro atualize o estado de highlights com o novo destaque
      setHighlights(prevHighlights => [...prevHighlights, newHighlight]);
      
      // Depois limpe os outros estados
      setSelectedVerses([]);
      setNoteText('');
      setIsHighlighting(false);
      setShowNoteInput(false);
      
      toast({
        title: "Destaque Salvo",
        description: `${selectedVerses.length} versículo(s) destacado(s).`,
      });

      // Forçar uma re-renderização
      setTimeout(() => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 10);
      }, 50);
      
    } catch (error) {
      console.error("Erro ao salvar destaque:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o destaque. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Função para remover um destaque
  const removeHighlight = (highlightId: string) => {
    try {
      // Ler do localStorage de forma síncrona
      let allHighlights = [];
      try {
        const savedData = localStorage.getItem('bibleHighlights');
        allHighlights = savedData ? JSON.parse(savedData) : [];
      } catch (e) {
        console.error("Erro ao ler destaques existentes:", e);
        allHighlights = [];
      }
      
      const updatedHighlights = allHighlights.filter((h: UserHighlight) => h.id !== highlightId);
      
      // Salvar no localStorage de forma síncrona
      localStorage.setItem('bibleHighlights', JSON.stringify(updatedHighlights));
      
      // Atualizar o estado após a operação de IO ser concluída
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
      setSelectedHighlight(null);
      
      toast({
        title: "Destaque Removido",
        description: "O destaque foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao remover destaque:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o destaque. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Função para salvar a preferência de gênero de voz
  const handleVoiceGenderChange = (value: string) => {
    const gender = value as VoiceGender;
    setVoiceGender(gender);
    localStorage.setItem('preferredVoiceGender', gender);
  };
  
  // Função para detectar gênero da voz com base no nome
  const detectVoiceGender = (voice: SpeechSynthesisVoice): VoiceGender => {
    const name = voice.name.toLowerCase();
    
    // Palavras-chave para vozes femininas em vários idiomas
    const femaleKeywords = ['female', 'woman', 'girl', 'mulher', 'feminina', 'mujer', 'femenina', 'femme'];
    
    // Palavras-chave para vozes masculinas em vários idiomas
    const maleKeywords = ['male', 'man', 'boy', 'homem', 'masculina', 'hombre', 'masculino', 'homme'];
    
    if (femaleKeywords.some(keyword => name.includes(keyword))) {
      return 'female';
    }
    
    if (maleKeywords.some(keyword => name.includes(keyword))) {
      return 'male';
    }
    
    // Alguns sistemas de voz usam padrões de nomenclatura específicos
    // Vozes do Microsoft Windows geralmente têm padrões como "Microsoft Maria", "Microsoft Daniel"
    const commonFemaleNames = ['maria', 'helena', 'joana', 'julia', 'isabel', 'ana', 'sarah', 'mary', 'emma', 'olivia', 'sophia'];
    const commonMaleNames = ['daniel', 'paulo', 'joão', 'pedro', 'marcos', 'carlos', 'joão', 'john', 'james', 'michael', 'david'];
    
    for (const femaleName of commonFemaleNames) {
      if (name.includes(femaleName)) return 'female';
    }
    
    for (const maleName of commonMaleNames) {
      if (name.includes(maleName)) return 'male';
    }
    
    return 'any'; // Não foi possível determinar o gênero
  };
  
  // Função para iniciar ou parar a leitura em voz
  const toggleSpeech = () => {
    if (isSpeaking) {
      // Cancelar a síntese de voz e limpar quaisquer temporizadores
      window.speechSynthesis.cancel();
      // Limpar o cronômetro do watchdog
      if (window.speechSynthesisTimeoutId) {
        clearTimeout(window.speechSynthesisTimeoutId);
        window.speechSynthesisTimeoutId = undefined;
      }
      setIsSpeaking(false);
      return;
    }
    
    // Verificar se a API é suportada
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta a leitura em voz alta.",
        variant: "destructive"
      });
      return;
    }
    
    // Carregar vozes e garantir que elas estejam disponíveis
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Em alguns navegadores, as vozes são carregadas de forma assíncrona
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        processSpeech(voices);
      };
    } else {
      processSpeech(voices);
    }
  };
  
  // Função para processar e iniciar a leitura
  const processSpeech = (voices: SpeechSynthesisVoice[]) => {
    try {
      console.log("Vozes disponíveis:", voices.map(v => `${v.name} (${v.lang})`));
      
      // Filtrar vozes por idioma
      let filteredVoices = voices.filter(voice => 
        voice.lang.startsWith('pt') || 
        voice.lang.includes('Portuguese') ||
        voice.lang.startsWith('es') || // Espanhol como backup
        voice.lang.startsWith('en')    // Inglês como último recurso
      );
      
      if (filteredVoices.length === 0) {
        filteredVoices = voices; // Se não encontrar vozes nos idiomas preferidos, usar todas
      }
      
      // Filtrar por gênero se não for 'any'
      if (voiceGender !== 'any') {
        console.log(`Filtrando por gênero: ${voiceGender}`);
        const genderedVoices = filteredVoices.filter(voice => detectVoiceGender(voice) === voiceGender);
        // Só usar vozes filtradas por gênero se encontrar alguma
        if (genderedVoices.length > 0) {
          filteredVoices = genderedVoices;
          console.log(`Vozes ${voiceGender} encontradas:`, filteredVoices.map(v => v.name));
        } else {
          console.log(`Nenhuma voz do gênero ${voiceGender} encontrada. Usando todas as vozes disponíveis.`);
        }
      }
      
      if (filteredVoices.length === 0) {
        toast({
          title: "Vozes não encontradas",
          description: "Seu navegador não tem vozes instaladas para leitura em português.",
          variant: "destructive"
        });
        return;
      }
      
      // Escolher voz - preferir vozes em português
      const ptVoices = filteredVoices.filter(v => v.lang.startsWith('pt'));
      const selectedVoice = ptVoices.length > 0 ? ptVoices[0] : filteredVoices[0];
      
      console.log("Voz selecionada:", selectedVoice.name, selectedVoice.lang);
      
      // Criar texto para leitura
      let currentChunk = '';
      const maxLength = 200; // Limitar tamanho para evitar problemas
      const chunks: string[] = [];
      
      // Preparar o texto para leitura, dividindo em chunks menores
      for (const verse of verses) {
        const verseText = `Versículo ${verse.number}. ${verse.text} `;
        
        // Se adicionar este versículo ultrapassar o limite, criar novo chunk
        if (currentChunk.length + verseText.length > maxLength) {
          chunks.push(currentChunk);
          currentChunk = verseText;
        } else {
          currentChunk += verseText;
        }
      }
      
      // Adicionar o último chunk se houver conteúdo
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      
      console.log(`Dividido em ${chunks.length} partes para leitura`);
      
      // Função para ler os chunks sequencialmente
      let currentIndex = 0;
      const speakNextChunk = () => {
        // Verificar se ainda devemos continuar (ou se o usuário cancelou a leitura)
        if (!isSpeaking && currentIndex > 0) {
          console.log("Leitura cancelada pelo usuário.");
          return;
        }
        
        if (currentIndex < chunks.length) {
          const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
          utterance.rate = 0.9;  // Velocidade levemente reduzida para melhor compreensão
          utterance.pitch = 1.0;
          
          utterance.onend = () => {
            // Só continuar se ainda estivermos em modo de leitura
            if (isSpeaking) {
              currentIndex++;
              speakNextChunk();
            }
          };
          
          utterance.onerror = (event) => {
            // Se for apenas uma interrupção, não mostrar erro (é esperado quando cancelamos)
            if (event.error === 'interrupted' || event.error === 'canceled') {
              console.log("Leitura interrompida:", event.error);
            } else {
              console.error("Erro na leitura:", event);
              toast({
                title: "Erro na leitura",
                description: "Ocorreu um erro durante a leitura.",
                variant: "destructive"
              });
            }
            
            // De qualquer forma, garantir que saímos do modo de leitura
            setIsSpeaking(false);
          };
          
          window.speechSynthesis.speak(utterance);
          
          // Implementar um "watchdog" para casos em que a API falha silenciosamente
          // @ts-ignore - Adicionando propriedade personalizada
          window.speechSynthesisTimeoutId = setTimeout(() => {
            if (isSpeaking) {
              console.log("Watchdog: verificando se a síntese de voz ainda está ativa");
              // Se não estiver falando, reiniciar a síntese
              if (!window.speechSynthesis.speaking) {
                console.log("A síntese de voz parou inesperadamente, reiniciando do próximo chunk");
                currentIndex++;
                speakNextChunk();
              }
            }
          }, 5000);
        } else {
          setIsSpeaking(false);
        }
      };
      
      // Iniciar a leitura
      setIsSpeaking(true);
      speakNextChunk();
      
    } catch (error) {
      console.error("Erro ao configurar leitura:", error);
      setIsSpeaking(false);
      toast({
        title: "Erro na configuração",
        description: "Não foi possível configurar a leitura em voz alta.",
        variant: "destructive"
      });
    }
  };
  
  // Declaração de tipo para a propriedade personalizada
  declare global {
    interface Window {
      speechSynthesisTimeoutId?: NodeJS.Timeout;
    }
  }
  
  // Parar a leitura quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        if (window.speechSynthesisTimeoutId) {
          clearTimeout(window.speechSynthesisTimeoutId);
          window.speechSynthesisTimeoutId = undefined;
        }
      }
    };
  }, [isSpeaking]);
  
  // Função para grifar os versículos selecionados
  const highlightVerses = () => {
    if (selectedVerses.length === 0) return;
    
    // Criar um novo destaque com a cor escolhida
    const newHighlight: UserHighlight = {
      id: `${Date.now()}`,
      reference: `${book} ${chapter}`,
      verses: [...selectedVerses],
      color: selectedColor, // Usar a cor selecionada
      timestamp: Date.now()
    };
    
    // Adicionar à lista local de highlights (estado)
    // Primeiro criar uma cópia dos destaques atuais
    const updatedHighlights = [...highlights];
    
    // Remover destaques existentes para os mesmos versículos
    const filteredHighlights = updatedHighlights.filter(h => {
      return !h.verses.some(v => selectedVerses.includes(v));
    });
    
    // Adicionar o novo destaque
    filteredHighlights.push(newHighlight);
    
    // Atualizar o estado com os novos destaques
    setHighlights(filteredHighlights);
    
    // Salvar no localStorage
    try {
      // Primeiro, carregar todos os destaques existentes
      const allHighlights = JSON.parse(localStorage.getItem('bibleHighlights') || '[]');
      
      // Filtrar destaques deste mesmo versículo
      const otherHighlights = allHighlights.filter((h: UserHighlight) => 
        h.reference !== `${book} ${chapter}` || 
        !h.verses.some(v => selectedVerses.includes(v))
      );
      
      // Adicionar o novo destaque
      localStorage.setItem('bibleHighlights', JSON.stringify([...otherHighlights, newHighlight]));
      
      toast({
        title: "Texto grifado com sucesso",
        description: `${selectedVerses.length} versículo(s) destacado(s) com a cor selecionada`,
      });
    } catch (error) {
      console.error('Erro ao salvar destaque:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar destaque",
        description: "Não foi possível salvar seu destaque",
      });
    }
    
    // Limpar seleção atual
    setSelectedVerses([]);
    setIsHighlighting(false);
  };
  
  // Adicione um useEffect para rolar até o versículo destacado
  useEffect(() => {
    if (highlightedVerse && !isLoading && versesContainerRef.current) {
      const verseElement = document.getElementById(`verse-${highlightedVerse}`);
      if (verseElement) {
        setTimeout(() => {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Adicionar uma classe temporária para destacar o versículo
          verseElement.classList.add('bg-primary/20');
          setTimeout(() => {
            verseElement.classList.remove('bg-primary/20');
          }, 3000);
        }, 500);
      }
    }
  }, [highlightedVerse, isLoading]);
  
  // Função para renderizar os versículos
  const renderVerses = () => {
    return verses.map((verse) => {
      const isSelected = selectedVerses.includes(verse.number);
      const isHighlighted = isVerseHighlighted(verse.number);
      const highlightClass = getVerseHighlightColor(verse.number);
      const isSearchResult = verse.number === highlightedVerse;
      
      return (
        <div 
          id={`verse-${verse.number}`}
          key={verse.number} 
          className={`flex p-2 rounded-md transition-colors ${
            isSelected ? 'bg-primary/10' : 
            isHighlighted ? highlightClass : ''
          } ${isHighlighting ? 'cursor-pointer' : ''} ${
            isSearchResult ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => toggleVerseSelection(verse.number)}
        >
          <span className="font-bold text-lg mr-2 text-muted-foreground">{verse.number}</span>
          <p className="flex-1">{verse.text}</p>
        </div>
      );
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          {/* Barra de ações */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={isHighlighting ? "default" : "outline"} 
                      size="icon"
                      onClick={() => {
                        setIsHighlighting(!isHighlighting);
                        if (!isHighlighting) {
                          setSelectedVerses([]);
                          setShowNoteInput(false);
                        }
                      }}
                    >
                      <Highlighter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grifar texto</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {isHighlighting && (
                <div className="flex items-center space-x-2 bg-background rounded-md p-2 shadow-sm border">
                  <div className="text-xs text-muted-foreground mr-1">Cores:</div>
                  {(Object.keys(HighlightColors) as Array<keyof typeof HighlightColors>).map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full ${
                        color === 'yellow' ? 'bg-yellow-400' :
                        color === 'green' ? 'bg-green-400' :
                        color === 'blue' ? 'bg-blue-400' :
                        color === 'purple' ? 'bg-purple-400' :
                        color === 'pink' ? 'bg-pink-400' : ''
                      } ${selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      aria-label={`Cor ${color}`}
                    />
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={highlightVerses}
                    disabled={selectedVerses.length === 0}
                    className="ml-2"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    <span className="text-xs">Aplicar</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsHighlighting(false);
                      setSelectedVerses([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={toggleSpeech}>
                      {isSpeaking ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isSpeaking ? "Parar leitura" : "Ler em voz alta"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Seletor de gênero da voz */}
              {!isSpeaking && (
                <Select value={voiceGender} onValueChange={handleVoiceGenderChange}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="male">Masculina</SelectItem>
                    <SelectItem value="female">Feminina</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Marcar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Versículos */}
          <div ref={versesContainerRef} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {renderVerses()}
              </>
            )}
          </div>
          
          {/* Formulário de anotação */}
          {showNoteInput && selectedHighlight && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold mb-2">
                Anotação para {book} {chapter}:{selectedHighlight.verses[0]}
              </h3>
              <div className="space-y-4">
                <Input
                  placeholder="Digite sua anotação"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button variant="default" onClick={() => {
                    setShowNoteInput(false);
                    setSelectedHighlight(null);
                    setNoteText('');
                  }}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" className="ml-auto" onClick={() => removeHighlight(selectedHighlight.id)}>
                    <Trash className="h-4 w-4 mr-2" />
                    Remover grifo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
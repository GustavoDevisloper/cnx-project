import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchIcon, PlusCircle, Book, Calendar } from "lucide-react";
import { generateDevotionalByTheme, DevotionalRequest } from "@/services/devotionalService";
import { searchVersesByTheme, getVerseByReference, BibleVerse } from "@/services/bibleService";
import { toast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";

export default function DevotionalManager() {
  const [activeTab, setActiveTab] = useState("theme");
  const [isLoading, setIsLoading] = useState(false);
  const [themeInput, setThemeInput] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customScripture, setCustomScripture] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>(new Date());
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);

  // Busca versículos relacionados ao tema
  const handleSearchVerses = async () => {
    if (!themeInput.trim()) {
      toast({
        title: "Tema obrigatório",
        description: "Por favor, digite um tema para buscar versículos relacionados",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const verses = await searchVersesByTheme(themeInput);
      setSearchResults(verses);
      
      if (verses.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: `Não encontramos versículos para o tema "${themeInput}"`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar versículos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Busca um versículo específico pela referência
  const handleLookupScripture = async () => {
    if (!customScripture.trim()) {
      toast({
        title: "Referência obrigatória",
        description: "Por favor, informe a referência do versículo",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const verse = await getVerseByReference(customScripture);
      setSelectedVerse(verse);
      
      if (!verse) {
        toast({
          title: "Versículo não encontrado",
          description: `Não conseguimos encontrar "${customScripture}"`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível encontrar o versículo especificado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Seleciona um versículo dos resultados da busca
  const handleSelectVerse = (verse: BibleVerse) => {
    setSelectedVerse(verse);
    setCustomScripture(verse.reference);
  };

  // Gera o devocional com as informações fornecidas
  const handleCreateDevotional = async () => {
    if (!themeInput.trim()) {
      toast({
        title: "Tema obrigatório",
        description: "Por favor, informe um tema para o devocional",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const request: DevotionalRequest = {
        theme: themeInput,
        customScripture: selectedVerse?.reference || customScripture,
        customTitle: customTitle || undefined
      };

      const result = await generateDevotionalByTheme(request);
      
      if (result) {
        toast({
          title: "Devocional criado",
          description: `O devocional "${result.title}" foi criado com sucesso!`,
        });
        
        // Limpar os campos após o sucesso
        setThemeInput("");
        setCustomScripture("");
        setCustomTitle("");
        setSelectedVerse(null);
        setSearchResults([]);
      }
    } catch (error) {
      toast({
        title: "Erro ao criar devocional",
        description: "Não foi possível criar o devocional. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Book className="mr-2 h-5 w-5" />
          Criar Novo Devocional
        </CardTitle>
        <CardDescription>
          Crie um devocional personalizado baseado em um tema ou versículo específico
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="theme">Por Tema</TabsTrigger>
            <TabsTrigger value="verse">Por Versículo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="theme" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema do Devocional</Label>
              <div className="flex gap-2">
                <Input 
                  id="theme"
                  placeholder="Ex: amor, fé, esperança, perseverança..."
                  value={themeInput}
                  onChange={(e) => setThemeInput(e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSearchVerses} 
                  disabled={isLoading}
                >
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Digite um tema para buscar versículos relacionados
              </p>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Versículos Relacionados</Label>
                <div className="rounded-md border bg-muted/40 divide-y">
                  {searchResults.map((verse, index) => (
                    <div 
                      key={`${verse.reference}-${index}`}
                      className={`p-3 cursor-pointer hover:bg-accent/30 transition-colors ${selectedVerse?.reference === verse.reference ? 'bg-accent/20' : ''}`}
                      onClick={() => handleSelectVerse(verse)}
                    >
                      <p className="font-semibold text-sm">{verse.reference}</p>
                      <p className="text-sm mt-1">{verse.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="verse" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verse-reference">Referência Bíblica</Label>
              <div className="flex gap-2">
                <Input 
                  id="verse-reference"
                  placeholder="Ex: João 3:16"
                  value={customScripture}
                  onChange={(e) => setCustomScripture(e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleLookupScripture} 
                  disabled={isLoading}
                >
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Digite a referência exata do versículo desejado
              </p>
            </div>

            {selectedVerse && (
              <div className="rounded-md border p-3 mt-4 bg-muted/40">
                <p className="font-semibold">{selectedVerse.reference}</p>
                <p className="mt-1">{selectedVerse.text}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="theme-for-verse">Tema Relacionado</Label>
              <Input 
                id="theme-for-verse"
                placeholder="Ex: amor, fé, esperança..."
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Digite um tema relacionado ao versículo para gerar o devocional
              </p>
            </div>
          </TabsContent>
          
          <div className="space-y-4 mt-6 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="custom-title">Título Personalizado (opcional)</Label>
              <Input 
                id="custom-title"
                placeholder="Deixe em branco para gerar automaticamente"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Data de Publicação</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <DatePicker 
                  date={targetDate} 
                  setDate={setTargetDate} 
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Tabs>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleCreateDevotional} 
          disabled={isLoading || !themeInput.trim()}
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {isLoading ? "Criando devocional..." : "Criar Devocional"}
        </Button>
      </CardFooter>
    </Card>
  );
} 
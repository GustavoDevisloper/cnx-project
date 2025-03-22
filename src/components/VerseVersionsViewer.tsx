import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getVerseInMultipleVersions, BibleVersion, BibleVerse, bibleVersions } from "@/services/bibleService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Loader2 } from "lucide-react";

interface VerseVersionsViewerProps {
  reference: string;
}

export default function VerseVersionsViewer({ reference }: VerseVersionsViewerProps) {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supportedVersions: BibleVersion[] = ["NVI", "ARA", "NTLH", "ACF", "KJV"];
  
  useEffect(() => {
    if (!reference) return;
    
    const loadVerseVersions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getVerseInMultipleVersions(reference, supportedVersions);
        setVerses(result);
      } catch (err) {
        console.error("Erro ao carregar versões do versículo:", err);
        setError("Não foi possível carregar as versões do versículo");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVerseVersions();
  }, [reference]);
  
  if (!reference) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Book className="mr-2 h-5 w-5" />
          {reference} em Diferentes Versões
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-6 text-destructive">
            <p>{error}</p>
          </div>
        ) : verses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Nenhuma versão encontrada para este versículo</p>
          </div>
        ) : (
          <Tabs defaultValue={verses[0]?.version || "NVI"}>
            <TabsList className="mb-4">
              {verses.map(verse => (
                <TabsTrigger key={verse.version} value={verse.version}>
                  {bibleVersions[verse.version]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {verses.map(verse => (
              <TabsContent key={verse.version} value={verse.version}>
                <div className="bg-muted/30 p-4 rounded-md">
                  <blockquote className="italic border-l-2 border-primary pl-4 py-1">
                    {verse.text}
                  </blockquote>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  Fonte: {bibleVersions[verse.version]}
                </p>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 
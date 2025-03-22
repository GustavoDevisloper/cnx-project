import { useState, useEffect } from "react";
import { BibleVersion, getScriptureText, bibleVersions } from "@/services/bibleService";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ScriptureViewerProps {
  reference: string;
  defaultVersion?: BibleVersion;
}

const ScriptureViewer = ({ reference, defaultVersion = "NVI" }: ScriptureViewerProps) => {
  const [version, setVersion] = useState<BibleVersion>(defaultVersion);
  const [scriptureText, setScriptureText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!reference) return;
    
    const fetchScripture = async () => {
      setIsLoading(true);
      try {
        const result = await getScriptureText(reference, version);
        setScriptureText(result?.text || null);
      } catch (error) {
        console.error("Erro ao buscar texto bíblico:", error);
        setScriptureText(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScripture();
  }, [reference, version]);
  
  const handleVersionChange = (value: string) => {
    setVersion(value as BibleVersion);
  };
  
  if (!reference) return null;
  
  return (
    <div className="mt-2 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {reference}
        </h3>
        <Select value={version} onValueChange={handleVersionChange}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Versão da Bíblia" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(bibleVersions).map(([key, name]) => (
                <SelectItem key={key} value={key} className="text-sm">
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardContent className="p-4 bg-muted/30">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <blockquote className="italic text-sm border-l-2 border-primary pl-4 py-1">
              {scriptureText}
            </blockquote>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScriptureViewer; 
import { useState, useEffect } from "react";
import { BibleVersion, bibleVersions } from "@/services/bibleService";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export const BibleVersionSetting = () => {
  const [version, setVersion] = useState<BibleVersion>(
    (localStorage.getItem("preferredBibleVersion") as BibleVersion) || "NVI"
  );
  
  const handleVersionChange = (value: string) => {
    const newVersion = value as BibleVersion;
    setVersion(newVersion);
    localStorage.setItem("preferredBibleVersion", newVersion);
    
    toast({
      title: "Versão da Bíblia atualizada",
      description: `A versão padrão foi alterada para ${bibleVersions[newVersion]}`
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Versão da Bíblia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Escolha sua versão preferida da Bíblia para leitura dos versículos.
          </p>
          <Select value={version} onValueChange={handleVersionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma versão" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(bibleVersions).map(([key, name]) => (
                  <SelectItem key={key} value={key}>{name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}; 
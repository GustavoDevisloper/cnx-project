import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveTrack, removeTrack, SpotifyTrack } from "@/services/spotifyService";
import { toast } from "@/hooks/use-toast";
import { ExternalLink, Heart } from "lucide-react";

interface TrackCardProps {
  track: SpotifyTrack;
  onSaveToggle?: (trackId: string, saved: boolean) => void;
  isAuthenticated: boolean;
}

export function TrackCard({ track, onSaveToggle, isAuthenticated }: TrackCardProps) {
  const [isSaved, setIsSaved] = useState(track.is_saved || false);
  const [isLoading, setIsLoading] = useState(false);
  
  const coverUrl = track.album.images[0]?.url || '/placeholder-cover.jpg';
  const artistNames = track.artists.map(artist => artist.name).join(", ");
  
  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Não autenticado",
        description: "Conecte-se ao Spotify para salvar faixas",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let success;
      
      if (isSaved) {
        success = await removeTrack(track.id);
        if (success) {
          toast({
            title: "Removida dos favoritos",
            description: `"${track.name}" foi removida dos seus favoritos!`
          });
        }
      } else {
        success = await saveTrack(track.id);
        if (success) {
          toast({
            title: "Adicionada aos favoritos",
            description: `"${track.name}" foi adicionada aos seus favoritos!`
          });
        }
      }
      
      if (success) {
        setIsSaved(!isSaved);
        if (onSaveToggle) onSaveToggle(track.id, !isSaved);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img 
          src={coverUrl} 
          alt={`${track.name} - ${artistNames}`} 
          className="object-cover w-full h-full transition-transform hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "/images/default-album-cover.jpg"; 
            // Fallback to a generic music placeholder if image fails to load
          }}
        />
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1 text-lg">{track.name}</h3>
        <p className="text-muted-foreground line-clamp-1">{artistNames}</p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading}
          onClick={handleSaveToggle}
          className={isSaved ? "text-green-600" : ""}
        >
          <Heart className={`h-5 w-5 ${isSaved ? "fill-green-600" : ""}`} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            Ouvir
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
} 
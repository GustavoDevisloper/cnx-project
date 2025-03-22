
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, Music, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface PlaylistProps {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  spotifyLink: string;
}

const PlaylistCard = ({ title, artist, imageUrl, spotifyLink }: PlaylistProps) => {
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    
    toast({
      title: liked ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: liked ? "Música removida da sua lista de favoritos" : "Música adicionada à sua lista de favoritos"
    });
  };

  const handleAddToSpotify = () => {
    // In a real implementation, we would use Spotify API
    window.open(spotifyLink, "_blank");
    
    toast({
      title: "Redirecionando para o Spotify",
      description: "Você será redirecionado para adicionar esta música à sua playlist"
    });
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md group animate-scale-in">
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={imageUrl || "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80"} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <Button 
            onClick={handleAddToSpotify}
            variant="secondary" 
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Adicionar ao Spotify
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold truncate">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 px-2"
          onClick={handleLike}
        >
          <Heart 
            size={18} 
            className={cn(
              "transition-colors", 
              liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
            )} 
          />
        </Button>
        <Button 
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2"
          onClick={() => window.open(spotifyLink, "_blank")}
        >
          <Music size={18} />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlaylistCard;

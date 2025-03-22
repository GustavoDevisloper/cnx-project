import { useEffect, useState } from "react";
import PlaylistCard, { PlaylistProps } from "@/components/PlaylistCard";
import { isAdmin } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Music, Search, RefreshCw, Headphones, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SpotifyLogin } from "@/components/SpotifyLogin";
import { 
  isAuthenticated as isSpotifyAuthenticated, 
  searchChristianMusic, 
  getPersonalizedChristianRecommendations,
  SpotifyTrack 
} from "@/services/spotifyService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Playlist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
  category: 'worship' | 'instrumental' | 'pop' | 'other';
  spotifyUrl: string;
}

const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: "1",
    name: "Louvor e Adoração",
    description: "Uma seleção de músicas cristãs contemporâneas para adorar a Deus.",
    imageUrl: "https://i.scdn.co/image/ab67706c0000da84fcb8b92f2688f41e3e0e42db",
    trackCount: 25,
    category: "worship",
    spotifyUrl: "https://open.spotify.com"
  },
  {
    id: "2",
    name: "Foco nos Estudos",
    description: "Música instrumental para ajudar na concentração durante os estudos.",
    imageUrl: "https://i.scdn.co/image/ab67706c0000da84525be69f40c96001e029cc3a",
    trackCount: 40,
    category: "instrumental",
    spotifyUrl: "https://open.spotify.com"
  },
  {
    id: "3",
    name: "Pop Cristão",
    description: "As melhores músicas do pop cristão nacional e internacional.",
    imageUrl: "https://i.scdn.co/image/ab67706c0000da845e0cdc088d16b7b92802a1bf",
    trackCount: 30,
    category: "pop",
    spotifyUrl: "https://open.spotify.com"
  },
  {
    id: "4",
    name: "Acústico e Reflexivo",
    description: "Músicas acústicas perfeitas para momentos de reflexão e oração.",
    imageUrl: "https://i.scdn.co/image/ab67706c0000da84982482844108a41c7a6c23f1",
    trackCount: 18,
    category: "worship",
    spotifyUrl: "https://open.spotify.com"
  }
];

const Playlists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);
  const [isOpen, setIsOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    title: "",
    artist: "",
    imageUrl: "",
    spotifyLink: ""
  });
  
  // Estado para integração com Spotify
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(isSpotifyAuthenticated());
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recommended");
  const [filter, setFilter] = useState<string>("all");
  
  const adminUser = isAdmin();

  useEffect(() => {
    document.title = "JovemCristo | Playlists";
    
    // Get playlists from localStorage or use sample data
    const savedPlaylists = localStorage.getItem("playlists");
    if (savedPlaylists) {
      setPlaylists(JSON.parse(savedPlaylists));
    } else {
      setPlaylists(MOCK_PLAYLISTS);
      localStorage.setItem("playlists", JSON.stringify(MOCK_PLAYLISTS));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPlaylist(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPlaylist = () => {
    if (!newPlaylist.title || !newPlaylist.artist || !newPlaylist.spotifyLink) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha título, artista e link do Spotify",
        variant: "destructive"
      });
      return;
    }
    
    const newPlaylistItem: Playlist = {
      id: Date.now().toString(),
      name: newPlaylist.title,
      description: newPlaylist.artist,
      imageUrl: newPlaylist.imageUrl || "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80",
      trackCount: 0,
      category: "other",
      spotifyUrl: newPlaylist.spotifyLink
    };

    const updatedPlaylists = [newPlaylistItem, ...playlists];
    setPlaylists(updatedPlaylists);
    localStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
    
    setNewPlaylist({
      title: "",
      artist: "",
      imageUrl: "",
      spotifyLink: ""
    });
    
    setIsOpen(false);
    
    toast({
      title: "Música adicionada",
      description: "A música foi adicionada à playlist com sucesso"
    });
  };

  // Manipula quando um usuário favorita/desfavorita uma música
  const handleTrackSaveToggle = (trackId: string, saved: boolean) => {
    // Atualiza o estado das recomendações
    setRecommendations(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, is_saved: saved } 
          : track
      )
    );
  };

  const filteredPlaylists = filter === "all" 
    ? playlists 
    : playlists.filter(playlist => playlist.category === filter);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Música Inspiradora</h1>
        
        {adminUser && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Nova Música
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Música</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={newPlaylist.title}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="artist" className="text-right">
                    Artista
                  </Label>
                  <Input
                    id="artist"
                    name="artist"
                    value={newPlaylist.artist}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="imageUrl" className="text-right">
                    URL da imagem
                  </Label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    value={newPlaylist.imageUrl}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="Opcional"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="spotifyLink" className="text-right">
                    Link Spotify
                  </Label>
                  <Input
                    id="spotifyLink"
                    name="spotifyLink"
                    value={newPlaylist.spotifyLink}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddPlaylist}>Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlaylists.map((playlist) => (
          <Card key={playlist.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square overflow-hidden">
              <img 
                src={playlist.imageUrl} 
                alt={playlist.name}
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardHeader>
              <CardTitle>{playlist.name}</CardTitle>
              <CardDescription>{playlist.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Music className="mr-2 h-4 w-4" />
                <span>{playlist.trackCount} faixas</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <a href={playlist.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <Headphones className="h-4 w-4" />
                  Ouvir no Spotify
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Playlists;

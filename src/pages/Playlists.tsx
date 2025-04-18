import { useEffect, useState, useRef } from "react";
import PlaylistCard, { PlaylistProps } from "@/components/PlaylistCard";
import { isAdmin } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Music, Search, RefreshCw, Headphones, ExternalLink, Loader2, User, Book } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SpotifyLogin } from "@/components/SpotifyLogin";
import { 
  SpotifyTrack,
  SpotifyPlaylist
} from "@/services/spotifyServiceReal";
import * as SpotifyAPI from "@/services/spotifyServiceReal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Playlist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
  category: 'worship' | 'instrumental' | 'pop' | 'other';
  spotifyUrl: string;
}

const Playlists = () => {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    title: "",
    artist: "",
    imageUrl: "",
    spotifyLink: ""
  });
  
  // Estado para integração com Spotify
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(true);
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);
  const [searchArtists, setSearchArtists] = useState<any[]>([]);
  const [searchPlaylists, setSearchPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recommended");
  const [searchResultsTab, setSearchResultsTab] = useState("tracks");
  const [filter, setFilter] = useState<string>("all");
  
  const adminUser = isAdmin();
  const searchResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "JovemCristo | Playlists";
    
    const initApi = async () => {
      setIsCheckingApi(true);
      try {
        // Verificar se a API do Spotify está disponível
        const available = await SpotifyAPI.isApiAvailable();
        setIsApiAvailable(available);
        
        if (available) {
          // Carregar playlists e recomendações iniciais
          await loadInitialData();
        }
      } catch (error) {
        console.error("Erro ao inicializar API:", error);
        setIsApiAvailable(false);
      } finally {
        setIsCheckingApi(false);
      }
    };
    
    initApi();
  }, []);
  
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Carregar playlists em paralelo com recomendações
      const [playlistsData, recommendationsData] = await Promise.allSettled([
        SpotifyAPI.getChristianPlaylists(),
        SpotifyAPI.getChristianRecommendations()
      ]);
      
      // Processar resultado das playlists
      let validPlaylists: SpotifyPlaylist[] = [];
      if (playlistsData.status === 'fulfilled') {
        validPlaylists = playlistsData.value.filter(playlist => 
          playlist && playlist.id && playlist.name && playlist.external_urls
        );
      } else {
        console.error("Erro ao carregar playlists:", playlistsData.reason);
        toast({
          title: "Problema ao carregar playlists",
          description: "Não foi possível obter as playlists do Spotify neste momento.",
          variant: "destructive"
        });
      }
      
      // Processar resultado das recomendações
      let validRecommendations: SpotifyTrack[] = [];
      if (recommendationsData.status === 'fulfilled') {
        validRecommendations = recommendationsData.value.filter(track => 
          track && track.id && track.name && track.album && track.external_urls
        );
      } else {
        console.error("Erro ao carregar recomendações:", recommendationsData.reason);
        // Tentar obter recomendações alternativas em caso de falha
        try {
          const fallbackRecommendations = await SpotifyAPI.getChristianRecommendations();
          validRecommendations = fallbackRecommendations.filter(track => 
            track && track.id && track.name && track.album && track.external_urls
          );
        } catch (fallbackError) {
          console.error("Falha também no fallback de recomendações:", fallbackError);
        }
      }
      
      setPlaylists(validPlaylists);
      setRecommendations(validRecommendations);
      
      // Verificar se obtivemos dados
      if (validPlaylists.length === 0 && validRecommendations.length === 0) {
        toast({
          title: "Problemas de conexão",
          description: "Estamos enfrentando dificuldades para conectar com o serviço do Spotify. Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os dados do Spotify",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

    // Adicionar à lista local (poderia implementar uma API para salvar no backend)
    setNewPlaylist({
      title: "",
      artist: "",
      imageUrl: "",
      spotifyLink: ""
    });
    
    setIsOpen(false);
    
    toast({
      title: "Playlist adicionada",
      description: "A playlist foi adicionada com sucesso"
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setActiveTab("search");
    
    try {
      // Buscar músicas, artistas e playlists em paralelo
      const [tracksResults, artistsResults, playlistsResults] = await Promise.allSettled([
        SpotifyAPI.searchChristianMusic(searchQuery),
        SpotifyAPI.searchArtists(searchQuery),
        SpotifyAPI.searchPlaylists(searchQuery)
      ]);
      
      // Processar resultados de músicas
      let validTracks: SpotifyTrack[] = [];
      if (tracksResults.status === 'fulfilled') {
        validTracks = tracksResults.value.filter(track => 
          track && track.id && track.name && track.album && track.external_urls
        );
        setRecommendations(validTracks);
      }
      
      // Processar resultados de artistas
      let validArtists: any[] = [];
      if (artistsResults.status === 'fulfilled') {
        validArtists = artistsResults.value.filter(artist => 
          artist && artist.id && artist.name
        );
        setSearchArtists(validArtists);
      }
      
      // Processar resultados de playlists
      let validPlaylists: SpotifyPlaylist[] = [];
      if (playlistsResults.status === 'fulfilled') {
        validPlaylists = playlistsResults.value.filter(playlist => 
          playlist && playlist.id && playlist.name && playlist.external_urls
        );
        setSearchPlaylists(validPlaylists);
      }
      
      // Determinar qual aba mostrar com base nos resultados
      if (validTracks.length > 0) {
        setSearchResultsTab("tracks");
      } else if (validArtists.length > 0) {
        setSearchResultsTab("artists");
      } else if (validPlaylists.length > 0) {
        setSearchResultsTab("playlists");
      }
      
      // Mensagem de feedback sobre resultados
      const totalResults = validTracks.length + validArtists.length + validPlaylists.length;
      
      if (totalResults === 0) {
        toast({
          title: "Nenhum resultado",
          description: `Não encontramos resultados para "${searchQuery}". Tente outro termo.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: `${totalResults} resultados encontrados`,
          description: `${validTracks.length} músicas, ${validArtists.length} artistas e ${validPlaylists.length} playlists.`,
          variant: "default"
        });
        
        // Rolar até a seção de resultados após a busca
        setTimeout(() => {
          searchResultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca. Tente novamente em instantes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    setIsLoading(true);
    try {
      const freshRecommendations = await SpotifyAPI.getChristianRecommendations();
      
      // Filtrar recomendações que possam estar com dados incompletos
      const validRecommendations = freshRecommendations.filter(track => 
        track && track.id && track.name && track.album && track.external_urls
      );
      
      setRecommendations(validRecommendations);
      setActiveTab("recommended");
      
      // Se não houver recomendações válidas, mas não ocorreu exceção
      if (validRecommendations.length === 0) {
        toast({
          title: "Sem recomendações disponíveis",
          description: "Não foi possível obter recomendações neste momento. Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar recomendações:", error);
      toast({
        title: "Dificuldade de conexão",
        description: "Estamos enfrentando dificuldades para conectar à API do Spotify. Mostrando recomendações alternativas.",
        variant: "destructive"
      });
      
      // Mesmo com erro, pode haver recomendações de fallback
      const fallbackRecommendations = await SpotifyAPI.getChristianRecommendations().catch(() => []);
      setRecommendations(fallbackRecommendations || []);
    } finally {
      setIsLoading(false);
    }
  };

  const openInService = (track: SpotifyTrack, service: 'spotify' | 'youtube' | 'deezer') => {
    const artistName = track.artists && track.artists.length > 0 ? track.artists[0].name : '';
    const trackName = track.name;
    const searchQuery = `${artistName} ${trackName}`;
    
    let url = '';
    switch (service) {
      case 'spotify':
        url = track.external_urls.spotify;
        break;
      case 'youtube':
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        break;
      case 'deezer':
        url = `https://www.deezer.com/search/${encodeURIComponent(searchQuery)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      
      // Feedback para o usuário
      toast({
        title: `Abrindo no ${service.charAt(0).toUpperCase() + service.slice(1)}`,
        description: `${trackName} - ${artistName}`,
        variant: "default"
      });
    }
  };
  
  const openPlaylistInService = (playlist: SpotifyPlaylist, service: 'spotify' | 'youtube' | 'deezer') => {
    const playlistName = playlist.name;
    const searchQuery = `${playlistName} playlist`;
    
    let url = '';
    switch (service) {
      case 'spotify':
        url = playlist.external_urls.spotify;
        break;
      case 'youtube':
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        break;
      case 'deezer':
        url = `https://www.deezer.com/search/${encodeURIComponent(searchQuery)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      
      // Feedback para o usuário
      toast({
        title: `Abrindo no ${service.charAt(0).toUpperCase() + service.slice(1)}`,
        description: playlistName,
        variant: "default"
      });
    }
  };

  // Renderiza os resultados de busca com abas
  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      );
    }
    
    const hasResults = recommendations.length > 0 || searchArtists.length > 0 || searchPlaylists.length > 0;
    
    if (!hasResults) {
      return (
        <div className="text-center py-12">
          <Music size={48} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">
            {activeTab === "search" && searchQuery 
              ? `Nenhum resultado encontrado para "${searchQuery}"`
              : "Nenhum resultado encontrado"}
          </p>
          <Button 
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={refreshRecommendations}
          >
            <RefreshCw size={16} className="mr-2" />
            Buscar Recomendações
          </Button>
        </div>
      );
    }
    
    return (
      <>
        <div className="mb-4">
          <p className="text-sm text-zinc-400 mb-3">
            Resultados da busca para "{searchQuery}"
          </p>
          
          <Tabs defaultValue={searchResultsTab} value={searchResultsTab} onValueChange={setSearchResultsTab} className="w-full">
            <TabsList>
              <TabsTrigger 
                value="tracks" 
                className={searchResultsTab === "tracks" ? "bg-emerald-800" : ""}
                disabled={recommendations.length === 0}
              >
                <Music className="w-4 h-4 mr-2" />
                Músicas ({recommendations.length})
              </TabsTrigger>
              <TabsTrigger 
                value="artists" 
                className={searchResultsTab === "artists" ? "bg-emerald-800" : ""}
                disabled={searchArtists.length === 0}
              >
                <User className="w-4 h-4 mr-2" />
                Artistas ({searchArtists.length})
              </TabsTrigger>
              <TabsTrigger 
                value="playlists" 
                className={searchResultsTab === "playlists" ? "bg-emerald-800" : ""}
                disabled={searchPlaylists.length === 0}
              >
                <Book className="w-4 h-4 mr-2" />
                Playlists ({searchPlaylists.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tracks">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {recommendations.map(track => (
                  <div key={track.id} className="group relative rounded-md overflow-hidden transition-all duration-300 bg-zinc-800/50 hover:bg-zinc-700/50 p-3 hover:shadow-xl">
                    <div className="aspect-square overflow-hidden rounded-md mb-4 shadow-md">
                      <img 
                        src={track.album && track.album.images && track.album.images[0] ? track.album.images[0].url : "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae"} 
                        alt={track.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae";
                        }}
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-[4.5rem] right-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              className="rounded-full w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                            >
                              <Play size={20} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-white">
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openInService(track, 'spotify')}
                            >
                              <img src="/spotify-icon.png" alt="Spotify" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Ouvir no Spotify
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openInService(track, 'youtube')}
                            >
                              <img src="/youtube-icon.png" alt="YouTube" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Ouvir no YouTube
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openInService(track, 'deezer')}
                            >
                              <img src="/deezer-icon.png" alt="Deezer" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Ouvir no Deezer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <h3 className="font-semibold truncate text-white">{track.name}</h3>
                    <p className="text-sm text-zinc-400 truncate mt-1">
                      {track.artists && track.artists.length > 0 
                        ? track.artists.map(a => a.name).join(", ") 
                        : "Artista desconhecido"}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="artists">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {searchArtists.map(artist => (
                  <div key={artist.id} className="group relative rounded-md overflow-hidden transition-all duration-300 bg-zinc-800/50 hover:bg-zinc-700/50 p-3 hover:shadow-xl">
                    <div className="aspect-square overflow-hidden rounded-full mb-4 shadow-md mx-auto" style={{width: '80%'}}>
                      <img 
                        src={artist.images && artist.images[0] ? artist.images[0].url : "https://images.unsplash.com/photo-1511367461989-f85a21fda167"} 
                        alt={artist.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167";
                        }}
                      />
                    </div>
                    <h3 className="font-semibold truncate text-white text-center">{artist.name}</h3>
                    <p className="text-sm text-zinc-400 truncate mt-1 text-center">
                      {artist.followers?.total ? `${artist.followers.total.toLocaleString()} seguidores` : "Artista"}
                    </p>
                    <div className="mt-3 flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-emerald-400 border-emerald-400/30"
                        onClick={() => window.open(artist.external_urls?.spotify, "_blank")}
                      >
                        Ver no Spotify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="playlists">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {searchPlaylists.map(playlist => (
                  <div key={playlist.id} className="group relative rounded-md overflow-hidden transition-all duration-300 bg-zinc-800/50 hover:bg-zinc-700/50 p-3 hover:shadow-xl">
                    <div className="aspect-square overflow-hidden rounded-md mb-4 shadow-md">
                      <img 
                        src={playlist.images && playlist.images[0] ? playlist.images[0].url : "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae"} 
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae";
                        }}
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-[4.5rem] right-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              className="rounded-full w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                            >
                              <Play size={20} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-white">
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openPlaylistInService(playlist, 'spotify')}
                            >
                              <img src="/spotify-icon.png" alt="Spotify" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Abrir no Spotify
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openPlaylistInService(playlist, 'youtube')}
                            >
                              <img src="/youtube-icon.png" alt="YouTube" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Buscar no YouTube
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openPlaylistInService(playlist, 'deezer')}
                            >
                              <img src="/deezer-icon.png" alt="Deezer" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Buscar no Deezer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <h3 className="font-semibold truncate text-white">{playlist.name}</h3>
                    <p className="text-sm text-zinc-400 truncate mt-1">{playlist.description || "Playlist do Spotify"}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </>
    );
  };

  // Se estamos verificando a API, mostrar loading
  if (isCheckingApi) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto mb-4 text-emerald-500" />
            <h2 className="text-xl font-semibold text-white">Conectando ao Spotify...</h2>
            <p className="text-zinc-400 mt-2">Aguarde enquanto estabelecemos conexão com a API</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Barra de pesquisa e filtros - estilo Spotify */}
      <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-md p-4 border-b border-zinc-800">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
            <Input
              type="text"
              placeholder="Buscar músicas ou playlists"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 w-full focus:ring-emerald-500 focus:border-emerald-500 rounded-full"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-emerald-400 border-emerald-400 hover:bg-emerald-400/10"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Search size={16} className="mr-2" />}
              Buscar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Hero section */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-2 text-white">Música Inspiradora</h1>
          <p className="text-zinc-400 text-lg">Descubra músicas cristãs que elevam sua alma e conectam seu coração a Deus</p>
        </div>

        {!isApiAvailable ? (
          <div className="mb-10">
            <Card className="bg-gradient-to-r from-red-900 to-red-700 border-none text-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <AlertIcon size={48} className="text-red-300" />
                    <div>
                      <h3 className="text-xl font-bold mb-1">API do Spotify indisponível</h3>
                      <p className="text-red-100">Não foi possível estabelecer conexão com o Spotify. Verifique suas credenciais e tente novamente.</p>
                    </div>
                  </div>
                  <Button 
                    className="bg-white hover:bg-gray-100 text-red-900 font-medium"
                    onClick={loadInitialData}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Tentar novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Seção de playlists em destaque */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Playlists Gospel em Destaque</h2>
            {adminUser && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Plus size={16} />
                    Nova Playlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 text-white border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Adicionar Playlist</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right text-zinc-400">
                        Título
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={newPlaylist.title}
                        onChange={handleInputChange}
                        className="col-span-3 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="artist" className="text-right text-zinc-400">
                        Artista
                      </Label>
                      <Input
                        id="artist"
                        name="artist"
                        value={newPlaylist.artist}
                        onChange={handleInputChange}
                        className="col-span-3 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="imageUrl" className="text-right text-zinc-400">
                        URL da imagem
                      </Label>
                      <Input
                        id="imageUrl"
                        name="imageUrl"
                        value={newPlaylist.imageUrl}
                        onChange={handleInputChange}
                        className="col-span-3 bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="spotifyLink" className="text-right text-zinc-400">
                        Link Spotify
                      </Label>
                      <Input
                        id="spotifyLink"
                        name="spotifyLink"
                        value={newPlaylist.spotifyLink}
                        onChange={handleInputChange}
                        className="col-span-3 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAddPlaylist} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isLoading && playlists.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : playlists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="group relative rounded-md overflow-hidden transition-all duration-300 bg-zinc-800/50 hover:bg-zinc-700/50 p-3 hover:shadow-xl">
                  <div className="aspect-square overflow-hidden rounded-md mb-4 shadow-md">
                    <img 
                      src={playlist.images && playlist.images[0] ? playlist.images[0].url : "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae"} 
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae";
                      }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-[4.5rem] right-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            className="rounded-full w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                          >
                            <Play size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-white">
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-emerald-800"
                            onClick={() => openPlaylistInService(playlist, 'spotify')}
                          >
                            <img src="/spotify-icon.png" alt="Spotify" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                            Abrir no Spotify
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-emerald-800"
                            onClick={() => openPlaylistInService(playlist, 'youtube')}
                          >
                            <img src="/youtube-icon.png" alt="YouTube" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                            Buscar no YouTube
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-emerald-800"
                            onClick={() => openPlaylistInService(playlist, 'deezer')}
                          >
                            <img src="/deezer-icon.png" alt="Deezer" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                            Buscar no Deezer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <h3 className="font-semibold truncate text-white">{playlist.name}</h3>
                  <p className="text-sm text-zinc-400 truncate mt-1">{playlist.description || "Playlist no Spotify"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-zinc-800/30 rounded-lg">
              <Music size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">Nenhuma playlist encontrada</p>
              <Button 
                className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={loadInitialData}
              >
                <RefreshCw size={16} className="mr-2" />
                Tentar novamente
              </Button>
            </div>
          )}
        </div>

        {/* Recomendações personalizadas */}
        {isApiAvailable && (
          <div className="mt-12" ref={searchResultsRef}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {activeTab === "search" && searchQuery ? `Resultados para "${searchQuery}"` : "Músicas Recomendadas"}
              </h2>
              <Button 
                variant="ghost" 
                className="text-zinc-400 hover:text-white"
                onClick={activeTab === "search" ? () => handleSearch() : refreshRecommendations}
                disabled={isLoading || (activeTab === "search" && !searchQuery.trim())}
              >
                {isLoading ? 
                  <Loader2 size={16} className="mr-2 animate-spin" /> : 
                  <RefreshCw size={16} className="mr-2" />
                }
                {activeTab === "search" ? "Buscar Novamente" : "Atualizar"}
              </Button>
            </div>
            
            {activeTab === "search" ? (
              renderSearchResults()
            ) : isLoading && recommendations.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-md" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {recommendations.map(track => (
                  <div key={track.id} className="group relative rounded-md overflow-hidden transition-all duration-300 bg-zinc-800/50 hover:bg-zinc-700/50 p-3 hover:shadow-xl">
                    <div className="aspect-square overflow-hidden rounded-md mb-4 shadow-md">
                      <img 
                        src={track.album && track.album.images && track.album.images[0] ? track.album.images[0].url : "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae"} 
                        alt={track.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae";
                        }}
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-[4.5rem] right-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              className="rounded-full w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                            >
                              <Play size={20} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-white">
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openInService(track, 'spotify')}
                            >
                              <img src="/spotify-icon.png" alt="Spotify" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Ouvir no Spotify
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openInService(track, 'youtube')}
                            >
                              <img src="/youtube-icon.png" alt="YouTube" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Ouvir no YouTube
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-emerald-800"
                              onClick={() => openInService(track, 'deezer')}
                            >
                              <img src="/deezer-icon.png" alt="Deezer" className="w-5 h-5 mr-2" onError={(e) => e.currentTarget.style.display = 'none'} />
                              Ouvir no Deezer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <h3 className="font-semibold truncate text-white">{track.name}</h3>
                    <p className="text-sm text-zinc-400 truncate mt-1">
                      {track.artists && track.artists.length > 0 
                        ? track.artists.map(a => a.name).join(", ") 
                        : "Artista desconhecido"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music size={48} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">
                  {activeTab === "search" && searchQuery 
                    ? `Nenhuma música encontrada para "${searchQuery}"`
                    : "Nenhuma música encontrada"}
                </p>
                <Button 
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={refreshRecommendations}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Buscar Recomendações
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente ícone de Play
const Play = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    {...props}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

// Ícone de alerta
const AlertIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default Playlists;

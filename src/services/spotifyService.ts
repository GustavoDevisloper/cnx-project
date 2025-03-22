// Constants
const CLIENT_ID = "0ca611c8a6194de6a0fdd3c676fc6c11"; // Seu Client ID do Spotify
const REDIRECT_URI = window.location.origin + "/callback";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-library-read",
  "user-library-modify",
  "playlist-read-private",
  "user-top-read" // Necessário para acessar os dados de preferências do usuário
];

// Types
export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
  is_saved?: boolean;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  external_urls: {
    spotify: string;
  };
}

// Authentication functions
export const getAuthUrl = (): string => {
  const state = generateRandomString(16);
  localStorage.setItem("spotify_auth_state", state);
  
  // Implementação simplificada para demo
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "token",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    state: state,
    show_dialog: "true" // Força o diálogo de login mesmo se já estiver logado
  });
  
  return `${AUTH_ENDPOINT}?${params.toString()}`;
};

export const handleRedirect = (): boolean => {
  // Simulação para demo
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  
  if (accessToken) {
    // Salvar token
    const expiresIn = hashParams.get("expires_in") || "3600";
    const expiryTime = Date.now() + parseInt(expiresIn) * 1000;
    
    localStorage.setItem("spotify_access_token", accessToken);
    localStorage.setItem("spotify_token_expiry", expiryTime.toString());
    
    return true;
  }
  
  // Para modo demo, também aceita autenticação simulada
  if (localStorage.getItem("spotify_fake_auth") === "true") {
    return true;
  }
  
  return false;
};

export const getAccessToken = (): string | null => {
  // Versão de demonstração - sempre retorna um token simulado
  if (localStorage.getItem("spotify_fake_auth") === "true") {
    return "demo_token";
  }
  
  const token = localStorage.getItem("spotify_access_token");
  const expiry = localStorage.getItem("spotify_token_expiry");
  
  if (!token || !expiry) {
    return null;
  }
  
  if (parseInt(expiry) < Date.now()) {
    logout();
    return null;
  }
  
  return token;
};

export const isAuthenticated = (): boolean => {
  // Para demo
  if (localStorage.getItem("spotify_fake_auth") === "true") {
    return true;
  }
  
  return getAccessToken() !== null;
};

export const logout = (): void => {
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_token_expiry");
  localStorage.removeItem("spotify_auth_state");
  localStorage.removeItem("spotify_user_id");
  localStorage.removeItem("spotify_user_preferences");
};

// Utility functions
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

// Funções de API - versão simplificada para demo
export const searchChristianMusic = async (query = ""): Promise<SpotifyTrack[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Não autenticado");
  
  // Se não tiver query, busca recomendações personalizadas
  if (!query) {
    return getPersonalizedChristianRecommendations();
  }
  
  // Em modo demo, filtra nossos dados simulados
  if (token === "demo_token") {
    const allTracks = getChristianGenreTracks();
    return allTracks.filter(track => 
      track.name.toLowerCase().includes(query.toLowerCase()) || 
      track.artists.some(artist => artist.name.toLowerCase().includes(query.toLowerCase()))
    );
  }
  
  // Implementação real
  try {
    // Adiciona gênero cristão à busca para filtrar resultados
    const searchQuery = `${query} genre:christian,gospel,worship`;
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&market=BR&limit=20`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error("Falha na busca");
    
    const data = await response.json();
    return data.tracks.items;
  } catch (error) {
    console.error("Erro na busca:", error);
    // Fallback para busca em dados simulados
    const allTracks = getChristianGenreTracks();
    return allTracks.filter(track => 
      track.name.toLowerCase().includes(query.toLowerCase()) || 
      track.artists.some(artist => artist.name.toLowerCase().includes(query.toLowerCase()))
    );
  }
};

export const getChristianPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  // Para modo demo, retorna dados simulados
  return samplePlaylists;
};

export const saveTrack = async (trackId: string): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) throw new Error("Não autenticado");
  
  // Em modo demo, salva em localStorage
  if (token === "demo_token") {
    const savedTracks = JSON.parse(localStorage.getItem("spotify_saved_tracks") || "[]");
    if (!savedTracks.includes(trackId)) {
      savedTracks.push(trackId);
      localStorage.setItem("spotify_saved_tracks", JSON.stringify(savedTracks));
    }
    return true;
  }
  
  // Implementação real
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error("Erro ao salvar faixa:", error);
    return false;
  }
};

export const removeTrack = async (trackId: string): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) throw new Error("Não autenticado");
  
  // Em modo demo, remove do localStorage
  if (token === "demo_token") {
    const savedTracks = JSON.parse(localStorage.getItem("spotify_saved_tracks") || "[]");
    const updatedTracks = savedTracks.filter((id: string) => id !== trackId);
    localStorage.setItem("spotify_saved_tracks", JSON.stringify(updatedTracks));
    return true;
  }
  
  // Implementação real
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error("Erro ao remover faixa:", error);
    return false;
  }
};

// Dados simulados
const sampleTracks: SpotifyTrack[] = [
  {
    id: "1",
    name: "Infinitamente Mais",
    artists: [{ id: "1", name: "Resgate" }],
    album: {
      id: "1",
      name: "Ainda Estou Aqui",
      images: [{ url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f", height: 300, width: 300 }]
    },
    external_urls: {
      spotify: "https://open.spotify.com/intl-pt/track/3WySWHsjzSf60mONbKKO0u"
    },
    uri: "spotify:track:3WySWHsjzSf60mONbKKO0u"
  },
  // Adicione mais faixas de exemplo conforme necessário
];

const samplePlaylists: SpotifyPlaylist[] = [
  {
    id: "1",
    name: "Louvor e Adoração",
    description: "As melhores músicas cristãs para adoração",
    images: [{ url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f", height: 300, width: 300 }],
    external_urls: {
      spotify: "https://open.spotify.com/playlist/37i9dQZF1DX8fCxEu4d6e4"
    }
  }
  // Adicione mais playlists conforme necessário
];

// ===== NOVAS FUNÇÕES DE RECOMENDAÇÃO PERSONALIZADA =====

// Obtém as músicas mais ouvidas pelo usuário
export const getUserTopTracks = async (): Promise<SpotifyTrack[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Não autenticado");
  
  // Em modo demo, retorna dados simulados
  if (token === "demo_token") {
    return generateRandomTopTracks();
  }
  
  // Implementação real
  try {
    const response = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error("Falha ao obter músicas favoritas");
    
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error("Erro ao buscar músicas favoritas:", error);
    return generateRandomTopTracks(); // Fallback para dados simulados
  }
};

// Obtém os artistas favoritos do usuário
export const getUserTopArtists = async (): Promise<SpotifyArtist[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Não autenticado");
  
  // Em modo demo, retorna dados simulados
  if (token === "demo_token") {
    return generateRandomTopArtists();
  }
  
  // Implementação real
  try {
    const response = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error("Falha ao obter artistas favoritos");
    
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error("Erro ao buscar artistas favoritos:", error);
    return generateRandomTopArtists(); // Fallback para dados simulados
  }
};

// Gera recomendações de músicas cristãs com base nas preferências do usuário
export const getPersonalizedChristianRecommendations = async (): Promise<SpotifyTrack[]> => {
  try {
    // Busca as preferências do usuário (artistas e músicas favoritas)
    const [topTracks, topArtists] = await Promise.all([
      getUserTopTracks(),
      getUserTopArtists()
    ]);
    
    // Salva as preferências no localStorage para uso posterior
    localStorage.setItem("spotify_user_preferences", JSON.stringify({
      topTracks: topTracks.slice(0, 5).map(t => ({ id: t.id, name: t.name })),
      topArtists: topArtists.slice(0, 3).map(a => ({ id: a.id, name: a.name }))
    }));
    
    // Em modo demo ou quando não temos preferências suficientes, 
    // retornamos recomendações baseadas em gênero
    if (getAccessToken() === "demo_token" || topTracks.length === 0) {
      return getRecommendationsByGenre();
    }
    
    // Para implementação real, usaríamos a API de recomendações do Spotify
    // com os IDs de artistas e músicas favoritas como seeds
    // e filtrando por gêneros cristãos
    
    // Como estamos em modo demo, vamos personalizar nossas recomendações simuladas
    return getPersonalizedDemoTracks(topTracks, topArtists);
    
  } catch (error) {
    console.error("Erro ao gerar recomendações personalizadas:", error);
    // Fallback para recomendações por gênero
    return getRecommendationsByGenre();
  }
};

// Busca recomendações baseadas em gênero musical cristão
export const getRecommendationsByGenre = async (): Promise<SpotifyTrack[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Não autenticado");
  
  // Em modo demo, retornamos dados simulados
  if (token === "demo_token") {
    return getChristianGenreTracks();
  }
  
  // Implementação real usaria a API de recomendações do Spotify
  // com gêneros cristãos como seeds
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/recommendations?seed_genres=christian,gospel,worship&limit=20", 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) throw new Error("Falha ao obter recomendações");
    
    const data = await response.json();
    return data.tracks;
  } catch (error) {
    console.error("Erro ao buscar recomendações por gênero:", error);
    return getChristianGenreTracks(); // Fallback para dados simulados
  }
};

// ===== FUNÇÕES PARA GERAR DADOS DEMO =====

// Gera músicas favoritas aleatórias para demo
function generateRandomTopTracks(): SpotifyTrack[] {
  // Lista de gêneros variados (não apenas cristãos)
  const genres = ["pop", "rock", "indie", "eletronic", "rap", "r&b", "folk"];
  const tracks = [];
  
  // Gerar 10 músicas aleatórias de diferentes gêneros
  for (let i = 0; i < 10; i++) {
    const genre = genres[Math.floor(Math.random() * genres.length)];
    tracks.push(createDemoTrack(`Top Track ${i+1}`, `Artist ${i+1}`, genre));
  }
  
  return tracks;
}

// Gera artistas favoritos aleatórios para demo
function generateRandomTopArtists(): SpotifyArtist[] {
  const artists = [];
  
  for (let i = 0; i < 5; i++) {
    artists.push({
      id: `artist-${i+1}`,
      name: `Top Artist ${i+1}`
    });
  }
  
  return artists;
}

// Cria uma faixa demo baseada em parâmetros
function createDemoTrack(name: string, artistName: string, genre: string = "christian"): SpotifyTrack {
  const id = `track-${name.toLowerCase().replace(/\s+/g, '-')}`;
  
  return {
    id,
    name,
    artists: [{ id: `artist-${artistName.toLowerCase().replace(/\s+/g, '-')}`, name: artistName }],
    album: {
      id: `album-${id}`,
      name: `Album: ${name}`,
      images: [{ 
        url: `https://source.unsplash.com/random/300x300?${genre},music`, 
        height: 300, 
        width: 300 
      }]
    },
    external_urls: {
      spotify: `https://open.spotify.com/track/${id}`
    },
    uri: `spotify:track:${id}`
  };
}

// Retorna faixas cristãs baseadas no perfil do usuário (para demo)
function getPersonalizedDemoTracks(userTracks: SpotifyTrack[], userArtists: SpotifyArtist[]): SpotifyTrack[] {
  // Determinar preferência por ritmo/estilo baseado nas músicas favoritas
  let predominantStyle = "worship"; // padrão
  
  // Lógica simplificada para determinar estilo preferido
  const preferenceMap: Record<string, number> = {
    "rock": 0,
    "pop": 0,
    "rap": 0,
    "worship": 0,
    "gospel": 0
  };
  
  // Na demo, olhamos para os nomes das músicas e artistas para "adivinhar" preferências
  // Em prod usaríamos features de áudio da API do Spotify (danceability, energy, etc)
  [...userTracks, ...userArtists].forEach(item => {
    const name = 'name' in item ? item.name.toLowerCase() : '';
    
    if (name.includes('rock') || name.includes('metal') || name.includes('band')) {
      preferenceMap.rock += 2;
    } else if (name.includes('pop') || name.includes('love') || name.includes('hit')) {
      preferenceMap.pop += 2;
    } else if (name.includes('rap') || name.includes('hip') || name.includes('trap')) {
      preferenceMap.rap += 2;
    } else if (name.includes('worship') || name.includes('praise')) {
      preferenceMap.worship += 2;
    } else if (name.includes('gospel') || name.includes('choir')) {
      preferenceMap.gospel += 2;
    }
    
    // Incremento aleatório para variedade
    Object.keys(preferenceMap).forEach(key => {
      preferenceMap[key] += Math.random();
    });
  });
  
  // Encontrar estilo predominante
  predominantStyle = Object.entries(preferenceMap)
    .sort((a, b) => b[1] - a[1])[0][0]; 
  
  // Baseado no estilo predominante, retornar músicas cristãs similares
  const recommendations: SpotifyTrack[] = [];
  
  switch (predominantStyle) {
    case "rock":
      recommendations.push(
        createDemoTrack("Dependente", "Resgate", "rock"),
        createDemoTrack("Deus Não Está Morto", "Pregador Luo", "rock"),
        createDemoTrack("Lugar Secreto (Rock Version)", "Oficina G3", "rock"),
        createDemoTrack("Águas Purificadoras", "Palavrantiga", "rock"),
        createDemoTrack("Em Teus Braços", "Diante do Trono", "worship-rock")
      );
      break;
      
    case "pop":
      recommendations.push(
        createDemoTrack("Ousado Amor", "Isaías Saad", "pop"),
        createDemoTrack("Lugar Secreto", "Gabriela Rocha", "pop"),
        createDemoTrack("Maravilhosa Graça", "Coral Kemuel", "pop"),
        createDemoTrack("Oceanos", "Hillsong United", "pop-worship"),
        createDemoTrack("Good Grace", "Hillsong UNITED", "pop-worship")
      );
      break;
      
    case "rap":
      recommendations.push(
        createDemoTrack("A Volta", "DJ PV feat. Projota", "rap"),
        createDemoTrack("Vencedor", "Pregador Luo", "rap"),
        createDemoTrack("Deus Não Tá Morto", "Brô MC's", "rap"),
        createDemoTrack("Eu Sou Livre", "Ao Cubo", "rap"),
        createDemoTrack("Bênçãos Que Nunca Param", "Kivitz", "rap")
      );
      break;
      
    case "worship":
      recommendations.push(
        createDemoTrack("Ruja o Leão", "Ministério Zoe", "worship"),
        createDemoTrack("Nada Além do Sangue", "Fernandinho", "worship"),
        createDemoTrack("Rendido Estou", "Ministério Morada", "worship"),
        createDemoTrack("Rei Meu", "Diante do Trono", "worship"),
        createDemoTrack("Em Espírito e Em Verdade", "Ministério Zoe", "worship")
      );
      break;
      
    case "gospel":
      recommendations.push(
        createDemoTrack("Deus é Deus", "Delino Marçal", "gospel"),
        createDemoTrack("Tua Graça Me Basta", "Toque no Altar", "gospel"),
        createDemoTrack("Essência", "Thalles Roberto", "gospel"),
        createDemoTrack("Raridade", "Anderson Freire", "gospel"),
        createDemoTrack("Nunca Pare de Lutar", "Bruna Karla", "gospel")
      );
      break;
      
    default:
      recommendations.push(
        createDemoTrack("Infinitamente Mais", "Resgate", "christian-rock"),
        createDemoTrack("Tua Graça Me Basta", "Toque no Altar", "christian-worship"),
        createDemoTrack("Nada Além do Sangue", "Fernandinho", "christian-worship"),
        createDemoTrack("Deus Não Está Morto", "Pregador Luo", "christian-rap"),
        createDemoTrack("Ousado Amor", "Isaías Saad", "christian-pop")
      );
  }
  
  // Adicionar algumas recomendações variadas para complementar
  return [
    ...recommendations,
    ...getChristianGenreTracks().slice(0, 10)
  ];
}

// Lista padrão de músicas cristãs por gênero
function getChristianGenreTracks(): SpotifyTrack[] {
  return [
    createDemoTrack("Infinitamente Mais", "Resgate", "christian-rock"),
    createDemoTrack("Tua Graça Me Basta", "Toque no Altar", "christian-worship"),
    createDemoTrack("Nada Além do Sangue", "Fernandinho", "christian-worship"),
    createDemoTrack("Deus Não Está Morto", "Pregador Luo", "christian-rap"),
    createDemoTrack("Ousado Amor", "Isaías Saad", "christian-pop"),
    createDemoTrack("Filho do Céu", "Eli Soares", "christian-pop"),
    createDemoTrack("Lugar Secreto", "Gabriela Rocha", "christian-worship"),
    createDemoTrack("A Resposta", "Oficina G3", "christian-rock"),
    createDemoTrack("Rendido Estou", "Aline Barros", "christian-worship"),
    createDemoTrack("Quão Grande é o Meu Deus", "André Valadão", "christian-worship"),
    createDemoTrack("Raridade", "Anderson Freire", "christian-pop"),
    createDemoTrack("Eu Navegarei", "Thalles Roberto", "christian-pop"),
    createDemoTrack("Jesus é o Centro", "Israel Subirá", "christian-worship"),
    createDemoTrack("Oceanos", "Hillsong United", "christian-worship"),
    createDemoTrack("Até Que o Sol Se Apague", "Juliano Son", "christian-worship"),
    createDemoTrack("Mesmo Sem Entender", "Ministério Zoe", "christian-worship"),
    createDemoTrack("Abba", "Ministério Morada", "christian-worship"),
    createDemoTrack("Deus Não Está Morto", "Bruna Karla", "christian-pop"),
    createDemoTrack("Ressuscita-me", "Aline Barros", "christian-pop"),
    createDemoTrack("O Nome De Jesus", "Toque no Altar", "christian-worship")
  ];
} 
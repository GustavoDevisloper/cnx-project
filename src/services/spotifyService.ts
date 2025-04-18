// Constants
const CLIENT_ID = "0ca611c8a6194de6a0fdd3c676fc6c11"; // Seu Client ID do Spotify
const CLIENT_SECRET = "a9bceaf73f8244a5a46f907aa499e3bf"; // Você precisará adicionar seu Client Secret
const AUTH_ENDPOINT = "https://accounts.spotify.com/api/token";
const API_BASE_URL = "https://api.spotify.com/v1";

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

// Função para obter token de acesso usando Client Credentials Flow
// Isso permite acesso à API sem requerer login do usuário
const getClientCredentialsToken = async (): Promise<string | null> => {
  try {
    // Verificar se temos um token em cache e se ainda é válido
    const cachedToken = localStorage.getItem('spotify_client_token');
    const tokenExpiry = localStorage.getItem('spotify_client_token_expiry');
    
    if (cachedToken && tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
      return cachedToken;
    }
    
    // Obter novo token
    const response = await fetch(AUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
      throw new Error('Falha ao obter token de acesso');
    }
    
    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in;
    
    // Salvar token em cache
    localStorage.setItem('spotify_client_token', accessToken);
    localStorage.setItem('spotify_client_token_expiry', (Date.now() + (expiresIn * 1000)).toString());
    
    return accessToken;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
};

// API Functions

/**
 * Obtém playlists cristãs/gospel em destaque
 */
export const getChristianPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  try {
    const token = await getClientCredentialsToken();
    if (!token) throw new Error('Sem token de acesso');
    
    // Buscar playlists de música cristã/gospel
    const response = await fetch(`${API_BASE_URL}/search?q=christian%20gospel%20worship&type=playlist&market=BR&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Falha ao buscar playlists');
    
    const data = await response.json();
    return data.playlists.items;
  } catch (error) {
    console.error('Erro ao buscar playlists cristãs:', error);
    return [];
  }
};

/**
 * Busca músicas cristãs com base em uma consulta
 */
export const searchChristianMusic = async (query = ""): Promise<SpotifyTrack[]> => {
  try {
    const token = await getClientCredentialsToken();
    if (!token) throw new Error('Sem token de acesso');
    
    // Se não houver query, retornar recomendações gerais
    if (!query) {
      return getChristianRecommendations();
    }
    
    // Adicionar termos de busca para focar em música cristã
    const searchQuery = `${query} genre:christian,gospel,worship`;
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&type=track&market=BR&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Falha na busca');
    
    const data = await response.json();
    return data.tracks.items;
  } catch (error) {
    console.error('Erro na busca de músicas:', error);
    return [];
  }
};

/**
 * Obtém recomendações de músicas cristãs
 */
export const getChristianRecommendations = async (): Promise<SpotifyTrack[]> => {
  try {
    const token = await getClientCredentialsToken();
    if (!token) throw new Error('Sem token de acesso');
    
    // Primeiro, vamos obter alguns artistas cristãos populares para usar como sementes
    const artistSearch = await fetch(`${API_BASE_URL}/search?q=artist:hillsong%20OR%20artist:lauren%20daigle%20OR%20artist:elevation%20worship%20OR%20artist:bethel%20music&type=artist&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!artistSearch.ok) throw new Error('Falha ao buscar artistas');
    
    const artistData = await artistSearch.json();
    const artistIds = artistData.artists.items.slice(0, 2).map((artist: any) => artist.id);
    
    // Usamos os IDs dos artistas como sementes para recomendações
    const seedArtists = artistIds.join(',');
    
    // Obter recomendações com base nesses artistas
    const response = await fetch(`${API_BASE_URL}/recommendations?seed_artists=${seedArtists}&seed_genres=christian,gospel,worship&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Falha ao obter recomendações');
    
    const data = await response.json();
    return data.tracks;
  } catch (error) {
    console.error('Erro ao obter recomendações:', error);
    return [];
  }
};

/**
 * Verifica se a API está acessível 
 */
export const isApiAvailable = async (): Promise<boolean> => {
  try {
    const token = await getClientCredentialsToken();
    return !!token; // Retorna true se conseguirmos obter um token
  } catch (error) {
    console.error('API do Spotify não está disponível:', error);
    return false;
  }
};

// Mantém a interface da API existente
export const getPersonalizedChristianRecommendations = getChristianRecommendations;

// Simplifica a verificação de autenticação
export const isAuthenticated = async (): Promise<boolean> => {
  return await isApiAvailable();
};

// Exports para compatibilidade com código existente
export const getAuthUrl = (): string => '';
export const handleRedirect = (): boolean => true;
export const getAccessToken = getClientCredentialsToken;
export const logout = (): void => {
  localStorage.removeItem('spotify_client_token');
  localStorage.removeItem('spotify_client_token_expiry');
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
export const getUserTopTracks = async (): Promise<SpotifyTrack[]> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error("Não autenticado");
    
    // Em modo demo, retorna dados simulados
    if (token === "demo_token") {
      return generateRandomTopTracks();
    }
    
    // Implementação real
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

export const getUserTopArtists = async (): Promise<SpotifyArtist[]> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error("Não autenticado");
    
    // Em modo demo, retorna dados simulados
    if (token === "demo_token") {
      return generateRandomTopArtists();
    }
    
    // Implementação real
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
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
    
    // Primeiro, realizar uma busca direta com o termo exato
    const directSearchQuery = encodeURIComponent(query);
    const directResponse = await fetch(`${API_BASE_URL}/search?q=${directSearchQuery}&type=track&market=BR&limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!directResponse.ok) {
      console.log(`Busca direta falhou (status ${directResponse.status}), tentando busca alternativa...`);
      return fallbackSearch(token, query);
    }
    
    const directData = await directResponse.json();
    
    // Se a busca direta retornou poucos resultados (menos de 5), tente uma busca mais ampla
    if (!directData.tracks || !directData.tracks.items || directData.tracks.items.length < 5) {
      console.log('Poucos resultados na busca direta, expandindo para busca mais ampla...');
      
      // Tentar uma busca mais ampla com o termo, mesclando resultados
      const tracks = directData.tracks?.items || [];
      const expandedTracks = await fallbackSearch(token, query);
      
      // Combinar resultados removendo duplicações por ID
      const mergedTracks = [...tracks];
      expandedTracks.forEach(expandedTrack => {
        if (!mergedTracks.some(track => track.id === expandedTrack.id)) {
          mergedTracks.push(expandedTrack);
        }
      });
      
      return mergedTracks;
    }
    
    return directData.tracks.items;
  } catch (error) {
    console.error('Erro na busca de músicas:', error);
    return [];
  }
};

// Função auxiliar para realizar buscas alternativas
async function fallbackSearch(token: string, query: string): Promise<SpotifyTrack[]> {
  try {
    // Criar variações da busca para encontrar mais resultados
    const searchQueries = [
      // Busca com filtro de gênero
      `${query} genre:christian,gospel,worship`,
      // Busca com artistas populares (adicionar o termo de busca como complemento)
      `artist:fernandinho ${query}`,
      `artist:gabriela rocha ${query}`,
      `artist:aline barros ${query}`,
      `artist:hillsong ${query}`,
      // Busca mais ampla combinando o termo com "gospel" e "cristã"
      `${query} música gospel`,
      `${query} música cristã`,
      `${query} worship`
    ];
    
    const allTracks: SpotifyTrack[] = [];
    const trackIds = new Set<string>(); // Para evitar duplicatas
    
    // Realizar buscas em paralelo (mais rápido)
    const searchPromises = searchQueries.map(async searchQuery => {
      try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&type=track&market=BR&limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
            // Adicionar apenas tracks que ainda não estão na lista
            data.tracks.items.forEach((track: SpotifyTrack) => {
              if (!trackIds.has(track.id)) {
                trackIds.add(track.id);
                allTracks.push(track);
              }
            });
          }
        }
      } catch (error) {
        console.warn(`Erro em busca alternativa com query '${searchQuery}':`, error);
      }
    });
    
    // Aguardar todas as buscas completarem
    await Promise.allSettled(searchPromises);
    
    // Se não encontrou nada, tentar uma última busca mais genérica
    if (allTracks.length === 0) {
      const lastResortResponse = await fetch(`${API_BASE_URL}/search?q=christian+music&type=track&market=BR&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (lastResortResponse.ok) {
        const data = await lastResortResponse.json();
        if (data.tracks && data.tracks.items) {
          return data.tracks.items;
        }
      }
    }
    
    return allTracks;
  } catch (error) {
    console.error('Erro na busca alternativa:', error);
    return [];
  }
}

/**
 * Obtém recomendações de músicas cristãs
 */
export const getChristianRecommendations = async (): Promise<SpotifyTrack[]> => {
  try {
    const token = await getClientCredentialsToken();
    if (!token) throw new Error('Sem token de acesso');
    
    // Primeiro, vamos tentar artistas específicos mais populares
    // Incluindo artistas brasileiros
    const artistSearch = await fetch(
      `${API_BASE_URL}/search?q=artist:hillsong%20OR%20artist:fernandinho%20OR%20artist:gabriela%20rocha%20OR%20artist:aline%20barros%20OR%20artist:toque%20no%20altar%20OR%20artist:diante%20do%20trono%20OR%20artist:elevation%20worship%20OR%20artist:bethel%20music%20OR%20artist:lauren%20daigle&type=artist&limit=10&market=BR`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!artistSearch.ok) {
      console.log('Falha na busca de artistas, usando fallback direto...');
      return await getChristianTracksFallback(token);
    }
    
    const artistData = await artistSearch.json();
    
    // Verificar se encontramos artistas
    if (!artistData.artists || !artistData.artists.items || artistData.artists.items.length === 0) {
      console.log('Nenhum artista encontrado, usando fallback direto...');
      return await getChristianTracksFallback(token);
    }
    
    // Obter até 5 IDs de artistas (API recomendações aceita no máximo 5 seeds)
    const artistIds = artistData.artists.items
      .slice(0, 5)
      .map((artist: any) => artist.id)
      .filter(Boolean);
    
    // Verificar se temos artistas para usar como seed
    if (!artistIds || artistIds.length === 0) {
      console.log('Lista de IDs de artistas vazia, usando fallback...');
      return await getChristianTracksFallback(token);
    }
    
    // Log para debug
    console.log(`Usando ${artistIds.length} artistas como seed: ${artistIds.join(',')}`);
    
    // Usamos os IDs dos artistas como sementes para recomendações
    const seedArtists = artistIds.join(',');
    
    // Obter recomendações com base nesses artistas
    const response = await fetch(`${API_BASE_URL}/recommendations?seed_artists=${seedArtists}&limit=20&market=BR`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.log(`Recomendações falharam (status ${response.status}), usando fallback...`);
      return await getChristianTracksFallback(token);
    }
    
    const data = await response.json();
    
    // Verificar se recebemos tracks
    if (!data.tracks || data.tracks.length === 0) {
      console.log('Nenhuma track nas recomendações, usando fallback...');
      return await getChristianTracksFallback(token);
    }
    
    return data.tracks;
  } catch (error) {
    console.error('Erro ao obter recomendações:', error);
    
    // Fallback para situações onde toda a API falha
    return getFallbackChristianTracks();
  }
};

// Função de fallback para obter tracks cristãs diretamente via busca
async function getChristianTracksFallback(token: string): Promise<SpotifyTrack[]> {
  try {
    // Tentar várias estratégias de busca em ordem de preferência
    const searchQueries = [
      'genre:christian,gospel,worship',
      'Fernandinho música gospel',
      'Aline Barros adoração',
      'Gabriela Rocha lugar secreto',
      'Hillsong United',
      'Toque no Altar',
      'Diante do Trono',
      'Ministério Zoe',
      'Isaías Saad',
      'Anderson Freire',
      'Elevation Worship'
    ];
    
    for (const query of searchQueries) {
      try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=track&limit=20&market=BR`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
            console.log(`Fallback bem-sucedido usando query: ${query}`);
            return data.tracks.items;
          }
        }
      } catch (innerError) {
        console.error(`Erro na busca fallback usando query '${query}':`, innerError);
        // Continuar para a próxima query
        continue;
      }
    }
    
    console.log('Todas as estratégias de fallback falharam, usando dados estáticos');
    return getFallbackChristianTracks();
  } catch (error) {
    console.error('Erro no método de fallback:', error);
    return getFallbackChristianTracks();
  }
}

// Tracks estáticos para quando todas as opções de API falham
const getFallbackChristianTracks = (): SpotifyTrack[] => {
  return [
    {
      id: 'track-1',
      name: 'Lugar Secreto',
      artists: [{ id: 'gabriela-rocha', name: 'Gabriela Rocha' }],
      album: {
        id: 'album-lugar-secreto',
        name: 'Lugar Secreto',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2733bea502f8c15fd3248795738', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/1D7ySizlD2QdQPfXNH9jT9' },
      uri: 'spotify:track:1D7ySizlD2QdQPfXNH9jT9'
    },
    {
      id: 'track-2',
      name: 'Nada Além do Sangue',
      artists: [{ id: 'fernandinho', name: 'Fernandinho' }],
      album: {
        id: 'album-fernandinho',
        name: 'Uma Nova História',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2732ca3402f064d0c6b4c477d0a', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/4MxhbvUf09JUQmOOQ2pNvt' },
      uri: 'spotify:track:4MxhbvUf09JUQmOOQ2pNvt'
    },
    {
      id: 'track-3',
      name: 'Deus é Deus',
      artists: [{ id: 'delino-marcal', name: 'Delino Marçal' }],
      album: {
        id: 'album-deus-e-deus',
        name: 'Guarda Meu Coração',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273d91a89e8328fb927a9a876f6', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/4bCzTrFL2CxUaXXTVHCuF6' },
      uri: 'spotify:track:4bCzTrFL2CxUaXXTVHCuF6'
    },
    {
      id: 'track-4',
      name: 'Ousado Amor',
      artists: [{ id: 'isaias-saad', name: 'Isaías Saad' }],
      album: {
        id: 'album-ousado-amor',
        name: 'Ousado Amor',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273bbb85e431401da82c5b5d13e', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/3pBRBXSPbPPNZgpwMiqPYt' },
      uri: 'spotify:track:3pBRBXSPbPPNZgpwMiqPYt'
    },
    {
      id: 'track-5',
      name: 'Oceanos (Onde Meus Pés Podem Falhar)',
      artists: [{ id: 'hillsong', name: 'Hillsong United' }],
      album: {
        id: 'album-oceans',
        name: 'Zion',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2738ad8f5243d6eae886ee59d04', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/2shHvLHokjAHXUKfSQKrVH' },
      uri: 'spotify:track:2shHvLHokjAHXUKfSQKrVH'
    },
    {
      id: 'track-6',
      name: 'Tua Graça Me Basta',
      artists: [{ id: 'toque-no-altar', name: 'Toque no Altar' }],
      album: {
        id: 'album-tua-graca',
        name: 'Tua Graça Me Basta',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273d456536bfff3a4c3f5352025', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/4UlmZCjrD5NjNjJwDPzshU' },
      uri: 'spotify:track:4UlmZCjrD5NjNjJwDPzshU'
    },
    {
      id: 'track-7',
      name: 'Raridade',
      artists: [{ id: 'anderson-freire', name: 'Anderson Freire' }],
      album: {
        id: 'album-raridade',
        name: 'Raridade',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2735c124fc99daf176bac485603', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/65AkBU5Ss13QWQbk1jCU1l' },
      uri: 'spotify:track:65AkBU5Ss13QWQbk1jCU1l'
    },
    {
      id: 'track-8',
      name: 'Todavia Me Alegrarei',
      artists: [{ id: 'diante-do-trono', name: 'Diante do Trono' }],
      album: {
        id: 'album-alegrarei',
        name: 'Alegria',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2739157fd8624f7e149e0e2629b', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/5jFVh4kf84qMOyhJtlPGUO' },
      uri: 'spotify:track:5jFVh4kf84qMOyhJtlPGUO'
    }
  ];
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

/**
 * Obtém detalhes de um artista específico
 */
export const getArtistDetails = async (artistId: string): Promise<any> => {
  try {
    const token = await getClientCredentialsToken();
    if (!token) throw new Error('Sem token de acesso');
    
    const response = await fetch(`${API_BASE_URL}/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Falha ao obter detalhes do artista');
    
    const artistData = await response.json();
    
    // Buscar as 10 músicas mais populares do artista
    const topTracksResponse = await fetch(`${API_BASE_URL}/artists/${artistId}/top-tracks?market=BR`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    let topTracks = [];
    if (topTracksResponse.ok) {
      const topTracksData = await topTracksResponse.json();
      topTracks = topTracksData.tracks || [];
    }
    
    // Retornar os dados combinados
    return {
      ...artistData,
      topTracks
    };
  } catch (error) {
    console.error('Erro ao obter detalhes do artista:', error);
    return null;
  }
};

/**
 * Busca artistas baseado em uma consulta
 */
export const searchArtists = async (query = ""): Promise<any[]> => {
  try {
    const token = await getClientCredentialsToken();
    if (!token) throw new Error('Sem token de acesso');
    
    if (!query) return [];
    
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=artist&market=BR&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Falha na busca de artistas');
    
    const data = await response.json();
    return data.artists?.items || [];
  } catch (error) {
    console.error('Erro na busca de artistas:', error);
    return [];
  }
};

/**
 * Busca playlists baseado em uma consulta
 */
export const searchPlaylists = async (query = ""): Promise<SpotifyPlaylist[]> => {
  try {
    const token = await getClientCredentialsToken();
    if (!token) throw new Error('Sem token de acesso');
    
    if (!query) return getChristianPlaylists();
    
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=playlist&market=BR&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Falha na busca de playlists');
    
    const data = await response.json();
    return data.playlists?.items || [];
  } catch (error) {
    console.error('Erro na busca de playlists:', error);
    return [];
  }
};

/**
 * Obtém detalhes de uma música (incluindo áudio features)
 */
export const getTrackDetails = async (trackId: string): Promise<any> => {
  try {
    const token = await getClientCredentialsToken();
    if (!token) throw new Error('Sem token de acesso');
    
    // Buscar detalhes básicos da música
    const trackResponse = await fetch(`${API_BASE_URL}/tracks/${trackId}?market=BR`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!trackResponse.ok) throw new Error('Falha ao obter detalhes da música');
    
    const trackData = await trackResponse.json();
    
    // Buscar características de áudio da música
    try {
      const featuresResponse = await fetch(`${API_BASE_URL}/audio-features/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json();
        return {
          ...trackData,
          audioFeatures: featuresData
        };
      }
    } catch (error) {
      console.warn('Erro ao obter características de áudio:', error);
    }
    
    return trackData;
  } catch (error) {
    console.error('Erro ao obter detalhes da música:', error);
    return null;
  }
}; 
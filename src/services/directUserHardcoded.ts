import { FollowableUser } from './followService';

/**
 * Dados mocados para garantir que algo apareça na interface
 * quando todas as outras abordagens falharem
 */
export const hardcodedUsers: FollowableUser[] = [
  {
    id: '1',
    username: 'admin',
    display_name: 'Administrador',
    avatar_url: null,
    followers_count: 10,
    is_followed: false
  },
  {
    id: '2',
    username: 'usuario1',
    display_name: 'Usuário Exemplo 1',
    avatar_url: null,
    followers_count: 5,
    is_followed: false
  },
  {
    id: '3',
    username: 'usuario2',
    display_name: 'Usuário Exemplo 2',
    avatar_url: null,
    followers_count: 3,
    is_followed: false
  },
  {
    id: '4',
    username: 'usuario3',
    display_name: 'Usuário Exemplo 3',
    avatar_url: null,
    followers_count: 2,
    is_followed: false
  },
  {
    id: '5',
    username: 'usuario4',
    display_name: 'Usuário Exemplo 4',
    avatar_url: null,
    followers_count: 1,
    is_followed: false
  }
];

/**
 * Função que sempre retorna usuários hardcoded
 * Útil como último recurso quando todas as consultas SQL falham
 */
export function getHardcodedUsers(limit: number = 10): FollowableUser[] {
  console.log('⚠️ Usando dados mocados como último recurso!');
  return hardcodedUsers.slice(0, limit);
} 
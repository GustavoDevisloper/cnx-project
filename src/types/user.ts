export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'leader' | 'user';
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  profileViews?: number;
} 
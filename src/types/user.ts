export interface User {
  id: string;
  email: string;
  username?: string;
  role: 'admin' | 'leader' | 'user';
  real_name?: string;
  displayName?: string;
  display_name?: string;
  first_name?: string;
  bio?: string;
  avatarUrl?: string;
  avatar_url?: string;
  createdAt?: string;
  created_at?: string;
  profileViews?: number;
  profile_views?: number;
  phone?: string;
  phone_number?: string;
  lastLogin?: string;
  last_login?: string;
  loginCount?: number;
  isVerified?: boolean;
} 
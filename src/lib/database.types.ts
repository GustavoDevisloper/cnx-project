export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          display_name: string | null
          first_name: string | null
          phone_number: string | null
          bio: string | null
          avatar_url: string | null
          role: 'admin' | 'leader' | 'user'
          created_at: string
          updated_at: string
          profile_views: number | null
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          display_name?: string | null
          first_name?: string | null
          phone_number?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'leader' | 'user'
          created_at?: string
          updated_at?: string
          profile_views?: number | null
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          display_name?: string | null
          first_name?: string | null
          phone_number?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'leader' | 'user'
          created_at?: string
          updated_at?: string
          profile_views?: number | null
        }
      }
      // Definições básicas para outras tabelas poderiam ser adicionadas aqui
    }
    // Definições vazias para Views e Functions, que podem ser preenchidas se necessário
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
} 
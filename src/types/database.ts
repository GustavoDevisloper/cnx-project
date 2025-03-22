export type UserRole = 'admin' | 'leader' | 'user'

export interface User {
  id: string
  email: string
  username: string | null
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
  profileViews: number
}

export interface Question {
  id: string
  question: string
  content: string
  userId: string
  createdAt: string
  updatedAt: string
  status: 'pending' | 'answered'
  answer?: string | null
  answeredBy?: string | null
  answeredAt?: string | null
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  endDate?: string | null
  location: string
  imageUrl?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'published'
}

// Database response types (from Supabase)
export interface UserDB {
  id: string
  email: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
  profile_views: number
}

export interface QuestionDB {
  id: string
  question: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
  status: 'pending' | 'answered'
  answer?: string | null
  answered_by?: string | null
  answered_at?: string | null
}

export interface EventDB {
  id: string
  title: string
  description: string
  date: string
  end_date?: string | null
  location: string
  image_url?: string | null
  created_by: string
  created_at: string
  updated_at: string
  status: 'draft' | 'published'
}

// Type conversion functions
export function convertUserFromDB(user: UserDB): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    profileViews: user.profile_views
  }
}

export function convertQuestionFromDB(question: QuestionDB): Question {
  return {
    id: question.id,
    question: question.question,
    content: question.content,
    userId: question.user_id,
    createdAt: question.created_at,
    updatedAt: question.updated_at,
    status: question.status,
    answer: question.answer,
    answeredBy: question.answered_by,
    answeredAt: question.answered_at
  }
}

export function convertEventFromDB(event: EventDB): Event {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    endDate: event.end_date,
    location: event.location,
    imageUrl: event.image_url,
    createdBy: event.created_by,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
    status: event.status
  }
} 
import { User } from "./user";

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date?: string | null;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  created_by: string;
  created_by_name: string;
  updated_at: string;
}

export interface EventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  status: 'confirmed' | 'declined' | 'maybe';
  items?: EventItem[];
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  attendance_id: string;
  name: string;
  quantity: number;
  created_at: string;
}

export interface EventItemSummary {
  id: string;
  name: string;
  quantity: number;
  user_id: string;
  user_name: string;
  attendance_id: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  content: string;
  created_at: string;
}

export interface EventDB {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date?: string | null;
  location: string;
  status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface EventAttendanceDB {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  items?: EventItemDB[];
}

export interface EventItemDB {
  id: string;
  attendance_id: string;
  name: string;
  quantity: number;
  created_at: string;
}

export interface EventMessageDB {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

export interface EventWithAttendees extends Event {
  attendees: Attendance[];
}

export interface Attendance {
  id: string;
  userId: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
  user: User | null;
}

export function convertDBEventToEvent(eventDB: EventDB): Event {
  return {
    id: eventDB.id,
    title: eventDB.title,
    description: eventDB.description,
    date: eventDB.date,
    end_date: eventDB.end_date,
    location: eventDB.location,
    status: eventDB.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
    created_at: eventDB.created_at,
    created_by: eventDB.created_by,
    created_by_name: eventDB.user?.name || 'Usuário',
    updated_at: eventDB.updated_at,
  };
}

export function convertDBAttendanceToAttendance(attendanceDB: EventAttendanceDB): EventAttendance {
  return {
    id: attendanceDB.id,
    event_id: attendanceDB.event_id,
    user_id: attendanceDB.user_id,
    user_name: attendanceDB.user?.name || 'Usuário',
    user_avatar: attendanceDB.user?.avatar_url || null,
    status: attendanceDB.status as 'confirmed' | 'declined' | 'maybe',
    items: attendanceDB.items?.map(item => ({
      id: item.id,
      attendance_id: item.attendance_id,
      name: item.name,
      quantity: item.quantity,
      created_at: item.created_at
    })),
    created_at: attendanceDB.created_at,
    updated_at: attendanceDB.updated_at,
  };
}

export function convertDBMessageToMessage(messageDB: EventMessageDB): EventMessage {
  return {
    id: messageDB.id,
    event_id: messageDB.event_id,
    user_id: messageDB.user_id,
    user_name: messageDB.user?.name || 'Usuário',
    user_avatar: messageDB.user?.avatar_url || null,
    content: messageDB.content,
    created_at: messageDB.created_at,
  };
}

export function convertDBItemToItemSummary(itemDB: EventItemDB & { attendance?: EventAttendanceDB }): EventItemSummary {
  return {
    id: itemDB.id,
    name: itemDB.name,
    quantity: itemDB.quantity,
    user_id: itemDB.attendance?.user_id || '',
    user_name: itemDB.attendance?.user?.name || 'Usuário',
    attendance_id: itemDB.attendance_id,
  };
}

export function convertDBAttendanceToUIAttendance(dbAttendance: any): Attendance {
  return {
    id: dbAttendance.id,
    userId: dbAttendance.user_id,
    status: dbAttendance.status,
    createdAt: dbAttendance.created_at,
    user: dbAttendance.users || null
  };
}

export function convertDBMessageToUIMessage(dbMessage: any): EventMessage {
  return {
    id: dbMessage.id,
    event_id: dbMessage.event_id,
    user_id: dbMessage.user_id,
    content: dbMessage.content,
    created_at: dbMessage.created_at,
    user: dbMessage.users
  };
}

export function convertDBItemToEventItem(dbItem: any): EventItem {
  return {
    id: dbItem.id,
    attendance_id: dbItem.attendance_id,
    name: dbItem.name,
    quantity: dbItem.quantity,
    created_at: dbItem.created_at
  };
}

export interface EventFormInput {
  title: string;
  description: string;
  date: string;
  end_date?: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface EventItemFormInput {
  name: string;
  quantity: number;
}

export interface EventMessageFormInput {
  content: string;
} 